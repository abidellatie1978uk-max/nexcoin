import { collection, doc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Migra os endereços de wallet do usuário atual para o índice global
 * ✅ Cada usuário migra apenas seus próprios endereços (sem problemas de permissão)
 */
export async function migrateOwnWalletAddresses(userId: string): Promise<{
  success: boolean;
  migratedCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let migratedCount = 0;

  try {
    console.log(`🔄 Iniciando migração de endereços para o usuário: ${userId}`);

    // Buscar todos os endereços deste usuário
    const addressesRef = collection(db, 'users', userId, 'walletAddresses');
    const addressesSnapshot = await getDocs(addressesRef);

    if (addressesSnapshot.empty) {
      console.log('ℹ️ Nenhum endereço encontrado para este usuário');
      return { success: true, migratedCount: 0, errors: [] };
    }

    console.log(`📦 Encontrados ${addressesSnapshot.size} endereços para migrar`);

    // Usar batch para otimizar escritas
    let batch = writeBatch(db);
    let batchCount = 0;
    const BATCH_LIMIT = 500;

    for (const addressDoc of addressesSnapshot.docs) {
      try {
        const walletData = addressDoc.data();
        const address = walletData.address;
        const network = addressDoc.id; // Network é o ID do documento

        if (!address) {
          console.warn(`⚠️ Endereço vazio no documento ${network}`);
          continue;
        }

        // Criar índice global
        const indexRef = doc(db, 'walletAddressIndex', address.toLowerCase());
        
        // ✅ SEMPRE sobrescrever para garantir dados atualizados
        batch.set(indexRef, {
          address: address,
          userId: userId,
          network: network,
          updatedAt: new Date(),
        }); // Removido merge: true para sempre atualizar

        batchCount++;
        migratedCount++;

        // Executar batch se atingir o limite
        if (batchCount >= BATCH_LIMIT) {
          await batch.commit();
          console.log(`✅ Batch de ${batchCount} endereços commitado`);
          batch = writeBatch(db); // ✅ Criar novo batch
          batchCount = 0;
        }

      } catch (error: any) {
        console.error(`❌ Erro ao migrar endereço:`, error);
        errors.push(error.message);
      }
    }

    // Executar batch restante
    if (batchCount > 0) {
      await batch.commit();
      console.log(`✅ Batch final de ${batchCount} endereços commitado`);
    }

    console.log(`✅ Migração concluída! ${migratedCount} endereços migrados`);

    return {
      success: true,
      migratedCount,
      errors,
    };

  } catch (error: any) {
    console.error('❌ Erro fatal na migração:', error);
    errors.push(error.message);
    return {
      success: false,
      migratedCount,
      errors,
    };
  }
}