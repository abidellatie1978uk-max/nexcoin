import { onSnapshot, type Query, type DocumentReference, type FirestoreError } from 'firebase/firestore';

interface ListenerOptions {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: FirestoreError) => void;
}

/**
 * Wrapper seguro para onSnapshot com retry automático e tratamento de erros
 */
export function safeOnSnapshot<T>(
  ref: Query<T> | DocumentReference<T>,
  onNext: (snapshot: any) => void,
  options: ListenerOptions = {}
): () => void {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onError,
  } = options;

  let retryCount = 0;
  let unsubscribe: (() => void) | null = null;
  let isUnsubscribed = false;

  const setupListener = () => {
    if (isUnsubscribed) return;

    try {
      unsubscribe = onSnapshot(
        ref as any,
        (snapshot) => {
          retryCount = 0; // Reset retry count on success
          onNext(snapshot);
        },
        (error: FirestoreError) => {
          console.error('❌ Erro no listener Firestore:', error);

          // Chamar callback de erro se fornecido
          if (onError) {
            onError(error);
          }

          // Não fazer retry em erros de permissão
          if (error.code === 'permission-denied') {
            console.error('❌ Erro de permissão - não será feito retry');
            return;
          }

          // Fazer retry se ainda não atingiu o máximo
          if (retryCount < maxRetries && !isUnsubscribed) {
            retryCount++;
            const delay = retryDelay * Math.pow(2, retryCount - 1); // Exponential backoff
            console.log(`🔄 Tentando reconectar (${retryCount}/${maxRetries}) em ${delay}ms...`);

            setTimeout(() => {
              if (!isUnsubscribed) {
                setupListener();
              }
            }, delay);
          } else {
            console.error('❌ Máximo de tentativas de reconexão atingido');
          }
        }
      );
    } catch (error) {
      console.error('❌ Erro ao configurar listener:', error);
    }
  };

  // Iniciar listener
  setupListener();

  // Retornar função de cleanup
  return () => {
    isUnsubscribed = true;
    if (unsubscribe) {
      try {
        unsubscribe();
      } catch (error) {
        console.error('❌ Erro ao desinscrever listener:', error);
      }
    }
  };
}
