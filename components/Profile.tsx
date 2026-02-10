import React, { 
  X, 
  HelpCircle, 
  User, 
  Shield, 
  Eye, 
  Bell, 
  Palette, 
  Accessibility,
  Info,
  ExternalLink,
  LogOut,
  ChevronRight,
  FileText,
  Languages,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Search // ← Novo ícone
} from 'lucide-react';
import type { Screen } from '../App';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BottomNav } from './BottomNav';
import { DiagnosticPixKeys } from './DiagnosticPixKeys'; // ← Novo componente

interface ProfileProps {
  onNavigate: (screen: Screen) => void;
}

export function Profile({ onNavigate }: ProfileProps) {
  const { userData, user, logout } = useAuth();
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false); // ← Novo estado
  
  const handleLogout = async () => {
    try {
      console.log('🚪 Fazendo logout...');
      await logout();
      console.log('✅ Logout concluído! Redirecionando...');
      onNavigate('welcome');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const glassEffect = 'bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]';

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="px-6 pt-8 pb-32">{/* Increased bottom padding */}
        {/* Header */}
        <button 
          onClick={() => onNavigate('home')}
          className="w-12 h-12 rounded-full border border-gray-700 flex items-center justify-center mb-8"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 mb-4 flex items-center justify-center text-3xl font-bold text-white">
            {userData?.name ? userData.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <h1 className="text-2xl font-semibold">{userData?.name || 'Usuário'}</h1>
          <p className="text-sm text-gray-400 mt-1">{userData?.email || user?.email || 'Não informado'}</p>
        </div>

        {/* Menu Items */}
        <div className="space-y-4">
          {/* Informações Pessoais - Expandível */}
          <div className={`rounded-2xl overflow-hidden transition-all ${glassEffect}`}>
            <button 
              onClick={() => setShowPersonalInfo(!showPersonalInfo)}
              className="w-full px-4 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-gray-400">
                  <User className="w-5 h-5" />
                </div>
                <span className="font-medium">Informações Pessoais</span>
              </div>
              <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${showPersonalInfo ? 'rotate-90' : ''}`} />
            </button>
            
            {/* Conteúdo Expandível */}
            {showPersonalInfo && (
              <div className="px-4 pb-4 space-y-4 border-t border-white/10 pt-4">
                {/* Nome - só mostra se existir */}
                {userData?.name && (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 mb-1">Nome Completo</p>
                      <p className="text-white">{userData.name}</p>
                    </div>
                  </div>
                )}
                
                {/* Email - só mostra se existir */}
                {(userData?.email || user?.email) && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 mb-1">Email</p>
                      <p className="text-white">{userData?.email || user?.email}</p>
                    </div>
                  </div>
                )}
                
                {/* Mensagem se não houver dados */}
                {!userData?.name && !userData?.email && !user?.email && (
                  <div className="text-center py-6">
                    <p className="text-gray-400 text-sm">Nenhuma informação cadastrada</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* First Group */}
          <div className={`rounded-2xl overflow-hidden ${glassEffect}`}>
            <MenuItem icon={<HelpCircle className="w-5 h-5" />} label="Ajuda" onClick={() => {}} />
          </div>

          {/* Second Group */}
          <div className={`rounded-2xl overflow-hidden ${glassEffect}`}>
            <MenuItem icon={<Shield className="w-5 h-5" />} label="Segurança" onClick={() => {}} />
            <MenuItem icon={<Eye className="w-5 h-5" />} label="Privacidade" onClick={() => {}} showDivider />
            <MenuItem icon={<Bell className="w-5 h-5" />} label="Notificações" onClick={() => {}} />
            <MenuItem icon={<Languages className="w-5 h-5" />} label="Idioma" onClick={() => {}} showDivider />
          </div>

          {/* Third Group */}
          <div className={`rounded-2xl overflow-hidden ${glassEffect}`}>
            <MenuItem icon={<Info className="w-5 h-5" />} label="Sobre nós" onClick={() => {}} />
            <MenuItem icon={<Search className="w-5 h-5 text-yellow-500" />} label="🔍 Diagnóstico PIX" onClick={() => setShowDiagnostic(true)} showDivider /> {/* ← Novo */}
            <MenuItem icon={<LogOut className="w-5 h-5 text-red-500" />} label="Sair" onClick={handleLogout} showDivider />
          </div>
        </div>
      </div>

      <BottomNav currentScreen="profile" onNavigate={onNavigate} />
      
      {/* Modal de Diagnóstico */}
      {showDiagnostic && <DiagnosticPixKeys onClose={() => setShowDiagnostic(false)} />}
    </div>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  showDivider?: boolean;
  onClick?: () => void;
}

function MenuItem({ icon, label, showDivider = false, onClick }: MenuItemProps) {
  return (
    <>
      <button 
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          <div className="text-gray-400">{icon}</div>
          <span className="font-medium">{label}</span>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>
      {showDivider && <div className="h-px bg-zinc-800 mx-4" />}
    </>
  );
}