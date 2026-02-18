import { useState, useEffect } from 'react';
import { ArrowLeft, AlertTriangle, Trash2, Lock, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { deleteUserAccount, countUserData } from '../lib/deleteUserData';
import { auth } from '../lib/firebase';
import { toast } from 'sonner';
import type { Screen } from '../App';

interface DeleteAccountProps {
  onNavigate: (screen: Screen) => void;
}

export function DeleteAccount({ onNavigate }: DeleteAccountProps) {
  const { user, logout, verifyPin, userData } = useAuth();
  const [step, setStep] = useState<'warning' | 'confirm' | 'pin' | 'deleting' | 'done'>('warning');
  const [confirmText, setConfirmText] = useState('');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [authProvider, setAuthProvider] = useState<'password' | 'google' | 'other'>('password');
  const [dataCount, setDataCount] = useState({
    assets: 0,
    transactions: 0,
    conversions: 0,
    fiatBalances: 0,
    bankAccounts: 0,
    pixKeys: 0,
    total: 0,
  });
  const [isLoadingCount, setIsLoadingCount] = useState(true);

  // Carregar contagem de dados ao montar componente
  useEffect(() => {
    if (user?.uid) {
      loadDataCount();
      checkAuthProvider();
    }
  }, [user?.uid]);

  // Verificar qual provedor de autenticação o usuário usa
  const checkAuthProvider = () => {
    if (!auth.currentUser) return;

    const providerData = auth.currentUser.providerData;
    console.log('🔍 Provedor de autenticação completo:', JSON.stringify(providerData, null, 2));
    console.log('🔍 Email do usuário:', auth.currentUser.email);
    console.log('🔍 Email verificado:', auth.currentUser.emailVerified);
    console.log('🔍 Metadata:', auth.currentUser.metadata);

    if (providerData.length > 0) {
      const providerId = providerData[0].providerId;
      console.log('🔍 Provider ID detectado:', providerId);

      if (providerId === 'password') {
        setAuthProvider('password');
        console.log('✅ Usuário usa email/senha');
      } else if (providerId === 'google.com') {
        setAuthProvider('google');
        console.log('✅ Usuário usa login do Google - NÃO PRECISA DE SENHA');
      } else {
        setAuthProvider('other');
        console.log('✅ Usuário usa outro método:', providerId);
      }
    } else {
      console.log('⚠️ Nenhum provedor encontrado!');
    }
  };

  const loadDataCount = async () => {
    if (!user?.uid) return;

    setIsLoadingCount(true);
    try {
      const count = await countUserData(user.uid);
      setDataCount(count);
    } catch (error) {
      console.error('❌ Erro ao carregar contagem:', error);
    } finally {
      setIsLoadingCount(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.uid) {
      toast.error('Usuário não autenticado');
      return;
    }

    if (!auth.currentUser) {
      toast.error('Erro: usuário não encontrado');
      return;
    }

    // ✅ Se o usuário NÃO tem userData (ex: login Google sem completar perfil)
    // Pular validação de PIN e deletar direto
    const hasUserData = userData && userData.accountPin;

    if (hasUserData) {
      // Validar PIN
      if (!pin || pin.length !== 6) {
        toast.error('Digite seu PIN de 6 dígitos');
        return;
      }

      // Validar texto de confirmação
      if (confirmText !== 'EXCLUIR') {
        toast.error('Digite "EXCLUIR" para confirmar a exclusão');
        return;
      }
    } else {
      // Sem userData, apenas validar texto de confirmação
      if (confirmText !== 'EXCLUIR') {
        toast.error('Digite "EXCLUIR" para confirmar a exclusão');
        return;
      }
    }

    setStep('deleting');
    setIsDeleting(true);

    try {
      // Validar PIN apenas se o usuário tiver userData
      if (hasUserData) {
        console.log('🔐 Validando PIN...');

        const isPinValid = await verifyPin(pin);

        if (!isPinValid) {
          console.error('❌ PIN incorreto');
          setPinError('PIN incorreto. Tente novamente.');
          toast.error('PIN incorreto. Verifique e tente novamente.');
          setStep('pin');
          setIsDeleting(false);
          return;
        }

        console.log('✅ PIN validado com sucesso!');
      } else {
        console.log('⚠️ Usuário sem dados no Firestore. Pulando validação de PIN.');
      }

      console.log('🗑️ Iniciando exclusão da conta...');

      // Deletar conta (Firestore + Auth)
      const result = await deleteUserAccount(user.uid);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao excluir conta');
      }

      // Sucesso!
      console.log('✅ Conta excluída com sucesso!');
      setStep('done');

      // Redirecionar após 3 segundos
      setTimeout(() => {
        logout();
      }, 3000);

    } catch (error: any) {
      console.error('❌ Erro ao excluir conta:', error);
      console.error('❌ Código:', error.code);
      console.error('❌ Mensagem:', error.message);

      let errorMessage = 'Erro ao excluir conta. Tente novamente.';

      // Se o Firebase Auth exigir reautenticação, mostrar instrução específica
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Por segurança, faça logout e login novamente antes de excluir sua conta.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
      setStep(hasUserData ? 'pin' : 'confirm');
      setIsDeleting(false);
    }
  };

  // Tela de sucesso
  if (step === 'done') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          </div>

          <h1 className="text-3xl font-bold mb-3">Conta Excluída</h1>
          <p className="text-gray-400 mb-6">
            Sua conta e todos os dados foram removidos permanentemente.
          </p>
          <p className="text-sm text-gray-500">
            Redirecionando...
          </p>
        </motion.div>
      </div>
    );
  }

  // Tela de processamento
  if (step === 'deleting') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
          </div>

          <h1 className="text-3xl font-bold mb-3">Excluindo Conta...</h1>
          <p className="text-gray-400 mb-6">
            Removendo todos os seus dados do sistema.
          </p>
          <p className="text-sm text-gray-500">
            Isso pode levar alguns segundos.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col pb-24">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <button
          onClick={() => onNavigate('profile')}
          className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold mb-1">Excluir Conta</h1>
            <p className="text-sm text-gray-400">Ação permanente e irreversível</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
        </div>
      </header>

      <div className="flex-1 px-6 space-y-4">
        {/* Etapa 1: Aviso */}
        {step === 'warning' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Contagem de dados */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-4">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                Dados que serão excluídos
              </h2>

              {isLoadingCount ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-8 bg-white/5 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {dataCount.assets > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Ativos de criptomoedas</span>
                      <span className="font-semibold text-white">{dataCount.assets}</span>
                    </div>
                  )}
                  {dataCount.transactions > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Transações</span>
                      <span className="font-semibold text-white">{dataCount.transactions}</span>
                    </div>
                  )}
                  {dataCount.conversions > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Conversões</span>
                      <span className="font-semibold text-white">{dataCount.conversions}</span>
                    </div>
                  )}
                  {dataCount.fiatBalances > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Saldos fiat</span>
                      <span className="font-semibold text-white">{dataCount.fiatBalances}</span>
                    </div>
                  )}
                  {dataCount.bankAccounts > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Contas bancárias</span>
                      <span className="font-semibold text-white">{dataCount.bankAccounts}</span>
                    </div>
                  )}
                  {dataCount.pixKeys > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Chaves PIX</span>
                      <span className="font-semibold text-white">{dataCount.pixKeys}</span>
                    </div>
                  )}

                  {dataCount.total === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      Nenhum dado encontrado
                    </div>
                  )}

                  {dataCount.total > 0 && (
                    <>
                      <div className="h-px bg-white/10 my-3"></div>
                      <div className="flex justify-between text-base">
                        <span className="font-bold text-white">Total</span>
                        <span className="font-bold text-red-500">{dataCount.total} itens</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Avisos */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-4">
              <h3 className="text-lg font-bold text-red-500 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                ⚠️ Atenção
              </h3>
              <ul className="space-y-2 text-sm text-red-200/90">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Todos os seus ativos e saldos serão <strong>permanentemente excluídos</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Seu histórico de transações será <strong>apagado completamente</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Suas chaves PIX e contas bancárias serão <strong>removidas</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span><strong>Não será possível recuperar</strong> nenhum dado após a exclusão</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Sua conta Ethertron será <strong>encerrada definitivamente</strong></span>
                </li>
              </ul>
            </div>

            {/* Recomendação */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-bold text-yellow-500 mb-3">💡 Recomendação</h3>
              <p className="text-sm text-yellow-200/90">
                Antes de excluir sua conta, certifique-se de ter sacado todos os seus saldos e transferido seus ativos.
              </p>
            </div>

            {/* Botões */}
            <div className="space-y-3">
              <button
                onClick={() => setStep('confirm')}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Continuar com Exclusão
              </button>
              <button
                onClick={() => onNavigate('profile')}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 rounded-xl transition-colors"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}

        {/* Etapa 2: Confirmação de texto */}
        {step === 'confirm' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
              <h2 className="text-lg font-bold mb-3">Confirmação de Exclusão</h2>
              <p className="text-sm text-gray-400 mb-6">
                Para confirmar que você entende que esta ação é irreversível, digite <strong className="text-red-500">EXCLUIR</strong> no campo abaixo.
              </p>

              <input
                type="text"
                placeholder="Digite EXCLUIR"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-500 text-center font-bold text-lg"
                autoFocus
              />

              {confirmText && confirmText !== 'EXCLUIR' && (
                <p className="text-xs text-red-500 mt-2 text-center">
                  O texto não corresponde. Digite exatamente "EXCLUIR"
                </p>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  // Se o usuário não tem PIN, excluir direto
                  const hasUserData = userData && userData.accountPin;
                  if (hasUserData) {
                    setStep('pin');
                  } else {
                    handleDeleteAccount();
                  }
                }}
                disabled={confirmText !== 'EXCLUIR'}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar
              </button>
              <button
                onClick={() => setStep('warning')}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 rounded-xl transition-colors"
              >
                Voltar
              </button>
            </div>
          </motion.div>
        )}

        {/* Etapa 3: PIN */}
        {step === 'pin' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Digite seu PIN
              </h2>
              <p className="text-sm text-gray-400 mb-6">
                Por segurança, digite seu PIN para confirmar a exclusão da conta.
              </p>

              <div className="relative">
                <input
                  type="password"
                  placeholder="Seu PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setPin('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {pinError && (
                <p className="text-xs text-red-500 mt-2 text-center">
                  {pinError}
                </p>
              )}
            </div>

            {/* Última confirmação */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-6">
              <p className="text-sm text-red-200/90 text-center">
                <strong>Última confirmação:</strong> Ao clicar em "Excluir Minha Conta", todos os seus dados serão <strong>permanentemente removidos</strong> do Ethertron.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleDeleteAccount}
                disabled={!pin || isDeleting}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Excluir Minha Conta Permanentemente
                  </>
                )}
              </button>
              <button
                onClick={() => setStep('confirm')}
                disabled={isDeleting}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50"
              >
                Voltar
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}