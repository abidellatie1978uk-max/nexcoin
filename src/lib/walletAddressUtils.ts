import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export interface WalletAddress {
  network: string;
  address: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Gera um endereço de wallet único baseado na rede
 */
export function generateWalletAddress(network: string, userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  
  // Helper para gerar caracteres Base58 (usado por Bitcoin e TRON)
  const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const generateBase58 = (length: number): string => {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += base58Chars[Math.floor(Math.random() * base58Chars.length)];
    }
    return result;
  };
  
  switch (network) {
    case 'Ethereum': // ERC20
    case 'BSC': // BNB Smart Chain
    case 'Polygon':
      // Formato Ethereum: 0x + 40 caracteres hexadecimais
      return `0x${userId.substring(0, 8)}${timestamp.toString(16)}${random}`.substring(0, 42);
    
    case 'Bitcoin':
      // Formato Bitcoin: começando com 1, 3 ou bc1
      return `bc1q${userId.substring(0, 6)}${random}${timestamp.toString(36)}`.substring(0, 42);
    
    case 'Tron': // TRC20
      // Formato Tron: T + 33 caracteres Base58 (mix de maiúsculas e minúsculas)
      const tronBase58 = generateBase58(33);
      return `T${tronBase58}`;
    
    case 'Solana':
      // Formato Solana: base58, ~44 caracteres
      return `${userId.substring(0, 8)}${random}${timestamp.toString(36)}Solana`.substring(0, 44);
    
    case 'Ripple':
      // Formato XRP: r + caracteres alfanuméricos
      return `r${userId.substring(0, 7)}${random}${timestamp.toString(36)}`.substring(0, 34);
    
    default:
      // Formato genérico
      return `${network.substring(0, 3).toUpperCase()}${userId.substring(0, 8)}${random}${timestamp.toString(36)}`;
  }
}

/**
 * Salva ou atualiza o endereço da wallet no Firestore
 */
export async function saveWalletAddress(
  userId: string,
  network: string,
  address?: string
): Promise<WalletAddress> {
  const walletAddress = address || generateWalletAddress(network, userId);
  
  console.log(`💾 Salvando endereço ${network}: ${walletAddress}`);
  
  const addressRef = doc(db, 'users', userId, 'walletAddresses', network);
  
  const walletData: WalletAddress = {
    network,
    address: walletAddress,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  await setDoc(addressRef, walletData);
  console.log(`✅ Endereço salvo no documento do usuário`);
  
  // ✅ Criar índice global para busca rápida
  const indexRef = doc(db, 'walletAddressIndex', walletAddress.toLowerCase());
  await setDoc(indexRef, {
    address: walletAddress,
    userId,
    network,
    updatedAt: new Date(),
  });
  
  console.log(`✅ Endereço indexado globalmente: ${walletAddress}`);
  
  // ✅ Aguardar um pouco para garantir que o Firestore processou
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return walletData;
}

/**
 * Busca o endereço da wallet para uma rede específica
 */
export async function getWalletAddress(userId: string, network: string): Promise<string | null> {
  try {
    const addressRef = doc(db, 'users', userId, 'walletAddresses', network);
    const addressDoc = await getDoc(addressRef);
    
    if (addressDoc.exists()) {
      const data = addressDoc.data() as WalletAddress;
      return data.address;
    }
    
    // Se não existe, criar um novo
    const newAddress = await saveWalletAddress(userId, network);
    return newAddress.address;
  } catch (error) {
    console.error('❌ Erro ao buscar endereço:', error);
    return null;
  }
}

/**
 * Busca todos os endereços do usuário
 */
export async function getAllWalletAddresses(userId: string): Promise<WalletAddress[]> {
  try {
    const addressesRef = collection(db, 'users', userId, 'walletAddresses');
    const snapshot = await getDocs(addressesRef);
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    } as WalletAddress));
  } catch (error) {
    console.error('❌ Erro ao buscar endereços:', error);
    return [];
  }
}

/**
 * Encontra o userId pelo endereço de wallet
 * ⚠️ IMPORTANTE: O índice global deve estar populado para funcionar
 * Execute a migração manualmente se necessário
 */
export async function findUserByWalletAddress(address: string): Promise<string | null> {
  try {
    console.log('🔍 Buscando userId para endereço:', address);
    
    // ✅ Buscar no índice global
    const indexRef = doc(db, 'walletAddressIndex', address.toLowerCase());
    const indexDoc = await getDoc(indexRef);
    
    if (indexDoc.exists()) {
      const data = indexDoc.data();
      console.log('✅ Endereço encontrado no índice global:', data.userId);
      return data.userId;
    }
    
    // ⚠️ Endereço não encontrado no índice
    console.warn('⚠️ Endereço não encontrado no índice global:', address);
    console.warn('💡 Execute a migração de endereços em: Perfil → Configurações → Teste de Endereços');
    return null;
  } catch (error) {
    console.error('❌ Erro ao buscar usuário por endereço:', error);
    return null;
  }
}

/**
 * Verifica se o índice global de endereços está populado
 * Retorna o número de endereços indexados
 */
export async function checkIndexHealth(): Promise<number> {
  try {
    const indexRef = collection(db, 'walletAddressIndex');
    const snapshot = await getDocs(indexRef);
    return snapshot.size;
  } catch (error) {
    console.error('❌ Erro ao verificar índice:', error);
    return 0;
  }
}

/**
 * Atualiza o endereço da wallet (gera um novo)
 */
export async function regenerateWalletAddress(userId: string, network: string): Promise<string> {
  const newAddress = generateWalletAddress(network, userId);
  await saveWalletAddress(userId, network, newAddress);
  return newAddress;
}