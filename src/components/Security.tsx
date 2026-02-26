import {
  ArrowLeft,
  Lock,
  Shield,
  ChevronRight,
  Bell,
  Info,
  Smartphone,
  Mail,
  AlertTriangle,
  Eye,
  KeyRound
} from 'lucide-react';
import { useState } from 'react';
import type { Screen } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

interface SecurityProps {
  onNavigate: (screen: Screen) => void;
}

export function Security({ onNavigate }: SecurityProps) {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const { userData } = useAuth();
  const { t } = useLanguage();

  const securityItems = [
    {
      title: 'Autenticação',
      items: [
        {
          icon: Lock,
          label: 'Alterar senha',
          description: 'Última alteração há 3 meses',
          action: () => onNavigate('changePassword'),
          type: 'button' as const
        },
        {
          icon: Smartphone,
          label: 'Autenticação de dois fatores',
          description: 'Adicione uma camada extra de segurança',
          action: () => setTwoFactorEnabled(!twoFactorEnabled),
          type: 'toggle' as const,
          enabled: twoFactorEnabled
        }
      ]
    },
    {
      title: 'Notificações de segurança',
      items: [
        {
          icon: Mail,
          label: 'Alertas por e-mail',
          description: 'Receba notificações de atividades suspeitas',
          action: () => setEmailNotifications(!emailNotifications),
          type: 'toggle' as const,
          enabled: emailNotifications
        },
        {
          icon: AlertTriangle,
          label: 'Atividades recentes',
          description: 'Veja dispositivos e acessos recentes',
          action: () => { },
          type: 'button' as const
        }
      ]
    },
    {
      title: 'Privacidade',
      items: [
        {
          icon: Eye,
          label: 'Dispositivos conectados',
          description: '3 dispositivos ativos',
          action: () => { },
          type: 'button' as const
        },
        {
          icon: KeyRound,
          label: 'Sessões ativas',
          description: 'Gerencie suas sessões',
          action: () => { },
          type: 'button' as const
        }
      ]
    },

  ];

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
        <h1 className="text-xl">{t.security}</h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24 px-6">
        {/* Security Alert */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 mb-6 backdrop-blur-md">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-green-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="mb-1">{t.yourAccountProtected}</h3>
              <p className="text-sm text-gray-400">
                {t.keepInfoSecure}
              </p>
            </div>
          </div>
        </div>

        {/* Security Sections */}
        <div className="space-y-6">


          {securityItems.map((section, idx) => (
            <div key={idx}>
              <h3 className="text-xs text-gray-400 mb-2 px-1">
                {section.title}
              </h3>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]">
                {section.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label}>
                      <button
                        onClick={item.action}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Icon className="w-5 h-5 text-gray-400" />
                          <div className="flex-1 text-left">
                            <div className="text-white">{item.label}</div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {item.description}
                            </div>
                          </div>
                        </div>
                        {item.type === 'toggle' ? (
                          <div
                            className={`w - 12 h - 6 rounded - full transition - colors ${item.enabled ? 'bg-green-500' : 'bg-zinc-700'
                              } `}
                          >
                            <div
                              className={`w - 5 h - 5 bg - white rounded - full mt - 0.5 transition - transform ${item.enabled ? 'translate-x-6' : 'translate-x-0.5'
                                } `}
                            />
                          </div>
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      {itemIdx < section.items.length - 1 && (
                        <div className="h-px bg-white/10 mx-4" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Security Tips */}
        <div className="mt-6 p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]">
          <h4 className="mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            Dicas de segurança
          </h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              <span>Use uma senha forte e única</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              <span>Ative a autenticação de dois fatores</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              <span>Nunca compartilhe suas credenciais</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}