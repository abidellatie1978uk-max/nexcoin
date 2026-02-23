import { X, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, ChevronRight, Plus, Copy, Check, Share2, Key } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { BankAccount } from '../lib/bankAccountGenerator';
import { PixKeys } from './PixKeys';
import { useFiatBalances } from '../hooks/useFiatBalances';
import { FiatAddFunds } from './FiatAddFunds';
import { useTransactions } from '../hooks/useTransactions';
import { usePixKeys } from '../hooks/usePixKeys';
import { toast } from 'sonner';
import { copyToClipboard } from '../utils/clipboard';
import { useLanguage } from '../contexts/LanguageContext';

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
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { getBalance } = useFiatBalances();
  const { pixKeys, isLoading: isLoadingPixKeys } = usePixKeys();
  const { transactions, isLoading, formatTransactionDescription, getTransactionIconType } = useTransactions();
  const { t, language } = useLanguage();

  const accountTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (tx.currency === account.currency) return true;
      if (tx.fromCurrency === account.currency) return true;
      if (tx.toCurrency === account.currency) return true;
      return false;
    }).slice(0, 10);
  }, [transactions, account.currency]);

  const formatBalance = (currency: string) => {
    const balance = getBalance(currency);
    const locale = language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US';
    return `${balance.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  };

  const handleCopyPixKey = (value: string, keyId: string) => {
    copyToClipboard(value);
    setCopiedKey(keyId);
    toast.success(t.pix?.keyCopied || 'Copiado!', { duration: 2000 });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSharePixKey = async (value: string, keyType: string) => {
    const text = `Chave PIX (${keyType}): ${value}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Chave PIX', text }); } catch { }
    } else {
      copyToClipboard(text);
      toast.success(t.pix?.keyCopied || 'Copiado!', { duration: 2000 });
    }
  };

  const pixKeyTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      email: 'E-mail', phone: t.profile?.phone || 'Telefone', cpf: 'CPF',
      cnpj: 'CNPJ', random: t.pix?.randomKey || 'Chave Aleatória',
    };
    return labels[type] || type;
  };

  const formatAmount = (tx: any) => {
    let amount = 0;
    let currency = account.currency;
    if (tx.type === 'convert') {
      if (tx.fromCurrency === account.currency) { amount = -tx.fromAmount; currency = tx.fromCurrency; }
      else if (tx.toCurrency === account.currency) { amount = tx.toAmount; currency = tx.toCurrency; }
    } else if (tx.type === 'withdraw_fiat' || tx.type === 'send_crypto' || tx.type === 'crypto_send' || tx.type === 'pix_send') {
      amount = -Math.abs(tx.amount);
      currency = tx.currency;
    } else {
      amount = Math.abs(tx.amount);
      currency = tx.currency;
    }
    const sign = amount >= 0 ? '+' : '-';
    const absAmount = Math.abs(amount);
    const locale = language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US';
    const value = absAmount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return { formatted: `${sign} ${value} ${currency}`, amount };
  };

  const formatDate = (date: Date) => {
    const locale = language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US';
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  };

  const getTransactionIcon = (iconType: 'entrada' | 'saida' | 'conversao') => {
    switch (iconType) {
      case 'saida': return <ArrowUpRight className="w-5 h-5 text-white" />;
      case 'entrada': return <ArrowDownLeft className="w-5 h-5 text-white" />;
      case 'conversao': return <ArrowLeftRight className="w-5 h-5 text-white" />;
    }
  };

  return (
    <>
      {showAddFunds ? (
        <FiatAddFunds account={account} onClose={() => setShowAddFunds(false)} />
      ) : showPixKeys ? (
        <PixKeys onNavigate={(screen) => { if (screen === 'home') { setShowPixKeys(false); onClose(); } }} />
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
            <div className="text-white/60 text-sm font-semibold mb-2 tracking-widest uppercase">{account.currency}</div>
            <div className="text-xl font-light text-white mb-8 tabular-nums">{formatBalance(account.currency)}</div>

            {/* Action Buttons */}
            <div className="flex items-center gap-8 mb-10">
              <button onClick={() => setShowAddFunds(true)} className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-full bg-white/5 backdrop-blur-md border-2 border-white/20 flex items-center justify-center shadow-lg hover:bg-white/10 active:scale-95">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-white/70 font-light">{t.fiatAccounts.addButton}</span>
              </button>
              <button onClick={() => onNavigateToConvert?.()} className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-full bg-white/5 backdrop-blur-md border-2 border-white/20 flex items-center justify-center shadow-lg hover:bg-white/10 active:scale-95">
                  <ArrowLeftRight className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-white/70 font-light">{t.bottomNav.convert}</span>
              </button>
              <button onClick={() => onNavigateToWithdraw?.()} className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-full bg-white/5 backdrop-blur-md border-2 border-white/20 flex items-center justify-center shadow-lg hover:bg-white/10 active:scale-95">
                  <ArrowUpRight className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-white/70 font-light">{t.withdrawTransfer.sendMoney}</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-4 mb-6">
            <div className="bg-white/5 backdrop-blur-md rounded-full p-1 flex border border-white/10">
              <button
                onClick={() => setActiveTab('transactions')}
                className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === 'transactions' ? 'bg-white/20 text-white' : 'text-white/50'}`}
              >
                {t.transactions}
              </button>
              <button
                onClick={() => setActiveTab('options')}
                className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === 'options' ? 'bg-white/20 text-white' : 'text-white/50'}`}
              >
                {t.options}
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
                  </div>
                ) : accountTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <ArrowLeftRight className="w-8 h-8 text-white/30 mx-auto mb-4" />
                    <p className="text-white/50 text-sm">{t.transactionsPage.noTransactions}</p>
                  </div>
                ) : (
                  accountTransactions.map((transaction) => {
                    const { formatted, amount } = formatAmount(transaction);
                    const iconType = getTransactionIconType(transaction);
                    return (
                      <div key={transaction.id} className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                          {getTransactionIcon(iconType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-semibold text-sm truncate">{formatTransactionDescription(transaction)}</div>
                          <div className="text-white/50 text-xs">{formatDate(transaction.createdAt)}</div>
                        </div>
                        <div className={`font-semibold text-sm tabular-nums ${amount >= 0 ? 'text-[#34c759]' : 'text-white'}`}>{formatted}</div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Account Details */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <h3 className="text-white font-bold text-sm mb-3">{t.fiatAccounts.accountData}</h3>
                  <div className="space-y-3 text-sm">
                    <div><div className="text-white/50 text-xs">{t.fiatAccounts.bank}</div><div className="text-white font-semibold">{account.bankName}</div></div>
                    <div><div className="text-white/50 text-xs">{t.fiatAccounts.accountNumber}</div><div className="text-white font-semibold tabular-nums">{account.accountNumber}</div></div>
                    {account.routingNumber && <div><div className="text-white/50 text-xs">{t.fiatAccounts.bankCode}</div><div className="text-white font-semibold tabular-nums">{account.routingNumber}</div></div>}
                    {account.iban && <div><div className="text-white/50 text-xs">{t.fiatAccounts.iban}</div><div className="text-white font-semibold tabular-nums">{account.iban}</div></div>}
                    {account.swift && <div><div className="text-white/50 text-xs">{t.fiatAccounts.swiftBic}</div><div className="text-white font-semibold tabular-nums">{account.swift}</div></div>}
                  </div>
                </div>

                {/* PIX Keys Section (BRL only) */}
                {account.currency === 'BRL' && (
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-cyan-400" />
                        <h3 className="text-white font-bold text-sm">{t.fiatAccounts.pixKeys}</h3>
                      </div>
                      <button onClick={() => setShowPixKeys(true)} className="text-xs text-cyan-400 font-semibold">{t.pix.manage}</button>
                    </div>

                    {isLoadingPixKeys ? (
                      <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>
                    ) : pixKeys.length === 0 ? (
                      <div className="text-center py-4">
                        <button onClick={() => setShowPixKeys(true)} className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm font-semibold border border-cyan-500/30">+ {t.pix.registerKey}</button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {pixKeys.map((key) => (
                          <div key={key.id} className="flex items-center gap-3 bg-black/30 rounded-xl p-3 border border-white/5">
                            <div className="w-8 h-8 rounded-full bg-cyan-500/15 flex items-center justify-center flex-shrink-0"><Key className="w-4 h-4 text-cyan-400" /></div>
                            <div className="flex-1 min-w-0">
                              <div className="text-white/50 text-xs mb-0.5">{pixKeyTypeLabel(key.keyType)}</div>
                              <div className="text-white text-sm font-mono truncate">{key.keyValue}</div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleSharePixKey(key.keyValue, pixKeyTypeLabel(key.keyType))} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10"><Share2 className="w-3.5 h-3.5 text-white/60" /></button>
                              <button onClick={() => handleCopyPixKey(key.keyValue, key.id)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
                                {copiedKey === key.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Account Actions */}
                <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/10">
                  <button className="w-full p-4 flex items-center justify-between hover:bg-white/10 border-b border-white/5">
                    <span className="text-white text-sm font-semibold">{t.fiatAccounts.accountSettings}</span>
                    <ChevronRight className="w-4 h-4 text-white/50" />
                  </button>
                  <button className="w-full p-4 flex items-center justify-between hover:bg-white/10">
                    <span className="text-[#ff3b30] text-sm font-semibold">{t.fiatAccounts.removeAccount}</span>
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