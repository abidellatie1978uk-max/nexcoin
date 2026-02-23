import {
  User,
  Database,
  Shield,
  Bell,
  HelpCircle,
  Settings,
  Globe,
  FileText,
  AlertCircle,
  ChevronRight,
  LogOut,
  Trash2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import type { Screen } from '../App';
import { toast } from 'sonner';

interface NewProfileProps {
  onNavigate: (screen: Screen) => void;
}

export function NewProfile({ onNavigate }: NewProfileProps) {
  const { userData, logout } = useAuth();
  const { t } = useLanguage();

  // Pegar iniciais do nome
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 Fazendo logout...');
      await logout();
      console.log('✅ Logout concluído! Redirecionando...');
      onNavigate('welcome');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  const menuSections = [
    {
      title: t.account,
      items: [
        { icon: User, label: t.personalInfo, action: () => onNavigate('personalInfo') },
        { icon: Database, label: t.accountData, action: () => onNavigate('accountData') },
        { icon: Shield, label: t.security, action: () => onNavigate('security') },
        { icon: Bell, label: t.notifications, action: () => onNavigate('notifications') },
      ],
    },
    {
      title: t.support,
      items: [
        { icon: HelpCircle, label: t.helpCenter, action: () => onNavigate('helpCenter') },
        { icon: FileText, label: t.termsAndPrivacy, action: () => onNavigate('termsMenu') },
      ],
    },
    {
      title: t.settings,
      items: [
        { icon: Globe, label: t.language, action: () => onNavigate('languageSettings') },
        // { icon: Settings, label: t.appPreferences, action: () => onNavigate('appPreferences') }, // Removido
        { icon: LogOut, label: t.logout, action: handleLogout, danger: true },
      ],
    },
    {
      title: t.dangerZone,
      items: [
        { icon: Trash2, label: t.deleteAccount, action: () => onNavigate('deleteAccount'), danger: true },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Header */}
        <header className="px-6 pt-6 pb-4">
          <h1 className="text-xl mb-4">{t.myProfile}</h1>

          {/* User Info */}
          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-4 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-purple-500 flex items-center justify-center text-lg overflow-hidden">
                {userData?.photoURL ? (
                  <img
                    src={userData.photoURL}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  userData ? getInitials(userData.name) : 'U'
                )}
              </div>
              <div className="flex-1">
                <h2 className="">{userData?.name || 'Usuário'}</h2>
                <p className="text-sm text-gray-400">{userData?.email || ''}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Menu Sections */}
        {menuSections.map((section, index) => (
          <section key={index} className="px-6 mb-6">
            <h3 className="text-xs text-gray-400 mb-2 px-1">
              {section.title.toUpperCase()}
            </h3>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]">
              {section.items.map((item, itemIdx) => {
                const Icon = item.icon;
                return (
                  <div key={item.label}>
                    <button
                      onClick={item.action}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${item.danger ? 'text-red-500' : 'text-gray-400'}`} />
                        <span className={item.danger ? 'text-red-500' : ''}>{item.label}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                    {itemIdx < section.items.length - 1 && (
                      <div className="h-px bg-white/10 mx-4" />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* Version */}
        <div className="text-center mt-6 text-sm text-gray-500">
          NexCoin v1.0.0
        </div>
      </div>
    </div>
  );
}
