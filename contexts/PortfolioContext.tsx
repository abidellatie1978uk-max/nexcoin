import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useCryptoPrices } from './CryptoPriceContext';
import { useAuth } from './AuthContext';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { addOrUpdateHolding, removeHolding, updateCryptoBalance, type Holding } from '../lib/portfolioUtils';

interface PortfolioData {
  totalBalanceUSDT: number;
  change24h: number;
  changePercent24h: number;
  holdings: Holding[];
  priceHistory: number[];
}

interface PortfolioContextType {
  portfolio: PortfolioData;
  isLoading: boolean;
  refreshHoldings: () => Promise<void>;
  updateHoldings: (holdings: Holding[]) => Promise<void>;
  addOrUpdateCrypto: (symbol: string, coinId: string, amount: number, name?: string) => Promise<void>;
  removeCrypto: (symbol: string) => Promise<void>;
  updateBalance: (symbol: string, coinId: string, deltaAmount: number, name?: string) => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType>({
  portfolio: {
    totalBalanceUSDT: 0,
    change24h: 0,
    changePercent24h: 0,
    holdings: [],
    priceHistory: [],
  },
  isLoading: true,
  refreshHoldings: async () => {},
  updateHoldings: async () => {},
  addOrUpdateCrypto: async () => {},
  removeCrypto: async () => {},
  updateBalance: async () => {},
});

export function usePortfolio() {
  return useContext(PortfolioContext);
}

interface PortfolioProviderProps {
  children: ReactNode;
}

export function PortfolioProvider({ children }: PortfolioProviderProps) {
  const { prices, isLoading: pricesLoading } = useCryptoPrices();
  const { user, auth } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioData>({
    totalBalanceUSDT: 0,
    change24h: 0,
    changePercent24h: 0,
    holdings: [],
    priceHistory: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermissionError, setHasPermissionError] = useState(false);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);

  // ✅ LISTENER EM TEMPO REAL - Buscar holdings da subcoleção portfolio
  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    console.log('🔄 Iniciando listener de portfolio para userId:', user.uid);

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

      // ✅ NOVA ESTRUTURA: Listener na coleção /users/{userId}/portfolio
      const portfolioRef = collection(db, 'users', user.uid, 'portfolio');
      const q = query(portfolioRef);
      
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          console.log('📡 Snapshot recebido - Total de ativos no portfolio:', snapshot.size);
          retryCount = 0; // Reset retry count on success
          isSettingUp = false;
          
          const holdings: Holding[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            console.log('💼 Ativo encontrado:', { id: doc.id, data });
            holdings.push({
              symbol: data.symbol,
              coinId: data.coinId,
              amount: data.amount,
              name: data.name,
              valueUsd: data.valueUsd || 0, // ✅ Incluir valor em USD sincronizado
              updatedAt: data.updatedAt?.toDate(),
            });
          });
          
          console.log('✅ Total de holdings carregados:', holdings.length);
          setPortfolio(prev => ({
            ...prev,
            holdings,
          }));
          setIsLoading(false);
          setHasPermissionError(false);
        },
        (error) => {
          console.error('❌ Erro no listener da coleção portfolio:', error);
          isSettingUp = false;
          
          if (error.code === 'permission-denied') {
            console.error('❌ Permissão negada - verificar regras do Firestore');
            setHasPermissionError(true);
            setIsLoading(false);
          } else if (error.code === 'unavailable' && retryCount < maxRetries) {
            // Retry on network errors
            retryCount++;
            console.log(`⚠️ Tentando reconectar... (tentativa ${retryCount}/${maxRetries})`);
            if (retryTimeout) clearTimeout(retryTimeout);
            retryTimeout = setTimeout(() => {
              if (unsubscribe) unsubscribe();
              setupListener();
            }, 1000 * retryCount); // Exponential backoff
          } else {
            setIsLoading(false);
          }
        }
      );
    };

    setupListener();

    // Cleanup: cancelar listener quando componente desmontar ou user mudar
    return () => {
      console.log('🛑 Cancelando listener da coleção portfolio');
      if (unsubscribe) unsubscribe();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [user?.uid]);

  useEffect(() => {
    if (pricesLoading || !prices || Object.keys(prices).length === 0) {
      return;
    }

    // Calcular saldo total atual
    let totalBalance = 0;
    portfolio.holdings.forEach(holding => {
      const price = prices[holding.coinId]?.usd || 0;
      totalBalance += holding.amount * price;
    });

    // Calcular saldo de 24h atrás
    let totalBalance24hAgo = 0;
    portfolio.holdings.forEach(holding => {
      const currentPrice = prices[holding.coinId]?.usd || 0;
      const change24h = prices[holding.coinId]?.usd_24h_change || 0;
      // Preço 24h atrás = preço atual / (1 + (mudança% / 100))
      const price24hAgo = currentPrice / (1 + (change24h / 100));
      totalBalance24hAgo += holding.amount * price24hAgo;
    });

    const change24h = totalBalance - totalBalance24hAgo;
    const changePercent24h = totalBalance24hAgo !== 0 
      ? ((totalBalance - totalBalance24hAgo) / totalBalance24hAgo) * 100 
      : 0;

    // Adicionar ao histórico de preços para o gráfico
    setPriceHistory(prev => {
      const newHistory = [...prev, totalBalance];
      // Manter apenas os últimos 50 pontos
      return newHistory.slice(-50);
    });

    setPortfolio({
      totalBalanceUSDT: totalBalance,
      change24h,
      changePercent24h,
      holdings: portfolio.holdings,
      priceHistory: priceHistory,
    });

    setIsLoading(false);
  }, [prices, pricesLoading, portfolio.holdings]);

  // Atualizar histórico de preços
  useEffect(() => {
    setPortfolio(prev => ({
      ...prev,
      priceHistory,
    }));
  }, [priceHistory]);

  const refreshHoldings = async () => {
    // Não precisa fazer nada, o listener já atualiza automaticamente
    console.log('🔄 refreshHoldings: listener automático está ativo');
  };

  const updateHoldings = async (holdings: Holding[]) => {
    // Deprecated - não usado mais com a nova estrutura de coleção
    console.warn('⚠️ updateHoldings está deprecated com a nova estrutura de coleção');
  };

  const addOrUpdateCrypto = async (symbol: string, coinId: string, amount: number, name?: string) => {
    if (!user) return;
    console.log('➕ Adicionando/atualizando crypto:', { symbol, coinId, amount, name });
    
    // Calcular valueUsd com base no preço atual
    const currentPrice = prices[coinId]?.usd || 0;
    const valueUsd = amount * currentPrice;
    
    await addOrUpdateHolding(user.uid, symbol, coinId, amount, name, valueUsd);
    // Listener vai atualizar automaticamente
    console.log('✅ Crypto adicionado, aguardando atualização do listener');
  };

  const removeCrypto = async (symbol: string) => {
    if (!user) return;
    await removeHolding(user.uid, symbol);
    // Listener vai atualizar automaticamente
  };

  const updateBalance = async (symbol: string, coinId: string, deltaAmount: number, name?: string) => {
    if (!user) return;
    
    // Calcular valueUsd com base no preço atual
    const currentPrice = prices[coinId]?.usd || 0;
    
    await updateCryptoBalance(user.uid, symbol, coinId, deltaAmount, name, currentPrice);
    // Listener vai atualizar automaticamente
  };

  return (
    <PortfolioContext.Provider value={{ portfolio, isLoading, refreshHoldings, updateHoldings, addOrUpdateCrypto, removeCrypto, updateBalance }}>
      {children}
    </PortfolioContext.Provider>
  );
}