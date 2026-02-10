import type { Screen } from '../App';
import { useEffect, useRef, useState } from 'react';

interface WelcomeProps {
  onNavigate: (screen: Screen) => void;
}

export function Welcome({ onNavigate }: WelcomeProps) {
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
        {/* Logo Section */}
        <div className="flex flex-col items-center text-center pt-[env(safe-area-inset-top)] opacity-0 animate-scaleIn" style={{ animationDelay: '0.4s' }}>
          <div className="relative inline-block">
            {/* Glow effect background */}
            <div
              className="absolute inset-0 blur-3xl opacity-60"
              style={{
                background: 'radial-gradient(circle, rgba(0, 212, 255, 0.4) 0%, rgba(123, 47, 247, 0.3) 50%, transparent 70%)',
              }}
            />

            {/* Main logo */}
            <h1
              className="text-3xl font-black relative nexcoin-logo-text"
            >
              NexCoin
            </h1>

            {/* Underline accent */}
            <div
              className="h-[2px] w-24 mx-auto mt-3 rounded-full"
              style={{
                background: 'linear-gradient(90deg, transparent, #00d4ff, #7b2ff7, transparent)',
                boxShadow: '0 0 10px rgba(0, 212, 255, 0.8)',
              }}
            />
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
            Create Account
          </button>

          <button
            onClick={handleLoginClick}
            className="w-full py-3 text-white font-semibold active:opacity-60 transition-opacity duration-200 text-base bg-white/10 rounded-full opacity-0 animate-slideUp"
            style={{ animationDelay: '0.8s' }}
          >
            Login
          </button>

          <p className="text-[10px] text-white/40 text-center mt-1 px-8 opacity-0 animate-fadeIn" style={{ animationDelay: '1s' }}>
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </main>
    </div>
  );
}