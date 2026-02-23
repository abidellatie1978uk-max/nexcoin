import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, collection, addDoc, query, where, getDocs, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Screen } from '../App';
import { generateBankAccountByCountry } from '../lib/bankAccountGenerator';
import { capitalizeText } from '../lib/textUtils';
import { searchCep } from '../lib/cepApi';

interface ProfileQuizProps {
  onNavigate: (screen: Screen) => void;
}

type DocumentType = 'cpf' | 'cnpj' | 'passport';

interface Question {
  id: string;
  question: string;
  subtitle?: string;
  type: 'date' | 'choice' | 'text' | 'document' | 'zipcode';
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export function ProfileQuiz({ onNavigate }: ProfileQuizProps) {
  const { userData, user, reloadUserData } = useAuth();

  // Mapear documentos por país
  const getDocumentsByCountry = (countryCode: string) => {
    const documentMap: Record<string, { value: string; label: string; format: string }[]> = {
      BR: [
        { value: 'cpf', label: 'CPF', format: '123.456.789-01' },
        { value: 'cnpj', label: 'CNPJ', format: '12.345.678/0001-01' },
        { value: 'rg', label: 'RG', format: '12.345.678-9' },
      ],
      US: [
        { value: 'ssn', label: 'SSN', format: '123-45-6789' },
        { value: 'ein', label: 'EIN', format: '12-3456789' },
        { value: 'passport', label: 'Passaporte', format: 'AB1234567' },
      ],
      PT: [
        { value: 'nif', label: 'NIF', format: '123456789' },
        { value: 'nipc', label: 'NIPC', format: '123456789' },
        { value: 'cc', label: 'Cartão de Cidadão', format: '12345678 9 AB1' },
      ],
      ES: [
        { value: 'nie', label: 'NIE', format: 'X1234567A' },
        { value: 'nif', label: 'NIF/CIF', format: '12345678A' },
        { value: 'passport', label: 'Passaporte', format: 'ABC123456' },
      ],
      FR: [
        { value: 'insee', label: 'N° de Sécurité Sociale', format: '1 23 45 67 890 123 45' },
        { value: 'siren', label: 'SIREN', format: '123 456 789' },
        { value: 'passport', label: 'Passaporte', format: '12AB34567' },
      ],
      DE: [
        { value: 'steueridentifikationsnummer', label: 'Steuer-ID', format: '12 345 678 901' },
        { value: 'personalausweis', label: 'Personalausweis', format: 'L01X00T471' },
        { value: 'passport', label: 'Passaporte', format: 'C01X00T47' },
      ],
      IT: [
        { value: 'codice_fiscale', label: 'Codice Fiscale', format: 'RSSMRA85T10A562S' },
        { value: 'partita_iva', label: 'Partita IVA', format: '12345678901' },
        { value: 'passport', label: 'Passaporte', format: 'AB1234567' },
      ],
      GB: [
        { value: 'nino', label: 'National Insurance Number', format: 'AB 12 34 56 C' },
        { value: 'utr', label: 'UTR', format: '1234567890' },
        { value: 'passport', label: 'Passaporte', format: '123456789' },
      ],
      NL: [
        { value: 'bsn', label: 'BSN', format: '123456782' },
        { value: 'kvk', label: 'KvK', format: '12345678' },
        { value: 'passport', label: 'Passaporte', format: 'AB1234567' },
      ],
      BE: [
        { value: 'rrn', label: 'Registre National', format: '12.34.56-789.01' },
        { value: 'vat', label: 'N° TVA', format: 'BE0123456789' },
        { value: 'passport', label: 'Passaporte', format: 'AB123456' },
      ],
      CH: [
        { value: 'ahv', label: 'AHV-Nummer', format: '756.1234.5678.97' },
        { value: 'uid', label: 'UID', format: 'CHE-123.456.789' },
        { value: 'passport', label: 'Passaporte', format: 'S1234567' },
      ],
      AT: [
        { value: 'sozialversicherungsnummer', label: 'Sozialversicherungsnummer', format: '1234 010180' },
        { value: 'uid', label: 'UID', format: 'ATU12345678' },
        { value: 'passport', label: 'Passaporte', format: 'P1234567' },
      ],
    };

    return documentMap[countryCode] || [
      { value: 'passport', label: 'Passaporte', format: 'AB123456' },
      { value: 'national_id', label: 'ID Nacional', format: '123456789' },
    ];
  };

  // Pegar documentos do país do usuário
  const userCountry = userData?.country || 'BR';
  const availableDocuments = getDocumentsByCountry(userCountry);

  // Definir campos de endereço por país
  const getAddressFieldsByCountry = (countryCode: string) => {
    const addressFields: Record<string, Question[]> = {
      BR: [
        {
          id: 'zipCode',
          question: 'Qual é o seu CEP?',
          type: 'zipcode',
          placeholder: '01310-100',
        },
        {
          id: 'streetNumber',
          question: 'Qual é o número da residência?',
          type: 'text',
          placeholder: '245',
        },
        {
          id: 'complement',
          question: 'Complemento (opcional)',
          subtitle: 'Apartamento, sala, bloco, etc.',
          type: 'text',
          placeholder: 'Apto 101, Bloco A',
        },
      ],
      US: [
        {
          id: 'zipCode',
          question: 'What is your ZIP Code?',
          type: 'text',
          placeholder: '10001',
        },
        {
          id: 'streetNumber',
          question: 'Street number',
          type: 'text',
          placeholder: '350',
        },
        {
          id: 'streetName',
          question: 'Street name',
          type: 'text',
          placeholder: 'Fifth Avenue',
        },
        {
          id: 'complement',
          question: 'Apartment/Suite (optional)',
          type: 'text',
          placeholder: 'Apt 5B',
        },
        {
          id: 'city',
          question: 'City',
          type: 'text',
          placeholder: 'New York',
        },
        {
          id: 'state',
          question: 'State',
          type: 'text',
          placeholder: 'NY',
        },
      ],
      PT: [
        {
          id: 'zipCode',
          question: 'Qual é o código postal?',
          type: 'text',
          placeholder: '1000-001',
        },
        {
          id: 'streetNumber',
          question: 'Número da porta',
          type: 'text',
          placeholder: '123',
        },
        {
          id: 'complement',
          question: 'Andar/Apartamento (opcional)',
          type: 'text',
          placeholder: '3º Esq',
        },
        {
          id: 'city',
          question: 'Cidade',
          type: 'text',
          placeholder: 'Lisboa',
        },
      ],
      ES: [
        {
          id: 'zipCode',
          question: '¿Cuál es tu código postal?',
          type: 'text',
          placeholder: '28001',
        },
        {
          id: 'streetNumber',
          question: 'Número',
          type: 'text',
          placeholder: '25',
        },
        {
          id: 'complement',
          question: 'Piso/Puerta (opcional)',
          type: 'text',
          placeholder: '3º A',
        },
        {
          id: 'city',
          question: 'Ciudad',
          type: 'text',
          placeholder: 'Madrid',
        },
      ],
      FR: [
        {
          id: 'zipCode',
          question: 'Code postal',
          type: 'text',
          placeholder: '75001',
        },
        {
          id: 'streetNumber',
          question: 'Numéro',
          type: 'text',
          placeholder: '15',
        },
        {
          id: 'complement',
          question: 'Appartement/Étage (facultatif)',
          type: 'text',
          placeholder: 'Appt 5',
        },
        {
          id: 'city',
          question: 'Ville',
          type: 'text',
          placeholder: 'Paris',
        },
      ],
      DE: [
        {
          id: 'zipCode',
          question: 'Postleitzahl',
          type: 'text',
          placeholder: '10115',
        },
        {
          id: 'streetNumber',
          question: 'Hausnummer',
          type: 'text',
          placeholder: '42',
        },
        {
          id: 'complement',
          question: 'Wohnung (optional)',
          type: 'text',
          placeholder: 'Wohnung 12',
        },
        {
          id: 'city',
          question: 'Stadt',
          type: 'text',
          placeholder: 'Berlin',
        },
      ],
      IT: [
        {
          id: 'zipCode',
          question: 'Codice postale',
          type: 'text',
          placeholder: '00100',
        },
        {
          id: 'streetNumber',
          question: 'Numero civico',
          type: 'text',
          placeholder: '10',
        },
        {
          id: 'complement',
          question: 'Interno/Piano (opzionale)',
          type: 'text',
          placeholder: 'Int. 5',
        },
        {
          id: 'city',
          question: 'Città',
          type: 'text',
          placeholder: 'Roma',
        },
      ],
      GB: [
        {
          id: 'streetNumber',
          question: 'House/Flat number',
          type: 'text',
          placeholder: '221B',
        },
        {
          id: 'streetName',
          question: 'Street name',
          type: 'text',
          placeholder: 'Baker Street',
        },
        {
          id: 'city',
          question: 'City',
          type: 'text',
          placeholder: 'London',
        },
        {
          id: 'zipCode',
          question: 'Postcode',
          type: 'text',
          placeholder: 'NW1 6XE',
        },
      ],
    };

    // Formato padrão para países não mapeados
    return addressFields[countryCode] || [
      {
        id: 'zipCode',
        question: 'ZIP/Postal Code',
        type: 'text',
        placeholder: '12345',
      },
      {
        id: 'streetNumber',
        question: 'Street number',
        type: 'text',
        placeholder: '123',
      },
      {
        id: 'complement',
        question: 'Apartment/Unit (optional)',
        type: 'text',
        placeholder: 'Apt 5',
      },
      {
        id: 'city',
        question: 'City',
        type: 'text',
        placeholder: 'City name',
      },
      {
        id: 'state',
        question: 'State/Province',
        type: 'text',
        placeholder: 'State',
      },
    ];
  };

  const addressFields = getAddressFieldsByCountry(userCountry);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({
    birthDate: '',
    documentType: availableDocuments[0]?.value || 'cpf',
    document: '',
    zipCode: '',
    streetNumber: '',
    streetName: '',
    complement: '',
    city: '',
    state: '',
  });
  const [error, setError] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<NodeJS.Timeout | null>(null);

  // ✅ Construir perguntas dinamicamente baseado no país
  const questions: Question[] = [
    {
      id: 'birthDate',
      question: userCountry === 'BR' ? 'Qual é a sua data de nascimento?' :
        userCountry === 'US' ? 'What is your birth date?' :
          userCountry === 'ES' ? '¿Cuál es tu fecha de nascimento?' :
            'Qual é a sua data de nascimento?',
      subtitle: userCountry === 'BR' ? 'Você precisa ter pelo menos 18 anos' :
        userCountry === 'US' ? 'You must be at least 18 years old' :
          userCountry === 'ES' ? 'Debes tener al menos 18 años' :
            'Você precisa ter pelo menos 18 anos',
      type: 'date',
    },
    {
      id: 'documentType',
      question: userCountry === 'BR' ? 'Qual tipo de documento você possui?' :
        userCountry === 'US' ? 'What type of document do you have?' :
          userCountry === 'ES' ? '¿Qué tipo de documento tienes?' :
            'Qual tipo de documento você possui?',
      subtitle: userCountry === 'BR' ? 'Selecione o documento de identificação' :
        userCountry === 'US' ? 'Select your identification document' :
          userCountry === 'ES' ? 'Selecciona el documento de identificação' :
            'Selecione o documento de identificação',
      type: 'choice',
      options: availableDocuments.map(doc => ({ value: doc.value, label: doc.label })),
    },
    {
      id: 'document',
      question: `${userCountry === 'BR' ? 'Digite o número do seu' :
        userCountry === 'US' ? 'Enter your' :
          userCountry === 'ES' ? 'Ingresa tu número de' :
            'Digite o número do seu'} ${availableDocuments.find(d => d.value === answers.documentType)?.label || 'documento'}`,
      subtitle: `${userCountry === 'BR' ? 'Formato:' :
        userCountry === 'US' ? 'Format:' :
          userCountry === 'ES' ? 'Formato:' :
            'Formato:'} ${availableDocuments.find(d => d.value === answers.documentType)?.format || ''}`,
      type: 'document',
      placeholder: availableDocuments.find(d => d.value === answers.documentType)?.format || '',
    },
    ...addressFields, // ✅ Adicionar campos de endereço dinâmicos por país
  ];

  // Validar CPF
  const validateCPF = (cpf: string): boolean => {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(10))) return false;

