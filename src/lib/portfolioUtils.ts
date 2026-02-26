import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc, query } from 'firebase/firestore';
import { db } from './firebase';

export interface Holding {
  symbol: string;
  coinId: string;
  amount: number;
  name?: string;
  valueUsd?: number; // Valor total em USD (amount * price)
  updatedAt?: Date;
}

/**
 * Busca todos os ativos do usuário da coleção /users/{userId}/portfolio
 */
export async function getUserHoldings(userId: string): Promise<Holding[]> {
  try {
    console.log('🔍 Buscando ativos do portfolio para userId:', userId);
    const portfolioRef = collection(db, 'users', userId, 'portfolio');
    const snapshot = await getDocs(portfolioRef);
    
    const holdings: Holding[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      holdings.push({
        symbol: data.symbol,
        coinId: data.coinId,
        amount: data.amount,
        name: data.name,
        valueUsd: data.valueUsd || 0, // Garantir que sempre tenha um valor
        updatedAt: data.updatedAt?.toDate(),
      });
    });
    
    console.log('✅ Ativos do portfolio encontrados:', holdings.length);
    return holdings;
  } catch (error) {
    console.error('❌ Erro ao buscar ativos do portfolio:', error);
    if (error instanceof Error) {
      console.error('❌ Mensagem:', error.message);
      console.error('❌ Stack:', error.stack);
    }
    return [];
  }
}

/**
 * Adiciona ou atualiza um ativo específico no portfolio
 */
export async function addOrUpdateHolding(
  userId: string,
  symbol: string,
  coinId: string,
  amount: number,
  name?: string,
  valueUsd?: number
): Promise<void> {
  try {
    console.log('💾 Salvando ativo no portfolio:', { userId, symbol, coinId, amount, name, valueUsd });
    
    if (!userId) {
      console.warn('⚠️ userId vazio, cancelando salvamento');
      return;
    }
    
    // Cada cripto é um documento separado na coleção portfolio
    const portfolioRef = doc(db, 'users', userId, 'portfolio', symbol);
    
    await setDoc(portfolioRef, {
      symbol,
      coinId,
      amount,
      name: name || symbol,
      valueUsd: valueUsd || 0,
      updatedAt: new Date(),
    }, { merge: true });
    
    console.log('✅ Ativo salvo no portfolio com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao salvar ativo no portfolio:', error);
    if (error instanceof Error) {
      console.error('❌ Mensagem:', error.message);
      console.error('❌ Stack:', error.stack);
    }
    throw error;
  }
}

/**
 * Remove um ativo específico do portfolio
 */
export async function removeHolding(userId: string, symbol: string): Promise<void> {
  try {
    console.log('🗑️ Removendo ativo do portfolio:', symbol);
    const portfolioRef = doc(db, 'users', userId, 'portfolio', symbol);
    await deleteDoc(portfolioRef);
    console.log('✅ Ativo removido do portfolio com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao remover ativo do portfolio:', error);
    throw error;
  }
}

/**
 * Atualiza o saldo de um ativo específico no portfolio
 */
export async function updateCryptoBalance(
  userId: string,
  symbol: string,
  coinId: string,
  deltaAmount: number, // Quanto adicionar ou remover (negativo para remover)
  name?: string,
  priceUsd?: number // Preço atual em USD para calcular valueUsd
): Promise<void> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 500; // 500ms
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`💰 Atualizando saldo (tentativa ${attempt}/${MAX_RETRIES}):`, { symbol, deltaAmount });
      
      const portfolioRef = doc(db, 'users', userId, 'portfolio', symbol);
      const portfolioSnap = await getDoc(portfolioRef);
      
      if (portfolioSnap.exists()) {
        // Atualizar saldo existente
        const currentAmount = portfolioSnap.data().amount || 0;
        const newAmount = currentAmount + deltaAmount;
        
        if (newAmount <= 0) {
          // Remover ativo se saldo for zero ou negativo
          await deleteDoc(portfolioRef);
          console.log('✅ Ativo removido (saldo zerado)');
        } else {
          // Calcular novo valor em USD
          const valueUsd = priceUsd ? newAmount * priceUsd : 0;
          
          // Atualizar saldo
          await updateDoc(portfolioRef, {
            amount: newAmount,
            valueUsd,
            updatedAt: new Date(),
          });
          console.log('✅ Saldo atualizado:', newAmount, 'valueUsd:', valueUsd);
        }
      } else if (deltaAmount > 0) {
        // Criar novo ativo se não existir e deltaAmount for positivo
        const valueUsd = priceUsd ? deltaAmount * priceUsd : 0;
        await addOrUpdateHolding(userId, symbol, coinId, deltaAmount, name, valueUsd);
        console.log('✅ Novo ativo criado com saldo:', deltaAmount);
      }
      
      // Sucesso - sair do loop
      return;
      
    } catch (error: any) {
      console.error(`❌ Erro ao atualizar saldo (tentativa ${attempt}/${MAX_RETRIES}):`, error);
      
      // Se for o último retry, lançar o erro
      if (attempt === MAX_RETRIES) {
        throw error;
      }
      
      // Aguardar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
    }
  }
}

