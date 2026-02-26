import { AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function WalletsMigrationAlert() {
  const [dismissed, setDismissed] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { user, userData, dismissAlert } = useAuth();

  // ✅ Verificar se já foi dismissed no Firestore
  useEffect(() => {
    if (userData?.preferences?.dismissedAlerts?.includes('walletsMigration')) {
      setDismissed(true);
      return;
    }

    // Escutar erros do console para detectar permission-denied
    const originalError = console.error;
    console.error = (...args) => {
      const errorMessage = args.join(' ');
      if (errorMessage.includes('permission-denied') || errorMessage.includes('Missing or insufficient permissions')) {
        setHasError(true);
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, [userData]);

  const handleDismiss = async () => {
    // ✅ Salvar no Firestore
    if (user) {
      try {
        await dismissAlert('walletsMigration');
      } catch (error) {
        console.error('Erro ao salvar dismiss:', error);
      }
    }
    setDismissed(true);
  };

  // Só mostrar se tiver usuário autenticado, tiver erro e não foi dismissed
  if (!user || dismissed || !hasError) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6 shadow-2xl border border-red-400/30 backdrop-blur-xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1">
              ⚠️ Ação Obrigatória!
            </h3>
            <p className="text-white/90 text-sm">
              Deploy das regras do Firestore necessário
            </p>
          </div>
        </div>

        <div className="bg-black/30 rounded-xl p-4 mb-4 border border-white/10">
          <p className="text-red-200 text-sm font-semibold mb-2">
            ❌ Erro atual:
          </p>
          <code className="text-xs text-white/80 block">
            FirebaseError: permission-denied
          </code>
        </div>

        {!showInstructions ? (
          <>
            <div className="text-white/90 text-sm space-y-2 mb-4">
              <p>
                ✅ Nova estrutura de wallets implementada
              </p>
              <p className="font-semibold text-yellow-200">
                🔒 As regras de segurança precisam ser publicadas no Firebase
              </p>
            </div>

            <button
              onClick={() => setShowInstructions(true)}
              className="w-full bg-white text-red-600 rounded-xl py-3 px-4 font-bold text-sm hover:bg-red-50 transition-colors mb-2"
            >
              📋 Ver Instruções Passo a Passo
            </button>
          </>
        ) : (
          <>
            <div className="bg-black/30 rounded-xl p-4 mb-4 border border-white/10 max-h-64 overflow-y-auto">
              <h4 className="font-bold text-white mb-3">
                🚀 Passo a Passo (2 minutos):
              </h4>
              
              <div className="space-y-3 text-sm text-white/90">
                <div>
                  <p className="font-semibold text-yellow-200 mb-1">1. Abra o Firebase Console:</p>
                  <p className="text-xs">console.firebase.google.com</p>
                </div>
                
                <div>
                  <p className="font-semibold text-yellow-200 mb-1">2. Vá para Firestore Database:</p>
                  <p className="text-xs">Menu lateral → Firestore Database → Aba "Regras"</p>
                </div>
                
                <div>
                  <p className="font-semibold text-yellow-200 mb-1">3. Cole as novas regras:</p>
                  <p className="text-xs">Copie o conteúdo de /firestore.rules e cole lá</p>
                </div>
                
                <div>
                  <p className="font-semibold text-yellow-200 mb-1">4. Clique em "Publicar":</p>
                  <p className="text-xs">Aguarde alguns segundos e recarregue esta página</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/20">
                <p className="text-xs text-white/70">
                  📄 Arquivo completo com instruções detalhadas: <span className="font-mono text-yellow-200">DEPLOY_FIRESTORE_RULES.md</span>
                </p>
              </div>
            </div>

            <a
              href="https://console.firebase.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-white text-red-600 rounded-xl py-3 px-4 font-bold text-sm hover:bg-red-50 transition-colors mb-2"
            >
              <span>🔥 Abrir Firebase Console</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </>
        )}

        <button
          onClick={handleDismiss}
          className="w-full bg-white/10 text-white rounded-xl py-2 px-4 font-semibold text-sm hover:bg-white/20 transition-colors"
        >
          {showInstructions ? 'Já fiz o deploy, fechar' : 'Fechar (não recomendado)'}
        </button>

        {!showInstructions && (
          <p className="text-xs text-white/60 text-center mt-3">
            ⚠️ A aplicação não funcionará até o deploy das regras
          </p>
        )}
      </div>
    </div>
  );
}