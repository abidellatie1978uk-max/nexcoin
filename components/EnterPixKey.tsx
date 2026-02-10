import { ChevronLeft, Info } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { BankAccount } from '../lib/bankAccountGenerator';

interface EnterPixKeyProps {
  account: BankAccount;
  keyType: 'cpf' | 'email' | 'phone' | 'random';
  onBack: () => void;
  onSuccess?: () => void;
}

export function EnterPixKey({ account, keyType, onBack, onSuccess }: EnterPixKeyProps) {
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ✅ FOCO AUTOMÁTICO NO INPUT DE TELEFONE
  useEffect(() => {
    if (keyType === 'phone' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [keyType]);

  // ✅ VALIDAÇÃO DE CPF
  const validateCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/\D/g, '');

    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false; // Rejeita CPFs com todos dígitos iguais

    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let checkDigit = 11 - (sum % 11);
    if (checkDigit === 10 || checkDigit === 11) checkDigit = 0;
    if (checkDigit !== parseInt(cleanCPF.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    checkDigit = 11 - (sum % 11);
    if (checkDigit === 10 || checkDigit === 11) checkDigit = 0;
    if (checkDigit !== parseInt(cleanCPF.charAt(10))) return false;

    return true;
  };

  // ✅ VALIDAÇÃO DE EMAIL
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // ✅ VALIDAÇÃO DE TELEFONE
  const validatePhone = (phone: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, '');
    // Aceita: +55 XX XXXXX-XXXX (11 dígitos após +55) ou +55 XX XXXX-XXXX (10 dígitos)
    return cleanPhone.length === 13 || cleanPhone.length === 12;
  };

  // ✅ MÁSCARAS DE INPUT
  const applyMask = (value: string, type: 'cpf' | 'phone'): string => {
    const cleaned = value.replace(/\D/g, '');

    if (type === 'cpf') {
      if (cleaned.length <= 3) return cleaned;
      if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
      if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
      return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
    }

    if (type === 'phone') {
      if (cleaned.length <= 2) return `+${cleaned}`;
      if (cleaned.length <= 4) return `+${cleaned.slice(0, 2)} (${cleaned.slice(2)}`;
      if (cleaned.length <= 9) return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4)}`;
      if (cleaned.length <= 13) {
        const ddd = cleaned.slice(2, 4);
        const firstPart = cleaned.slice(4, 9);
        const secondPart = cleaned.slice(9, 13);
        return `+${cleaned.slice(0, 2)} (${ddd}) ${firstPart}${secondPart ? `-${secondPart}` : ''}`;
      }
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9, 13)}`;
    }

    return value;
  };

  // ✅ VALIDAÇÃO EM TEMPO REAL
  useEffect(() => {
    setError('');
    setIsValid(false);

    if (!inputValue && keyType !== 'random') return;

    switch (keyType) {
      case 'cpf':
        const cleanCPF = inputValue.replace(/\D/g, '');
        if (cleanCPF.length === 11) {
          if (validateCPF(inputValue)) {
            setIsValid(true);
          } else {
            setError('CPF inválido');
          }
        }
        break;

      case 'email':
        if (inputValue.length > 0) {
          if (validateEmail(inputValue)) {
            setIsValid(true);
          } else if (inputValue.includes('@')) {
            setError('E-mail inválido');
          }
        }
        break;

      case 'phone':
        const cleanPhone = inputValue.replace(/\D/g, '');
        if (cleanPhone.length >= 12) {
          if (validatePhone(inputValue)) {
            setIsValid(true);
          } else {
            setError('Número de telefone inválido');
          }
        }
        break;

      case 'random':
        setIsValid(true);
        break;
    }
  }, [inputValue, keyType]);

  // ✅ HANDLER DE INPUT COM MÁSCARA
  const handleInputChange = (value: string) => {
    if (keyType === 'cpf') {
      setInputValue(applyMask(value, 'cpf'));
    } else if (keyType === 'phone') {
      setInputValue(applyMask(value, 'phone'));
    } else {
      setInputValue(value);
    }
  };

  // ✅ GERAR CHAVE ALEATÓRIA
  const generateRandomKey = (): string => {
    return crypto.randomUUID().replace(/-/g, '');
  };

  // ✅ SALVAR CHAVE PIX NO FIRESTORE
  const handleContinue = async () => {
    if (!isValid && keyType !== 'random') {
      toast.error('Preencha o campo corretamente');
      return;
    }

    if (!user?.uid) {
      toast.error('Usuário não autenticado');
      return;
    }

    setIsSaving(true);

    try {
      // Gerar chave aleatória se for do tipo 'random'
      const finalKeyValue = keyType === 'random' ? generateRandomKey() : inputValue;

      // Salvar no Firestore
      const pixKeysRef = collection(db, 'pixKeys');
      await addDoc(pixKeysRef, {
        userId: user.uid,
        accountId: account.id,
        accountNumber: account.accountNumber,
        currency: account.currency,
        country: account.country,
        keyType: keyType,
        keyValue: finalKeyValue,
        createdAt: serverTimestamp(),
      });

      console.log('✅ Chave Pix salva com sucesso:', { keyType, keyValue: finalKeyValue });

      toast.success('Chave criada com sucesso');
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 1000);
    } catch (error) {
      console.error('❌ Erro ao salvar chave Pix:', error);
      toast.error('Erro ao criar chave Pix');
    } finally {
      setIsSaving(false);
    }
  };

  const getContent = () => {
    switch (keyType) {
      case 'cpf':
        return {
          title: 'Digite o seu CPF',
          description: 'Enviaremos um código SMS para confirmar que é você. Isso ajuda a manter a sua conta segura.',
          label: 'CPF',
          placeholder: '000.000.000-00',
          infoText: 'Após o cadastro, qualquer pessoa com a sua Chave Pix poderá ver o seu nome e CPF (parcialmente oculto).',
        };
      case 'email':
        return {
          title: 'Digite o seu e-mail',
          description: 'Enviaremos um e-mail para confirmar que é você. Isso ajuda a manter a sua conta segura.',
          label: 'E-mail',
          placeholder: 'seu@email.com',
          infoText: 'Após o cadastro, qualquer pessoa com a sua Chave Pix poderá ver o seu nome e CPF (parcialmente oculto). Qualquer pessoa com o seu e-mail poderá ver que ele é uma Chave Pix.',
        };
      case 'phone':
        return {
          title: 'Digite o seu número de telefone',
          description: 'Enviaremos um código SMS para confirmar que é você. Isso ajuda a manter a sua conta segura.',
          label: 'Número de telefone',
          placeholder: '+55 (00) 00000-0000',
          infoText: 'Após o cadastro, qualquer pessoa com a sua Chave Pix poderá ver o seu nome e CPF (parcialmente oculto). Qualquer pessoa com o seu telefone poderá ver que ele é uma Chave Pix.',
        };
      case 'random':
        return {
          title: 'Chave Aleatória',
          description: 'Uma chave aleatória será gerada automaticamente para você. Você poderá compartilhá-la para receber pagamentos.',
          label: 'Chave Aleatória',
          placeholder: '',
          infoText: 'A chave aleatória mantém seus dados pessoais mais seguros. Apenas o seu nome e CPF (parcialmente oculto) serão visíveis.',
        };
    }
  };

  const content = getContent();

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#1a2942] via-black to-black flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center px-6 pt-6 pb-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-zinc-800/50 backdrop-blur-md flex items-center justify-center hover:bg-zinc-700/50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-32">
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-3">{content.title}</h1>
          <p className="text-gray-400 text-base leading-relaxed">
            {content.description}
          </p>
        </div>

        {/* Input Field */}
        {keyType !== 'random' && (
          <div className="mb-6">
            <label className="text-white font-semibold mb-3 block">{content.label}</label>
            <input
              type={keyType === 'email' ? 'email' : 'text'}
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={content.placeholder}
              className={`w-full px-6 py-4 rounded-2xl bg-transparent border-2 ${error
                  ? 'border-red-500/50'
                  : isValid
                    ? 'border-green-500/50'
                    : 'border-white/20'
                } text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40 transition-all text-base`}
              ref={keyType === 'phone' ? inputRef : undefined}
            />
            {error && (
              <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                <span>⚠️</span> {error}
              </p>
            )}
            {isValid && !error && (
              <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
                <span>✓</span> {keyType === 'cpf' ? 'CPF válido' : keyType === 'email' ? 'E-mail válido' : 'Telefone válido'}
              </p>
            )}
          </div>
        )}

        {/* Info Card */}
        <div className="bg-zinc-800/50 backdrop-blur-md rounded-2xl p-4 border border-zinc-700/50 flex gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
            <Info className="w-4 h-4 text-white" />
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">
            {content.infoText}
          </p>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent">
        <button
          onClick={handleContinue}
          disabled={!isValid && keyType !== 'random'}
          className={`w-full px-6 py-4 rounded-2xl backdrop-blur-md border text-white font-semibold transition-all shadow-lg ${isValid || keyType === 'random'
              ? 'bg-white/10 hover:bg-white/15 border-white/20'
              : 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed'
            }`}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}