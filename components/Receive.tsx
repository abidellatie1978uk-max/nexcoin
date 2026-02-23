import { ArrowLeft, Copy, RefreshCw, CheckCircle2, Loader, Search, HelpCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { CryptoIcon } from './CryptoIcon';
import type { Screen } from '../App';
import { copyToClipboard } from '../utils/clipboard';
import { useWalletAddresses } from '../hooks/useWalletAddresses';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { usePortfolio } from '../contexts/PortfolioContext';
import { useCryptoPrices } from '../contexts/CryptoPriceContext';

interface ReceiveProps {
  onNavigate: (screen: Screen) => void;
}

// Lista de criptomoedas disponíveis
const cryptoList = [
  { symbol: 'USDT', name: 'Tether', id: 'tether' },
  { symbol: 'BTC', name: 'Bitcoin', id: 'bitcoin' },
  { symbol: 'ETH', name: 'Ethereum', id: 'ethereum' },
  { symbol: 'BNB', name: 'Binance Coin', id: 'binancecoin' },
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
  { symbol: 'TRX', name: 'Tron', id: 'tron' },
];

// Redes disponíveis
const networks = [
  { id: 'Ethereum', name: 'Ethereum (ERC20)', icon: 'ETH', shortName: 'ETH' },
  { id: 'Tron', name: 'Tron (TRC20)', icon: 'TRX', shortName: 'TRX' },
  { id: 'Polygon', name: 'Polygon', icon: 'MATIC', shortName: 'MATIC' },
  { id: 'Solana', name: 'Solana', icon: 'SOL', shortName: 'SOL' },
  { id: 'BSC', name: 'BNB Smart Chain', icon: 'BNB', shortName: 'BNB' },
  { id: 'Bitcoin', name: 'Bitcoin', icon: 'BTC', shortName: 'BTC' },
  { id: 'Ripple', name: 'Ripple', icon: 'XRP', shortName: 'XRP' },
];

export function Receive({ onNavigate }: ReceiveProps) {
  const [selectedCrypto, setSelectedCrypto] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string>('Tron');
  const [address, setAddress] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
  const [showHelpPage, setShowHelpPage] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { getAddressForNetwork, regenerateAddress, isLoading } = useWalletAddresses();
  const { portfolio } = usePortfolio();
  const { prices } = useCryptoPrices();

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNetworkDropdownOpen(false);
      }
    };

    if (isNetworkDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNetworkDropdownOpen]);

  // Função para obter o saldo de uma cripto do portfólio
  const getCryptoBalance = (symbol: string): number => {
    const holding = portfolio.holdings.find(h => h.symbol === symbol);
    return holding?.amount || 0;
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

  // Carregar endereço quando a rede mudar
  useEffect(() => {
    if (selectedCrypto) {
      loadAddress();
    }
  }, [selectedNetwork, selectedCrypto]);

  // Gerar QR Code quando o endereço mudar
  useEffect(() => {
    if (address && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, address, {
        width: 192,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      }).catch((error) => {
        console.error('Erro ao gerar QR Code:', error);
      });
    }
  }, [address]);

  const loadAddress = async () => {
    try {
      const addr = await getAddressForNetwork(selectedNetwork);
      setAddress(addr);
      setIsCopied(false);
      console.log(`✅ Endereço carregado para ${selectedNetwork}:`, addr);
    } catch (error) {
      console.error('❌ Erro ao carregar endereço:', error);
      toast.error('Erro ao carregar endereço');
    }
  };

  const handleCopy = async () => {
    if (!address) {
      toast.error('Nenhum endereço disponível');
      return;
    }

    const success = await copyToClipboard(address);
    if (success) {
      setIsCopied(true);
      const selectedNetworkData = networks.find(n => n.id === selectedNetwork);
      toast.success('Endereço copiado!', {
        description: `${selectedNetworkData?.shortName} • ${address.substring(0, 8)}...`,
      });

      setTimeout(() => {
        setIsCopied(false);
      }, 3000);
    }
  };

  const handleRegenerate = async () => {
    if (!selectedNetwork) return;

    setIsRegenerating(true);
    try {
      console.log(`🔄 Regenerando endereço para ${selectedNetwork}...`);
      const newAddress = await regenerateAddress(selectedNetwork);
      setAddress(newAddress);
      setIsCopied(false);

      const selectedNetworkData = networks.find(n => n.id === selectedNetwork);
      toast.success('Novo endereço gerado!', {
        description: `${selectedNetworkData?.shortName} • ${newAddress.substring(0, 8)}...`,
      });

      console.log(`✅ Novo endereço gerado para ${selectedNetwork}:`, newAddress);
    } catch (error) {
      console.error('❌ Erro ao regenerar endereço:', error);
      toast.error('Erro ao gerar novo endereço');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCryptoSelect = (crypto: typeof cryptoList[0]) => {
    setSelectedCrypto(crypto.symbol);
    setSearchTerm('');
  };

  const handleBack = () => {
    if (selectedCrypto) {
      setSelectedCrypto(null);
      setAddress('');
      setQrCodeUrl('');
    } else {
      onNavigate('wallet');
    }
  };

  const selectedNetworkData = networks.find(n => n.id === selectedNetwork);
  const selectedCryptoData = cryptoList.find(c => c.symbol === selectedCrypto);

  // Página de Ajuda
  if (showHelpPage) {
    return (
      <div className="min-h-screen bg-black text-white pb-6">
        <div className="px-6 pt-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setShowHelpPage(false)}
              className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-lg text-white">Ajuda</h1>
            <div className="w-10" />
          </div>

          {/* Help Cards */}
          <div className="space-y-4">
            {/* Atenção */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-5">
              <div className="flex gap-3">
                <div className="text-yellow-500 text-2xl">⚠️</div>
                <div className="flex-1">
                  <p className="text-yellow-200 font-semibold mb-2">Atenção</p>
                  <p className="text-yellow-200/80 text-sm leading-relaxed">
                    Envie apenas ativos compatíveis com a rede selecionada.
                    Enviar ativos de outras redes pode resultar em perda permanente dos seus fundos.
                    Sempre verifique se a rede escolhida é compatível com a plataforma de origem antes de realizar a transferência.
                  </p>
                </div>
              </div>
            </div>

            {/* Endereço único */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10">
              <div className="flex items-start gap-3">
                <div className="text-2xl">💡</div>
                <div className="flex-1">
                  <p className="text-white font-semibold mb-2">Endereço único</p>
                  <p className="text-white/70 text-sm leading-relaxed">
                    Este endereço é exclusivo da sua conta e pode ser usado múltiplas vezes para receber criptomoedas.
                    Use o botão "Novo" para gerar um novo endereço quando necessário, por exemplo, para organizar diferentes transações ou aumentar sua privacidade.
                  </p>
                </div>
              </div>
            </div>

            {/* Segurança */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🔒</div>
                <div className="flex-1">
                  <p className="text-white font-semibold mb-2">Segurança</p>
                  <p className="text-white/70 text-sm leading-relaxed">
                    Cada rede blockchain tem um endereço diferente. Ethereum (ERC20), Tron (TRC20), Polygon, Solana, BNB Smart Chain, Bitcoin e Ripple possuem formatos de endereços incompatíveis entre si.
                    Sempre confirme a rede antes de enviar ativos para evitar perdas irreversíveis.
                  </p>
                </div>
              </div>
            </div>

            {/* Como funciona */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10">
              <div className="flex items-start gap-3">
                <div className="text-2xl">⚡</div>
                <div className="flex-1">
                  <p className="text-white font-semibold mb-2">Como funciona</p>
                  <p className="text-white/70 text-sm leading-relaxed">
                    Compartilhe este endereço ou QR Code com quem vai enviar criptomoedas para você.
                    Quando a transação for confirmada na blockchain, os depósitos aparecem automaticamente na sua carteira NexCoin.
                    O tempo de confirmação varia de acordo com a rede: pode levar de segundos a alguns minutos.
                  </p>
                </div>
              </div>
            </div>

            {/* Informação adicional */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10">
              <div className="flex items-start gap-3">
                <div className="text-2xl">📱</div>
                <div className="flex-1">
                  <p className="text-white font-semibold mb-2">Dica importante</p>
                  <p className="text-white/70 text-sm leading-relaxed">
                    Ao receber sua primeira transação em uma determinada rede, recomendamos fazer um teste com uma pequena quantia primeiro.
                    Depois de confirmar que tudo funcionou corretamente, você pode realizar transações maiores com segurança.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Se nenhuma cripto selecionada, mostrar lista de seleção
  if (!selectedCrypto) {
    return (
      <div className="min-h-screen bg-black text-white pb-24">
        <div className="px-6 pt-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={handleBack}
              className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-lg text-white">Receber Cripto</h1>
            <div className="w-10" />
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Buscar criptomoeda..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 backdrop-blur-md text-white rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-white/20 placeholder-white/40 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]"
              />
            </div>
          </div>

          {/* Crypto List */}
          <div className="space-y-3">
            {filteredCryptos.map((crypto) => {
              const balance = getCryptoBalance(crypto.symbol);
              const usdValue = calculateUsdValue(crypto.id, balance);

              return (
                <button
                  key={crypto.symbol}
                  onClick={() => handleCryptoSelect(crypto)}
                  className="w-full bg-white/5 backdrop-blur-md rounded-2xl p-4 hover:bg-white/10 transition-all border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                        <CryptoIcon symbol={crypto.symbol} size="md" />
                      </div>
                      <div className="text-left">
                        <div className="text-white font-semibold text-base">{crypto.name}</div>
                        <div className="text-sm text-white/50">{crypto.symbol}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">
                        {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                      </div>
                      <div className="text-sm text-white/50">
                        ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Se cripto selecionada, mostrar página de endereço com QR Code
  return (
    <div className="min-h-screen bg-black text-white pb-6">
      <div className="px-6 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="text-center">
            <h1 className="text-lg text-white">Receber {selectedCrypto}</h1>
            <p className="text-sm text-white/60">{selectedCryptoData?.name}</p>
          </div>
          <div className="w-10" />
        </div>

        {/* Network Selector */}
        <div className="mb-6" ref={dropdownRef}>
          <label className="block text-white/70 text-sm font-semibold mb-3">Selecione a rede</label>

          {/* Dropdown Trigger */}
          <button
            onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
            className="w-full bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-4 hover:bg-white/10 transition-all shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedNetworkData && (
                  <>
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <CryptoIcon symbol={selectedNetworkData.icon} size="sm" />
                    </div>
                    <div className="text-left">
                      <div className="text-white font-semibold">{selectedNetworkData.name}</div>
                      <div className="text-xs text-gray-400">{selectedNetworkData.shortName}</div>
                    </div>
                  </>
                )}
              </div>
              <svg
                className={`w-5 h-5 text-white/60 transition-transform ${isNetworkDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Dropdown List */}
          {isNetworkDropdownOpen && (
            <div className="mt-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]">
              {/* Scrollable Container - Mostra 2 itens, scroll invisível */}
              <div
                className="max-h-[176px] overflow-y-auto"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                <style>{`
                  div::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                {networks.map((network, index) => (
                  <button
                    key={network.id}
                    onClick={() => {
                      setSelectedNetwork(network.id);
                      setIsNetworkDropdownOpen(false);
                    }}
                    className={`w-full p-4 flex items-center justify-between transition-all ${selectedNetwork === network.id
                      ? 'bg-white/10'
                      : 'hover:bg-white/5'
                      } ${index !== networks.length - 1 ? 'border-b border-white/5' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <CryptoIcon symbol={network.icon} size="sm" />
                      </div>
                      <div className="text-left">
                        <div className="text-white font-semibold">{network.name}</div>
                        <div className="text-xs text-gray-400">{network.shortName}</div>
                      </div>
                    </div>
                    {selectedNetwork === network.id && (
                      <div className="w-2 h-2 rounded-full bg-[#34c759]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Address Card */}
        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 mb-6 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]">
          {/* QR Code Area */}
          <div className="bg-white rounded-2xl p-8 mb-6 flex items-center justify-center">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader className="w-12 h-12 text-black animate-spin mb-4" />
                <p className="text-black text-sm font-semibold">Gerando endereço...</p>
              </div>
            ) : (
              <canvas ref={canvasRef} className="w-48 h-48" />
            )}
          </div>

          {/* Network Badge */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {selectedNetworkData && (
              <>
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                  <CryptoIcon symbol={selectedNetworkData.icon} size="sm" />
                </div>
                <span className="text-sm font-semibold text-white/80">
                  {selectedNetworkData.name}
                </span>
              </>
            )}
          </div>

          {/* Address Display */}
          <div className="mb-6">
            <p className="text-white/50 text-xs font-semibold mb-2 text-center">
              SEU ENDEREÇO
            </p>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            ) : (
              <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                <p className="font-mono text-sm break-all text-white text-center leading-relaxed">
                  {address || 'Gerando endereço...'}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              className="bg-white/5 backdrop-blur-md rounded-xl py-4 flex flex-col items-center gap-2 hover:bg-white/10 transition-all border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleCopy}
              disabled={!address || isLoading}
            >
              {isCopied ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-[#34c759]" />
                  <span className="text-xs text-[#34c759] font-semibold">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 text-white" />
                  <span className="text-xs text-white font-semibold">Copiar</span>
                </>
              )}
            </button>

            <button
              className="bg-white/5 backdrop-blur-md rounded-xl py-4 flex flex-col items-center gap-2 hover:bg-white/10 transition-all border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleRegenerate}
              disabled={isRegenerating || !address || isLoading}
            >
              <RefreshCw className={`w-5 h-5 text-white ${isRegenerating ? 'animate-spin' : ''}`} />
              <span className="text-xs text-white font-semibold">
                {isRegenerating ? 'Gerando...' : 'Novo'}
              </span>
            </button>
          </div>
        </div>

        {/* Help Box */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
          <div className="flex items-center justify-center gap-2">
            <HelpCircle className="w-4 h-4 text-white/60" />
            <p className="text-white/70 text-xs text-center">
              Dúvidas sobre transações? <span onClick={() => setShowHelpPage(true)} className="text-white font-semibold underline cursor-pointer hover:text-white/90 transition-colors">Ajuda aqui</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
