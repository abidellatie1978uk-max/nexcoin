import { AlertCircle, Copy, ExternalLink, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { copyToClipboard } from '../utils/clipboard';
import { toast } from 'sonner';

export function FirestoreRulesHelper() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const rulesText = `As regras completas estão no arquivo /firestore.rules na raiz do projeto.
    
Acesse o Firebase Console e copie TODO o conteúdo do arquivo /firestore.rules:
https://console.firebase.google.com/project/nexcoin-1f42f/firestore/rules

⚠️ IMPORTANTE: Use as regras completas do arquivo, não este texto resumido!`;

    const success = await copyToClipboard(rulesText);
    if (success) {
      setCopied(true);
      toast.success('Instruções copiadas! Veja o arquivo /firestore.rules');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const openFirebaseConsole = () => {
    window.open('https://console.firebase.google.com/project/nexcoin-1f42f/firestore/rules', '_blank');
  };

  const openRulesFile = () => {
    toast.info('📄 Abra o arquivo /firestore.rules na raiz do projeto e copie TODO o conteúdo!', {
      duration: 5000,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-zinc-900 rounded-3xl max-w-md w-full border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.3)] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border-b border-red-500/20 p-6 rounded-t-3xl sticky top-0 z-10">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <h2 className="text-xl font-bold text-white">Erro de Permissão</h2>
          </div>
          <p className="text-sm text-red-200">
            O Firestore está bloqueando suas requisições
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Error Message */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-xs text-red-300 font-mono leading-relaxed">
              FirebaseError: [code=permission-denied]<br />
              Missing or insufficient permissions.<br /><br />
              @firebase/firestore: RestConnection RPC failed
            </p>
          </div>

          {/* Instructions */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Como corrigir:</h3>

            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-300 mb-1">
                    Abra o arquivo <span className="font-mono text-white bg-white/10 px-2 py-0.5 rounded">/firestore.rules</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Está na raiz do projeto
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-300">
                    Copie <strong>TODO</strong> o conteúdo do arquivo
                  </p>
                  <p className="text-xs text-gray-500">
                    São ~350 linhas de regras de segurança
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-300 mb-1">
                    Abra o Firebase Console
                  </p>
                  <button
                    onClick={openFirebaseConsole}
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    console.firebase.google.com/project/nexcoin-1f42f/firestore/rules
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                  4
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-300">
                    Cole as regras e clique em <strong>"Publicar"</strong>
                  </p>
                  <p className="text-xs text-gray-500">
                    Aguarde 1-2 minutos para propagação
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                  5
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-300">
                    Faça logout e login novamente
                  </p>
                  <p className="text-xs text-gray-500">
                    Para renovar o token de autenticação
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* File Info */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <p className="text-xs text-blue-300 font-semibold mb-2">
              📄 Arquivo de Regras
            </p>
            <p className="text-xs text-blue-200 leading-relaxed">
              As regras de segurança completas estão no arquivo <span className="font-mono bg-white/10 px-1 rounded">/firestore.rules</span> na raiz do projeto.
              Esse arquivo contém ~350 linhas com todas as permissões necessárias para o NexCoin funcionar com segurança.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={openRulesFile}
              className="w-full py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Ver Instruções
            </button>

            <button
              onClick={openFirebaseConsole}
              className="w-full py-3 bg-white/10 backdrop-blur-md text-white rounded-xl font-semibold hover:bg-white/20 transition-all flex items-center justify-center gap-2 border border-white/10"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir Firebase Console
            </button>
          </div>

          {/* What Rules Do */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
            <p className="text-xs text-white font-semibold mb-2">
              🔐 O que as regras fazem:
            </p>
            <ul className="text-xs text-gray-400 space-y-1.5 leading-relaxed">
              <li>✅ Cada usuário só acessa seus próprios dados</li>
              <li>✅ Permite transferências entre usuários (cripto e PIX)</li>
              <li>✅ Permite validar endereços/chaves de outros usuários</li>
              <li>✅ Transações são imutáveis (não podem ser alteradas)</li>
              <li>✅ Outros usuários só podem CREDITAR (aumentar saldo)</li>
              <li>✅ Bloqueia tudo não especificado (segurança padrão)</li>
            </ul>
          </div>

          {/* Help Text */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3">
            <p className="text-xs text-gray-400 text-center leading-relaxed">
              💡 Após publicar as regras, aguarde 1-2 minutos e faça logout/login. Todos os erros devem desaparecer! ✅
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
