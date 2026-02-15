import { useState, useEffect, useRef } from 'react';
import { Search, ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown, Activity, Settings2, ChevronRight, Receipt } from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useCryptoPrices } from '../contexts/CryptoPriceContext';
import { usePortfolio } from '../contexts/PortfolioContext';
import { useFiatRates } from '../contexts/FiatRatesContext';
import { useLocation } from '../contexts/LocationContext'; // ✅ Adicionar contexto de localização + erro do Firestore
import { useLanguage } from '../contexts/LanguageContext'; // ✅ Adicionar contexto de idioma
import { compressImageToBase64 } from '../lib/imageCompress';
import { toast } from 'sonner';
import { CryptoIcon } from './CryptoIcon';
import { MiniChart } from './MiniChart';
import { PortfolioChart } from './PortfolioChart';
import { SearchModal } from './SearchModal';
import { StatsModal } from './StatsModal';
import { ManageCardsModal } from './ManageCardsModal';
import { FiatAccountsCarousel } from './FiatAccountsCarousel';
import { FormattedAmount } from './FormattedAmount';
import { FirestoreSetupInstructions } from './FirestoreSetupInstructions'; // ✅ Importar componente de instruções
import type { Screen } from '../App';
import { BankAccount } from '../lib/bankAccountGenerator';

interface NewHomeProps {
  onNavigate: (screen: Screen) => void;
  onNavigateWithAccount?: (screen: Screen, account: BankAccount) => void;
}

// Função para formatar números no padrão brasileiro
function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Função para formatar moedas
function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Função para formatar quantidades de cripto
function formatCrypto(value: number): string {
  if (value >= 1) {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  }
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 6,
    maximumFractionDigits: 8,
  });
}

