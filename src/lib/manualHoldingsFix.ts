import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * 🔧 CORREÇÃO MANUAL: Migração do documento "holdings" antigo
 * 
 * Execute esta função manualmente no console do navegador:
 * 
 * ```javascript
 * import { fixHoldingsDocument } from './lib/manualHoldingsFix';
 * import { auth } from './lib/firebase';
 * 
 * // No console:
 * fixHoldingsDocument(auth.currentUser.uid);
 * ```
 */
export async function fixHoldingsDocument(userId: string): Promise<void> {
  try {
    console.log('🔧 === CORREÇÃO MANUAL DO DOCUMENTO HOLDINGS ===');
    console.log('👤 userId:', userId);
    console.log('');
    
    // 1. Buscar o documento "holdings"
    const holdingsRef = doc(db, 'users', userId, 'portfolio', 'holdings');
    const holdingsDoc = await getDoc(holdingsRef);
    
    if (!holdingsDoc.exists()) {
      console.log('ℹ️ Documento "holdings" não encontrado');
      return;
    }
    
    const data = holdingsDoc.data();
    console.log('📦 Documento "holdings" encontrado:', data);
    console.log('');
    
    // 2. Verificar se tem estrutura antiga (array)
    if (!Array.isArray(data.holdings)) {
      console.log('ℹ️ Documento "holdings" não tem estrutura de array');
      console.log('✅ Nenhuma correção necessária');
      return;
    }
    
    console.log(`🔄 Encontrado ${data.holdings.length} holdings no array`);
    console.log('');
    
    // 3. Migrar cada holding
    let migratedCount = 0;
    
    for (const holding of data.holdings) {
      console.log('📝 Processando holding:', holding);
      
      if (!holding.symbol || !holding.coinId || holding.amount === undefined) {
        console.warn('⚠️ Holding inválido, pulando...');
        continue;
      }
      
      try {
        const newDocRef = doc(db, 'users', userId, 'portfolio', holding.symbol);
        
        // Verificar se já existe
        const existingDoc = await getDoc(newDocRef);
        
        if (existingDoc.exists()) {
          console.log(`ℹ️ Documento ${holding.symbol} já existe, somando valores...`);
          const existingData = existingDoc.data();
          const newAmount = (existingData.amount || 0) + holding.amount;
          
          await setDoc(newDocRef, {
            symbol: holding.symbol,
            coinId: holding.coinId,
            amount: newAmount,
            name: holding.name || holding.symbol,
            valueUsd: 0,
            createdAt: existingData.createdAt || new Date(),
            updatedAt: new Date(),
          }, { merge: false });
          
          console.log(`✅ ${holding.symbol}: ${existingData.amount} + ${holding.amount} = ${newAmount}`);
        } else {
          await setDoc(newDocRef, {
            symbol: holding.symbol,
            coinId: holding.coinId,
            amount: holding.amount,
            name: holding.name || holding.symbol,
            valueUsd: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          
          console.log(`✅ ${holding.symbol}: ${holding.amount} (novo documento)`);
        }
        
        migratedCount++;
        
      } catch (error) {
        console.error(`❌ Erro ao migrar ${holding.symbol}:`, error);
      }
    }
    
    console.log('');
    console.log(`✅ ${migratedCount} holdings migrados com sucesso!`);
    console.log('');
    
    // 4. Sobrescrever documento "holdings" com estrutura válida
    console.log('🔄 Sobrescrevendo documento "holdings"...');
    
    const firstHolding = data.holdings.find((h: any) => 
      h.symbol && h.coinId && h.amount !== undefined
    );
    
    if (firstHolding) {
      await setDoc(holdingsRef, {
        symbol: firstHolding.symbol,
        coinId: firstHolding.coinId,
        amount: 0, // Zerar porque já foi migrado
        name: firstHolding.name || firstHolding.symbol,
        valueUsd: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        _migrated: true,
        _originalData: data.holdings, // Backup dos dados originais
      }, { merge: false });
      
      console.log('✅ Documento "holdings" sobrescrito (amount = 0)');
      console.log('💡 Dados originais salvos no campo _originalData');
    }
    
    console.log('');
    console.log('🎉 === CORREÇÃO CONCLUÍDA ===');
    console.log('');
    console.log('📊 Próximos passos:');
    console.log('   1. Verifique os documentos criados no portfolio');
    console.log('   2. Faça logout e login para sincronizar valores');
    console.log('   3. Teste conversões e transferências');
    
  } catch (error) {
    console.error('❌ Erro na correção manual:', error);
    throw error;
  }
}

/**
 * 🔍 DIAGNÓSTICO: Verifica o estado atual do portfolio
 */
export async function diagnoseHoldings(userId: string): Promise<void> {
  try {
    console.log('🔍 === DIAGNÓSTICO DO PORTFOLIO ===');
    console.log('');
    
    const portfolioRef = collection(db, 'users', userId, 'portfolio');
    const snapshot = await getDocs(portfolioRef);
    
    console.log(`📦 Total de documentos no portfolio: ${snapshot.size}`);
    console.log('');
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      console.log(`📄 ${doc.id}:`);
      
      if (doc.id === 'holdings' && Array.isArray(data.holdings)) {
        console.log('   ⚠️ ESTRUTURA ANTIGA (ARRAY)');
        console.log('   Holdings:', data.holdings);
      } else if (data.symbol && data.coinId && data.amount !== undefined) {
        console.log(`   ✅ ESTRUTURA VÁLIDA`);
        console.log(`   Symbol: ${data.symbol}`);
        console.log(`   CoinId: ${data.coinId}`);
        console.log(`   Amount: ${data.amount}`);
        console.log(`   ValueUSD: $${data.valueUsd?.toFixed(2) || '0.00'}`);
      } else {
        console.log('   ❌ ESTRUTURA INVÁLIDA');
        console.log('   Dados:', data);
      }
      
      console.log('');
    });
    
    console.log('🔍 === FIM DO DIAGNÓSTICO ===');
    
  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
  }
}

/**
 * 🗑️ LIMPEZA: Remove o documento "holdings" zerado (após publicar regras)
 */
export async function cleanupHoldingsDocument(userId: string): Promise<void> {
  try {
    console.log('🗑️ Tentando remover documento "holdings" zerado...');
    
    const holdingsRef = doc(db, 'users', userId, 'portfolio', 'holdings');
    const holdingsDoc = await getDoc(holdingsRef);
    
    if (!holdingsDoc.exists()) {
      console.log('ℹ️ Documento "holdings" não encontrado');
      return;
    }
    
    const data = holdingsDoc.data();
    
    if (data.amount === 0 && data._migrated === true) {
      // Tentar deletar (só funciona após publicar regras)
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(holdingsRef);
      console.log('✅ Documento "holdings" removido com sucesso!');
    } else {
      console.log('⚠️ Documento "holdings" não está marcado como migrado ou tem saldo não-zero');
      console.log('   Dados:', data);
    }
    
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      console.warn('⚠️ Permissão negada para deletar documento "holdings"');
      console.log('💡 Publique as regras atualizadas do Firestore e tente novamente');
      console.log('');
      console.log('Regra necessária:');
      console.log('  match /portfolio/{portfolioDoc} {');
      console.log('    allow delete: if isOwner(userId);');
      console.log('  }');
    } else {
      console.error('❌ Erro ao limpar documento "holdings":', error);
    }
  }
}
