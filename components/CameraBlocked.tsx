import { Camera, RefreshCw } from 'lucide-react';

interface CameraBlockedProps {
    onRetry: () => void;
}

export function CameraBlocked({ onRetry }: CameraBlockedProps) {
    return (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                <Camera className="w-10 h-10 text-blue-500" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-4">
                Acesso à Câmera Obrigatório
            </h1>

            <p className="text-gray-400 mb-8 leading-relaxed">
                O NexCoin exige acesso à câmera para verificação de identidade (KYC) e segurança da sua conta.
                Por favor, habilite a permissão de câmera nas configurações do seu dispositivo e clique em tentar novamente.
            </p>

            <button
                onClick={onRetry}
                className="w-full max-w-xs bg-white text-black font-bold py-4 rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
                <RefreshCw className="w-5 h-5" />
                Tentar Novamente
            </button>

            <p className="mt-8 text-xs text-gray-500">
                Este requisito garante a integridade das suas transações e protege sua conta contra acessos não autorizados.
            </p>
        </div>
    );
}
