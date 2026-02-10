import { useState, useRef, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Screen } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
import { useLoginFlow } from '../contexts/LoginFlowContext';
import { useAuth } from '../contexts/AuthContext';

interface PasswordEntryProps {
  onNavigate: (screen: Screen) => void;
}

export function PasswordEntry({ onNavigate }: PasswordEntryProps) {
  const { t } = useLanguage();
  const { phoneNumber } = useLoginFlow();
  const { signInWithPhoneAndPin } = useAuth();
  const [passcode, setPasscode] = useState(['', '', '', '', '', '']);
  const [isError, setIsError] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus no primeiro campo ao montar
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    // Aceita apenas números
    if (value && !/^\d$/.test(value)) return;

    // Limpa o estado de erro ao começar a digitar novamente
    if (isError) {
      setIsError(false);
    }

    const newPasscode = [...passcode];
    newPasscode[index] = value;
    setPasscode(newPasscode);

    // Move para o próximo campo se digitou um número
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Valida quando completar todos os 6 dígitos
    if (index === 5 && value) {
      const fullPasscode = [...newPasscode.slice(0, 5), value].join('');
      validatePassword(fullPasscode);
    }
  };

  const validatePassword = (password: string) => {
    setIsValidating(true);
    setErrorMessage(''); // Limpar mensagem anterior
    
    console.log('[PasswordEntry] Validando PIN:', password);
    console.log('[PasswordEntry] Telefone:', phoneNumber);
    
    // Simula delay de validação
    setTimeout(() => {
      signInWithPhoneAndPin(phoneNumber, password)
        .then(() => {
          console.log('[PasswordEntry] ✅ Login bem-sucedido!');
          // Senha correta - navega para home
          onNavigate('home');
        })
        .catch((error) => {
          console.log('[PasswordEntry] ❌ Erro no login:', error.message);
          
          // Senha incorreta - mostra erro e limpa campos
          setIsError(true);
          setErrorMessage(error.message || 'Erro ao fazer login');
          console.log('[PasswordEntry] Exibindo mensagem de erro:', error.message);
          
          setTimeout(() => {
            setPasscode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
            setIsError(false);
            setErrorMessage('');
          }, 1500); // Aumentei o tempo para 1.5s para o usuário ver o erro
        })
        .finally(() => {
          setIsValidating(false);
        });
    }, 300);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Volta para o campo anterior com Backspace
    if (e.key === 'Backspace' && !passcode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData) {
      const newPasscode = [...passcode];
      pastedData.split('').forEach((digit, idx) => {
        if (idx < 6) {
          newPasscode[idx] = digit;
        }
      });
      setPasscode(newPasscode);
      
      // Foca no próximo campo vazio ou no último
      const nextEmptyIndex = newPasscode.findIndex(val => !val);
      const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
      inputRefs.current[focusIndex]?.focus();
    }
  };

  return (
    <div className="bg-black text-white min-h-screen flex items-start justify-center p-4">
      <div className="w-full max-w-[400px] flex flex-col">
        {/* Header */}
        <header className="pt-3 px-4 pb-1">
          <button
            aria-label="Voltar"
            className="flex items-center justify-center w-7 h-7 -ml-1 rounded-full active:bg-slate-800 transition-colors"
            onClick={() => onNavigate('login')}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4">
          <h1 className="text-xl font-bold tracking-tight mb-3">
            {t.password}
          </h1>

          {/* Passcode Input */}
          <div className={`flex items-center gap-1 mb-2 ${isError ? 'animate-shake' : ''}`}>
            {/* First 3 digits */}
            <div className="flex gap-1">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className={`w-[36px] h-[44px] rounded-lg flex items-center justify-center transition-all ${
                    isError 
                      ? 'bg-red-900/20 shadow-[inset_0_0_0_2px_rgba(239,68,68,0.5)]' 
                      : 'bg-zinc-900 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]'
                  }`}
                >
                  <input
                    ref={(el) => (inputRefs.current[index] = el)}
                    aria-label={`Dígito ${index + 1}`}
                    className={`w-full h-full bg-transparent border-none text-center text-lg font-bold focus:ring-0 focus:outline-none ${
                      isError ? 'text-red-500' : 'text-white'
                    }`}
                    maxLength={1}
                    type="password"
                    value={passcode[index]}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    inputMode="numeric"
                    disabled={isValidating}
                  />
                </div>
              ))}
            </div>

            {/* Separator */}
            <div className="text-slate-500 font-bold">
              <span className={`block w-1 h-0.5 rounded-full ${isError ? 'bg-red-500' : 'bg-slate-500'}`}></span>
            </div>

            {/* Last 3 digits */}
            <div className="flex gap-1">
              {[3, 4, 5].map((index) => (
                <div
                  key={index}
                  className={`w-[36px] h-[44px] rounded-lg flex items-center justify-center transition-all ${
                    isError 
                      ? 'bg-red-900/20 shadow-[inset_0_0_0_2px_rgba(239,68,68,0.5)]' 
                      : 'bg-zinc-900 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]'
                  }`}
                >
                  <input
                    ref={(el) => (inputRefs.current[index] = el)}
                    aria-label={`Dígito ${index + 1}`}
                    className={`w-full h-full bg-transparent border-none text-center text-lg font-bold focus:ring-0 focus:outline-none ${
                      isError ? 'text-red-500' : 'text-white'
                    }`}
                    maxLength={1}
                    type="password"
                    value={passcode[index]}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    inputMode="numeric"
                    disabled={isValidating}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {isError && (
            <p className="text-red-500 text-[11px] font-medium mb-2 animate-fadeIn">
              {errorMessage || 'Senha incorreta'}
            </p>
          )}

          {/* Forgot Password Link */}
          <button
            className="text-blue-500 font-semibold text-[13px] hover:underline transition-all"
            onClick={() => {
              // Aqui você pode adicionar navegação para tela de recuperação de senha
              console.log('Forgot password clicked');
            }}
          >
            {t.forgotPassword}
          </button>
        </main>
      </div>
    </div>
  );
}