import { ArrowLeft, ChevronRight, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFiatBalances } from '../hooks/useFiatBalances';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Screen } from '../App';
import type { BankAccount } from '../lib/bankAccountGenerator';

interface SelectFiatAccountProps {
  onNavigate: (screen: Screen) => void;
  onSelectAccount?: (account: BankAccount) => void;
  onNavigateWithAccount?: (screen: Screen, account: BankAccount) => void;
}

export function SelectFiatAccount({ onNavigate, onSelectAccount, onNavigateWithAccount }: SelectFiatAccountProps) {
  const { user } = useAuth();
  const { getBalance } = useFiatBalances(); // ✅ Hook para buscar saldos do Firestore
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ LISTENER DE CONTAS BANCÁRIAS EM TEMPO REAL
  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    console.log('🔄 [SelectFiatAccount] Iniciando listener de contas bancárias para userId:', user.uid);

    const accountsRef = collection(db, 'bankAccounts');
    const q = query(accountsRef, where('userId', '==', user.uid));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('📡 [SelectFiatAccount] Contas bancárias recebidas:', snapshot.size);
        
        const accountsData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as BankAccount[];

        console.log('💳 [SelectFiatAccount] Total de contas carregadas:', accountsData.length);
        console.log('🌍 [SelectFiatAccount] Países das contas:', accountsData.map(acc => `${acc.country} (${acc.currency})`).join(', '));

        setAccounts(accountsData);
        setIsLoading(false);
      },
      (error) => {
        console.error('❌ [SelectFiatAccount] Erro no listener de contas bancárias:', error);
        setIsLoading(false);
      }
    );

    return () => {
      console.log('🔌 [SelectFiatAccount] Desconectando listener de contas bancárias');
      unsubscribe();
    };
  }, [user]);

  // Configuração de moedas com bandeiras e nomes
  const currencyConfig: { [key: string]: { flag: string; name: string; color: string } } = {
    BRL: { flag: '🇧🇷', name: 'Real Brasileiro', color: '#34c759' },
    USD: { flag: '🇺🇸', name: 'Dólar Americano', color: '#007aff' },
    EUR: { flag: '🇪🇺', name: 'Euro', color: '#5856d6' },
    GBP: { flag: '🇬🇧', name: 'Libra Esterlina', color: '#ff9500' },
    JPY: { flag: '🇯🇵', name: 'Iene Japonês', color: '#ff2d55' },
    CAD: { flag: '🇨🇦', name: 'Dólar Canadense', color: '#ff3b30' },
    AUD: { flag: '🇦🇺', name: 'Dólar Australiano', color: '#ff9500' },
    CHF: { flag: '🇨🇭', name: 'Franco Suíço', color: '#af52de' },
    CNY: { flag: '🇨🇳', name: 'Yuan Chinês', color: '#ff3b30' },
    INR: { flag: '🇮🇳', name: 'Rúpia Indiana', color: '#ff9500' },
    MXN: { flag: '🇲🇽', name: 'Peso Mexicano', color: '#34c759' },
    ARS: { flag: '🇦🇷', name: 'Peso Argentino', color: '#5ac8fa' },
  };

  // Mapeamento de moedas para símbolos
  const currencySymbols: Record<string, string> = {
    BRL: 'R$',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'CA$',
    AUD: 'A$',
    CHF: 'Fr',
    CNY: '¥',
    INR: '₹',
    MXN: 'Mex$',
    ARS: '$',
  };

  const handleAccountClick = (account: BankAccount) => {
    if (onSelectAccount) {
      onSelectAccount(account);
    }
    if (onNavigateWithAccount) {
      onNavigateWithAccount('fiatAccountDetails', account);
    }
  };

  const formatBalance = (currency: string): string => {
    const symbol = currencySymbols[currency] || currency;
    const balance = getBalance(currency); // ✅ Busca o saldo real do Firestore
    
    // ✅ Formatação correta para BRL: pontos para milhares, vírgula para decimais
    let formattedValue: string;
    if (currency === 'BRL') {
      formattedValue = balance.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } else {
      formattedValue = balance.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    
    return `${symbol} ${formattedValue}`;
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <button 
          onClick={() => onNavigate('home')} 
          className="w-9 h-9 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)] mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl mb-1">Selecionar conta</h1>
        <p className="text-white/50 text-xs">
          Escolha a conta para transacionar
        </p>
      </header>

      {/* Accounts List */}
      <div className="flex-1 px-6 pb-24">
        {isLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-full bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-white/10"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-white/10 rounded mb-1.5 w-28"></div>
                    <div className="h-3 bg-white/10 rounded mb-1.5 w-20"></div>
                    <div className="h-5 bg-white/10 rounded w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {accounts.length > 0 ? (
              accounts.map((account: BankAccount, index: number) => {
                const config = currencyConfig[account.currency] || { 
                  flag: '🌍', 
                  name: account.currency, 
                  color: '#ffffff' 
                };
                
                return (
                  <button
                    key={`${account.currency}-${account.id || index}`}
                    onClick={() => handleAccountClick(account)}
                    className="w-full bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]"
                  >
                    <div className="flex items-center gap-3">
                      {/* Currency Icon */}
                      <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center overflow-hidden border border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] flex-shrink-0">
                        <img 
                          src={`https://flagcdn.com/w80/${account.country.toLowerCase()}.png`}
                          alt={account.currency}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Account Info */}
                      <div className="flex-1 text-left min-w-0">
                        <h3 className="text-sm font-semibold text-white mb-0.5 truncate">
                          {config.name}
                        </h3>
                        <p className="text-xs text-white/40 mb-1 font-mono">
                          {account.iban ? `•• ${account.iban.slice(-6)}` : `•• ${account.accountNumber.slice(-6)}`}
                        </p>
                        <p className="text-base font-bold text-white tabular-nums">
                          {formatBalance(account.currency)}
                        </p>
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-10">
                <div className="w-16 h-16 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center mx-auto mb-3 border border-white/10">
                  <Plus className="w-8 h-8 text-white/30" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  Nenhuma conta encontrada
                </h3>
                <p className="text-xs text-white/50 mb-4">
                  Adicione uma conta fiat para começar
                </p>
                <button
                  onClick={() => onNavigate('accountData')}
                  className="px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-full text-sm text-white font-semibold border border-white/20 hover:bg-white/20 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]"
                >
                  Adicionar Conta
                </button>
              </div>
            )}
          </div>
        )}

        {/* Add Account Button */}
        {!isLoading && accounts.length > 0 && (
          <button
            onClick={() => onNavigate('accountData')}
            className="w-full mt-4 bg-white rounded-xl p-3.5 hover:bg-white/90 transition-all active:scale-[0.98] shadow-[0_4px_20px_rgba(255,255,255,0.15)]"
          >
            <div className="flex items-center justify-center gap-2.5">
              <Plus className="w-5 h-5 text-black" />
              <span className="text-sm font-semibold text-black">
                Adicionar Nova Conta
              </span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}