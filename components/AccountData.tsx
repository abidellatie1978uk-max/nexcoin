import { ChevronLeft, Search, X, Plus, Globe, ChevronRight, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Screen } from '../App';
import { AccountDetails } from './AccountDetails';
import { AccountCreationModal } from './AccountCreationModal';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { generateBankAccountByCountry, getAvailableCountries, type BankAccount } from '../lib/bankAccountGenerator';
import { toast } from 'sonner';

interface AccountDataProps {
  onNavigate: (screen: Screen) => void;
}

// ✅ Função para criar chaves PIX automaticamente para contas BRL
const createPixKeysForBRLAccount = async (
  userId: string,
  accountId: string,
  accountNumber: string,
  userEmail: string,
  userPhone: string
) => {
  try {
    console.log('🔑 Criando chaves PIX automáticas para conta BRL...');

    const pixKeysRef = collection(db, 'pixKeys');

    // Verificar se já existem chaves para esta conta
    const existingKeysQuery = query(
      pixKeysRef,
      where('userId', '==', userId),
      where('accountId', '==', accountId)
    );
    const existingKeysSnapshot = await getDocs(existingKeysQuery);

    if (!existingKeysSnapshot.empty) {
      console.log('ℹ️ Chaves PIX já existem para esta conta');
      return;
    }

    // Criar chave PIX de EMAIL
    await addDoc(pixKeysRef, {
      userId: userId,
      accountId: accountId,
      accountNumber: accountNumber,
      currency: 'BRL',
      country: 'BR',
      keyType: 'email',
      keyValue: userEmail,
      createdAt: new Date(),
    });
    console.log('✅ Chave PIX (email) criada:', userEmail);

    // Criar chave PIX de TELEFONE
    await addDoc(pixKeysRef, {
      userId: userId,
      accountId: accountId,
      accountNumber: accountNumber,
      currency: 'BRL',
      country: 'BR',
      keyType: 'phone',
      keyValue: userPhone,
      createdAt: new Date(),
    });
    console.log('✅ Chave PIX (telefone) criada:', userPhone);

  } catch (error) {
    console.error('❌ Erro ao criar chaves PIX automáticas:', error);
    // Não propagar erro - não é crítico
  }
};