export function NewHome({ onNavigate, onNavigateWithAccount }: NewHomeProps) {
  // ✅ PRIMEIRO: Declarar todos os hooks
  const { prices } = useCryptoPrices();
  const { portfolio } = usePortfolio();
  const { rates } = useFiatRates();
  const { user, userData, updateVisibleCards } = useAuth();
  const { location, firestoreError } = useLocation(); // ✅ Adicionar contexto de localização + erro do Firestore
  const { t } = useLanguage(); // ✅ Adicionar hook de idioma

  // ✅ DEPOIS: Estados locais
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isManageCardsModalOpen, setIsManageCardsModalOpen] = useState(false);
  const [showFirestoreSetup, setShowFirestoreSetup] = useState(false); // ✅ Estado para modal de setup
  const [profilePhoto, setProfilePhoto] = useState('');

  // ✅ Estado para controlar quais cards estão visíveis - AGORA DO FIRESTORE
  const [visibleCards, setVisibleCards] = useState<string[]>(['BTC', 'ETH', 'SOL', 'BNB']);

  // ✅ Estado para moedas disponíveis baseadas nas contas fiat do usuário
  const [availableCurrencies, setAvailableCurrencies] = useState<('USD' | 'BRL' | 'GBP' | 'EUR')[]>(['USD']);
  const [userAccounts, setUserAccounts] = useState<BankAccount[]>([]);

  // ✅ Carregar preferências do Firestore
  useEffect(() => {
    if (userData?.preferences?.visibleCards) {
      setVisibleCards(userData.preferences.visibleCards);
    }
  }, [userData]);

  // ✅ Carregar moedas disponíveis baseadas nas contas fiat do usuário
  useEffect(() => {
    if (!user) return;

    const loadAvailableCurrencies = async () => {
      try {
        const accountsRef = collection(db, 'bankAccounts');
        const q = query(accountsRef, where('userId', '==', user.uid));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          // Se não tem contas, mostrar apenas USD
          setAvailableCurrencies(['USD']);
          setDisplayCurrency('USD');
          return;
        }

        // Mapear contas para moedas e remover duplicatas
        const currenciesMap: { [key: string]: 'USD' | 'BRL' | 'GBP' | 'EUR' } = {
          'USD': 'USD',
          'BRL': 'BRL',
          'GBP': 'GBP',
          'EUR': 'EUR'
        };

        const userCurrencies = snapshot.docs
          .map(doc => {
            const account = doc.data() as BankAccount;
            return currenciesMap[account.currency];
          })
          .filter((curr): curr is 'USD' | 'BRL' | 'GBP' | 'EUR' => curr !== undefined);

        // Remover duplicatas mantendo ordem
        const uniqueCurrencies = Array.from(new Set(userCurrencies));

        if (uniqueCurrencies.length > 0) {
          setAvailableCurrencies(uniqueCurrencies);
          // Se a moeda atual não está disponível, mudar para a primeira disponível
          if (!uniqueCurrencies.includes(displayCurrency)) {
            setDisplayCurrency(uniqueCurrencies[0]);
          }
        } else {
          setAvailableCurrencies(['USD']);
          setDisplayCurrency('USD');
        }

        // Salvar contas do usuário
        setUserAccounts(snapshot.docs.map(doc => doc.data() as BankAccount));
      } catch (error) {
        console.error('Erro ao carregar moedas disponíveis:', error);
        setAvailableCurrencies(['USD']);
      }
    };

    loadAvailableCurrencies();
  }, [user]);

  // ✅ Função para toggle de cards (adicionar ou remover) - SALVA NO FIRESTORE
  const toggleCard = async (symbol: string) => {
    const newVisibleCards = visibleCards.includes(symbol)
      ? visibleCards.filter(s => s !== symbol)
      : [...visibleCards, symbol];

    setVisibleCards(newVisibleCards);

    // Salvar no Firestore
    try {
      await updateVisibleCards(newVisibleCards);
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
    }
  };

  // Lista expandida de criptomoedas disponíveis (incluindo as mais populares)
  const availableCryptos = [
    { symbol: 'BTC', name: 'Bitcoin', coinId: 'bitcoin' },
    { symbol: 'ETH', name: 'Ethereum', coinId: 'ethereum' },
    { symbol: 'SOL', name: 'Solana', coinId: 'solana' },
    { symbol: 'BNB', name: 'BNB', coinId: 'binancecoin' },
    { symbol: 'XRP', name: 'Ripple', coinId: 'ripple' },
    { symbol: 'ADA', name: 'Cardano', coinId: 'cardano' },
    { symbol: 'AVAX', name: 'Avalanche', coinId: 'avalanche-2' },
    { symbol: 'DOGE', name: 'Dogecoin', coinId: 'dogecoin' },
    { symbol: 'DOT', name: 'Polkadot', coinId: 'polkadot' },
    { symbol: 'MATIC', name: 'Polygon', coinId: 'matic-network' },
    { symbol: 'LINK', name: 'Chainlink', coinId: 'chainlink' },
    { symbol: 'UNI', name: 'Uniswap', coinId: 'uniswap' },
    { symbol: 'LTC', name: 'Litecoin', coinId: 'litecoin' },
    { symbol: 'ATOM', name: 'Cosmos', coinId: 'cosmos' },
    { symbol: 'XLM', name: 'Stellar', coinId: 'stellar' },
    { symbol: 'TRX', name: 'Tron', coinId: 'tron' },
    { symbol: 'SHIB', name: 'Shiba Inu', coinId: 'shiba-inu' },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', coinId: 'wrapped-bitcoin' },
    { symbol: 'DAI', name: 'Dai', coinId: 'dai' },
    { symbol: 'LEO', name: 'UNUS SED LEO', coinId: 'leo-token' },
    { symbol: 'USDC', name: 'USD Coin', coinId: 'usd-coin' },
    { symbol: 'TON', name: 'Toncoin', coinId: 'the-open-network' },
    { symbol: 'ETC', name: 'Ethereum Classic', coinId: 'ethereum-classic' },
    { symbol: 'BCH', name: 'Bitcoin Cash', coinId: 'bitcoin-cash' },
    { symbol: 'APT', name: 'Aptos', coinId: 'aptos' },
    { symbol: 'ARB', name: 'Arbitrum', coinId: 'arbitrum' },
    { symbol: 'OP', name: 'Optimism', coinId: 'optimism' },
    { symbol: 'ICP', name: 'Internet Computer', coinId: 'internet-computer' },
    { symbol: 'FIL', name: 'Filecoin', coinId: 'filecoin' },
    { symbol: 'NEAR', name: 'NEAR Protocol', coinId: 'near' },
    { symbol: 'VET', name: 'VeChain', coinId: 'vechain' },
    { symbol: 'ALGO', name: 'Algorand', coinId: 'algorand' },
    { symbol: 'INJ', name: 'Injective', coinId: 'injective-protocol' },
    { symbol: 'AAVE', name: 'Aave', coinId: 'aave' },
    { symbol: 'MKR', name: 'Maker', coinId: 'maker' },
    { symbol: 'GRT', name: 'The Graph', coinId: 'the-graph' },
    { symbol: 'IMX', name: 'Immutable X', coinId: 'immutable-x' },
    { symbol: 'STX', name: 'Stacks', coinId: 'blockstack' },
    { symbol: 'HBAR', name: 'Hedera', coinId: 'hedera-hashgraph' },
    { symbol: 'FTM', name: 'Fantom', coinId: 'fantom' },
    { symbol: 'SAND', name: 'The Sandbox', coinId: 'the-sandbox' },
    { symbol: 'MANA', name: 'Decentraland', coinId: 'decentraland' },
    { symbol: 'AXS', name: 'Axie Infinity', coinId: 'axie-infinity' },
    { symbol: 'XTZ', name: 'Tezos', coinId: 'tezos' },
    { symbol: 'THETA', name: 'Theta Network', coinId: 'theta-token' },
    { symbol: 'EOS', name: 'EOS', coinId: 'eos' },
    { symbol: 'XMR', name: 'Monero', coinId: 'monero' },
    { symbol: 'FLOW', name: 'Flow', coinId: 'flow' },
    { symbol: 'CHZ', name: 'Chiliz', coinId: 'chiliz' },
    { symbol: 'ZEC', name: 'Zcash', coinId: 'zcash' },
    { symbol: 'RUNE', name: 'THORChain', coinId: 'thorchain' },
    { symbol: 'KLAY', name: 'Klaytn', coinId: 'klay-token' },
    { symbol: 'DASH', name: 'Dash', coinId: 'dash' },
    { symbol: 'NEO', name: 'Neo', coinId: 'neo' },
    { symbol: 'IOTA', name: 'IOTA', coinId: 'iota' },
    { symbol: 'QNT', name: 'Quant', coinId: 'quant-network' },
    { symbol: 'EGLD', name: 'MultiversX', coinId: 'elrond-erd-2' },
    { symbol: 'PEPE', name: 'Pepe', coinId: 'pepe' },
    { symbol: 'FET', name: 'Fetch.ai', coinId: 'fetch-ai' },
    { symbol: 'SUI', name: 'Sui', coinId: 'sui' },
    { symbol: 'SEI', name: 'Sei', coinId: 'sei-network' },
  ];

  // Estado para controlar a moeda exibida no saldo
  const [displayCurrency, setDisplayCurrency] = useState<'USD' | 'BRL' | 'GBP' | 'EUR'>('USD');
  const [animatedValue, setAnimatedValue] = useState(0);

  // Carregar foto do perfil do Firestore quando o componente montar
  useEffect(() => {
    if (userData?.photoURL) {
      setProfilePhoto(userData.photoURL);
    }
  }, [userData]);

  // Bloquear scroll do body quando modais estiverem abertos
  useEffect(() => {
    if (isSearchModalOpen || isStatsModalOpen || isManageCardsModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSearchModalOpen, isStatsModalOpen, isManageCardsModalOpen]);

  // ✅ Detectar erro de permissão do Firestore e mostrar instruções automaticamente
  useEffect(() => {
    if (firestoreError && (firestoreError.includes('Firestore') || firestoreError.includes('permission'))) {
      console.log('🚨 [NewHome] Erro de Firestore detectado:', firestoreError);
      console.log('🚨 [NewHome] Abrindo modal de instruções...');

      // Aguardar 2 segundos antes de mostrar para não ficar muito agressivo
      const timer = setTimeout(() => {
        setShowFirestoreSetup(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [firestoreError]);

  const btcPrice = prices.bitcoin?.usd || 0;
  const ethPrice = prices.ethereum?.usd || 0;
  // USDT é stablecoin - sempre fixo em $1.00 USD (não usar API que pode ter pequenas variações)
  const usdtPrice = 1.00;

  const btcChange = prices.bitcoin?.usd_24h_change || 0;
  const ethChange = prices.ethereum?.usd_24h_change || 0;
  const usdtChange = prices.tether?.usd_24h_change || 0;

  // Solana e BNB
  const solPrice = prices.solana?.usd || 0;
  const bnbPrice = prices.binancecoin?.usd || 0;

  const solChange = prices.solana?.usd_24h_change || 0;
  const bnbChange = prices.binancecoin?.usd_24h_change || 0;

  // Dados do portfólio em tempo real
  const totalBalance = portfolio.totalBalanceUSDT;
  const change24h = portfolio.change24h;
  const changePercent = portfolio.changePercent24h;
  const isPositive = change24h >= 0;

  // Converter variação USDT para USD em tempo real
  const change24hUSD = change24h * usdtPrice;

  // Calcular saldo USDT do usuário
  const usdtHolding = portfolio.holdings.find(h => h.symbol === 'USDT');
  const usdtBalance = usdtHolding ? usdtHolding.amount : 8000;

  // Calcular o valor atual na moeda selecionada
  const currentValue = totalBalance * usdtPrice * (rates[displayCurrency] || 1);

  // Inicializar animatedValue com o valor correto na primeira renderização
  useEffect(() => {
    if (animatedValue === 0 && currentValue > 0) {
      setAnimatedValue(currentValue);
    }
  }, [currentValue]);

  // Animar a transição do valor quando a moeda mudar
  useEffect(() => {
    if (animatedValue === 0) return; // Não animar se ainda não foi inicializado

    const startValue = animatedValue;
    const endValue = currentValue;
    const duration = 400; // 400ms de animação
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (easeOutCubic) para animação suave
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const value = startValue + (endValue - startValue) * easeProgress;
      setAnimatedValue(value);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [displayCurrency]);

  // Ciclar entre as moedas ao clicar
  const cycleCurrency = () => {
    // Apenas ciclar se tiver moedas disponíveis
    if (availableCurrencies.length === 0) return;

    // Efeito sonoro de contador de números
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Criar uma sequência de "ticks" rápidos como contador
    const tickCount = 8; // Número de "ticks"
    const tickDuration = 0.02; // Duração de cada tick
    const tickInterval = 0.05; // Intervalo entre ticks

    for (let i = 0; i < tickCount; i++) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const startTime = audioContext.currentTime + (i * tickInterval);

      // Som de "tick" - frequência mais alta e curta
      oscillator.frequency.setValueAtTime(1200 + (i * 50), startTime);

      // Volume diminui gradualmente
      const volume = 0.15 * (1 - (i / tickCount) * 0.5);
      gainNode.gain.setValueAtTime(volume, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + tickDuration);

      oscillator.start(startTime);
      oscillator.stop(startTime + tickDuration);
    }

    // Rotacionar apenas entre as moedas disponíveis
    const currentIndex = availableCurrencies.indexOf(displayCurrency);
    const nextIndex = (currentIndex + 1) % availableCurrencies.length;
    setDisplayCurrency(availableCurrencies[nextIndex]);
  };

  // Função para obter símbolo da moeda
  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      USD: '$',
      BRL: 'R$',
      GBP: '£',
      EUR: '€',
    };
    return symbols[currency] || '$';
  };

  // Handler para trocar foto de perfil
  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      // Mostrar toast de carregamento
      toast.loading('Comprimindo foto...', { id: 'upload-photo' });

      // Comprimir imagem para base64 (pequena o suficiente para Firestore)
      const compressedBase64 = await compressImageToBase64(file, 200, 0.7);

      // Mostrar preview
      setProfilePhoto(compressedBase64);

      // Atualizar toast
      toast.loading('Salvando foto...', { id: 'upload-photo' });

      // Salvar no Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: compressedBase64,
      });

      toast.success('Foto atualizada com sucesso!', { id: 'upload-photo' });
    } catch (error) {
      console.error('Erro ao salvar foto:', error);
      toast.error('Erro ao enviar foto. Tente novamente.', { id: 'upload-photo' });
      // Reverter para foto anterior em caso de erro
      if (userData?.photoURL) {
        setProfilePhoto(userData.photoURL);
      }
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col bg-gradient-to-b from-[#1a2942] via-black to-black">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Header */}
        <header className="px-6 pt-12 pb-4 flex items-center justify-between gap-3 relative z-10">
          <label
            htmlFor="profile-photo-input"
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 cursor-pointer hover:border-white/30 transition-all active:scale-95 block bg-white/10"
          >
            {profilePhoto ? (
              <img
                alt="User Avatar"
                className="w-full h-full object-cover"
                src={profilePhoto}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/60 text-lg font-bold">
                {userData?.displayName?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </label>
          <input
            type="file"
            id="profile-photo-input"
            className="hidden"
            accept="image/*"
            onChange={handlePhotoChange}
          />
          <button
            className="flex-1 bg-white/5 backdrop-blur-md rounded-full px-4 py-2.5 flex items-center gap-2 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]"
            onClick={() => setIsSearchModalOpen(true)}
          >
            <Search className="text-white/60 w-5 h-5" />
            <span className="text-white/60 text-sm font-medium">{t.search}</span>
          </button>
          <button
            className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]"
            onClick={() => setIsStatsModalOpen(true)}
          >
            <Activity className="text-white w-5 h-5" />
          </button>
        </header>

        {/* Balance Section */}
        <section className="mt-8 px-6 text-center relative z-10">
          <div className="flex flex-col items-center">
            <span className="text-xs font-medium text-white/60 mb-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]">{t.cashAndStablecoins}</span>
            <h1 className="text-5xl font-bold flex flex-col items-center gap-1 text-white">
              <button
                onClick={cycleCurrency}
                className="font-bold text-white hover:text-white/80 transition-colors cursor-pointer active:scale-95 flex items-baseline"
              >
                <FormattedAmount
                  value={animatedValue}
                  symbol={getCurrencySymbol(displayCurrency)}
                  className="text-4xl font-normal tabular-nums"
                />
              </button>
              <span className="text-base font-medium text-white/50">
                ≈ <FormattedAmount value={totalBalance} className="text-base font-light" showSymbol={false} /> USDT
              </span>
            </h1>

            {/* Subtle Chart */}
            <div className="mt-2 w-screen h-12 opacity-40 -mx-6">
              <PortfolioChart value={totalBalance} />
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <section className="mt-1 px-6 grid grid-cols-2 gap-8 relative z-10">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => {
                // Se houver contas, vai para seleção de conta
                // Se não houver, cria uma conta primeiro
                if (userAccounts.length > 0) {
                  onNavigate('selectFiatAccount');
                } else {
                  // Poderia criar uma conta automaticamente ou mostrar mensagem
                  onNavigate('selectFiatAccount');
                }
              }}
              className="w-14 h-14 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center transition-transform active:scale-95 border-2 border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.3)]"
            >
              <ArrowDownLeft className="text-white w-6 h-6" />
            </button>
            <span className="text-white text-sm font-light tracking-wide">{t.deposit}</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => {
                // Buscar conta brasileira (BRL)
                const brAccount = userAccounts.find(acc => acc.currency === 'BRL');
                if (brAccount && onNavigateWithAccount) {
                  // Navegar passando a conta brasileira
                  onNavigateWithAccount('withdrawFiat', brAccount);
                } else {
                  // Se não houver conta brasileira, navegar normalmente
                  onNavigate('withdrawFiat');
                }
              }}
              className="w-14 h-14 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center transition-transform active:scale-95 border-2 border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.3)]"
            >
              <ArrowUpRight className="text-white w-6 h-6" />
            </button>
            <span className="text-white text-sm font-light tracking-wide">{t.transfer}</span>
          </div>
        </section>

        {/* Fiat Accounts Carousel */}
        <section className="mt-8 relative z-10">
          <FiatAccountsCarousel
            onAccountClick={(account) => {
              if (onNavigateWithAccount) {
                onNavigateWithAccount('fiatAccountDetails', account);
              }
            }}
            onAddAccountClick={() => {
              if (onNavigate) {
                onNavigate('accountData');
              }
            }}
          />
        </section>

        {/* Transactions Section */}
        <section className="mt-8 px-4 relative z-10">
          <button
            onClick={() => onNavigate('transactions')}
            className="w-full bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)] hover:bg-white/10 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-bold text-white">{t.statement}</h3>
                  <p className="text-xs text-white/50">{t.viewAllTransactions}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/50" />
            </div>
          </button>
        </section>

        {/* Assets Section - Lista de ativos com saldo */}
        {portfolio.holdings.filter(h => h.amount > 0).length > 0 && (
          <section className="mt-6 px-4 relative z-10">
            <h3 className="text-white/40 text-xs font-medium mb-3 px-1">{t.assets}</h3>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)] overflow-hidden">
              {portfolio.holdings
                .filter(holding => holding.amount > 0)
                .map((holding, index, array) => {
                  const crypto = availableCryptos.find(c => c.symbol === holding.symbol);
                  const coinId = crypto?.coinId || holding.coinId || holding.symbol.toLowerCase();
                  const price = prices[coinId]?.usd || 0;
                  const change = prices[coinId]?.usd_24h_change || 0;
                  const valueUSDT = holding.amount * price;

                  return (
                    <div
                      key={holding.symbol}
                      className={`px-4 py-3 flex items-center justify-between ${index !== array.length - 1 ? 'border-b border-white/5' : ''
                        } hover:bg-white/5 transition-colors`}
                    >
                      <div className="flex items-center gap-3">
                        <CryptoIcon symbol={holding.symbol} size="sm" />
                        <div>
                          <h4 className="text-sm font-semibold text-white">{holding.name}</h4>
                          <p className="text-xs text-white/40">
                            <FormattedAmount value={valueUSDT} className="text-xs font-light" showSymbol={false} /> USDT
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-white">
                          {holding.symbol === 'USDT' ? (
                            <><FormattedAmount value={holding.amount} className="text-sm font-light" showSymbol={false} /> {holding.symbol}</>
                          ) : (
                            <>{formatCrypto(holding.amount)} {holding.symbol}</>
                          )}
                        </div>
                        <div className={`flex items-center justify-end text-xs ${change >= 0 ? 'text-[#34c759]' : 'text-[#ff3b30]'}`}>
                          {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {Math.abs(change).toFixed(2).replace('.', ',')}%
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {/* Crypto Cards */}
        <section className="mt-10 px-4 space-y-4 relative z-10 pb-32">
          {/* Header com botão de edição */}
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-white/50 text-xs font-semibold">{t.market}</h3>
            <button
              onClick={() => setIsManageCardsModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all bg-white/5 backdrop-blur-md text-white/50 border border-white/10 hover:bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]"
            >
              <Settings2 className="w-3.5 h-3.5" />
              {t.edit}
            </button>
          </div>

          {/* Cards Dinamicamente Renderizados */}
          <div className="grid grid-cols-2 gap-4">
            {availableCryptos
              .filter(crypto => visibleCards.includes(crypto.symbol))
              .map((crypto) => {
                const price = prices[crypto.coinId]?.usd || 0;
                const change = prices[crypto.coinId]?.usd_24h_change || 0;

                return (
                  <div
                    key={`${crypto.symbol}-${price}-${change}`}
                    className="bg-white/5 backdrop-blur-md rounded-3xl p-4 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-bold text-white/50">{crypto.symbol}-USDT</h4>
                      <CryptoIcon symbol={crypto.symbol} size="sm" />
                    </div>
                    <div className="text-white mb-1">
                      <FormattedAmount value={price} className="text-lg font-light" showSymbol={false} />
                    </div>
                    <div className={`flex items-center text-xs font-semibold mb-3 ${change >= 0 ? 'text-[#34c759]' : 'text-[#ff3b30]'}`}>
                      {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {Math.abs(change).toFixed(2).replace('.', ',')}%
                    </div>
                    <div className="h-10 w-full mt-2">
                      <MiniChart coinId={crypto.coinId} color={change >= 0 ? '#34c759' : '#ff3b30'} />
                    </div>
                  </div>
                );
              })
            }
          </div>
        </section>
      </div>

      <SearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
      <StatsModal isOpen={isStatsModalOpen} onClose={() => setIsStatsModalOpen(false)} />
      <ManageCardsModal
        isOpen={isManageCardsModalOpen}
        onClose={() => setIsManageCardsModalOpen(false)}
        visibleCards={visibleCards}
        onToggleCard={toggleCard}
      />
      {/* ✅ Mostrar instruções do Firestore apenas se houver erro de permissão */}
      {firestoreError && firestoreError.includes('Firestore') && showFirestoreSetup && (
        <FirestoreSetupInstructions onClose={() => setShowFirestoreSetup(false)} />
      )}
    </div>
  );
}