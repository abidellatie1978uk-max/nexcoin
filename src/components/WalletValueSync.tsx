import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCryptoPrices } from '../contexts/CryptoPriceContext';
import { syncWalletValues } from '../lib/portfolioUtils';

/**
 * Componente invisível que sincroniza automaticamente os valores
 * das wallets do usuário no Firestore sempre que os preços mudam
 */
export function WalletValueSync() {
  const { user } = useAuth();
  const { prices, isLoading } = useCryptoPrices();
  const lastSyncRef = useRef<string>('');
  const initialDelayRef = useRef(false);

  useEffect(() => {
    // Só sincronizar se o usuário estiver logado e os preços estiverem carregados
    if (!user?.uid || isLoading || Object.keys(prices).length === 0) {
      return;
    }

    // Delay inicial para evitar sincronização imediata após login
    if (!initialDelayRef.current) {
      initialDelayRef.current = true;
      const timer = setTimeout(() => {
        // Permitir sincronização após 2 segundos
        performSync();
      }, 2000);
      return () => clearTimeout(timer);
    }

    performSync();
  }, [user?.uid, prices, isLoading]);

  const performSync = () => {
    if (!user?.uid || Object.keys(prices).length === 0) return;

    // Criar uma chave única baseada nos preços para evitar sincronizações desnecessárias
    const pricesKey = JSON.stringify(
      Object.entries(prices)
        .map(([id, data]) => `${id}:${data.usd}`)
        .sort()
        .join(',')
    );

    // Só sincronizar se os preços realmente mudaram
    if (pricesKey === lastSyncRef.current) {
      return;
    }

    lastSyncRef.current = pricesKey;

    // Sincronizar os valores das wallets
    const sync = async () => {
      try {
        await syncWalletValues(user.uid, prices);
      } catch (error) {
        // Silenciosamente ignorar erros de sincronização para não interferir na UX
        console.error('❌ Erro ao sincronizar valores das wallets:', error);
      }
    };

    sync();
  };

  // Componente invisível
  return null;
}