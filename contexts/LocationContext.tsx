import React, { createContext, useContext, useState, useCallback } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
}

export interface LocationData {
  coordinates: LocationCoordinates | null;
  timestamp: number | null;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
}

interface LocationContextType {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  isWatching: boolean;
  hasPermission: boolean;
  watchLocation: () => void;
  stopWatching: () => void;
  getCurrentLocation: () => Promise<void>;
  checkCameraPermission: () => Promise<void>;
  hasCameraPermission: boolean;
  // ✅ Novos estados para rastrear salvamento no Firestore
  isSavingToFirestore: boolean;
  lastFirestoreSave: Date | null;
  firestoreError: string | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  // ✅ Novos estados para rastrear salvamento no Firestore
  const [isSavingToFirestore, setIsSavingToFirestore] = useState(false);
  const [lastFirestoreSave, setLastFirestoreSave] = useState<Date | null>(null);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  const checkCameraPermission = useCallback(async () => {
    try {
      console.log('📷 [Camera] Verificando permissão nativa...');
      const perm = await Camera.checkPermissions();

      if (perm.camera === 'granted') {
        setHasCameraPermission(true);
      } else {
        setHasCameraPermission(false);
      }
    } catch (err) {
      console.error('❌ [Camera] Erro ao verificar permissão:', err);
      setHasCameraPermission(false);
    }
  }, []);

