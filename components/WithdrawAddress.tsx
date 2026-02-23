import { ArrowLeft, QrCode, AlertCircle, Check, Copy, Share2, FileText, CheckCircle, UserCheck, X, Database } from 'lucide-react';
import { useState, useEffect } from 'react';
import { CryptoIcon } from './CryptoIcon';
import { useCryptoPrices } from '../contexts/CryptoPriceContext';
import { formatCrypto, formatCurrency } from '../utils/formatters';
import { motion, AnimatePresence } from 'motion/react';
import { copyToClipboard } from '../utils/clipboard';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { validateWalletAddress, processCryptoTransfer, generateTransactionHash } from '../lib/cryptoTransferUtils';
import { useWalletAddresses } from '../hooks/useWalletAddresses';
import { checkIndexHealth } from '../lib/walletAddressUtils';


interface WithdrawAddressProps {
  crypto: {
    symbol: string;
    name: string;
    balance: number;
    id: string;
  };
  network: {
    id: string;
    name: string;
    icon: string;
    fee: string;
  };
  onBack: () => void;
}

export function WithdrawAddress({ crypto, network, onBack }: WithdrawAddressProps) {
  const [walletAddress, setWalletAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [recipientInfo, setRecipientInfo] = useState<{ isValid: boolean; userName: string | null; userId?: string | null; error?: string } | null>(null);
  const { prices } = useCryptoPrices();
  const { user } = useAuth();
  const { getAddressForNetwork } = useWalletAddresses();



  // Validar endereço quando mudar
  useEffect(() => {
    const validateAddress = async () => {
      if (!walletAddress || walletAddress.length < 10) {
        setRecipientInfo(null);
        return;
      }

      setIsValidating(true);
      setRecipientInfo(null);

      try {
        // ? Passar o userId atual para validar auto-transferência
        const validation = await validateWalletAddress(walletAddress, network.id, user?.uid);
        setRecipientInfo(validation);
      } catch (error) {
        console.error('Erro ao validar:', error);
        setRecipientInfo({
          isValid: false,
          userName: null,
          error: 'Erro ao validar endereço',
        });
      } finally {
        setIsValidating(false);
      }
    };

    const timeoutId = setTimeout(validateAddress, 800);
    return () => clearTimeout(timeoutId);
  }, [walletAddress, network.id, user?.uid]); // ? Adicionar user?.uid como dependência

  // Formata o saldo
  const formatBalance = (amount: number): string => {
    if (amount >= 1) {
      return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 8 });
    }
    return amount.toFixed(8);
  };

  // Calcula taxa e total
  const networkFee = parseFloat(network.fee.split(' ')[0]);
  const amountNum = parseFloat(amount) || 0;
  const totalAmount = amountNum + networkFee;

  // Validação do botão - IMPORTANTE: só habilita se destinatário for válido
  const isValid =
    walletAddress &&
    amount &&
    parseFloat(amount) > 0 &&
    parseFloat(amount) <= crypto.balance &&
    recipientInfo?.isValid === true; // ?? Validação crítica!

  // Processar envio
  const handleSend = async () => {
    if (!isValid || !user?.uid || !recipientInfo?.userId) {
      toast.error('Dados inválidos para transferência');
      return;
    }

    setIsProcessing(true);

    try {
      // Gerar hash da transação
      const txHash = generateTransactionHash();

      // Buscar endereço do remetente
      const fromAddress = await getAddressForNetwork(network.id);

      // Processar transferência
      const result = await processCryptoTransfer({
        fromUserId: user.uid,
        toUserId: recipientInfo.userId,
        coinId: crypto.id,
        coinSymbol: crypto.symbol,
        amount: amountNum,
        fee: networkFee,
        network: network.id,
        toAddress: walletAddress,
        fromAddress,
        status: 'completed',
        transactionHash: txHash,
        createdAt: new Date(),
      });

      if (result.success) {
        setTransactionHash(txHash);
        setTransactionDate(new Date().toLocaleString('pt-BR'));
        setShowSuccess(true);
        toast.success('Transferência realizada com sucesso!');
      } else {
        toast.error(result.error || 'Erro ao processar transferência');
      }
    } catch (error: any) {
      console.error('Erro ao enviar:', error);
      toast.error(error.message || 'Erro ao processar transferência');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col pb-24">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-zinc-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg">Enviar {crypto.symbol}</h1>
          <div className="flex-shrink-0">
            <CryptoIcon symbol={crypto.symbol} size="md" />
          </div>
        </div>

        {/* Balance Info */}
        <div className="bg-zinc-900 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Saldo disponível</span>
            <div className="text-right">
              <div className="font-semibold">
                {formatBalance(crypto.balance)} {crypto.symbol}
              </div>
              <div className="text-xs text-gray-400">
                ${((prices[crypto.id]?.usd || 0) * crypto.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Form Content */}
      <div className="flex-1 px-6 space-y-6 overflow-y-auto">
        {/* Selected Network */}
        <div>
          <label className="block text-sm font-semibold mb-3">Rede selecionada</label>
          <div className="bg-zinc-900 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
              <CryptoIcon symbol={network.icon} size="sm" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-sm">{network.name}</div>
              <div className="text-xs text-gray-400">Taxa: {network.fee}</div>
            </div>
          </div>
        </div>

        {/* Wallet Address */}
        <div>
          <label className="block text-sm font-semibold mb-3">Endereço da carteira</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Cole ou escaneie o endereço da carteira"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className={`w-full bg-zinc-900 text-white rounded-xl py-4 pl-4 pr-12 focus:outline-none focus:ring-2 placeholder-gray-500 transition-all ${recipientInfo?.isValid
                ? 'focus:ring-green-500 ring-2 ring-green-500/50'
                : recipientInfo?.isValid === false
                  ? 'focus:ring-red-500 ring-2 ring-red-500/50'
                  : 'focus:ring-gray-600'
                }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {isValidating && (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              )}
              {recipientInfo?.isValid && (
                <UserCheck className="w-5 h-5 text-green-500" />
              )}
              {recipientInfo?.isValid === false && (
                <X className="w-5 h-5 text-red-500" />
              )}
            </div>
          </div>

          {/* Recipient Info */}
          {recipientInfo?.isValid && recipientInfo.userName && (
            <div className="mt-3 bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-start gap-3">
              <UserCheck className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-green-500 text-sm font-semibold mb-0.5">Destinatário encontrado</p>
                <p className="text-green-200/80 text-xs">
                  Enviando para: <span className="font-semibold">{recipientInfo.userName}</span>
                </p>
              </div>
            </div>
          )}

          {/* Error Info */}
          {recipientInfo?.isValid === false && recipientInfo.error && (
            <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-500 text-sm font-semibold mb-0.5">Endereço inválido</p>
                <p className="text-red-200/80 text-xs">{recipientInfo.error}</p>
              </div>
            </div>
          )}

          {walletAddress && !recipientInfo && !isValidating && (
            <div className="mt-2 flex items-start gap-2 text-xs text-gray-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>Certifique-se de que o endereço está correto. Transações não podem ser revertidas.</p>
            </div>
          )}
        </div>

        {/* Amount */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold">Valor</label>
            <button
              onClick={() => setAmount(crypto.balance.toString())}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Usar máximo
            </button>
          </div>
          <div className="bg-zinc-900 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 bg-transparent text-2xl font-bold outline-none placeholder-gray-600"
                step="0.00000001"
              />
              <div className="flex items-center gap-2">
                <CryptoIcon symbol={crypto.symbol} size="sm" />
                <span className="font-semibold text-lg">{crypto.symbol}</span>
              </div>
            </div>
            {amount && (
              <div className="mt-2 text-sm text-gray-400">
                ˜ ${(parseFloat(amount) * (prices[crypto.id]?.usd || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>
        </div>

        {/* Transaction Summary */}
        {amount && walletAddress && recipientInfo?.isValid && (
          <div className="bg-zinc-900 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-sm mb-3">Resumo da transação</h3>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Quantidade</span>
              <span className="font-semibold">{amount} {crypto.symbol}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Taxa de rede</span>
              <span className="font-semibold">{networkFee} {crypto.symbol}</span>
            </div>

            <div className="h-px bg-zinc-800 my-2"></div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total</span>
              <div className="text-right">
                <div className="font-bold text-lg">
                  {crypto.symbol === 'USDT' ? formatCurrency(totalAmount) : formatCrypto(totalAmount)} {crypto.symbol}
                </div>
                <div className="text-xs text-gray-400">
                  ˜ {formatCurrency(totalAmount * (prices[crypto.id]?.usd || 0))} USDT
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Warning */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-200/90">
            <p className="font-semibold mb-1">Atenção</p>
            <p className="text-xs text-yellow-200/70">
              Verifique cuidadosamente o endereço e a rede antes de enviar. Apenas endereços cadastrados na NexCoin são aceitos.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="px-6 py-4 bg-black">
        <button
          disabled={!isValid || isProcessing}
          className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${isValid && !isProcessing
            ? 'bg-white text-black hover:bg-gray-200'
            : 'bg-zinc-800 text-gray-500 cursor-not-allowed'
            }`}
          onClick={handleSend}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              Processando...
            </span>
          ) : (
            'Enviar'
          )}
        </button>
        {!recipientInfo?.isValid && walletAddress && !isValidating && (
          <p className="text-center text-xs text-gray-400 mt-2">
            O endereço precisa estar cadastrado na NexCoin
          </p>
        )}
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-6"
            onClick={() => {
              setShowSuccess(false);
              onBack();
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-zinc-900 rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Success Icon with Animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 relative"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 bg-green-500/30 rounded-full flex items-center justify-center"
                >
                  <motion.svg
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="w-10 h-10 text-green-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <motion.path d="M20 6L9 17l-5-5" />
                  </motion.svg>
                </motion.div>

                {/* Ripple Effect */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="absolute inset-0 bg-green-500 rounded-full"
                />
              </motion.div>

              {/* Success Message */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <h2 className="text-2xl font-bold mb-2 text-white">Enviado com sucesso!</h2>
                <p className="text-gray-400 text-sm mb-2">
                  Sua transação foi processada
                </p>
                {recipientInfo?.userName && (
                  <p className="text-green-400 text-sm font-semibold mb-6">
                    Destinatário: {recipientInfo.userName}
                  </p>
                )}

                {/* Transaction Details */}
                <div className="bg-black/50 rounded-2xl p-4 mb-6 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Valor</span>
                    <span className="font-semibold text-white">{amount} {crypto.symbol}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Rede</span>
                    <span className="font-semibold text-white">{network.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Para</span>
                    <span className="font-semibold text-white text-xs">
                      {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
                    </span>
                  </div>
                </div>

                {/* Button */}
                <button
                  onClick={() => {
                    setShowSuccess(false);
                    setShowReceipt(true);
                  }}
                  className="w-full bg-white text-black font-semibold py-4 rounded-xl hover:bg-gray-200 transition-colors mb-3"
                >
                  Ver Comprovante
                </button>

                <button
                  onClick={() => {
                    setShowSuccess(false);
                    onBack();
                  }}
                  className="w-full bg-zinc-800 text-white font-semibold py-3 rounded-xl hover:bg-zinc-700 transition-colors"
                >
                  Fechar
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipt Modal - implementação similar ao anterior */}


    </div>
  );
}
