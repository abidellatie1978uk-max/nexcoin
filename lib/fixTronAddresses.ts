import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { generateWalletAddress } from './walletAddressUtils';

/**
 * Corrige endereços TRON que foram gerados com todas as letras maiúsculas
 * Regenera o endereço no formato correto Base58 e atualiza no Firestore
 */
export async function fixTronAddress(userId: string): Promise<{
  success: boolean;
  fixedCount: number;
  errors: string[];
  oldAddress?: string;
  newAddress?: string;
}> {
  const errors: string[] = [];
  let fixedCount = 0;

  try {
    console.log(`🔧 Corrigindo endereço TRON para usuário: ${userId}`);

    // Buscar endereço TRON atual
    const addressRef = doc(db, 'users', userId, 'walletAddresses', 'Tron');
    const addressDoc = await getDoc(addressRef);

    if (!addressDoc.exists()) {
      console.log('ℹ️ Nenhum endereço TRON encontrado para este usuário');
      return {
        success: true,
        fixedCount: 0,
        errors: [],
      };
    }

    const oldData = addressDoc.data();
    const oldAddress = oldData.address;

    // Verificar se o endereço precisa ser corrigido
    // Endereços incorretos têm todas as letras maiúsculas (exceto o T inicial)
    const needsFix = oldAddress.substring(1).toUpperCase() === oldAddress.substring(1);

    if (!needsFix) {
      console.log('✅ Endereço TRON já está no formato correto');
      return {
        success: true,
        fixedCount: 0,
        errors: [],
        oldAddress,
        newAddress: oldAddress,
      };
    }

    console.log('🔄 Regenerando endereço TRON no formato correto...');

    // Gerar novo endereço no formato correto
    const newAddress = generateWalletAddress('Tron', userId);

    // Atualizar endereço no documento do usuário
    await setDoc(addressRef, {
      network: 'Tron',
      address: newAddress,
      userId,
      createdAt: oldData.createdAt || new Date(),
      updatedAt: new Date(),
    });

    console.log(`✅ Endereço TRON atualizado: ${oldAddress} → ${newAddress}`);
    fixedCount = 1;

    // Remover índice antigo (se existir)
    try {
      const oldIndexRef = doc(db, 'walletAddressIndex', oldAddress.toLowerCase());
      await deleteDoc(oldIndexRef);
      console.log('🗑️ Índice antigo removido');
    } catch (error) {
      console.warn('⚠️ Erro ao remover índice antigo:', error);
      errors.push('Erro ao remover índice antigo');
    }

    // Criar novo índice global
    const newIndexRef = doc(db, 'walletAddressIndex', newAddress.toLowerCase());
    await setDoc(newIndexRef, {
      address: newAddress,
      userId,
      network: 'Tron',
      updatedAt: new Date(),
    });

    console.log('✅ Novo índice global criado');
    
    // ✅ Aguardar um pouco para garantir que o Firestore processou
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      fixedCount,
      errors,
      oldAddress,
      newAddress,
    };

  } catch (error: any) {
    console.error('❌ Erro ao corrigir endereço TRON:', error);
    errors.push(error.message);
    return {
      success: false,
      fixedCount,
      errors,
    };
  }
}