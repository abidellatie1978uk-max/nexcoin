import { X, Check, Plus } from 'lucide-react';
import { CryptoIcon } from './CryptoIcon';
import { useCryptoPrices } from '../contexts/CryptoPriceContext';

interface ManageCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  visibleCards: string[];
  onToggleCard: (symbol: string) => void;
}

// Lista de criptomoedas mais populares
const popularCryptos = [
  { symbol: 'BTC', name: 'Bitcoin', coinId: 'bitcoin' },
  { symbol: 'ETH', name: 'Ethereum', coinId: 'ethereum' },
  { symbol: 'BNB', name: 'BNB', coinId: 'binancecoin' },
  { symbol: 'SOL', name: 'Solana', coinId: 'solana' },
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

export function ManageCardsModal({ isOpen, onClose, visibleCards, onToggleCard }: ManageCardsModalProps) {
  const { prices } = useCryptoPrices();

  if (!isOpen) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#1c1c1e] rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Gerenciar Criptomoedas</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Subtitle */}
        <div className="px-6 py-3 bg-white/5">
          <p className="text-sm text-white/50">
            Selecione as criptomoedas para exibir na tela inicial
          </p>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            {popularCryptos.map((crypto) => {
              const isActive = visibleCards.includes(crypto.symbol);
              const price = prices[crypto.coinId]?.usd || 0;
              const change = prices[crypto.coinId]?.usd_24h_change || 0;
              
              return (
                <button
                  key={crypto.symbol}
                  onClick={() => onToggleCard(crypto.symbol)}
                  className={`w-full rounded-2xl p-4 flex items-center justify-between transition-all border ${
                    isActive 
                      ? 'bg-white/10 border-white/20' 
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CryptoIcon symbol={crypto.symbol} size="md" />
                    <div className="text-left">
                      <h3 className="text-base font-bold text-white">{crypto.name}</h3>
                      <p className="text-sm text-white/50">{crypto.symbol}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-white">{formatPrice(price)}</div>
                      <div className={`text-xs ${change >= 0 ? 'text-[#34c759]' : 'text-[#ff3b30]'}`}>
                        {change >= 0 ? '+' : ''}{change.toFixed(2).replace('.', ',')}%
                      </div>
                    </div>
                    
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isActive 
                        ? 'bg-green-500' 
                        : 'bg-white/10 border border-white/20'
                    }`}>
                      {isActive ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : (
                        <Plus className="w-4 h-4 text-white/50" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}