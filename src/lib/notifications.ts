import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  updateDoc,
  writeBatch,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

export interface NotificationData {
  id: string;
  userId: string;
  type: 'transaction' | 'security' | 'alert' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  metadata?: {
    amount?: number;
    currency?: string;
    transactionId?: string;
    device?: string;
    [key: string]: any;
  };
}

/**
 * Cria uma nova notificação no Firestore
 */
export async function createNotification(
  userId: string,
  type: NotificationData['type'],
  title: string,
  message: string,
  metadata?: NotificationData['metadata']
): Promise<void> {
  try {
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      userId,
      type,
      title,
      message,
      timestamp: serverTimestamp(),
      read: false,
      metadata: metadata || {},
      createdAt: serverTimestamp()
    });
    
    console.log('✅ Notification created:', { userId, type, title });
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    throw error;
  }
}

/**
 * Busca todas as notificações de um usuário
 */
export async function getUserNotifications(userId: string): Promise<NotificationData[]> {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const notifications: NotificationData[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        timestamp: data.timestamp?.toDate() || new Date(),
        read: data.read || false,
        metadata: data.metadata || {}
      });
    });
    
    console.log(`✅ Loaded ${notifications.length} notifications for user ${userId}`);
    return notifications;
  } catch (error) {
    console.error('❌ Error loading notifications:', error);
    throw error;
  }
}

/**
 * Marca uma notificação como lida
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp()
    });
    
    console.log('✅ Notification marked as read:', notificationId);
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Marca todas as notificações de um usuário como lidas
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    querySnapshot.forEach((document) => {
      batch.update(document.ref, {
        read: true,
        readAt: serverTimestamp()
      });
    });
    
    await batch.commit();
    console.log(`✅ Marked ${querySnapshot.size} notifications as read`);
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Helpers para criar notificações específicas
 */

export async function notifyDeposit(userId: string, amount: number, currency: string): Promise<void> {
  await createNotification(
    userId,
    'transaction',
    'Depósito recebido',
    `Você recebeu ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency} na sua carteira`,
    { amount, currency, type: 'deposit' }
  );
}

export async function notifyWithdrawal(userId: string, amount: number, currency: string): Promise<void> {
  await createNotification(
    userId,
    'transaction',
    'Saque processado',
    `Retirada de ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency} foi concluída`,
    { amount, currency, type: 'withdrawal' }
  );
}

export async function notifyConversion(
  userId: string, 
  fromAmount: number, 
  fromCurrency: string, 
  toAmount: number, 
  toCurrency: string
): Promise<void> {
  await createNotification(
    userId,
    'transaction',
    'Conversão realizada',
    `Você converteu ${fromAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${fromCurrency} para ${toAmount.toLocaleString('pt-BR', { minimumFractionDigits: 8, maximumFractionDigits: 8 })} ${toCurrency}`,
    { fromAmount, fromCurrency, toAmount, toCurrency, type: 'conversion' }
  );
}

export async function notifyNewDevice(userId: string, device: string): Promise<void> {
  await createNotification(
    userId,
    'security',
    'Novo dispositivo detectado',
    `Login realizado em ${device}`,
    { device, type: 'new_device' }
  );
}

export async function notifySecurityAlert(userId: string, message: string): Promise<void> {
  await createNotification(
    userId,
    'security',
    'Alerta de segurança',
    message,
    { type: 'security_alert' }
  );
}

export async function notifyPriceAlert(userId: string, crypto: string, price: number): Promise<void> {
  await createNotification(
    userId,
    'alert',
    'Preço atingiu meta',
    `${crypto} atingiu $${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    { crypto, price, type: 'price_alert' }
  );
}

export async function notifyAppUpdate(userId: string): Promise<void> {
  await createNotification(
    userId,
    'info',
    'Atualização disponível',
    'Nova versão do NexCoin disponível',
    { type: 'app_update' }
  );
}
