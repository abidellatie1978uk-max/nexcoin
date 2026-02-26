import { useState, useEffect } from 'react';
import { Search, X, TrendingUp, TrendingDown } from 'lucide-react';
import { CryptoIcon } from './CryptoIcon';
import { useCryptoPrices } from '../contexts/CryptoPriceContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CryptoData {
  id: string;
  symbol: string;
  name: string;
}

const cryptoList: CryptoData[] = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'tether', symbol: 'USDT', name: 'Tether' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
  { id: 'shiba-inu', symbol: 'SHIB', name: 'Shiba Inu' },
];

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCryptos, setFilteredCryptos] = useState<CryptoData[]>(cryptoList);
  const { prices } = useCryptoPrices();

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCryptos(cryptoList);
    } else {
      const filtered = cryptoList.filter(
        crypto =>
          crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCryptos(filtered);
    }
  }, [searchTerm]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: price < 1 ? 6 : 2,
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style>{`
        .search-modal-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="min-h-screen p-6 pt-12 search-modal-container">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 bg-white/5 backdrop-blur-md rounded-2xl px-4 py-3 flex items-center gap-3 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]">
            <Search className="text-white/60 w-5 h-5" />
            <input
              type="text"
              placeholder="Pesquisar criptomoeda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              className="flex-1 bg-transparent text-white placeholder:text-white/40 outline-none text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]"
          >
            <X className="text-white w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="space-y-2">
          {filteredCryptos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/50 text-sm">Nenhuma criptomoeda encontrada</p>
            </div>
          ) : (
            filteredCryptos.map((crypto) => {
              const price = prices[crypto.id]?.usd || 0;
              const change = prices[crypto.id]?.usd_24h_change || 0;
              const isPositive = change >= 0;

              return (
                <button
                  key={crypto.id}
                  className="w-full bg-white/5 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-white/10 hover:border-white/20 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]"
                >
                  <div className="flex items-center gap-3">
                    <CryptoIcon symbol={crypto.symbol} size="sm" />
                    <div className="text-left">
                      <h3 className="text-white font-semibold text-sm">{crypto.name}</h3>
                      <p className="text-white/50 text-xs">{crypto.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold text-sm">
                      {price > 0 ? `$${formatPrice(price)}` : '—'}
                    </div>
                    {price > 0 && (
                      <div className={`flex items-center justify-end gap-1 text-xs font-medium ${isPositive ? 'text-[#34c759]' : 'text-[#ff3b30]'}`}>
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(change).toFixed(2).replace('.', ',')}%
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}