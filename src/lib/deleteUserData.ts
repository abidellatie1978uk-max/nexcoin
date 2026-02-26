import { doc, collection, getDocs, deleteDoc, query, where, writeBatch } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db, auth } from './firebase';

/**
 * Deleta TODOS os dados de um usuário do Firestore e Firebase Auth
 * ⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!
 */
export async function deleteUserAccount(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🗑️ ============ INICIANDO EXCLUSÃO DE CONTA ============');
    console.log('🗑️ User ID:', userId);

    // 1️⃣ Deletar SUBCOLEÇÕES do usuário
    console.log('🗑️ [1/6] Deletando subcoleções do usuário...');
    
    const subcollections = [
      'portfolio', // ✅ Ativos e posições do usuário
      'assets', // Depreciado, mantido para compatibilidade
      'transactions', 
      'conversions',
      'fiatBalances',
      'fiatTransactions',
      'pixKeys', // Chaves PIX na subcoleção do usuário
      'wallets', // Depreciado, mantido para compatibilidade
      'walletAddresses',
      'receiveAddresses',
      'auditLogs',
      'preferences'
    ];

    for (const subcollectionName of subcollections) {
      try {
        const subcollectionRef = collection(db, 'users', userId, subcollectionName);
        const snapshot = await getDocs(subcollectionRef);
        
        console.log(`🗑️   Deletando ${snapshot.size} documentos de ${subcollectionName}...`);
        
        if (snapshot.size > 0) {
          // Deletar em lotes (batch)
          const batches: any[] = [];
          let currentBatch = writeBatch(db);
          let operationCount = 0;
          const BATCH_LIMIT = 500; // Limite do Firestore

          snapshot.docs.forEach((docSnapshot) => {
            currentBatch.delete(docSnapshot.ref);
            operationCount++;

            // Se atingiu o limite, criar novo batch
            if (operationCount === BATCH_LIMIT) {
              batches.push(currentBatch);
              currentBatch = writeBatch(db);
              operationCount = 0;
            }
          });

          // Adicionar último batch se tiver operações
          if (operationCount > 0) {
            batches.push(currentBatch);
          }

          // Executar todos os batches
          for (const batch of batches) {
            await batch.commit();
          }

          console.log(`✅   ${snapshot.size} documentos deletados de ${subcollectionName}`);
        } else {
          console.log(`✅   Nenhum documento encontrado em ${subcollectionName}`);
        }
      } catch (error: any) {
        console.log(`⚠️   Erro ao deletar ${subcollectionName} (continuando):`, error.message);
      }
    }

    // 2️⃣ Deletar DOCUMENTO PRINCIPAL do usuário
    console.log('🗑️ [2/6] Deletando documento principal do usuário...');
    try {
      const userDocRef = doc(db, 'users', userId);
      await deleteDoc(userDocRef);
      console.log('✅   Documento principal deletado');
    } catch (error: any) {
      // Documento pode não existir (usuário criado via Google sem dados no Firestore)
      console.log('⚠️   Documento principal não encontrado ou já foi deletado (continuando)');
    }

    // 3️⃣ Deletar CONTAS BANCÁRIAS vinculadas ao usuário
    console.log('🗑️ [3/6] Deletando contas bancárias...');
    try {
      const bankAccountsRef = collection(db, 'bankAccounts');
      const bankAccountsQuery = query(bankAccountsRef, where('userId', '==', userId));
      const bankAccountsSnapshot = await getDocs(bankAccountsQuery);
      
      console.log(`🗑️   Deletando ${bankAccountsSnapshot.size} contas bancárias...`);
      
      if (bankAccountsSnapshot.size > 0) {
        const bankBatch = writeBatch(db);
        bankAccountsSnapshot.docs.forEach((docSnapshot) => {
          bankBatch.delete(docSnapshot.ref);
        });
        await bankBatch.commit();
        console.log(`✅   ${bankAccountsSnapshot.size} contas bancárias deletadas`);
      } else {
        console.log('✅   Nenhuma conta bancária encontrada');
      }
    } catch (error: any) {
      console.log('⚠️   Erro ao deletar contas bancárias (continuando):', error.message);
    }

    // 4️⃣ Deletar CHAVES PIX vinculadas ao usuário
    console.log('🗑️ [4/6] Deletando chaves PIX...');
    try {
      const pixKeysRef = collection(db, 'pixKeys');
      const pixKeysQuery = query(pixKeysRef, where('userId', '==', userId));
      const pixKeysSnapshot = await getDocs(pixKeysQuery);
      
      console.log(`🗑️   Deletando ${pixKeysSnapshot.size} chaves PIX...`);
      
      if (pixKeysSnapshot.size > 0) {
        const pixBatch = writeBatch(db);
        pixKeysSnapshot.docs.forEach((docSnapshot) => {
          pixBatch.delete(docSnapshot.ref);
        });
        await pixBatch.commit();
        console.log(`✅   ${pixKeysSnapshot.size} chaves PIX deletadas`);
      } else {
        console.log('✅   Nenhuma chave PIX encontrada');
      }
    } catch (error: any) {
      console.log('⚠️   Erro ao deletar chaves PIX (continuando):', error.message);
    }

    // 5️⃣ Deletar ÍNDICE DE ENDEREÇOS DE CARTEIRA vinculados ao usuário
    console.log('🗑️ [5/6] Deletando índice de endereços de carteira...');
    try {
      const walletAddressIndexRef = collection(db, 'walletAddressIndex');
      const walletAddressIndexQuery = query(walletAddressIndexRef, where('userId', '==', userId));
      const walletAddressIndexSnapshot = await getDocs(walletAddressIndexQuery);
      
      if (walletAddressIndexSnapshot.size > 0) {
        console.log(`🗑️   Deletando ${walletAddressIndexSnapshot.size} endereços do índice...`);
        
        const walletAddressBatch = writeBatch(db);
        walletAddressIndexSnapshot.docs.forEach((docSnapshot) => {
          walletAddressBatch.delete(docSnapshot.ref);
        });
        await walletAddressBatch.commit();
        
        console.log(`✅   ${walletAddressIndexSnapshot.size} endereços deletados do índice`);
      } else {
        console.log('✅   Nenhum endereço no índice encontrado');
      }
    } catch (error: any) {
      console.log('⚠️   Erro ao deletar índice de endereços (continuando):', error.message);
    }

    // 6️⃣ Deletar USUÁRIO do Firebase Auth
    console.log('🗑️ [6/6] Deletando usuário do Firebase Auth...');
    
    if (!auth.currentUser) {
      throw new Error('Usuário não está autenticado');
    }

    // Verificar se é o mesmo usuário
    if (auth.currentUser.uid !== userId) {
      throw new Error('Erro de segurança: UID não corresponde ao usuário autenticado');
    }

    // Deletar usuário do Auth
    await deleteUser(auth.currentUser);
    
    console.log('✅   Usuário deletado do Firebase Auth');
    console.log('🗑️ ============ CONTA EXCLUÍDA COM SUCESSO ============');

    return {
      success: true,
    };

  } catch (error: any) {
    console.error('❌ ============ ERRO NA EXCLUSÃO DE CONTA ============');
    console.error('❌ Erro:', error);
    console.error('❌ Mensagem:', error.message);
    console.error('❌ ================================================');

    // Mensagens de erro mais amigáveis
    let errorMessage = 'Erro ao excluir conta. Tente novamente.';
    
    if (error.code === 'auth/requires-recent-login') {
      errorMessage = 'Por segurança, faça login novamente antes de excluir sua conta.';
    } else if (error.code === 'permission-denied') {
      errorMessage = 'Você não tem permissão para excluir esta conta.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Conta quantos dados o usuário tem no sistema
 */
export async function countUserData(userId: string): Promise<{
  assets: number;
  transactions: number;
  conversions: number;
  fiatBalances: number;
  bankAccounts: number;
  pixKeys: number;
  total: number;
}> {
  try {
    const counts = {
      assets: 0,
      transactions: 0,
      conversions: 0,
      fiatBalances: 0,
      bankAccounts: 0,
      pixKeys: 0,
      total: 0,
    };

    // Contar subcoleções (com try-catch individual para cada uma)
    try {
      const assetsSnapshot = await getDocs(collection(db, 'users', userId, 'assets'));
      counts.assets = assetsSnapshot.size;
    } catch (error) {
      // Silencioso - permissão negada ou não existe
    }

    try {
      const transactionsSnapshot = await getDocs(collection(db, 'users', userId, 'transactions'));
      counts.transactions = transactionsSnapshot.size;
    } catch (error) {
      // Silencioso - permissão negada ou não existe
    }

    try {
      const conversionsSnapshot = await getDocs(collection(db, 'users', userId, 'conversions'));
      counts.conversions = conversionsSnapshot.size;
    } catch (error) {
      // Silencioso - permissão negada ou não existe
    }

    try {
      const fiatBalancesSnapshot = await getDocs(collection(db, 'users', userId, 'fiatBalances'));
      counts.fiatBalances = fiatBalancesSnapshot.size;
    } catch (error) {
      // Silencioso - permissão negada ou não existe
    }

    // Contar coleções externas (com try-catch individual)
    try {
      const bankAccountsQuery = query(collection(db, 'bankAccounts'), where('userId', '==', userId));
      const bankAccountsSnapshot = await getDocs(bankAccountsQuery);
      counts.bankAccounts = bankAccountsSnapshot.size;
    } catch (error) {
      // Silencioso - permissão negada ou não existe
    }

    try {
      const pixKeysQuery = query(collection(db, 'pixKeys'), where('userId', '==', userId));
      const pixKeysSnapshot = await getDocs(pixKeysQuery);
      counts.pixKeys = pixKeysSnapshot.size;
    } catch (error) {
      // Silencioso - permissão negada ou não existe
    }

    counts.total = counts.assets + counts.transactions + counts.conversions + 
                   counts.fiatBalances + counts.bankAccounts + counts.pixKeys;

    console.log('📊 Contagem de dados do usuário:', counts);
    return counts;
  } catch (error) {
    console.error('❌ Erro geral ao contar dados do usuário:', error);
    return {
      assets: 0,
      transactions: 0,
      conversions: 0,
      fiatBalances: 0,
      bankAccounts: 0,
      pixKeys: 0,
      total: 0,
    };
  }
}