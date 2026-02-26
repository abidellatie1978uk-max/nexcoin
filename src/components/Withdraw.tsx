import { ArrowLeft, Search, Check } from 'lucide-react';
import { useState } from 'react';
import type { Screen } from '../App';
import { CryptoIcon } from './CryptoIcon';
import { useCryptoPrices } from '../contexts/CryptoPriceContext';
import { usePortfolio } from '../contexts/PortfolioContext';
import { WithdrawAddress } from './WithdrawAddress';

interface WithdrawProps {
  onNavigate: (screen: Screen) => void;
}

export function Withdraw({ onNavigate }: WithdrawProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const { prices } = useCryptoPrices();
  const { portfolio } = usePortfolio();

  // Função para obter o saldo real do portfolio
  const getBalanceFromPortfolio = (coinId: string): number => {
    const holding = portfolio.holdings.find(h => h.coinId === coinId);
    return holding?.amount || 0;
  };

  const cryptoList = [
    { symbol: 'USDT', name: 'Tether', balance: getBalanceFromPortfolio('tether'), id: 'tether' },
    { symbol: 'BTC', name: 'Bitcoin', balance: getBalanceFromPortfolio('bitcoin'), id: 'bitcoin' },
    { symbol: 'ETH', name: 'Ethereum', balance: getBalanceFromPortfolio('ethereum'), id: 'ethereum' },
    { symbol: 'BNB', name: 'Binance Coin', balance: getBalanceFromPortfolio('binancecoin'), id: 'binancecoin' },
    { symbol: 'SOL', name: 'Solana', balance: getBalanceFromPortfolio('solana'), id: 'solana' },
    { symbol: 'ADA', name: 'Cardano', balance: getBalanceFromPortfolio('cardano'), id: 'cardano' },
    { symbol: 'XRP', name: 'Ripple', balance: getBalanceFromPortfolio('ripple'), id: 'ripple' },
    { symbol: 'DOT', name: 'Polkadot', balance: getBalanceFromPortfolio('polkadot'), id: 'polkadot' },
    { symbol: 'DOGE', name: 'Dogecoin', balance: getBalanceFromPortfolio('dogecoin'), id: 'dogecoin' },
    { symbol: 'AVAX', name: 'Avalanche', balance: getBalanceFromPortfolio('avalanche-2'), id: 'avalanche-2' },
    { symbol: 'MATIC', name: 'Polygon', balance: getBalanceFromPortfolio('matic-network'), id: 'matic-network' },
    { symbol: 'LINK', name: 'Chainlink', balance: getBalanceFromPortfolio('chainlink'), id: 'chainlink' },
    { symbol: 'UNI', name: 'Uniswap', balance: getBalanceFromPortfolio('uniswap'), id: 'uniswap' },
    { symbol: 'LTC', name: 'Litecoin', balance: getBalanceFromPortfolio('litecoin'), id: 'litecoin' },
    { symbol: 'ATOM', name: 'Cosmos', balance: getBalanceFromPortfolio('cosmos'), id: 'cosmos' },
  ];

  const networks = [
    { id: 'Ethereum', name: 'Ethereum (ERC20)', icon: 'ETH', fee: '2.5 USDT' },
    { id: 'Tron', name: 'Tron (TRC20)', icon: 'TRX', fee: '1.0 USDT' },
    { id: 'Polygon', name: 'Polygon', icon: 'MATIC', fee: '0.5 USDT' },
    { id: 'Solana', name: 'Solana', icon: 'SOL', fee: '0.3 USDT' },
    { id: 'BSC', name: 'BNB Smart Chain', icon: 'BNB', fee: '0.8 USDT' },
  ];

  // Formata o saldo de acordo com a quantidade de casas decimais
  const formatBalance = (amount: number): string => {
    if (amount >= 1) {
      return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 8 });
    }
    return amount.toFixed(8);
  };

  // Calcula valor em USD
  const calculateUsdValue = (cryptoId: string, amount: number): number => {
    const price = prices[cryptoId]?.usd || 0;
    return price * amount;
  };

  // Filtra criptomoedas pela busca
  const filteredCryptos = cryptoList.filter(crypto => 
    crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crypto.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const crypto = cryptoList.find(c => c.symbol === selectedCrypto);
  const network = networks.find(n => n.id === selectedNetwork);

  // Se uma rede foi selecionada, mostra a tela de endereço
  if (selectedCrypto && crypto && selectedNetwork && network) {
    return (
      <WithdrawAddress 
        crypto={crypto}
        network={network}
        onBack={() => {
          setSelectedNetwork(null);
        }}
      />
    );
  }

  // Se uma cripto foi selecionada, mostra a tela de seleção de rede
  if (selectedCrypto && crypto) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col pb-24">
        {/* Header */}
        <header className="px-6 pt-6 pb-4">
          <button 
            onClick={() => setSelectedCrypto(null)} 
            className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-zinc-800 transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg">Enviar {crypto.symbol}</h1>
            <div className="flex-shrink-0">
              <CryptoIcon symbol={crypto.symbol} size="md" />
            </div>
          </div>

          {/* Balance Info */}
          <div className="bg-zinc-900 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Saldo disponível</span>
              <div className="text-right">
                <div className="font-semibold">
                  {formatBalance(crypto.balance)} {crypto.symbol}
                </div>
                <div className="text-xs text-gray-400">
                  ${calculateUsdValue(crypto.id, crypto.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Network Selection */}
        <div className="flex-1 px-6 overflow-y-auto">
          <div>
            <label className="block text-sm font-semibold mb-3">Selecione a rede</label>
            <div className="space-y-2">
              {networks.map((network) => (
                <button
                  key={network.id}
                  onClick={() => setSelectedNetwork(network.id)}
                  className="w-full bg-zinc-900 rounded-xl p-4 flex items-center gap-3 transition-all hover:bg-zinc-800"
                >
                  {/* Network Icon */}
                  <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <CryptoIcon symbol={network.icon} size="sm" />
                  </div>

                  {/* Network Info */}
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-sm">{network.name}</div>
                    <div className="text-xs text-gray-400">Taxa: {network.fee}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Lista de criptomoedas
  return (
    <div className="min-h-screen bg-black text-white flex flex-col pb-24">
      {/* Header */}
      <header className="px-6 pt-6 pb-4 flex items-center gap-4">
        <button 
          onClick={() => onNavigate('wallet')} 
          className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg">Enviar</h1>
      </header>

      {/* Search Bar */}
      <div className="px-6 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquise criptomoedas compatíveis"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 text-white rounded-full py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-gray-700 placeholder-gray-500"
          />
        </div>
      </div>

      {/* Crypto List */}
      <div className="flex-1 px-6 overflow-y-auto">
        <div className="space-y-0">
          {filteredCryptos.map((crypto) => {
            const usdValue = calculateUsdValue(crypto.id, crypto.balance);
            
            return (
              <button
                key={crypto.symbol}
                className="w-full bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors p-4 flex items-center gap-4 border-b border-zinc-800/50 last:border-b-0"
                onClick={() => setSelectedCrypto(crypto.symbol)}
              >
                {/* Ícone */}
                <div className="flex-shrink-0">
                  <CryptoIcon symbol={crypto.symbol} size="md" />
                </div>

                {/* Info */}
                <div className="flex-1 text-left">
                  <div className="font-semibold text-base">{crypto.symbol}</div>
                  <div className="text-sm text-gray-400">{crypto.name}</div>
                </div>

                {/* Balance */}
                <div className="text-right">
                  <div className="font-semibold text-base">
                    {formatBalance(crypto.balance)} {crypto.symbol}
                  </div>
                  <div className="text-sm text-gray-400">
                    ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredCryptos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">Nenhuma criptomoeda encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
}