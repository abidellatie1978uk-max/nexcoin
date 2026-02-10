import { ArrowLeft, Copy, Check, CreditCard, Building2, Smartphone, Banknote, AlertCircle, CheckCircle, RefreshCw, Share2, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Screen } from '../App';
import { useFiatRates } from '../contexts/FiatRatesContext';
import { usePortfolio } from '../contexts/PortfolioContext';
import { useAuth } from '../contexts/AuthContext';
import { useFiatBalances } from '../hooks/useFiatBalances';
import { useTransactions } from '../hooks/useTransactions';
import { updateFiatBalance } from '../lib/fiatBalanceUtils';
import { validatePixKey as validatePixKeyNexCoin, processPixTransfer, generatePixTransactionId } from '../lib/pixTransferUtils'; // ✅ Importar funções de transferência entre usuários
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { BankAccount } from '../lib/bankAccountGenerator';
import { motion, AnimatePresence } from 'motion/react';
import { WithdrawReceipt } from './WithdrawReceipt';
import { toast } from 'sonner';
import { FormattedAmount } from './FormattedAmount';

interface WithdrawFiatProps {
  onNavigate: (screen: Screen) => void;
}

type Country = 'BR' | 'US' | 'EU' | 'GB';

export function WithdrawFiat({ onNavigate }: WithdrawFiatProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>('BR');
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const { rates } = useFiatRates();
  const { portfolio } = usePortfolio();
  const { user } = useAuth();
  const { fiatBalances, getBalance } = useFiatBalances();
  const { addTransaction } = useTransactions();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  // Campos específicos por método
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState<string | null>(null);
  const [pixKeyError, setPixKeyError] = useState<string | null>(null);
  const [bankData, setBankData] = useState({
    bank: '',
    bankCode: '',
    agency: '',
    account: '',
    accountType: 'Conta Corrente',
    name: '',
    document: ''
  });
  const [usAccountData, setUsAccountData] = useState({
    accountNumber: '',
    routingNumber: '',
    accountType: 'Checking',
    name: '',
    address: ''
  });
  const [euAccountData, setEuAccountData] = useState({
    iban: '',
    bic: '',
    name: '',
    address: ''
  });
  const [ukAccountData, setUkAccountData] = useState({
    accountNumber: '',
    sortCode: '',
    name: '',
    address: ''
  });

  const countries = [
    { code: 'BR' as Country, name: 'Brasil', flag: '🇧🇷', currency: 'BRL', symbol: 'R$' },
    { code: 'US' as Country, name: 'Estados Unidos', flag: '🇺🇸', currency: 'USD', symbol: '$' },
    { code: 'EU' as Country, name: 'União Europeia', flag: '🇪🇺', currency: 'EUR', symbol: '€' },
    { code: 'GB' as Country, name: 'Reino Unido', flag: '🇬🇧', currency: 'GBP', symbol: '£' },
  ];

  const currentCountry = countries.find(c => c.code === selectedCountry)!;

  // Saldo disponível em USDT
  const availableBalance = portfolio.totalBalanceUSDT;

  // Converter USDT para moeda local
  const convertToLocalCurrency = (usdtAmount: number): number => {
    // USDT = USD (aproximadamente 1:1)
    return usdtAmount * (rates[currentCountry.currency] || 1);
  };

  // Converter moeda local para USDT
  const convertFromLocalCurrency = (localAmount: number): number => {
    return localAmount / (rates[currentCountry.currency] || 1);
  };

  // Saldo em moeda local
  const localBalance = convertToLocalCurrency(availableBalance);

  // Métodos de saque por país
  const withdrawMethodsByCountry = {
    BR: [
      {
        id: 'pix',
        name: 'PIX',
        icon: Smartphone,
        description: 'Transferência instantânea',
        processingTime: 'Instantâneo',
        minAmount: 0.01, // Sem limite - apenas valor mínimo simbólico
        maxAmount: Infinity, // Sem limite máximo
        fee: 0
      },
      {
        id: 'bank',
        name: 'Transferência Bancária',
        icon: Building2,
        description: 'TED ou DOC',
        processingTime: '1-2 dias úteis',
        minAmount: 0.01, // Sem limite - apenas valor mínimo simbólico
        maxAmount: Infinity, // Sem limite máximo
        fee: 0
      }
    ],
    US: [
      {
        id: 'ach',
        name: 'ACH Transfer',
        icon: Building2,
        description: 'Electronic bank transfer',
        processingTime: '3-5 business days',
        minAmount: 0.01, // Sem limite - apenas valor mínimo simbólico
        maxAmount: Infinity, // Sem limite máximo
        fee: 0
      },
      {
        id: 'wire',
        name: 'Wire Transfer',
        icon: Smartphone,
        description: 'Domestic wire',
        processingTime: 'Same day',
        minAmount: 0.01, // Sem limite - apenas valor mínimo simbólico
        maxAmount: Infinity, // Sem limite máximo
        fee: 25
      }
    ],
    EU: [
      {
        id: 'sepa',
        name: 'SEPA Transfer',
        icon: Building2,
        description: 'Single Euro Payments Area',
        processingTime: '1-2 business days',
        minAmount: 0.01, // Sem limite - apenas valor mínimo simbólico
        maxAmount: Infinity, // Sem limite máximo
        fee: 0
      },
      {
        id: 'instant',
        name: 'SEPA Instant',
        icon: Smartphone,
        description: 'Instant SEPA transfer',
        processingTime: 'Instant',
        minAmount: 0.01, // Sem limite - apenas valor mínimo simbólico
        maxAmount: Infinity, // Sem limite máximo
        fee: 2
      }
    ],
    GB: [
      {
        id: 'faster',
        name: 'Faster Payments',
        icon: Smartphone,
        description: 'Instant bank transfer',
        processingTime: 'Instant',
        minAmount: 0.01, // Sem limite - apenas valor mínimo simbólico
        maxAmount: Infinity, // Sem limite máximo
        fee: 0
      },
      {
        id: 'bacs',
        name: 'BACS Transfer',
        icon: Building2,
        description: 'Standard bank transfer',
        processingTime: '3 business days',
        minAmount: 0.01, // Sem limite - apenas valor mínimo simbólico
        maxAmount: Infinity, // Sem limite máximo
        fee: 0
      }
    ]
  };

  const withdrawMethods = withdrawMethodsByCountry[selectedCountry];
  const currentMethod = withdrawMethods.find(m => m.id === selectedMethod);

  // ✅ Carregar contas bancárias do Firestore em tempo real
  useEffect(() => {
    if (!user?.uid) {
      setIsLoadingAccounts(false);
      return;
    }

    const accountsRef = collection(db, 'bankAccounts');
    const q = query(accountsRef, where('userId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const accountsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as BankAccount[];

      setAccounts(accountsData);
      setIsLoadingAccounts(false);

      // Selecionar automaticamente a primeira conta se houver
      if (accountsData.length > 0 && !selectedAccount) {
        const firstAccount = accountsData[0];
        setSelectedAccount(firstAccount);
        // Mapear o país da conta para o tipo Country
        const countryMap: Record<string, Country> = {
          'BR': 'BR',
          'US': 'US',
          'PT': 'EU',
          'ES': 'EU',
          'FR': 'EU',
          'DE': 'EU',
          'IT': 'EU',
          'GB': 'GB',
          'UK': 'GB'
        };
        const mappedCountry = countryMap[firstAccount.country] || 'BR';
        setSelectedCountry(mappedCountry);
      }
    }, (error) => {
      console.error('❌ Erro ao carregar contas:', error);
      setIsLoadingAccounts(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Mapeamento de moedas para símbolos
  const currencySymbols: Record<string, string> = {
    BRL: 'R$',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'CA$',
    AUD: 'A$',
    CHF: 'Fr',
    CNY: '¥',
    INR: '₹',
    MXN: 'Mex$',
    KRW: '₩',
    ZAR: 'R',
    ARS: '$',
    CLP: '$',
  };

  // Função para obter badge de pagamento
  const getPaymentBadge = (account: BankAccount): { label: string; icon?: string } => {
    switch (account.country) {
      case 'BR':
        return { label: 'Pix', icon: '◆' };
      case 'US':
        return { label: `•• ${account.accountNumber.slice(-4)}` };
      case 'PT':
      case 'ES':
      case 'FR':
      case 'DE':
      case 'IT':
        return { label: `•• ${account.iban?.slice(-4) || account.accountNumber.slice(-4)}` };
      default:
        return { label: `•• ${account.accountNumber.slice(-4)}` };
    }
  };

  // Formatar saldo da conta
  const formatAccountBalance = (currency: string): string => {
    const symbol = currencySymbols[currency] || currency;
    const balance = getBalance(currency);
    
    const formattedValue = balance.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return `${symbol} ${formattedValue}`;
  };

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleAmountChange = (value: string) => {
    // Remove tudo exceto números
    const cleaned = value.replace(/\D/g, '');
    
    if (cleaned === '') {
      setAmount('');
      return;
    }
    
    // Converte para número (centavos)
    const numberValue = parseInt(cleaned, 10);
    
    // Divide por 100 para obter o valor em reais
    let realValue = numberValue / 100;
    
    // Obter saldo disponível da moeda atual
    const availableFiatBalance = getBalance(currentCountry.currency);
    
    // Limitar ao saldo disponível
    if (realValue > availableFiatBalance) {
      realValue = availableFiatBalance;
    }
    
    // Formata no padrão brasileiro
    const formatted = realValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    
    setAmount(formatted);
  };

  // Validação de chave PIX
  const validatePixKey = (key: string): { isValid: boolean; type: string | null; error: string | null } => {
    if (!key) {
      return { isValid: false, type: null, error: null };
    }

    // Remove espaços e caracteres especiais para validação
    const cleanKey = key.replace(/\s/g, '');

    // 1. CPF - 11 dígitos
    const cpfRegex = /^\d{11}$/;
    if (cpfRegex.test(cleanKey)) {
      return { isValid: true, type: 'CPF', error: null };
    }

    // 2. CNPJ - 14 dígitos
    const cnpjRegex = /^\d{14}$/;
    if (cnpjRegex.test(cleanKey)) {
      return { isValid: true, type: 'CNPJ', error: null };
    }

    // 3. E-mail - formato válido
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (emailRegex.test(key)) {
      return { isValid: true, type: 'E-mail', error: null };
    }

    // 4. Telefone - com DDD (10 ou 11 dígitos)
    const phoneRegex = /^(\+55)?(\d{10,11})$/;
    if (phoneRegex.test(cleanKey)) {
      return { isValid: true, type: 'Telefone', error: null };
    }

    // 5. Chave Aleatória - UUID formato (com ou sem hífens)
    const uuidRegex = /^[a-f0-9]{8}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{12}$/i;
    if (uuidRegex.test(cleanKey)) {
      return { isValid: true, type: 'Chave Aleatória', error: null };
    }

    // Se chegou aqui, a chave não é válida
    return { 
      isValid: false, 
      type: null, 
      error: 'Tipo de chave PIX não reconhecido. Use CPF, CNPJ, E-mail, Telefone ou Chave Aleatória.' 
    };
  };

  // Handler para mudança da chave PIX
  const handlePixKeyChange = (value: string) => {
    // 1. Converter para minúsculas
    let processedValue = value.toLowerCase();
    
    // 2. Remover caracteres especiais de telefone: -, (, ), espaços
    // Isso ajuda quando o usuário cola um número formatado como: +55 (11) 98765-4321
    processedValue = processedValue.replace(/[\s\-()]/g, '');
    
    setPixKey(processedValue);
    const validation = validatePixKey(processedValue);
    setPixKeyType(validation.type);
    setPixKeyError(validation.error);
  };

  const handleSubmit = async () => {
    if (!user?.uid) {
      toast.error('Usuário não autenticado');
      return;
    }

    // Converter valor formatado de volta para número
    const amountNum = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
    
    console.log('💰 ============ VALIDAÇÃO DE TRANSFERÊNCIA PIX ============');
    console.log('💰 Valor digitado (formatado):', amount);
    console.log('💰 Valor convertido (número):', amountNum);
    console.log('💰 Moeda:', currentCountry.currency);
    console.log('💰 Valor mínimo permitido:', currentMethod?.minAmount);
    
    if (!amountNum || amountNum < (currentMethod?.minAmount || 0)) {
      toast.error(`Valor mínimo: ${currentCountry.symbol} ${currentMethod?.minAmount}`);
      return;
    }

    // ✅ CORREÇÃO: Verificar saldo disponível usando TANTO fiatBalances QUANTO portfolio convertido
    const fiatBalance = getBalance(currentCountry.currency);
    const portfolioBalanceConverted = convertToLocalCurrency(availableBalance);
    
    console.log('💰 ====== DEBUG DE SALDOS ======');
    console.log('💰 Saldo Fiat (Firestore):', fiatBalance);
    console.log('💰 Saldo Portfolio (USDT):', availableBalance);
    console.log('💰 Saldo Portfolio Convertido:', portfolioBalanceConverted);
    console.log('💰 Taxa de conversão:', rates[currentCountry.currency]);
    
    // Usar o maior saldo disponível entre fiat e portfolio convertido
    const availableFiatBalance = Math.max(fiatBalance, portfolioBalanceConverted);
    
    console.log('💰 ✅ Saldo disponível TOTAL para transferência:', availableFiatBalance);
    console.log('💰 Comparação:', amountNum, '>', availableFiatBalance, '=', amountNum > availableFiatBalance);
    
    if (amountNum > availableFiatBalance) {
      console.error('❌ SALDO INSUFICIENTE!');
      console.error('❌ Tentou transferir:', amountNum);
      console.error('❌ Saldo disponível:', availableFiatBalance);
      console.error('❌ Diferença:', amountNum - availableFiatBalance);
      toast.error(`Saldo insuficiente. Disponível: ${currentCountry.symbol} ${formatAmount(availableFiatBalance)}`);
      return;
    }
    
    console.log('✅ Validação de saldo OK!');
    console.log('💰 ====================================================');
    
    // Validar campos específicos
    if (selectedCountry === 'BR' && selectedMethod === 'pix') {
      if (!pixKey) {
        toast.error('Informe a chave PIX');
        return;
      }
      
      // Validar tipo de chave PIX
      const validation = validatePixKey(pixKey);
      if (!validation.isValid) {
        toast.error(validation.error || 'Chave PIX inválida');
        return;
      }
    }
    
    if (selectedCountry === 'BR' && selectedMethod === 'bank' && (!bankData.bank || !bankData.agency || !bankData.account || !bankData.name)) {
      toast.error('Preencha todos os dados bancários');
      return;
    }
    if (selectedCountry === 'US' && (!usAccountData.accountNumber || !usAccountData.routingNumber || !usAccountData.name)) {
      toast.error('Fill in all bank details');
      return;
    }
    if (selectedCountry === 'EU' && (!euAccountData.iban || !euAccountData.name)) {
      toast.error('Fill in all bank details');
      return;
    }
    if (selectedCountry === 'GB' && (!ukAccountData.accountNumber || !ukAccountData.sortCode || !ukAccountData.name)) {
      toast.error('Fill in all bank details');
      return;
    }

    // Processar transferência
    setIsProcessing(true);
    
    try {
      // ✅ TRATAMENTO ESPECIAL PARA PIX - Verificar se é transferência entre usuários NexCoin
      if (selectedCountry === 'BR' && selectedMethod === 'pix') {
        console.log('🔍 Verificando se chave PIX pertence a um usuário NexCoin...');
        
        // Validar chave PIX no sistema NexCoin
        const pixValidation = await validatePixKeyNexCoin(pixKey, user.uid);
        
        if (pixValidation.isValid && pixValidation.userId) {
          // ✅ Chave PIX encontrada! Fazer transferência entre usuários
          console.log('✅ Chave PIX encontrada no sistema NexCoin');
          console.log(`📤 Remetente: ${user.uid}`);
          console.log(`📥 Destinatário: ${pixValidation.userId} (${pixValidation.userName})`);
          
          // Gerar ID de transação
          const txId = generatePixTransactionId();
          
          // Processar transferência entre usuários
          const transferResult = await processPixTransfer({
            fromUserId: user.uid,
            toUserId: pixValidation.userId,
            currency: currentCountry.currency,
            amount: amountNum,
            pixKey,
            pixKeyType: pixValidation.pixKeyType || pixKeyType || 'unknown',
            description: `Transferência PIX para ${pixValidation.userName}`,
            transactionId: txId,
            createdAt: new Date(),
          });
          
          if (!transferResult.success) {
            throw new Error(transferResult.error || 'Erro ao processar transferência PIX');
          }
          
          console.log('✅ Transferência PIX entre usuários concluída!');
          toast.success(`Transferência enviada para ${pixValidation.userName}!`);
          
          setTransactionId(txId);
          setIsProcessing(false);
          setShowSuccess(true);
          return; // ✅ Sair da função aqui para não executar o fluxo antigo
        } else {
          // ⚠️ Chave PIX não encontrada no sistema NexCoin
          console.warn('⚠️ Chave PIX não encontrada no sistema NexCoin');
          toast.error(pixValidation.error || 'Chave PIX não encontrada no sistema NexCoin. Apenas transferências entre usuários NexCoin são suportadas no momento.');
          setIsProcessing(false);
          return;
        }
      }
      
      // ⚠️ FLUXO ANTIGO (para outros métodos que não são PIX entre usuários NexCoin)
      // 1. Preparar descrição baseada no método
      let transactionDescription = '';
      if (selectedCountry === 'BR' && selectedMethod === 'pix') {
        transactionDescription = `Transferência PIX - ${pixKey}`;
      } else if (selectedCountry === 'BR' && selectedMethod === 'bank') {
        transactionDescription = `Transferência TED - ${bankData.name}`;
      } else {
        transactionDescription = `Transferência via ${currentMethod?.name}`;
      }

      // 2. Debitar saldo fiat
      const result = await updateFiatBalance(
        user.uid,
        currentCountry.currency,
        -amountNum,
        transactionDescription
      );

      if (!result.success) {
        throw new Error(result.message || 'Erro ao processar transferência');
      }

      // 3. Preparar informações do destinatário
      let recipientInfo = '';
      if (selectedCountry === 'BR' && selectedMethod === 'pix') {
        recipientInfo = `Chave PIX: ${pixKey} (${pixKeyType})`;
      } else if (selectedCountry === 'BR' && selectedMethod === 'bank') {
        recipientInfo = `${bankData.name} - ${bankData.bank} Ag: ${bankData.agency} Conta: ${bankData.account}`;
      } else if (selectedCountry === 'US') {
        recipientInfo = `${usAccountData.name} - Account: ${usAccountData.accountNumber}`;
      } else if (selectedCountry === 'EU') {
        recipientInfo = `${euAccountData.name} - IBAN: ${euAccountData.iban}`;
      } else if (selectedCountry === 'GB') {
        recipientInfo = `${ukAccountData.name} - Sort Code: ${ukAccountData.sortCode} Account: ${ukAccountData.accountNumber}`;
      }

      // 4. Gerar ID da transação
      const txId = `TX${Date.now()}${Math.floor(Math.random() * 1000)}`;
      setTransactionId(txId);

      // 5. Salvar transação no banco de dados
      await addTransaction({
        type: 'withdraw_fiat',
        status: 'completed',
        amount: amountNum,
        currency: currentCountry.currency,
        fee: currentMethod?.fee || 0,
        feeCurrency: currentCountry.currency,
        description: transactionDescription,
        recipientInfo: recipientInfo,
        transactionHash: txId,
      });

      console.log('✅ Transferência processada com sucesso');
      toast.success('Transferência realizada com sucesso!');
      
      // Mostrar tela de sucesso
      setIsProcessing(false);
      setShowSuccess(true);
      
    } catch (error: any) {
      console.error('❌ Erro ao processar transferência:', error);
      toast.error(error.message || 'Erro ao processar transferência');
      setIsProcessing(false);
    }
  };

  // Renderizar formulário específico por método
  const renderMethodForm = () => {
    if (!selectedMethod) return null;

    // BRASIL - PIX
    if (selectedCountry === 'BR' && selectedMethod === 'pix') {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col pb-24">
          <header className="px-6 pt-6 pb-4">
            <button 
              onClick={() => setSelectedMethod(null)} 
              className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-zinc-800 transition-colors mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-lg mb-1">Transferir via PIX</h1>
                <p className="text-sm text-gray-400">Transferência instantânea</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
            </div>
          </header>

          {/* Saldo disponível */}
          <div className="px-6 mb-6">
            <div className="bg-zinc-900 rounded-2xl p-4">
              <div className="text-xs text-gray-400 mb-1">Saldo disponível</div>
              <div className="text-white">
                <FormattedAmount value={formatAmount(getBalance('BRL'))} symbol="R$" />
              </div>
            </div>
          </div>

          {/* Formulário */}
          <div className="px-6 space-y-4">
            {/* Valor */}
            <div className="bg-zinc-900 rounded-2xl p-4">
              <label className="block text-xs text-gray-400 mb-2">Valor a transferir</label>
              <div className="flex items-center gap-2">
                <span className="text-xl font-light text-white">{currentCountry.symbol}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="flex-1 bg-transparent text-xl font-light text-white outline-none placeholder-gray-600"
                />
              </div>
              <div className="text-xs text-gray-400 mt-2">
                Mín: {currentCountry.symbol} {currentMethod?.minAmount} • Máx: {currentCountry.symbol} {formatAmount(currentMethod?.maxAmount || 0)}
              </div>
            </div>

            {/* Chave PIX */}
            <div className="bg-zinc-900 rounded-2xl p-4">
              <label className="block text-xs text-gray-400 mb-2">Chave PIX do destinatário</label>
              <input
                type="text"
                placeholder="CPF, E-mail, Telefone ou Chave Aleatória"
                value={pixKey}
                onChange={(e) => handlePixKeyChange(e.target.value)}
                className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500"
              />
              <p className="text-xs text-gray-400 mt-2">
                Informe a chave PIX de quem vai receber a transferência
              </p>
              {pixKeyError && (
                <p className="text-xs text-red-500 mt-1">
                  {pixKeyError}
                </p>
              )}
            </div>

            {/* Taxas */}
            <div className="bg-zinc-900 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Taxa</span>
                <span className="text-white">{currentCountry.symbol} 0,00</span>
              </div>
              <div className="h-px bg-zinc-800"></div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tempo</span>
                <span className="text-green-500">Instantâneo</span>
              </div>
            </div>

            {/* Botão */}
            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="w-full bg-white text-black py-4 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {isProcessing ? 'Processando...' : 'Confirmar Transferência'}
            </button>
          </div>
        </div>
      );
    }

    // BRASIL - Transferência Bancária
    if (selectedCountry === 'BR' && selectedMethod === 'bank') {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col pb-24 overflow-y-auto">
          <header className="px-6 pt-6 pb-4">
            <button onClick={() => setSelectedMethod(null)} className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-zinc-800 transition-colors mb-6">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-lg mb-1">Transferência Bancária</h1>
                <p className="text-sm text-gray-400">TED ou DOC</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </header>

          <div className="px-6 mb-6">
            <div className="bg-zinc-900 rounded-2xl p-4">
              <div className="text-xs text-gray-400 mb-1">Saldo disponível</div>
              <div className="text-2xl font-bold text-white">{currentCountry.symbol} {formatAmount(localBalance)}</div>
            </div>
          </div>

          <div className="px-6 space-y-4">
            <div className="bg-zinc-900 rounded-2xl p-4">
              <label className="block text-xs text-gray-400 mb-2 font-semibold">Valor</label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">{currentCountry.symbol}</span>
                <input type="text" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => handleAmountChange(e.target.value)} className="flex-1 bg-transparent text-2xl font-bold text-white outline-none placeholder-gray-600" />
              </div>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
              <input type="text" placeholder="Banco" value={bankData.bank} onChange={(e) => setBankData({...bankData, bank: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Código" value={bankData.bankCode} onChange={(e) => setBankData({...bankData, bankCode: e.target.value})} className="bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500" />
                <input type="text" placeholder="Agência" value={bankData.agency} onChange={(e) => setBankData({...bankData, agency: e.target.value})} className="bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500" />
              </div>
              <input type="text" placeholder="Conta" value={bankData.account} onChange={(e) => setBankData({...bankData, account: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500" />
              <select value={bankData.accountType} onChange={(e) => setBankData({...bankData, accountType: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none">
                <option value="Conta Corrente">Conta Corrente</option>
                <option value="Conta Poupança">Conta Poupança</option>
              </select>
              <input type="text" placeholder="Nome completo" value={bankData.name} onChange={(e) => setBankData({...bankData, name: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500" />
              <input type="text" placeholder="CPF/CNPJ" value={bankData.document} onChange={(e) => setBankData({...bankData, document: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500" />
            </div>

            <button onClick={handleSubmit} disabled={isProcessing} className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50">
              {isProcessing ? 'Processando...' : 'Confirmar Transferência'}
            </button>
          </div>
        </div>
      );
    }

    // EUA - ACH ou Wire
    if (selectedCountry === 'US' && (selectedMethod === 'ach' || selectedMethod === 'wire')) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col pb-24 overflow-y-auto">
          <header className="px-6 pt-6 pb-4">
            <button onClick={() => setSelectedMethod(null)} className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-zinc-800 transition-colors mb-6">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-1">{selectedMethod === 'ach' ? 'ACH Transfer' : 'Wire Transfer'}</h1>
                <p className="text-sm text-gray-400">{selectedMethod === 'ach' ? 'Electronic bank transfer' : 'Domestic wire'}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center">
                {selectedMethod === 'ach' ? <Building2 className="w-6 h-6 text-white" /> : <Smartphone className="w-6 h-6 text-white" />}
              </div>
            </div>
          </header>

          <div className="px-6 mb-6">
            <div className="bg-zinc-900 rounded-2xl p-4">
              <div className="text-xs text-gray-400 mb-1">Available balance</div>
              <div className="text-2xl font-bold text-white">{currentCountry.symbol} {formatAmount(localBalance)}</div>
            </div>
          </div>

          <div className="px-6 space-y-4">
            <div className="bg-zinc-900 rounded-2xl p-4">
              <label className="block text-xs text-gray-400 mb-2 font-semibold">Amount</label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">{currentCountry.symbol}</span>
                <input type="text" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => handleAmountChange(e.target.value)} className="flex-1 bg-transparent text-2xl font-bold text-white outline-none placeholder-gray-600" />
              </div>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
              <input type="text" placeholder="Routing Number" value={usAccountData.routingNumber} onChange={(e) => setUsAccountData({...usAccountData, routingNumber: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500" />
              <input type="text" placeholder="Account Number" value={usAccountData.accountNumber} onChange={(e) => setUsAccountData({...usAccountData, accountNumber: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500" />
              <select value={usAccountData.accountType} onChange={(e) => setUsAccountData({...usAccountData, accountType: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none">
                <option value="Checking">Checking</option>
                <option value="Savings">Savings</option>
              </select>
              <input type="text" placeholder="Account holder name" value={usAccountData.name} onChange={(e) => setUsAccountData({...usAccountData, name: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500" />
              <input type="text" placeholder="Address" value={usAccountData.address} onChange={(e) => setUsAccountData({...usAccountData, address: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500" />
            </div>

            <div className="bg-zinc-900 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Fee</span>
                <span className="font-semibold text-white">{currentCountry.symbol} {currentMethod?.fee || 0}</span>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={isProcessing} className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50">
              {isProcessing ? 'Processing...' : 'Confirm Transfer'}
            </button>
          </div>
        </div>
      );
    }

    // EU - SEPA ou SEPA Instant
    if (selectedCountry === 'EU' && (selectedMethod === 'sepa' || selectedMethod === 'instant')) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col pb-24 overflow-y-auto">
          <header className="px-6 pt-6 pb-4">
            <button onClick={() => setSelectedMethod(null)} className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-zinc-800 transition-colors mb-6">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-1">{selectedMethod === 'sepa' ? 'SEPA Transfer' : 'SEPA Instant'}</h1>
                <p className="text-sm text-gray-400">{selectedMethod === 'sepa' ? 'Single Euro Payments Area' : 'Instant transfer'}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center">
                {selectedMethod === 'sepa' ? <Building2 className="w-6 h-6 text-white" /> : <Smartphone className="w-6 h-6 text-white" />}
              </div>
            </div>
          </header>

          <div className="px-6 mb-6">
            <div className="bg-zinc-900 rounded-2xl p-4">
              <div className="text-xs text-gray-400 mb-1">Available balance</div>
              <div className="text-2xl font-bold text-white">{currentCountry.symbol} {formatAmount(localBalance)}</div>
            </div>
          </div>

          <div className="px-6 space-y-4">
            <div className="bg-zinc-900 rounded-2xl p-4">
              <label className="block text-xs text-gray-400 mb-2 font-semibold">Amount</label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">{currentCountry.symbol}</span>
                <input type="text" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => handleAmountChange(e.target.value)} className="flex-1 bg-transparent text-2xl font-bold text-white outline-none placeholder-gray-600" />
              </div>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
              <input type="text" placeholder="IBAN" value={euAccountData.iban} onChange={(e) => setEuAccountData({...euAccountData, iban: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500 font-mono text-sm" />
              <input type="text" placeholder="BIC/SWIFT (optional)" value={euAccountData.bic} onChange={(e) => setEuAccountData({...euAccountData, bic: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500" />
              <input type="text" placeholder="Beneficiary name" value={euAccountData.name} onChange={(e) => setEuAccountData({...euAccountData, name: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500" />
              <input type="text" placeholder="Address" value={euAccountData.address} onChange={(e) => setEuAccountData({...euAccountData, address: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500" />
            </div>

            <div className="bg-zinc-900 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Fee</span>
                <span className="font-semibold text-white">{currentCountry.symbol} {currentMethod?.fee || 0}</span>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={isProcessing} className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50">
              {isProcessing ? 'Processing...' : 'Confirm Transfer'}
            </button>
          </div>
        </div>
      );
    }

    // UK - Faster Payments ou BACS
    if (selectedCountry === 'GB' && (selectedMethod === 'faster' || selectedMethod === 'bacs')) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col pb-24 overflow-y-auto">
          <header className="px-6 pt-6 pb-4">
            <button onClick={() => setSelectedMethod(null)} className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-zinc-800 transition-colors mb-6">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-1">{selectedMethod === 'faster' ? 'Faster Payments' : 'BACS Transfer'}</h1>
                <p className="text-sm text-gray-400">{selectedMethod === 'faster' ? 'Instant bank transfer' : 'Standard bank transfer'}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center">
                {selectedMethod === 'faster' ? <Smartphone className="w-6 h-6 text-white" /> : <Building2 className="w-6 h-6 text-white" />}
              </div>
            </div>
          </header>

          <div className="px-6 mb-6">
            <div className="bg-zinc-900 rounded-2xl p-4">
              <div className="text-xs text-gray-400 mb-1">Available balance</div>
              <div className="text-2xl font-bold text-white">{currentCountry.symbol} {formatAmount(localBalance)}</div>
            </div>
          </div>

          <div className="px-6 space-y-4">
            <div className="bg-zinc-900 rounded-2xl p-4">
              <label className="block text-xs text-gray-400 mb-2 font-semibold">Amount</label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">{currentCountry.symbol}</span>
                <input type="text" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => handleAmountChange(e.target.value)} className="flex-1 bg-transparent text-2xl font-bold text-white outline-none placeholder-gray-600" />
              </div>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
              <input type="text" placeholder="Sort Code (12-34-56)" value={ukAccountData.sortCode} onChange={(e) => setUkAccountData({...ukAccountData, sortCode: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500" />
              <input type="text" placeholder="Account Number" value={ukAccountData.accountNumber} onChange={(e) => setUkAccountData({...ukAccountData, accountNumber: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500" />
              <input type="text" placeholder="Account holder name" value={ukAccountData.name} onChange={(e) => setUkAccountData({...ukAccountData, name: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500" />
              <input type="text" placeholder="Address" value={ukAccountData.address} onChange={(e) => setUkAccountData({...ukAccountData, address: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500" />
            </div>

            <button onClick={handleSubmit} disabled={isProcessing} className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50">
              {isProcessing ? 'Processing...' : 'Confirm Transfer'}
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  // Modal de Sucesso
  if (showSuccess) {
    // Preparar dados do destinatário conforme o método
    let recipientInfo = '';
    if (selectedCountry === 'BR' && selectedMethod === 'pix') {
      recipientInfo = `Chave PIX: ${pixKey} (${pixKeyType})`;
    } else if (selectedCountry === 'BR' && selectedMethod === 'bank') {
      recipientInfo = `${bankData.name} - ${bankData.bank} Ag: ${bankData.agency} Conta: ${bankData.account}`;
    } else if (selectedCountry === 'US') {
      recipientInfo = `${usAccountData.name} - Account: ${usAccountData.accountNumber}`;
    } else if (selectedCountry === 'EU') {
      recipientInfo = `${euAccountData.name} - IBAN: ${euAccountData.iban}`;
    } else if (selectedCountry === 'GB') {
      recipientInfo = `${ukAccountData.name} - Sort Code: ${ukAccountData.sortCode} Account: ${ukAccountData.accountNumber}`;
    }

    const transactionData = {
      transactionId: transactionId,
      amount: amount,
      currency: currentCountry.currency,
      symbol: currentCountry.symbol,
      method: currentMethod?.name || '',
      processingTime: currentMethod?.processingTime || '',
      fee: currentMethod?.fee || 0,
      recipientInfo: recipientInfo,
      date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'Processando'
    };

    return <WithdrawReceipt onNavigate={onNavigate} transactionData={transactionData} />;
  }

  // Se um método foi selecionado, mostrar o formulário
  if (selectedMethod) {
    return renderMethodForm();
  }

  // Tela principal de seleção
  return (
    <div className="min-h-screen bg-black text-white flex flex-col pb-24">
      <header className="px-6 pt-6 pb-4">
        <button 
          onClick={() => onNavigate('home')} 
          className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-zinc-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg mb-2">Enviar Dinheiro</h1>
        <p className="text-gray-400 text-sm">
          Escolha seu país e método de transferência
        </p>
      </header>

      {/* Country Selection */}
      <div className="px-6 mb-6">
        <label className="block text-xs text-gray-400 mb-3 font-semibold">Selecione a Conta</label>
        {isLoadingAccounts ? (
          <div className="bg-zinc-900/50 rounded-2xl h-32 animate-pulse"></div>
        ) : accounts.length === 0 ? (
          <div className="bg-zinc-900 rounded-2xl p-6 text-center">
            <p className="text-gray-400 text-sm mb-2">Nenhuma conta encontrada</p>
            <p className="text-xs text-gray-500">Adicione uma conta na página Home</p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => {
              const badge = getPaymentBadge(account);
              const isSelected = selectedAccount?.id === account.id;
              
              return (
                <button
                  key={account.id}
                  onClick={() => {
                    setSelectedAccount(account);
                    // Mapear o país da conta para o tipo Country
                    const countryMap: Record<string, Country> = {
                      'BR': 'BR',
                      'US': 'US',
                      'PT': 'EU',
                      'ES': 'EU',
                      'FR': 'EU',
                      'DE': 'EU',
                      'IT': 'EU',
                      'GB': 'GB',
                      'UK': 'GB'
                    };
                    const mappedCountry = countryMap[account.country] || 'BR';
                    setSelectedCountry(mappedCountry);
                  }}
                  className={`w-full bg-gradient-to-br from-zinc-800/90 via-zinc-900/95 to-black backdrop-blur-xl rounded-2xl p-4 border transition-all active:scale-[0.98] text-left relative overflow-hidden group ${
                    isSelected
                      ? 'ring-2 ring-white border-white/30'
                      : 'border-zinc-700/60 hover:border-zinc-600'
                  }`}
                >
                  {/* Efeito de brilho glassmorphism */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent pointer-events-none"></div>
                  
                  {/* Conteúdo da conta */}
                  <div className="flex items-center justify-between relative z-10">
                    {/* Lado esquerdo: Moeda e Badge */}
                    <div className="flex items-center gap-3 flex-1">
                      {/* Informações da conta */}
                      <div className="flex-1 min-w-0">
                        <div className="text-lg font-semibold text-white mb-1">
                          {account.currency}
                        </div>
                        
                        {/* Badge (Pix ou número da conta) */}
                        <div className="flex items-center gap-2">
                          {badge.icon && (
                            <span className="text-cyan-400 text-xs">{badge.icon}</span>
                          )}
                          <span className="text-xs text-gray-400">
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Lado direito: Saldo */}
                    <div className="text-right ml-3">
                      <div className="text-base font-semibold text-white tabular-nums">
                        {formatAccountBalance(account.currency)}
                      </div>
                      {(account.iban || account.accountNumber) && (
                        <div className="text-xs text-gray-500 mt-1 font-mono">
                          ·· {(account.iban || account.accountNumber).slice(-4)}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Saldo disponível */}
      <div className="px-6 mb-6">
        <div className="bg-zinc-900 rounded-2xl p-4">
          <div className="text-xs text-gray-400 mb-1">Saldo disponível para transferência</div>
          <div className="text-white">
            {selectedAccount ? (
              <FormattedAmount 
                value={formatAmount(getBalance(selectedAccount.currency))} 
                symbol={currencySymbols[selectedAccount.currency]} 
              />
            ) : (
              <FormattedAmount 
                value={formatAmount(getBalance(currentCountry.currency))} 
                symbol={currentCountry.symbol} 
              />
            )}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {selectedAccount ? `Conta ${selectedAccount.currency}` : `≈ ${formatAmount(availableBalance)} USDT`}
          </div>
        </div>
      </div>

      {/* Methods List */}
      <div className="flex-1 px-6">
        <label className="block text-xs text-gray-400 mb-3 font-semibold">Métodos de transferência</label>
        <div className="space-y-3">
          {withdrawMethods.map((method) => {
            const Icon = method.icon;
            return (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className="w-full bg-zinc-900 hover:bg-zinc-800 transition-colors rounded-2xl p-4 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-lg mb-1">{method.name}</div>
                  <div className="text-sm text-gray-400">{method.description}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {method.processingTime} • Sem limite de transferência
                  </div>
                </div>
                <div className="text-gray-400">
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Warning */}
      <div className="px-6 pt-4">
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-sm text-yellow-200/90">
          <p className="font-semibold mb-1">⚠️ Importante</p>
          <p className="text-xs text-yellow-200/70">
            Certifique-se de inserir os dados bancários corretos. Transferências para dados incorretos não poderão ser revertidas.
          </p>
        </div>
      </div>
    </div>
  );
}