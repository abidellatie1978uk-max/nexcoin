import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export interface PixKey {
  id: string;
  userId: string;
  accountId: string;
  accountNumber: string;
  currency: string;
  country: string;
  keyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  keyValue: string;
  createdAt: Date;
}

export function usePixKeys() {
  const { user } = useAuth();
  const [pixKeys, setPixKeys] = useState<PixKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setPixKeys([]);
      setIsLoading(false);
      return;
    }

    console.log('🔄 Iniciando listener de chaves PIX para userId:', user.uid);

    const pixKeysRef = collection(db, 'pixKeys');
    const q = query(
      pixKeysRef,
      where('userId', '==', user.uid)
      // Removido orderBy para evitar necessidade de índice composto
      // Vamos ordenar no cliente
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('📡 Snapshot de chaves PIX recebido - Total:', snapshot.size);

        const keys: PixKey[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          keys.push({
            id: doc.id,
            userId: data.userId,
            accountId: data.accountId,
            accountNumber: data.accountNumber,
            currency: data.currency,
            country: data.country,
            keyType: data.keyType,
            keyValue: data.keyValue,
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        });

        // Ordenar no cliente por data de criação (mais recente primeiro)
        keys.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        setPixKeys(keys);
        setIsLoading(false);
      },
      (error) => {
        console.error('❌ Erro no listener de chaves PIX:', error);
        setIsLoading(false);
      }
    );

    return () => {
      console.log('🛑 Cancelando listener de chaves PIX');
      unsubscribe();
    };
  }, [user?.uid]);

  return {
    pixKeys,
    isLoading,
  };
}