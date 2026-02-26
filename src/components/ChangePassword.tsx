import { ArrowLeft, Lock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import type { Screen } from '../App';
import { auth } from '../lib/firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

interface ChangePasswordProps {
  onNavigate: (screen: Screen) => void;
}

export function ChangePassword({ onNavigate }: ChangePasswordProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Validação de força da senha
  const validatePasswordStrength = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    return requirements;
  };

  const passwordStrength = validatePasswordStrength(newPassword);
  const isPasswordValid = Object.values(passwordStrength).every(Boolean);

  const handleChangePassword = async () => {
    // Validações
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Preencha todos os campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (!isPasswordValid) {
      setError('A nova senha não atende aos requisitos de segurança');
      return;
    }

    if (newPassword === currentPassword) {
      setError('A nova senha deve ser diferente da senha atual');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const user = auth.currentUser;
      
      if (!user || !user.email) {
        throw new Error('Usuário não autenticado');
      }

      // Reautenticar usuário com a senha atual
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Atualizar senha
      await updatePassword(user, newPassword);

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Voltar para a página de segurança após 2 segundos
      setTimeout(() => {
        onNavigate('security');
      }, 2000);

    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      
      if (error.code === 'auth/wrong-password') {
        setError('Senha atual incorreta');
      } else if (error.code === 'auth/weak-password') {
        setError('A nova senha é muito fraca');
      } else if (error.code === 'auth/requires-recent-login') {
        setError('Por segurança, faça login novamente antes de alterar a senha');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Erro de conexão. Verifique sua internet');
      } else {
        setError('Erro ao alterar senha. Tente novamente');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="px-6 pt-6 pb-4 flex items-center gap-4">
        <button
          onClick={() => onNavigate('security')}
          className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border-2 border-white/20 flex items-center justify-center active:scale-95 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25)]"
        >
          <ArrowLeft className="w-5 h-5 font-light" />
        </button>
        <h1 className="text-xl">Alterar senha</h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24 px-6">
        {/* Success Message */}
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 mb-6 backdrop-blur-md">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-green-500 mb-1">Senha alterada com sucesso!</h3>
                <p className="text-sm text-gray-400">
                  Redirecionando...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6 backdrop-blur-md">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="space-y-6">
          {/* Current Password */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Senha atual
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Digite sua senha atual"
                className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-12 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-white/30 transition-colors"
                disabled={isLoading || success}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                disabled={isLoading || success}
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Nova senha
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite sua nova senha"
                className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-12 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-white/30 transition-colors"
                disabled={isLoading || success}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                disabled={isLoading || success}
              >
                {showNewPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Password Requirements */}
            {newPassword && (
              <div className="mt-3 p-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
                <p className="text-xs text-gray-400 mb-2">Requisitos da senha:</p>
                <div className="space-y-1">
                  <div className={`text-xs flex items-center gap-2 ${passwordStrength.length ? 'text-green-500' : 'text-gray-500'}`}>
                    <Check className="w-3 h-3" />
                    Mínimo de 8 caracteres
                  </div>
                  <div className={`text-xs flex items-center gap-2 ${passwordStrength.uppercase ? 'text-green-500' : 'text-gray-500'}`}>
                    <Check className="w-3 h-3" />
                    Letra maiúscula (A-Z)
                  </div>
                  <div className={`text-xs flex items-center gap-2 ${passwordStrength.lowercase ? 'text-green-500' : 'text-gray-500'}`}>
                    <Check className="w-3 h-3" />
                    Letra minúscula (a-z)
                  </div>
                  <div className={`text-xs flex items-center gap-2 ${passwordStrength.number ? 'text-green-500' : 'text-gray-500'}`}>
                    <Check className="w-3 h-3" />
                    Número (0-9)
                  </div>
                  <div className={`text-xs flex items-center gap-2 ${passwordStrength.special ? 'text-green-500' : 'text-gray-500'}`}>
                    <Check className="w-3 h-3" />
                    Caractere especial (!@#$%...)
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Confirmar nova senha
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua nova senha"
                className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-12 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-white/30 transition-colors"
                disabled={isLoading || success}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                disabled={isLoading || success}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-400 mt-2">As senhas não coincidem</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleChangePassword}
            disabled={isLoading || success || !currentPassword || !newPassword || !confirmPassword || !isPasswordValid || newPassword !== confirmPassword}
            className="w-full bg-white text-black py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors active:scale-95"
          >
            {isLoading ? 'Alterando senha...' : 'Alterar senha'}
          </button>
        </div>

        {/* Security Tips */}
        <div className="mt-6 p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
          <h4 className="mb-2 flex items-center gap-2 text-sm">
            <Lock className="w-4 h-4 text-gray-400" />
            Dicas de segurança
          </h4>
          <ul className="space-y-2 text-xs text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-gray-500 mt-0.5">•</span>
              <span>Nunca compartilhe sua senha com ninguém</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-500 mt-0.5">•</span>
              <span>Use uma senha única para cada serviço</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-500 mt-0.5">•</span>
              <span>Considere usar um gerenciador de senhas</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
