import { X, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, ChevronRight, Plus } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { BankAccount } from '../lib/bankAccountGenerator';
import { PixKeys } from './PixKeys';
import { useFiatBalances } from '../hooks/useFiatBalances';
import { FiatAddFunds } from './FiatAddFunds';
import { useTransactions } from '../hooks/useTransactions';

interface FiatAccountDetailsProps {
  account: BankAccount;
  onClose: () => void;
  onNavigateToConvert?: () => void;
  onNavigateToWithdraw?: () => void;
}

export function FiatAccountDetails({ account, onClose, onNavigateToConvert, onNavigateToWithdraw }: FiatAccountDetailsProps) {
  const [activeTab, setActiveTab] = useState<'transactions' | 'options'>('transactions');
  const [showPixKeys, setShowPixKeys] = useState(false);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const { getBalance } = useFiatBalances();
  const { transactions, isLoading, formatTransactionDescription, getTransactionIconType } = useTransactions();

  // Filtrar transações da moeda atual
  const accountTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Mostrar transações que envolvem esta moeda
      if (tx.currency === account.currency) return true;
      if (tx.fromCurrency === account.currency) return true;
      if (tx.toCurrency === account.currency) return true;
      return false;
    }).slice(0, 10); // Mostrar apenas as 10 mais recentes
  }, [transactions, account.currency]);

  const formatBalance = (currency: string) => {
    const balance = getBalance(currency);
    
    if (currency === 'BRL') {
      return `${balance.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })} ${currency}`;
    }
    
    return `${balance.toFixed(2).replace('.', ',')} ${currency}`;
  };

  const formatAmount = (tx: any) => {
    let amount = 0;
    let currency = account.currency;
    
    // Determinar o valor e a moeda corretos para exibir
    if (tx.type === 'convert') {
      // Para conversões, mostrar o valor na moeda da conta
      if (tx.fromCurrency === account.currency) {
        amount = -tx.fromAmount;
        currency = tx.fromCurrency;
      } else if (tx.toCurrency === account.currency) {
        amount = tx.toAmount;
        currency = tx.toCurrency;
      }
    } else if (tx.type === 'withdraw_fiat' || tx.type === 'send_crypto' || tx.type === 'crypto_send' || tx.type === 'pix_send') {
      // ✅ Adicionar novos tipos de envio (saída)
      amount = -Math.abs(tx.amount); // Garantir que seja negativo
      currency = tx.currency;
    } else {
      // ✅ Tipos de recebimento (entrada): receive_crypto, crypto_receive, pix_receive, deposit_fiat
      amount = Math.abs(tx.amount); // Garantir que seja positivo
      currency = tx.currency;
    }

    const sign = amount >= 0 ? '+' : '-';
    const absAmount = Math.abs(amount);
    
    let value: string;
    if (currency === 'BRL') {
      value = absAmount.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } else {
      value = absAmount.toFixed(2).replace('.', ',');
    }
    
    return { formatted: `${sign} ${value} ${currency}`, amount };
  };

  const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = date.toLocaleDateString('pt-BR', { month: 'short' });
    return `${day} de ${month.charAt(0).toUpperCase() + month.slice(1)}`;
  };

  const getTransactionIcon = (iconType: 'entrada' | 'saida' | 'conversao') => {
    switch (iconType) {
      case 'saida':
        return <ArrowUpRight className="w-5 h-5 text-white" />;
      case 'entrada':
        return <ArrowDownLeft className="w-5 h-5 text-white" />;
      case 'conversao':
        return <ArrowLeftRight className="w-5 h-5 text-white" />;
    }
  };

  return (
    <>
      {showAddFunds ? (
        <FiatAddFunds account={account} onClose={() => setShowAddFunds(false)} />
      ) : showPixKeys ? (
        <PixKeys onNavigate={(screen) => {
          if (screen === 'home') {
            setShowPixKeys(false);
            onClose();
          }
        }} />
      ) : (
        <div className="fixed inset-0 bg-gradient-to-b from-[#1a2942] via-black to-black z-50 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 relative z-10">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10 hover:bg-white/15 transition-all"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Account Info */}
          <div className="flex flex-col items-center mt-8 px-4 relative z-10">
            {/* Currency Code */}
            <div className="text-white/60 text-sm font-semibold mb-2 tracking-widest uppercase">
              {account.currency}
            </div>

            {/* Balance */}
            <div className="text-xl font-light text-white mb-8 tabular-nums">
              {formatBalance(account.currency)}
            </div>

            {/* PIX Keys Button (only for BRL) */}
            {account.currency === 'BRL' && (
              <button 
                onClick={() => setShowPixKeys(true)}
                className="mb-8 px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 text-white font-semibold text-sm shadow-[0_0_20px_rgba(255,255,255,0.05)]"
              >
                Chaves Pix
              </button>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-8 mb-10">
              {/* Adicionar */}
              <button 
                onClick={() => setShowAddFunds(true)}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-14 h-14 rounded-full bg-white/5 backdrop-blur-md border-2 border-white/20 transition-all flex items-center justify-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.3)] hover:bg-white/10 active:scale-95">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-white/70 font-light">Adicionar</span>
              </button>

              {/* Converter */}
              <button 
                onClick={() => {
                  if (onNavigateToConvert) {
                    onNavigateToConvert();
                  }
                }}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-14 h-14 rounded-full bg-white/5 backdrop-blur-md border-2 border-white/20 transition-all flex items-center justify-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.3)] hover:bg-white/10 active:scale-95">
                  <ArrowLeftRight className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-white/70 font-light">Converter</span>
              </button>

              {/* Enviar */}
              <button 
                onClick={() => {
                  if (onNavigateToWithdraw) {
                    onNavigateToWithdraw();
                  }
                }}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-14 h-14 rounded-full bg-white/5 backdrop-blur-md border-2 border-white/20 transition-all flex items-center justify-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.3)] hover:bg-white/10 active:scale-95">
                  <ArrowUpRight className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-white/70 font-light">Enviar</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-4 mb-6">
            <div className="bg-white/5 backdrop-blur-md rounded-full p-1 flex border border-white/10">
              <button
                onClick={() => setActiveTab('transactions')}
                className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeTab === 'transactions'
                    ? 'bg-white/20 backdrop-blur-md text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                Transações
              </button>
              <button
                onClick={() => setActiveTab('options')}
                className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeTab === 'options'
                    ? 'bg-white/20 backdrop-blur-md text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                Opções
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 pb-8">
            {activeTab === 'transactions' ? (
              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                    <p className="text-white/50 mt-4 text-sm">Carregando transações...</p>
                  </div>
                ) : accountTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center">
                      <ArrowLeftRight className="w-8 h-8 text-white/30" />
                    </div>
                    <p className="text-white/50 text-sm">Nenhuma transação encontrada</p>
                    <p className="text-white/30 text-xs mt-2">Suas transações aparecerão aqui</p>
                  </div>
                ) : (
                  <>
                    {accountTransactions.map((transaction) => {
                      const { formatted, amount } = formatAmount(transaction);
                      const iconType = getTransactionIconType(transaction);

                      return (
                        <div
                          key={transaction.id}
                          className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:bg-white/10 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            {/* Icon */}
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                              {getTransactionIcon(iconType)}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-semibold text-sm truncate">
                                {formatTransactionDescription(transaction)}
                              </div>
                              <div className="text-white/50 text-xs">
                                {transaction.recipientInfo || transaction.description || 'Transação'} · {formatDate(transaction.createdAt)}
                              </div>
                            </div>

                            {/* Amount */}
                            <div className="flex flex-col items-end">
                              <div className={`font-semibold text-sm tabular-nums ${
                                amount >= 0 ? 'text-[#34c759]' : 'text-white'
                              }`}>
                                {formatted}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Account Details */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                  <h3 className="text-white font-bold text-sm mb-3">Dados da Conta</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-white/50 text-xs mb-1">Banco</div>
                      <div className="text-white text-sm font-semibold">{account.bankName}</div>
                    </div>

                    <div>
                      <div className="text-white/50 text-xs mb-1">Número da Conta</div>
                      <div className="text-white text-sm font-semibold tabular-nums">{account.accountNumber}</div>
                    </div>

                    {account.routingNumber && (
                      <div>
                        <div className="text-white/50 text-xs mb-1">Código do Banco</div>
                        <div className="text-white text-sm font-semibold tabular-nums">{account.routingNumber}</div>
                      </div>
                    )}

                    {account.iban && (
                      <div>
                        <div className="text-white/50 text-xs mb-1">IBAN</div>
                        <div className="text-white text-sm font-semibold tabular-nums">{account.iban}</div>
                      </div>
                    )}

                    {account.swift && (
                      <div>
                        <div className="text-white/50 text-xs mb-1">SWIFT</div>
                        <div className="text-white text-sm font-semibold tabular-nums">{account.swift}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Actions */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                  <button className="w-full p-4 flex items-center justify-between hover:bg-white/10 transition-all border-b border-white/5">
                    <span className="text-white text-sm font-semibold">Configurações da Conta</span>
                    <ChevronRight className="w-4 h-4 text-white/50" />
                  </button>
                  
                  <button className="w-full p-4 flex items-center justify-between hover:bg-white/10 transition-all">
                    <span className="text-[#ff3b30] text-sm font-semibold">Remover Conta</span>
                    <ChevronRight className="w-4 h-4 text-[#ff3b30]/50" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}