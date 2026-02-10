import { X, ExternalLink, Copy, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface FirestoreSetupInstructionsProps {
  onClose: () => void;
}

export function FirestoreSetupInstructions({ onClose }: FirestoreSetupInstructionsProps) {
  const [copied, setCopied] = useState(false);

  const firestoreRules = `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // 📍 Localizações dos usuários
    match /userLocations/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 👤 Dados dos usuários
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 💰 Saldos dos usuários
    match /balances/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 📊 Transações
    match /transactions/{transactionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
    
    // 🔄 Transferências de cripto
    match /cryptoTransfers/{transferId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }

    // 🏦 Contas bancárias
    match /bankAccounts/{accountId} {
      allow read, write: if request.auth != null;
    }
  }
}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(firestoreRules);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[0_0_40px_rgba(255,255,255,0.1)]">
        {/* Header */}
        <div className="sticky top-0 bg-white/5 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl text-white">🔐 Configurar Firestore</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Alert */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
            <p className="text-red-400 text-sm">
              ⚠️ As regras de segurança do Firestore precisam ser configuradas para permitir o salvamento de localizações.
            </p>
          </div>

          {/* Passo 1 - MAIS DIRETO */}
          <div className="space-y-3">
            <h3 className="text-white font-medium flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">1</span>
              Acesse o Firebase Console
            </h3>
            <a
              href="https://console.firebase.google.com/project/nexcoin-1f42f/firestore/rules"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-blue-500/20 backdrop-blur-md rounded-xl px-4 py-3 border border-blue-500/30 hover:bg-blue-500/30 transition-all"
            >
              <ExternalLink className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400 flex-1 font-medium">Clique aqui para abrir Firestore Rules</span>
            </a>
          </div>

          {/* Passo 2 */}
          <div className="space-y-3">
            <h3 className="text-white font-medium flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">2</span>
              Navegue até as regras
            </h3>
            <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/10">
              <p className="text-xs text-white/60">
                Firestore Database → <span className="text-white">Rules</span>
              </p>
            </div>
          </div>

          {/* Passo 3 */}
          <div className="space-y-3">
            <h3 className="text-white font-medium flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">3</span>
              Cole estas regras
            </h3>
            
            {/* Code Block */}
            <div className="relative">
              <pre className="bg-black/40 rounded-xl p-4 border border-white/10 overflow-x-auto text-xs text-white/80 font-mono">
                {firestoreRules}
              </pre>
              <button
                onClick={copyToClipboard}
                className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg px-3 py-1.5 flex items-center gap-2 border border-white/10 transition-all"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-white/60" />
                    <span className="text-xs text-white/60">Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Passo 4 */}
          <div className="space-y-3">
            <h3 className="text-white font-medium flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">4</span>
              Publique as regras
            </h3>
            <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/10">
              <p className="text-xs text-white/60">
                Clique no botão <span className="text-white font-medium">Publicar</span> (Publish)
              </p>
            </div>
          </div>

          {/* Success Note */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
            <p className="text-green-400 text-sm">
              ✅ Após publicar, aguarde 1 minuto e recarregue a página. As localizações serão salvas automaticamente!
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10 text-white transition-all"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}