import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { checkIndexHealth } from '../lib/walletAddressUtils';
import { migrateOwnWalletAddresses } from '../lib/migrateOwnWalletAddresses';
import { toast } from 'sonner@2.0.3';

/**
 * Hook que executa migração automática dos endereços do usuário atual
 * Roda sempre que necessário para garantir que os endereços estejam indexados
 * ✅ Migra apenas os endereços do próprio usuário (sem problemas de permissão)
 */
export function useAutoMigration() {
  const { isAuthenticated, isPinVerified, user } = useAuth();
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);

  useEffect(() => {
    // ⚠️ Só executar se usuário está autenticado E PIN verificado
    if (!isAuthenticated || !isPinVerified || !user?.uid) {
      console.log('⏸️ Auto-migração pausada: usuário não autenticado');
      return;
    }

    const checkAndMigrate = async () => {
      try {
        console.log('🔍 Verificando endereços do usuário:', user.uid);
        
        setIsMigrating(true);
        
        console.log('🔄 Executando migração/atualização do índice...');
        
        // ✅ Sempre executa a migração para garantir que está atualizado
        const result = await migrateOwnWalletAddresses(user.uid);

        if (result.success) {
          console.log(`✅ Migração concluída: ${result.migratedCount} endereços indexados`);
          
          if (result.migratedCount > 0) {
            toast.success(`✅ ${result.migratedCount} endereço${result.migratedCount > 1 ? 's' : ''} atualizado${result.migratedCount > 1 ? 's' : ''} no índice`, {
              duration: 3000,
            });
          }

          setMigrationComplete(true);
        } else {
          console.error('❌ Falha na migração automática:', result.errors);
        }

        setIsMigrating(false);
      } catch (error) {
        console.error('❌ Erro ao verificar/migrar endereços:', error);
        setIsMigrating(false);
      }
    };

    // Executar após um pequeno delay para não bloquear o carregamento inicial
    const timer = setTimeout(checkAndMigrate, 3000);
    
    return () => clearTimeout(timer);
  }, [isAuthenticated, isPinVerified, user?.uid]); // ✅ Depende do userId também

  return { isMigrating, migrationComplete };
}