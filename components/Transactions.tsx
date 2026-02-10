import { ArrowLeft, Search, SlidersHorizontal, Clock, X, Loader2, ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { Screen } from '../App';
import { useState, useMemo } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import type { TransactionType } from '../hooks/useTransactions';

interface TransactionsProps {
  onNavigate: (screen: Screen) => void;
}

export function Transactions({ onNavigate }: TransactionsProps) {
  const { 
    transactions, 
    isLoading, 
    formatAmount, 
    getCurrencySymbol,
    formatTransactionDescription,
    formatTransactionAmount,
    getTransactionIcon,
    getTransactionIconType 
  } = useTransactions();

  const [searchTerm, setSearchTerm] = useState('');

  // Agrupar transações por data
  const groupedTransactions = useMemo(() => {
    const filtered = transactions.filter(tx => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const description = formatTransactionDescription(tx);
        if (!description.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      return true;
    });

    // Agrupar por data
    const grouped: Record<string, typeof transactions> = {};
    
    filtered.forEach(tx => {
      const date = tx.createdAt;
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateKey: string;

      if (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      ) {
        dateKey = 'Hoje';
      } else if (
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear()
      ) {
        dateKey = 'Ontem';
      } else {
        dateKey = date.toLocaleDateString('pt-BR', { 
          day: 'numeric', 
          month: 'long',
          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined 
        });
      }

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(tx);
    });

    return grouped;
  }, [transactions, searchTerm, formatTransactionDescription]);

  // Formatar hora
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Obter cor do status
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'pending':
      case 'processing':
        return 'text-yellow-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <div className="px-6 pt-4 pb-6">
        <button 
          onClick={() => onNavigate('home')}
          className="w-12 h-12 rounded-full border border-gray-700 flex items-center justify-center mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="text-2xl font-bold mb-6">Transações</h1>

        {/* Search and Filter */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full bg-zinc-900/80 rounded-full pl-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-zinc-700 ${
                searchTerm ? 'pr-10' : 'pr-4'
              } py-3`}
            />
            {searchTerm && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500"
                onClick={() => setSearchTerm('')}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && transactions.length === 0 && (
        <div className="px-6 py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Nenhuma transação</h3>
          <p className="text-gray-400 text-sm">
            Suas transações aparecerão aqui
          </p>
        </div>
      )}

      {/* No Results */}
      {!isLoading && transactions.length > 0 && Object.keys(groupedTransactions).length === 0 && (
        <div className="px-6 py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Nenhum resultado</h3>
          <p className="text-gray-400 text-sm">
            Tente ajustar a busca
          </p>
        </div>
      )}

      {/* Transactions List */}
      {!isLoading && Object.keys(groupedTransactions).length > 0 && (
        <div className="px-6 space-y-6">
          {Object.entries(groupedTransactions).map(([date, txs]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="text-sm font-semibold text-gray-400 mb-3">
                {date}
              </div>

              {/* Transactions for this date */}
              <div className="space-y-3">
                {txs.map((tx) => (
                  <button
                    key={tx.id}
                    className="w-full bg-zinc-900/80 backdrop-blur rounded-2xl p-4 flex items-center justify-between hover:bg-zinc-800/80 transition-colors"
                  >
                    {/* Left Side */}
                    <div className="flex items-center gap-3">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 ${
                        getTransactionIconType(tx) === 'entrada' ? 'text-green-500' :
                        getTransactionIconType(tx) === 'saida' ? 'text-red-500' :
                        'text-orange-500'
                      }`}>
                        {getTransactionIconType(tx) === 'entrada' && <ArrowDown className="w-4 h-4" />}
                        {getTransactionIconType(tx) === 'saida' && <ArrowUp className="w-4 h-4" />}
                        {getTransactionIconType(tx) === 'conversao' && <ArrowUpDown className="w-4 h-4" />}
                      </div>
                      
                      {/* Info */}
                      <div className="text-left">
                        <div className="font-semibold text-white">
                          {formatTransactionDescription(tx)}
                        </div>
                        <div className="text-sm text-gray-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTime(tx.createdAt)}
                          <span className="mx-1">•</span>
                          <span className={getStatusColor(tx.status)}>
                            {tx.status === 'completed' && 'Concluído'}
                            {tx.status === 'pending' && 'Pendente'}
                            {tx.status === 'processing' && 'Processando'}
                            {tx.status === 'failed' && 'Falhou'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Side */}
                    <div className="text-right">
                      <div className={`font-semibold ${
                        ['receive_crypto', 'crypto_receive', 'pix_receive', 'deposit_fiat'].includes(tx.type) 
                          ? 'text-green-500' 
                          : 'text-white'
                      }`}>
                        {formatTransactionAmount(tx)}
                      </div>
                      {tx.fee > 0 && (
                        <div className="text-sm text-gray-400">
                          Taxa: {getCurrencySymbol(tx.feeCurrency)} {formatAmount(tx.fee)}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}