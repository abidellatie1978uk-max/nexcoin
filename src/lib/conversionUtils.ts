import { collection, addDoc, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface Conversion {
  id?: string;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  exchangeRate: number;
  fee: number;
  feePercentage: number;
  conversionMode: 'crypto-crypto' | 'crypto-fiat' | 'fiat-fiat';
  fromCoinId?: string; // ID do CoinGecko (apenas para crypto)
  toCoinId?: string; // ID do CoinGecko (apenas para crypto)
  fromName?: string; // Nome da moeda/cripto de origem
  toName?: string; // Nome da moeda/cripto de destino
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Salva uma conversão no Firestore
 */
export async function saveConversion(
  userId: string,
  conversionData: Omit<Conversion, 'id' | 'createdAt'>
): Promise<string> {
  try {
    console.log('💾 Salvando conversão:', conversionData);
    
    if (!userId) {
      throw new Error('userId é obrigatório');
    }

    const conversionsRef = collection(db, 'users', userId, 'conversions');
    
    // Remover campos undefined antes de salvar
    const dataToSave: any = {
      fromCurrency: conversionData.fromCurrency,
      toCurrency: conversionData.toCurrency,
      fromAmount: conversionData.fromAmount,
      toAmount: conversionData.toAmount,
      exchangeRate: conversionData.exchangeRate,
      fee: conversionData.fee,
      feePercentage: conversionData.feePercentage,
      conversionMode: conversionData.conversionMode,
      status: conversionData.status,
      createdAt: Timestamp.fromDate(new Date()),
      completedAt: conversionData.status === 'completed' 
        ? Timestamp.fromDate(new Date()) 
        : null,
    };

    // Adicionar campos opcionais apenas se não forem undefined
    if (conversionData.fromCoinId !== undefined) {
      dataToSave.fromCoinId = conversionData.fromCoinId;
    }
    if (conversionData.toCoinId !== undefined) {
      dataToSave.toCoinId = conversionData.toCoinId;
    }
    if (conversionData.fromName !== undefined) {
      dataToSave.fromName = conversionData.fromName;
    }
    if (conversionData.toName !== undefined) {
      dataToSave.toName = conversionData.toName;
    }

    const docRef = await addDoc(conversionsRef, dataToSave);

    console.log('✅ Conversão salva com ID:', docRef.id);
    
    // ✅ NOVO: Criar também uma transação de conversão no histórico
    try {
      const transactionsRef = collection(db, 'users', userId, 'transactions');
      await addDoc(transactionsRef, {
        type: 'convert',
        status: conversionData.status,
        amount: conversionData.toAmount,
        currency: conversionData.toCurrency,
        fromAmount: conversionData.fromAmount,
        fromCurrency: conversionData.fromCurrency,
        toAmount: conversionData.toAmount,
        toCurrency: conversionData.toCurrency,
        fee: conversionData.fee || 0,
        feeCurrency: conversionData.fromCurrency,
        description: `Conversão de ${conversionData.fromAmount} ${conversionData.fromCurrency} para ${conversionData.toAmount} ${conversionData.toCurrency}`,
        createdAt: Timestamp.fromDate(new Date()), // ✅ Usar Timestamp do Firestore
        completedAt: conversionData.status === 'completed' ? Timestamp.fromDate(new Date()) : null,
      });
      console.log('✅ Transação de conversão criada no histórico');
    } catch (txError) {
      console.error('⚠️ Erro ao criar transação de conversão (não crítico):', txError);
      // Não falhar a conversão se a transação não for criada
    }
    
    return docRef.id;
  } catch (error) {
    console.error('❌ Erro ao salvar conversão:', error);
    throw error;
  }
}

/**
 * Busca o histórico de conversões do usuário
 */
export async function getConversionHistory(
  userId: string,
  limitCount: number = 50
): Promise<Conversion[]> {
  try {
    console.log('🔍 Buscando histórico de conversões para userId:', userId);
    
    if (!userId) {
      console.warn('⚠️ userId vazio');
      return [];
    }

    const conversionsRef = collection(db, 'users', userId, 'conversions');
    const q = query(
      conversionsRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    
    const conversions: Conversion[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      conversions.push({
        id: doc.id,
        fromCurrency: data.fromCurrency,
        toCurrency: data.toCurrency,
        fromAmount: data.fromAmount,
        toAmount: data.toAmount,
        exchangeRate: data.exchangeRate,
        fee: data.fee,
        feePercentage: data.feePercentage,
        conversionMode: data.conversionMode,
        fromCoinId: data.fromCoinId,
        toCoinId: data.toCoinId,
        fromName: data.fromName,
        toName: data.toName,
        status: data.status,
        createdAt: data.createdAt?.toDate() || new Date(),
        completedAt: data.completedAt?.toDate(),
      });
    });

    console.log('✅ Conversões encontradas:', conversions.length);
    return conversions;
  } catch (error) {
    console.error('❌ Erro ao buscar histórico de conversões:', error);
    return [];
  }
}

/**
 * Calcula a taxa de conversão (0.5% padrão)
 */
export function calculateConversionFee(
  amount: number,
  feePercentage: number = 0.5
): number {
  return amount * (feePercentage / 100);
}

/**
 * Valida se o usuário tem saldo suficiente para a conversão
 */
export function hasEnoughBalance(
  userBalance: number,
  requiredAmount: number,
  fee: number
): boolean {
  return userBalance >= (requiredAmount + fee);
}