import { Eye, EyeOff, ArrowDownUp, ArrowDown, ArrowUp, Settings, Plus, X, Trash2 } from 'lucide-react';
import type { Screen } from '../App';
import { useState } from 'react';
import { CryptoIcon } from './CryptoIcon';
import { usePortfolio } from '../contexts/PortfolioContext';
import { useCryptoPrices } from '../contexts/CryptoPriceContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency, formatCrypto } from '../utils/formatters';
import { toast } from 'sonner';

interface WalletProps {
  onNavigate: (screen: Screen) => void;
}

interface AddBalanceModal {
  show: boolean;
  holding: {
    symbol: string;
    name: string;
    coinId: string;
    amount: number;
  } | null;
}

interface DeleteConfirmModal {
  show: boolean;
  holding: {
    symbol: string;
    name: string;
    amount: number;
  } | null;
}

export function Wallet({ onNavigate }: WalletProps) {
  const [showBalance, setShowBalance] = useState(true);
  const { portfolio, isLoading, addOrUpdateCrypto, removeCrypto } = usePortfolio();
  const { prices } = useCryptoPrices();
  const { t } = useLanguage();
  const [addBalanceModal, setAddBalanceModal] = useState<AddBalanceModal>({ show: false, holding: null });
  const [balanceToAdd, setBalanceToAdd] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<DeleteConfirmModal>({ show: false, holding: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDoubleClick = (holding: any) => {
    setAddBalanceModal({ show: true, holding });
    setBalanceToAdd('');
  };

  const handleAddBalance = async () => {
    if (!addBalanceModal.holding || !balanceToAdd || parseFloat(balanceToAdd) <= 0) {
      toast.error(t.enterValidValue);
      return;
    }

    setIsAdding(true);
    try {
      const newAmount = addBalanceModal.holding.amount + parseFloat(balanceToAdd);
      
      // addOrUpdateCrypto(symbol, coinId, amount, name?)
      await addOrUpdateCrypto(
        addBalanceModal.holding.symbol,
        addBalanceModal.holding.coinId,
        newAmount,
        addBalanceModal.holding.name
      );
      
      toast.success(t.balanceAddedSuccess, {
        description: `+${balanceToAdd} ${addBalanceModal.holding.symbol}`,
      });
      
      setAddBalanceModal({ show: false, holding: null });
      setBalanceToAdd('');
    } catch (error) {
      console.error('Erro ao adicionar saldo:', error);
      toast.error(t.errorAddingBalance);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmModal.holding) {
      toast.error('Selecione um ativo para excluir');
      return;
    }

    setIsDeleting(true);
    try {
      await removeCrypto(deleteConfirmModal.holding.symbol);
      
      toast.success('Ativo removido com sucesso!', {
        description: `${deleteConfirmModal.holding.symbol}`,
      });
      
      setDeleteConfirmModal({ show: false, holding: null });
    } catch (error) {
      console.error('Erro ao remover ativo:', error);
      toast.error('Erro ao remover ativo');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Header */}
        <header className="px-6 pt-8 pb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg">{t.wallet}</h1>
            <button 
              onClick={() => setShowBalance(!showBalance)}
              className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]"
            >
              {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <button 
              onClick={() => onNavigate('receive')}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-14 h-14 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center transition-transform active:scale-95 border-2 border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.3)]">
                <ArrowDown className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-light text-white">{t.receive}</span>
            </button>
            
            <button 
              onClick={() => onNavigate('convert')}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-14 h-14 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center transition-transform active:scale-95 border-2 border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.3)]">
                <ArrowDownUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-light text-white">{t.convert}</span>
            </button>
            
            <button 
              onClick={() => onNavigate('withdraw')}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-14 h-14 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center transition-transform active:scale-95 border-2 border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.3)]">
                <ArrowUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-light text-white">{t.send}</span>
            </button>
          </div>
        </header>

        {/* Accounts/Currencies List */}
        <div className="px-6 space-y-6 mb-24">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-white/50 mt-4">Carregando ativos...</p>
            </div>
          ) : portfolio.holdings.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold text-white mb-2">Nenhum ativo no portfólio</h3>
              <p className="text-sm text-white/40 mb-8 max-w-xs mx-auto">
                Comece adicionando criptomoedas na aba <span className="text-white font-semibold">Cripto</span>
              </p>
              <button
                onClick={() => onNavigate('crypto')}
                className="px-8 py-4 bg-white/5 backdrop-blur-md rounded-2xl font-semibold text-white hover:bg-white/10 transition-colors border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]"
              >
                Ir para Cripto
              </button>
            </div>
          ) : (
            <>
              {/* Dinheiro e Stablecoins Section */}
              {portfolio.holdings.some(h => h.symbol === 'USDT') && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">Dinheiro e Stablecoins</h2>
                  {portfolio.holdings
                    .filter(h => h.symbol === 'USDT')
                    .map((holding) => {
                      const price = prices[holding.coinId]?.usd || 0;
                      const value = holding.amount * price;
                      const change24h = prices[holding.coinId]?.usd_24h_change || 0;

                      return (
                        <div
                          key={holding.symbol}
                          onDoubleClick={() => handleDoubleClick(holding)}
                          title="Clique 2x para adicionar saldo"
                          className="w-full bg-white/5 backdrop-blur-md rounded-2xl p-5 hover:bg-white/10 transition-colors border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)] relative group cursor-pointer"
                        >
                          {/* Delete Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmModal({ show: true, holding: { symbol: holding.symbol, name: holding.name, amount: holding.amount } });
                            }}
                            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-red-600/80 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                            title="Remover ativo"
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CryptoIcon symbol={holding.symbol} size="md" />
                              <div className="text-left">
                                <div className="font-semibold text-lg mb-1">{holding.symbol}</div>
                                <div className="text-sm text-gray-400">{holding.name || holding.symbol}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-light text-lg tabular-nums">
                                {showBalance ? `${formatCrypto(holding.amount)} ${holding.symbol}` : '••••••'}
                              </div>
                              <div className={`text-sm ${change24h >= 0 ? 'text-[#34c759]' : 'text-[#ff3b30]'}`}>
                                {change24h >= 0 ? '↑' : '↓'} {Math.abs(change24h).toFixed(2)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Criptomoedas Section */}
              {portfolio.holdings.some(h => h.symbol !== 'USDT') ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Criptomoedas</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {portfolio.holdings
                      .filter(h => h.symbol !== 'USDT')
                      .map((holding) => {
                        const price = prices[holding.coinId]?.usd || 0;
                        const value = holding.amount * price;
                        const change24h = prices[holding.coinId]?.usd_24h_change || 0;

                        return (
                          <div
                            key={holding.symbol}
                            onDoubleClick={() => handleDoubleClick(holding)}
                            title="Clique 2x para adicionar saldo"
                            className="w-full bg-white/5 backdrop-blur-md rounded-2xl p-5 hover:bg-white/10 transition-colors border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)] relative group cursor-pointer"
                          >
                            {/* Delete Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmModal({ show: true, holding: { symbol: holding.symbol, name: holding.name, amount: holding.amount } });
                              }}
                              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-red-600/80 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                              title="Remover ativo"
                            >
                              <Trash2 className="w-4 h-4 text-white" />
                            </button>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <CryptoIcon symbol={holding.symbol} size="md" />
                                <div className="text-left">
                                  <div className="font-semibold text-lg mb-1">{holding.symbol}</div>
                                  <div className="text-sm text-gray-400">{holding.name || holding.symbol}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-light text-lg tabular-nums">
                                  {showBalance ? `${formatCrypto(holding.amount)} ${holding.symbol}` : '••••••'}
                                </div>
                                <div className={`text-sm ${change24h >= 0 ? 'text-[#34c759]' : 'text-[#ff3b30]'}`}>
                                  {change24h >= 0 ? '↑' : '↓'} {Math.abs(change24h).toFixed(2)}%
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  
                  {/* Dica para adicionar mais ativos */}
                  <div className="mt-4 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-center">
                    <p className="text-sm text-white/50">
                      💡 Para adicionar mais criptomoedas, vá na aba <span className="font-semibold text-white">Cripto</span> e clique 2x na moeda desejada
                    </p>
                  </div>
                </div>
              ) : (
                // ✅ Seção vazia - Mostrar mensagem para ir na aba Cripto
                <div>
                  <h2 className="text-lg font-semibold mb-4">Criptomoedas</h2>
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center">
                      <Plus className="w-8 h-8 text-white/30" />
                    </div>
                    <p className="text-white/50 text-sm mb-4">
                      Adicione criptomoedas ao seu portfólio
                    </p>
                    <button
                      onClick={() => onNavigate('crypto')}
                      className="px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Ir para Cripto
                    </button>
                    <p className="text-xs text-white/30 mt-3">
                      Na aba Cripto, clique 2x em qualquer moeda para adicionar
                    </p>
                  </div>
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
          onClick={() => setAddBalanceModal({ show: false, holding: null })}
        >
          <div 
            className="bg-white/5 backdrop-blur-md rounded-3xl p-6 w-full max-w-md border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.1)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Adicionar Saldo</h2>
              <button
                onClick={() => setAddBalanceModal({ show: false, holding: null })}
                className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Crypto Info */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
              <CryptoIcon symbol={addBalanceModal.holding?.symbol || 'USDT'} size="lg" />
              <div className="text-left">
                <div className="font-semibold text-xl text-white mb-1">
                  {addBalanceModal.holding?.symbol || 'USDT'}
                </div>
                <div className="text-sm text-gray-400">
                  {addBalanceModal.holding?.name || 'USDT'}
                </div>
              </div>
            </div>

            {/* Current Balance */}
            <div className="mb-4 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
              <p className="text-sm text-gray-400 mb-1">Saldo atual</p>
              <p className="text-2xl font-bold text-white">
                {formatCrypto(addBalanceModal.holding?.amount || 0)} {addBalanceModal.holding?.symbol}
              </p>
            </div>

            {/* Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Valor a adicionar
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
                  {addBalanceModal.holding?.symbol}
                </span>
              </div>
              {balanceToAdd && parseFloat(balanceToAdd) > 0 && (
                <p className="text-sm text-gray-400 mt-2">
                  Novo saldo: {formatCrypto((addBalanceModal.holding?.amount || 0) + parseFloat(balanceToAdd))} {addBalanceModal.holding?.symbol}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setAddBalanceModal({ show: false, holding: null })}
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

      {/* Delete Confirm Modal */}
      {deleteConfirmModal.show && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-6"
          onClick={() => setDeleteConfirmModal({ show: false, holding: null })}
        >
          <div 
            className="bg-white/5 backdrop-blur-md rounded-3xl p-6 w-full max-w-md border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.1)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Remover Ativo</h2>
              <button
                onClick={() => setDeleteConfirmModal({ show: false, holding: null })}
                className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Crypto Info */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
              <CryptoIcon symbol={deleteConfirmModal.holding?.symbol || 'USDT'} size="lg" />
              <div className="text-left">
                <div className="font-semibold text-xl text-white mb-1">
                  {deleteConfirmModal.holding?.symbol || 'USDT'}
                </div>
                <div className="text-sm text-gray-400">
                  {deleteConfirmModal.holding?.name || 'USDT'}
                </div>
              </div>
            </div>

            {/* Current Balance */}
            <div className="mb-4 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
              <p className="text-sm text-gray-400 mb-1">Saldo atual</p>
              <p className="text-2xl font-bold text-white">
                {formatCrypto(deleteConfirmModal.holding?.amount || 0)} {deleteConfirmModal.holding?.symbol}
              </p>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDeleteConfirmModal({ show: false, holding: null })}
                className="py-4 rounded-2xl font-semibold bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="py-4 rounded-2xl font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isDeleting}
              >
                {isDeleting ? 'Removendo...' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}