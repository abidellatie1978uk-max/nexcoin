import { X, TrendingUp, TrendingDown, PieChart, Activity } from 'lucide-react';
import { usePortfolio } from '../contexts/PortfolioContext';
import { useCryptoPrices } from '../contexts/CryptoPriceContext';
import { CryptoIcon } from './CryptoIcon';
import { formatCurrency, formatCrypto, formatNumber } from '../utils/formatters';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StatsModal({ isOpen, onClose }: StatsModalProps) {
  const { portfolio } = usePortfolio();
  const { prices } = useCryptoPrices();

  // Função para separar valor principal dos centavos
  const formatNumberWithSmallCents = (num: number) => {
    const formatted = formatNumber(num, 2);
    const parts = formatted.split(',');
    return {
      main: parts[0],
      cents: parts[1] || '00'
    };
  };

  const isPositive = portfolio.change24h >= 0;

  // Calcular distribuição de ativos
  const holdings = portfolio.holdings.map(holding => {
    const price = prices[holding.coinId]?.usd || (holding.symbol === 'USDT' ? 1 : 0);
    const valueUSDT = holding.amount * price;
    const percentage = (valueUSDT / portfolio.totalBalanceUSDT) * 100;
    
    return {
      ...holding,
      valueUSDT,
      percentage,
      price,
    };
  }).sort((a, b) => b.valueUSDT - a.valueUSDT);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md animate-in fade-in overflow-y-auto"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style>{`
        .stats-modal-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="min-h-screen p-6 pt-12 pb-24 stats-modal-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center">
              <Activity className="text-white w-6 h-6" />
            </div>
            <div>
              <h2 className="text-white text-xl">Estatísticas</h2>
              <p className="text-white/50 text-sm">Análise do Portfólio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10 hover:bg-white/20 transition-all"
          >
            <X className="text-white w-5 h-5" />
          </button>
        </div>

        {/* Saldo Total */}
        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 mb-6 border border-white/10">
          <div className="text-center">
            <p className="text-white/50 text-sm mb-2">Saldo Total</p>
            <h1 className="text-3xl text-white mb-3">
              {formatNumberWithSmallCents(portfolio.totalBalanceUSDT).main}<span className="text-xl">,{formatNumberWithSmallCents(portfolio.totalBalanceUSDT).cents}</span>
              <span className="text-lg text-white/50 ml-2">USDT</span>
            </h1>
            <div className="flex items-center justify-center gap-2">
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${isPositive ? 'bg-[#34c759]/20' : 'bg-[#ff3b30]/20'}`}>
                {isPositive ? (
                  <TrendingUp className={`w-4 h-4 ${isPositive ? 'text-[#34c759]' : 'text-[#ff3b30]'}`} />
                ) : (
                  <TrendingDown className={`w-4 h-4 ${isPositive ? 'text-[#34c759]' : 'text-[#ff3b30]'}`} />
                )}
                <span className={`text-sm ${isPositive ? 'text-[#34c759]' : 'text-[#ff3b30]'}`}>
                  {formatNumber(Math.abs(portfolio.change24h))} USDT
                </span>
              </div>
              <div className={`px-3 py-1 rounded-full ${isPositive ? 'bg-[#34c759]/20' : 'bg-[#ff3b30]/20'}`}>
                <span className={`text-sm ${isPositive ? 'text-[#34c759]' : 'text-[#ff3b30]'}`}>
                  {isPositive ? '+' : ''}{portfolio.changePercent24h.toFixed(2).replace('.', ',')}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="w-4 h-4 text-white/70" />
              <p className="text-white/50 text-xs">Total de Ativos</p>
            </div>
            <p className="text-white text-2xl">{holdings.length}</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-white/70" />
              <p className="text-white/50 text-xs">Maior Ativo</p>
            </div>
            <p className="text-white text-lg">{holdings[0]?.symbol || '—'}</p>
            <p className="text-white/50 text-xs">{holdings[0]?.percentage.toFixed(1).replace('.', ',')}%</p>
          </div>
        </div>

        {/* Distribuição de Ativos */}
        <div className="mb-6">
          <h3 className="text-white text-lg mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Distribuição de Ativos
          </h3>
          <div className="space-y-3">
            {holdings.map((holding) => {
              const change = prices[holding.coinId]?.usd_24h_change || 0;
              const isPositiveChange = change >= 0;

              return (
                <div key={holding.symbol} className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <CryptoIcon symbol={holding.symbol} size="sm" />
                      <div>
                        <h4 className="text-white text-sm">{holding.name}</h4>
                        <p className="text-white/50 text-xs">{formatNumber(holding.amount, 4)} {holding.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-sm">{formatNumber(holding.valueUSDT)} USDT</p>
                      <div className={`text-xs ${isPositiveChange ? 'text-[#34c759]' : 'text-[#ff3b30]'}`}>
                        {isPositiveChange ? '+' : ''}{change.toFixed(2).replace('.', ',')}%
                      </div>
                    </div>
                  </div>
                  
                  {/* Barra de Porcentagem */}
                  <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full bg-white/30 rounded-full transition-all"
                      style={{ width: `${holding.percentage}%` }}
                    />
                  </div>
                  <p className="text-white/50 text-xs mt-2">{holding.percentage.toFixed(2).replace('.', ',')}% do portfólio</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Histórico de Preços */}
        {portfolio.priceHistory.length > 1 && (
          <div className="mb-6">
            <h3 className="text-white text-lg mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Histórico do Portfólio
            </h3>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="h-32 relative">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={isPositive ? "#34c759" : "#ff3b30"} stopOpacity="0.15" />
                      <stop offset="100%" stopColor={isPositive ? "#34c759" : "#ff3b30"} stopOpacity="0" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <path
                    d={(() => {
                      const history = portfolio.priceHistory;
                      const minPrice = Math.min(...history);
                      const maxPrice = Math.max(...history);
                      const range = maxPrice - minPrice || 1;
                      
                      const points = history.map((price, index) => {
                        const x = (index / (history.length - 1)) * 100;
                        const y = 100 - ((price - minPrice) / range) * 70 - 15;
                        return { x, y };
                      });
                      
                      // Criar curva suave usando catmull-rom
                      let pathData = `M${points[0].x},${points[0].y}`;
                      
                      for (let i = 0; i < points.length - 1; i++) {
                        const p0 = points[Math.max(0, i - 1)];
                        const p1 = points[i];
                        const p2 = points[i + 1];
                        const p3 = points[Math.min(points.length - 1, i + 2)];
                        
                        const cp1x = p1.x + (p2.x - p0.x) / 6;
                        const cp1y = p1.y + (p2.y - p0.y) / 6;
                        const cp2x = p2.x - (p3.x - p1.x) / 6;
                        const cp2y = p2.y - (p3.y - p1.y) / 6;
                        
                        pathData += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
                      }
                      
                      const pathArea = `${pathData} L100,100 L0,100 Z`;
                      return pathArea;
                    })()}
                    fill="url(#chartGradient)"
                  />
                  <path
                    d={(() => {
                      const history = portfolio.priceHistory;
                      const minPrice = Math.min(...history);
                      const maxPrice = Math.max(...history);
                      const range = maxPrice - minPrice || 1;
                      
                      const points = history.map((price, index) => {
                        const x = (index / (history.length - 1)) * 100;
                        const y = 100 - ((price - minPrice) / range) * 70 - 15;
                        return { x, y };
                      });
                      
                      // Criar curva suave usando catmull-rom
                      let pathData = `M${points[0].x},${points[0].y}`;
                      
                      for (let i = 0; i < points.length - 1; i++) {
                        const p0 = points[Math.max(0, i - 1)];
                        const p1 = points[i];
                        const p2 = points[i + 1];
                        const p3 = points[Math.min(points.length - 1, i + 2)];
                        
                        const cp1x = p1.x + (p2.x - p0.x) / 6;
                        const cp1y = p1.y + (p2.y - p0.y) / 6;
                        const cp2x = p2.x - (p3.x - p1.x) / 6;
                        const cp2y = p2.y - (p3.y - p1.y) / 6;
                        
                        pathData += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
                      }
                      
                      return pathData;
                    })()}
                    fill="none"
                    stroke={isPositive ? "#34c759" : "#ff3b30"}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#glow)"
                  />
                </svg>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-white/50">
                <span>Últimas {portfolio.priceHistory.length} atualizações</span>
                <span>Atualiza a cada 5min</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}