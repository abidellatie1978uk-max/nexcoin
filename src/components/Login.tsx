import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Mail, Phone, ChevronDown } from 'lucide-react';
import type { Screen } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
import { useLoginFlow } from '../contexts/LoginFlowContext';
import { useAuth } from '../contexts/AuthContext';
import { FlagIcon } from './FlagIcon';
import { Globe } from 'lucide-react';

interface LoginProps {
  onNavigate: (screen: Screen) => void;
}

export function Login({ onNavigate }: LoginProps) {
  const { language, setLanguage, t } = useLanguage();
  const { setPhoneNumber: setLoginPhone } = useLoginFlow();
  const { checkPhoneExists } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [touched, setTouched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({
    code: '+55',
    countryCode: 'BR',
    name: 'Brasil'
  });
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // ✅ FOCO AUTOMÁTICO NO INPUT DE TELEFONE
  useEffect(() => {
    if (phoneInputRef.current) {
      phoneInputRef.current.focus();
    }
  }, []);

  const getLanguages = () => [
    { code: 'pt-BR' as Language, countryCode: 'BR', name: t.portuguese },
    { code: 'en-US' as Language, countryCode: 'US', name: t.english },
    { code: 'es' as Language, countryCode: 'ES', name: t.spanish },
  ];

  const countries = [
    { code: '+55', countryCode: 'BR', name: 'Brasil', mask: '(XX) XXXXX-XXXX', maxLength: 15 },
    { code: '+1', countryCode: 'US', name: 'USA', mask: '(XXX) XXX-XXXX', maxLength: 14 },
    { code: '+44', countryCode: 'GB', name: 'Reino Unido', mask: 'XXXX XXX XXXX', maxLength: 13 },
    { code: '+33', countryCode: 'FR', name: 'França', mask: 'XX XX XX XX XX', maxLength: 14 },
    { code: '+49', countryCode: 'DE', name: 'Alemanha', mask: 'XXX XXXXXXX', maxLength: 11 },
    { code: '+39', countryCode: 'IT', name: 'Itália', mask: 'XXX XXX XXXX', maxLength: 12 },
    { code: '+34', countryCode: 'ES', name: 'Espanha', mask: 'XXX XX XX XX', maxLength: 11 },
    { code: '+351', countryCode: 'PT', name: 'Portugal', mask: 'XXX XXX XXX', maxLength: 11 },
  ];

  const formatPhoneNumber = (value: string, countryCode: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    const country = countries.find(c => c.countryCode === countryCode);
    if (!country) return numbers;

    // Aplica a máscara conforme o país
    switch (countryCode) {
      case 'BR':
        if (numbers.length <= 2) return numbers;
        if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
        if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
      
      case 'US':
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
        return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
      
      case 'GB':
        if (numbers.length <= 4) return numbers;
        if (numbers.length <= 7) return `${numbers.slice(0, 4)} ${numbers.slice(4)}`;
        return `${numbers.slice(0, 4)} ${numbers.slice(4, 7)} ${numbers.slice(7, 11)}`;
      
      case 'FR':
        if (numbers.length <= 2) return numbers;
        if (numbers.length <= 4) return `${numbers.slice(0, 2)} ${numbers.slice(2)}`;
        if (numbers.length <= 6) return `${numbers.slice(0, 2)} ${numbers.slice(2, 4)} ${numbers.slice(4)}`;
        if (numbers.length <= 8) return `${numbers.slice(0, 2)} ${numbers.slice(2, 4)} ${numbers.slice(4, 6)} ${numbers.slice(6)}`;
        return `${numbers.slice(0, 2)} ${numbers.slice(2, 4)} ${numbers.slice(4, 6)} ${numbers.slice(6, 8)} ${numbers.slice(8, 10)}`;
      
      case 'DE':
        if (numbers.length <= 3) return numbers;
        return `${numbers.slice(0, 3)} ${numbers.slice(3, 10)}`;
      
      case 'IT':
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 6) return `${numbers.slice(0, 3)} ${numbers.slice(3)}`;
        return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 10)}`;
      
      case 'ES':
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 5) return `${numbers.slice(0, 3)} ${numbers.slice(3)}`;
        if (numbers.length <= 7) return `${numbers.slice(0, 3)} ${numbers.slice(3, 5)} ${numbers.slice(5)}`;
        return `${numbers.slice(0, 3)} ${numbers.slice(3, 5)} ${numbers.slice(5, 7)} ${numbers.slice(7, 9)}`;
      
      case 'PT':
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 6) return `${numbers.slice(0, 3)} ${numbers.slice(3)}`;
        return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 9)}`;
      
      default:
        return numbers;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value, selectedCountry.countryCode);
    setPhoneNumber(formatted);
  };

  // Validação do telefone
  const validatePhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    return numbers.length >= 10; // Mínimo 10 dígitos
  };

  const isPhoneValid = validatePhone(phoneNumber);

  const handleContinueClick = async () => {
    if (phoneNumber && isPhoneValid) {
      // Salvar telefone com código do país
      const fullPhone = `${selectedCountry.code}${phoneNumber.replace(/\\D/g, '')}`;
      setLoginPhone(fullPhone);
      setIsValidating(true);
      setErrorMessage(''); // Limpar erros anteriores
      
      try {
        const exists = await checkPhoneExists(fullPhone);
        setIsValidating(false);
        
        if (exists) {
          onNavigate('passwordEntry');
        } else {
          setErrorMessage(t.email || 'Telefone não encontrado');
        }
      } catch (error: any) {
        setIsValidating(false);
        
        // Mostrar mensagem de erro
        setErrorMessage(t.email || 'Telefone não encontrado');
      }
    }
  };

  return (
    <div className="bg-black text-white p-4 pb-20">
      {/* Overlay para fechar dropdowns ao clicar fora */}
      {(showCountryDropdown || showLanguageDropdown) && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => {
            setShowCountryDropdown(false);
            setShowLanguageDropdown(false);
          }}
        />
      )}

      {/* Header with Back Button */}
      <div className="w-full max-w-md mx-auto pt-2 pb-4">
        <button
          onClick={() => onNavigate('welcome')}
          className="flex items-center gap-2 text-white transition-opacity active:opacity-60"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <main className="w-full max-w-md mx-auto pt-4">
        <div className="space-y-2 mb-5">
          <h2 className="text-2xl tracking-tight text-white">
            {t.welcome}
          </h2>
          <p className="text-slate-400 text-sm">
            {t.dontHaveAccount}
          </p>
        </div>

        {/* Phone Input */}
        <div className="flex gap-2 mb-3">
          <div className="relative">
            <button
              className="h-12 flex items-center gap-2 bg-zinc-900 px-3 rounded-xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] transition-colors active:opacity-70"
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
            >
              <FlagIcon countryCode={selectedCountry.countryCode} size="sm" />
              <span className="text-sm">{selectedCountry.code}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {/* Country Dropdown */}
            {showCountryDropdown && (
              <div className="absolute top-full mt-2 left-0 bg-zinc-900 rounded-xl shadow-lg border border-zinc-800 overflow-hidden z-20 min-w-[200px]">
                {countries.map((country) => (
                  <button
                    key={country.code}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 transition-colors w-full text-left"
                    onClick={() => {
                      setSelectedCountry(country);
                      setPhoneNumber(''); // Limpa o número ao trocar de país
                      setShowCountryDropdown(false);
                    }}
                  >
                    <FlagIcon countryCode={country.countryCode} size="sm" />
                    <div className="flex-1">
                      <div className="text-sm">{country.name}</div>
                      <div className="text-xs text-gray-400">{country.code}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1">
            <input
              ref={phoneInputRef}
              className="w-full h-12 bg-zinc-900 border-none focus:ring-2 focus:ring-blue-500 text-white px-4 rounded-xl placeholder-slate-500 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
              placeholder={t.email}
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              onBlur={() => setTouched(true)}
            />
          </div>
        </div>
        {touched && phoneNumber && !isPhoneValid && (
          <p className="text-red-500 text-xs -mt-2 mb-3">
            {t.email}
          </p>
        )}
        {errorMessage && (
          <p className="text-red-500 text-xs -mt-2 mb-3">
            {errorMessage}
          </p>
        )}

        {/* Terms */}
        <a
          className="text-blue-500 text-sm mb-5 block transition-opacity active:opacity-60"
          href="#"
        >
          {t.forgotPassword}
        </a>

        {/* Continue Button */}
        <button
          className={`w-full py-3.5 rounded-full mb-5 transition-all duration-300 ${
            phoneNumber && isPhoneValid
              ? 'bg-white text-black hover:opacity-90 active:scale-[0.98]'
              : 'bg-zinc-800 text-gray-500 cursor-not-allowed'
          }`}
          disabled={!phoneNumber || !isPhoneValid}
          onClick={handleContinueClick}
        >
          {isValidating ? (
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.928l3-2.647z"></path>
            </svg>
          ) : (
            t.continue
          )}
        </button>

        {/* Sign Up */}
        <div className="text-center mb-5">
          <button 
            onClick={() => onNavigate('signup')}
            className="w-full bg-zinc-900 text-white py-3.5 rounded-full transition-colors hover:bg-zinc-800 active:scale-[0.98]"
          >
            {t.createAccount}
          </button>
        </div>

        {/* Language Selector */}
        <div className="flex justify-center items-center mb-4 relative">
          <button 
            className="flex items-center gap-2 text-slate-300 text-sm px-3 py-2 rounded-lg transition-colors active:bg-zinc-800"
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
          >
            <Globe className="w-4 h-4" />
            {getLanguages().find(lang => lang.code === language)?.name}
            <ChevronDown className="w-4 h-4" />
          </button>

          {showLanguageDropdown && (
            <div className="absolute bottom-full mb-2 bg-zinc-900 rounded-xl shadow-lg border border-zinc-800 overflow-hidden z-20 min-w-[160px]">
              {getLanguages().map((lang) => (
                <button
                  key={lang.code}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 transition-colors w-full text-left"
                  onClick={() => {
                    setLanguage(lang.code);
                    setShowLanguageDropdown(false);
                  }}
                >
                  <div className="flex-1">
                    <div className="text-sm">{lang.name}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md mx-auto mt-8 pb-3 flex flex-col items-center gap-2">
        <a className="text-xs text-slate-400 hover:underline" href="#">
          Política de Privacidade
        </a>
      </footer>
    </div>
  );
}