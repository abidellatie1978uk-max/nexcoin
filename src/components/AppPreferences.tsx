import { ArrowLeft, Globe, DollarSign, Bell, Moon, Smartphone, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { Screen } from '../App';

interface AppPreferencesProps {
  onNavigate: (screen: Screen) => void;
}

export function AppPreferences({ onNavigate }: AppPreferencesProps) {
  const [language, setLanguage] = useState('pt');
  const [currency, setCurrency] = useState('USD');
  const [notifications, setNotifications] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);

  const [autoLock, setAutoLock] = useState('5min');
  const [darkMode, setDarkMode] = useState(true);

  const languages = [
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
  ];

  const currencies = [
    { code: 'USD', symbol: '$', name: 'Dólar Americano' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'BRL', symbol: 'R$', name: 'Real Brasileiro' },
    { code: 'USDT', symbol: 'USDT', name: 'Tether' },
  ];

  const autoLockOptions = [
    { value: 'instant', label: 'Imediato' },
    { value: '1min', label: '1 minuto' },
    { value: '5min', label: '5 minutos' },
    { value: '15min', label: '15 minutos' },
    { value: 'never', label: 'Nunca' },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="px-6 pt-6 pb-4 sticky top-0 bg-black z-10">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => onNavigate('profile')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl">Preferências do App</h1>
        </div>
      </header>

      {/* Content */}
      <div className="px-6 pb-24 space-y-8">
        {/* Language Section */}
        <h2 className="text-xs text-gray-400 mb-3 px-1">IDIOMA</h2>
        <div className="bg-zinc-900 rounded-2xl overflow-hidden">
          {languages.map((lang, idx) => (
            <div key={lang.code}>
              <button
                onClick={() => setLanguage(lang.code)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <span>{lang.name}</span>
                </div>
                {language === lang.code && (
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </button>
              {idx < languages.length - 1 && (
                <div className="h-px bg-zinc-800 mx-4" />
              )}
            </div>
          ))}
        </div>

        {/* Currency Section */}
        <h2 className="text-xs text-gray-400 mb-3 px-1">MOEDA PADRÃO</h2>
        <div className="bg-zinc-900 rounded-2xl overflow-hidden">
          {currencies.map((curr, idx) => (
            <div key={curr.code}>
              <button
                onClick={() => setCurrency(curr.code)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800 transition-colors"
              >
                <div className="text-left">
                  <div>{curr.code}</div>
                  <div className="text-xs text-gray-400">{curr.name}</div>
                </div>
                {currency === curr.code && (
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </button>
              {idx < currencies.length - 1 && (
                <div className="h-px bg-zinc-800 mx-4" />
              )}
            </div>
          ))}
        </div>

        {/* Display Section */}
        <h2 className="text-xs text-gray-400 mb-3 px-1">EXIBIÇÃO</h2>
        <div className="bg-zinc-900 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-gray-400" />
              <div>
                <div>Modo escuro</div>
                <div className="text-xs text-gray-400">Tema dark ativado</div>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-12 h-7 rounded-full transition-colors ${darkMode ? 'bg-green-500' : 'bg-zinc-700'
                }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2 px-1">
          O NexCoin usa tema escuro por padrão para melhor experiência visual
        </p>

        {/* Info Section */}
        <div className="bg-zinc-900 rounded-2xl p-4">
          <p className="text-xs text-gray-400 text-center">
            Suas preferências são salvas automaticamente e sincronizadas entre dispositivos
          </p>
        </div>
      </div>
    </div>
  );
}