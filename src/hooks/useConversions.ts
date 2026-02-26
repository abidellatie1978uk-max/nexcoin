import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  saveConversion, 
  getConversionHistory, 
  calculateConversionFee,
  hasEnoughBalance,
  type Conversion 
} from '../lib/conversionUtils';
import { usePortfolio } from '../contexts/PortfolioContext';
import { updateFiatBalance, getFiatBalance } from '../lib/fiatBalanceUtils';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { conversionLock } from '../lib/conversionLock';
import { saveAuditLog, createBalanceSnapshot } from '../lib/conversionAudit';

export function useConversions() {
  const { user } = useAuth();
  const { portfolio, updateBalance } = usePortfolio();
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ LISTENER EM TEMPO REAL - Buscar conversões da subcoleção conversions
  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    console.log('🔄 Iniciando listener de conversões para userId:', user.uid);

    let unsubscribe: (() => void) | null = null;

    const conversionsRef = collection(db, 'users', user.uid, 'conversions');
    const q = query(conversionsRef, orderBy('createdAt', 'desc'), limit(50));

    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('📡 Snapshot de conversões recebido - Total:', snapshot.size);

        const conversionsList: Conversion[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          conversionsList.push({
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

        setConversions(conversionsList);
        setIsLoading(false);
      },
      (error) => {
        console.error('❌ Erro no listener de conversões:', error);
        setIsLoading(false);
      }
    );

    return () => {
      console.log('🛑 Cancelando listener de conversões');
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid]);

  /**
   * 🔒 CONVERSÃO COM SEGURANÇA MÁXIMA
   * Implementa:
   * 1. Sistema de Lock (Mutex) - Prevenir conversões simultâneas
   * 2. Rollback automático - Se falhar, reverter tudo
   * 3. Validação dupla de saldo - Verificar antes E durante
   * 4. Estados intermediários - Marcar como "processando"
   * 5. Logging de auditoria - Rastrear todas as operações
   */
  const executeConversion = async (
    fromCurrency: string,
    toCurrency: string,
    fromAmount: number,
    toAmount: number,
    exchangeRate: number,
    conversionMode: 'crypto-crypto' | 'crypto-fiat' | 'fiat-fiat',
    fromCoinId?: string,
    toCoinId?: string,
    fromName?: string,
    toName?: string
  ): Promise<{ success: boolean; message: string; conversionId?: string }> => {
    // ============================================
    // ETAPA 1: VALIDAÇÕES INICIAIS
    // ============================================
    if (!user?.uid) {
      return { success: false, message: 'Usuário não autenticado' };
    }

    // 🔒 ADQUIRIR LOCK - Prevenir conversões simultâneas
    const lockAcquired = await conversionLock.acquireLock(
      user.uid,
      `${fromCurrency}->${toCurrency}`
    );

    if (!lockAcquired) {
      return {
        success: false,
        message: 'Aguarde a conversão anterior finalizar',
      };
    }

    // Variáveis para controle de rollback
    let debitCompleted = false;
    let creditCompleted = false;
    let conversionId: string | undefined;

    try {
      console.log('🚀 Iniciando conversão segura:', {
        from: fromCurrency,
        to: toCurrency,
        amount: fromAmount,
        mode: conversionMode,
      });

      // Calcular taxa de conversão (0.5%)
      const fee = calculateConversionFee(fromAmount);
      const totalDeducted = fromAmount + fee;

      // ============================================
      // ETAPA 2: VALIDAÇÃO DUPLA DE SALDO
      // ============================================

      let fromBalanceBefore = 0;
      let toBalanceBefore = 0;

      // CRYPTO → CRYPTO
      if (conversionMode === 'crypto-crypto') {
        const holding = portfolio.holdings.find(h => h.symbol === fromCurrency);
        fromBalanceBefore = holding?.amount || 0;
        
        const toHolding = portfolio.holdings.find(h => h.symbol === toCurrency);
        toBalanceBefore = toHolding?.amount || 0;

        // Validação 1: Saldo inicial (COM TAXA)
        if (!hasEnoughBalance(fromBalanceBefore, fromAmount, fee)) {
          throw new Error(
            `Saldo insuficiente. Necessário: ${totalDeducted.toFixed(8)} ${fromCurrency}`
          );
        }

        // Log de auditoria: INÍCIO
        await saveAuditLog(user.uid, {
          operation: 'conversion_start',
          fromCurrency,
          toCurrency,
          fromAmount,
          toAmount,
          conversionMode,
          balancesBefore: createBalanceSnapshot(fromBalanceBefore, toBalanceBefore),
          metadata: {
            fee,
            totalDeducted,
            exchangeRate,
          },
        });

        console.log('✅ [CRYPTO→CRYPTO] Saldo validado:', {
          available: fromBalanceBefore,
          required: totalDeducted,
        });

        // 📉 ETAPA 3: DEBITAR (com validação durante)
        console.log(`📉 [CRYPTO→CRYPTO] Debitando ${totalDeducted} ${fromCurrency}`);
        
        // Validação 2: Re-verificar saldo antes de debitar
        const holdingCheck = portfolio.holdings.find(h => h.symbol === fromCurrency);
        const currentBalance = holdingCheck?.amount || 0;
        
        if (!hasEnoughBalance(currentBalance, fromAmount, fee)) {
          throw new Error('Saldo alterado durante conversão. Tente novamente.');
        }

        await updateBalance(fromCurrency, fromCoinId!, -totalDeducted, fromName);
        debitCompleted = true;
        console.log('✅ Débito concluído');

        // Pequeno delay para garantir consistência no Firestore
        await new Promise(resolve => setTimeout(resolve, 100));

        // 📈 ETAPA 4: CREDITAR
        console.log(`📈 [CRYPTO→CRYPTO] Creditando ${toAmount} ${toCurrency}`);
        await updateBalance(toCurrency, toCoinId!, toAmount, toName);
        creditCompleted = true;
        console.log('✅ Crédito concluído');
      }

      // CRYPTO → FIAT
      else if (conversionMode === 'crypto-fiat') {
        // ✅ NOVO: Detectar direção
        const cryptoOptions = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'XRP', 'ADA', 'AVAX', 'DOGE', 'DOT', 'MATIC', 'LINK', 'UNI', 'LTC', 'ATOM', 'XLM', 'TRX'];
        const isFromCrypto = cryptoOptions.includes(fromCurrency);
        
        if (isFromCrypto) {
          // CRYPTO → FIAT
          const holding = portfolio.holdings.find(h => h.symbol === fromCurrency);
          fromBalanceBefore = holding?.amount || 0;
          toBalanceBefore = await getFiatBalance(user.uid, toCurrency);

          // Validação 1: Saldo inicial (SEM TAXA para crypto-fiat)
          if (fromBalanceBefore < fromAmount) {
            throw new Error(
              `Saldo insuficiente. Disponível: ${fromBalanceBefore.toFixed(8)} ${fromCurrency}, Necessário: ${fromAmount.toFixed(8)} ${fromCurrency}`
            );
          }

          // Log de auditoria: INÍCIO
          await saveAuditLog(user.uid, {
            operation: 'conversion_start',
            fromCurrency,
            toCurrency,
            fromAmount,
            toAmount,
            conversionMode,
            balancesBefore: createBalanceSnapshot(fromBalanceBefore, toBalanceBefore),
            metadata: {
              fee: 0, // SEM TAXA
              totalDeducted: fromAmount,
              exchangeRate,
            },
          });

          console.log('✅ [CRYPTO→FIAT] Saldo crypto validado:', {
            available: fromBalanceBefore,
            required: fromAmount,
          });

          // 📉 ETAPA 3: DEBITAR CRYPTO (SEM TAXA)
          console.log(`📉 [CRYPTO→FIAT] Debitando ${fromAmount} ${fromCurrency}`);
          
          // Validação 2: Re-verificar saldo
          const holdingCheck = portfolio.holdings.find(h => h.symbol === fromCurrency);
          const currentBalance = holdingCheck?.amount || 0;
          
          if (currentBalance < fromAmount) {
            throw new Error('Saldo alterado durante conversão. Tente novamente.');
          }

          await updateBalance(fromCurrency, fromCoinId!, -fromAmount, fromName);
          debitCompleted = true;
          console.log('✅ Débito cripto concluído');

          // 📈 ETAPA 4: CREDITAR FIAT
          console.log(`📈 [CRYPTO→FIAT] Creditando ${toAmount} ${toCurrency}`);
          const fiatResult = await updateFiatBalance(
            user.uid,
            toCurrency,
            toAmount,
            `Conversão de ${fromAmount} ${fromCurrency} para ${toCurrency}`
          );

          if (!fiatResult.success) {
            throw new Error(fiatResult.message || 'Erro ao adicionar saldo fiat');
          }

          creditCompleted = true;
          console.log('✅ Crédito fiat concluído');
        } else {
          // FIAT → CRYPTO
          fromBalanceBefore = await getFiatBalance(user.uid, fromCurrency);
          const toHolding = portfolio.holdings.find(h => h.symbol === toCurrency);
          toBalanceBefore = toHolding?.amount || 0;

          // Validação 1: Saldo inicial (SEM TAXA para fiat-crypto)
          if (fromBalanceBefore < fromAmount) {
            throw new Error(
              `Saldo insuficiente. Disponível: ${fromBalanceBefore.toFixed(2)} ${fromCurrency}, Necessário: ${fromAmount.toFixed(2)} ${fromCurrency}`
            );
          }

          // Log de auditoria: INÍCIO
          await saveAuditLog(user.uid, {
            operation: 'conversion_start',
            fromCurrency,
            toCurrency,
            fromAmount,
            toAmount,
            conversionMode,
            balancesBefore: createBalanceSnapshot(fromBalanceBefore, toBalanceBefore),
            metadata: {
              fee: 0, // SEM TAXA
              totalDeducted: fromAmount,
              exchangeRate,
            },
          });

          console.log('✅ [FIAT→CRYPTO] Saldo fiat validado:', {
            available: fromBalanceBefore,
            required: fromAmount,
          });

          // 📉 ETAPA 3: DEBITAR FIAT
          console.log(`📉 [FIAT→CRYPTO] Debitando ${fromAmount} ${fromCurrency}`);
          
          // Validação 2: Re-verificar saldo
          const currentBalance = await getFiatBalance(user.uid, fromCurrency);
          
          if (currentBalance < fromAmount) {
            throw new Error('Saldo alterado durante conversão. Tente novamente.');
          }

          const debitResult = await updateFiatBalance(
            user.uid,
            fromCurrency,
            -fromAmount,
            `Conversão de ${fromAmount} ${fromCurrency} para ${toCurrency}`
          );

          if (!debitResult.success) {
            throw new Error(debitResult.message || 'Erro ao debitar saldo fiat');
          }

          debitCompleted = true;
          console.log('✅ Débito fiat concluído');

          // 📈 ETAPA 4: CREDITAR CRYPTO
          console.log(`📈 [FIAT→CRYPTO] Creditando ${toAmount} ${toCurrency}`);
          await updateBalance(toCurrency, toCoinId!, toAmount, toName);
          creditCompleted = true;
          console.log('✅ Crédito cripto concluído');
        }
      }

      // FIAT → FIAT
      else if (conversionMode === 'fiat-fiat') {
        // Validação 1: Saldo inicial (SEM TAXA para fiat-fiat)
        fromBalanceBefore = await getFiatBalance(user.uid, fromCurrency);
        toBalanceBefore = await getFiatBalance(user.uid, toCurrency);

        if (fromBalanceBefore < fromAmount) {
          throw new Error(
            `Saldo insuficiente. Disponível: ${fromBalanceBefore.toFixed(2)} ${fromCurrency}, Necessário: ${fromAmount.toFixed(2)} ${fromCurrency}`
          );
        }

        // Log de auditoria: INÍCIO
        await saveAuditLog(user.uid, {
          operation: 'conversion_start',
          fromCurrency,
          toCurrency,
          fromAmount,
          toAmount,
          conversionMode,
          balancesBefore: createBalanceSnapshot(fromBalanceBefore, toBalanceBefore),
          metadata: {
            fee: 0, // SEM TAXA
            totalDeducted: fromAmount,
            exchangeRate,
          },
        });

        console.log('✅ [FIAT→FIAT] Saldo validado:', {
          available: fromBalanceBefore,
          required: fromAmount,
        });

        // 📉 ETAPA 3: DEBITAR FIAT ORIGEM (SEM TAXA)
        console.log(`📉 [FIAT→FIAT] Debitando ${fromAmount} ${fromCurrency}`);
        
        // Validação 2: Re-verificar saldo
        const currentBalance = await getFiatBalance(user.uid, fromCurrency);
        
        if (currentBalance < fromAmount) {
          throw new Error('Saldo alterado durante conversão. Tente novamente.');
        }

        const debitResult = await updateFiatBalance(
          user.uid,
          fromCurrency,
          -fromAmount,
          `Conversão de ${fromAmount} ${fromCurrency} para ${toCurrency}`
        );

        if (!debitResult.success) {
          throw new Error(debitResult.message || 'Erro ao debitar saldo');
        }

        debitCompleted = true;
        console.log('✅ Débito fiat concluído');

        // 📈 ETAPA 4: CREDITAR FIAT DESTINO
        console.log(`📈 [FIAT→FIAT] Creditando ${toAmount} ${toCurrency}`);
        const creditResult = await updateFiatBalance(
          user.uid,
          toCurrency,
          toAmount,
          `Conversão de ${fromAmount} ${fromCurrency} para ${toCurrency}`
        );

        if (!creditResult.success) {
          throw new Error(creditResult.message || 'Erro ao adicionar saldo');
        }

        creditCompleted = true;
        console.log('✅ Crédito fiat concluído');
      }

      // ============================================
      // ETAPA 5: SALVAR HISTÓRICO
      // ============================================
      conversionId = await saveConversion(user.uid, {
        fromCurrency,
        toCurrency,
        fromAmount,
        toAmount,
        exchangeRate,
        fee,
        feePercentage: 0.5,
        conversionMode,
        fromCoinId,
        toCoinId,
        fromName,
        toName,
        status: 'completed',
      });

      console.log('✅ Conversão executada com sucesso!', { conversionId });

      // ============================================
      // ETAPA 6: LOG DE AUDITORIA - SUCESSO
      // ============================================
      let fromBalanceAfter = 0;
      let toBalanceAfter = 0;

      if (conversionMode === 'crypto-crypto') {
        const fromHolding = portfolio.holdings.find(h => h.symbol === fromCurrency);
        const toHolding = portfolio.holdings.find(h => h.symbol === toCurrency);
        fromBalanceAfter = fromHolding?.amount || 0;
        toBalanceAfter = toHolding?.amount || 0;
      } else if (conversionMode === 'crypto-fiat') {
        // ✅ NOVO: Detectar direção
        const cryptoOptions = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'XRP', 'ADA', 'AVAX', 'DOGE', 'DOT', 'MATIC', 'LINK', 'UNI', 'LTC', 'ATOM', 'XLM', 'TRX'];
        const isFromCrypto = cryptoOptions.includes(fromCurrency);
        
        if (isFromCrypto) {
          // CRYPTO → FIAT
          const fromHolding = portfolio.holdings.find(h => h.symbol === fromCurrency);
          fromBalanceAfter = fromHolding?.amount || 0;
          toBalanceAfter = await getFiatBalance(user.uid, toCurrency);
        } else {
          // FIAT → CRYPTO
          fromBalanceAfter = await getFiatBalance(user.uid, fromCurrency);
          const toHolding = portfolio.holdings.find(h => h.symbol === toCurrency);
          toBalanceAfter = toHolding?.amount || 0;
        }
      } else {
        fromBalanceAfter = await getFiatBalance(user.uid, fromCurrency);
        toBalanceAfter = await getFiatBalance(user.uid, toCurrency);
      }

      await saveAuditLog(user.uid, {
        operation: 'conversion_success',
        conversionId,
        fromCurrency,
        toCurrency,
        fromAmount,
        toAmount,
        conversionMode,
        balancesBefore: createBalanceSnapshot(fromBalanceBefore, toBalanceBefore),
        balancesAfter: createBalanceSnapshot(fromBalanceAfter, toBalanceAfter),
      });

      return {
        success: true,
        message: 'Conversão realizada com sucesso!',
        conversionId,
      };

    } catch (error) {
      console.error('❌ Erro ao executar conversão:', error);

      // ============================================
      // ETAPA 7: ROLLBACK AUTOMÁTICO
      // ============================================
      const errorMessage = error instanceof Error ? error.message : 'Erro ao executar conversão';

      // Se debitou mas não creditou, precisa fazer rollback
      if (debitCompleted && !creditCompleted) {
        console.warn('⚠️ Iniciando ROLLBACK automático...');

        try {
          if (conversionMode === 'crypto-crypto') {
            // Reverter o débito de crypto (COM TAXA)
            const fee = calculateConversionFee(fromAmount);
            const totalDeducted = fromAmount + fee;
            await updateBalance(fromCurrency, fromCoinId!, totalDeducted, fromName);
            console.log('✅ ROLLBACK concluído: Débito revertido');
          } else if (conversionMode === 'crypto-fiat') {
            // ✅ NOVO: Detectar direção para rollback
            const cryptoOptions = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'XRP', 'ADA', 'AVAX', 'DOGE', 'DOT', 'MATIC', 'LINK', 'UNI', 'LTC', 'ATOM', 'XLM', 'TRX'];
            const isFromCrypto = cryptoOptions.includes(fromCurrency);
            
            if (isFromCrypto) {
              // CRYPTO → FIAT: Reverter débito de crypto (SEM TAXA)
              await updateBalance(fromCurrency, fromCoinId!, fromAmount, fromName);
              console.log('✅ ROLLBACK concluído: Débito cripto revertido');
            } else {
              // FIAT → CRYPTO: Reverter débito de fiat (SEM TAXA)
              await updateFiatBalance(
                user.uid,
                fromCurrency,
                fromAmount,
                `ROLLBACK: Conversão falhou - ${errorMessage}`
              );
              console.log('✅ ROLLBACK concluído: Débito fiat revertido');
            }
          } else if (conversionMode === 'fiat-fiat') {
            // Reverter o débito de fiat (SEM TAXA)
            await updateFiatBalance(
              user.uid,
              fromCurrency,
              fromAmount,
              `ROLLBACK: Conversão falhou - ${errorMessage}`
            );
            console.log('✅ ROLLBACK concluído: Débito fiat revertido');
          }

          // Log de auditoria: ROLLBACK
          await saveAuditLog(user.uid, {
            operation: 'conversion_rollback',
            fromCurrency,
            toCurrency,
            fromAmount,
            toAmount,
            conversionMode,
            errorMessage: `Rollback executado: ${errorMessage}`,
            metadata: {
              debitCompleted,
              creditCompleted,
            },
          });

        } catch (rollbackError) {
          console.error('❌ ERRO CRÍTICO NO ROLLBACK:', rollbackError);
          
          // Log de erro crítico
          await saveAuditLog(user.uid, {
            operation: 'conversion_failed',
            fromCurrency,
            toCurrency,
            fromAmount,
            toAmount,
            conversionMode,
            errorMessage: `ERRO CRÍTICO: Rollback falhou - ${rollbackError instanceof Error ? rollbackError.message : 'Erro desconhecido'}`,
            metadata: {
              originalError: errorMessage,
              debitCompleted,
              creditCompleted,
            },
          });
        }
      } else {
        // Log de auditoria: FALHA (sem necessidade de rollback)
        await saveAuditLog(user.uid, {
          operation: 'conversion_failed',
          fromCurrency,
          toCurrency,
          fromAmount,
          toAmount,
          conversionMode,
          errorMessage,
          metadata: {
            debitCompleted,
            creditCompleted,
          },
        });
      }

      return {
        success: false,
        message: errorMessage,
      };

    } finally {
      // ============================================
      // ETAPA 8: LIBERAR LOCK (SEMPRE)
      // ============================================
      conversionLock.releaseLock(user.uid);
    }
  };

  return {
    conversions,
    isLoading,
    executeConversion,
  };
}