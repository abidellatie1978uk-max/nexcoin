import { ArrowLeft, Copy, Check, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { usePixKeys } from '../hooks/usePixKeys';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { copyToClipboard } from '../utils/clipboard';
import type { Screen } from '../App';
import { updateFiatBalance } from '../lib/fiatBalanceUtils';
import type { BankAccount } from '../lib/bankAccountGenerator';

interface FiatAddFundsProps {
  account: BankAccount;
  onClose: () => void;
}

export function FiatAddFunds({ account, onClose }: FiatAddFundsProps) {
  const { user } = useAuth();
  const { pixKeys, isLoading: isLoadingPixKeys } = usePixKeys();
  const [selectedMethod, setSelectedMethod] = useState<'transfer' | 'pix'>('transfer');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedPixKeyId, setSelectedPixKeyId] = useState<string>('');
  const [showPixKeySelector, setShowPixKeySelector] = useState(false);

  console.log('🟢 FiatAddFunds renderizado', {
    account,
    user: user?.uid,
    pixKeysCount: pixKeys.length,
    isLoadingPixKeys
  });

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

  const formatAmount = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');

    // Se não houver números, retorna vazio
    if (!numbers) return '';

    // Converte para número e divide por 100 (para casas decimais)
    const amount = parseInt(numbers) / 100;

    // Formata no padrão brasileiro: 1.000,00
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleAmountChange = (value: string) => {
    const formatted = formatAmount(value);
    setAmount(formatted);
  };

  const handleSimulateDeposit = async () => {
    // Converte o valor formatado (1.000,00) para número (1000.00)
    const numericValue = parseFloat(amount.replace(/\./g, '').replace(',', '.'));

    if (!amount || numericValue <= 0) {
      toast.error('Insira um valor válido');
      return;
    }

    if (!user?.uid) {
      toast.error('Usuário não autenticado');
      return;
    }

    setIsProcessing(true);

    try {
      const depositAmount = numericValue;
      const method = selectedMethod === 'pix' ? 'PIX' : 'Transferência Bancária';

      const result = await updateFiatBalance(
        user.uid,
        account.currency,
        depositAmount,
        `Depósito via ${method}`
      );

      if (result.success) {
        // ✅ Formatação correta para BRL na mensagem de sucesso
        const formattedAmount = account.currency === 'BRL'
          ? depositAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : depositAmount.toFixed(2);

        toast.success(`Depósito de ${currencySymbol}${formattedAmount} realizado com sucesso!`);
        setAmount('');
        // Aguarda 1 segundo para o usuário ver a mensagem de sucesso
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        toast.error(result.message || 'Erro ao processar depósito');
      }
    } catch (error) {
      console.error('Erro ao simular depósito:', error);
      toast.error('Erro ao processar depósito');
    } finally {
      setIsProcessing(false);
    }
  };

  // Gerar payload PIX no formato EMV (Pix Copia e Cola)
  const generatePixPayload = () => {
    if (!selectedPixKey || !amount) return '';

    // Converte o valor formatado (1.000,00) para número (1000.00)
    const pixAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
    if (pixAmount <= 0) return '';

    // Formato simplificado do payload PIX usando dados reais do Firestore
    const payload = {
      pixKey: selectedPixKey.keyValue, // ✅ Usando keyValue do Firestore
      description: 'Depósito Ethertron',
      merchantName: 'Ethertron',
      merchantCity: 'SAO PAULO',
      txid: Math.random().toString(36).substring(2, 15).toUpperCase(),
      amount: pixAmount.toFixed(2),
    };

    // Gerar string de payload (formato simplificado para QR Code)
    // Em produção real, use o formato EMV completo
    const pixString = JSON.stringify(payload);
    return pixString;
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
        <h1 className="flex-1 text-center font-semibold text-lg pr-10">Adicionar Fundos</h1>
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
            <p className="text-sm text-gray-400 mb-3">Método de Depósito</p>
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

        {/* Amount Input */}
        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-3">Valor do Depósito</p>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-white">
              {currencySymbol}
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0,00"
              className="w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl py-4 pl-12 pr-4 text-2xl font-semibold text-white placeholder-gray-600 focus:outline-none focus:border-white/20"
            />
          </div>
        </div>

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
        {selectedMethod === 'pix' && (
          <div className="space-y-4">
            {/* Seletor de Chave PIX */}
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

                    {/* Dropdown de chaves */}
                    {showPixKeySelector && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl overflow-hidden z-10 max-h-60 overflow-y-auto">
                        {pixKeys.map((key) => (
                          <button
                            key={key.id}
                            onClick={() => {
                              setSelectedPixKeyId(key.id);
                              setShowPixKeySelector(false);
                            }}
                            className={`w-full p-4 text-left hover:bg-white/5 transition-colors border-b border-[#1A1A1A] last:border-b-0 ${selectedPixKeyId === key.id ? 'bg-white/5' : ''
                              }`}
                          >
                            <p className="text-xs text-gray-400 mb-1">{getPixKeyTypeLabel(key.keyType)}</p>
                            <p className="text-sm text-white font-mono">{key.keyValue}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Code PIX */}
                {selectedPixKey && amount && parseFloat(amount) > 0 && (
                  <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4 text-center">QR Code PIX</h3>

                    {/* QR Code Real */}
                    <div className="bg-white rounded-2xl p-6 mb-4 flex items-center justify-center">
                      <QRCodeSVG
                        value={pixPayload}
                        size={200}
                        level="H"
                        includeMargin={false}
                        className="w-full h-auto"
                      />
                    </div>

                    {/* Informações do PIX */}
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Valor</span>
                        <span className="text-sm text-white font-semibold">
                          {currencySymbol} {account.currency === 'BRL'
                            ? parseFloat(amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : parseFloat(amount).toFixed(2)
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Chave</span>
                        <span className="text-sm text-white font-mono truncate ml-4">{selectedPixKey.keyValue}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Destinatário</span>
                        <span className="text-sm text-white">Ethertron</span>
                      </div>
                    </div>

                    {/* Botão Copiar Código PIX */}
                    <button
                      onClick={() => handleCopy(pixPayload, 'pixPayload')}
                      className="w-full bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl py-3 flex items-center justify-center gap-2 transition-colors"
                    >
                      {copiedField === 'pixPayload' ? (
                        <>
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-green-500">Código Copiado!</span>
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

                {/* Instruções */}
                {!amount || parseFloat(amount) <= 0 ? (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <p className="text-xs text-white/70">
                      💡 <strong>Dica:</strong> Insira o valor do depósito acima para gerar o QR Code PIX.
                    </p>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-xs text-white/70">
                  ⚠️ <strong>Nenhuma chave PIX cadastrada.</strong> Cadastre uma chave PIX para usar este método.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Warning */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-6 backdrop-blur-sm">
          <p className="text-xs text-white/60">
            ⚠️ <strong>Simulação:</strong> Em produção, o sistema aguardaria confirmação da transferência bancária.
            Aqui, o saldo será adicionado instantaneamente ao clicar em "Confirmar Depósito".
          </p>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="p-6 flex-shrink-0 border-t border-[#1A1A1A]">
        <button
          onClick={handleSimulateDeposit}
          disabled={!amount || isProcessing || (selectedMethod === 'pix' && !selectedPixKey)}
          className="w-full bg-white text-black py-4 rounded-2xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 active:scale-[0.98]"
        >
          {isProcessing ? 'Processando...' : 'Confirmar Depósito'}
        </button>
      </div>
    </div>
  );
}