import { collection, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Migra todos os endereços de carteira existentes para o índice global
 * Esta função deve ser executada uma única vez para popular o índice
 * ✅ OTIMIZADO: Usa writeBatch para operações em lote (mais rápido)
 */
export async function migrateWalletAddressesToIndex(): Promise<{
  success: boolean;
  migratedCount: number;
  errors: string[];
}> {
  console.log('🔄 Iniciando migração de endereços para índice global...');
  
  let migratedCount = 0;
  const errors: string[] = [];
  
  try {
    // Buscar todos os usuários
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    console.log(`📊 Encontrados ${usersSnapshot.size} usuários para migrar`);
    
    // ✅ Usar batch para operações mais eficientes
    let batch = writeBatch(db);
    let batchCount = 0;
    const BATCH_SIZE = 500; // Firestore limita a 500 operações por batch
    
    // Para cada usuário, buscar seus endereços
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      
      try {
        const addressesRef = collection(db, 'users', userId, 'walletAddresses');
        const addressesSnapshot = await getDocs(addressesRef);
        
        // Para cada endereço, criar entrada no índice global
        for (const addressDoc of addressesSnapshot.docs) {
          try {
            const walletData = addressDoc.data();
            const address = walletData.address;
            const network = walletData.network || addressDoc.id;
            
            if (!address) {
              console.warn(`⚠️ Endereço vazio para usuário ${userId}, rede ${network}`);
              continue;
            }
            
            // Criar entrada no índice global usando batch
            const indexRef = doc(db, 'walletAddressIndex', address.toLowerCase());
            batch.set(indexRef, {
              address,
              userId,
              network,
              updatedAt: new Date(),
            });
            
            batchCount++;
            migratedCount++;
            
            // ✅ Commit do batch a cada 500 operações
            if (batchCount >= BATCH_SIZE) {
              await batch.commit();
              console.log(`📦 Batch de ${batchCount} operações commitado`);
              batch = writeBatch(db);
              batchCount = 0;
            }
            
            console.log(`✅ Preparado para migração: ${address} → ${userId} (${network})`);
          } catch (addressError: any) {
            const errorMsg = `Erro ao migrar endereço do usuário ${userId}: ${addressError.message}`;
            console.error(`❌ ${errorMsg}`);
            errors.push(errorMsg);
          }
        }
      } catch (userError: any) {
        const errorMsg = `Erro ao processar usuário ${userId}: ${userError.message}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
    
    // ✅ Commit do batch final (se houver operações pendentes)
    if (batchCount > 0) {
      await batch.commit();
      console.log(`📦 Batch final de ${batchCount} operações commitado`);
    }
    
    console.log(`✅ Migração concluída! ${migratedCount} endereços migrados`);
    
    if (errors.length > 0) {
      console.warn(`⚠️ ${errors.length} erros durante a migração:`, errors);
    }
    
    return {
      success: true,
      migratedCount,
      errors,
    };
  } catch (error: any) {
    console.error('❌ Erro fatal na migração:', error);
    return {
      success: false,
      migratedCount,
      errors: [...errors, error.message],
    };
  }
}