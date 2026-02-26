import { ArrowLeft, Check, Globe } from 'lucide-react';
import type { Screen } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
import type { Language } from '../lib/translations';
import { toast } from 'sonner';

interface LanguageSettingsProps {
  onNavigate: (screen: Screen) => void;
}

export function LanguageSettings({ onNavigate }: LanguageSettingsProps) {
  const { language, setLanguage, t } = useLanguage();

  const languages = [
    {
      code: 'pt' as Language,
      name: t.portuguese,
      nativeName: 'Português (Brasil)',
      flag: '🇧🇷'
    },
    {
      code: 'en' as Language,
      name: t.english,
      nativeName: 'English (US)',
      flag: '🇺🇸'
    },
    {
      code: 'es' as Language,
      name: t.spanish,
      nativeName: 'Español',
      flag: '🇪🇸'
    }
  ];

  const handleLanguageChange = async (lang: Language) => {
    await setLanguage(lang);
    toast.success(t.languageUpdated);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="px-6 pt-6 pb-4 flex items-center gap-4">
        <button
          onClick={() => onNavigate('profile')}
          className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border-2 border-white/20 flex items-center justify-center active:scale-95 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]"
        >
          <ArrowLeft className="w-5 h-5 font-light" />
        </button>
        <h1 className="text-xl">{t.languageSettings}</h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24 px-6">
        {/* Info Card */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 mb-6 shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-green-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="mb-1">{t.selectLanguage}</h3>
              <p className="text-sm text-gray-400">
                O idioma será aplicado em todo o aplicativo
              </p>
            </div>
          </div>
        </div>

        {/* Language Options */}
        <div className="space-y-3">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full p-4 rounded-2xl border transition-all active:scale-95 ${language === lang.code
                  ? 'bg-green-500/20 border-green-500/30'
                  : 'bg-white/5 backdrop-blur-md border-white/10'
                } shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{lang.flag}</span>
                  <div className="text-left">
                    <div className="text-white mb-0.5">{lang.nativeName}</div>
                    <div className="text-xs text-gray-400">{lang.name}</div>
                  </div>
                </div>

                {language === lang.code && (
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-6 p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]">
          <h4 className="mb-2 flex items-center gap-2 text-sm">
            <Globe className="w-4 h-4 text-green-500" />
            Idiomas disponíveis
          </h4>
          <ul className="space-y-2 text-xs text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              <span>Português - Idioma padrão para Brasil</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              <span>English - Default language for international users</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              <span>Español - Idioma predeterminado para usuarios hispanohablantes</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
