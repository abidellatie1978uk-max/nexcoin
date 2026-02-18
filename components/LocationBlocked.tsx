import { MapPin, RefreshCw } from 'lucide-react';

interface LocationBlockedProps {
    onRetry: () => void;
}

export function LocationBlocked({ onRetry }: LocationBlockedProps) {
    return (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <MapPin className="w-10 h-10 text-red-500" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-4">
                Acesso à Localização Obrigatório
            </h1>

            <p className="text-gray-400 mb-8 leading-relaxed">
                Para sua segurança e proteção contra fraudes, o Ethertron exige acesso à sua localização.
                Por favor, habilite o GPS nas configurações do seu dispositivo e clique em tentar novamente.
            </p>

            <button
                onClick={onRetry}
                className="w-full max-w-xs bg-white text-black font-bold py-4 rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
                <RefreshCw className="w-5 h-5" />
                Tentar Novamente
            </button>

            <p className="mt-8 text-xs text-gray-500">
                Este requisito está em conformidade com nossa Política de Privacidade e Termos de Uso.
            </p>
        </div>
    );
}
