import { doc, getDoc, setDoc, collection, addDoc, runTransaction, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { findUserByWalletAddress } from './walletAddressUtils';
import { updateCryptoBalance } from './portfolioUtils';

export interface CryptoTransferData {
  fromUserId: string;
  toUserId: string;
  coinId: string;
  coinSymbol: string;
  amount: number;
  fee: number;
  network: string;
  toAddress: string;
  fromAddress?: string;
  status: 'pending' | 'completed' | 'failed';
  transactionHash: string;
  createdAt: Date;
}

/**
 * Valida se o endereço da carteira existe no sistema e retorna o userId do destinatário
 */
export async function validateWalletAddress(
  address: string,
  network: string,
  currentUserId?: string // ✅ Novo parâmetro para verificar auto-transferência
): Promise<{ isValid: boolean; userId: string | null; userName: string | null; error?: string }> {
  try {
    console.log('🔍 Validando endereço:', address, 'na rede:', network);

    // Buscar o usuário dono deste endereço
    const userId = await findUserByWalletAddress(address);

    if (!userId) {
      console.warn('⚠️ Endereço não encontrado no índice:', address);
      return {
        isValid: false,
        userId: null,
        userName: null,
        error: 'Endereço não encontrado. Certifique-se de que o destinatário possui uma conta NexCoin.',
      };
    }

    // ✅ VERIFICAR SE É AUTO-TRANSFERÊNCIA
    if (currentUserId && userId === currentUserId) {
      console.warn('⚠️ Tentativa de auto-transferência detectada');
      return {
        isValid: false,
        userId: null,
        userName: null,
        error: 'Você não pode transferir para o seu próprio endereço.',
      };
    }

    console.log('✅ Usuário encontrado:', userId);

    // Verificar se o endereço corresponde à rede correta
    const addressRef = doc(db, 'users', userId, 'walletAddresses', network);
    const addressDoc = await getDoc(addressRef);

    if (!addressDoc.exists()) {
      console.warn(`⚠️ Endereço não pertence à rede ${network}`);
      return {
        isValid: false,
        userId: null,
        userName: null,
        error: `Este endereço não pertence à rede ${network}`,
      };
    }

    const walletData = addressDoc.data();
    if (walletData.address.toLowerCase() !== address.toLowerCase()) {
      console.warn(`⚠️ Endereço não corresponde: esperado ${walletData.address}, recebido ${address}`);
      return {
        isValid: false,
        userId: null,
        userName: null,
        error: `Endereço não corresponde à rede ${network}`,
      };
    }

    // Buscar nome do usuário
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userName = userDoc.exists() ? (userDoc.data().name || userDoc.data().email || 'Usuário') : 'Usuário';

    console.log('✅ Endereço válido! Destinatário:', userName, '(', userId, ')');

    return {
      isValid: true,
      userId,
      userName,
    };
  } catch (error) {
    console.error('❌ Erro ao validar endereço:', error);
    return {
      isValid: false,
      userId: null,
      userName: null,
      error: 'Erro ao validar endereço',
    };
  }
}

/**
 * Processa uma transferência de criptomoeda entre usuários
 */
export async function processCryptoTransfer(
  transferData: CryptoTransferData
): Promise<{ success: boolean; error?: string; transactionId?: string }> {
  try {
    console.log('💸 Iniciando transferência de cripto:', transferData);

    const { fromUserId, toUserId, coinId, coinSymbol, amount, fee, network, toAddress } = transferData;

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

    // Calcular o débito total (valor + taxa) fora da transação
    const totalDebit = amount + fee;

    // Usar uma transação para garantir atomicidade
    const transactionResult = await runTransaction(db, async (transaction) => {
      // ✅ TODAS AS LEITURAS PRIMEIRO (antes de qualquer escrita)
      
      // 1. Buscar saldo do remetente (usando symbol como ID do documento)
      const fromPortfolioRef = doc(db, 'users', fromUserId, 'portfolio', coinSymbol);
      const fromPortfolioDoc = await transaction.get(fromPortfolioRef);

      // 2. Buscar saldo do destinatário (ler antes de escrever!)
      const toPortfolioRef = doc(db, 'users', toUserId, 'portfolio', coinSymbol);
      const toPortfolioDoc = await transaction.get(toPortfolioRef);

      // ✅ VALIDAÇÕES (após todas as leituras)
      
      if (!fromPortfolioDoc.exists()) {
        throw new Error('Você não possui saldo desta criptomoeda');
      }

      const fromBalance = fromPortfolioDoc.data().amount || 0;

      if (fromBalance < totalDebit) {
        throw new Error(`Saldo insuficiente. Necessário: ${totalDebit} ${coinSymbol}, Disponível: ${fromBalance} ${coinSymbol}`);
      }

      // ✅ TODAS AS ESCRITAS AGORA (após todas as leituras)
      
      // 3. Debitar do remetente (valor + taxa)
      const newFromBalance = fromBalance - totalDebit;
      transaction.update(fromPortfolioRef, {
        amount: newFromBalance,
        updatedAt: new Date(),
      });

      console.log(`💰 Debitado ${totalDebit} ${coinSymbol} de ${fromUserId}. Novo saldo: ${newFromBalance}`);

      // 4. Creditar ao destinatário (apenas o valor, sem taxa)
      let newToBalance: number;
      if (toPortfolioDoc.exists()) {
        const toBalance = toPortfolioDoc.data().amount || 0;
        newToBalance = toBalance + amount;
        transaction.update(toPortfolioRef, {
          amount: newToBalance,
          updatedAt: new Date(),
        });
      } else {
        // Criar novo registro se não existir
        newToBalance = amount;
        transaction.set(toPortfolioRef, {
          coinId,
          symbol: coinSymbol,
          amount: newToBalance,
          name: coinSymbol, // Adicionar nome
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      console.log(`💰 Creditado ${amount} ${coinSymbol} para ${toUserId}. Novo saldo: ${newToBalance}`);

      return { newFromBalance, newToBalance };
    });

    // 5. Registrar transações no histórico de ambos os usuários
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Transação do remetente (débito)
    const fromTransactionRef = doc(collection(db, 'users', fromUserId, 'transactions'));
    await setDoc(fromTransactionRef, {
      id: fromTransactionRef.id,
      type: 'crypto_send',
      coinId,
      coinSymbol,
      currency: coinSymbol, // ✅ Adicionar campo currency
      amount: -totalDebit, // Negativo para débito
      amountSent: amount,
      fee,
      feeCurrency: coinSymbol, // ✅ Adicionar campo feeCurrency
      network,
      toUserId,
      toAddress,
      status: 'completed',
      transactionHash: transferData.transactionHash,
      transactionId,
      createdAt: Timestamp.fromDate(new Date()), // ✅ Usar Timestamp do Firestore
      description: `Enviado ${amount} ${coinSymbol} via ${network}`,
    });

    // Transação do destinatário (crédito)
    const toTransactionRef = doc(collection(db, 'users', toUserId, 'transactions'));
    await setDoc(toTransactionRef, {
      id: toTransactionRef.id,
      type: 'crypto_receive',
      coinId,
      coinSymbol,
      currency: coinSymbol, // ✅ Adicionar campo currency
      amount: amount, // Positivo para crédito
      fee: 0, // ✅ Destinatário não paga taxa
      feeCurrency: coinSymbol, // ✅ Adicionar campo feeCurrency
      network,
      fromUserId,
      fromAddress: transferData.fromAddress || 'NexCoin User',
      status: 'completed',
      transactionHash: transferData.transactionHash,
      transactionId,
      createdAt: Timestamp.fromDate(new Date()), // ✅ Usar Timestamp do Firestore
      description: `Recebido ${amount} ${coinSymbol} via ${network}`,
    });

    console.log('✅ Transferência concluída com sucesso!');

    return {
      success: true,
      transactionId: fromTransactionRef.id,
    };
  } catch (error: any) {
    console.error('❌ Erro ao processar transferência:', error);
    return {
      success: false,
      error: error.message || 'Erro ao processar transferência',
    };
  }
}

/**
 * Gera um hash de transação único
 */
export function generateTransactionHash(): string {
  const timestamp = Date.now().toString(16);
  const random = Math.random().toString(16).substring(2);
  return `0x${timestamp}${random}`.substring(0, 66);
}