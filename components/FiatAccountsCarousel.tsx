import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useFiatBalances } from '../hooks/useFiatBalances';
import { useLanguage } from '../contexts/LanguageContext';
import type { BankAccount } from './AccountData';
import { FormattedAmount } from './FormattedAmount';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

interface FiatAccountsCarouselProps {
  onAccountClick?: (account: BankAccount) => void;
  onAddAccountClick?: () => void;
}

export function FiatAccountsCarousel({ onAccountClick, onAddAccountClick }: FiatAccountsCarouselProps) {
  const { user } = useAuth();
  const { getBalance } = useFiatBalances(); // ✅ Hook para buscar saldos do Firestore
  const { t } = useLanguage(); // ✅ Hook de traduções
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // ✅ LISTENER DE CONTAS BANCÁRIAS EM TEMPO REAL
  useEffect(() => {
    if (!user?.uid) return;

    console.log('🔄 Iniciando listener de contas bancárias para userId:', user.uid);

    let retryCount = 0;
    const maxRetries = 3;
    let unsubscribe: (() => void) | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;
    let isSettingUp = false; // Flag para prevenir múltiplas configurações simultâneas

    const setupListener = () => {
      // Prevenir múltiplas configurações simultâneas
      if (isSettingUp) {
        console.log('⚠️ Configuração de listener já em andamento, ignorando...');
        return;
      }

      isSettingUp = true;

      // Limpar listener anterior se existir
      if (unsubscribe) {
        console.log('🔌 Limpando listener anterior antes de criar novo...');
        unsubscribe();
        unsubscribe = null;
      }

      const accountsRef = collection(db, 'bankAccounts');
      const q = query(accountsRef, where('userId', '==', user.uid));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          console.log('📡 Contas bancárias recebidas:', snapshot.size);
          retryCount = 0; // Reset retry count on success
          isSettingUp = false;

          const rawAccounts = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          })) as BankAccount[];

          // 🧹 DEDUP: Manter apenas uma conta por moeda
          const dedupedMap = new Map<string, BankAccount>();
          rawAccounts.forEach(acc => {
            const existing = dedupedMap.get(acc.currency);
            const isDeterministic = acc.id === `${user.uid}_${acc.currency}` || acc.id === `${user.uid}_BRL`;
            if (!existing || isDeterministic) {
              dedupedMap.set(acc.currency, acc);
            }
          });
          const accountsData = Array.from(dedupedMap.values());

          console.log('💳 Total de contas (deduplicadas):', accountsData.length);
          console.log('🌍 Países das contas:', accountsData.map(acc => `${acc.country} (${acc.currency})`).join(', '));

          setAccounts(accountsData);
          setHasError(false);
          setIsLoading(false);
        },
        (error) => {
          console.error('❌ Erro no listener de contas bancárias:', error);
          isSettingUp = false;

          if (error.code === 'permission-denied') {
            console.log('⚠️ Erro de permissão, tentando getDocs...');
            loadAccountsWithGetDocs();
          } else if (error.code === 'unavailable' && retryCount < maxRetries) {
            // Retry on network errors
            retryCount++;
            console.log(`⚠️ Tentando reconectar listener de contas... (tentativa ${retryCount}/${maxRetries})`);
            retryTimeout = setTimeout(() => {
              if (unsubscribe) unsubscribe();
              setupListener();
            }, 1000 * retryCount); // Exponential backoff
          } else {
            setHasError(true);
            setIsLoading(false);
          }
        }
      );
    };

    setupListener();

    return () => {
      console.log('🔌 Desconectando listener de contas bancárias');
      if (unsubscribe) unsubscribe();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [user]);

  // Fallback: Carregar contas com getDocs
  const loadAccountsWithGetDocs = async () => {
    if (!user?.uid) return;

    try {
      const accountsRef = collection(db, 'bankAccounts');
      const q = query(accountsRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      const accountsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as BankAccount[];

      setAccounts(accountsData);
      setHasError(false);
    } catch (error) {
      console.error('❌ Erro ao carregar contas com getDocs:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Configurações do carrossel
  const settings = {
    dots: false,
    infinite: false,
    speed: 300,
    slidesToShow: 1.2,
    slidesToScroll: 1,
    arrows: false,
    swipeToSlide: true,
  };

  // Mapeamento de países para badges (Pix, número de conta, etc.)
  const getPaymentBadge = (account: BankAccount): { label: string; icon?: string } => {
    switch (account.country) {
      case 'BR':
        return { label: 'Pix', icon: '◆' };
      case 'US':
        return { label: `•• ${account.accountNumber.slice(-4)}` };
      case 'EU':
        return { label: `•• ${account.iban?.slice(-4) || account.accountNumber.slice(-4)}` };
      default:
        return { label: `•• ${account.accountNumber.slice(-4)}` };
    }
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
    KRW: '₩',
    ZAR: 'R',
    ARS: '$',
    CLP: '$',
  };

  if (isLoading) {
    return (
      <div className="px-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">{t.myAccounts}</h2>
        <div className="animate-pulse">
          <div className="bg-zinc-900/50 rounded-3xl h-48 w-[85%]"></div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="px-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">{t.myAccounts}</h2>
        <div className="text-red-500">
          Ocorreu um erro ao carregar suas contas. Tente novamente mais tarde.
        </div>
      </div>
    );
  }

  if (!user || accounts.length === 0) {
    return null; // Não mostrar nada se não houver contas
  }

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4 px-6">{t.myAccounts}</h2>
      <div className="px-3">
        <Slider {...settings}>
          {accounts.map((account) => {
            const badge = getPaymentBadge(account);

            return (
              <div key={account.id} className="px-3">
                <button
                  onClick={() => onAccountClick?.(account)}
                  className="w-full bg-gradient-to-br from-zinc-800/90 via-zinc-900/95 to-black backdrop-blur-xl rounded-3xl p-5 border border-zinc-700/60 hover:border-zinc-600 shadow-lg shadow-black/40 transition-all active:scale-[0.98] text-left relative overflow-hidden group"
                >
                  {/* Efeito de brilho glassmorphism */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent pointer-events-none"></div>

                  {/* Header com bandeira e moeda */}
                  <div className="flex items-center justify-between mb-10 relative z-10">
                    <div className="flex items-center gap-3">
                      {/* Bandeira */}
                      <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-zinc-800 border border-zinc-700">
                        <img
                          src={`https://flagcdn.com/w80/${account.country.toLowerCase()}.png`}
                          alt={account.currency}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Código da moeda */}
                      <div className="text-xl font-semibold text-white">
                        {account.currency}
                      </div>
                    </div>

                    {/* Badge (Pix ou número da conta) */}
                    <div className="px-4 py-2 rounded-full bg-zinc-800/80 backdrop-blur-sm border border-zinc-700/50 flex items-center gap-2">
                      {badge.icon && (
                        <span className="text-cyan-400 text-sm">{badge.icon}</span>
                      )}
                      <span className="text-xs font-medium text-gray-300">
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  {/* Número da conta (se houver IBAN ou número) */}
                  {(account.iban || account.accountNumber) && (
                    <div className="text-xs text-gray-500 mb-3 font-mono tracking-wider relative z-10">
                      {account.iban ? (
                        <>🏦 ·· {account.iban.slice(-6)}</>
                      ) : (
                        <>🏦 ·· {account.accountNumber.slice(-6)}</>
                      )}
                    </div>
                  )}

                  {/* Saldo */}
                  <div className="relative z-10 tabular-nums text-white">
                    <FormattedAmount
                      value={getBalance(account.currency)}
                      symbol={currencySymbols[account.currency]}
                      className="text-2xl font-light"
                    />
                  </div>
                </button>
              </div>
            );
          })}

          {/* Card de Nova Conta */}
          <div className="px-3">
            <div
              onClick={onAddAccountClick}
              className="w-full bg-transparent backdrop-blur-xl rounded-3xl p-5 border-2 border-dashed border-zinc-700/60 hover:border-zinc-600 hover:bg-white/5 shadow-lg shadow-black/40 transition-all active:scale-[0.98] text-left relative overflow-hidden group h-full min-h-[180px] flex flex-col cursor-pointer"
            >
              {/* Header com botão + e texto */}
              <div className="flex items-center gap-3 mb-auto relative z-10">
                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                  <Plus className="text-white text-2xl font-light" />
                </div>
                <span className="text-white/70 font-semibold">Nova Conta</span>
              </div>

              {/* Texto centralizado */}
              <div className="flex-1 flex items-center justify-center relative z-10">
                <p className="text-white/50 text-sm text-center">Adicione uma conta<br />de outro país</p>
              </div>
            </div>
          </div>
        </Slider>
      </div>
    </div>
  );
}