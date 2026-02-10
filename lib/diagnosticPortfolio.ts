import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

/**
 * 🔍 DIAGNÓSTICO: Verifica a integridade dos dados do portfolio
 */
export async function diagnosePortfolio(userId: string): Promise<{
  total: number;
  valid: number;
  invalid: number;
  invalidDocs: Array<{ id: string; reason: string; data: any }>;
}> {
  try {
    console.log('🔍 Diagnosticando portfolio...');
    
    const portfolioRef = collection(db, 'users', userId, 'portfolio');
    const snapshot = await getDocs(portfolioRef);
    
    const invalidDocs: Array<{ id: string; reason: string; data: any }> = [];
    let validCount = 0;
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      
      // Verificar campos obrigatórios
      const missingFields: string[] = [];
      
      if (!data.symbol) missingFields.push('symbol');
      if (!data.coinId) missingFields.push('coinId');
      if (data.amount === undefined) missingFields.push('amount');
      
      if (missingFields.length > 0) {
        invalidDocs.push({
          id: doc.id,
          reason: `Campos ausentes: ${missingFields.join(', ')}`,
          data: data,
        });
      } else {
        validCount++;
      }
    });
    
    const result = {
      total: snapshot.size,
      valid: validCount,
      invalid: invalidDocs.length,
      invalidDocs,
    };
    
    console.log('📊 Resultado do diagnóstico:', result);
    
    return result;
    
  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
    throw error;
  }
}

/**
 * 🔍 DIAGNÓSTICO: Verifica a subcoleção wallets (depreciada)
 */
export async function diagnoseWallets(userId: string): Promise<{
  total: number;
  valid: number;
  invalid: number;
  invalidDocs: Array<{ id: string; reason: string; data: any }>;
}> {
  try {
    console.log('🔍 Diagnosticando wallets (depreciada)...');
    
    const walletsRef = collection(db, 'users', userId, 'wallets');
    const snapshot = await getDocs(walletsRef);
    
    const invalidDocs: Array<{ id: string; reason: string; data: any }> = [];
    let validCount = 0;
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      
      // Verificar campos obrigatórios
      const missingFields: string[] = [];
      
      if (!data.symbol) missingFields.push('symbol');
      if (!data.coinId) missingFields.push('coinId');
      if (data.amount === undefined) missingFields.push('amount');
      
      if (missingFields.length > 0) {
        invalidDocs.push({
          id: doc.id,
          reason: `Campos ausentes: ${missingFields.join(', ')}`,
          data: data,
        });
      } else {
        validCount++;
      }
    });
    
    const result = {
      total: snapshot.size,
      valid: validCount,
      invalid: invalidDocs.length,
      invalidDocs,
    };
    
    console.log('📊 Resultado do diagnóstico de wallets:', result);
    
    return result;
    
  } catch (error) {
    console.error('❌ Erro no diagnóstico de wallets:', error);
    throw error;
  }
}

/**
 * 📋 DIAGNÓSTICO COMPLETO: Portfolio + Wallets
 */
export async function diagnoseComplete(userId: string): Promise<void> {
  console.log('🔍 === DIAGNÓSTICO COMPLETO ===');
  console.log('👤 userId:', userId);
  console.log('');
  
  try {
    // Diagnosticar portfolio
    console.log('📁 PORTFOLIO (/users/{userId}/portfolio):');
    const portfolioDiag = await diagnosePortfolio(userId);
    console.log(`   Total: ${portfolioDiag.total} documentos`);
    console.log(`   ✅ Válidos: ${portfolioDiag.valid}`);
    console.log(`   ❌ Inválidos: ${portfolioDiag.invalid}`);
    
    if (portfolioDiag.invalidDocs.length > 0) {
      console.log('');
      console.log('   📋 Documentos inválidos:');
      portfolioDiag.invalidDocs.forEach((doc) => {
        console.log(`      - ${doc.id}: ${doc.reason}`);
        console.log(`        Dados:`, doc.data);
      });
    }
    
    console.log('');
    
    // Diagnosticar wallets
    console.log('📁 WALLETS (DEPRECIADA) (/users/{userId}/wallets):');
    const walletsDiag = await diagnoseWallets(userId);
    console.log(`   Total: ${walletsDiag.total} documentos`);
    console.log(`   ✅ Válidos: ${walletsDiag.valid}`);
    console.log(`   ❌ Inválidos: ${walletsDiag.invalid}`);
    
    if (walletsDiag.invalidDocs.length > 0) {
      console.log('');
      console.log('   📋 Documentos inválidos:');
      walletsDiag.invalidDocs.forEach((doc) => {
        console.log(`      - ${doc.id}: ${doc.reason}`);
        console.log(`        Dados:`, doc.data);
      });
    }
    
    console.log('');
    console.log('🔍 === FIM DO DIAGNÓSTICO ===');
    
    // Sugestões
    if (portfolioDiag.invalid > 0) {
      console.log('');
      console.log('💡 SUGESTÃO: Execute a limpeza automática fazendo logout e login novamente.');
      console.log('   Documentos inválidos serão removidos automaticamente.');
    }
    
    if (walletsDiag.total > 0) {
      console.log('');
      console.log('💡 SUGESTÃO: Migração de wallets → portfolio disponível.');
      console.log('   Execute fazendo logout e login novamente.');
    }
    
  } catch (error) {
    console.error('❌ Erro no diagnóstico completo:', error);
  }
}
