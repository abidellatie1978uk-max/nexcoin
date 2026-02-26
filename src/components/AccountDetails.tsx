import { ArrowLeft, Copy, Check, Eye, EyeOff, Share2, Coins, Clock, Flag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Screen } from '../App';
import type { BankAccount } from '../lib/bankAccountGenerator';
import { copyToClipboard } from '../utils/clipboard';

interface AccountDetailsProps {
  account: BankAccount & { id?: string };
  onBack: () => void;
  onDelete?: (accountId: string) => void;
}

const FlagIcon = ({ code }: { code: string }) => {
  return (
    <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-zinc-800">
      <img 
        src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
        alt={code}
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export function AccountDetails({ account, onBack, onDelete }: AccountDetailsProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    copyToClipboard(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Determinar se é conta internacional ou doméstica
  const isInternational = account.iban !== undefined;
  const isBrazil = account.country === 'BR';

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-900 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24 px-6">
        <h1 className="text-xl font-bold mb-6">Dados da conta</h1>

        {/* Account Header */}
        <div className="flex items-center gap-3 mb-6">
          <FlagIcon code={account.flagCode} />
          <span className="font-semibold">{account.countryName}</span>
        </div>

        {/* Account Details Card */}
        <div className="bg-zinc-900 rounded-3xl p-6 mb-4">
          <p className="text-xs font-semibold mb-6">
            {isInternational ? 'Apenas para transferências internacionais' : 'Apenas para transferências domésticas'}
          </p>

          {/* Banco */}
          <div className="mb-5">
            <p className="text-xs text-gray-400 mb-1">Instituição</p>
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-400 font-semibold">{account.bankName}</p>
              <button
                onClick={() => handleCopy(account.bankName, 'bankName')}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors"
              >
                <Copy className="w-4 h-4 text-blue-400" />
              </button>
            </div>
          </div>

          {/* Tipo de Conta */}
          <div className="mb-5">
            <p className="text-xs text-gray-400 mb-1">Tipo de Conta</p>
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-400 font-semibold">{account.accountType}</p>
              <button
                onClick={() => handleCopy(account.accountType, 'accountType')}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors"
              >
                <Copy className="w-4 h-4 text-blue-400" />
              </button>
            </div>
          </div>

          {/* Número da conta */}
          <div className="mb-5">
            <p className="text-xs text-gray-400 mb-1">Número da conta</p>
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-400 font-semibold">{account.accountNumber}</p>
              <button
                onClick={() => handleCopy(account.accountNumber, 'accountNumber')}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors"
              >
                <Copy className="w-4 h-4 text-blue-400" />
              </button>
            </div>
          </div>

          {/* Campos específicos para contas internacionais */}
          {isInternational && (
            <>
              {/* IBAN */}
              {account.iban && (
                <div className="mb-5">
                  <p className="text-xs text-gray-400 mb-1">IBAN</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-blue-400 font-semibold">{account.iban}</p>
                    <button
                      onClick={() => handleCopy(account.iban!, 'iban')}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors"
                    >
                      <Copy className="w-4 h-4 text-blue-400" />
                    </button>
                  </div>
                </div>
              )}

              {/* SWIFT/BIC */}
              {account.swift && (
                <div className="mb-5">
                  <p className="text-xs text-gray-400 mb-1">SWIFT/BIC</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-blue-400 font-semibold">{account.swift}</p>
                    <button
                      onClick={() => handleCopy(account.swift!, 'swift')}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors"
                    >
                      <Copy className="w-4 h-4 text-blue-400" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Campos específicos para contas domésticas */}
          {!isInternational && (
            <>
              {/* Sort Code (apenas para Reino Unido) */}
              {account.sortCode && (
                <div className="mb-5">
                  <p className="text-xs text-gray-400 mb-1">Sort Code</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-blue-400 font-semibold">{account.sortCode}</p>
                    <button
                      onClick={() => handleCopy(account.sortCode!, 'sortCode')}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors"
                    >
                      <Copy className="w-4 h-4 text-blue-400" />
                    </button>
                  </div>
                </div>
              )}

              {/* Agência/Branch Code */}
              {account.branchCode && (
                <div className="mb-5">
                  <p className="text-xs text-gray-400 mb-1">{isBrazil ? 'Agência' : 'Branch Code'}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-blue-400 font-semibold">{account.branchCode}</p>
                    <button
                      onClick={() => handleCopy(account.branchCode!, 'branchCode')}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors"
                    >
                      <Copy className="w-4 h-4 text-blue-400" />
                    </button>
                  </div>
                </div>
              )}

              {/* Routing Number (para EUA e alguns outros países) */}
              {account.routingNumber && (
                <div className="mb-5">
                  <p className="text-xs text-gray-400 mb-1">
                    {account.country === 'US' ? 'Routing Number' : 
                     account.country === 'GB' ? 'Sort Code' :
                     account.country === 'AU' ? 'BSB' : 'Routing Number'}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-blue-400 font-semibold">{account.routingNumber}</p>
                    <button
                      onClick={() => handleCopy(account.routingNumber!, 'routingNumber')}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors"
                    >
                      <Copy className="w-4 h-4 text-blue-400" />
                    </button>
                  </div>
                </div>
              )}

              {/* Bank Code */}
              {account.bankCode && (
                <div className="mb-5">
                  <p className="text-xs text-gray-400 mb-1">{isBrazil ? 'Código da Instituição' : 'Institution Code'}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-blue-400 font-semibold">{account.bankCode}</p>
                    <button
                      onClick={() => handleCopy(account.bankCode!, 'bankCode')}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors"
                    >
                      <Copy className="w-4 h-4 text-blue-400" />
                    </button>
                  </div>
                </div>
              )}

              {/* SWIFT (mesmo para contas domésticas alguns países têm) */}
              {account.swift && (
                <div className="mb-5">
                  <p className="text-xs text-gray-400 mb-1">SWIFT/BIC</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-blue-400 font-semibold">{account.swift}</p>
                    <button
                      onClick={() => handleCopy(account.swift!, 'swift')}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors"
                    >
                      <Copy className="w-4 h-4 text-blue-400" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Share Button */}
          <button className="w-full bg-zinc-700 hover:bg-zinc-600 rounded-full py-3 flex items-center justify-center gap-2 transition-colors mt-6">
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-semibold">Compartilhar dados</span>
          </button>
        </div>

        {/* Info Cards */}
        {isInternational ? (
          <>
            {/* Tempo de transferência */}
            <div className="bg-zinc-900 rounded-3xl p-5 mb-4 flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold">Normalmente as transferências levam de três a cinco dias úteis para aparecer na sua conta Revolut</p>
              </div>
            </div>

            {/* Taxas intermediárias */}
            <div className="bg-zinc-900 rounded-3xl p-5 mb-4 flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                  <Coins className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold">O banco do remetente ou intermediário poderá cobrar por pagamentos internacionais</p>
              </div>
            </div>

            {/* SWIFT apenas */}
            <div className="bg-zinc-900 rounded-3xl p-5 flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                  <Flag className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold">Aceitamos somente transferências SWIFT</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-zinc-900 rounded-3xl p-5 mb-4 flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                  <Coins className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold">Não cobraremos nenhuma taxa de transferência para esta conta.</p>
              </div>
            </div>

            <div className="bg-zinc-900 rounded-3xl p-5 flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                  <Flag className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold">Você pode usar os dados da sua conta ou chave Pix para receber transferências 24 horas, sem complicações.</p>
              </div>
            </div>
          </>
        )}

        {/* Delete Account Button */}
        {onDelete && account.id && (
          <button
            onClick={() => onDelete(account.id!)}
            className="w-full mt-6 bg-red-900/20 hover:bg-red-900/30 border border-red-800 rounded-3xl py-4 flex items-center justify-center gap-2 transition-colors"
          >
            <Trash2 className="w-5 h-5 text-red-500" />
            <span className="text-sm font-semibold text-red-500">Encerrar conta</span>
          </button>
        )}
      </div>
    </div>
  );
}