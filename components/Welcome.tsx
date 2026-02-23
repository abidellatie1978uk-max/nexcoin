import type { Screen } from '../App';
import { useEffect, useRef, useState } from 'react';

interface WelcomeProps {
  onNavigate: (screen: Screen) => void;
}

// Detectar idioma do dispositivo e retornar textos traduzidos
function getTexts() {
  const lang = (navigator.language || navigator.languages?.[0] || 'en').toLowerCase();

  if (lang.startsWith('pt')) {
    return {
      createAccount: 'Criar conta',
      login: 'Entrar',
      terms: 'Ao se cadastrar, você concorda com nossos Termos de Serviço e Política de Privacidade.',
    };
  }
  if (lang.startsWith('es')) {
    return {
      createAccount: 'Crear cuenta',
      login: 'Iniciar sesión',
      terms: 'Al registrarte, aceptas nuestros Términos de Servicio y Política de Privacidad.',
    };
  }
  // Default: English
  return {
    createAccount: 'Create Account',
    login: 'Login',
    terms: 'By signing up, you agree to our Terms of Service and Privacy Policy.',
  };
}

export function Welcome({ onNavigate }: WelcomeProps) {
  const texts = getTexts();

  const handleLoginClick = () => {
    console.log('👆 Botão de Login clicado no Welcome');
    onNavigate('login');
  };

  const handleSignUpClick = () => {
    console.log('👆 Botão de Criar Conta clicado no Welcome');
    onNavigate('signup');
  };

  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setIsVideoPlaying(true);
      }).catch(error => {
        console.error("Autoplay failed:", error);
      });
    }
  }, []);

  return (
    <div className="bg-black text-white overflow-hidden relative w-full h-screen">
      {/* Fallback Gradient (Sempre atrás) */}
      <div
        className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none bg-black"
        style={{}}
      />

      {/* Video Container (Só aparece quando começa a rodar) */}
      <div className={`fixed top-0 left-0 w-full h-full z-0 overflow-hidden transition-opacity duration-1000 ${isVideoPlaying ? 'opacity-100' : 'opacity-0'}`}>
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          webkit-playsinline="true"
          preload="auto"
          controls={false}
          onPlay={() => setIsVideoPlaying(true)}
          className="w-full h-full object-cover"
          style={{ filter: 'brightness(0.6) contrast(1.1)' }}
        >
          <source
            src="/assets/videos/entrada.mp4"
            type="video/mp4"
          />
        </video>
      </div>

      {/* Gradient Overlay */}
      <div
        className="fixed top-0 left-0 w-full h-full z-10 pointer-events-none opacity-0 animate-fadeIn"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.8) 100%)',
          animationDelay: '0.2s'
        }}
      />

      {/* Main Content */}
      <main className="relative z-20 h-screen flex flex-col justify-between px-6 pb-12 pt-20">
        {/* Logo / Brand Name Section */}
        <div className="flex flex-col items-center text-center pt-[env(safe-area-inset-top)] opacity-0 animate-scaleIn" style={{ animationDelay: '0.4s' }}>
          <div className="relative inline-block">
            {/* Glow effect background */}
            <div
              className="absolute inset-0 blur-3xl opacity-60"
              style={{
                background: 'radial-gradient(circle, rgba(0, 212, 255, 0.4) 0%, rgba(123, 47, 247, 0.3) 50%, transparent 70%)',
              }}
            />

            {/* Brand Name Text */}
            <h1
              className="NexCoin-logo-text text-2xl font-normal tracking-widest uppercase"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              Ethertron
            </h1>
          </div>

          <p className="mt-4 text-white/70 font-medium tracking-wide uppercase text-[10px]">
            Future of Finance
          </p>
        </div>

        {/* Spacer */}
        <div className="flex-grow"></div>

        {/* Bottom Buttons */}
        <div className="w-full max-w-sm mx-auto flex flex-col gap-3 items-center pb-[env(safe-area-inset-bottom)]">
          <button
            onClick={handleSignUpClick}
            className="w-full bg-white text-black font-bold py-3.5 px-6 rounded-full shadow-lg active:scale-[0.98] transition-all duration-200 text-base opacity-0 animate-slideUp"
            style={{ animationDelay: '0.6s' }}
          >
            {texts.createAccount}
          </button>

          <button
            onClick={handleLoginClick}
            className="w-full py-3 text-white font-semibold active:opacity-60 transition-opacity duration-200 text-base bg-white/10 rounded-full opacity-0 animate-slideUp"
            style={{ animationDelay: '0.8s' }}
          >
            {texts.login}
          </button>

          <p className="text-[10px] text-white/40 text-center mt-1 px-8 opacity-0 animate-fadeIn" style={{ animationDelay: '1s' }}>
            {texts.terms}
          </p>
        </div>
      </main>
    </div>
  );
}