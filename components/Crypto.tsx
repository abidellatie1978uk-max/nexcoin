import { Search, TrendingUp, TrendingDown, Star, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { CryptoIcon } from './CryptoIcon';
import { useCryptoPrices } from '../contexts/CryptoPriceContext';
import { usePortfolio } from '../contexts/PortfolioContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCrypto } from '../utils/formatters';
import { toast } from 'sonner';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import type { Screen } from '../App';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FormattedAmount } from './FormattedAmount';

interface CryptoProps {
  onNavigate: (screen: Screen) => void;
}

interface AddBalanceModal {
  show: boolean;
  crypto: {
    id: string;
    symbol: string;
    name: string;
  } | null;
}

export function Crypto({ onNavigate }: CryptoProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
  const { prices, isLoading } = useCryptoPrices();
  const { portfolio, addOrUpdateCrypto } = usePortfolio();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [addBalanceModal, setAddBalanceModal] = useState<AddBalanceModal>({ show: false, crypto: null });
  const [balanceToAdd, setBalanceToAdd] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);

  // ✅ Carregar favoritos do Firestore
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user?.uid) {
        setFavorites([]);
        return;
      }

      try {
        const favoritesDoc = await getDoc(doc(db, 'users', user.uid, 'preferences', 'crypto-favorites'));
        if (favoritesDoc.exists()) {
          const data = favoritesDoc.data();
          setFavorites(data.favorites || []);
        } else {
          // Documento não existe ainda - criar vazio
          setFavorites([]);
        }
      } catch (error: any) {
        // Silenciar erro de permissão se usuário não estiver autenticado
        if (error?.code !== 'permission-denied') {
          console.error('Erro ao carregar favoritos:', error);
        }
        setFavorites([]);
      }
    };

    loadFavorites();
  }, [user]);

  // ✅ Salvar favoritos no Firestore
  const toggleFavorite = async (cryptoId: string) => {
    if (!user?.uid) {
      toast.error('Faça login para salvar favoritos');
      return;
    }

    const newFavorites = favorites.includes(cryptoId)
      ? favorites.filter(id => id !== cryptoId)
      : [...favorites, cryptoId];

    // Atualizar estado local imediatamente
    setFavorites(newFavorites);

    // Salvar no Firestore
    try {
      await setDoc(doc(db, 'users', user.uid, 'preferences', 'crypto-favorites'), {
        favorites: newFavorites,
        updatedAt: new Date(),
      });

      if (newFavorites.includes(cryptoId)) {
        toast.success('Adicionado aos favoritos');
      } else {
        toast.success('Removido dos favoritos');
      }
    } catch (error) {
      console.error('Erro ao salvar favoritos:', error);
      toast.error('Erro ao salvar favorito');
      // Reverter mudança em caso de erro
      setFavorites(favorites);
    }
  };

  // ✅ Estado do carrossel
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Mapeamento dos dados das criptomoedas
  const cryptoData = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
    { id: 'tether', symbol: 'USDT', name: 'Tether' },
    { id: 'binancecoin', symbol: 'BNB', name: 'Binance Coin' },
    { id: 'solana', symbol: 'SOL', name: 'Solana' },
    { id: 'ripple', symbol: 'XRP', name: 'XRP' },
    { id: 'usd-coin', symbol: 'USDC', name: 'USD Coin' },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
    { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
    { id: 'tron', symbol: 'TRX', name: 'TRON' },
    { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
    { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
    { id: 'matic-network', symbol: 'MATIC', name: 'Polygon' },
    { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
    { id: 'shiba-inu', symbol: 'SHIB', name: 'Shiba Inu' },
    { id: 'litecoin', symbol: 'LTC', name: 'Litecoin' },
    { id: 'uniswap', symbol: 'UNI', name: 'Uniswap' },
    { id: 'stellar', symbol: 'XLM', name: 'Stellar' },
    { id: 'cosmos', symbol: 'ATOM', name: 'Cosmos' },
    { id: 'monero', symbol: 'XMR', name: 'Monero' },
    { id: 'ethereum-classic', symbol: 'ETC', name: 'Ethereum Classic' },
    { id: 'bitcoin-cash', symbol: 'BCH', name: 'Bitcoin Cash' },
    { id: 'near', symbol: 'NEAR', name: 'NEAR Protocol' },
    { id: 'algorand', symbol: 'ALGO', name: 'Algorand' },
    { id: 'vechain', symbol: 'VET', name: 'VeChain' },
    { id: 'fantom', symbol: 'FTM', name: 'Fantom' },
    { id: 'the-graph', symbol: 'GRT', name: 'The Graph' },
    { id: 'filecoin', symbol: 'FIL', name: 'Filecoin' },
    { id: 'hedera-hashgraph', symbol: 'HBAR', name: 'Hedera' },
    { id: 'aptos', symbol: 'APT', name: 'Aptos' },
    { id: 'arbitrum', symbol: 'ARB', name: 'Arbitrum' },
    { id: 'optimism', symbol: 'OP', name: 'Optimism' },
    { id: 'render-token', symbol: 'RNDR', name: 'Render' },
    { id: 'injective-protocol', symbol: 'INJ', name: 'Injective' },
    { id: 'sui', symbol: 'SUI', name: 'Sui' },
  ];

  // Formatar preço em dólar
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  // Formatar market cap
  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) return `$ ${(marketCap / 1e12).toFixed(1)}T`;
    if (marketCap >= 1e9) return `$ ${(marketCap / 1e9).toFixed(0)}B`;
    if (marketCap >= 1e6) return `$ ${(marketCap / 1e6).toFixed(0)}M`;
    return `$ ${marketCap.toFixed(0)}`;
  };

  // Criar lista de criptos com dados da API
  const cryptoList = cryptoData.map(crypto => {
    const priceData = prices[crypto.id];
    const price = priceData?.usd || 0;
    const change = priceData?.usd_24h_change || 0;
    const marketCap = priceData?.usd_market_cap || 0;

    return {
      ...crypto,
      price: formatPrice(price),
      change: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      marketCap: formatMarketCap(marketCap),
      isFavorite: favorites.includes(crypto.id),
    };
  });

  // ✅ Calcular top gainers em tempo real
  const topGainers = useMemo(() => {
    const cryptosWithChange = cryptoData
      .map(crypto => {
        const priceData = prices[crypto.id];
        const change = priceData?.usd_24h_change || 0;
        const price = priceData?.usd || 0;
        return {
          ...crypto,
          changePercent: change,
          price,
        };
      })
      .filter(c => c.changePercent > 0) // Apenas criptos em alta
      .sort((a, b) => b.changePercent - a.changePercent) // Ordenar por maior ganho
      .slice(0, 5); // Top 5

    return cryptosWithChange;
  }, [prices]);

  // ✅ Dados para o gráfico (histórico simulado baseado no change 24h)
  const getChartDataForCrypto = (crypto: any) => {
    // Simular 24 horas de dados (24 pontos)
    const basePrice = crypto.price;
    const changePercent = crypto.changePercent;

    const data = [];
    for (let i = 0; i < 24; i++) {
      // Criar variação progressiva ao longo do dia (HOJE)
      const progress = i / 23; // 0 a 1
      const randomVariation = (Math.random() - 0.5) * (changePercent / 5); // Variação aleatória pequena
      const priceChange = (changePercent * progress / 100) + randomVariation;

      // Simular dados de 5 dias atrás (linha de fundo)
      // Assumir que 5 dias atrás tinha uma variação diferente (menor ou negativa)
      const pastChangePercent = changePercent * 0.3; // 30% da variação atual (menos volátil)
      const pastRandomVariation = (Math.random() - 0.5) * (pastChangePercent / 5);
      const pastPriceChange = (pastChangePercent * progress / 100) + pastRandomVariation;

      data.push({
        time: `${i}h`,
        price: basePrice * (1 + priceChange / 100),
        change: priceChange,
        // Preço de 5 dias atrás (base menor para mostrar crescimento)
        pricePast: basePrice * 0.95 * (1 + pastPriceChange / 100), // 5% menor que hoje
      });
    }

    return data;
  };

  // ✅ Auto-play do carrossel
  useEffect(() => {
    if (topGainers.length === 0 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % topGainers.length);
    }, 5000); // Trocar a cada 5 segundos

    return () => clearInterval(interval);
  }, [topGainers.length, isPaused]);

  // Navegação manual do carrossel
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000); // Retomar auto-play após 10s
  };

  const nextSlide = () => {
    goToSlide((currentSlide + 1) % topGainers.length);
  };

  const prevSlide = () => {
    goToSlide((currentSlide - 1 + topGainers.length) % topGainers.length);
  };

  // ✅ Dados para o gráfico (histórico simulado baseado no change 24h)
  const chartData = useMemo(() => {
    return topGainers.map((crypto, index) => ({
      name: crypto.symbol,
      value: crypto.changePercent,
      price: crypto.price,
      fullName: crypto.name,
    }));
  }, [topGainers]);

  // ✅ Filtrar criptos que já estão no portfólio (ativas)
  const activeCryptoIds = portfolio.holdings.map(h => h.coinId);
  const availableCryptos = cryptoList.filter(crypto => !activeCryptoIds.includes(crypto.id));

  // ✅ Aplicar filtros de busca e favoritos
  const filteredCryptos = useMemo(() => {
    let result = availableCryptos;

    // Filtro de busca
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      result = result.filter(crypto =>
        crypto.name.toLowerCase().includes(search) ||
        crypto.symbol.toLowerCase().includes(search) ||
        crypto.id.toLowerCase().includes(search)
      );
    }

    // Filtro de favoritos
    if (activeTab === 'favorites') {
      result = result.filter(c => c.isFavorite);
    }

    return result;
  }, [availableCryptos, searchTerm, activeTab, favorites]);

  const displayCryptos = filteredCryptos;

  const glassEffect = 'bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]';

  const handleDoubleClick = (crypto: any) => {
    setAddBalanceModal({ show: true, crypto: { id: crypto.id, symbol: crypto.symbol, name: crypto.name } });
    setBalanceToAdd('');
  };

  const handleAddBalance = async () => {
    if (!addBalanceModal.crypto || !balanceToAdd || parseFloat(balanceToAdd) <= 0) {
      toast.error('Digite um valor válido');
      return;
    }

    setIsAdding(true);
    try {
      const amount = parseFloat(balanceToAdd);

      // Verificar se já existe no portfólio
      const existingHolding = portfolio.holdings.find(h => h.coinId === addBalanceModal.crypto!.id);
      const newAmount = existingHolding ? existingHolding.amount + amount : amount;

      // addOrUpdateCrypto(symbol, coinId, amount, name?)
      await addOrUpdateCrypto(
        addBalanceModal.crypto.symbol,
        addBalanceModal.crypto.id,
        newAmount,
        addBalanceModal.crypto.name
      );

      toast.success('Saldo adicionado com sucesso!', {
        description: `+${formatCrypto(amount)} ${addBalanceModal.crypto.symbol}`,
      });

      setAddBalanceModal({ show: false, crypto: null });
      setBalanceToAdd('');
    } catch (error) {
      console.error('Erro ao adicionar saldo:', error);
      toast.error('Erro ao adicionar saldo');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Header */}
        <header className="px-6 pt-8 pb-6">
          <h1 className="text-lg font-semibold mb-6">{t.cryptoMarket}</h1>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 z-10" />
            <input
              type="text"
              placeholder={t.cryptoPage.searchCrypto}
              className={`w-full rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-zinc-700 ${glassEffect}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setActiveTab('all')}
              className={activeTab === 'all' ? 'flex-1 py-3 rounded-full font-semibold transition-colors bg-white text-black' : `flex-1 py-3 rounded-full font-semibold transition-colors text-gray-400 ${glassEffect}`}
            >
              {t.cryptoPage.all}
            </button>

            <button
              onClick={() => setActiveTab('favorites')}
              className={activeTab === 'favorites' ? 'flex-1 py-3 rounded-full font-semibold transition-colors bg-white text-black' : `flex-1 py-3 rounded-full font-semibold transition-colors text-gray-400 ${glassEffect}`}
            >
              {t.cryptoPage.favorites} <Star className="w-4 h-4 inline ml-1" />
            </button>
          </div>
        </header>

        {/* Top Gainers Carousel - Criptos em Alta 🔥 */}
        <div className="px-6 mb-6">
          {topGainers.length > 0 && topGainers[currentSlide] && (
            <div className="relative">
              {/* Card do Carrossel - Compacto */}
              <div
                className={`rounded-2xl p-4 overflow-hidden relative ${glassEffect} cursor-pointer`}
                onDoubleClick={() => handleDoubleClick(topGainers[currentSlide])}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                {/* Background Gradient Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#34c759]/10 via-transparent to-[#34c759]/5 pointer-events-none" />

                {/* Header Compacto */}
                <div className="relative z-10 flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold">Cripto em Alta</h2>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#34c759] font-semibold">
                    <TrendingUp className="w-3 h-3" />
                    Tempo Real
                  </div>
                </div>

                {/* Crypto Info - Lado a Lado */}
                <div className="relative z-10 grid grid-cols-2 gap-3 mb-3">
                  {/* Left: Info */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CryptoIcon symbol={topGainers[currentSlide].symbol} size="sm" />
                      <div>
                        <h3 className="text-base font-bold text-white">{topGainers[currentSlide].symbol}</h3>
                      </div>
                    </div>

                    {/* Preço */}
                    <div className="mb-2">
                      <p className="text-xs text-white/40">Preço</p>
                      <p className="text-white">
                        {topGainers[currentSlide].price < 1 ? (
                          <>$ {topGainers[currentSlide].price.toLocaleString('pt-BR', { minimumFractionDigits: 6, maximumFractionDigits: 6 })}</>
                        ) : (
                          <FormattedAmount
                            value={topGainers[currentSlide].price}
                            symbol="$"
                            className="text-lg font-light"
                          />
                        )}
                      </p>
                    </div>

                    {/* Variação */}
                    <div>
                      <p className="text-xs text-white/40">24h</p>
                      <p className="text-lg font-bold text-[#34c759] flex items-center gap-1">
                        +{topGainers[currentSlide].changePercent.toFixed(2)}%
                        <TrendingUp className="w-3 h-3" />
                      </p>
                    </div>
                  </div>

                  {/* Right: Gráfico */}
                  <div className="h-24 w-full" style={{ minHeight: '96px', minWidth: '150px' }}>
                    <ResponsiveContainer width="100%" height="100%" minHeight={96}>
                      <AreaChart data={getChartDataForCrypto(topGainers[currentSlide])}>
                        <defs>
                          {/* Gradiente para linha atual (hoje) - VERDE */}
                          <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#34c759" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#34c759" stopOpacity={0} />
                          </linearGradient>
                          {/* Gradiente para linha de 5 dias atrás (fundo) - LARANJA */}
                          <linearGradient id="colorPast" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ff9f0a" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#ff9f0a" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(0, 0, 0, 0.95)',
                            border: '1px solid rgba(52, 199, 89, 0.3)',
                            borderRadius: '8px',
                            padding: '6px 10px',
                          }}
                          labelStyle={{ display: 'none' }}
                          formatter={(value: any, name: any) => {
                            if (name === 'price') return [`$${value.toFixed(2)}`, 'Hoje'];
                            if (name === 'pricePast') return [`$${value.toFixed(2)}`, '5 dias atrás'];
                            return ['', ''];
                          }}
                        />

                        {/* Área de 5 dias atrás (renderizada primeiro = fica atrás) - LARANJA */}
                        <Area
                          type="monotone"
                          dataKey="pricePast"
                          stroke="#ff9f0a"
                          strokeWidth={1.5}
                          strokeOpacity={0.6}
                          fill="url(#colorPast)"
                          dot={false}
                          animationDuration={1500}
                          animationEasing="ease-in-out"
                          isAnimationActive={true}
                        />

                        {/* Área atual (hoje) - renderizada por último = fica na frente - VERDE */}
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke="#34c759"
                          strokeWidth={2}
                          fill="url(#colorCurrent)"
                          dot={false}
                          animationDuration={1500}
                          animationEasing="ease-in-out"
                          isAnimationActive={true}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add animation keyframes to the page */}
        <style>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>

        {/* Crypto List */}
        <div className="px-6 space-y-4 pb-24">
          {/* Botão para expandir/ocultar lista */}
          <button
            onClick={() => setIsListExpanded(!isListExpanded)}
            className={`w-full rounded-2xl p-4 hover:bg-white/10 transition-all ${glassEffect}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                  {isListExpanded ? (
                    <ChevronLeft className="w-6 h-6 text-white rotate-90" />
                  ) : (
                    <ChevronRight className="w-6 h-6 text-white rotate-90" />
                  )}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-white">
                    {isListExpanded ? 'Ocultar Lista' : 'Ver Todas as Criptomoedas'}
                  </div>
                  <div className="text-sm text-gray-400">
                    {displayCryptos.length} {displayCryptos.length === 1 ? 'ativo disponível' : 'ativos disponíveis'}
                  </div>
                </div>
              </div>
              <div className="text-sm font-semibold text-gray-400">
                {isListExpanded ? 'Ocultar' : 'Expandir'}
              </div>
            </div>
          </button>

          {/* Lista de criptomoedas (condicional) */}
          {isListExpanded && (
            <>
              {displayCryptos.length > 0 ? (
                <>
                  {displayCryptos.map((crypto) => (
                    <div
                      key={crypto.id}
                      className={`w-full rounded-2xl p-4 hover:bg-white/10 transition-colors cursor-pointer ${glassEffect}`}
                      onDoubleClick={() => handleDoubleClick(crypto)}
                      title="Clique 2x para adicionar saldo"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <CryptoIcon symbol={crypto.symbol} size="md" />
                          <div className="text-left">
                            <div className="font-semibold">{crypto.name}</div>
                            <div className="text-sm text-gray-400">{crypto.symbol}</div>
                          </div>
                        </div>
                        <button
                          className="text-gray-400 hover:text-yellow-500 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(crypto.id);
                          }}
                        >
                          <Star className={`w-5 h-5 ${crypto.isFavorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-semibold">{crypto.price}</div>
                        <div className={`flex items-center gap-1 text-sm font-medium ${crypto.trend === 'up' ? 'text-green-500' : crypto.trend === 'down' ? 'text-red-500' : 'text-gray-400'
                          }`}>
                          {crypto.trend === 'up' && <TrendingUp className="w-4 h-4" />}
                          {crypto.trend === 'down' && <TrendingDown className="w-4 h-4" />}
                          {crypto.change}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Market Cap: {crypto.marketCap}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className={`rounded-2xl p-8 text-center ${glassEffect}`}>
                  <div className="w-16 h-16 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center">
                    <Star className="w-8 h-8 text-white/30 fill-white/30" />
                  </div>
                  <p className="text-white font-semibold mb-2">Todas as criptos estão ativas!</p>
                  <p className="text-sm text-white/50">
                    Você já adicionou todas as criptomoedas disponíveis ao seu portfólio.
                  </p>
                  <button
                    onClick={() => onNavigate('wallet')}
                    className="mt-4 px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Ver Portfólio
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Balance Modal */}
      {addBalanceModal.show && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-6"
          onClick={() => setAddBalanceModal({ show: false, crypto: null })}
        >
          <div
            className="bg-white/5 backdrop-blur-md rounded-3xl p-6 w-full max-w-md border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.1)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Adicionar ao Portfólio</h2>
              <button
                onClick={() => setAddBalanceModal({ show: false, crypto: null })}
                className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Crypto Info */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
              <CryptoIcon symbol={addBalanceModal.crypto?.symbol || 'BTC'} size="lg" />
              <div className="text-left">
                <div className="font-semibold text-xl text-white mb-1">
                  {addBalanceModal.crypto?.symbol || 'BTC'}
                </div>
                <div className="text-sm text-gray-400">
                  {addBalanceModal.crypto?.name || 'Bitcoin'}
                </div>
              </div>
            </div>

            {/* Current Balance (if exists) */}
            {(() => {
              const existingHolding = portfolio.holdings.find(h => h.coinId === addBalanceModal.crypto?.id);
              if (existingHolding) {
                return (
                  <div className="mb-4 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                    <p className="text-sm text-gray-400 mb-1">Saldo atual</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCrypto(existingHolding.amount)} {existingHolding.symbol}
                    </p>
                  </div>
                );
              }
              return null;
            })()}

            {/* Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Quantidade a adicionar
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={balanceToAdd}
                  onChange={(e) => setBalanceToAdd(e.target.value)}
                  placeholder="0.00"
                  step="0.00000001"
                  className="w-full bg-white/5 backdrop-blur-md rounded-2xl p-4 pr-16 text-2xl font-bold text-white placeholder-gray-600 border border-white/10 focus:outline-none focus:border-white/30 transition-colors"
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-gray-400">
                  {addBalanceModal.crypto?.symbol}
                </span>
              </div>
              {balanceToAdd && parseFloat(balanceToAdd) > 0 && (() => {
                const existingHolding = portfolio.holdings.find(h => h.coinId === addBalanceModal.crypto?.id);
                const currentAmount = existingHolding?.amount || 0;
                return (
                  <p className="text-sm text-gray-400 mt-2">
                    Novo saldo: {formatCrypto(currentAmount + parseFloat(balanceToAdd))} {addBalanceModal.crypto?.symbol}
                  </p>
                );
              })()}
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setAddBalanceModal({ show: false, crypto: null })}
                className="py-4 rounded-2xl font-semibold bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10"
                disabled={isAdding}
              >
                Cancelar
              </button>
              <button
                onClick={handleAddBalance}
                className="py-4 rounded-2xl font-semibold bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isAdding || !balanceToAdd || parseFloat(balanceToAdd) <= 0}
              >
                {isAdding ? 'Adicionando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}