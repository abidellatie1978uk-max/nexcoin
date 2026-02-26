import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { FiatBalance } from '../lib/fiatBalanceUtils';
import { safeOnSnapshot } from '../lib/firestoreListenerUtils';

/**
 * Hook para gerenciar saldos de moedas fiat em tempo real
 */
export function useFiatBalances() {
  const { user } = useAuth();
  const [balances, setBalances] = useState<FiatBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermissionError, setHasPermissionError] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      setBalances([]);
      setHasPermissionError(false);
      return;
    }

    console.log('🔄 Iniciando listener de saldos fiat para userId:', user.uid);

    const balancesRef = collection(db, 'users', user.uid, 'fiatBalances');
    const q = query(balancesRef);

    const unsubscribe = safeOnSnapshot(
      q,
      (snapshot) => {
        console.log('📡 Snapshot de saldos fiat recebido - Total:', snapshot.size);

        const balancesList: FiatBalance[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          balancesList.push({
            currency: data.currency || doc.id,
            balance: data.balance || 0,
            updatedAt: data.updatedAt?.toDate() || new Date(),
          });
        });

        setBalances(balancesList);
        setIsLoading(false);
        setHasPermissionError(false);

        console.log('💰 Saldos fiat carregados:', balancesList);
      },
      {
        maxRetries: 3,
        retryDelay: 1000,
        onError: (error) => {
          console.error('❌ Erro no listener de saldos fiat:', error);
          
          // Detectar erro de permissão
          if (error.code === 'permission-denied') {
            console.warn('⚠️ ERRO DE PERMISSÃO: Configure as regras do Firestore!');
            setHasPermissionError(true);
          }
          
          setIsLoading(false);
        }
      }
    );

    return () => {
      console.log('🛑 Cancelando listener de saldos fiat');
      unsubscribe();
    };
  }, [user?.uid]);

  /**
   * Obtém o saldo de uma moeda específica
   */
  const getBalance = (currency: string): number => {
    const balance = balances.find((b) => b.currency === currency);
    return balance?.balance || 0;
  };

  /**
   * Verifica se há saldo suficiente para uma operação
   */
  const hasEnoughBalance = (currency: string, requiredAmount: number): boolean => {
    const balance = getBalance(currency);
    return balance >= requiredAmount;
  };

  return {
    balances,
    isLoading,
    hasPermissionError,
    getBalance,
    hasEnoughBalance,
  };
}