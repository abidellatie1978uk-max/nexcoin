/**
 * Sistema de Lock (Mutex) para prevenir conversões simultâneas
 * Garante que apenas uma conversão por usuário aconteça por vez
 */

interface LockInfo {
  userId: string;
  timestamp: number;
  operation: string;
}

class ConversionLockManager {
  private locks: Map<string, LockInfo> = new Map();
  private readonly LOCK_TIMEOUT = 30000; // 30 segundos

  /**
   * Tenta adquirir um lock para o usuário
   * Retorna true se conseguiu, false se já existe um lock ativo
   */
  async acquireLock(userId: string, operation: string): Promise<boolean> {
    const existingLock = this.locks.get(userId);

    // Se existe um lock, verifica se expirou
    if (existingLock) {
      const now = Date.now();
      const lockAge = now - existingLock.timestamp;

      // Se o lock está ativo e não expirou, retorna false
      if (lockAge < this.LOCK_TIMEOUT) {
        console.warn('⚠️ Conversão já em andamento para este usuário');
        return false;
      }

      // Lock expirou, remove
      console.warn('⚠️ Lock expirado removido:', existingLock);
      this.locks.delete(userId);
    }

    // Cria novo lock
    this.locks.set(userId, {
      userId,
      timestamp: Date.now(),
      operation,
    });

    console.log('🔒 Lock adquirido:', { userId, operation });
    return true;
  }

  /**
   * Libera o lock de um usuário
   */
  releaseLock(userId: string): void {
    const lock = this.locks.get(userId);
    if (lock) {
      console.log('🔓 Lock liberado:', { userId, duration: Date.now() - lock.timestamp });
      this.locks.delete(userId);
    }
  }

  /**
   * Verifica se existe um lock ativo para o usuário
   */
  hasActiveLock(userId: string): boolean {
    const lock = this.locks.get(userId);
    if (!lock) return false;

    const now = Date.now();
    const lockAge = now - lock.timestamp;

    // Se expirou, remove e retorna false
    if (lockAge >= this.LOCK_TIMEOUT) {
      this.locks.delete(userId);
      return false;
    }

    return true;
  }

  /**
   * Força a liberação de todos os locks (apenas para debug)
   */
  clearAllLocks(): void {
    console.warn('⚠️ Limpando todos os locks');
    this.locks.clear();
  }
}

// Singleton - apenas uma instância em toda a aplicação
export const conversionLock = new ConversionLockManager();
