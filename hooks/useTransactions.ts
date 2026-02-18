import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { safeOnSnapshot } from '../lib/firestoreListenerUtils';

export type TransactionType =
  | 'send_crypto'        // Envio de cripto
  | 'receive_crypto'     // Recebimento de cripto (depósito)
  | 'crypto_send'        // ✅ NOVO: Envio de cripto (transferência entre usuários)
  | 'crypto_receive'     // ✅ NOVO: Recebimento de cripto (transferência entre usuários)
  | 'pix_send'           // ✅ NOVO: Envio PIX
  | 'pix_receive'        // ✅ NOVO: Recebimento PIX
  | 'convert'            // Conversão entre moedas/cripto
  | 'deposit_fiat'       // Depósito fiat
  | 'withdraw_fiat'      // Saque/transferência fiat (PIX, TED, etc)
  | 'buy_crypto'         // Compra de cripto
  | 'sell_crypto';       // Venda de cripto

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'processing';

export interface Transaction {
  id?: string;
  userId: string;
  type: TransactionType;
  status: TransactionStatus;

  // Valores
  amount: number;              // Quantidade principal
  currency: string;            // Moeda/cripto principal

  // Para conversões e trocas
  fromAmount?: number;
  fromCurrency?: string;
  toAmount?: number;
  toCurrency?: string;

  // Taxas
  fee: number;
  feeCurrency: string;

  // Informações adicionais
  description: string;
  recipientAddress?: string;   // Endereço de destino (para cripto)
  recipientInfo?: string;       // Informações do destinatário (para fiat)
  transactionHash?: string;     // Hash da transação (para cripto)
  network?: string;             // Rede blockchain

