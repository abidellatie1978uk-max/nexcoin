import { useState, useEffect } from 'react';
import { Welcome } from './components/Welcome';
import { Login } from './components/Login';
import { SignUp } from './components/SignUp';
import { PinSetup } from './components/PinSetup';
import { CountrySelection } from './components/CountrySelection';
import { NewHome } from './components/NewHome';
import { Wallet } from './components/Wallet';
import { Convert } from './components/Convert';
import { Crypto } from './components/Crypto';
import { NewProfile } from './components/NewProfile';
import { PersonalInfo } from './components/PersonalInfo';
import { AccountData } from './components/AccountData';
import { Security } from './components/Security';
import { ChangePassword } from './components/ChangePassword';
import { Notifications } from './components/Notifications';
import { PushSettings } from './components/PushSettings';
import { HelpCenter } from './components/HelpCenter';
import { TermsAndConditions } from './components/TermsAndConditions';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsMenu } from './components/TermsMenu';
import { LandingPage } from './components/LandingPage';
import { Capacitor } from '@capacitor/core';

import { Deposit } from './components/Deposit';
import { Withdraw } from './components/Withdraw';
import { WithdrawFiat } from './components/WithdrawFiat';
import { Receive } from './components/Receive';
import { Transactions } from './components/Transactions';
import { BottomNav } from './components/BottomNav';
import { PasswordEntry } from './components/PasswordEntry';
import { ManageHoldings } from './components/ManageHoldings';
import { SelectFiatAccount } from './components/SelectFiatAccount';
import { WalletsMigrationAlert } from './components/WalletsMigrationAlert';
import { WalletValueSync } from './components/WalletValueSync';
import { FiatAccountDetails } from './components/FiatAccountDetails';
import { PendingApproval } from './components/PendingApproval';
import { DeleteAccount } from './components/DeleteAccount';
import { LanguageSettings } from './components/LanguageSettings';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from 'sonner';
import { SplashScreen } from './components/SplashScreen';
import { LocationBlocked } from './components/LocationBlocked';
import { CameraBlocked } from './components/CameraBlocked';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LocationProvider, useLocation } from './contexts/LocationContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { CryptoPriceProvider } from './contexts/CryptoPriceContext';
import { FiatRatesProvider } from './contexts/FiatRatesContext';
import { PortfolioProvider } from './contexts/PortfolioContext';
import { SignUpFlowProvider } from './contexts/SignUpFlowContext';
import { LoginFlowProvider } from './contexts/LoginFlowContext';
import { LanguageProvider } from './contexts/LanguageContext';
import type { BankAccount } from './lib/bankAccountGenerator';
import { usePermissionsRequest } from './hooks/usePermissionsRequest';

import { DownloadApp } from './components/DownloadApp';

export type Screen = 'welcome' | 'login' | 'signup' | 'pinSetup' | 'pinVerify' | 'country' | 'countrySelection' | 'completeProfile' | 'home' | 'wallet' | 'convert' | 'crypto' | 'profile' | 'personalInfo' | 'accountData' | 'security' | 'changePassword' | 'notifications' | 'pushSettings' | 'helpCenter' | 'termsAndConditions' | 'privacyPolicy' | 'termsMenu' | 'deposit' | 'withdraw' | 'withdrawFiat' | 'receive' | 'transactions' | 'passwordEntry' | 'manageHoldings' | 'fiatAccountDetails' | 'selectFiatAccount' | 'deleteAccount' | 'languageSettings' | 'downloadApp';

type TransitionType = 'slide' | 'fade' | 'scale' | 'slideup';

// ✅ Suprimir erros de conexão do Firestore (não afetam funcionalidade)
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  // Filtrar erros do WebChannel que são temporários
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('WebChannelConnection') ||
      args[0].includes('RPC') ||
      args[0].includes('transport errored'))
  ) {
    return; // Silenciar esses erros
  }
  originalConsoleError.apply(console, args);
};

