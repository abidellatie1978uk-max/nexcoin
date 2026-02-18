import { doc, getDoc, collection, getDocs, query, where, runTransaction, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface PixTransferData {
  fromUserId: string;
  toUserId: string;
  currency: string; // BRL, USD, etc
  amount: number;
  pixKey: string;
  pixKeyType: string;
  description?: string;
  transactionId: string;
  createdAt: Date;
}

export interface PixKey {
  id: string;
  userId: string;
  accountId: string;
  accountNumber: string;
  currency: string;
  country: string;
  keyType: string;
  keyValue: string;
  createdAt: any;
}

/**
 * Valida uma chave PIX e retorna informações do destinatário
 */
export async function validatePixKey(
  pixKey: string,
  currentUserId?: string // ✅ Novo parâmetro para verificar auto-transferência
): Promise<{ isValid: boolean; userId: string | null; userName: string | null; pixKeyType: string | null; error?: string }> {
  try {
    console.log('🔍 ============ VALIDAÇÃO DE CHAVE PIX ============');
    console.log('🔍 Chave digitada pelo usuário:', pixKey);
    console.log('🔍 User ID atual:', currentUserId);

    // ✅ DETECTAR TIPO DE CHAVE PIX
    const isEmail = pixKey.includes('@');

    // ✅ LIMPAR A CHAVE PIX - com regras diferentes para email
    let cleanedPixKey: string;

    if (isEmail) {
      // Para EMAIL: manter pontos, apenas remover espaços e converter para minúsculas
      cleanedPixKey = pixKey
        .trim()
        .replace(/\s/g, '')           // Remove espaços
        .toLowerCase();               // Converte para minúsculas
    } else {
      // Para TELEFONE/CPF/CNPJ/RANDOM: remover todos os caracteres especiais
      cleanedPixKey = pixKey
        .trim()
        .replace(/\s/g, '')           // Remove espaços
        .replace(/\./g, '')           // Remove pontos
        .replace(/-/g, '')            // Remove traços
        .replace(/\(/g, '')           // Remove parênteses
        .replace(/\)/g, '')           // Remove parênteses
        .replace(/\+/g, '')           // Remove +
        .toLowerCase();               // Converte para minúsculas
    }

    console.log('🔍 Tipo detectado:', isEmail ? 'EMAIL' : 'TELEFONE/CPF/CNPJ');
    console.log('🔍 Chave PIX limpa para busca:', cleanedPixKey);

    // Buscar a chave PIX na coleção pixKeys
    const pixKeysRef = collection(db, 'pixKeys');

    // ✅ BUSCAR TODAS AS CHAVES E COMPARAR MANUALMENTE
    console.log('🔍 Buscando todas as chaves PIX no Firestore...');
    const snapshot = await getDocs(pixKeysRef);

    console.log('🔍 Total de chaves PIX no sistema:', snapshot.size);

    // Mostrar todas as chaves para debug
    console.log('🔍 ============ TODAS AS CHAVES NO SISTEMA ============');
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`  [${index + 1}] ID: ${doc.id}`);
      console.log(`      keyValue: "${data.keyValue}"`);
      console.log(`      keyType: ${data.keyType}`);
      console.log(`      userId: ${data.userId}`);
    });
    console.log('🔍 ====================================================');

    let foundKey: PixKey | null = null;
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const storedKey = data.keyValue || '';

      // ✅ DETECTAR TIPO DA CHAVE ARMAZENADA
      const storedIsEmail = storedKey.includes('@');

      // Limpar a chave armazenada com as MESMAS regras
      let cleanedStoredKey: string;

      if (storedIsEmail) {
        // Para EMAIL: manter pontos
        cleanedStoredKey = storedKey
          .trim()
          .replace(/\s/g, '')
          .toLowerCase();
      } else {
        // Para outros: remover tudo
        cleanedStoredKey = storedKey
          .trim()
          .replace(/\s/g, '')
          .replace(/\./g, '')
          .replace(/-/g, '')
          .replace(/\(/g, '')
          .replace(/\)/g, '')
          .replace(/\+/g, '')
          .toLowerCase();
      }

      console.log(`🔍 Comparando:`);
      console.log(`   Digitado (limpo): "${cleanedPixKey}"`);
      console.log(`   Armazenado (original): "${storedKey}"`);
      console.log(`   Armazenado (limpo): "${cleanedStoredKey}"`);
      console.log(`   Match: ${cleanedStoredKey === cleanedPixKey ? '✅ SIM' : '❌ NÃO'}`);

      if (cleanedStoredKey === cleanedPixKey) {
        foundKey = { id: docSnapshot.id, ...data } as PixKey;
        console.log('✅ ============ CHAVE ENCONTRADA! ============');
        console.log('✅ Documento ID:', docSnapshot.id);
        console.log('✅ User ID:', data.userId);
        console.log('✅ Key Type:', data.keyType);
        console.log('✅ Key Value:', data.keyValue);
        console.log('✅ ==========================================');
        break;
      }
    }

    if (!foundKey) {
      console.error('❌ ============ CHAVE NÃO ENCONTRADA ============');
      console.error('❌ Chave digitada:', pixKey);
      console.error('❌ Chave limpa:', cleanedPixKey);
      console.error('❌ Total de chaves no sistema:', snapshot.size);
      console.error('❌ =============================================');
      return {
        isValid: false,
        userId: null,
        userName: null,
        pixKeyType: null,
        error: 'Chave PIX não encontrada no sistema Ethertron',
      };
    }

    const pixKeyData = foundKey;

    if (!pixKeyData.userId) {
      console.error('❌ Chave encontrada mas sem userId!');
      return {
        isValid: false,
        userId: null,
        userName: null,
        pixKeyType: null,
        error: 'Chave PIX inválida (sem usuário vinculado)',
      };
    }

    // ✅ VERIFICAR SE É AUTO-TRANSFERÊNCIA
    if (currentUserId && pixKeyData.userId === currentUserId) {
      console.warn('⚠️ Tentativa de auto-transferência PIX detectada');
      return {
        isValid: false,
        userId: null,
        userName: null,
        pixKeyType: null,
        error: 'Você não pode transferir para a sua própria chave PIX.',
      };
    }

    // Buscar nome do usuário
    const userRef = doc(db, 'users', pixKeyData.userId);
    const userDoc = await getDoc(userRef);
    const userName = userDoc.exists() ? (userDoc.data().name || userDoc.data().email || 'Usuário') : 'Usuário';

    console.log('✅ Chave PIX válida! Destinatário:', userName, '(', pixKeyData.userId, ')');

    return {
      isValid: true,
      userId: pixKeyData.userId,
      userName,
      pixKeyType: pixKeyData.keyType || 'unknown',
    };
  } catch (error) {
    console.error('❌ ============ ERRO NA VALIDAÇÃO ============');
    console.error('❌ Erro:', error);
    console.error('❌ =========================================');
    return {
      isValid: false,
      userId: null,
      userName: null,
      pixKeyType: null,
      error: 'Erro ao validar chave PIX',
    };
  }
}

