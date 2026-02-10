import { ArrowLeft, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Screen } from '../App';
import { usePortfolio } from '../contexts/PortfolioContext';
import { useCryptoPrices } from '../contexts/CryptoPriceContext';
import { CryptoIcon } from './CryptoIcon';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, formatCrypto } from '../utils/formatters';

interface ManageHoldingsProps {
  onNavigate: (screen: Screen) => void;
}

interface CryptoOption {
  symbol: string;
  coinId: string;
  name: string;
}

export function ManageHoldings({ onNavigate }: ManageHoldingsProps) {
  const { portfolio, addOrUpdateCrypto, removeCrypto, isLoading } = usePortfolio();
  const { prices } = useCryptoPrices();
  const [editingSymbol, setEditingSymbol] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoOption | null>(null);
  const [addAmount, setAddAmount] = useState('');

  // Lista de criptomoedas disponíveis
  const availableCryptos: CryptoOption[] = [
    { symbol: 'BTC', coinId: 'bitcoin', name: 'Bitcoin' },
    { symbol: 'ETH', coinId: 'ethereum', name: 'Ethereum' },
    { symbol: 'USDT', coinId: 'tether', name: 'Tether' },
    { symbol: 'BNB', coinId: 'binancecoin', name: 'Binance Coin' },
    { symbol: 'SOL', coinId: 'solana', name: 'Solana' },
    { symbol: 'ADA', coinId: 'cardano', name: 'Cardano' },
    { symbol: 'XRP', coinId: 'ripple', name: 'Ripple' },
    { symbol: 'DOT', coinId: 'polkadot', name: 'Polkadot' },
    { symbol: 'DOGE', coinId: 'dogecoin', name: 'Dogecoin' },
    { symbol: 'AVAX', coinId: 'avalanche-2', name: 'Avalanche' },
    { symbol: 'MATIC', coinId: 'matic-network', name: 'Polygon' },
    { symbol: 'LINK', coinId: 'chainlink', name: 'Chainlink' },
    { symbol: 'UNI', coinId: 'uniswap', name: 'Uniswap' },
    { symbol: 'LTC', coinId: 'litecoin', name: 'Litecoin' },
    { symbol: 'ATOM', coinId: 'cosmos', name: 'Cosmos' },
  ];

  const handleEdit = (symbol: string, amount: number) => {
    setEditingSymbol(symbol);
    setEditAmount(amount.toString());
  };

  const handleSave = async (symbol: string, coinId: string, name: string) => {
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount < 0) {
      alert('Por favor, insira um valor válido');
      return;
    }

    try {
      await addOrUpdateCrypto(symbol, coinId, amount, name);
      setEditingSymbol(null);
      setEditAmount('');
    } catch (error) {
      console.error('Erro ao atualizar holding:', error);
      alert('Erro ao atualizar. Tente novamente.');
    }
  };

  const handleDelete = async (symbol: string) => {
    if (!confirm(`Tem certeza que deseja remover ${symbol} do seu portfólio?`)) {
      return;
    }

    try {
      await removeCrypto(symbol);
    } catch (error) {
      console.error('Erro ao remover holding:', error);
      alert('Erro ao remover. Tente novamente.');
    }
  };

  const handleAdd = async () => {
    if (!selectedCrypto) {
      alert('Selecione uma criptomoeda');
      return;
    }

    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Por favor, insira um valor válido');
      return;
    }

    try {
      await addOrUpdateCrypto(selectedCrypto.symbol, selectedCrypto.coinId, amount, selectedCrypto.name);
      setShowAddModal(false);
      setSelectedCrypto(null);
      setAddAmount('');
    } catch (error) {
      console.error('Erro ao adicionar holding:', error);
      alert('Erro ao adicionar. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-zinc-900 to-black px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => onNavigate('wallet')}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Gerenciar Ativos</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
          <p className="text-white/50 text-sm mb-1">Saldo Total</p>
          <p className="text-2xl font-bold">{formatCurrency(portfolio.totalBalanceUSDT)} USDT</p>
        </div>
      </div>

      {/* Holdings List */}
      <div className="px-6 pt-6">
        <h2 className="text-lg font-bold mb-4">Seus Ativos</h2>
        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : portfolio.holdings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/50">Nenhum ativo no portfólio</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-6 py-3 bg-blue-600 rounded-xl font-semibold"
            >
              Adicionar Primeiro Ativo
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {portfolio.holdings.map((holding) => {
              const price = prices[holding.coinId]?.usd || 0;
              const value = holding.amount * price;
              const isEditing = editingSymbol === holding.symbol;

              return (
                <div
                  key={holding.symbol}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <CryptoIcon symbol={holding.symbol} size="md" />
                    <div className="flex-1">
                      <h3 className="font-semibold">{holding.name || holding.symbol}</h3>
                      <p className="text-white/50 text-sm">{holding.symbol}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCrypto(holding.amount)} {holding.symbol}</p>
                      <p className="text-white/50 text-sm">{formatCurrency(value)}</p>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        placeholder="Quantidade"
                        className="flex-1 bg-white/10 rounded-xl px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <button
                        onClick={() => handleSave(holding.symbol, holding.coinId, holding.name || holding.symbol)}
                        className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center"
                      >
                        <Save className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingSymbol(null);
                          setEditAmount('');
                        }}
                        className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <p className="text-white/50 text-sm">
                        Quantidade: <span className="text-white font-semibold">{formatCrypto(holding.amount)}</span>
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(holding.symbol, holding.amount)}
                          className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center"
                        >
                          <Edit2 className="w-4 h-4 text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(holding.symbol)}
                          className="w-8 h-8 bg-red-600/20 rounded-lg flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-end"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full bg-zinc-900 rounded-t-3xl p-6 pb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Adicionar Ativo</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedCrypto(null);
                    setAddAmount('');
                  }}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Crypto Selector */}
                <div>
                  <label className="text-white/50 text-sm mb-2 block">Criptomoeda</label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availableCryptos.map((crypto) => (
                      <button
                        key={crypto.symbol}
                        onClick={() => setSelectedCrypto(crypto)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                          selectedCrypto?.symbol === crypto.symbol
                            ? 'bg-white/10 border-2 border-white/30'
                            : 'bg-white/5 border border-white/10'
                        }`}
                      >
                        <CryptoIcon symbol={crypto.symbol} size="sm" />
                        <div className="flex-1 text-left">
                          <p className="font-semibold">{crypto.name}</p>
                          <p className="text-white/50 text-sm">{crypto.symbol}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="text-white/50 text-sm mb-2 block">Quantidade</label>
                  <input
                    type="number"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Add Button */}
                <button
                  onClick={handleAdd}
                  disabled={!selectedCrypto || !addAmount}
                  className="w-full bg-white text-black rounded-xl py-4 font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.2),0_4px_15px_rgba(0,0,0,0.4)]"
                >
                  Adicionar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}