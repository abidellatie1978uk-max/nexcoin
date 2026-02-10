// Configuração e inicialização do Capacitor
// 
// ⚠️ IMPORTANTE: Este arquivo só será usado quando o app for compilado para mobile (Android/iOS).
// Durante o desenvolvimento web, o Capacitor não é necessário e este arquivo não será carregado.
// 
// Para compilar para mobile, siga o guia em: /MOBILE_BUILD_GUIDE.md ou /QUICK_START_MOBILE.md
//
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { App as CapApp } from '@capacitor/app';

/**
 * Inicializa configurações do Capacitor quando o app estiver rodando em mobile
 * Esta função deve ser chamada no App.tsx após o build mobile
 */
export async function initializeCapacitor() {
  // Verificar se está rodando em plataforma nativa
  if (!Capacitor.isNativePlatform()) {
    console.log('🌐 Rodando em navegador web');
    return;
  }

  console.log('📱 Inicializando Capacitor...');
  const platform = Capacitor.getPlatform();
  console.log(`Platform: ${platform}`);

  try {
    // Configurar Status Bar
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#000000' });
    console.log('✅ Status Bar configurada');

    // Ocultar Splash Screen
    await SplashScreen.hide();
    console.log('✅ Splash Screen ocultada');

    // Configurar Keyboard
    Keyboard.addListener('keyboardWillShow', info => {
      console.log('⌨️ Teclado aparecendo:', info.keyboardHeight);
    });

    Keyboard.addListener('keyboardWillHide', () => {
      console.log('⌨️ Teclado escondendo');
    });

    // Listener para quando o app voltar para foreground
    CapApp.addListener('appStateChange', ({ isActive }) => {
      console.log(`📱 App ${isActive ? 'ativo' : 'em background'}`);
    });

    // Listener para deep links (opcional para futuro)
    CapApp.addListener('appUrlOpen', data => {
      console.log('🔗 App aberto via URL:', data.url);
      // Aqui você pode adicionar lógica para navegação baseada em deep links
    });

    // Listener para botão voltar do Android
    CapApp.addListener('backButton', ({ canGoBack }) => {
      console.log('🔙 Botão voltar pressionado');
      if (!canGoBack) {
        // Se não pode voltar, perguntar se quer sair do app
        // Você pode implementar um dialog de confirmação aqui
        console.log('❌ Não pode voltar mais - considerar sair do app');
      }
    });

    console.log('✅ Capacitor inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar Capacitor:', error);
  }
}

/**
 * Verifica se está rodando em plataforma nativa
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Obtém a plataforma atual
 */
export function getPlatform(): 'ios' | 'android' | 'web' {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
}

/**
 * Verifica se está rodando no iOS
 */
export function isIOS(): boolean {
  return Capacitor.getPlatform() === 'ios';
}

/**
 * Verifica se está rodando no Android
 */
export function isAndroid(): boolean {
  return Capacitor.getPlatform() === 'android';
}

/**
 * Obtém informações do dispositivo
 */
export async function getDeviceInfo() {
  if (!isNativePlatform()) {
    return null;
  }

  try {
    const { Device } = await import('@capacitor/device');
    const info = await Device.getInfo();
    const batteryInfo = await Device.getBatteryInfo();
    
    return {
      ...info,
      battery: batteryInfo,
    };
  } catch (error) {
    console.error('Erro ao obter info do dispositivo:', error);
    return null;
  }
}

/**
 * Mostrar/esconder teclado programaticamente
 */
export async function toggleKeyboard(show: boolean) {
  if (!isNativePlatform()) return;

  try {
    if (show) {
      await Keyboard.show();
    } else {
      await Keyboard.hide();
    }
  } catch (error) {
    console.error('Erro ao controlar teclado:', error);
  }
}

/**
 * Vibração háptica (feedback tátil)
 */
export async function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'medium') {
  if (!isNativePlatform()) return;

  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    
    let impactStyle: ImpactStyle;
    switch (style) {
      case 'light':
        impactStyle = ImpactStyle.Light;
        break;
      case 'heavy':
        impactStyle = ImpactStyle.Heavy;
        break;
      default:
        impactStyle = ImpactStyle.Medium;
    }
    
    await Haptics.impact({ style: impactStyle });
  } catch (error) {
    console.error('Erro ao executar haptic:', error);
  }
}

/**
 * Compartilhar conteúdo nativo
 */
export async function shareContent(title: string, text: string, url?: string) {
  if (!isNativePlatform()) {
    // Fallback para Web Share API
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return { success: true };
      } catch (error) {
        return { success: false, error };
      }
    }
    return { success: false, error: 'Share não disponível' };
  }

  try {
    const { Share } = await import('@capacitor/share');
    await Share.share({
      title,
      text,
      url,
      dialogTitle: title,
    });
    return { success: true };
  } catch (error) {
    console.error('Erro ao compartilhar:', error);
    return { success: false, error };
  }
}

/**
 * Verificar status da rede
 */
export async function getNetworkStatus() {
  if (!isNativePlatform()) {
    return {
      connected: navigator.onLine,
      connectionType: 'wifi', // Padrão para web
    };
  }

  try {
    const { Network } = await import('@capacitor/network');
    const status = await Network.getStatus();
    return status;
  } catch (error) {
    console.error('Erro ao obter status da rede:', error);
    return null;
  }
}

/**
 * Listener para mudanças na conexão de rede
 */
export async function addNetworkListener(callback: (status: any) => void) {
  if (!isNativePlatform()) {
    // Fallback para web
    window.addEventListener('online', () => callback({ connected: true }));
    window.addEventListener('offline', () => callback({ connected: false }));
    return;
  }

  try {
    const { Network } = await import('@capacitor/network');
    Network.addListener('networkStatusChange', callback);
  } catch (error) {
    console.error('Erro ao adicionar listener de rede:', error);
  }
}

/**
 * Sair do app (apenas Android)
 */
export async function exitApp() {
  if (!isAndroid()) {
    console.log('Exit app só funciona no Android');
    return;
  }

  try {
    await CapApp.exitApp();
  } catch (error) {
    console.error('Erro ao sair do app:', error);
  }
}