import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * 🔄 MIGRAÇÃO: /users/{userId}/wallets → /users/{userId}/portfolio
 * 
 * Este script migra os dados da subcoleção "wallets" (depreciada) 
 * para a nova subcoleção "portfolio" com permissões corretas no Firestore.
 * 
 * Execute uma vez após atualizar as regras do Firestore!
 */

export async function migrateWalletsToPortfolio(userId: string): Promise<void> {
  try {
    console.log('🔄 Iniciando migração de wallets para portfolio...');
    console.log('👤 userId:', userId);

    // 1. Buscar todos os documentos da coleção wallets
    const walletsRef = collection(db, 'users', userId, 'wallets');
    const walletsSnapshot = await getDocs(walletsRef);

    if (walletsSnapshot.empty) {
      console.log('ℹ️ Nenhuma wallet encontrada para migrar');
      return;
    }

    console.log(`📦 Total de wallets encontradas: ${walletsSnapshot.size}`);

    // 2. Migrar cada wallet para portfolio
    let migratedCount = 0;
    let errorCount = 0;

    for (const walletDoc of walletsSnapshot.docs) {
      try {
        const walletData = walletDoc.data();
        console.log(`📝 Verificando wallet: ${walletDoc.id}`, walletData);

        // ✅ VALIDAR DADOS ANTES DE MIGRAR
        if (!walletData.symbol || !walletData.coinId || walletData.amount === undefined) {
          console.warn(`⚠️ Wallet ${walletDoc.id} possui dados inválidos, pulando...`, {
            symbol: walletData.symbol,
            coinId: walletData.coinId,
            amount: walletData.amount,
          });
          errorCount++;
          continue; // Pular este documento
        }

        // Criar documento correspondente no portfolio
        const portfolioRef = doc(db, 'users', userId, 'portfolio', walletDoc.id);
        await setDoc(portfolioRef, {
          symbol: walletData.symbol,
          coinId: walletData.coinId,
          amount: walletData.amount,
          name: walletData.name || walletData.symbol,
          valueUsd: walletData.valueUsd || 0,
          createdAt: walletData.createdAt || new Date(),
          updatedAt: new Date(), // Atualizar timestamp
        }, { merge: false }); // Sobrescrever completamente

        console.log(`✅ Wallet ${walletDoc.id} migrada para portfolio`);

        // OPCIONAL: Deletar wallet antiga após migração bem-sucedida
        // await deleteDoc(walletDoc.ref);
        // console.log(`🗑️ Wallet antiga deletada: ${walletDoc.id}`);

        migratedCount++;
      } catch (error) {
        console.error(`❌ Erro ao migrar wallet ${walletDoc.id}:`, error);
        errorCount++;
      }
    }

    console.log('✅ Migração concluída!');
    console.log(`📊 Resumo: ${migratedCount} migradas, ${errorCount} erros`);

    // 3. Deletar todas as wallets antigas (opcional - comentado por segurança)
    // if (migratedCount > 0 && errorCount === 0) {
    //   console.log('🗑️ Limpando wallets antigas...');
    //   for (const walletDoc of walletsSnapshot.docs) {
    //     await deleteDoc(walletDoc.ref);
    //   }
    //   console.log('✅ Wallets antigas removidas!');
    // }

  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  }
}

/**
 * Verifica se o usuário precisa de migração
 */
export async function needsMigration(userId: string): Promise<boolean> {
  try {
    const walletsRef = collection(db, 'users', userId, 'wallets');
    const walletsSnapshot = await getDocs(walletsRef);
    
    const needsMigration = !walletsSnapshot.empty;
    
    if (needsMigration) {
      console.log(`⚠️ Usuário ${userId} possui ${walletsSnapshot.size} wallets que precisam ser migradas`);
    }
    
    return needsMigration;
  } catch (error) {
    console.error('❌ Erro ao verificar necessidade de migração:', error);
    return false;
  }
}

/**
 * Executa migração automática ao fazer login
 */
