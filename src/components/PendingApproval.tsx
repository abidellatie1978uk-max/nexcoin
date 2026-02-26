import { Clock, CheckCircle2, Mail, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function PendingApproval() {
  const { userData, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card Principal */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-center">
          {/* Ícone Animado */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full p-4">
                <Clock className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>

          {/* Título */}
          <h1 className="text-2xl font-bold mb-3">
            Conta em Análise
          </h1>

          {/* Descrição */}
          <p className="text-gray-400 mb-8 leading-relaxed">
            Olá {userData?.name?.split(' ')[0] || 'usuário'}! Sua solicitação de acesso ao <span className="text-white font-semibold">NexCoin</span> está sendo analisada pela nossa equipe de segurança.
          </p>

          {/* Timeline de Processo */}
          <div className="space-y-4 mb-8 text-left">
            {/* Etapa 1 - Concluída */}
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Cadastro Realizado</p>
                <p className="text-xs text-gray-400 mt-1">
                  Suas informações foram recebidas com sucesso
                </p>
              </div>
            </div>

            {/* Etapa 2 - Em Andamento */}
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Análise de Segurança</p>
                <p className="text-xs text-gray-400 mt-1">
                  Verificando seus dados e validando identidade
                </p>
              </div>
            </div>

            {/* Etapa 3 - Pendente */}
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <div className="w-5 h-5 border-2 border-white/20 rounded-full"></div>
              </div>
              <div className="flex-1">
                <p className="text-gray-400 font-medium">Aprovação Final</p>
                <p className="text-xs text-gray-400 mt-1">
                  Você receberá uma notificação quando for aprovado
                </p>
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3 text-left">
              <Mail className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-white">Tempo estimado:</span> 24 a 48 horas
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Você receberá um e-mail em <span className="text-white">{userData?.email}</span> assim que sua conta for aprovada.
                </p>
              </div>
            </div>
          </div>

          {/* Badge de Segurança */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mb-6">
            <Shield className="w-4 h-4 text-green-500" />
            <span>Protegido por verificação em duas etapas</span>
          </div>

          {/* Botão de Logout */}
          <button
            onClick={handleLogout}
            className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-all"
          >
            Sair da Conta
          </button>
        </div>

        {/* Suporte */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Precisa de ajuda?{' '}
            <a href="mailto:suporte@nexcoin.com" className="text-white hover:underline">
              Entre em contato
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
