import { useState, useEffect } from 'react';
import { ArrowLeft, Copy, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePixKeys } from '../hooks/usePixKeys';
import { ManagePixKeys } from './ManagePixKeys';
import type { Screen } from '../App';
import type { BankAccount } from '../lib/bankAccountGenerator';
import { toast } from 'sonner';
import { copyToClipboard } from '../utils/clipboard';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface PixKeysProps {
  onNavigate: (screen: Screen) => void;
}

export function PixKeys({ onNavigate }: PixKeysProps) {
  const { user } = useAuth();
  const { pixKeys, isLoading, addPixKey, deletePixKey } = usePixKeys();
  const [activeTab, setActiveTab] = useState<'tarifas' | 'tempo' | 'limites'>('tarifas');
  const [showManageKeys, setShowManageKeys] = useState(false);
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(true);

  // Carregar conta bancária BRL do usuário
  useEffect(() => {
    const loadBRLAccount = async () => {
      if (!user?.uid) {
        setLoadingAccount(false);
        return;
      }

      try {
        const accountsRef = collection(db, 'bankAccounts');
        const q = query(
          accountsRef,
          where('userId', '==', user.uid),
          where('currency', '==', 'BRL')
        );

        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const accountData = snapshot.docs[0].data() as BankAccount;
          setAccount(accountData);
        } else {
          // Se não encontrou conta BRL, usar dados padrão
          console.log('⚠️ Conta BRL não encontrada, usando dados padrão');
        }
      } catch (error) {
        console.error('❌ Erro ao carregar conta BRL:', error);
      } finally {
        setLoadingAccount(false);
      }
    };

    loadBRLAccount();
  }, [user]);

  // Função para copiar texto
  const copyToClipboardHandler = (text: string, label: string) => {
    copyToClipboard(text);
    toast.success('Copiado!', {
      description: `${label} copiado para a área de transferência`,
      duration: 2000,
    });
  };

  // Função para compartilhar
  const handleShare = async () => {
    const shareText = `
Receba BRL
Do Brasil com Pix

Número da conta: ${account?.accountNumber || 'N/A'}
Agência: ${account?.branchCode || '0001'}
    `.trim();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Dados da Conta',
          text: shareText,
        });
      } catch (error) {
        console.log('Compartilhamento cancelado');
      }
    } else {
      copyToClipboardHandler(shareText, 'Informações');
    }
  };

  const onSuccess = () => {
    // Callback após sucesso
  };

  if (loadingAccount) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#1a2942] via-black to-black flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <button
          onClick={() => onNavigate('home')}
          className="w-10 h-10 rounded-full bg-zinc-800/50 backdrop-blur-md flex items-center justify-center hover:bg-zinc-700/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        <div className="flex-1 text-center">
          <div className="text-white font-semibold">BRL</div>
          <div className="text-xs text-gray-400">Minhas Chaves Pix</div>
        </div>

        <div className="w-10"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-24">
        {/* Title Section */}
        <div className="mb-6 mt-4">
          <h1 className="text-2xl font-bold text-white mb-1">Receba BRL</h1>
          <p className="text-gray-400 text-sm">Do Brasil com Pix</p>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="w-full mb-6 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 text-white font-semibold transition-all shadow-lg"
        >
          Compartilhar
        </button>

        {/* Número da Conta Card */}
        <div className="bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-5 mb-6 border border-zinc-800/50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <p className="text-gray-400 text-sm mb-2">Número da conta</p>
              <p className="text-white font-mono text-xl font-semibold">
                {account?.accountNumber || 'N/A'}
              </p>
            </div>
            <button
              onClick={() => copyToClipboardHandler(account?.accountNumber || '', 'Número da conta')}
              className="ml-3 w-10 h-10 rounded-full bg-zinc-800/50 hover:bg-zinc-700/50 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <Copy className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
          <button className="text-sm text-gray-400 hover:text-gray-300 transition-colors">
            Clique <span className="underline">aqui</span> para ver os seus dados de conta completos
          </button>
        </div>

        {/* Botão Gerenciar */}
        <button
          onClick={() => setShowManageKeys(true)}
          className="w-full mb-6 px-6 py-4 rounded-2xl bg-zinc-800/50 hover:bg-zinc-700/50 text-white font-semibold transition-all"
        >
          Gerenciar
        </button>

        {/* Informações Resumidas */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Informações resumidas</h2>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('tarifas')}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === 'tarifas'
                  ? 'bg-white/20 backdrop-blur-md border border-white/30 text-white'
                  : 'bg-zinc-800/50 text-white hover:bg-zinc-700/50'
                }`}
            >
              Tarifas
            </button>
            <button
              onClick={() => setActiveTab('tempo')}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === 'tempo'
                  ? 'bg-white/20 backdrop-blur-md border border-white/30 text-white'
                  : 'bg-zinc-800/50 text-white hover:bg-zinc-700/50'
                }`}
            >
              Tempo
            </button>
            <button
              onClick={() => setActiveTab('limites')}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === 'limites'
                  ? 'bg-white/20 backdrop-blur-md border border-white/30 text-white'
                  : 'bg-zinc-800/50 text-white hover:bg-zinc-700/50'
                }`}
            >
              Limites
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'tarifas' && (
            <div className="space-y-3">
              <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-4 border border-zinc-800/50">
                <p className="text-sm font-semibold text-white mb-1">Quanto custa?</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white">Do Brasil (doméstico)</p>
                    <p className="text-cyan-400 font-semibold">Sem tarifas</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tempo' && (
            <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-4 border border-zinc-800/50">
              <p className="text-gray-400 text-sm">Transferências Pix são instantâneas</p>
            </div>
          )}

          {activeTab === 'limites' && (
            <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-4 border border-zinc-800/50">
              <p className="text-gray-400 text-sm">Sem limite de recebimento</p>
            </div>
          )}
        </div>

        {/* Disponibilidade */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Disponibilidade</h2>
          <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-4 border border-zinc-800/50 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
            </div>
            <p className="text-white text-sm">
              DDAs (débitos automáticos) não disponíveis
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-400 text-sm mb-4">
          <p className="mb-2">Como podemos melhorar? Os dados não foram aceitos?</p>
          <button className="text-white hover:underline font-semibold">
            Envie sua sugestão
          </button>
        </div>
      </div>

      {/* Manage Pix Keys Modal */}
      {showManageKeys && account && (
        <ManagePixKeys
          account={account}
          onBack={() => setShowManageKeys(false)}
          onSuccess={onSuccess}
        />
      )}
    </div>
  );
}