    return true;
  };

  // Validar CNPJ
  const validateCNPJ = (cnpj: string): boolean => {
    cnpj = cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpj)) return false;

    let length = cnpj.length - 2;
    let numbers = cnpj.substring(0, length);
    const digits = cnpj.substring(length);
    let sum = 0;
    let pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    length = length + 1;
    numbers = cnpj.substring(0, length);
    sum = 0;
    pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
  };

  // Validar Passaporte
  const validatePassport = (passport: string): boolean => {
    passport = passport.trim().toUpperCase();
    return /^[A-Z0-9]{6,9}$/.test(passport);
  };

  // Formatar CPF
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return numbers.slice(0, 11);
  };

  // Formatar CNPJ
  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 14) {
      return numbers
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
    return numbers.slice(0, 14);
  };

  // Formatar CEP
  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
    }
    return numbers.slice(0, 8);
  };

  // Validar resposta atual
  const validateCurrentAnswer = (): boolean => {
    setError('');
    const question = questions[currentQuestion];
    const value = answers[question.id as keyof typeof answers];

    if (question.id === 'birthDate') {
      if (!value) {
        setError('Data de nascimento é obrigatória');
        return false;
      }
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (age < 18 || (age === 18 && monthDiff < 0)) {
        setError('Você precisa ter pelo menos 18 anos');
        return false;
      }
    }

    if (question.id === 'document') {
      if (!value) {
        setError('Documento é obrigatório');
        return false;
      }
      if (answers.documentType === 'cpf' && !validateCPF(value)) {
        setError('CPF inválido');
        return false;
      }
      if (answers.documentType === 'cnpj' && !validateCNPJ(value)) {
        setError('CNPJ inválido');
        return false;
      }
      if (answers.documentType === 'passport' && !validatePassport(value)) {
        setError('Passaporte inválido');
        return false;
      }
    }

    // Complemento é opcional - pular validação
    if (question.id === 'complement') {
      return true;
    }

    if (question.type === 'text' || question.type === 'zipcode') {
      if (!value.trim()) {
        setError('Este campo é obrigatório');
        return false;
      }
    }

    return true;
  };

  // Avançar para próxima pergunta
  const handleNext = (isAutoAdvance = false) => {
    // Se for auto-advance, não valida novamente (já foi validado no isAnswerValid)
    if (!isAutoAdvance && !validateCurrentAnswer()) return;

    if (currentQuestion < questions.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
        setIsAnimating(false);
      }, 200);
    } else {
      handleFinish();
    }
  };

  // Voltar pergunta
  const handleBack = () => {
    if (currentQuestion > 0) {
      setIsAnimating(true);
      setError('');
      setTimeout(() => {
        setCurrentQuestion(currentQuestion - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  // Finalizar e salvar
  const handleFinish = async () => {
    if (!user || !userData) return;

    setIsSaving(true);
    setError('');

    try {
      // 1. Atualizar dados do perfil do usuário
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        ...answers,
        profileCompleted: true,
        profileCompletedAt: new Date(),
      });

      // 2. Criar conta bancária automaticamente no país de origem (IDEMPOTENTE)
      try {
        const accountId = `${user.uid}_${userCountry}`;
        const accountDocRef = doc(db, 'bankAccounts', accountId);
        const accountSnapshot = await getDoc(accountDocRef);

        // ✅ Só criar se NÃO existir
        if (!accountSnapshot.exists()) {
          console.log('💼 Criando conta bancária única para:', userCountry);
          const bankAccount = generateBankAccountByCountry(userCountry, user.uid);
          await setDoc(accountDocRef, {
            ...bankAccount,
            id: accountId, // ID determinístico
            userId: user.uid,
            isPrimary: true,
            createdAt: new Date(),
          });
          console.log('✅ Conta bancária criada:', accountId);
        } else {
          console.log('ℹ️ Conta bancária já existe:', accountId);
        }
      } catch (bankError: any) {
        console.error('⚠️ Erro ao criar conta bancária:', bankError);
      }

      // 3. Atualizar userData localmente
      Object.assign(userData, answers);

      // 4. Recarregar do Firebase para garantir sincronização
      await reloadUserData();

      // 5. Redirecionar para home
      console.log('✅ Cadastro concluído! Redirecionando para home...');
      onNavigate('home');
    } catch (error) {
      console.error('❌ Erro ao salvar dados:', error);
      setError('Erro ao salvar dados. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // Atualizar resposta
  const handleAnswerChange = (value: string) => {
    const question = questions[currentQuestion];

    if (question.type === 'document') {
      if (answers.documentType === 'cpf') {
        value = formatCPF(value);
      } else if (answers.documentType === 'cnpj') {
        value = formatCNPJ(value);
      } else {
        value = value.toUpperCase();
      }
    }

    if (question.type === 'zipcode') {
      value = formatZipCode(value);
    }

    // ✅ Capitalizar automaticamente campos de texto (nomes de ruas, cidades, complementos)
    if (question.type === 'text' && (
      question.id === 'streetName' ||
      question.id === 'city' ||
      question.id === 'state' ||
      question.id === 'complement'
    )) {
      value = capitalizeText(value);
    }

    setAnswers({ ...answers, [question.id]: value });
    setError('');
  };

  // Verificar se resposta é válida (sem mostrar erro)
  const isAnswerValid = (question: Question, value: string, currentAnswers: typeof answers): boolean => {
    if (question.id === 'birthDate') {
      if (!value) return false;
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (age < 18 || (age === 18 && monthDiff < 0)) return false;
      return true;
    }

    if (question.id === 'document') {
      if (!value) return false;

      // Remover formatação para validar
      const cleanValue = value.replace(/\D/g, '');

      // Validar CPF - precisa ter 11 dígitos
      if (currentAnswers.documentType === 'cpf') {
        if (cleanValue.length !== 11) return false;
        console.log('🔍 Validando CPF:', cleanValue, 'Resultado:', validateCPF(value));
        return validateCPF(value);
      }

      // Validar CNPJ - precisa ter 14 dígitos
      if (currentAnswers.documentType === 'cnpj') {
        if (cleanValue.length !== 14) return false;
        return validateCNPJ(value);
      }

      // Validar Passaporte
      if (currentAnswers.documentType === 'passport') {
        return validatePassport(value);
      }

      // Outros documentos - mínimo 5 caracteres
      return cleanValue.length >= 5;
    }

    if (question.type === 'zipcode') {
      const numbers = value.replace(/\D/g, '');
      return numbers.length >= 8; // CEP precisa ter 8 dígitos completos
    }

    if (question.type === 'text') {
      return value.trim().length >= 2;
    }

    return !!value;
  };

  // Selecionar opção
  const handleOptionSelect = (value: string) => {
    const question = questions[currentQuestion];
    setAnswers({ ...answers, [question.id]: value });
    setError('');

    // Auto-avançar após selecionar opção
    setTimeout(() => {
      handleNext();
    }, 300);
  };

  const currentQuestionData = questions[currentQuestion];
  const currentValue = answers[currentQuestionData.id as keyof typeof answers];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  // ✅ Buscar CEP automaticamente quando for Brasil e CEP estiver completo
  useEffect(() => {
    const fetchCep = async () => {
      // Só buscar se for Brasil e o campo atual for zipCode
      if (userCountry !== 'BR' || currentQuestionData.id !== 'zipCode') return;

      const cleanCep = answers.zipCode.replace(/\D/g, '');

      // CEP brasileiro tem 8 dígitos
      if (cleanCep.length !== 8) return;

      setIsLoadingCep(true);
      setError('');

      try {
        const cepData = await searchCep(answers.zipCode);

        if (cepData) {
          // ✅ Preencher automaticamente os dados do endereço
          setAnswers(prev => ({
            ...prev,
            streetName: cepData.logradouro || '',
            city: cepData.localidade || '',
            state: cepData.uf || '',
          }));

          console.log('✅ Endereço encontrado:', cepData);
        } else {
          setError('CEP não encontrado. Verifique e tente novamente.');
        }
      } catch (error) {
        console.error('❌ Erro ao buscar CEP:', error);
        setError('Erro ao buscar CEP. Tente novamente.');
      } finally {
        setIsLoadingCep(false);
      }
    };

    fetchCep();
  }, [answers.zipCode, userCountry, currentQuestionData.id]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          {currentQuestion > 0 && (
            <button
              onClick={handleBack}
              disabled={isAnimating}
              className="text-white/50 hover:text-white/80 transition-colors disabled:opacity-30 text-sm flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </button>
          )}
          <div className="flex-1 text-right">
            <h1 className="text-xl font-bold">Complete seu perfil</h1>
            <p className="text-sm text-gray-400 mt-1">
              Etapa {currentQuestion + 1} de {questions.length}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Question Content */}
      <div className="flex-1 px-6 pb-24 overflow-y-auto">
        <div
          className={`transition-opacity duration-200 ${isAnimating ? 'opacity-0' : 'opacity-100'
            }`}
        >
          {/* Question */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">
              {currentQuestionData.question}
            </h2>
            {currentQuestionData.subtitle && (
              <p className="text-gray-400 text-sm">
                {currentQuestionData.subtitle}
              </p>
            )}
          </div>

          {/* Answer Input */}
          {currentQuestionData.type === 'date' && (
            <input
              type="date"
              value={currentValue}
              onChange={(e) => handleAnswerChange(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full bg-zinc-900 rounded-xl px-4 py-3.5 border border-white/10 focus:border-orange-500 outline-none"
            />
          )}

          {currentQuestionData.type === 'choice' && (
            <div className="space-y-3">
              {currentQuestionData.options?.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleOptionSelect(option.value)}
                  className={`w-full p-4 rounded-xl text-left transition-all border ${currentValue === option.value
                    ? 'bg-gradient-to-r from-orange-500 to-purple-500 border-transparent'
                    : 'bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]'
                    }`}
                >
                  <span className="font-semibold">{option.label}</span>
                </button>
              ))}
            </div>
          )}

          {(currentQuestionData.type === 'text' ||
            currentQuestionData.type === 'document' ||
            currentQuestionData.type === 'zipcode') && (
              <div className="relative">
                <input
                  type="text"
                  value={currentValue}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder={currentQuestionData.placeholder}
                  className="w-full bg-zinc-900 rounded-xl px-4 py-3.5 border border-white/10 focus:border-orange-500 outline-none"
                  autoFocus
                />
                {/* Loading CEP indicator */}
                {isLoadingCep && currentQuestionData.id === 'zipCode' && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Loading indicator quando estiver processando */}
          {isSaving && (
            <div className="mt-6 text-center">
              <div className="inline-block w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-400 mt-2">Salvando seus dados...</p>
            </div>
          )}
        </div>
      </div>

      {/* Botão Continuar Fixo */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pb-6 pt-4 bg-gradient-to-t from-black via-black to-transparent">
        <button
          onClick={() => handleNext(false)}
          disabled={isAnimating || isSaving}
          className="w-full bg-white text-black font-bold py-4 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-200"
        >
          {currentQuestion === questions.length - 1 ? 'Finalizar' : 'Continuar'}
        </button>
      </div>
    </div>
  );
}