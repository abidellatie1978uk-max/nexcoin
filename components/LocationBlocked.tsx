import { MapPin, RefreshCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LocationBlockedProps {
    onRetry: () => void;
}

export function LocationBlocked({ onRetry }: LocationBlockedProps) {
    const { t } = useLanguage();

    return (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <MapPin className="w-10 h-10 text-red-500" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-4">
                {t.permissions.locationTitle}
            </h1>

            <p className="text-gray-400 mb-8 leading-relaxed">
                {t.permissions.locationDesc}
            </p>

            <button
                onClick={onRetry}
                className="w-full max-w-xs bg-white text-black font-bold py-4 rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
                <RefreshCw className="w-5 h-5" />
                {t.permissions.retry}
            </button>

            <p className="mt-8 text-xs text-gray-500">
                {t.permissions.securityNotice}
            </p>

        </div>
    );
}

