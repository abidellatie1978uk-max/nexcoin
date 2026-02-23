import { useEffect, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

/**
 * Detecta se está rodando no iOS/Safari
 */
function isIOSSafari() {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
  return isIOS || isSafari;
}

// Chaves para o LocalStorage
const PERMISSIONS_REQUESTED_KEY = 'NexCoin_permissions_requested';

/**
 * Hook que solicita permissões de localização e câmera usando notificações NATIVAS do sistema
 * Executa apenas UMA VEZ após primeiro login
 */
export function usePermissionsRequest() {
  const { isAuthenticated, isPinVerified, userData } = useAuth();
  const hasRequestedInSessionRef = useRef(false);

  useEffect(() => {
    // 1. Verificações de estado básico
    if (!isAuthenticated || !isPinVerified || !userData) {
      return;
    }

    // 2. Verificar se já solicitou nesta sessão (Ref)
    if (hasRequestedInSessionRef.current) {
      console.log('⏸️ usePermissionsRequest: Já solicitado nesta sessão (Ref)');
      return;
    }

    // 3. Verificar se já solicitou neste dispositivo (LocalStorage)
    const storedRequested = localStorage.getItem(`${PERMISSIONS_REQUESTED_KEY}_${userData.uid}`);
    if (storedRequested === 'true') {
      console.log('⏸️ usePermissionsRequest: Já solicitado neste dispositivo (LocalStorage)');
      hasRequestedInSessionRef.current = true;
      return;
    }

    // 4. Verificar se já solicitou globalmente (Firestore)
    if (userData.permissionsRequested) {
      console.log('⏸️ usePermissionsRequest: Já solicitado anteriormente (Firestore)');
      // Sincronizar cache local se o Firestore diz que foi solicitado mas o local não
      localStorage.setItem(`${PERMISSIONS_REQUESTED_KEY}_${userData.uid}`, 'true');
      hasRequestedInSessionRef.current = true;
      return;
    }

    console.log('🚀 usePermissionsRequest: Iniciando solicitação de permissões em 2 segundos...');
    hasRequestedInSessionRef.current = true;

    // Aguardar um pouco para não assustar o usuário assim que o app abrir
    const timer = setTimeout(() => {
      requestPermissions();
    }, 2000);

    return () => clearTimeout(timer);

    async function requestPermissions() {
      console.log('🔐 === INICIANDO SOLICITAÇÃO DE PERMISSÕES NATIVAS ===');
      const isNative = Capacitor.isNativePlatform();
      const userId = userData?.uid;

      const results = {
        location: 'not_requested',
        camera: 'not_requested'
      };

      // Marcar como solicitado no localStorage IMEDIATAMENTE antes de começar
      // Isso evita que, se o usuário fechar o app durante o prompt, peça de novo no próximo boot
      if (userId) {
        localStorage.setItem(`${PERMISSIONS_REQUESTED_KEY}_${userId}`, 'true');
      }

      try {
        // 1️⃣ LOCALIZAÇÃO
        try {
          if (isNative) {
            const locStatus = await Geolocation.checkPermissions();
            if (locStatus.location !== 'granted') {
              console.log('📍 Solicitando permissão de LOCALIZAÇÃO (Plugin)');
              const reqLoc = await Geolocation.requestPermissions();
              results.location = reqLoc.location;
            } else {
              results.location = 'granted';
            }
          } else {
            // Web fallback
            await new Promise<void>((resolve) => {
              navigator.geolocation.getCurrentPosition(
                () => { results.location = 'granted'; resolve(); },
                () => { results.location = 'denied'; resolve(); },
                { timeout: 5000 }
              );
            });
          }
        } catch (err) {
          console.error('❌ Erro ao solicitar localização:', err);
          results.location = 'error';
        }

        // Aguardar brevemente entre os prompts
        await new Promise(resolve => setTimeout(resolve, 800));

        // 2️⃣ CÂMERA
        try {
          if (isNative) {
            const camStatus = await Camera.checkPermissions();
            if (camStatus.camera !== 'granted') {
              console.log('📷 Solicitando permissão de CÂMERA (Plugin)');
              const reqCam = await Camera.requestPermissions();
              results.camera = reqCam.camera;
            } else {
              results.camera = 'granted';
            }
          } else {
            // Web fallback
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ video: true });
              stream.getTracks().forEach(t => t.stop());
              results.camera = 'granted';
            } catch {
              results.camera = 'denied';
            }
          }
        } catch (err) {
          console.error('❌ Erro ao solicitar câmera:', err);
          results.camera = 'error';
        }

        // 3️⃣ SALVAR RESULTADOS NO FIRESTORE
        console.log('💾 Salvando estado de solicitação no Firestore:', results);

        if (userId) {
          try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
              permissionsRequested: true,
              locationPermission: results.location,
              cameraPermission: results.camera,
              permissionsRequestedAt: new Date().toISOString()
            });
            console.log('✅ Estado salvo no Firestore');
          } catch (error) {
            console.error('❌ Erro ao salvar estado no Firestore:', error);
          }
        }

      } catch (error) {
        console.error('❌ Erro geral ao solicitar permissões:', error);
      }
    }
  }, [isAuthenticated, isPinVerified, userData]);
}
