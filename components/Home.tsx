import { ArrowDown, ArrowUp, TrendingUp, BarChart3, Search } from 'lucide-react';
import { CryptoIcon } from './CryptoIcon';
import { useLanguage } from '../contexts/LanguageContext';
import type { Screen } from '../App';

interface HomeProps {
  onNavigate: (screen: Screen) => void;
}

export function Home({ onNavigate }: HomeProps) {
  const { t } = useLanguage();

  const cryptos = [
    {
      symbol: 'BTC-USD',
      name: 'Bitcoin',
      price: '$ 87.800',
      change: '1,99%',
      trend: 'down',
      icon: '₿',
      color: 'text-orange-500',
    },
    {
      symbol: 'ETH-USD',
      name: 'Ethereum',
      price: '$ 2.889,03',
      change: '3,56%',
      trend: 'down',
      icon: 'Ξ',
      color: 'text-purple-400',
    },
  ];

  const portfolio = {
    holdings: [
      {
        symbol: 'BTC-USD',
        name: 'Bitcoin',
        price: '$ 87.800',
        change: '1,99%',
        trend: 'down',
        icon: '₿',
        color: 'text-orange-500',
      },
      {
        symbol: 'ETH-USD',
        name: 'Ethereum',
        price: '$ 2.889,03',
        change: '3,56%',
        trend: 'down',
        icon: 'Ξ',
        color: 'text-purple-400',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900/20 via-blue-900/20 to-black pb-24">
      {/* Header */}
      <div className="px-6 pt-4 pb-6">
        <div className="flex items-center justify-between mb-6">
          <button className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-800" />
          </button>

          <div className="flex-1 mx-4 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <div>
              <input
                type="text"
                placeholder={t.search}
                className="w-full bg-zinc-900/80 rounded-full pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-zinc-700"
              />
            </div>
          </div>

          <button 
            onClick={() => onNavigate('profile')}
            className="w-12 h-12 rounded-lg bg-zinc-900/80 flex items-center justify-center"
          >
            <BarChart3 className="w-6 h-6" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="bg-zinc-900/50 backdrop-blur rounded-2xl p-4 mb-6">
          <p className="text-sm text-gray-300">
            Não invista a não ser que você esteja preparado(a) para perder todo o seu investimento. Este é um investimento de alto risco e você não estará protegido(a) se algo der errado.{' '}
            <span className="text-blue-400 underline">Reserve dois minutos para saber mais</span>
          </p>
        </div>

        {/* Balance */}
        <div className="text-center mb-8">
          <div className="text-6xl font-light mb-2">
            $ 17<span className="text-4xl">,61</span>
          </div>
          <div className="text-gray-400">
            $ 0,00 <span className="ml-2">0,00%</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center gap-8 mb-8">
          <button className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-zinc-800/80 flex items-center justify-center">
              <ArrowDown className="w-6 h-6" />
            </div>
            <span className="text-sm text-gray-400">{t.deposit}</span>
          </button>
          
          <button className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-zinc-800/80 flex items-center justify-center">
              <ArrowUp className="w-6 h-6" />
            </div>
            <span className="text-sm text-gray-400">{t.transfer}</span>
          </button>
        </div>

        {/* Receive Card */}
        <button 
          onClick={() => onNavigate('receive')}
          className="w-full bg-zinc-900/80 backdrop-blur rounded-2xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <CryptoIcon symbol="USDT" size="md" />
            <div className="text-left">
              <div className="">Tether</div>
              <div className="text-sm text-gray-400">17,62 USDT · $ 0,99</div>
            </div>
          </div>
          <div className="text-right">
            <div className="">$ 17,61</div>
            <div className="text-sm text-red-400">↓ 0,01%</div>
          </div>
        </button>
      </div>

      {/* Crypto Holdings */}
      <div className="px-6 space-y-4 pb-24">
        <h2 className="text-xl mb-4">{t.myCryptos}</h2>
        
        {portfolio.holdings.map((crypto) => (
          <div key={crypto.symbol} className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <CryptoIcon symbol={crypto.symbol.split('-')[0]} size="md" />
              <span className="text-sm">{crypto.symbol.split('-')[0]}</span>
            </div>
            <div className="text-xl mb-1">{crypto.price}</div>
            <div className="text-sm text-red-400 mb-3">↓ {crypto.change}</div>
            
            {/* Mini Chart */}
            <div className="h-16">
              <svg viewBox="0 0 100 40" className="w-full h-full">
                <path
                  d="M 0 20 Q 10 15, 20 18 T 40 16 T 60 22 T 80 20 T 100 35"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800">
        <div className="flex justify-around items-center py-4 px-6 max-w-md mx-auto">
          <button className="flex flex-col items-center gap-1">
            <div className="text-xl">ℝ</div>
            <span className="text-xs">{t.home}</span>
          </button>
          
          <button 
            onClick={() => onNavigate('transactions')}
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs">{t.trade}</span>
          </button>
          
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs">{t.activity}</span>
          </button>
        </div>
      </div>
    </div>
  );
}