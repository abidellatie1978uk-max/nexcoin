import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { getWalletAddress, regenerateWalletAddress, type WalletAddress } from '../lib/walletAddressUtils';

export function useWalletAddresses() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<WalletAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setAddresses([]);
      setIsLoading(false);
      return;
    }

    console.log('🔄 Iniciando listener de endereços de wallet...');

    const addressesRef = collection(db, 'users', user.uid, 'walletAddresses');

    const unsubscribe = onSnapshot(
      addressesRef,
      (snapshot) => {
        const addressesList: WalletAddress[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          addressesList.push({
            network: data.network,
            address: data.address,
            userId: data.userId,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          });
        });

        setAddresses(addressesList);
        setIsLoading(false);
        console.log('✅ Endereços carregados:', addressesList);
      },
      (error) => {
        console.error('❌ Erro ao carregar endereços:', error);
        setIsLoading(false);
      }
    );

    return () => {
      console.log('🛑 Cancelando listener de endereços');
      unsubscribe();
    };
  }, [user?.uid]);

  /**
   * Obtém o endereço para uma rede específica
   */
  const getAddressForNetwork = async (network: string): Promise<string> => {
    if (!user?.uid) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se já existe no estado
    const existing = addresses.find(a => a.network === network);
    if (existing) {
      return existing.address;
    }

    // Se não existe, buscar ou criar
    const address = await getWalletAddress(user.uid, network);
    return address || '';
  };

  /**
   * Regenera o endereço para uma rede específica
   */
  const regenerateAddress = async (network: string): Promise<string> => {
    if (!user?.uid) {
      throw new Error('Usuário não autenticado');
    }

    const newAddress = await regenerateWalletAddress(user.uid, network);
    console.log(`✅ Novo endereço gerado para ${network}:`, newAddress);
    return newAddress;
  };

  return {
    addresses,
    isLoading,
    getAddressForNetwork,
    regenerateAddress,
  };
}