/**
 * @deprecated - Não usado mais com a nova estrutura de coleção
 */
export async function updateUserHoldings(userId: string, holdings: Holding[]): Promise<void> {
  console.warn('⚠️ updateUserHoldings está deprecated. Use addOrUpdateHolding para cada ativo.');
}

/**
 * @deprecated - Não usado mais com a nova estrutura de coleção
 */
export async function initializeUserPortfolio(userId: string): Promise<void> {
  console.log('ℹ️ initializeUserPortfolio não é necessário com a nova estrutura de coleção');
}

/**
 * Atualiza os valores em USD de todos os ativos do portfolio com base nos preços atuais
 */
export async function syncWalletValues(
  userId: string, 
  prices: { [coinId: string]: { usd: number } }
): Promise<void> {
  try {
    if (!userId) {
      console.warn('⚠️ userId vazio, cancelando sincronização');
      return;
    }

    if (!prices || Object.keys(prices).length === 0) {
      console.warn('⚠️ Preços vazios, cancelando sincronização');
      return;
    }

    console.log('🔄 Sincronizando valores do portfolio com preços atuais...');
    
    // Buscar todos os ativos do portfolio
    const portfolioRef = collection(db, 'users', userId, 'portfolio');
    const snapshot = await getDocs(portfolioRef);
    
    if (snapshot.empty) {
      console.log('ℹ️ Nenhum ativo encontrado para sincronizar');
      return;
    }
    
    // Atualizar cada ativo com o valor em USD
    const updatePromises = snapshot.docs.map(async (docSnapshot) => {
      try {
        const data = docSnapshot.data();
        const { coinId, amount, symbol } = data;
        
        if (!coinId || amount === undefined) {
          console.warn(`⚠️ Dados inválidos para ativo ${docSnapshot.id}:`, {
            symbol: data.symbol || 'N/A',
            coinId: coinId || 'AUSENTE',
            amount: amount !== undefined ? amount : 'AUSENTE',
          });
          console.warn('💡 Este documento será removido no próximo login');
          return;
        }
        
        // Buscar preço atual da moeda
        const priceData = prices[coinId];
        if (!priceData || !priceData.usd) {
          console.warn(`⚠️ Preço não encontrado para ${coinId} (${symbol || docSnapshot.id})`);
          return;
        }
        
        // Calcular valor em USD
        const valueUsd = amount * priceData.usd;
        
        // Atualizar apenas o campo valueUsd no Firestore
        const assetRef = doc(db, 'users', userId, 'portfolio', docSnapshot.id);
        await updateDoc(assetRef, {
          valueUsd,
          updatedAt: new Date(),
        });
        
        console.log(`✅ Ativo ${docSnapshot.id} atualizado: ${amount} x $${priceData.usd.toFixed(2)} = $${valueUsd.toFixed(2)}`);
      } catch (error) {
        console.error(`❌ Erro ao atualizar ativo ${docSnapshot.id}:`, error);
        // Continuar com os outros ativos mesmo se um falhar
      }
    });
    
    await Promise.all(updatePromises);
    console.log('✅ Sincronização de valores concluída!');
  } catch (error) {
    console.error('❌ Erro ao sincronizar valores do portfolio:', error);
    // Não propagar o erro para não quebrar a aplicação
  }
}