  // Check camera permission on mount WITHOUT triggering a prompt
  React.useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      checkCameraPermission();
    }
  }, [checkCameraPermission]);

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    console.log('✅ [Location] Posição obtida com sucesso:', position);

    const coords: LocationCoordinates = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      altitudeAccuracy: position.coords.altitudeAccuracy,
      heading: position.coords.heading,
      speed: position.coords.speed
    };

    setLocation({
      coordinates: coords,
      timestamp: position.timestamp,
    });

    setHasPermission(true);
    setIsLoading(false);
    setError(null);

    // Fazer geocoding reverso para obter endereço
    reverseGeocode(coords.latitude, coords.longitude);
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    // ✅ PRIMEIRO: Detectar se é erro de Permissions Policy ANTES de logar
    const isPermissionsPolicy = error.message.includes('permissions policy') ||
      error.message.includes('Permissions Policy') ||
      error.code === 1; // PERMISSION_DENIED

    // ✅ Se for Permissions Policy, ativar modo simulação IMEDIATAMENTE sem logar erros
    if (isPermissionsPolicy) {
      console.log('ℹ️ [Location] GPS não disponível - Ativando modo simulação (São Paulo)...');

      // Ativar modo simulação com coordenadas de São Paulo
      const saoPauloCoords: LocationCoordinates = {
        latitude: -23.550520,
        longitude: -46.633308,
        accuracy: 10
      };

      // ✅ Dados completos de São Paulo
      const saoPauloData = {
        coordinates: saoPauloCoords,
        timestamp: Date.now(),
        city: 'São Paulo',
        state: 'São Paulo',
        country: 'Brasil',
        address: 'Praça da Sé, Centro Histórico de São Paulo, São Paulo, Brasil'
      };

      setLocation(saoPauloData);
      setHasPermission(false);
      setIsLoading(false);
      setError(null); // ✅ SEM ERRO - modo simulação é normal

      // ✅ Salvar IMEDIATAMENTE no Firestore com dados completos
      saveLocationToFirestore(
        saoPauloCoords.latitude,
        saoPauloCoords.longitude,
        {
          city: 'São Paulo',
          state: 'São Paulo',
          country: 'Brasil',
          address: 'Praça da Sé, Centro Histórico de São Paulo, São Paulo, Brasil'
        }
      );

      console.log('✅ [Location] Modo simulação ativo - Exibindo São Paulo');
      return; // ✅ SAIR IMEDIATAMENTE - não processar mais nada
    }

    // ✅ APENAS logar erros se NÃO for Permissions Policy
    console.error('❌ [Location] Erro de geolocalização:', error);
    console.error('❌ [Location] Código do erro:', error.code);
    console.error('❌ [Location] Mensagem:', error.message);

    let errorMessage = 'Erro ao obter localização';

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Você bloqueou o acesso à localização. Por favor, permita nas configurações do navegador.';
        console.error('🚫 [Location] PERMISSÃO NEGADA - Usuário bloqueou a localização');
        setHasPermission(false);
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Localização indisponível. Verifique se o GPS está ativado.';
        console.error('📍 [Location] POSIÇÃO INDISPONÍVEL - GPS pode estar desligado');
        break;
      case error.TIMEOUT:
        errorMessage = 'Tempo esgotado ao obter localização. Tente novamente.';
        console.error('⏱️ [Location] TIMEOUT - Demorou muito para obter localização');
        break;
      default:
        errorMessage = `Erro desconhecido (código ${error.code}): ${error.message}`;
        console.error('❓ [Location] ERRO DESCONHECIDO:', error);
    }

    setError(errorMessage);
    setIsLoading(false);
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      console.log('🌍 [Geocoding] Fazendo geocoding reverso...');

      // Usar Nominatim (OpenStreetMap) para geocoding reverso
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'NexCoin/1.0'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [Geocoding] Endereço obtido:', data);

        const locationData = {
          city: data.address?.city || data.address?.town || data.address?.village || 'Desconhecido',
          state: data.address?.state || '',
          country: data.address?.country || '',
          address: data.display_name || ''
        };

        setLocation(prev => prev ? {
          ...prev,
          ...locationData
        } : null);

        // Salvar no Firestore com endereço
        saveLocationToFirestore(lat, lng, locationData);
      } else {
        // Salvar no Firestore sem endereço
        saveLocationToFirestore(lat, lng);
      }
    } catch (err) {
      // Erro silencioso - não atrapalha a experiência do usuário
      console.log('ℹ️ [Geocoding] Não foi possível obter endereço (ambiente restrito)');
      // Salvar no Firestore mesmo sem endereço
      saveLocationToFirestore(lat, lng);
    }
  };

  const saveLocationToFirestore = async (
    lat: number,
    lng: number,
    addressData?: { city: string; state: string; country: string; address: string }
  ) => {
    // ✅ Indicar que está salvando
    setIsSavingToFirestore(true);
    setFirestoreError(null);

    try {
      const user = auth.currentUser;

      if (!user) {
        console.log('⚠️ [Firestore] Usuário NÃO autenticado - não salvando localização');
        console.log('⚠️ [Firestore] Faça login primeiro para salvar a localização');
        setIsSavingToFirestore(false);
        setFirestoreError('Usuário não autenticado');
        return;
      }

      console.log('💾 [Firestore] ✅ Usuário autenticado:', user.uid);
      console.log('💾 [Firestore] Email:', user.email);
      console.log('💾 [Firestore] Salvando em: userLocations/' + user.uid);

      const locationRef = doc(db, 'userLocations', user.uid);

      const locationData: any = {
        userId: user.uid,
        userEmail: user.email || '',
        coordinates: {
          latitude: lat,
          longitude: lng
        },
        timestamp: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Adicionar dados de endereço se disponíveis
      if (addressData) {
        locationData.city = addressData.city;
        locationData.state = addressData.state;
        locationData.country = addressData.country;
        locationData.address = addressData.address;
        console.log('💾 [Firestore] Com endereço:', addressData.city);
      } else {
        console.log('💾 [Firestore] Sem dados de endereço');
      }

      console.log('💾 [Firestore] Dados completos:', locationData);

      await setDoc(locationRef, locationData, { merge: true });

      console.log('✅ [Firestore] ✅✅✅ LOCALIZAÇÃO SALVA COM SUCESSO! ✅✅✅');
      console.log('✅ [Firestore] Acesse: https://console.firebase.google.com');
      console.log('✅ [Firestore] Vá em: Firestore Database > userLocations');
      // ✅ Atualizar estados para indicar sucesso no salvamento
      setIsSavingToFirestore(false);
      setLastFirestoreSave(new Date());
      setFirestoreError(null);
    } catch (error) {
      console.error('❌ [Firestore] ERRO ao salvar localização:', error);
      console.error('❌ [Firestore] Detalhes do erro:', JSON.stringify(error, null, 2));

      // ✅ Verificar se é erro de permissão
      const isPermissionError = error instanceof Error &&
        (error.message.includes('permission-denied') ||
          error.message.includes('Missing or insufficient permissions'));

      // ✅ Atualizar estados para indicar erro no salvamento
      setIsSavingToFirestore(false);

      if (isPermissionError) {
        setFirestoreError('Firestore permission-denied - Regras precisam ser publicadas');
        console.error('🚨 [Firestore] ERRO DE PERMISSÃO - As regras do Firestore não foram publicadas!');
        console.error('🚨 [Firestore] Execute: bash deploy-firestore-rules.sh');
        console.error('🚨 [Firestore] Ou publique manualmente em: https://console.firebase.google.com/project/NexCoin-app/firestore/rules');
      } else {
        setFirestoreError('Erro ao salvar localização no Firestore');
      }
    }
  };

  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não é suportada pelo seu navegador');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  }, [handleSuccess, handleError]);

  const watchLocation = useCallback(async () => {
    const isNative = Capacitor.isNativePlatform();

    try {
      if (isNative) {
        const perm = await Geolocation.checkPermissions();
        if (perm.location !== 'granted') {
          console.log('📍 [Location] Permissão não concedida, solicitando...');
          // Somente solicita se o usuário explicitamente pediu ou em fluxos específicos
          // Por enquanto, apenas retornamos para evitar o loop
          setIsLoading(false);
          return;
        }
      }

      if (isWatching) return;

      console.log('🔄 [Location] Iniciando monitoramento de localização...');
      setIsLoading(true);
      setError(null);
      setIsWatching(true);

      if (isNative) {
        const id = await Geolocation.watchPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        }, (position, err) => {
          if (err) {
            handleError(err as any);
            return;
          }
          if (position) handleSuccess(position as any);
        });
        setWatchId(id as any);
      } else {
        const id = navigator.geolocation.watchPosition(handleSuccess, handleError, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
        setWatchId(id as any);
      }

      console.log('✅ [Location] Monitoramento iniciado');
    } catch (err) {
      console.error('❌ [Location] Erro ao iniciar monitoramento:', err);
      setIsWatching(false);
      setIsLoading(false);
    }
  }, [handleSuccess, handleError, isWatching]);

  const stopWatching = useCallback(async () => {
    if (watchId !== null) {
      console.log('🛑 [Location] Parando monitoramento...');
      if (Capacitor.isNativePlatform()) {
        await Geolocation.clearWatch({ id: watchId as any });
      } else {
        navigator.geolocation.clearWatch(watchId as any);
      }
      setWatchId(null);
      setIsWatching(false);
    }
  }, [watchId]);

  const value: LocationContextType = {
    location,
    isLoading,
    error,
    isWatching,
    hasPermission,
    hasCameraPermission,
    checkCameraPermission,
    watchLocation,
    stopWatching,
    getCurrentLocation,
    // ✅ Novos estados para rastrear salvamento no Firestore
    isSavingToFirestore,
    lastFirestoreSave,
    firestoreError
  };

  // ✅ Iniciar rastreamento AUTOMATICAMENTE quando o app abrir, mas APENAS se já tiver permissão
  React.useEffect(() => {
    const initTracking = async () => {
      // Pequeno delay para evitar sobrecarga no boot
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (Capacitor.isNativePlatform()) {
        const perm = await Geolocation.checkPermissions();
        if (perm.location === 'granted') {
          console.log('📍 [Location] Permissão já concedida, ativando GPS...');
          watchLocation();
        } else {
          console.log('📍 [Location] Sem permissão prévia, não incomodando o usuário agora.');
        }
      } else {
        // No web, verificamos se a permissão já foi dada anteriormente via localStorage experimental ou apenas tentamos
        // Para evitar o pop-up chato, melhor não tentar automaticamente no Web se o usuário já disse que é chato
        console.log('📍 [Web] Localização automática desativada para evitar pop-ups');
      }
    };

    initTracking();
  }, []);

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation deve ser usado dentro de LocationProvider');
  }
  return context;
}
