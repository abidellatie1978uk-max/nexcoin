import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Sistema de Auditoria para rastrear todas as operações de conversão
 */

export interface AuditLog {
  id?: string;
  userId: string;
  operation: 'conversion_start' | 'conversion_success' | 'conversion_failed' | 'conversion_rollback';
  conversionId?: string;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  conversionMode: 'crypto-crypto' | 'crypto-fiat' | 'fiat-fiat';
  balancesBefore?: {
    from: number;
    to: number;
  };
  balancesAfter?: {
    from: number;
    to: number;
  };
  errorMessage?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Salva um log de auditoria no Firestore
 */
export async function saveAuditLog(
  userId: string,
  logData: Omit<AuditLog, 'id' | 'userId' | 'timestamp'>
): Promise<void> {
  try {
    // Verifica se o userId é válido
    if (!userId || userId.trim() === '') {
      console.warn('⚠️ userId inválido para salvar log de auditoria');
      return;
    }

    const auditRef = doc(
      db,
      'users',
      userId,
      'auditLogs',
      `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    );

    const auditLog = {
      userId,
      operation: logData.operation,
      fromCurrency: logData.fromCurrency,
      toCurrency: logData.toCurrency,
      fromAmount: logData.fromAmount,
      toAmount: logData.toAmount,
      conversionMode: logData.conversionMode,
      balancesBefore: logData.balancesBefore || null,
      balancesAfter: logData.balancesAfter || null,
      conversionId: logData.conversionId || null,
      errorMessage: logData.errorMessage || null,
      metadata: logData.metadata || null,
      timestamp: serverTimestamp(),
      // Pode adicionar informações de contexto
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    };

    await setDoc(auditRef, auditLog);

    console.log('📝 Log de auditoria salvo:', logData.operation);
  } catch (error) {
    // Não falhar a operação se o log falhar - apenas silenciosamente registra o erro
    // Isso evita que problemas de auditoria quebrem o fluxo principal
    if (error instanceof Error && error.message?.includes('permission-denied')) {
      console.warn('⚠️ Log de auditoria desabilitado (permissão negada)');
    } else {
      console.error('❌ Erro ao salvar log de auditoria:', error);
    }
  }
}

/**
 * Helper para criar snapshot de saldos
 */
export function createBalanceSnapshot(from: number, to: number) {
  return {
    from: Number(from.toFixed(8)),
    to: Number(to.toFixed(8)),
  };
}