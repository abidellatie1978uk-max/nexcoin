import { X, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import type { Screen } from '../App';

interface SecurityPromotionProps {
  onNavigate: (screen: Screen) => void;
}

export function SecurityPromotion({ onNavigate }: SecurityPromotionProps) {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="bg-[#f2f2f7] dark:bg-black text-slate-900 dark:text-white min-h-screen flex flex-col overflow-hidden">
        {/* Close Button */}
        <div className="px-6 py-4 pt-6">
          <button 
            onClick={() => onNavigate('home')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-900 dark:text-white transition-opacity active:opacity-60"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-32">
          <div className="bg-white dark:bg-[#1c1c1e] rounded-[32px] overflow-hidden flex flex-col h-full max-h-[600px]">
            {/* Title */}
            <div className="p-8 pb-0">
              <h1 className="text-4xl font-bold tracking-tight leading-tight dark:text-white text-slate-900">
                Seu dinheiro,<br />protegido
              </h1>
            </div>

            {/* Image Section */}
            <div className="flex-1 flex items-end justify-center relative min-h-[340px]">
              <div className="w-full h-full relative flex items-center justify-center p-4">
                <img 
                  alt="Layered futuristic 3D security components with metallic finish" 
                  className="w-full h-full object-cover rounded-b-[32px] opacity-90 mix-blend-lighten dark:mix-blend-normal" 
                  src="https://images.unsplash.com/photo-1639152201978-931fd2ec8083?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHwzRCUyMG1ldGFsbGljJTIwc2VjdXJpdHklMjBsYXllcnMlMjBmdXR1cmlzdGljfGVufDF8fHx8MTc2OTE4ODc2Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#1c1c1e] via-transparent to-transparent h-1/4 bottom-0"></div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6 px-4">
            <p className="text-[17px] leading-relaxed text-slate-600 dark:text-zinc-300">
              Assuma o controle total das suas finanças. Personalize mais de 10 recursos de segurança e vá além das configurações padrão.
            </p>
          </div>
        </main>

        {/* Fixed Bottom Button */}
        <div className="fixed bottom-0 left-0 right-0 p-6 pb-10 bg-gradient-to-t from-[#f2f2f7] dark:from-black via-[#f2f2f7] dark:via-black to-transparent">
          <button className="w-full bg-slate-900 dark:bg-white text-white dark:text-black py-4 rounded-full font-bold text-lg transition-transform active:scale-95 shadow-lg">
            Personalizar controles
          </button>
        </div>

        {/* Dark Mode Toggle */}
        <div className="fixed top-20 right-4 z-50">
          <button 
            className="p-2 bg-slate-200 dark:bg-zinc-800 rounded-full shadow-md"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? (
              <Sun className="w-6 h-6 text-yellow-400" />
            ) : (
              <Moon className="w-6 h-6 text-slate-700" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}