const FlagIcon = ({ code }: { code: string }) => {
  return (
    <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center bg-zinc-800">
      <img
        src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
        alt={code}
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export function AccountData({ onNavigate }: AccountDataProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [userAccounts, setUserAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [creatingCountryCode, setCreatingCountryCode] = useState<string>('');

  // Carregar contas do usuário
  useEffect(() => {
    if (!user) return;

    const loadAccounts = async () => {
      try {
        const accountsRef = collection(db, 'bankAccounts');
        const q = query(accountsRef, where('userId', '==', user.uid));
        const snapshot = await getDocs(q);

        const accounts = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as BankAccount[];

        setUserAccounts(accounts);
        setPermissionError(false);
      } catch (error: any) {
        console.error('❌ Erro ao carregar contas:', error);
        if (error?.code === 'permission-denied') {
          setPermissionError(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadAccounts();
  }, [user]);

  // Obter países disponíveis (excluindo os que já têm conta)
  const availableCountries = getAvailableCountries().filter(
    country => !userAccounts.some(account => account.country === country.code)
  );

  // Filtrar países disponíveis baseado na pesquisa
  const filteredCountries = availableCountries.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.currency.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Função para iniciar criação de conta
  const handleStartAccountCreation = (countryCode: string) => {
    setCreatingCountryCode(countryCode);
    setShowCreationModal(true);
  };

  // Função para completar criação de conta após animação
  const handleCompleteAccountCreation = async () => {
    if (!user || !creatingCountryCode) return;

    setShowCreationModal(false);
    setIsCreatingAccount(true);

    try {
      const accountsRef = collection(db, 'bankAccounts');

      // 🔍 Verificar se já existe conta desse país
      const existingAccountQuery = query(
        accountsRef,
        where('userId', '==', user.uid),
        where('country', '==', creatingCountryCode)
      );
      const existingAccountSnapshot = await getDocs(existingAccountQuery);

      // 🚫 Se já existe, não criar e mostrar mensagem
      if (!existingAccountSnapshot.empty) {
        console.log('⚠️ Conta já existe para:', creatingCountryCode);
        const countryName = getAvailableCountries().find(c => c.code === creatingCountryCode)?.name || creatingCountryCode;
        toast.error('Conta já existe', {
          description: `Você já possui uma conta bancária de ${countryName}. Não é possível criar mais de uma conta por país.`,
          duration: 4000,
        });
        setSearchQuery('');
        setIsSearchExpanded(false);
        setIsCreatingAccount(false);
        return;
      }

      // ✅ Criar conta se não existir
      const newAccount = generateBankAccountByCountry(creatingCountryCode);
      const docRef = await addDoc(accountsRef, {
        ...newAccount,
        userId: user.uid,
        createdAt: new Date(),
      });

      const accountWithId = {
        ...newAccount,
        id: docRef.id,
        createdAt: new Date(),
      };

      setUserAccounts(prev => [...prev, accountWithId]);
      setSearchQuery('');
      setIsSearchExpanded(false);
      console.log('✅ Conta criada com sucesso para:', creatingCountryCode);
      toast.success('Conta criada', {
        description: `Conta bancária de ${getAvailableCountries().find(c => c.code === creatingCountryCode)?.name} criada com sucesso!`,
        duration: 3000,
      });

      // ✅ Criar chaves PIX para contas BRL
      if (creatingCountryCode === 'BR') {
        // Buscar dados completos do usuário
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();

        if (userData?.email && userData?.phone) {
          await createPixKeysForBRLAccount(
            user.uid,
            docRef.id,
            newAccount.accountNumber,
            userData.email,
            userData.phone
          );
          console.log('✅ Chaves PIX criadas automaticamente!');

          // Toast adicional informando sobre as chaves PIX
          setTimeout(() => {
            toast.success('Chaves PIX criadas!', {
              description: 'Suas chaves PIX (email e telefone) foram configuradas automaticamente.',
              duration: 4000,
            });
          }, 1500);
        } else {
          console.log('⚠️ Email ou telefone não encontrado no perfil do usuário');
        }
      }

      // ✅ Voltar para a página Home após criar a conta
      setTimeout(() => {
        onNavigate('home');
      }, 1000);
    } catch (error) {
      console.error('❌ Erro ao adicionar conta:', error);
      toast.error('Erro ao criar conta', {
        description: 'Não foi possível criar a conta bancária. Tente novamente.',
        duration: 3000,
      });
    } finally {
      setIsCreatingAccount(false);
    }
  };

  // Função para deletar uma conta
  const handleDeleteAccount = async (accountId: string) => {
    if (!accountId) {
      toast.error('Erro', {
        description: 'ID da conta não encontrado.',
        duration: 3000,
      });
      return;
    }

    // Confirmação antes de deletar
    const confirmDelete = window.confirm(
      'Tem certeza que deseja encerrar esta conta?\n\nEsta ação não pode ser desfeita e você perderá todos os dados desta conta bancária.'
    );

    if (!confirmDelete) return;

    try {
      // Deletar do Firestore
      await deleteDoc(doc(db, 'bankAccounts', accountId));

      // Remover da lista local
      setUserAccounts(prev => prev.filter(acc => acc.id !== accountId));

      // Voltar para a lista
      setSelectedAccount(null);

      // Mostrar toast de sucesso
      toast.success('Conta encerrada', {
        description: 'A conta bancária foi encerrada com sucesso.',
        duration: 3000,
      });

      console.log('✅ Conta deletada com sucesso:', accountId);
    } catch (error: any) {
      console.error('❌ Erro ao deletar conta:', error);

      // Verificar se é erro de permissão
      if (error?.code === 'permission-denied') {
        toast.error('⚠️ Regras do Firestore não configuradas', {
          description: 'Você precisa atualizar as regras do Firestore. Consulte o arquivo /GUIA_FIRESTORE.md para instruções detalhadas.',
          duration: 8000,
        });
      } else {
        toast.error('Erro ao encerrar conta', {
          description: 'Não foi possível encerrar a conta. Tente novamente.',
          duration: 3000,
        });
      }
    }
  };

  // Se uma conta foi selecionada, mostrar os detalhes
  if (selectedAccount) {
    return (
      <AccountDetails
        account={selectedAccount}
        onBack={() => setSelectedAccount(null)}
        onDelete={handleDeleteAccount}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-lg bg-black/80 border-b border-white/5">
        <div className="px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('profile')}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-900 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl">Contas</h1>
              <p className="text-sm text-white/50">Gerencie suas contas bancárias</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24 px-6">
        <h1 className="text-xl mb-6">Dados da conta</h1>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-zinc-700 border-t-white rounded-full animate-spin"></div>
          </div>
        )}

        {/* Error State */}
        {permissionError && !isLoading && (
          <div className="bg-red-900/20 border border-red-800 rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-500 mb-1">Erro de permissão</p>
                <p className="text-sm text-gray-300">Verifique se as regras do Firestore foram configuradas corretamente. Consulte o arquivo /FIRESTORE_RULES.txt</p>
              </div>
            </div>
          </div>
        )}

        {/* Active Accounts */}
        {!isLoading && userAccounts.length > 0 && (
          <div className="bg-zinc-900 rounded-3xl overflow-hidden mb-6">
            {userAccounts.map((account, idx) => (
              <div key={account.id}>
                <button
                  className="w-full px-4 py-4 flex items-center justify-between hover:bg-zinc-800 transition-colors"
                  onClick={() => setSelectedAccount(account)}
                >
                  <div className="flex items-center gap-3">
                    <FlagIcon code={account.flagCode} />
                    <div className="text-left">
                      <p className="font-semibold">{account.countryName}</p>
                      <p className="text-sm text-gray-400">{account.currency}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
                {idx < userAccounts.length - 1 && (
                  <div className="h-px bg-zinc-800 mx-4" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Available Accounts */}
        <div className="bg-zinc-900 rounded-3xl overflow-hidden">
          {filteredCountries.map((country, idx) => (
            <div key={country.code}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FlagIcon code={country.flag} />
                  <div className="text-left">
                    <p className="font-semibold">{country.name}</p>
                    <p className="text-sm text-gray-400">{country.currency}</p>
                  </div>
                </div>
                <button
                  className="px-5 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-full text-sm font-semibold transition-colors disabled:opacity-50"
                  onClick={() => handleStartAccountCreation(country.code)}
                  disabled={isCreatingAccount}
                >
                  {isCreatingAccount ? 'Criando...' : 'Adicionar'}
                </button>
              </div>
              {idx < filteredCountries.length - 1 && (
                <div className="h-px bg-zinc-800 mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Account Creation Modal */}
      <AccountCreationModal
        isOpen={showCreationModal}
        countryName={getAvailableCountries().find(c => c.code === creatingCountryCode)?.name || ''}
        onComplete={handleCompleteAccountCreation}
      />
    </div>
  );
}