function AppContent() {
  const { isAuthenticated, isPinVerified, userData, loading } = useAuth();
  const { hasPermission, hasCameraPermission, isLoading: isLocationLoading, getCurrentLocation, checkCameraPermission } = useLocation();
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [isWeb] = useState(Capacitor.getPlatform() === 'web');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionType, setTransitionType] = useState<TransitionType>('fade');
  const [selectedFiatAccount, setSelectedFiatAccount] = useState<BankAccount | null>(null);
  const [tempSignUpData, setTempSignUpData] = useState<{
    name: string;
    email: string;
    phone: string;
    country: string;
    password: string;
  } | null>(null);

  // ✅ Estado para controlar se já inicializou (evita loops)
  const [hasInitialized, setHasInitialized] = useState(false);

  // 🔐 SOLICITAR PERMISSÕES NATIVAS (localização e câmera)
  usePermissionsRequest();

  // Gerenciar redirecionamento baseado no estado de autenticação
  useEffect(() => {
    if (loading) return; // Esperar carregar

    // ✅ Primeira inicialização: definir tela baseada no estado de auth
    if (!hasInitialized) {
      if (isAuthenticated && isPinVerified) {
        console.log('🔄 Inicialização: Usuário autenticado');
        if (isWeb) {
          setCurrentScreen('downloadApp');
        } else {
          setCurrentScreen('home');
        }
      } else {
        console.log('🔄 Inicialização: Usuário não autenticado, ficando em welcome');
        setCurrentScreen('welcome');
      }
      setHasInitialized(true);
      return;
    }

    // ✅ Lógica normal após inicialização
    if (!isAuthenticated) {
      // Não autenticado - permitir navegar entre welcome, login e signup
      // NÃO redirecionar automaticamente
      return;
    } else if (isAuthenticated && !isPinVerified) {
      // ✅ Apenas redirecionar para PIN se vier de login/signup
      if (['login', 'signup'].includes(currentScreen)) {
        console.log('⚠️ Redirecionando para pinVerify (vindo de login/signup)');
        setCurrentScreen('pinVerify');
      }
      // Se já estava em outra tela (reload), não fazer nada
    } else if (isAuthenticated && isPinVerified) {
      // Autenticado e PIN verificado - pode acessar app
      if (isWeb && ['welcome', 'login', 'signup', 'pinVerify', 'pinSetup'].includes(currentScreen)) {
        console.log('🌐 Web: Cadastro finalizado, indo para tela de download');
        setCurrentScreen('downloadApp');
        return;
      }

      if (['welcome', 'login', 'signup', 'pinVerify'].includes(currentScreen)) {
        console.log('✅ Redirecionando para home');
        setCurrentScreen('home');
      }
    }
  }, [isAuthenticated, isPinVerified, loading, hasInitialized]);

  // Define qual tipo de transição usar para cada tela
  const getTransitionType = (screen: Screen): TransitionType => {
    const transitions: Record<Screen, TransitionType> = {
      welcome: 'fade',
      login: 'slide',
      signup: 'slideup',
      pinSetup: 'slideup',
      pinVerify: 'slideup',
      country: 'scale',
      countrySelection: 'scale',
      completeProfile: 'slideup',
      home: 'fade',
      wallet: 'slide',
      convert: 'scale',
      crypto: 'slideup',
      profile: 'slide',
      personalInfo: 'slide',
      accountData: 'slide',
      security: 'scale',
      changePassword: 'slideup',
      notifications: 'slideup',
      pushSettings: 'slideup',
      helpCenter: 'slideup',
      termsAndConditions: 'slideup',
      privacyPolicy: 'slideup',
      termsMenu: 'slideup',

      deposit: 'slideup',
      withdraw: 'slide',
      withdrawFiat: 'slide',
      receive: 'fade',
      transactions: 'scale',
      passwordEntry: 'slideup',
      manageHoldings: 'slideup',
      fiatAccountDetails: 'slideup',
      selectFiatAccount: 'slideup',
      deleteAccount: 'slideup',
      languageSettings: 'slideup',
      downloadApp: 'fade'
    };
    return transitions[screen] || 'slide';
  };

  const handleNavigate = (screen: Screen) => {
    let targetScreen = screen;

    // 🌐 Interceptar navegação para home na Web e redirecionar para Download
    if (isWeb && (screen === 'home' || screen === 'wallet' || screen === 'convert' || screen === 'crypto')) {
      console.log('🌐 Web: Redirecionando de', screen, 'para downloadApp');
      targetScreen = 'downloadApp';
    }

    console.log('🔄 handleNavigate chamado para:', targetScreen);
    setIsTransitioning(true);

    // Aguarda a animação de saída antes de mudar a tela
    setTimeout(() => {
      console.log('✅ Mudando tela para:', targetScreen);
      setCurrentScreen(targetScreen);
      setTransitionType(getTransitionType(targetScreen));
      setIsTransitioning(false);
    }, 700);
  };

  const handleNavigateWithAccount = (screen: Screen, account: BankAccount) => {
    setSelectedFiatAccount(account);
    handleNavigate(screen);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <Welcome onNavigate={handleNavigate} />;
      case 'login':
        return <Login onNavigate={handleNavigate} />;
      case 'signup':
        return <SignUp onNavigate={handleNavigate} />;
      case 'pinSetup':
        return <PinSetup onNavigate={handleNavigate} />;
      case 'country':
        return <CountrySelection onNavigate={handleNavigate} />;
      case 'countrySelection':
        return <CountrySelection onNavigate={handleNavigate} />;
      case 'home':
        return <NewHome onNavigate={handleNavigate} onNavigateWithAccount={handleNavigateWithAccount} />;
      case 'wallet':
        return <Wallet onNavigate={handleNavigate} />;
      case 'convert':
        return <Convert onNavigate={handleNavigate} onNavigateWithAccount={handleNavigateWithAccount} />;
      case 'crypto':
        return <Crypto onNavigate={handleNavigate} />;
      case 'profile':
        return <NewProfile onNavigate={handleNavigate} />;
      case 'personalInfo':
        return <PersonalInfo onNavigate={handleNavigate} />;
      case 'accountData':
        return <AccountData onNavigate={handleNavigate} />;
      case 'security':
        return <Security onNavigate={handleNavigate} />;
      case 'changePassword':
        return <ChangePassword onNavigate={handleNavigate} />;
      case 'notifications':
        return <Notifications onNavigate={handleNavigate} />;
      case 'pushSettings':
        return <PushSettings onNavigate={handleNavigate} />;
      case 'helpCenter':
        return <HelpCenter onNavigate={handleNavigate} />;
      case 'termsAndConditions':
        return <TermsAndConditions onNavigate={handleNavigate} />;
      case 'privacyPolicy':
        return <PrivacyPolicy onNavigate={handleNavigate} />;
      case 'termsMenu':
        return <TermsMenu onNavigate={handleNavigate} />;

      case 'deposit':
        return <Deposit onNavigate={handleNavigate} />;
      case 'withdraw':
        return <Withdraw onNavigate={handleNavigate} />;
      case 'withdrawFiat':
        return <WithdrawFiat onNavigate={handleNavigate} onBack={() => handleNavigate('home')} />;
      case 'receive':
        return <Receive onNavigate={handleNavigate} />;
      case 'transactions':
        return <Transactions onNavigate={handleNavigate} />;
      case 'passwordEntry':
        return <PasswordEntry onNavigate={handleNavigate} />;
      case 'manageHoldings':
        return <ManageHoldings onNavigate={handleNavigate} />;
      case 'fiatAccountDetails':
        return selectedFiatAccount ? (
          <FiatAccountDetails
            account={selectedFiatAccount}
            onClose={() => handleNavigate('home')}
            onNavigateToConvert={() => handleNavigate('convert')}
            onNavigateToWithdraw={() => handleNavigateWithAccount('withdrawFiat', selectedFiatAccount)}
          />
        ) : (
          <NewHome onNavigate={handleNavigate} onNavigateWithAccount={handleNavigateWithAccount} />
        );
      case 'selectFiatAccount':
        return <SelectFiatAccount onNavigate={handleNavigate} onNavigateWithAccount={handleNavigateWithAccount} />;
      case 'deleteAccount':
        return <DeleteAccount onNavigate={handleNavigate} />;
      case 'languageSettings':
        return <LanguageSettings onNavigate={handleNavigate} />;
      case 'downloadApp':
        return <DownloadApp />;
      default:
        return <Welcome onNavigate={handleNavigate} />;
    }
  };

  if (loading || !hasInitialized) {
    return <SplashScreen />;
  }

  // 📍 BLOQUEIO DE LOCALIZAÇÃO: Se autenticado e o rastreamento estiver habilitado no Firebase, mas sem permissão de GPS
  if (
    isAuthenticated &&
    userData?.trackLocationEnabled === true &&
    !hasPermission &&
    !isLocationLoading &&
    !['welcome', 'login', 'signup'].includes(currentScreen)
  ) {
    return <LocationBlocked onRetry={() => getCurrentLocation()} />;
  }

  // 📷 BLOQUEIO DE CÂMERA: Se autenticado E se a obrigatoriedade estiver ativada, mas sem permissão
  if (
    isAuthenticated &&
    userData?.requireCameraPermission === true && // ✅ Verificação remota de obrigatoriedade
    !hasCameraPermission &&
    !isLocationLoading &&
    !['welcome', 'login', 'signup', 'pinSetup', 'pinVerify'].includes(currentScreen)
  ) {
    return <CameraBlocked onRetry={() => checkCameraPermission()} />;
  }


  if (isWeb && !isAuthenticated && (currentScreen === 'welcome' || currentScreen === 'login')) {
    return <LandingPage onNavigate={handleNavigate} />;
  }

  return (
    <div className={`min-h-screen bg-black text-white w-full ${isWeb ? '' : 'max-w-[430px] mx-auto'} relative`}>
      {/* 🔒 VERIFICAÇÃO DE APROVAÇÃO E PAGAMENTO: Se usuário não aprovado, mostrar PendingApproval */}
      {isAuthenticated && userData && userData.aprovado === 'no' ? (
        <PendingApproval />
      ) : (
        <>
          {/* Renderizar FiatAccountDetails fora do container de transição */}
          {currentScreen === 'fiatAccountDetails' && selectedFiatAccount ? (
            <FiatAccountDetails
              account={selectedFiatAccount}
              onClose={() => handleNavigate('home')}
              onNavigateToConvert={() => handleNavigate('convert')}
              onNavigateToWithdraw={() => handleNavigateWithAccount('withdrawFiat', selectedFiatAccount)}
            />
          ) : (
            <>
              <div
                className={
                  isTransitioning
                    ? `page-${transitionType}-exit`
                    : `page-${transitionType}-enter`
                }
              >
                {renderScreen()}
              </div>

              {/* Show BottomNav only on main app screens */}
              {['home', 'wallet', 'convert', 'crypto', 'profile'].includes(currentScreen) && (
                <BottomNav onNavigate={handleNavigate} currentScreen={currentScreen} />
              )}
            </>
          )}

          {/* Alerta de migração para nova estrutura de wallets */}
          {isAuthenticated && <WalletsMigrationAlert />}

          {/* Sincronização automática de valores das wallets */}
          <WalletValueSync />
        </>
      )}

      {/* Toast notifications */}
      <Toaster
        position="top-center"
        theme="dark"
        toastOptions={{
          style: {
            background: '#18181b',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff',
          },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <SignUpFlowProvider>
          <LoginFlowProvider>
            <AuthProvider>
              <CryptoPriceProvider>
                <FiatRatesProvider>
                  <PortfolioProvider>
                    <LocationProvider>
                      <NotificationProvider>
                        <AppContent />
                      </NotificationProvider>
                    </LocationProvider>
                  </PortfolioProvider>
                </FiatRatesProvider>
              </CryptoPriceProvider>
            </AuthProvider>
          </LoginFlowProvider>
        </SignUpFlowProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}