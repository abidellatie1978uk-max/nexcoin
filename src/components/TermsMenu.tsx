import { ArrowLeft, FileText, Lock } from 'lucide-react';
import type { Screen } from '../App';

interface TermsMenuProps {
  onNavigate: (screen: Screen) => void;
}

export function TermsMenu({ onNavigate }: TermsMenuProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => onNavigate('profile')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Termos e Privacidade</h1>
        </div>
      </header>

      {/* Content */}
      <div className="px-6 space-y-4">
        {/* Terms of Use */}
        <button
          onClick={() => onNavigate('termsAndConditions')}
          className="w-full bg-zinc-900 hover:bg-zinc-800 transition-colors rounded-2xl p-4 text-left"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Termos de Uso</h3>
              <p className="text-sm text-gray-400">
                Leia os termos e condições de uso do NexCoin
              </p>
            </div>
          </div>
        </button>

        {/* Privacy Policy */}
        <button
          onClick={() => onNavigate('privacyPolicy')}
          className="w-full bg-zinc-900 hover:bg-zinc-800 transition-colors rounded-2xl p-4 text-left"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <Lock className="w-6 h-6 text-purple-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Política de Privacidade</h3>
              <p className="text-sm text-gray-400">
                Saiba como protegemos e usamos seus dados
              </p>
            </div>
          </div>
        </button>

        {/* Info */}
        <div className="bg-zinc-900 rounded-2xl p-4 mt-6">
          <p className="text-xs text-gray-400">
            Última atualização: 26 de janeiro de 2026
          </p>
        </div>
      </div>
    </div>
  );
}
