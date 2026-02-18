import { ArrowLeft, Copy, Check, Share2, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import type { Screen } from '../App';

interface WithdrawReceiptProps {
  onNavigate: (screen: Screen) => void;
  transactionData: {
    transactionId: string;
    amount: string;
    currency: string;
    symbol: string;
    method: string;
    processingTime: string;
    fee: number;
    recipientInfo: string;
    date: string;
    status: string;
  };
}

export function WithdrawReceipt({ onNavigate, transactionData }: WithdrawReceiptProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<'idle' | 'sharing' | 'copied'>('idle');

  const copyToClipboard = (text: string, field: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }

    document.body.removeChild(textArea);
  };

  const handleShare = async () => {
    // Texto formatado do comprovante
    const shareText = `🎯 Comprovante de Transferência Ethertron

💰 Valor: ${transactionData.symbol} ${transactionData.amount}
💳 Moeda: ${transactionData.currency}
📋 ID: ${transactionData.transactionId}

📤 Método: ${transactionData.method}
👤 Destinatário: ${transactionData.recipientInfo}

📊 Status: ${transactionData.status}
💵 Taxa: ${transactionData.symbol} ${transactionData.fee.toFixed(2)}
⏱️ Processamento: ${transactionData.processingTime}
📅 Data: ${transactionData.date}

✨ Ethertron - Seu banco digital de criptomoedas`;

    setShareStatus('sharing');

    // Função auxiliar para copiar usando método legado (mais confiável)
    const copyWithExecCommand = (text: string): boolean => {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (successful) {
          console.log('✅ Comprovante copiado para área de transferência');
          setShareStatus('copied');
          setTimeout(() => setShareStatus('idle'), 3000);
          return true;
        }
        return false;
      } catch (err) {
        console.error('❌ Erro ao copiar:', err);
        return false;
      }
    };

    // Detectar se estamos em contexto seguro (HTTPS)
    const isSecureContext = window.isSecureContext;

    try {
      // ESTRATÉGIA 1: Web Share API (funciona apenas em HTTPS e mobile)
      // Verificar se está disponível E se pode compartilhar
      if (isSecureContext &&
        navigator.share &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ text: shareText })) {
        try {
          await navigator.share({
            title: '🎯 Comprovante de Transferência - Ethertron',
            text: shareText,
          });

          console.log('✅ Comprovante compartilhado com sucesso');
          setShareStatus('idle');
          return;
        } catch (shareError: any) {
          // Se usuário cancelou, não fazer nada
          if (shareError.name === 'AbortError') {
            console.log('ℹ️ Compartilhamento cancelado pelo usuário');
            setShareStatus('idle');
            return;
          }

          // Se deu outro erro, continuar para próximo método
          console.log('ℹ️ Web Share API não disponível, usando método alternativo...');
        }
      }

      // ESTRATÉGIA 2: Clipboard API (funciona apenas em HTTPS)
      if (isSecureContext &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function') {
        try {
          await navigator.clipboard.writeText(shareText);
          console.log('✅ Comprovante copiado para área de transferência');
          setShareStatus('copied');
          setTimeout(() => setShareStatus('idle'), 3000);
          return;
        } catch (clipboardError: any) {
          // Clipboard API falhou, continuar para execCommand
          console.log('ℹ️ Clipboard API não disponível, usando método compatível...');
        }
      }

      // ESTRATÉGIA 3: execCommand (funciona em HTTP e HTTPS, máxima compatibilidade)
      const success = copyWithExecCommand(shareText);
      if (!success) {
        // Se tudo falhou, mostrar mensagem de erro
        console.error('❌ Não foi possível copiar o comprovante');
        setShareStatus('idle');
        alert('Não foi possível copiar o comprovante. Por favor, tire um screenshot desta tela.');
      }

    } catch (error: any) {
      console.error('❌ Erro inesperado:', error);

      // Última tentativa com execCommand
      const success = copyWithExecCommand(shareText);
      if (!success) {
        setShareStatus('idle');
        alert('Não foi possível copiar o comprovante. Por favor, tire um screenshot desta tela.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col pb-24">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <button
          onClick={() => onNavigate('home')}
          className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-zinc-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Success Icon */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4 relative">
            <div className="w-16 h-16 bg-green-500/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-1">Transferência Confirmada!</h1>
          <p className="text-sm text-gray-400">Comprovante de transferência</p>
        </div>
      </header>

      {/* Receipt Content */}
      <div className="flex-1 px-6 space-y-4">
        {/* Status */}
        <div className="bg-zinc-900 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400 font-semibold">Status</span>
            <div className="bg-green-500/20 px-3 py-1 rounded-full">
              <span className="text-xs font-semibold text-green-500">{transactionData.status}</span>
            </div>
          </div>
          <div className="h-px bg-zinc-800 mb-3"></div>
          <div className="text-center">
            <div className="text-4xl font-bold mb-1">{transactionData.symbol} {transactionData.amount}</div>
            <div className="text-sm text-gray-400">{transactionData.currency}</div>
          </div>
        </div>

        {/* Transaction ID */}
        <div className="bg-zinc-900 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-semibold">ID da transação</span>
            <button
              onClick={() => copyToClipboard(transactionData.transactionId, 'txid')}
              className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              {copiedField === 'txid' ? (
                <><Check className="w-3 h-3" /> Copiado</>
              ) : (
                <><Copy className="w-3 h-3" /> Copiar</>
              )}
            </button>
          </div>
          <div className="font-mono text-sm bg-zinc-800 rounded-lg px-3 py-2 break-all">
            {transactionData.transactionId}
          </div>
        </div>

        {/* Transfer Details */}
        <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs text-gray-400 font-semibold mb-3">Detalhes da transferência</h3>

          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Método</span>
            <span className="font-semibold">{transactionData.method}</span>
          </div>
          <div className="h-px bg-zinc-800"></div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Taxa</span>
            <span className="font-semibold">{transactionData.symbol} {transactionData.fee.toFixed(2)}</span>
          </div>
          <div className="h-px bg-zinc-800"></div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Processamento</span>
            <span className="font-semibold text-yellow-500">{transactionData.processingTime}</span>
          </div>
          <div className="h-px bg-zinc-800"></div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Data</span>
            <span className="font-semibold">{transactionData.date}</span>
          </div>
        </div>

        {/* Recipient Info */}
        <div className="bg-zinc-900 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-semibold">Destinatário</span>
            <button
              onClick={() => copyToClipboard(transactionData.recipientInfo, 'recipient')}
              className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              {copiedField === 'recipient' ? (
                <><Check className="w-3 h-3" /> Copiado</>
              ) : (
                <><Copy className="w-3 h-3" /> Copiar</>
              )}
            </button>
          </div>
          <div className="text-sm text-white break-all">
            {transactionData.recipientInfo}
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm">
          <p className="text-blue-200/90">
            <span className="font-semibold">ℹ️ Importante:</span> Guarde este comprovante para referência futura. O processamento pode levar até {transactionData.processingTime}.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 pt-4 space-y-3">
        <button
          onClick={handleShare}
          disabled={shareStatus === 'sharing'}
          className={`w-full font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 ${shareStatus === 'copied'
            ? 'bg-green-500 text-white'
            : 'bg-zinc-900 text-white hover:bg-zinc-800'
            } ${shareStatus === 'sharing' ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {shareStatus === 'sharing' ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Compartilhando...
            </>
          ) : shareStatus === 'copied' ? (
            <>
              <Check className="w-5 h-5" />
              Copiado para área de transferência!
            </>
          ) : (
            <>
              <Share2 className="w-5 h-5" />
              Compartilhar comprovante
            </>
          )}
        </button>

        <button
          onClick={() => onNavigate('home')}
          className="w-full bg-white text-black font-semibold py-4 rounded-xl hover:bg-gray-200 transition-colors"
        >
          Voltar para Home
        </button>
      </div>
    </div>
  );
}