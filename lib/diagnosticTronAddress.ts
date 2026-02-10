import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Função de diagnóstico completo para endereços TRON
 * Verifica todos os pontos onde o endereço pode estar salvo/não salvo
 */
export async function diagnosticTronAddress(userId: string, address: string) {
  console.log('🔍 ========== DIAGNÓSTICO DE ENDEREÇO TRON ==========');
  console.log(`User ID: ${userId}`);
  console.log(`Endereço: ${address}`);
  console.log('');

  const results = {
    userDocExists: false,
    addressInUserDoc: null as string | null,
    indexExists: false,
    indexData: null as any,
    indexKeyUsed: '',
    needsManualFix: false,
  };

  try {
    // 1. Verificar se o endereço existe no documento do usuário
    console.log('1️⃣ Verificando documento do usuário...');
    const userAddressRef = doc(db, 'users', userId, 'walletAddresses', 'Tron');
    const userAddressDoc = await getDoc(userAddressRef);

    if (userAddressDoc.exists()) {
      results.userDocExists = true;
      results.addressInUserDoc = userAddressDoc.data().address;
      console.log(`   ✅ Documento existe`);
      console.log(`   📍 Endereço salvo: ${results.addressInUserDoc}`);
      
      if (results.addressInUserDoc !== address) {
        console.log(`   ⚠️ ATENÇÃO: Endereço no documento é diferente do fornecido!`);
        console.log(`      Fornecido: ${address}`);
        console.log(`      No doc:    ${results.addressInUserDoc}`);
      }
    } else {
      results.userDocExists = false;
      console.log(`   ❌ Documento NÃO existe`);
      console.log(`   💡 Caminho: /users/${userId}/walletAddresses/Tron`);
    }

    console.log('');

    // 2. Verificar índice global com lowercase
    console.log('2️⃣ Verificando índice global (lowercase)...');
    const indexKeyLower = address.toLowerCase();
    results.indexKeyUsed = indexKeyLower;
    const indexRefLower = doc(db, 'walletAddressIndex', indexKeyLower);
    const indexDocLower = await getDoc(indexRefLower);

    if (indexDocLower.exists()) {
      results.indexExists = true;
      results.indexData = indexDocLower.data();
      console.log(`   ✅ Índice existe (lowercase)`);
      console.log(`   📍 Key: ${indexKeyLower}`);
      console.log(`   📄 Dados:`, results.indexData);
    } else {
      console.log(`   ❌ Índice NÃO existe (lowercase)`);
      console.log(`   💡 Key tentada: ${indexKeyLower}`);
    }

    console.log('');

    // 3. Verificar índice global com case original
    console.log('3️⃣ Verificando índice global (case original)...');
    const indexRefOriginal = doc(db, 'walletAddressIndex', address);
    const indexDocOriginal = await getDoc(indexRefOriginal);

    if (indexDocOriginal.exists()) {
      console.log(`   ✅ Índice existe (case original)`);
      console.log(`   📍 Key: ${address}`);
      console.log(`   📄 Dados:`, indexDocOriginal.data());
      console.log(`   ⚠️ PROBLEMA: Índice foi criado com case original, não lowercase!`);
      results.needsManualFix = true;
    } else {
      console.log(`   ❌ Índice NÃO existe (case original)`);
    }

    console.log('');

    // 4. Resumo e recomendações
    console.log('📊 ========== RESUMO DO DIAGNÓSTICO ==========');
    
    if (results.userDocExists && results.indexExists) {
      console.log('✅ TUDO OK: Endereço existe no documento do usuário E no índice global');
    } else if (results.userDocExists && !results.indexExists) {
      console.log('⚠️ PROBLEMA: Endereço existe no documento do usuário mas NÃO no índice global');
      console.log('');
      console.log('🔧 SOLUÇÃO:');
      console.log('   1. Clique em "🔄 Migrar Endereços para Índice"');
      console.log('   2. OU clique em "🔧 Corrigir Endereços TRON"');
      results.needsManualFix = true;
    } else if (!results.userDocExists) {
      console.log('❌ ERRO GRAVE: Endereço NÃO existe no documento do usuário');
      console.log('');
      console.log('🔧 SOLUÇÃO:');
      console.log('   1. Vá em Carteira → Receber');
      console.log('   2. Selecione Tron (TRC20)');
      console.log('   3. O endereço será gerado automaticamente');
      results.needsManualFix = true;
    }

    console.log('');
    console.log('='.repeat(50));

    return results;

  } catch (error: any) {
    console.error('❌ Erro durante diagnóstico:', error);
    return results;
  }
}

/**
 * Corrige manualmente o índice para um endereço específico
 */
export async function forceIndexCreation(userId: string, address: string, network: string = 'Tron') {
  try {
    console.log('🔧 Criando índice manualmente...');
    console.log(`   User ID: ${userId}`);
    console.log(`   Endereço: ${address}`);
    console.log(`   Rede: ${network}`);

    // Criar índice com lowercase (padrão do sistema)
    const indexRef = doc(db, 'walletAddressIndex', address.toLowerCase());
    await setDoc(indexRef, {
      address: address,
      userId: userId,
      network: network,
      updatedAt: new Date(),
    });

    console.log('✅ Índice criado com sucesso!');
    console.log(`   Key: ${address.toLowerCase()}`);
    
    // Aguardar processamento
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verificar se foi criado
    const verifyDoc = await getDoc(indexRef);
    if (verifyDoc.exists()) {
      console.log('✅ Verificação: Índice confirmado no Firestore');
      return true;
    } else {
      console.log('❌ Verificação: Índice NÃO foi criado');
      return false;
    }

  } catch (error: any) {
    console.error('❌ Erro ao criar índice:', error);
    return false;
  }
}
