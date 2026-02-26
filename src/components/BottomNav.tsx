import { Home, Wallet, ArrowLeftRight, TrendingUp, User } from 'lucide-react';
import type { Screen } from '../App';
import { useLanguage } from '../contexts/LanguageContext';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function BottomNav({ currentScreen, onNavigate }: BottomNavProps) {
  const { t } = useLanguage();
  
  const navItems = [
    { id: 'home' as Screen, icon: Home, label: t.bottomNav.home },
    { id: 'wallet' as Screen, icon: Wallet, label: t.bottomNav.wallet },
    { id: 'convert' as Screen, icon: ArrowLeftRight, label: t.bottomNav.convert },
    { id: 'crypto' as Screen, icon: TrendingUp, label: t.bottomNav.crypto },
    { id: 'profile' as Screen, icon: User, label: t.bottomNav.profile },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-[9999]">
      <div 
        className="flex justify-around items-center py-3 px-4 max-w-md mx-auto relative z-10 pointer-events-auto"
        style={{ transform: 'translateZ(0)', willChange: 'transform' }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex flex-col items-center gap-1 transition-colors"
            >
              <Icon 
                className={`w-6 h-6 ${
                  isActive ? 'text-white' : 'text-gray-500'
                }`}
              />
              <span 
                className={`text-xs ${
                  isActive ? 'text-white' : 'text-gray-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}