  // Metadata
  createdAt: Date;
  completedAt?: Date;
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Carregar transações do Firestore em tempo real
  useEffect(() => {
    if (!user?.uid) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // ✅ CORRIGIDO: Buscar transações da subcoleção do usuário
    const transactionsRef = collection(db, 'users', user.uid, 'transactions');
    const q = query(
      transactionsRef,
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = safeOnSnapshot(
      q,
      (snapshot) => {
        const transactionsData = snapshot.docs.map((doc: any) => {
          const data = doc.data();

          // ✅ Converter createdAt para Date (suporta Timestamp e Date)
          let createdAt: Date;
          if (data.createdAt?.toDate) {
            // É um Timestamp do Firestore
            createdAt = data.createdAt.toDate();
          } else if (data.createdAt instanceof Date) {
            // Já é um Date
            createdAt = data.createdAt;
          } else if (typeof data.createdAt === 'string' || typeof data.createdAt === 'number') {
            // É uma string ou timestamp numérico
            createdAt = new Date(data.createdAt);
          } else {
            // Fallback: usar data atual
            createdAt = new Date();
          }

          // ✅ Converter completedAt para Date (se existir)
          let completedAt: Date | undefined;
          if (data.completedAt?.toDate) {
            completedAt = data.completedAt.toDate();
          } else if (data.completedAt instanceof Date) {
            completedAt = data.completedAt;
          } else if (data.completedAt) {
            completedAt = new Date(data.completedAt);
          }

          return {
            ...data,
            id: doc.id,
            createdAt,
            completedAt,
          } as Transaction;
        });

        // Ordenar no cliente por createdAt (mais recente primeiro)
        const sortedTransactions = transactionsData.sort((a: Transaction, b: Transaction) =>
          b.createdAt.getTime() - a.createdAt.getTime()
        );

        setTransactions(sortedTransactions);
        setIsLoading(false);
      },
      {
        maxRetries: 3,
        retryDelay: 1000,
        onError: (error) => {
          console.error('❌ Erro ao carregar transações:', error);
          // Definir estado vazio em caso de erro para não quebrar a UI
          setTransactions([]);
          setIsLoading(false);
        }
      }
    );

    return () => {
      try {
        unsubscribe();
      } catch (error) {
        console.error('❌ Erro ao desinscrever listener:', error);
      }
    };
  }, [user?.uid]); // ✅ Usar user?.uid ao invés de user para evitar re-renders desnecessários

  // Adicionar nova transação
  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt'>): Promise<string> => {
    if (!user?.uid) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const transactionsRef = collection(db, 'transactions');
      const docRef = await addDoc(transactionsRef, {
        ...transaction,
        userId: user.uid,
        createdAt: Timestamp.now(),
        completedAt: transaction.status === 'completed' ? Timestamp.now() : null,
      });

      console.log('✅ Transação salva:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Erro ao salvar transação:', error);
      throw error;
    }
  };

  // Formatar valor com separador de milhares e decimais
  const formatAmount = (value: number, decimals: number = 2): string => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  // Obter símbolo da moeda
  const getCurrencySymbol = (currency: string): string => {
    const symbols: Record<string, string> = {
      BRL: 'R$',
      USD: '$',
      EUR: '€',
      GBP: '£',
      USDT: '₮',
      BTC: '₿',
      ETH: 'Ξ',
    };
    return symbols[currency] || currency;
  };

  // Formatar descrição da transação
  const formatTransactionDescription = (tx: Transaction): string => {
    switch (tx.type) {
      case 'send_crypto':
        return `Envio de ${tx.currency}`;
      case 'receive_crypto':
        return `Recebimento de ${tx.currency}`;
      case 'crypto_send':
        return `Enviado ${tx.currency}`;
      case 'crypto_receive':
        return `Recebido ${tx.currency}`;
      case 'pix_send':
        return `PIX enviado`;
      case 'pix_receive':
        return `PIX recebido`;
      case 'convert':
        return `Conversão ${tx.fromCurrency} → ${tx.toCurrency}`;
      case 'deposit_fiat':
        return `Depósito ${tx.currency}`;
      case 'withdraw_fiat':
        return `Transferência ${tx.currency}`;
      case 'buy_crypto':
        return `Compra de ${tx.currency}`;
      case 'sell_crypto':
        return `Venda de ${tx.currency}`;
      default:
        return tx.description || 'Transação';
    }
  };

  // Formatar valor da transação com sinal
  const formatTransactionAmount = (tx: Transaction): string => {
    // ✅ Tipos de transações que são crédito (positivas)
    const isPositive = [
      'receive_crypto',
      'crypto_receive',
      'pix_receive',
      'deposit_fiat',
      'convert'
    ].includes(tx.type);

    const sign = isPositive ? '+' : '-';

    if (tx.type === 'convert' && tx.toAmount && tx.toCurrency) {
      return `${sign} ${formatAmount(tx.toAmount)} ${tx.toCurrency}`;
    }

    // Para transações com amount já negativo (como crypto_send), não adicionar sinal duplo
    const absAmount = Math.abs(tx.amount);
    return `${sign} ${formatAmount(absAmount)} ${tx.currency}`;
  };

  // Obter ícone da transação
  const getTransactionIcon = (tx: Transaction): string => {
    if (tx.type === 'convert') {
      return '🔄';
    }

    if (['send_crypto', 'crypto_send', 'pix_send', 'withdraw_fiat'].includes(tx.type)) {
      return '📤';
    }

    if (['receive_crypto', 'crypto_receive', 'pix_receive', 'deposit_fiat'].includes(tx.type)) {
      return '📥';
    }

    return '💰';
  };

  // Obter tipo de ícone da transação (para usar com Lucide icons)
  const getTransactionIconType = (tx: Transaction): 'entrada' | 'saida' | 'conversao' => {
    if (tx.type === 'convert') {
      return 'conversao';
    }

    if (['send_crypto', 'crypto_send', 'pix_send', 'withdraw_fiat'].includes(tx.type)) {
      return 'saida';
    }

    if (['receive_crypto', 'crypto_receive', 'pix_receive', 'deposit_fiat'].includes(tx.type)) {
      return 'entrada';
    }

    return 'entrada';
  };

  return {
    transactions,
    isLoading,
    addTransaction,
    formatAmount,
    getCurrencySymbol,
    formatTransactionDescription,
    formatTransactionAmount,
    getTransactionIcon,
    getTransactionIconType,
  };
}