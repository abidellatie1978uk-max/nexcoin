import { ChevronLeft, User, Mail, Phone, MapPin, Calendar, Flag, Edit2, Save, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Screen } from '../App';

interface PersonalInfoProps {
  onNavigate: (screen: Screen) => void;
}

export function PersonalInfo({ onNavigate }: PersonalInfoProps) {
  const { userData, user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    birthDate: userData?.birthDate || '',
    address: userData?.address || '',
    city: userData?.city || '',
    state: userData?.state || '',
    zipCode: userData?.zipCode || '',
    document: userData?.document || '',
    patrimony: userData?.patrimony || '',
    accountPurpose: userData?.accountPurpose || []
  });

  // Pegar iniciais do nome
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Salvar alterações
  const handleSave = async () => {
    if (!user || !userData) return;

    setIsSaving(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, editData);
      
      // Atualizar estado local
      Object.assign(userData, editData);
      
      setIsEditing(false);
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      alert('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // Formatar telefone
  const formatPhone = (phone: string) => {
    if (!phone) return '';
    // Formato: +55 11 98765-4321
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 13) { // +5511987654321
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    return phone;
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => onNavigate('profile')}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-900 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {isEditing && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-purple-500 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold flex-1">Informações pessoais</h1>
            {!isEditing && (
              <div style={{ display: 'none' }}>
                {/* Botão removido */}
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-blue-500">@{userData?.name?.toLowerCase().replace(/\s+/g, '') || 'usuario'}</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-purple-500 flex items-center justify-center text-lg font-bold overflow-hidden">
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
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24 px-6">
        {/* Conta Pessoal Section */}
        <div className="mb-8">
          <h2 className="text-base font-semibold mb-3">Conta pessoal</h2>
          
          <div className="bg-zinc-900 rounded-3xl p-4 space-y-4">
            {/* Nome */}
            <div className="py-2">
              <span className="text-xs text-gray-400 block mb-1.5">Nome completo</span>
              <p className="text-sm">{userData?.name?.toUpperCase() || 'NÃO INFORMADO'}</p>
            </div>

            <div className="h-px bg-white/10" />

            {/* Data de Nascimento */}
            <div className="py-2">
              <span className="text-xs text-gray-400 block mb-1.5">Data de nascimento</span>
              {isEditing ? (
                <input
                  type="date"
                  value={editData.birthDate}
                  onChange={(e) => setEditData({...editData, birthDate: e.target.value})}
                  className="w-full bg-black/50 rounded-xl px-3 py-2 text-sm border border-white/10 focus:border-orange-500 outline-none"
                />
              ) : (
                <p className="text-sm">{userData?.birthDate || 'NÃO INFORMADO'}</p>
              )}
            </div>

            <div className="h-px bg-white/10" />

            {/* Documento */}
            <div className="py-2">
              <span className="text-xs text-gray-400 block mb-1.5">Documento de identificação (CPF/RG/Passaporte)</span>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.document}
                  onChange={(e) => setEditData({...editData, document: e.target.value})}
                  placeholder="Digite seu CPF, RG ou Passaporte"
                  className="w-full bg-black/50 rounded-xl px-3 py-2 text-sm border border-white/10 focus:border-orange-500 outline-none"
                />
              ) : (
                <p className="text-sm">{userData?.document || 'NÃO INFORMADO'}</p>
              )}
            </div>

            <div className="h-px bg-white/10" />

            {/* Endereço */}
            <div className="py-2">
              <span className="text-xs text-gray-400 block mb-1.5">Endereço residencial</span>
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editData.address}
                    onChange={(e) => setEditData({...editData, address: e.target.value})}
                    placeholder="Rua, número, complemento"
                    className="w-full bg-black/50 rounded-xl px-3 py-2 text-sm border border-white/10 focus:border-orange-500 outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={editData.city}
                      onChange={(e) => setEditData({...editData, city: e.target.value})}
                      placeholder="Cidade"
                      className="bg-black/50 rounded-xl px-3 py-2 text-sm border border-white/10 focus:border-orange-500 outline-none"
                    />
                    <input
                      type="text"
                      value={editData.state}
                      onChange={(e) => setEditData({...editData, state: e.target.value})}
                      placeholder="Estado"
                      className="bg-black/50 rounded-xl px-3 py-2 text-sm border border-white/10 focus:border-orange-500 outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    value={editData.zipCode}
                    onChange={(e) => setEditData({...editData, zipCode: e.target.value})}
                    placeholder="CEP"
                    className="w-full bg-black/50 rounded-xl px-3 py-2 text-sm border border-white/10 focus:border-orange-500 outline-none"
                  />
                </div>
              ) : (
                <p className="text-sm">
                  {userData?.address && userData?.city && userData?.state && userData?.zipCode
                    ? `${userData.address}, ${userData.zipCode}, ${userData.city}, ${userData.state}`
                    : 'NÃO INFORMADO'}
                </p>
              )}
            </div>

            <div className="h-px bg-white/10" />

            {/* Telefone */}
            <div className="py-2">
              <span className="text-xs text-gray-400 block mb-1.5">Número de celular</span>
              <p className="text-sm">{formatPhone(userData?.phone || '') || 'NÃO INFORMADO'}</p>
            </div>

            <div className="h-px bg-white/10" />

            {/* E-mail */}
            <div className="py-2">
              <span className="text-xs text-gray-400 block mb-1.5">E-mail</span>
              <p className="text-sm text-orange-500">{userData?.email || 'NÃO INFORMADO'}</p>
            </div>

            <div className="h-px bg-white/10" />

            {/* País */}
            <div className="py-2">
              <span className="text-xs text-gray-400 block mb-1.5">Domicílio fiscal</span>
              <p className="text-sm">{userData?.country || 'NÃO INFORMADO'}</p>
            </div>
          </div>
        </div>

        {/* Patrimônio Section */}
        <div>
          <h2 className="text-base font-semibold mb-3">Patrimônio</h2>
          
          <div className="bg-zinc-900 rounded-3xl p-4">
            <div className="py-2">
              <span className="text-xs text-gray-400 block mb-1.5">Patrimônio informado (opcional)</span>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.patrimony}
                  onChange={(e) => setEditData({...editData, patrimony: e.target.value})}
                  placeholder="Ex: R$ 500.000,00"
                  className="w-full bg-black/50 rounded-xl px-3 py-2 text-sm border border-white/10 focus:border-orange-500 outline-none"
                />
              ) : (
                <p className="text-sm">{userData?.patrimony || 'NÃO INFORMADO'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}