export async function autoMigrateOnLogin(userId: string): Promise<void> {
  try {
    const shouldMigrate = await needsMigration(userId);
    
    if (shouldMigrate) {
      console.log('🔄 Migração automática necessária...');
      await migrateWalletsToPortfolio(userId);
      console.log('✅ Migração automática concluída!');
    } else {
      console.log('✅ Nenhuma migração necessária');
    }
    
    // ✅ LIMPAR DOCUMENTOS INVÁLIDOS DO PORTFOLIO
    await cleanInvalidPortfolioDocuments(userId);
    
  } catch (error) {
    console.error('❌ Erro na migração automática:', error);
    // Não propagar erro para não bloquear login
  }
}

/**
 * 🧹 LIMPEZA: Remove documentos inválidos do portfolio
 * Remove documentos sem symbol, coinId ou amount
 * E migra documento "holdings" antigo (array) para novos documentos separados
 */
export async function cleanInvalidPortfolioDocuments(userId: string): Promise<void> {
  try {
    console.log('🧹 Verificando documentos inválidos no portfolio...');
    
    const portfolioRef = collection(db, 'users', userId, 'portfolio');
    const snapshot = await getDocs(portfolioRef);
    
    if (snapshot.empty) {
      console.log('ℹ️ Portfolio vazio, nada a limpar');
      return;
    }
    
    let deletedCount = 0;
    let migratedCount = 0;
    
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      
      // 🔄 CASO ESPECIAL: Documento "holdings" com estrutura antiga (array)
      if (docSnapshot.id === 'holdings' && Array.isArray(data.holdings)) {
        console.log('🔄 Encontrado documento "holdings" com estrutura antiga (array)');
        console.log('📦 Migrando', data.holdings.length, 'holdings para documentos separados...');
        
        try {
          // Migrar cada holding do array para um documento separado
          for (const holding of data.holdings) {
            if (holding.symbol && holding.coinId && holding.amount !== undefined) {
              const newDocRef = doc(db, 'users', userId, 'portfolio', holding.symbol);
              await setDoc(newDocRef, {
                symbol: holding.symbol,
                coinId: holding.coinId,
                amount: holding.amount,
                name: holding.name || holding.symbol,
                valueUsd: 0, // Será calculado na próxima sincronização
                createdAt: new Date(),
                updatedAt: new Date(),
              }, { merge: true });
              
              console.log(`✅ Holding ${holding.symbol} migrado para documento separado`);
              migratedCount++;
            } else {
              console.warn(`⚠️ Holding inválido no array:`, holding);
            }
          }
          
          // Deletar documento "holdings" antigo após migração bem-sucedida
          await deleteDoc(docSnapshot.ref);
          console.log('🗑️ Documento "holdings" antigo deletado após migração');
          deletedCount++;
          
        } catch (error) {
          console.error('❌ Erro ao migrar documento "holdings":', error);
        }
        
        continue; // Pular para o próximo documento
      }
      
      // Verificar se documento é inválido (não tem campos obrigatórios)
      if (!data.symbol || !data.coinId || data.amount === undefined) {
        console.warn(`🗑️ Deletando documento inválido: ${docSnapshot.id}`, data);
        
        try {
          await deleteDoc(docSnapshot.ref);
          deletedCount++;
          console.log(`✅ Documento ${docSnapshot.id} deletado`);
        } catch (error) {
          console.error(`❌ Erro ao deletar documento ${docSnapshot.id}:`, error);
        }
      }
    }
    
    if (migratedCount > 0) {
      console.log(`✅ ${migratedCount} holding(s) migrado(s) de estrutura antiga para nova`);
    }
    
    if (deletedCount > 0) {
      console.log(`✅ ${deletedCount} documento(s) inválido(s) removido(s) do portfolio`);
    }
    
    if (migratedCount === 0 && deletedCount === 0) {
      console.log('✅ Nenhum documento inválido encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro ao limpar documentos inválidos:', error);
    // Não propagar erro - limpeza é opcional
  }
}