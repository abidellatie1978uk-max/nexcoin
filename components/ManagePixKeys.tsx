import { ChevronLeft, Mail, Phone, Copy } from 'lucide-react';
import { toast } from 'sonner';
import type { BankAccount } from '../lib/bankAccountGenerator';
import { usePixKeys } from '../hooks/usePixKeys';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatPhoneForPix } from '../lib/pixPhoneUtils';

interface ManagePixKeysProps {
  account: BankAccount;
  onBack: () => void;
  onSuccess?: () => void;
}

export function ManagePixKeys({ account, onBack }: ManagePixKeysProps) {
  const { pixKeys, isLoading } = usePixKeys();
  const { user, userData } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);

  // ✅ CRIAR CHAVES PIX AUTOMATICAMENTE APENAS NA PRIMEIRA VEZ (SE NÃO EXISTIREM)
  useEffect(() => {
    const initializePixKeys = async () => {
      if (!user?.uid || !userData?.email || !userData?.phone || !account.id) {
        console.log('⚠️ Dados do usuário incompletos para criar chaves PIX');
        setIsInitializing(false);
        return;
      }

      // Só processar contas BRL
      if (account.currency !== 'BRL') {
        console.log('ℹ️ Conta não é BRL, pulando criação de chaves PIX');
        setIsInitializing(false);
        return;
      }

      try {
        console.log('🔄 Verificando chaves PIX para conta:', account.id);

        const pixKeysRef = collection(db, 'pixKeys');

        // Buscar chaves existentes desta conta
        const existingKeysQuery = query(
          pixKeysRef,
          where('userId', '==', user.uid),
          where('accountId', '==', account.id)
        );
        const existingKeysSnapshot = await getDocs(existingKeysQuery);

        // ✅ SE JÁ EXISTEM CHAVES, NÃO FAZ NADA
        if (!existingKeysSnapshot.empty) {
          console.log('ℹ️ Chaves PIX já existem para esta conta. Nenhuma ação necessária.');
          setIsInitializing(false);
          return;
        }

        // ✅ SE NÃO EXISTEM CHAVES, CRIAR AUTOMATICAMENTE
        console.log('📝 Criando chaves PIX automaticamente...');

        // Criar chave EMAIL
        const currentEmail = userData.email;
        await addDoc(pixKeysRef, {
          userId: user.uid,
          accountId: account.id,
          accountNumber: account.accountNumber,
          currency: 'BRL',
          country: 'BR',
          keyType: 'email',
          keyValue: currentEmail,
          createdAt: new Date(),
        });
        console.log('✅ Chave PIX (email) criada:', currentEmail);

        // Criar chave TELEFONE
        const currentPhone = formatPhoneForPix(userData.phone);
        await addDoc(pixKeysRef, {
          userId: user.uid,
          accountId: account.id,
          accountNumber: account.accountNumber,
          currency: 'BRL',
          country: 'BR',
          keyType: 'phone',
          keyValue: currentPhone,
          createdAt: new Date(),
        });
        console.log('✅ Chave PIX (telefone) criada:', currentPhone);

        console.log('✅ Chaves PIX criadas com sucesso!');
      } catch (error) {
        console.error('❌ Erro ao inicializar chaves PIX:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    // Só executar quando o componente montar
    if (isInitializing) {
      initializePixKeys();
    }
  }, [user?.uid, userData?.email, userData?.phone, account.id, account.currency, account.accountNumber, isInitializing]);

  // ✅ FILTRAR CHAVES PIX DA CONTA ESPECÍFICA
  const accountPixKeys = pixKeys.filter(key => key.accountId === account.id);

  // ✅ FUNÇÃO PARA OBTER ÍCONE BASEADO NO TIPO
  const getKeyIcon = (keyType: string) => {
    switch (keyType) {
      case 'email':
        return Mail;
      case 'phone':
        return Phone;
      default:
        return Mail;
    }
  };

  // ✅ FUNÇÃO PARA OBTER LABEL DO TIPO
  const getKeyTypeLabel = (keyType: string) => {
    switch (keyType) {
      case 'email':
        return 'E-mail';
      case 'phone':
        return 'Telefone';
      default:
        return keyType;
    }
  };

  // ✅ COPIAR CHAVE PIX
  const handleCopyKey = async (keyValue: string, keyId: string) => {
    try {
      // Tentar usar Clipboard API moderno
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(keyValue);
      } else {
        // Fallback: usar método antigo que funciona em mais contextos
        const textArea = document.createElement('textarea');
        textArea.value = keyValue;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (!successful) {
          throw new Error('Falha ao copiar');
        }
      }

      toast.success('Chave copiada!');
    } catch (error) {
      console.error('Erro ao copiar chave:', error);
      toast.error('Erro ao copiar chave');
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#1a2942] via-black to-black flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center px-6 pt-6 pb-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-zinc-800/50 backdrop-blur-md flex items-center justify-center hover:bg-zinc-700/50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-8">
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Suas chaves Pix</h1>
          <p className="text-gray-400 text-base">Suas chaves cadastradas</p>
        </div>

        {/* Info Alert */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 mb-6">
          {accountPixKeys.length > 0 ? (
            <p className="text-gray-300 text-sm text-center">
              ✅ Suas chaves PIX (email e telefone) foram criadas automaticamente
            </p>
          ) : (
            <p className="text-gray-300 text-sm text-center">
              Nenhuma chave PIX encontrada
            </p>
          )}
        </div>

        {/* Lista de Chaves Pix */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Carregando chaves...</p>
            </div>
          ) : accountPixKeys.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Nenhuma chave cadastrada</p>
            </div>
          ) : (
            accountPixKeys.map((key) => {
              const IconComponent = getKeyIcon(key.keyType);

              return (
                <div
                  key={key.id}
                  className="bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-5 border border-zinc-800/50"
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>

                    {/* Key Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold mb-1">{getKeyTypeLabel(key.keyType)}</p>
                      <p className="text-gray-400 text-sm font-mono truncate">
                        {key.keyValue}
                      </p>
                    </div>

                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopyKey(key.keyValue, key.id)}
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center flex-shrink-0 transition-colors"
                    >
                      <Copy className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}