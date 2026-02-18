import {
  ArrowLeft,
  Bell,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Shield,
  Smartphone,
  Mail,
  DollarSign
} from 'lucide-react';
import { useState } from 'react';
import type { Screen } from '../App';

interface PushSettingsProps {
  onNavigate: (screen: Screen) => void;
}

export function PushSettings({ onNavigate }: PushSettingsProps) {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [pushTransactions, setPushTransactions] = useState(true);
  const [pushDeposits, setPushDeposits] = useState(true);
  const [pushWithdrawals, setPushWithdrawals] = useState(true);
  const [pushSecurity, setPushSecurity] = useState(true);
  const [pushNewDevice, setPushNewDevice] = useState(true);
  const [pushSuspiciousActivity, setPushSuspiciousActivity] = useState(true);
  const [pushPriceAlerts, setPushPriceAlerts] = useState(false);
  const [pushMarketNews, setPushMarketNews] = useState(false);

  interface SettingItem {
    icon: any;
    label: string;
    description: string;
    value: boolean;
    onChange: (value: boolean) => void;
    main?: boolean;
    disabled?: boolean;
    nested?: boolean;
  }

  const settingsSections: Array<{ title: string; items: SettingItem[] }> = [
    {
      title: 'Geral',
      items: [
        {
          icon: Bell,
          label: 'Ativar notificações push',
          description: 'Receber todas as notificações no dispositivo',
          value: pushEnabled,
          onChange: setPushEnabled,
          main: true
        }
      ]
    },
    {
      title: 'Transações',
      items: [
        {
          icon: TrendingUp,
          label: 'Todas as transações',
          description: 'Notificações de todas as movimentações',
          value: pushTransactions,
          onChange: setPushTransactions,
          disabled: !pushEnabled
        },
        {
          icon: TrendingUp,
          label: 'Depósitos',
          description: 'Quando você receber fundos',
          value: pushDeposits,
          onChange: setPushDeposits,
          disabled: !pushEnabled || !pushTransactions,
          nested: true
        },
        {
          icon: TrendingDown,
          label: 'Saques',
          description: 'Quando processar uma retirada',
          value: pushWithdrawals,
          onChange: setPushWithdrawals,
          disabled: !pushEnabled || !pushTransactions,
          nested: true
        }
      ]
    },
    {
      title: 'Segurança',
      items: [
        {
          icon: Shield,
          label: 'Alertas de segurança',
          description: 'Todas as notificações de segurança',
          value: pushSecurity,
          onChange: setPushSecurity,
          disabled: !pushEnabled
        },
        {
          icon: Smartphone,
          label: 'Novos dispositivos',
          description: 'Login em um novo dispositivo',
          value: pushNewDevice,
          onChange: setPushNewDevice,
          disabled: !pushEnabled || !pushSecurity,
          nested: true
        },
        {
          icon: AlertCircle,
          label: 'Atividades suspeitas',
          description: 'Tentativas de acesso não autorizadas',
          value: pushSuspiciousActivity,
          onChange: setPushSuspiciousActivity,
          disabled: !pushEnabled || !pushSecurity,
          nested: true
        }
      ]
    },
    {
      title: 'Mercado',
      items: [
        {
          icon: DollarSign,
          label: 'Alertas de preço',
          description: 'Quando seus ativos atingirem metas',
          value: pushPriceAlerts,
          onChange: setPushPriceAlerts,
          disabled: !pushEnabled
        },
        {
          icon: Mail,
          label: 'Notícias do mercado',
          description: 'Atualizações importantes do mercado',
          value: pushMarketNews,
          onChange: setPushMarketNews,
          disabled: !pushEnabled
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => onNavigate('notifications')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Notificações push</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24 px-6">
        {/* Info Banner */}
        <div className="bg-zinc-900 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-white/70 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-1">Mantenha-se informado</h3>
              <p className="text-sm text-gray-400">
                Personalize suas notificações para receber apenas as informações mais importantes
              </p>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {settingsSections.map((section, idx) => (
            <div key={idx}>
              <h3 className="text-xs text-gray-400 font-semibold mb-2 px-1">
                {section.title}
              </h3>
              <div className="bg-zinc-900 rounded-2xl overflow-hidden">
                {section.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  const isDisabled = item.disabled || false;

                  return (
                    <div key={item.label}>
                      <div
                        className={`px-4 py-3 ${item.nested ? 'pl-12' : ''} ${isDisabled ? 'opacity-50' : ''
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <Icon className="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-400" />
                            <div className="flex-1">
                              <div className="font-medium">{item.label}</div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                {item.description}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => !isDisabled && item.onChange(!item.value)}
                            disabled={isDisabled}
                            className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ml-3 ${isDisabled
                                ? 'cursor-not-allowed'
                                : ''
                              } ${item.value && !isDisabled ? 'bg-white/20' : 'bg-zinc-700'
                              }`}
                          >
                            <div
                              className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${item.value ? 'translate-x-6' : 'translate-x-0.5'
                                }`}
                            />
                          </button>
                        </div>
                      </div>
                      {itemIdx < section.items.length - 1 && (
                        <div className="h-px bg-zinc-800 mx-4" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-zinc-900 rounded-2xl">
          <p className="text-xs text-gray-400 leading-relaxed">
            <strong className="text-white">Dica:</strong> Algumas notificações de segurança não podem ser desativadas para manter sua conta protegida.
          </p>
        </div>
      </div>
    </div>
  );
}