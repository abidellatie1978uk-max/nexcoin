import { ChevronLeft, ChevronRight, CreditCard, Mail, Phone } from 'lucide-react';
import { useState } from 'react';
import type { BankAccount } from '../lib/bankAccountGenerator';
import { EnterPixKey } from './EnterPixKey';

interface RegisterPixKeyProps {
  account: BankAccount;
  onBack: () => void;
  onSuccess?: () => void;
}

export function RegisterPixKey({ account, onBack, onSuccess }: RegisterPixKeyProps) {
  const [selectedKeyType, setSelectedKeyType] = useState<'cpf' | 'email' | 'phone' | null>(null);

  const keyOptions = [
    {
      id: 'cpf',
      label: 'CPF',
      icon: CreditCard,
    },
    {
      id: 'email',
      label: 'E-mail',
      icon: Mail,
    },
    {
      id: 'phone',
      label: 'Número de telefone',
      icon: Phone,
    },
  ];

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#1a2942] via-black to-black flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center px-6 pt-6 pb-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-zinc-800/50 backdrop-blur-md flex items-center justify-center hover:bg-zinc-700/50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-24">
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-3">Cadastrar uma Chave Pix</h1>
          <p className="text-gray-400 text-base">
            Cadastre uma Chave Pix para começar a receber BRL
          </p>
        </div>

        {/* Key Options List */}
        <div className="space-y-3">
          {keyOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <button
                key={option.id}
                className="w-full bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-5 border border-zinc-800/50 hover:bg-zinc-800/80 transition-all flex items-center gap-4"
                onClick={() => setSelectedKeyType(option.id as 'cpf' | 'email' | 'phone')}
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center flex-shrink-0">
                  <IconComponent className="w-5 h-5 text-white" />
                </div>

                {/* Label */}
                <div className="flex-1 text-left">
                  <p className="text-white font-semibold">{option.label}</p>
                </div>

                {/* Chevron */}
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </button>
            );
          })}
        </div>

        {/* Enter Pix Key Component */}
        {selectedKeyType && (
          <EnterPixKey
            account={account}
            keyType={selectedKeyType}
            onBack={() => setSelectedKeyType(null)}
            onSuccess={onSuccess}
          />
        )}
      </div>
    </div>
  );
}