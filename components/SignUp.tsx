import { useState } from 'react';
import { Eye, EyeOff, ArrowLeft, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSignUpFlow } from '../contexts/SignUpFlowContext';
import { FlagIcon } from './FlagIcon';
import { Screen } from '../App';
import { capitalizeText } from '../lib/textUtils';

interface SignUpProps {
  onNavigate: (screen: Screen) => void;
}

export function SignUp({ onNavigate }: SignUpProps) {
  const { setSignUpData } = useSignUpFlow();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [touched, setTouched] = useState({
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
    name: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({
    code: '+55',
    countryCode: 'BR',
    name: 'Brasil'
  });


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
    setFormData({ ...formData, phone: formatted });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // ✅ Usa capitalizeText para manter capitalização adequada
    const trimmed = e.target.value.replace(/\s+/g, ' ');
    const words = trimmed.split(' ');
    const limitedWords = words.slice(0, 5);
    const formatted = limitedWords.join(' ');

    // Aplicar capitalização apenas se houver conteúdo
    const capitalized = formatted.trim().length > 0 ? capitalizeText(formatted) : formatted;

    setFormData({ ...formData, name: capitalized });
  };

  // Validações
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    return numbers.length >= 10; // Mínimo 10 dígitos
  };

  const validatePassword = (password: string) => {
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return {
      hasMinLength,
      hasUpperCase,
      hasSpecialChar,
      isValid: hasMinLength && hasUpperCase && hasSpecialChar
    };
  };

  const validateName = (name: string) => {
    const words = name.trim().split(' ').filter(word => word.length > 0);
    return words.length >= 1 && words.length <= 5;
  };

  const emailValid = validateEmail(formData.email);
  const phoneValid = validatePhone(formData.phone);
  const passwordValidation = validatePassword(formData.password);
  const nameValid = validateName(formData.name);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

  const isFormValid =
    nameValid &&
    emailValid &&
    phoneValid &&
    passwordValidation.isValid &&
    passwordsMatch;

  const handleSubmit = () => {
    if (!isFormValid) return;

    // Remover formatação do telefone e adicionar código do país
    const phoneNumbers = formData.phone.replace(/\D/g, '');
    const fullPhone = `${selectedCountry.code}${phoneNumbers}`;

    // Salvar dados no contexto para usar após seleção de país
    setSignUpData({
      name: formData.name,
      email: formData.email,
      phone: fullPhone, // Telefone completo com código do país
      password: formData.password,
      country: '', // Será preenchido na CountrySelection
    });

    onNavigate('countrySelection');
  };


  return (
    <div className="min-h-screen bg-black text-white p-4 flex flex-col justify-center items-center relative">
      {/* Overlay para fechar dropdowns ao clicar fora */}
      {showCountryDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setShowCountryDropdown(false);
          }}
        />
      )}

      {/* Header with Back Button - Absolute positioned to stay at top left */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => onNavigate('welcome')}
          className="flex items-center gap-2 text-white transition-opacity active:opacity-60 p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <main className="w-full max-w-md">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {t.createAccount}
          </h2>
          <p className="text-slate-400 text-sm mb-5">
            {t.dontHaveAccount}
          </p>


          <form className="space-y-3 mb-5">
            {/* Name Input */}
            <input
              className="w-full bg-zinc-900 border-none focus:ring-2 focus:ring-blue-500 text-white px-4 py-3.5 rounded-xl placeholder-slate-500 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
              placeholder={t.fullName || t.name}
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              onBlur={() => setTouched({ ...touched, name: true })}
            />
            {touched.name && formData.name && !nameValid && (
              <p className="text-xs text-red-500 mt-1 ml-1">
                Nome inválido
              </p>
            )}

            {/* Email Input */}
            <div>
              <input
                className="w-full bg-zinc-900 border-none focus:ring-2 focus:ring-blue-500 text-white px-4 py-3.5 rounded-xl placeholder-slate-500 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
                placeholder={t.email}
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onBlur={() => setTouched({ ...touched, email: true })}
              />
              {touched.email && formData.email && !emailValid && (
                <p className="text-xs text-red-500 mt-1 ml-1">
                  E-mail inválido
                </p>
              )}
            </div>

            {/* Phone Input */}
            <div className="flex gap-2 relative">
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center gap-2 bg-zinc-900 px-3 py-[13px] rounded-xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] transition-colors active:opacity-70 h-[50px]"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                >
                  <FlagIcon countryCode={selectedCountry.countryCode} size="sm" />
                  <span className="font-medium text-sm">{selectedCountry.code}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* Country Dropdown */}
                {showCountryDropdown && (
                  <div className="absolute top-full mt-2 left-0 bg-zinc-900 rounded-xl shadow-lg border border-zinc-800 overflow-hidden z-20 min-w-[200px]">
                    {countries.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 transition-colors w-full text-left"
                        onClick={() => {
                          setSelectedCountry(country);
                          setFormData({ ...formData, phone: '' }); // Limpa o número ao trocar de país
                          setShowCountryDropdown(false);
                        }}
                      >
                        <FlagIcon countryCode={country.countryCode} size="sm" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{country.name}</div>
                          <div className="text-xs text-gray-400">{country.code}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <input
                  className="w-full bg-zinc-900 border-none focus:ring-2 focus:ring-blue-500 text-white px-4 py-3.5 rounded-xl placeholder-slate-500 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
                  placeholder={t.phone}
                  type="tel"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  onBlur={() => setTouched({ ...touched, phone: true })}
                />
              </div>
            </div>
            {touched.phone && formData.phone && !phoneValid && (
              <p className="text-xs text-red-500 -mt-2 ml-1">
                Telefone inválido
              </p>
            )}

            {/* Password Input */}
            <div className="relative">
              <input
                className="w-full bg-zinc-900 border-none focus:ring-2 focus:ring-blue-500 text-white px-4 py-3.5 pr-12 rounded-xl placeholder-slate-500 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
                placeholder={t.password}
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onBlur={() => setTouched({ ...touched, password: true })}
              />
              <button
                type="button"
                className="absolute right-4 top-[14px] text-gray-400 hover:text-gray-300 transition-colors cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPassword(!showPassword);
                }}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              {touched.password && formData.password && !passwordValidation.isValid && (
                <p className="text-xs text-red-500 mt-1 ml-1">
                  A senha deve ter pelo menos 8 caracteres, 1 maiúscula e 1 caractere especial
                </p>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="relative">
              <input
                className="w-full bg-zinc-900 border-none focus:ring-2 focus:ring-blue-500 text-white px-4 py-3.5 pr-12 rounded-xl placeholder-slate-500 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
                placeholder={t.confirmPassword}
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                onBlur={() => setTouched({ ...touched, confirmPassword: true })}
              />
              <button
                type="button"
                className="absolute right-4 top-[14px] text-gray-400 hover:text-gray-300 transition-colors cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowConfirmPassword(!showConfirmPassword);
                }}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              {touched.confirmPassword && formData.confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-500 mt-1 ml-1">
                  As senhas não coincidem
                </p>
              )}
            </div>

            {/* Continue Button */}
            <button
              type="button"
              className={`w-full py-3.5 rounded-full font-semibold transition-all duration-300 ${isFormValid
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 active:scale-[0.98]'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              onClick={handleSubmit}
              disabled={!isFormValid}
            >
              {t.continue}
            </button>
          </form>


        </div>
      </main>

    </div>
  );
}