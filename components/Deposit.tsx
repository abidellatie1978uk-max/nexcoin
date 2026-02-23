import { ArrowLeft, Search, Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { Screen } from '../App';
import { CryptoIcon } from './CryptoIcon';
import { useCryptoPrices } from '../contexts/CryptoPriceContext';
import { usePortfolio } from '../contexts/PortfolioContext';
import { formatCrypto, formatCurrency } from '../utils/formatters';
import QRCode from 'react-qr-code';
import { Copy } from 'lucide-react';

interface DepositProps {
  onNavigate: (screen: Screen) => void;
}

export function Deposit({ onNavigate }: DepositProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string>('Ethereum');
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
  const { prices } = useCryptoPrices();
  const { portfolio } = usePortfolio();

  // Reset copiedAddress quando mudar de rede ou cripto
  const handleNetworkChange = (network: string) => {
    setSelectedNetwork(network);
    setCopiedAddress(false);
    setIsNetworkDropdownOpen(false);
  };

  const cryptoList = [
    { symbol: 'USDT', name: 'Tether', id: 'tether' },
    { symbol: 'BTC', name: 'Bitcoin', id: 'bitcoin' },
    { symbol: 'ETH', name: 'Ethereum', id: 'ethereum' },
    { symbol: 'BNB', name: 'Binance', id: 'binancecoin' },
    { symbol: 'SOL', name: 'Solana', id: 'solana' },
    { symbol: 'ADA', name: 'Cardano', id: 'cardano' },
    { symbol: 'XRP', name: 'Ripple', id: 'ripple' },
    { symbol: 'DOT', name: 'Polkadot', id: 'polkadot' },
    { symbol: 'DOGE', name: 'Dogecoin', id: 'dogecoin' },
    { symbol: 'AVAX', name: 'Avalanche', id: 'avalanche-2' },
    { symbol: 'MATIC', name: 'Polygon', id: 'matic-network' },
    { symbol: 'LINK', name: 'Chainlink', id: 'chainlink' },
    { symbol: 'UNI', name: 'Uniswap', id: 'uniswap' },
    { symbol: 'LTC', name: 'Litecoin', id: 'litecoin' },
    { symbol: 'ATOM', name: 'Cosmos', id: 'cosmos' },
  ];

  // Função para obter o saldo de uma cripto do portfólio
  const getCryptoBalance = (symbol: string): number => {
    const holding = portfolio.holdings.find(h => h.symbol === symbol);
    return holding?.amount || 0;
  };

  const networks = [
    { id: 'Ethereum', name: 'Ethereum', icon: 'ETH' },
    { id: 'BSC', name: 'BNB Smart Chain', icon: 'BNB' },
    { id: 'Polygon', name: 'Polygon', icon: 'MATIC' },
    { id: 'Arbitrum', name: 'Arbitrum', icon: 'ARB' },
    { id: 'Optimism', name: 'Optimism', icon: 'OP' },
    { id: 'Base', name: 'Base', icon: 'BASE' },
    { id: 'Avalanche', name: 'Avalanche C-Chain', icon: 'AVAX' },
    { id: 'Solana', name: 'Solana', icon: 'SOL' },
    { id: 'Tron', name: 'Tron', icon: 'TRX' },
    { id: 'Fantom', name: 'Fantom', icon: 'FTM' },
    { id: 'zkSync', name: 'zkSync Era', icon: 'ZK' },
    { id: 'Cronos', name: 'Cronos', icon: 'CRO' },
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

  // Copia endereço para clipboard
  const copyToClipboard = (text: string) => {
    // Fallback para navegadores que bloqueiam Clipboard API
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }

    document.body.removeChild(textArea);
  };

  // Gera endereço de depósito baseado na cripto e rede selecionadas
  const generateDepositAddress = (cryptoSymbol: string, network: string): string => {
    // Função de hash melhorada para gerar endereços realistas
    const hashString = (str: string): number => {
      let hash = 5381;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) + hash) + char; // hash * 33 + char
      }
      return Math.abs(hash) + 999999; // Adiciona offset para evitar zeros
    };

    // Gera sequência pseudo-aleatória mas determinística
    const generateBytes = (seed: string, length: number): number[] => {
      const bytes: number[] = [];
      let currentSeed = hashString(seed);

      for (let i = 0; i < length; i++) {
        // LCG com parâmetros melhores + mistura adicional
        currentSeed = (currentSeed * 1664525 + 1013904223) & 0x7fffffff;
        const mixed = (currentSeed ^ (currentSeed >> 16)) & 0xff;
        // Garante que nunca seja 0, usando range 1-255
        bytes.push(mixed === 0 ? (i % 255) + 1 : mixed);
      }
      return bytes;
    };

    // Converte bytes para hex
    const bytesToHex = (bytes: number[]): string => {
      return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    // Converte bytes para Base58 (Bitcoin/Crypto style)
    const bytesToBase58 = (bytes: number[]): string => {
      const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
      let num = BigInt('0x' + bytesToHex(bytes));
      let result = '';

      while (num > 0) {
        const remainder = Number(num % 58n);
        result = alphabet[remainder] + result;
        num = num / 58n;
      }

      // Adiciona '1' para cada byte 0 no início
      for (const byte of bytes) {
        if (byte === 0) result = '1' + result;
        else break;
      }

      return result;
    };

    // Converte bytes para Bech32 (SegWit style)
    const bytesToBech32 = (bytes: number[]): string => {
      const charset = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
      let result = '';
      for (const byte of bytes) {
        result += charset[byte % charset.length];
      }
      return result;
    };

    const seed = `${cryptoSymbol}-${network}-ethertron-wallet`;

    // Tron (TRX) - Endereços começam com T
    if (network === 'Tron') {
      const bytes = generateBytes(seed, 20);
      const address = bytesToBase58(bytes);
      // Garante que sempre comece com T
      return 'T' + address.substring(1, 34);
    }

    // Bitcoin (BTC) - SegWit (bc1...)
    if (cryptoSymbol === 'BTC') {
      const bytes = generateBytes(seed, 32);
      const address = 'bc1q' + bytesToBech32(bytes).substring(0, 38);
      return address;
    }

    // Solana (SOL)
    if (cryptoSymbol === 'SOL' || network === 'Solana') {
      const bytes = generateBytes(seed, 32);
      const address = bytesToBase58(bytes);
      return address.substring(0, 44);
    }

    // Ethereum e redes EVM (ETH, USDT, BNB, MATIC, LINK, UNI, AVAX)
    // Todas as redes EVM usam o mesmo formato de endereço 0x...
    if (cryptoSymbol === 'ETH' || network === 'Ethereum' || network === 'Polygon' || network === 'Optimism' ||
      network === 'BSC' || network === 'Arbitrum' || network === 'Base' || network === 'Avalanche' ||
      network === 'Fantom' || network === 'zkSync' || network === 'Cronos' ||
      cryptoSymbol === 'BNB' || cryptoSymbol === 'MATIC' || cryptoSymbol === 'LINK' ||
      cryptoSymbol === 'UNI' || cryptoSymbol === 'AVAX' || cryptoSymbol === 'USDT') {
      const bytes = generateBytes(seed, 20);
      return '0x' + bytesToHex(bytes);
    }

    // Ripple (XRP)
    if (cryptoSymbol === 'XRP') {
      const bytes = [0, ...generateBytes(seed, 20)]; // Prefixo para endereço 'r'
      const address = bytesToBase58(bytes);
      // XRP endereços começam com 'r'
      return 'r' + address.substring(1, 34);
    }

    // Cardano (ADA)
    if (cryptoSymbol === 'ADA') {
      const bytes = generateBytes(seed, 57);
      return 'addr1' + bytesToBech32(bytes).substring(0, 98);
    }

    // Polkadot (DOT)
    if (cryptoSymbol === 'DOT') {
      const bytes = [0, ...generateBytes(seed, 32)]; // Prefixo 0 para endereço '1'
      const address = bytesToBase58(bytes);
      return address.substring(0, 48);
    }

    // Dogecoin (DOGE)
    if (cryptoSymbol === 'DOGE') {
      const bytes = [0x1e, ...generateBytes(seed, 20)]; // 0x1e = prefixo Dogecoin
      const address = bytesToBase58(bytes);
      return address.substring(0, 34);
    }

    // Litecoin (LTC) - SegWit
    if (cryptoSymbol === 'LTC') {
      const bytes = generateBytes(seed, 32);
      return 'ltc1q' + bytesToBech32(bytes).substring(0, 38);
    }

    // Cosmos (ATOM)
    if (cryptoSymbol === 'ATOM') {
      const bytes = generateBytes(seed, 32);
      return 'cosmos1' + bytesToBech32(bytes).substring(0, 38);
    }

    // Default: Ethereum format
    const bytes = generateBytes(seed, 20);
    return '0x' + bytesToHex(bytes);
  };

  // Se uma cripto foi selecionada, mostra a tela de detalhes
  if (selectedCrypto) {
    const crypto = cryptoList.find(c => c.symbol === selectedCrypto);
    if (!crypto) return null;

    const depositAddress = generateDepositAddress(crypto.symbol, selectedNetwork);

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

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl mb-1 text-gray-400">Receber {crypto.symbol}</h1>
              <p className="text-lg text-gray-500">{crypto.name}</p>
            </div>
            <div className="flex-shrink-0">
              <CryptoIcon symbol={crypto.symbol} size="lg" />
            </div>
          </div>
        </header>

        {/* QR Code Section */}
        <div className="px-6 py-8 flex items-center justify-center">
          <div className="w-64 h-64 bg-zinc-900 rounded-3xl p-6 flex items-center justify-center">
            <div className="w-full h-full bg-white rounded-2xl p-4 flex items-center justify-center">
              <QRCode value={depositAddress} size={180} />
            </div>
          </div>
        </div>

        {/* Address Copy Section */}
        <div className="px-6 mb-6">
          <div className="bg-zinc-900 rounded-2xl p-4">
            <label className="block text-xs text-gray-400 mb-2 font-semibold">Endereço da carteira</label>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-gray-300 overflow-hidden">
                <div className="truncate">{depositAddress}</div>
              </div>
              <button
                onClick={() => copyToClipboard(depositAddress)}
                className="flex-shrink-0 w-12 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-all active:scale-95"
              >
                {copiedAddress ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
            {copiedAddress && (
              <p className="text-xs text-green-500 mt-2 text-center font-semibold">Endereço copiado!</p>
            )}
          </div>
        </div>

        {/* Network Selection */}
        <div className="flex-1 px-6">
          <div className="bg-zinc-900 rounded-3xl p-6">
            <h2 className="text-xl mb-3">Selecione a rede</h2>
            <p className="text-sm text-gray-400 mb-6">
              Certifique-se de selecionar a rede correta ou seus fundos podem ser perdidos.{' '}
              <a href="#" className="text-blue-500 hover:text-blue-400">Saber mais</a>
            </p>

            {/* Network Dropdown */}
            <div className="relative">
              {/* Dropdown Button */}
              <button
                onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
                className="w-full bg-zinc-800 rounded-2xl p-4 flex items-center gap-4 hover:bg-zinc-700 transition-all"
              >
                {/* Selected Network Icon */}
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <CryptoIcon
                    symbol={networks.find(n => n.id === selectedNetwork)?.icon || 'ETH'}
                    size="sm"
                  />
                </div>

                {/* Selected Network Name */}
                <div className="flex-1 text-left">
                  <div className="text-lg font-semibold">
                    {networks.find(n => n.id === selectedNetwork)?.name || 'Ethereum'}
                  </div>
                </div>

                {/* Chevron Icon */}
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isNetworkDropdownOpen ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isNetworkDropdownOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsNetworkDropdownOpen(false)}
                  />

                  {/* Dropdown List */}
                  <div className="absolute z-20 w-full mt-2 bg-zinc-800/95 backdrop-blur-xl rounded-2xl border border-zinc-700/50 shadow-2xl overflow-hidden">
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {networks.map((network) => (
                        <button
                          key={network.id}
                          onClick={() => handleNetworkChange(network.id)}
                          className={`w-full p-4 flex items-center gap-4 transition-all border-b border-zinc-700/30 last:border-b-0 ${selectedNetwork === network.id
                            ? 'bg-blue-500/20'
                            : 'hover:bg-zinc-700/50'
                            }`}
                        >
                          {/* Network Icon */}
                          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <CryptoIcon symbol={network.icon} size="sm" />
                          </div>

                          {/* Network Name */}
                          <div className="flex-1 text-left">
                            <div className="text-base font-semibold"> {network.name}</div>
                          </div>

                          {/* Check Mark */}
                          {selectedNetwork === network.id && (
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                              <Check className="w-4 h-4 text-white" strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
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
        <h1 className="text-3xl">Receber</h1>
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
      <div className="flex-1 px-6">
        <div className="space-y-0">
          {filteredCryptos.map((crypto) => {
            const balance = getCryptoBalance(crypto.symbol);
            const usdValue = calculateUsdValue(crypto.id, balance);

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
                    {crypto.symbol === 'USDT' ? formatCurrency(balance) : formatCrypto(balance)} {crypto.symbol}
                  </div>
                  <div className="text-sm text-gray-400">
                    {formatCurrency(usdValue)} USDT
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