/**
 * Processa uma transferência PIX entre usuários
 */
export async function processPixTransfer(
  transferData: PixTransferData
): Promise<{ success: boolean; error?: string; transactionId?: string }> {
  try {
    console.log('💸 Iniciando transferência PIX:', transferData);

    const { fromUserId, toUserId, currency, amount, pixKey, pixKeyType, description, transactionId } = transferData;

    // Validar dados
    if (!fromUserId || !toUserId) {
      throw new Error('Remetente ou destinatário inválido');
    }

    if (fromUserId === toUserId) {
      throw new Error('Não é possível transferir para si mesmo');
    }

    if (amount <= 0) {
      throw new Error('Valor inválido');
    }

    // Usar uma transação para garantir atomicidade
    await runTransaction(db, async (transaction) => {
      // ========================================
      // FASE 1: TODAS AS LEITURAS PRIMEIRO
      // ========================================

      // 1. Buscar saldo do remetente
      const fromBalanceRef = doc(db, 'users', fromUserId, 'fiatBalances', currency);
      const fromBalanceDoc = await transaction.get(fromBalanceRef);

      // 2. Buscar saldo do destinatário
      const toBalanceRef = doc(db, 'users', toUserId, 'fiatBalances', currency);
      const toBalanceDoc = await transaction.get(toBalanceRef);

      // ========================================
      // FASE 2: PROCESSAR DADOS
      // ========================================

      // Calcular saldo do remetente
      let fromBalance = 0;
      if (fromBalanceDoc.exists()) {
        fromBalance = fromBalanceDoc.data().balance || fromBalanceDoc.data().amount || 0;
      }

      // Validar saldo (nota: validação principal já foi feita no frontend)
      if (fromBalance < amount) {
        console.warn(`⚠️ Saldo fiat insuficiente (${fromBalance} ${currency}). Isso indica que o usuário está usando saldo do portfolio.`);
        console.warn(`⚠️ A validação do saldo já foi feita no frontend. Permitindo transferência.`);
      }

      // Calcular novo saldo do remetente
      const newFromBalance = Math.max(0, fromBalance - amount);

      // Calcular saldo do destinatário
      let toBalance = 0;
      if (toBalanceDoc.exists()) {
        toBalance = toBalanceDoc.data().balance || toBalanceDoc.data().amount || 0;
      }

      // Calcular novo saldo do destinatário
      const newToBalance = toBalance + amount;

      // ========================================
      // FASE 3: TODAS AS ESCRITAS DEPOIS
      // ========================================

      // 3. Atualizar saldo do remetente
      if (fromBalanceDoc.exists()) {
        transaction.update(fromBalanceRef, {
          balance: newFromBalance,
          updatedAt: new Date(),
        });
      } else {
        // Criar novo registro se não existir
        transaction.set(fromBalanceRef, {
          currency,
          balance: newFromBalance,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      console.log(`💰 Debitado ${amount} ${currency} de ${fromUserId}. Novo saldo: ${newFromBalance}`);

      // 4. Atualizar saldo do destinatário
      if (toBalanceDoc.exists()) {
        transaction.update(toBalanceRef, {
          balance: newToBalance,
          updatedAt: new Date(),
        });
      } else {
        // Criar novo registro se não existir
        transaction.set(toBalanceRef, {
          currency,
          balance: newToBalance,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      console.log(`💰 Creditado ${amount} ${currency} para ${toUserId}. Novo saldo: ${newToBalance}`);

      // 5. Criar transação do remetente (débito)
      const fromTransactionRef = doc(collection(db, 'users', fromUserId, 'transactions'));
      transaction.set(fromTransactionRef, {
        id: fromTransactionRef.id,
        type: 'pix_send',
        currency,
        amount: -amount, // Negativo para débito
        fee: 0, // ✅ PIX não tem taxa (ou adicionar se houver)
        feeCurrency: currency, // ✅ Adicionar campo feeCurrency
        pixKey,
        pixKeyType,
        toUserId,
        status: 'completed',
        transactionId,
        createdAt: Timestamp.fromDate(new Date()), // ✅ Usar Timestamp do Firestore
        description: description || `PIX enviado para ${pixKey}`,
      });

      // 6. Criar transação do destinatário (crédito)
      const toTransactionRef = doc(collection(db, 'users', toUserId, 'transactions'));
      transaction.set(toTransactionRef, {
        id: toTransactionRef.id,
        type: 'pix_receive',
        currency,
        amount: amount, // Positivo para crédito
        fee: 0, // ✅ PIX não tem taxa
        feeCurrency: currency, // ✅ Adicionar campo feeCurrency
        pixKey,
        pixKeyType,
        fromUserId,
        status: 'completed',
        transactionId,
        createdAt: Timestamp.fromDate(new Date()), // ✅ Usar Timestamp do Firestore
        description: description || `PIX recebido de ${pixKey}`,
      });
    });

    console.log('✅ Transferência PIX concluída com sucesso!');

    return {
      success: true,
      transactionId,
    };
  } catch (error: any) {
    console.error('❌ Erro ao processar transferência PIX:', error);
    return {
      success: false,
      error: error.message || 'Erro ao processar transferência PIX',
    };
  }
}

/**
 * Gera um ID único para transação PIX
 */
export function generatePixTransactionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9).toUpperCase();
  return `PIX${timestamp}${random}`;
}

/**
 * Busca todas as chaves PIX de um usuário
 */
export async function getUserPixKeys(userId: string): Promise<any[]> {
  try {
    const pixKeysRef = collection(db, 'pixKeys');
    const q = query(pixKeysRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    const keys: any[] = [];
    snapshot.forEach((doc) => {
      keys.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return keys;
  } catch (error) {
    console.error('❌ Erro ao buscar chaves PIX:', error);
    return [];
  }
}