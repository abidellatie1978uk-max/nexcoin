import { doc, setDoc, updateDoc, increment, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Interface para saldo de moeda fiat
 */
export interface FiatBalance {
  currency: string; // BRL, USD, EUR, etc.
  balance: number;
  updatedAt: Date;
}

/**
 * Interface para histórico de transações fiat
 */
export interface FiatTransaction {
  id?: string;
  userId: string;
  currency: string;
  amount: number;
  type: 'credit' | 'debit'; // Crédito (adicionar) ou Débito (subtrair)
  description: string;
  relatedConversionId?: string; // ID da conversão relacionada
  balanceBefore: number;
  balanceAfter: number;
  createdAt: Date;
}

/**
 * Obtém o saldo atual de uma moeda fiat
 */
export async function getFiatBalance(userId: string, currency: string): Promise<number> {
  try {
    const balanceRef = doc(db, 'users', userId, 'fiatBalances', currency);
    const balanceDoc = await getDoc(balanceRef);

    if (balanceDoc.exists()) {
      return balanceDoc.data().balance || 0;
    }

    return 0;
  } catch (error) {
    console.error(`❌ Erro ao buscar saldo de ${currency}:`, error);
    return 0;
  }
}

/**
 * Atualiza o saldo de uma moeda fiat (adicionar ou subtrair)
 * @param userId - ID do usuário
 * @param currency - Moeda (BRL, USD, etc.)
 * @param amount - Valor a adicionar (positivo) ou subtrair (negativo)
 * @param description - Descrição da transação
 * @param relatedConversionId - ID da conversão relacionada (opcional)
 */
export async function updateFiatBalance(
  userId: string,
  currency: string,
  amount: number,
  description: string,
  relatedConversionId?: string
): Promise<{ success: boolean; newBalance: number; message?: string }> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 500; // 500ms
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`💰 Atualizando saldo fiat ${currency} (tentativa ${attempt}/${MAX_RETRIES}):`, amount);
      
      const balanceRef = doc(db, 'users', userId, 'fiatBalances', currency);
      const balanceDoc = await getDoc(balanceRef);

      let currentBalance = 0;

      if (balanceDoc.exists()) {
        currentBalance = balanceDoc.data().balance || 0;
      }

      const newBalance = currentBalance + amount;

      // Validar se o saldo não ficará negativo
      if (newBalance < 0) {
        return {
          success: false,
          newBalance: currentBalance,
          message: `Saldo insuficiente. Saldo atual: ${currentBalance.toFixed(2)} ${currency}`,
        };
      }

      // Atualizar ou criar o saldo
      if (balanceDoc.exists()) {
        await updateDoc(balanceRef, {
          balance: newBalance,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(balanceRef, {
          currency,
          balance: newBalance,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      console.log(`✅ Saldo de ${currency} atualizado: ${currentBalance.toFixed(2)} → ${newBalance.toFixed(2)}`);

      // Registrar transação no histórico
      await saveFiatTransaction(userId, {
        userId,
        currency,
        amount: Math.abs(amount),
        type: amount >= 0 ? 'credit' : 'debit',
        description,
        relatedConversionId,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        createdAt: new Date(),
      });

      return {
        success: true,
        newBalance,
      };
      
    } catch (error: any) {
      console.error(`❌ Erro ao atualizar saldo de ${currency} (tentativa ${attempt}/${MAX_RETRIES}):`, error);
      
      // Se for o último retry, retornar erro
      if (attempt === MAX_RETRIES) {
        return {
          success: false,
          newBalance: 0,
          message: error instanceof Error ? error.message : 'Erro ao atualizar saldo',
        };
      }
      
      // Aguardar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
    }
  }
  
  // Fallback (não deveria chegar aqui)
  return {
    success: false,
    newBalance: 0,
    message: 'Erro inesperado ao atualizar saldo',
  };
}

/**
 * Salva uma transação fiat no histórico
 */
async function saveFiatTransaction(
  userId: string,
  transaction: Omit<FiatTransaction, 'id'>
): Promise<void> {
  try {
    const transactionRef = doc(db, 'users', userId, 'fiatTransactions', `${Date.now()}`);
    
    // Remove campos undefined antes de salvar no Firestore
    const transactionData: any = {
      userId: transaction.userId,
      currency: transaction.currency,
      amount: transaction.amount,
      type: transaction.type,
      description: transaction.description,
      balanceBefore: transaction.balanceBefore,
      balanceAfter: transaction.balanceAfter,
      createdAt: serverTimestamp(),
    };

    // Apenas adicionar relatedConversionId se não for undefined
    if (transaction.relatedConversionId !== undefined) {
      transactionData.relatedConversionId = transaction.relatedConversionId;
    }

    await setDoc(transactionRef, transactionData);

    console.log('✅ Transação fiat salva no histórico');
  } catch (error) {
    console.error('❌ Erro ao salvar transação fiat:', error);
  }
}

/**
 * Verifica se há saldo suficiente para uma operação
 */
export async function hasEnoughFiatBalance(
  userId: string,
  currency: string,
  requiredAmount: number
): Promise<boolean> {
  const balance = await getFiatBalance(userId, currency);
  return balance >= requiredAmount;
}

/**
 * Formata valor em moeda fiat
 */
export function formatFiatAmount(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    BRL: 'R$',
    USD: '$',
    EUR: '€',
    GBP: '£',
    CHF: 'CHF',
    CAD: 'CA$',
    AUD: 'A$',
    MXN: 'MX$',
    ARS: 'AR$',
    CLP: 'CL$',
    COP: 'CO$',
  };

  const symbol = symbols[currency] || currency;
  return `${symbol} ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}