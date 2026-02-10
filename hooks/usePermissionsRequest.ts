import { useEffect, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Detecta se está rodando no iOS/Safari
 */
function isIOSSafari() {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
  return isIOS || isSafari;
}

/**
 * Hook que solicita permissões de localização e câmera usando notificações NATIVAS do sistema
 * Executa apenas UMA VEZ após primeiro login
 */
export function usePermissionsRequest() {
  const { isAuthenticated, isPinVerified, userData } = useAuth();
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    const iOS = isIOSSafari();
    console.log('🔍 usePermissionsRequest - Estado atual:', {
      isAuthenticated,
      isPinVerified,
      hasUserData: !!userData,
      userId: userData?.userId,
      permissionsRequested: userData?.permissionsRequested,
      hasRequestedRef: hasRequestedRef.current,
      isIOSSafari: iOS
    });

    // Validações
    if (!isAuthenticated) {
      console.log('⏸️ Não autenticado, aguardando...');
      return;
    }
    
    if (!isPinVerified) {
      console.log('⏸️ PIN não verificado, aguardando...');
      return;
    }
    
    if (!userData) {
      console.log('⏸️ Sem userData, aguardando...');
      return;
    }
    
    if (hasRequestedRef.current) {
      console.log('⏸️ Já solicitou nesta sessão');
      return;
    }
    
    if (userData.permissionsRequested) {
      console.log('⏸️ Já solicitou anteriormente (Firestore)');
      return;
    }

    console.log('🚀 TODAS VALIDAÇÕES PASSARAM! Iniciando solicitação de permissões em 1 segundo...');
    hasRequestedRef.current = true;

    // Aguardar 1 segundo para dar tempo do usuário entrar no app
    const timer = setTimeout(() => {
      console.log('⏰ Timer disparado! Executando requestPermissions()');
      requestPermissions();
    }, 1000);

    return () => clearTimeout(timer);

    async function requestPermissions() {
      console.log('🔐 === INICIANDO SOLICITAÇÃO DE PERMISSÕES ===');
      
      const results = {
        location: 'not_requested',
        camera: 'not_requested'
      };

      try {
        // 1️⃣ SOLICITAR LOCALIZAÇÃO (pop-up nativo do navegador)
        console.log('📍 Solicitando permissão de LOCALIZAÇÃO (nativo)');
        try {
          await new Promise<void>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                console.log('✅ Localização concedida:', position.coords);
                results.location = 'granted';
                resolve();
              },
              (error) => {
                console.log('❌ Localização negada ou bloqueada:', error.message);
                if (error.code === 1) {
                  results.location = 'denied'; // User denied
                } else if (error.code === 2) {
                  results.location = 'unavailable'; // Position unavailable
                } else {
                  results.location = 'timeout'; // Timeout
                }
                resolve(); // Continuar mesmo se negar
              },
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
              }
            );
          });
        } catch (error) {
          console.error('Erro ao solicitar localização:', error);
          results.location = 'error';
        }

        // Aguardar 1s entre solicitações
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 2️⃣ SOLICITAR CÂMERA (pop-up nativo do navegador)
        console.log('📷 Solicitando permissão de CÂMERA (nativo)');
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' }, // Priorizar câmera frontal
            audio: false 
          });
          
          console.log('✅ Câmera concedida');
          results.camera = 'granted';
          
          // Fechar stream imediatamente
          stream.getTracks().forEach(track => track.stop());
        } catch (error: any) {
          console.log('⚠️ Câmera não permitida:', error.name);
          if (error.name === 'NotAllowedError') {
            results.camera = 'denied'; // User denied or browser blocked
          } else if (error.name === 'NotFoundError') {
            results.camera = 'not_found'; // No camera device
          } else if (error.name === 'NotReadableError') {
            results.camera = 'in_use'; // Camera in use
          } else if (error.name === 'NotSupportedError') {
            results.camera = 'not_supported'; // HTTPS required
          } else {
            results.camera = 'error';
          }
          // NÃO propagar o erro - apenas logar
        }

        // 3️⃣ SALVAR RESULTADOS NO FIRESTORE
        console.log('💾 Salvando permissões:', results);
        
        if (userData?.userId) {
          try {
            const userRef = doc(db, 'users', userData.userId);
            await updateDoc(userRef, {
              permissionsRequested: true,
              locationPermission: results.location,
              cameraPermission: results.camera,
              permissionsRequestedAt: new Date().toISOString()
            });
            console.log('✅ Permissões salvas no Firestore');
          } catch (error) {
            console.error('❌ Erro ao salvar permissões:', error);
          }
        }

      } catch (error) {
        console.error('❌ Erro geral ao solicitar permissões:', error);
      }
    }
  }, [isAuthenticated, isPinVerified, userData]);
}