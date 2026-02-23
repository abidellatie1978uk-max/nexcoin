import { ArrowLeft, Copy, Check, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { usePixKeys } from '../hooks/usePixKeys';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { copyToClipboard } from '../utils/clipboard';
import type { BankAccount } from '../lib/bankAccountGenerator';

interface FiatAddFundsProps {
  account: BankAccount;
  onClose: () => void;
}

export function FiatAddFunds({ account, onClose }: FiatAddFundsProps) {
  const { user } = useAuth();
  const { pixKeys } = usePixKeys();
  const [selectedMethod, setSelectedMethod] = useState<'transfer' | 'pix'>('transfer');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedPixKeyId, setSelectedPixKeyId] = useState<string>('');
  const [showPixKeySelector, setShowPixKeySelector] = useState(false);

  const isBrazil = account.country === 'BR';
  const currencySymbol = account.currency === 'BRL' ? 'R$' :
    account.currency === 'USD' ? '$' :
      account.currency === 'EUR' ? '€' : '£';

  // Selecionar primeira chave PIX automaticamente
  useEffect(() => {
    if (pixKeys.length > 0 && !selectedPixKeyId) {
      setSelectedPixKeyId(pixKeys[0].id);
    }
  }, [pixKeys, selectedPixKeyId]);

  const selectedPixKey = pixKeys.find(key => key.id === selectedPixKeyId);

  const handleCopy = (text: string, field: string) => {
    copyToClipboard(text);
    setCopiedField(field);
    toast.success('Copiado para área de transferência');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const generatePixPayload = () => {
    if (!selectedPixKey) return '';
    const payload = {
      pixKey: selectedPixKey.keyValue,
      merchantName: 'NexCoin',
      merchantCity: 'SAO PAULO',
    };
    return JSON.stringify(payload);
  };

  const pixPayload = generatePixPayload();

  const getPixKeyTypeLabel = (type: string) => {
    switch (type) {
      case 'cpf': return 'CPF';
      case 'cnpj': return 'CNPJ';
      case 'email': return 'E-mail';
      case 'phone': return 'Telefone';
      case 'random': return 'Aleatória';
      default: return type;
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="px-6 pt-12 pb-4 flex items-center flex-shrink-0">
        <button
          className="w-10 h-10 flex items-center justify-start text-white"
          onClick={onClose}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center font-semibold text-lg pr-10">Receber</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-6 pb-6">
        {/* Account Info */}
        <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{account.bankName}</p>
              <p className="text-xs text-gray-400">{account.accountNumber}</p>
            </div>
          </div>
        </div>

        {/* Method Selector (Only for Brazil) */}
        {isBrazil && (
          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-3">Método de Recebimento</p>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedMethod('transfer')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${selectedMethod === 'transfer'
                  ? 'bg-white text-black'
                  : 'bg-[#0A0A0A] text-gray-400 border border-[#1A1A1A]'
                  }`}
              >
                Transferência
              </button>
              <button
                onClick={() => setSelectedMethod('pix')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${selectedMethod === 'pix'
                  ? 'bg-white text-black'
                  : 'bg-[#0A0A0A] text-gray-400 border border-[#1A1A1A]'
                  }`}
              >
                PIX
              </button>
            </div>
          </div>
        )}

        {/* Transfer Instructions */}
        {selectedMethod === 'transfer' && (
          <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-white mb-4">Dados para Transferência</h3>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Banco</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white font-medium">{account.bankName}</p>
                  <button
                    onClick={() => handleCopy(account.bankName, 'bank')}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {copiedField === 'bank' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">Agência</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white font-mono">{account.branchCode}</p>
                  <button
                    onClick={() => handleCopy(account.branchCode || '', 'branch')}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {copiedField === 'branch' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">Conta</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white font-mono">{account.accountNumber}</p>
                  <button
                    onClick={() => handleCopy(account.accountNumber, 'account')}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {copiedField === 'account' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {account.iban && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">IBAN</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white font-mono">{account.iban}</p>
                    <button
                      onClick={() => handleCopy(account.iban!, 'iban')}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {copiedField === 'iban' ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {account.swift && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">SWIFT/BIC</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white font-mono">{account.swift}</p>
                    <button
                      onClick={() => handleCopy(account.swift!, 'swift')}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {copiedField === 'swift' ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PIX Instructions */}
        {isBrazil && selectedMethod === 'pix' && (
          <div className="space-y-4">
            {pixKeys.length > 0 ? (
              <>
                <div>
                  <p className="text-sm text-gray-400 mb-3">Selecione a Chave PIX</p>
                  <div className="relative">
                    <button
                      onClick={() => setShowPixKeySelector(!showPixKeySelector)}
                      className="w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-4 flex items-center justify-between text-left"
                    >
                      {selectedPixKey ? (
                        <div className="flex-1">
                          <p className="text-xs text-gray-400 mb-1">{getPixKeyTypeLabel(selectedPixKey.keyType)}</p>
                          <p className="text-sm text-white font-mono">{selectedPixKey.keyValue}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">Selecione uma chave</p>
                      )}
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showPixKeySelector ? 'rotate-180' : ''}`} />
                    </button>

                    {showPixKeySelector && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl overflow-hidden z-10 max-h-60 overflow-y-auto">
                        {pixKeys.map((key) => (
                          <button
                            key={key.id}
                            onClick={() => {
                              setSelectedPixKeyId(key.id);
                              setShowPixKeySelector(false);
                            }}
                            className={`w-full p-4 text-left hover:bg-white/5 transition-colors border-b border-[#1A1A1A] last:border-b-0 ${selectedPixKeyId === key.id ? 'bg-white/5' : ''}`}
                          >
                            <p className="text-xs text-gray-400 mb-1">{getPixKeyTypeLabel(key.keyType)}</p>
                            <p className="text-sm text-white font-mono">{key.keyValue}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {selectedPixKey && (
                  <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4 text-center">QR Code da Chave PIX</h3>
                    <div className="bg-white rounded-2xl p-6 mb-4 flex items-center justify-center">
                      <QRCodeSVG
                        value={pixPayload}
                        size={200}
                        level="H"
                        includeMargin={false}
                        className="w-full h-auto"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Chave</span>
                        <span className="text-sm text-white font-mono truncate ml-4">{selectedPixKey.keyValue}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Destinatário</span>
                        <span className="text-sm text-white">NexCoin</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(pixPayload, 'pixPayload')}
                      className="w-full mt-4 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl py-3 flex items-center justify-center gap-2 transition-colors"
                    >
                      {copiedField === 'pixPayload' ? (
                        <>
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-green-500">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-white" />
                          <span className="text-sm font-medium text-white">Copiar Código PIX</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-xs text-white/70">
                  ⚠️ <strong>Nenhuma chave PIX cadastrada.</strong> Cadastre uma chave PIX para receber por este método.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Note */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-6 backdrop-blur-sm">
          <p className="text-xs text-white/60">
            Utilize os dados acima no seu banco habitual para realizar a transferência {isBrazil ? 'ou PIX' : ''}. O saldo será creditado automaticamente assim que a transferência for processada pela nossa rede.
          </p>
        </div>
      </div>
    </div>
  );
}
