import { ArrowLeft, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { CryptoIcon } from './CryptoIcon';
import { useCryptoPrices } from '../contexts/CryptoPriceContext';
import { useFiatRates } from '../contexts/FiatRatesContext';
import { usePortfolio } from '../contexts/PortfolioContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useConversions } from '../hooks/useConversions';
import { useFiatBalances } from '../hooks/useFiatBalances';
import { useTransactions } from '../hooks/useTransactions';
import { calculateConversionFee } from '../lib/conversionUtils';
import { useAuth } from '../contexts/AuthContext';

import { notifyConversion } from '../lib/notifications';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { formatCurrency, formatCrypto } from '../utils/formatters';
import type { Screen } from '../App';
import type { BankAccount } from '../lib/bankAccountGenerator';

interface ConvertProps {
  onNavigate: (screen: Screen) => void;
  onNavigateWithAccount?: (screen: Screen, account: BankAccount) => void;
}

export function Convert({ onNavigate, onNavigateWithAccount }: ConvertProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('BTC');
  const [toCurrency, setToCurrency] = useState('USDT');
  const [showFromSelector, setShowFromSelector] = useState(false);
  const [showToSelector, setShowToSelector] = useState(false);
  const [conversionMode, setConversionMode] = useState<'crypto-crypto' | 'crypto-fiat' | 'fiat-fiat'>('crypto-crypto');
  const [isConverting, setIsConverting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [userBankAccounts, setUserBankAccounts] = useState<BankAccount[]>([]);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);



  const { prices } = useCryptoPrices();
  const { rates } = useFiatRates();
  const { portfolio } = usePortfolio();
  const { conversions, isLoading, executeConversion } = useConversions();
  const { balances: fiatBalances, getBalance: getFiatBalanceAmount, hasPermissionError } = useFiatBalances();
  const { transactions, addTransaction } = useTransactions();

  // Ref para o input
  const inputRef = useRef<HTMLInputElement>(null);

  // Autofocus no input quando a página carregar
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // ✅ Bloquear/desbloquear scroll do body quando o modal abrir/fechar
  useEffect(() => {
    if (showSuccessModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup: garantir que o overflow seja restaurado ao desmontar
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showSuccessModal]);

  // ✅ Buscar contas bancárias do usuário
  useEffect(() => {
    if (!user?.uid) return;

    const loadUserBankAccounts = async () => {
      try {
        const accountsRef = collection(db, 'bankAccounts');
        const q = query(accountsRef, where('userId', '==', user.uid));
        const snapshot = await getDocs(q);

        const accounts = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as BankAccount[];

        setUserBankAccounts(accounts);
        console.log('🏦 Contas bancárias carregadas:', accounts.length);
      } catch (error) {
        console.error('❌ Erro ao carregar contas bancárias:', error);
      }
    };

    loadUserBankAccounts();
  }, [user]);

  const cryptoOptions = [
    { symbol: 'BTC', name: 'Bitcoin', id: 'bitcoin' },
    { symbol: 'ETH', name: 'Ethereum', id: 'ethereum' },
    { symbol: 'USDT', name: 'Tether', id: 'tether' },
    { symbol: 'BNB', name: 'BNB', id: 'binancecoin' },
    { symbol: 'SOL', name: 'Solana', id: 'solana' },
    { symbol: 'XRP', name: 'Ripple', id: 'ripple' },
    { symbol: 'ADA', name: 'Cardano', id: 'cardano' },
    { symbol: 'AVAX', name: 'Avalanche', id: 'avalanche-2' },
    { symbol: 'DOGE', name: 'Dogecoin', id: 'dogecoin' },
    { symbol: 'DOT', name: 'Polkadot', id: 'polkadot' },
    { symbol: 'MATIC', name: 'Polygon', id: 'matic-network' },
    { symbol: 'LINK', name: 'Chainlink', id: 'chainlink' },
    { symbol: 'UNI', name: 'Uniswap', id: 'uniswap' },
    { symbol: 'LTC', name: 'Litecoin', id: 'litecoin' },
    { symbol: 'ATOM', name: 'Cosmos', id: 'cosmos' },
    { symbol: 'XLM', name: 'Stellar', id: 'stellar' },
    { symbol: 'TRX', name: 'Tron', id: 'tron' },
  ];

  const fiatOptions = [
    { symbol: 'BRL', name: 'Real Brasileiro', flag: 'https://flagcdn.com/w80/br.png' },
    { symbol: 'USD', name: 'Dólar Americano', flag: 'https://flagcdn.com/w80/us.png' },
    { symbol: 'EUR', name: 'Euro', flag: 'https://flagcdn.com/w80/eu.png' },
    { symbol: 'GBP', name: 'Libra Esterlina', flag: 'https://flagcdn.com/w80/gb.png' },
  ];

  // ✅ Filtrar moedas fiat disponíveis baseadas nas contas bancárias do usuário
  const availableFiatCurrencies = useMemo(() => {
    if (userBankAccounts.length === 0) {
      return []; // Nenhuma moeda fiat disponível se não houver contas
    }

    // Extrair moedas únicas das contas bancárias
    const currencies = [...new Set(userBankAccounts.map(acc => acc.currency))];

    // Filtrar fiatOptions para incluir apenas moedas com contas
    return fiatOptions.filter(fiat => currencies.includes(fiat.symbol));
  }, [userBankAccounts]);

  // Filtra apenas criptos com saldo > 0 para o selector "FROM"
  const availableCryptos = useMemo(() => {
    return cryptoOptions.filter(crypto => {
      const holding = portfolio.holdings.find(h => h.symbol === crypto.symbol);
      return holding && holding.amount > 0;
    });
  }, [portfolio.holdings]);

  // Função para obter o saldo de uma cripto
  const getCryptoBalance = (symbol: string): number => {
    const holding = portfolio.holdings.find(h => h.symbol === symbol);
    return holding?.amount || 0;
  };

  // Função para obter o saldo de fiat
  const getFiatBalance = (symbol: string): number => {
    return getFiatBalanceAmount(symbol);
  };

  const symbolToId: Record<string, string> = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    USDT: 'tether',
    BNB: 'binancecoin',
    SOL: 'solana',
    XRP: 'ripple',
    ADA: 'cardano',
    AVAX: 'avalanche-2',
    DOGE: 'dogecoin',
    DOT: 'polkadot',
    MATIC: 'matic-network',
    LINK: 'chainlink',
    UNI: 'uniswap',
    LTC: 'litecoin',
    ATOM: 'cosmos',
    XLM: 'stellar',
    TRX: 'tron',
  };

  // Verifica o tipo de moeda
  const isCrypto = (symbol: string) => cryptoOptions.some(c => c.symbol === symbol);
  const isFiat = (symbol: string) => fiatOptions.some(f => f.symbol === symbol);

  // Muda o modo e ajusta as moedas
  const handleModeChange = (mode: 'crypto-crypto' | 'crypto-fiat' | 'fiat-fiat') => {
    // ✅ Validar se há contas suficientes para conversões fiat
    if (mode === 'fiat-fiat' && availableFiatCurrencies.length < 2) {
      toast.error('Você precisa ter contas em pelo menos 2 países diferentes para fazer conversões entre moedas.');
      return;
    }

    if (mode === 'crypto-fiat' && availableFiatCurrencies.length === 0) {
      toast.error('Você precisa abrir uma conta bancária para converter cripto em moeda fiat.');
      return;
    }

    setConversionMode(mode);
    if (mode === 'crypto-crypto') {
      // Escolhe a primeira cripto disponível com saldo ou BTC por padrão
      const firstAvailable = availableCryptos.length > 0 ? availableCryptos[0].symbol : 'BTC';
      setFromCurrency(firstAvailable);
      // Garante que toCurrency seja diferente de fromCurrency
      setToCurrency(firstAvailable === 'USDT' ? 'BTC' : 'USDT');
    } else if (mode === 'crypto-fiat') {
      const firstAvailable = availableCryptos.length > 0 ? availableCryptos[0].symbol : 'BTC';
      setFromCurrency(firstAvailable);
      // Definir primeira moeda fiat disponível
      const firstFiat = availableFiatCurrencies.length > 0 ? availableFiatCurrencies[0].symbol : 'BRL';
      setToCurrency(firstFiat);
    } else {
      // Para fiat-fiat, definir as duas primeiras moedas disponíveis
      const firstFiat = availableFiatCurrencies[0]?.symbol || 'BRL';
      const secondFiat = availableFiatCurrencies[1]?.symbol || 'USD';
      setFromCurrency(firstFiat);
      setToCurrency(secondFiat);
    }
    setFromAmount('');
    setToAmount('');
  };

  const handleSwap = () => {
    const tempCrypto = fromCurrency;
    const tempAmount = fromAmount;
    setFromCurrency(toCurrency);
    setToCurrency(tempCrypto);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleFromAmountChange = (value: string) => {
    // Remove tudo exceto números
    const cleaned = value.replace(/\D/g, '');

    if (!cleaned) {
      setFromAmount('');
      return;
    }

    // Converte para número (centavos)
    const numericValue = parseInt(cleaned, 10);

    // Converte para valor decimal (divide por 100 para ter 2 casas decimais)
    const decimalValue = numericValue / 100;

    // Armazena como string com ponto decimal para cálculos
    setFromAmount(decimalValue.toString());
  };

  // Formata o valor exibido no input no padrão brasileiro (1.234.567,89)
  const formatInputDisplay = (value: string): string => {
    if (!value) return '0,00';

    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return '0,00';

    // Formata com 2 casas decimais
    const formatted = numericValue.toFixed(2);

    // Separa parte inteira e decimal
    const [integerPart, decimalPart] = formatted.split('.');

    // Adiciona separador de milhares (ponto)
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // Retorna com vírgula como separador decimal
    return `${formattedInteger},${decimalPart}`;
  };

  // Calcula a taxa de câmbio automaticamente sempre que as moedas ou preços mudarem
  const exchangeRate = useMemo(() => {
    if (conversionMode === 'crypto-crypto') {
      const fromId = symbolToId[fromCurrency];
      const toId = symbolToId[toCurrency];
      const fromPrice = prices[fromId]?.usd || 1;
      const toPrice = prices[toId]?.usd || 1;
      return fromPrice / toPrice;
    } else if (conversionMode === 'crypto-fiat') {
      // ✅ NOVO: Detectar direção da conversão
      const isFromCrypto = isCrypto(fromCurrency);

      if (isFromCrypto) {
        // Cripto → Fiat
        const cryptoId = symbolToId[fromCurrency];
        const cryptoPrice = prices[cryptoId]?.usd || 1;
        const fiatRate = rates[toCurrency] || 1;
        return cryptoPrice * fiatRate;
      } else {
        // Fiat → Cripto
        const cryptoId = symbolToId[toCurrency];
        const cryptoPrice = prices[cryptoId]?.usd || 1;
        const fiatRate = rates[fromCurrency] || 1;
        return fiatRate / cryptoPrice;
      }
    } else if (conversionMode === 'fiat-fiat') {
      const fromRate = rates[fromCurrency] || 1;
      const toRate = rates[toCurrency] || 1;
      return toRate / fromRate;
    }
    return 1;
  }, [conversionMode, fromCurrency, toCurrency, prices, rates, symbolToId, isCrypto]);

  // Auto-calculate on amount change
  useEffect(() => {
    if (!fromAmount) {
      setToAmount('');
      return;
    }

    const amount = parseFloat(fromAmount);
    if (isNaN(amount)) {
      setToAmount('');
      return;
    }

    if (conversionMode === 'crypto-crypto') {
      // Conversão Cripto para Cripto
      const fromId = symbolToId[fromCurrency];
      const toId = symbolToId[toCurrency];
      const fromPrice = prices[fromId]?.usd || 0;
      const toPrice = prices[toId]?.usd || 1;

      const result = (amount * fromPrice) / toPrice;
      // Aplica formatação adequada: USDT com 2 casas, outras criptos sem zeros extras
      if (toCurrency === 'USDT') {
        setToAmount(result.toFixed(2));
      } else {
        setToAmount(result.toString());
      }
    } else if (conversionMode === 'crypto-fiat') {
      // ✅ NOVO: Detectar direção da conversão
      const isFromCrypto = isCrypto(fromCurrency);

      if (isFromCrypto) {
        // Cripto → Fiat
        const cryptoId = symbolToId[fromCurrency];
        const cryptoPrice = prices[cryptoId]?.usd || 0;
        const fiatRate = rates[toCurrency] || 1;

        const usdValue = amount * cryptoPrice;
        const result = usdValue * fiatRate;
        setToAmount(result.toFixed(2));
      } else {
        // Fiat → Cripto
        const cryptoId = symbolToId[toCurrency];
        const cryptoPrice = prices[cryptoId]?.usd || 0;
        const fiatRate = rates[fromCurrency] || 1;

        const usdAmount = amount / fiatRate;
        const result = usdAmount / cryptoPrice;

        // Aplica formatação adequada: USDT com 2 casas, outras criptos sem zeros extras
        if (toCurrency === 'USDT') {
          setToAmount(result.toFixed(2));
        } else {
          setToAmount(result.toString());
        }
      }
    } else if (conversionMode === 'fiat-fiat') {
      // Conversão Moeda para Moeda
      const fromRate = rates[fromCurrency] || 1;
      const toRate = rates[toCurrency] || 1;

      const usdAmount = amount / fromRate;
      const result = usdAmount * toRate;
      setToAmount(result.toFixed(2));
    }
  }, [fromAmount, fromCurrency, toCurrency, prices, rates, conversionMode, symbolToId, isCrypto]);

  // Valida se há saldo suficiente (incluindo taxa de 0.5% para crypto)
  const hasInsufficientBalance = useMemo(() => {
    if (!fromAmount) return false;

    const amount = parseFloat(fromAmount);
    if (isNaN(amount) || amount <= 0) return false;

    if (conversionMode === 'crypto-crypto') {
      // Validação para Cripto → Cripto (com taxa de 0.5%)
      const fee = calculateConversionFee(amount);
      const totalNeeded = amount + fee;
      const balance = getCryptoBalance(fromCurrency);
      return balance < totalNeeded;
    } else if (conversionMode === 'crypto-fiat') {
      // ✅ NOVO: Detectar de qual tipo é o "from"
      const isFromCrypto = isCrypto(fromCurrency);

      if (isFromCrypto) {
        // Cripto → Fiat (sem taxa adicional)
        const balance = getCryptoBalance(fromCurrency);
        return balance < amount;
      } else {
        // Fiat → Cripto (sem taxa adicional)
        const balance = getFiatBalance(fromCurrency);
        return balance < amount;
      }
    } else if (conversionMode === 'fiat-fiat') {
      // Validação para Fiat → Fiat (sem taxa adicional)
      const balance = getFiatBalance(fromCurrency);
      return balance < amount;
    }

    return false;
  }, [fromAmount, fromCurrency, conversionMode, getCryptoBalance, getFiatBalance, isCrypto]);

  // Mensagem de erro de saldo
  const getBalanceErrorMessage = (): string | null => {
    if (!fromAmount) return null;

    const amount = parseFloat(fromAmount);
    if (isNaN(amount) || amount <= 0) return null;

    if (conversionMode === 'crypto-crypto') {
      const balance = getCryptoBalance(fromCurrency);

      if (balance === 0) {
        return `Sem saldo em ${fromCurrency}`;
      }

      if (hasInsufficientBalance) {
        return `Saldo insuficiente (inclui taxa 0,5%)`;
      }
    } else if (conversionMode === 'crypto-fiat') {
      const balance = getCryptoBalance(fromCurrency);

      if (balance === 0) {
        return `Sem saldo em ${fromCurrency}`;
      }

      if (hasInsufficientBalance) {
        return `Saldo insuficiente`;
      }
    } else if (conversionMode === 'fiat-fiat') {
      const balance = getFiatBalance(fromCurrency);

      if (balance === 0) {
        return `Sem saldo em ${fromCurrency}`;
      }

      if (hasInsufficientBalance) {
        return `Saldo insuficiente`;
      }
    }

    return null;
  };

  // Função para buscar conta bancária correspondente à moeda
  const getBankAccountByCurrency = async (currency: string): Promise<BankAccount | null> => {
    if (!user?.uid) return null;

    try {
      // Mapeamento de moeda para país
      const currencyToCountry: Record<string, string> = {
        'BRL': 'BR',
        'USD': 'US',
        'EUR': 'DE', // Pode ser qualquer país da zona do euro
        'GBP': 'GB',
      };

      const country = currencyToCountry[currency];
      if (!country) return null;

      console.log(`🔍 Buscando conta bancária para ${currency} (país: ${country})`);

      const accountsRef = collection(db, 'bankAccounts');
      const q = query(
        accountsRef,
        where('userId', '==', user.uid),
        where('country', '==', country)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.log('⚠️ Nenhuma conta bancária encontrada para', currency);
        return null;
      }

      const account = {
        ...snapshot.docs[0].data(),
        id: snapshot.docs[0].id,
        createdAt: snapshot.docs[0].data().createdAt?.toDate() || new Date(),
      } as BankAccount;

      console.log('✅ Conta bancária encontrada:', account);
      return account;
    } catch (error) {
      console.error('❌ Erro ao buscar conta bancária:', error);
      return null;
    }
  };

  // Função para navegar após conversão
  const navigateAfterConversion = async (targetCurrency: string, mode: 'crypto-crypto' | 'crypto-fiat' | 'fiat-fiat') => {
    console.log(`🧭 Navegando após conversão - Moeda destino: ${targetCurrency}, Modo: ${mode}`);

    if (mode === 'crypto-crypto') {
      // Converteu para cripto - navegar para Wallet
      console.log('📱 Navegando para Wallet (cripto)');
      onNavigate('wallet');
    } else if (mode === 'crypto-fiat') {
      // ✅ NOVO: Detectar se converteu para FIAT ou CRYPTO
      const isTargetCrypto = isCrypto(targetCurrency);

      if (isTargetCrypto) {
        // FIAT → CRYPTO: Navegar para Wallet
        console.log('📱 Navegando para Wallet (converteu fiat para cripto)');
        onNavigate('wallet');
      } else {
        // CRYPTO → FIAT: Navegar para conta bancária
        const account = await getBankAccountByCurrency(targetCurrency);

        if (account && onNavigateWithAccount) {
          console.log('🏦 Navegando para detalhes da conta bancária');
          onNavigateWithAccount('fiatAccountDetails', account);
        } else {
          // Se não encontrou a conta, vai para Home onde o carrossel está
          console.log('🏠 Conta não encontrada, navegando para Home');
          onNavigate('home');
        }
      }
    } else if (mode === 'fiat-fiat') {
      // Converteu para fiat - buscar conta bancária e navegar
      const account = await getBankAccountByCurrency(targetCurrency);

      if (account && onNavigateWithAccount) {
        console.log('🏦 Navegando para detalhes da conta bancária');
        onNavigateWithAccount('fiatAccountDetails', account);
      } else {
        // Se não encontrou a conta, vai para Home onde o carrossel está
        console.log('🏠 Conta não encontrada, navegando para Home');
        onNavigate('home');
      }
    }
  };

  const handleConfirmConversion = async () => {
    if (!toAmount || !fromAmount) return;

    setIsConverting(true);

    try {
      const fromCryptoOption = cryptoOptions.find(c => c.symbol === fromCurrency);
      const toCryptoOption = cryptoOptions.find(c => c.symbol === toCurrency);
      const fromFiatOption = fiatOptions.find(f => f.symbol === fromCurrency);
      const toFiatOption = fiatOptions.find(f => f.symbol === toCurrency);

      // Determinar os IDs e nomes baseados no modo de conversão
      let fromCoinId: string | undefined;
      let toCoinId: string | undefined;
      let fromName: string | undefined;
      let toName: string | undefined;

      if (conversionMode === 'crypto-crypto') {
        // Ambas são crypto
        fromCoinId = fromCryptoOption?.id;
        toCoinId = toCryptoOption?.id;
        fromName = fromCryptoOption?.name;
        toName = toCryptoOption?.name;
      } else if (conversionMode === 'crypto-fiat') {
        // ✅ NOVO: Detectar direção (pode ser CRYPTO→FIAT ou FIAT→CRYPTO)
        const isFromCrypto = isCrypto(fromCurrency);

        if (isFromCrypto) {
          // CRYPTO → FIAT
          fromCoinId = fromCryptoOption?.id;
          toCoinId = undefined; // Fiat não tem coinId
          fromName = fromCryptoOption?.name;
          toName = toFiatOption?.name;
        } else {
          // FIAT → CRYPTO
          fromCoinId = undefined; // Fiat não tem coinId
          toCoinId = toCryptoOption?.id;
          fromName = fromFiatOption?.name;
          toName = toCryptoOption?.name;
        }
      } else if (conversionMode === 'fiat-fiat') {
        // Ambas são fiat
        fromCoinId = undefined;
        toCoinId = undefined;
        fromName = fromFiatOption?.name;
        toName = toFiatOption?.name;
      }

      const result = await executeConversion(
        fromCurrency,
        toCurrency,
        parseFloat(fromAmount),
        parseFloat(toAmount),
        exchangeRate,
        conversionMode,
        fromCoinId,
        toCoinId,
        fromName,
        toName
      );

      if (result.success) {
        // Salvar transação no Firestore
        try {
          await addTransaction({
            type: 'convert',
            status: 'completed',
            amount: parseFloat(toAmount),
            currency: toCurrency,
            fromAmount: parseFloat(fromAmount),
            fromCurrency: fromCurrency,
            toAmount: parseFloat(toAmount),
            toCurrency: toCurrency,
            fee: conversionMode === 'crypto-crypto' ? parseFloat(fromAmount) * 0.005 : 0,
            feeCurrency: fromCurrency,
            description: `Conversão ${fromCurrency} → ${toCurrency}`,
          });
          console.log('✅ Transação salva no Firestore');
        } catch (error) {
          console.error('❌ Erro ao salvar transação:', error);
          // Não bloqueia o fluxo se falhar ao salvar a transação
        }

        // Limpar campos após sucesso
        setFromAmount('');
        setToAmount('');
        toast.success('Conversão realizada com sucesso!');
        // Mostrar modal de sucesso (não navega automaticamente mais)
        setShowSuccessModal(true);
        // Notificar a conversão
        if (user?.uid) {
          await notifyConversion(user.uid, parseFloat(fromAmount), fromCurrency, parseFloat(toAmount), toCurrency);
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Erro ao executar a conversão:', error);
      toast.error('Erro ao processar conversão');
    } finally {
      setIsConverting(false);
    }
  };

  const handleAnotherConversion = () => {
    setShowSuccessModal(false);
    // Já limpa os campos e fica na tela de converter
  };

  const handleGoHome = () => {
    setShowSuccessModal(false);
    onNavigate('home');
  };

  // 🗑️ Excluir conversão individual
  const handleDeleteConversion = async (conversionId: string) => {
    if (!user?.uid || !conversionId) return;

    const confirmed = window.confirm('⚠️ Deseja excluir esta conversão?');
    if (!confirmed) return;

    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'users', user.uid, 'conversions', conversionId));

      toast.success('✅ Conversão excluída com sucesso!');
      console.log(`🗑️ Conversão ${conversionId} removida`);
    } catch (error) {
      console.error('❌ Erro ao excluir conversão:', error);
      toast.error('Erro ao excluir conversão');
    }
  };

  // 💰 Converter todo saldo
  const handleConvertAll = () => {
    const balance = isCrypto(fromCurrency)
      ? getCryptoBalance(fromCurrency)
      : getFiatBalance(fromCurrency);

    if (balance <= 0) {
      toast.error('Saldo insuficiente');
      return;
    }

    // Calcular o valor máximo considerando a taxa de 0.5% para crypto-crypto
    let maxAmount: number;

    if (conversionMode === 'crypto-crypto') {
      // Para crypto-crypto, precisa descontar a taxa de 0.5%
      // Se saldo = 100, a taxa é 0.5, então só pode converter 99.5
      // Fórmula: valor_conversivel = saldo / 1.005
      maxAmount = balance / 1.005;
    } else {
      // Para crypto-fiat e fiat-fiat não há taxa adicional
      maxAmount = balance;
    }

    // Converter para centavos e formatar como string para o input
    // O handleFromAmountChange espera receber uma string de números que representam centavos
    // Exemplo: 1234.56 -> "123456" (centavos)
    const valueInCents = Math.floor(maxAmount * 100);
    const stringValue = valueInCents.toString();

    // Simular digitação passando a string de centavos
    const event = { target: { value: stringValue } };
    handleFromAmountChange(stringValue);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative">
      {/* Header */}
      <div className="px-6 pt-12 pb-2 flex items-center flex-shrink-0">
        <button
          className="w-10 h-10 flex items-center justify-start text-white"
          onClick={() => onNavigate('home')}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center text-lg">Exchange</h1>
        <div className="w-10 h-10"></div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar pb-28">
        <div className="flex flex-col px-4 pt-6">
          {/* Mode Selector Tabs */}
          <div className="flex gap-2 mb-6 bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-1.5">
            <button
              onClick={() => handleModeChange('crypto-crypto')}
              className={`flex-1 py-2.5 rounded-xl text-xs transition-all ${conversionMode === 'crypto-crypto'
                ? 'bg-white text-black'
                : 'text-gray-500'
                }`}
            >
              Cripto → Cripto
            </button>
            <button
              onClick={() => handleModeChange('crypto-fiat')}
              className={`flex-1 py-2.5 rounded-xl text-xs transition-all ${conversionMode === 'crypto-fiat'
                ? 'bg-white text-black'
                : 'text-gray-500'
                }`}
            >
              Cripto → Moeda
            </button>
            <button
              onClick={() => handleModeChange('fiat-fiat')}
              className={`flex-1 py-2.5 rounded-xl text-xs transition-all ${conversionMode === 'fiat-fiat'
                ? 'bg-white text-black'
                : 'text-gray-500'
                }`}
            >
              Moeda → Moeda
            </button>
          </div>

          {/* Exchange Cards Container */}
          <div className="relative space-y-2">
            {/* From Card */}
            <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-3xl p-6 flex items-center justify-between h-32 relative">
              {/* Botão Converter Tudo - Topo do Card */}
              <button
                className="absolute top-3 right-3 text-[10px] text-gray-500 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                onClick={handleConvertAll}
              >
                Converter tudo
              </button>

              <div className="flex flex-col gap-1">
                <button
                  className="flex items-center gap-2 group"
                  onClick={() => {
                    setShowFromSelector(!showFromSelector);
                    setShowToSelector(false);
                  }}
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center">
                    {isCrypto(fromCurrency) ? (
                      <CryptoIcon symbol={fromCurrency} size="xs" />
                    ) : (
                      <img
                        src={fiatOptions.find(f => f.symbol === fromCurrency)?.flag}
                        alt={fromCurrency}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <span className="text-xl text-white">{fromCurrency}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                <p className="text-gray-500 text-xs mt-1">
                  {isCrypto(fromCurrency)
                    ? `Saldo: ${formatCrypto(getCryptoBalance(fromCurrency))} ${fromCurrency}`
                    : `Saldo: ${formatCurrency(getFiatBalance(fromCurrency).toString(), fromCurrency)}`}
                </p>
              </div>
              <div className="text-right">
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatInputDisplay(fromAmount)}
                  onChange={(e) => handleFromAmountChange(e.target.value)}
                  placeholder="0,00"
                  className="text-base font-normal text-white bg-transparent text-right focus:outline-none w-32 placeholder-gray-700"
                  style={{ caretColor: '#0A84FF' }}
                  ref={inputRef}
                />
              </div>

              {/* From Selector Dropdown */}
              {showFromSelector && (
                <div className="absolute left-6 top-20 bg-zinc-900 rounded-xl p-2 shadow-2xl border border-zinc-700 z-50 w-[200px] max-h-[280px] overflow-y-auto">
                  {conversionMode === 'crypto-crypto' && availableCryptos.map(option => (
                    <button
                      key={option.symbol}
                      className="flex items-center gap-3 py-2.5 px-3 w-full text-left hover:bg-zinc-800 rounded-lg transition-colors"
                      onClick={() => {
                        // Se selecionar a mesma moeda que está em "Para", trocar
                        if (option.symbol === toCurrency) {
                          setToCurrency(fromCurrency);
                        }
                        setFromCurrency(option.symbol);
                        setShowFromSelector(false);
                      }}
                    >
                      <CryptoIcon symbol={option.symbol} size="xs" />
                      <div>
                        <div className="font-semibold text-sm">{option.name}</div>
                        <div className="text-xs text-gray-500">{option.symbol}</div>
                      </div>
                    </button>
                  ))}
                  {conversionMode === 'crypto-fiat' && (
                    <>
                      {/* ✅ NOVO: Mostrar criptos */}
                      {cryptoOptions.map(option => (
                        <button
                          key={option.symbol}
                          className="flex items-center gap-3 py-2.5 px-3 w-full text-left hover:bg-zinc-800 rounded-lg transition-colors"
                          onClick={() => {
                            setFromCurrency(option.symbol);
                            setShowFromSelector(false);
                          }}
                        >
                          <CryptoIcon symbol={option.symbol} size="xs" />
                          <div>
                            <div className="text-sm">{option.name}</div>
                            <div className="text-xs text-gray-500">{option.symbol}</div>
                          </div>
                        </button>
                      ))}
                      {/* ✅ NOVO: Divisor */}
                      <div className="h-px bg-zinc-700 my-2" />
                      {/* ✅ NOVO: Mostrar moedas fiat */}
                      {availableFiatCurrencies.map(option => (
                        <button
                          key={option.symbol}
                          className="flex items-center gap-3 py-2.5 px-3 w-full text-left hover:bg-zinc-800 rounded-lg transition-colors"
                          onClick={() => {
                            setFromCurrency(option.symbol);
                            setShowFromSelector(false);
                          }}
                        >
                          <img src={option.flag} alt={option.name} className="w-5 h-5" />
                          <div>
                            <div className="text-sm">{option.name}</div>
                            <div className="text-xs text-gray-500">{option.symbol}</div>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                  {conversionMode === 'fiat-fiat' && availableFiatCurrencies.map(option => (
                    <button
                      key={option.symbol}
                      className="flex items-center gap-3 py-2.5 px-3 w-full text-left hover:bg-zinc-800 rounded-lg transition-colors"
                      onClick={() => {
                        // Se selecionar a mesma moeda que está em "Para", trocar
                        if (option.symbol === toCurrency) {
                          setToCurrency(fromCurrency);
                        }
                        setFromCurrency(option.symbol);
                        setShowFromSelector(false);
                      }}
                    >
                      <img src={option.flag} alt={option.name} className="w-5 h-5" />
                      <div>
                        <div className="text-sm">{option.name}</div>
                        <div className="text-xs text-gray-500">{option.symbol}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Swap Button */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <button
                className="w-10 h-10 bg-white/10 backdrop-blur-md text-white rounded-full flex items-center justify-center border border-white/20 active:scale-90 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.1),0_4px_15px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.3),inset_0_-1px_2px_rgba(0,0,0,0.3)]"
                onClick={handleSwap}
              >
                <div className="flex flex-col items-center justify-center gap-0">
                  <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                  <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
              </button>
            </div>

            {/* To Card */}
            <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-3xl p-6 flex items-center justify-between h-32 relative">
              <div className="flex flex-col gap-1">
                <button
                  className="flex items-center gap-2 group"
                  onClick={() => {
                    setShowToSelector(!showToSelector);
                    setShowFromSelector(false);
                  }}
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center">
                    {isCrypto(toCurrency) ? (
                      <CryptoIcon symbol={toCurrency} size="xs" />
                    ) : (
                      <img
                        src={fiatOptions.find(f => f.symbol === toCurrency)?.flag}
                        alt={toCurrency}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <span className="text-xl text-white">{toCurrency}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                <p className="text-gray-500 text-xs mt-1">
                  {isCrypto(toCurrency) ? `Saldo: 0 ${toCurrency}` : `Saldo: $ 0,00`}
                </p>
              </div>
              <div className="text-right flex items-center">
                <div className="text-base font-normal text-white text-right w-32 flex items-baseline justify-end">
                  {toAmount ? (
                    isFiat(toCurrency) ? (
                      <>
                        <span className="text-base">
                          {formatCurrency(toAmount, toCurrency).split(',')[0]}
                        </span>
                        {formatCurrency(toAmount, toCurrency).includes(',') && (
                          <span className="text-sm">
                            ,{formatCurrency(toAmount, toCurrency).split(',')[1]}
                          </span>
                        )}
                      </>
                    ) : (
                      // Aplica formatação para criptomoedas
                      toCurrency === 'USDT'
                        ? formatCurrency(toAmount)
                        : formatCrypto(parseFloat(toAmount))
                    )
                  ) : (
                    '0'
                  )}
                </div>
                <div className="h-6 w-[2px] bg-[#0A84FF] ml-0.5 animate-pulse"></div>
              </div>

              {/* To Selector Dropdown */}
              {showToSelector && (
                <div className="absolute left-6 top-20 bg-zinc-900 rounded-xl p-2 shadow-2xl border border-zinc-700 z-50 w-[200px] max-h-[280px] overflow-y-auto">
                  {conversionMode === 'crypto-crypto' && cryptoOptions.map(option => (
                    <button
                      key={option.symbol}
                      className="flex items-center gap-3 py-2.5 px-3 w-full text-left hover:bg-zinc-800 rounded-lg transition-colors"
                      onClick={() => {
                        // Se selecionar a mesma moeda que está em "De", trocar
                        if (option.symbol === fromCurrency) {
                          setFromCurrency(toCurrency);
                        }
                        setToCurrency(option.symbol);
                        setShowToSelector(false);
                      }}
                    >
                      <CryptoIcon symbol={option.symbol} size="xs" />
                      <div>
                        <div className="font-semibold text-sm">{option.name}</div>
                        <div className="text-xs text-gray-500">{option.symbol}</div>
                      </div>
                    </button>
                  ))}
                  {conversionMode === 'crypto-fiat' && (
                    <>
                      {/* ✅ NOVO: Mostrar criptos */}
                      {cryptoOptions.map(option => (
                        <button
                          key={option.symbol}
                          className="flex items-center gap-3 py-2.5 px-3 w-full text-left hover:bg-zinc-800 rounded-lg transition-colors"
                          onClick={() => {
                            setToCurrency(option.symbol);
                            setShowToSelector(false);
                          }}
                        >
                          <CryptoIcon symbol={option.symbol} size="xs" />
                          <div>
                            <div className="text-sm">{option.name}</div>
                            <div className="text-xs text-gray-500">{option.symbol}</div>
                          </div>
                        </button>
                      ))}
                      {/* ✅ NOVO: Divisor */}
                      <div className="h-px bg-zinc-700 my-2" />
                      {/* ✅ NOVO: Mostrar moedas fiat */}
                      {availableFiatCurrencies.map(option => (
                        <button
                          key={option.symbol}
                          className="flex items-center gap-3 py-2.5 px-3 w-full text-left hover:bg-zinc-800 rounded-lg transition-colors"
                          onClick={() => {
                            setToCurrency(option.symbol);
                            setShowToSelector(false);
                          }}
                        >
                          <img src={option.flag} alt={option.name} className="w-5 h-5" />
                          <div>
                            <div className="text-sm">{option.name}</div>
                            <div className="text-xs text-gray-500">{option.symbol}</div>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                  {conversionMode === 'fiat-fiat' && availableFiatCurrencies.map(option => (
                    <button
                      key={option.symbol}
                      className="flex items-center gap-3 py-2.5 px-3 w-full text-left hover:bg-zinc-800 rounded-lg transition-colors"
                      onClick={() => {
                        // Se selecionar a mesma moeda que está em "De", trocar
                        if (option.symbol === fromCurrency) {
                          setFromCurrency(toCurrency);
                        }
                        setToCurrency(option.symbol);
                        setShowToSelector(false);
                      }}
                    >
                      <img src={option.flag} alt={option.name} className="w-5 h-5" />
                      <div>
                        <div className="text-sm">{option.name}</div>
                        <div className="text-xs text-gray-500">{option.symbol}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Exchange Info */}
          <div className="mt-6 px-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-xs">Cotação</span>
              <span className="text-xs text-white">
                {fromAmount || '1'} {fromCurrency} = {
                  isCrypto(toCurrency) && toCurrency !== 'USDT'
                    ? formatCrypto((parseFloat(fromAmount) || 1) * exchangeRate)
                    : formatCurrency((parseFloat(fromAmount) || 1) * exchangeRate)
                } {toCurrency}
              </span>
            </div>
            {conversionMode === 'crypto-crypto' && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-xs">Taxa de conversão (0.5%)</span>
                <span className="text-xs text-white">
                  {fromAmount ? (
                    isCrypto(fromCurrency) && fromCurrency !== 'USDT'
                      ? formatCrypto(parseFloat(fromAmount) * 0.005)
                      : formatCurrency(parseFloat(fromAmount) * 0.005)
                  ) : '0'} {fromCurrency}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <span className="text-gray-500 text-xs">Processamento</span>
              <span className="text-xs text-white">~ 30 segundos</span>
            </div>
          </div>

          {/* Confirm Button */}
          <div className="mt-6 px-2 pb-6">
            <button
              className={`w-full h-14 text-base rounded-2xl transition-opacity ${toAmount && fromAmount
                ? 'bg-white text-black active:opacity-90'
                : 'bg-zinc-800 text-gray-600 cursor-not-allowed'
                }`}
              disabled={!toAmount || !fromAmount || hasInsufficientBalance}
              onClick={handleConfirmConversion}
            >
              {isConverting ? 'Convertendo...' : 'Confirmar Exchange'}
            </button>
            {hasInsufficientBalance && (
              <p className="text-red-500 text-xs mt-2 text-center">
                {getBalanceErrorMessage()}
              </p>
            )}
          </div>

          {/* History Section */}
          <div className="mt-10 px-2 pb-24">
            {/* Header com botão de expandir */}
            <button
              className="w-full flex items-center justify-between mb-4 active:opacity-70 transition-opacity"
              onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
            >
              <h2 className="text-white text-lg">Histórico de Conversões</h2>
              <ChevronDown
                className={`w-5 h-5 text-gray-500 transition-transform ${isHistoryExpanded ? 'rotate-180' : ''
                  }`}
              />
            </button>

            {/* Conteúdo do histórico - só exibe quando expandido */}
            {isHistoryExpanded && (
              <>
                {(() => {
                  console.log('🔍 [Convert] Estado do histórico:', {
                    isLoading,
                    conversionsCount: conversions.length,
                    conversions: conversions.slice(0, 3), // Primeiras 3 para debug
                  });

                  return null;
                })()}
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
                    <p className="text-white/50 text-sm mt-4">Carregando histórico...</p>
                  </div>
                ) : conversions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-white/50 text-sm">Nenhuma conversão realizada ainda</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {conversions.map((conversion, index) => {
                      const showDivider = index < conversions.length - 1;
                      const date = conversion.createdAt;
                      const dateStr = date.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <div key={conversion.id || index}>
                          <div
                            className="flex items-center justify-between py-4 active:bg-zinc-900/50 transition-colors cursor-pointer"
                            onDoubleClick={() => conversion.id && handleDeleteConversion(conversion.id)}
                            title="Clique 2x para excluir"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
                                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm text-white">
                                  {conversion.fromCurrency} para {conversion.toCurrency}
                                </p>
                                <p className="text-[10px] text-gray-500">{dateStr}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-white">
                                +{
                                  conversion.toCurrency === 'USDT' || isFiat(conversion.toCurrency)
                                    ? formatCurrency(conversion.toAmount)
                                    : formatCrypto(conversion.toAmount)
                                } {conversion.toCurrency}
                              </p>
                              <p className="text-[10px] text-gray-500">
                                -{
                                  conversion.fromCurrency === 'USDT' || isFiat(conversion.fromCurrency)
                                    ? formatCurrency(conversion.fromAmount)
                                    : formatCrypto(conversion.fromAmount)
                                } {conversion.fromCurrency}
                              </p>
                            </div>
                          </div>
                          {showDivider && <div className="h-px bg-zinc-900 w-full ml-12"></div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-6 overflow-hidden">
          <div className="bg-black w-full h-full flex flex-col items-center justify-start pt-20 px-8 overflow-hidden">
            {/* Ícone de sucesso */}
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-white text-xl font-bold mb-3 text-center">Conversão Realizada!</h2>
            <p className="text-white/70 text-sm mb-8 text-center">
              Deseja fazer outra conversão?
            </p>

            <div className="flex flex-col gap-3 w-full max-w-sm">
              <button
                className="w-full h-14 bg-white text-black font-bold text-base rounded-2xl transition-opacity active:opacity-90"
                onClick={handleAnotherConversion}
              >
                Sim, fazer outra
              </button>
              <button
                className="w-full h-14 bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold text-base rounded-2xl transition-opacity active:opacity-90"
                onClick={handleGoHome}
              >
                Não, voltar para Home
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}