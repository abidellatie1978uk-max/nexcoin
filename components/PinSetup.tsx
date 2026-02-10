import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Lock } from 'lucide-react';
import type { Screen } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { useSignUpFlow } from '../contexts/SignUpFlowContext';

interface PinSetupProps {
  onNavigate: (screen: Screen) => void;
}

export function PinSetup({ onNavigate }: PinSetupProps) {
  const { userData, verifyPin, setPinVerified, signUp } = useAuth();
  const { signUpData, clearSignUpData } = useSignUpFlow();
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'create' | 'confirm' | 'verify'>('create'); // Começar com create se tiver signUpData
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Determinar modo inicial: se tem signUpData, está criando conta, senão está verificando
    if (signUpData) {
      setStep('create');
    } else {
      setStep('verify');
    }
  }, [signUpData]);

  useEffect(() => {
    // Auto-focus no primeiro input
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [step]);

  const handlePinChange = (index: number, value: string, isConfirm: boolean = false) => {
    // Permitir apenas números
    if (value && !/^\d$/.test(value)) return;

    const currentPin = isConfirm ? [...confirmPin] : [...pin];
    currentPin[index] = value;

    if (isConfirm) {
      setConfirmPin(currentPin);
    } else {
      setPin(currentPin);
    }

    // Mover para próximo input se digitou um número
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Verificar PIN quando completar todos os dígitos
    if (currentPin.every(digit => digit !== '')) {
      const fullPin = currentPin.join('');
      
      if (step === 'create') {
        // Avançar para confirmação
        setTimeout(() => {
          setStep('confirm');
          setError('');
        }, 100);
      } else if (step === 'confirm') {
        // Validar se PINs coincidem
        const originalPin = pin.join('');
        if (fullPin === originalPin) {
          // PINs coincidem - criar conta
          onPinCreated(fullPin);
        } else {
          // PINs não coincidem
          setError('Os PINs não coincidem. Tente novamente.');
          setShake(true);
          setTimeout(() => {
            setShake(false);
            setConfirmPin(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
          }, 500);
        }
      } else if (step === 'verify') {
        // Verificar PIN existente
        const verifySuccess = async () => {
          const isValid = await verifyPin(fullPin);
          if (isValid) {
            setPinVerified(true);
            onNavigate('home');
          } else {
            setError('PIN incorreto. Tente novamente.');
            setShake(true);
            setTimeout(() => {
              setShake(false);
              setPin(['', '', '', '', '', '']);
              inputRefs.current[0]?.focus();
            }, 500);
          }
        };
        verifySuccess();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent, isConfirm: boolean = false) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const currentPin = isConfirm ? [...confirmPin] : [...pin];
      
      if (currentPin[index] === '') {
        // Se vazio, voltar para anterior
        if (index > 0) {
          currentPin[index - 1] = '';
          if (isConfirm) {
            setConfirmPin(currentPin);
          } else {
            setPin(currentPin);
          }
          inputRefs.current[index - 1]?.focus();
        }
      } else {
        // Limpar atual
        currentPin[index] = '';
        if (isConfirm) {
          setConfirmPin(currentPin);
        } else {
          setPin(currentPin);
        }
      }
    }
  };

  const onPinCreated = async (pinValue: string) => {
    if (!signUpData) {
      console.error('Sem dados de cadastro');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Criar conta no Firebase
      await signUp(
        signUpData.email,
        signUpData.password,
        signUpData.name,
        signUpData.phone,
        signUpData.country,
        pinValue
      );

      // Limpar dados temporários
      clearSignUpData();

      // Definir PIN como verificado
      setPinVerified(true);

      // Navegar para Home
      onNavigate('home');
    } catch (error: any) {
      console.error('Erro ao criar conta:', error);
      setError(error.message || 'Erro ao criar conta. Tente novamente.');
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('create');
      setConfirmPin(['', '', '', '', '', '']);
      setError('');
    } else {
      onNavigate('login');
    }
  };

  const getTitle = () => {
    if (step === 'create') return 'Crie seu PIN';
    if (step === 'confirm') return 'Confirme seu PIN';
    return 'Digite seu PIN';
  };

  const getDescription = () => {
    if (step === 'create') return 'Crie um PIN de 6 dígitos para proteger sua conta';
    if (step === 'confirm') return 'Digite o PIN novamente para confirmar';
    return 'Digite seu PIN para acessar sua conta';
  };

  const currentPinArray = step === 'confirm' ? confirmPin : pin;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-20">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center mb-8 shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4)]">
          <Lock className="w-10 h-10 text-white" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-2 text-center">{getTitle()}</h1>
        <p className="text-sm text-gray-400 mb-12 text-center max-w-xs">
          {getDescription()}
        </p>

        {/* PIN Inputs */}
        <div className={`flex gap-3 mb-6 ${shake ? 'animate-shake' : ''}`}>
          {currentPinArray.map((digit, index) => (
            <input
              key={`${step}-${index}`}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handlePinChange(index, e.target.value, step === 'confirm')}
              onKeyDown={(e) => handleKeyDown(index, e, step === 'confirm')}
              className="w-14 h-16 bg-zinc-900 border-2 border-zinc-800 rounded-2xl text-center text-2xl font-bold text-white focus:border-white focus:outline-none transition-all"
              style={{
                caretColor: 'transparent',
              }}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-red-500 text-sm mb-4 text-center animate-fade-in">
            {error}
          </p>
        )}

        {/* Helper Text */}
        <p className="text-xs text-gray-500 text-center max-w-xs">
          {step === 'verify' 
            ? 'Use seu PIN de 6 dígitos para acessar sua conta'
            : 'Escolha um PIN fácil de lembrar, mas difícil de adivinhar'
          }
        </p>
      </div>

      {/* Footer */}
      {step === 'verify' && (
        <footer className="px-6 pb-8">
          <button
            onClick={() => onNavigate('login')}
            className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors"
          >
            Esqueci meu PIN
          </button>
        </footer>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}