import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc, collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { useLanguage } from './LanguageContext';

interface NotificationContextType {
    pushToken: string | null;
    requestPermissions: () => Promise<boolean>;
    sendLocalNotification: (title: string, body: string, data?: any) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { userData, isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const [pushToken, setPushToken] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // ✅ Registrar para Push Notifications
    const registerPush = useCallback(async () => {
        try {
            console.log('🔔 [Notifications] Iniciando registro de Push...');
            const permStatus = await PushNotifications.checkPermissions();
            if (permStatus.receive === 'prompt') {
                const regStatus = await PushNotifications.requestPermissions();
                if (regStatus.receive !== 'granted') {
                    console.warn('⚠️ [Notifications] Permissão de Push negada');
                    return false;
                }
            }
            if (permStatus.receive !== 'granted') {
                const regStatus = await PushNotifications.requestPermissions();
                if (regStatus.receive !== 'granted') return false;
            }
            await PushNotifications.register();
            PushNotifications.addListener('registration', (token: Token) => {
                console.log('✅ [Notifications] Token de Push recebido:', token.value);
                setPushToken(token.value);
                if (userData?.uid) {
                    const userRef = doc(db, 'users', userData.uid);
                    updateDoc(userRef, { pushToken: token.value }).catch(err => {
                        console.error('❌ Erro ao salvar pushToken:', err);
                    });
                }
            });
            PushNotifications.addListener('registrationError', (error: any) => {
                console.error('❌ [Notifications] Erro no registro de Push:', error);
            });
            PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
                console.log('📩 [Notifications] Push recebido (Foreground):', notification);
            });
            PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
                console.log('タップ [Notifications] Ação de Push executada:', notification);
            });
            return true;
        } catch (error) {
            console.error('❌ [Notifications] Erro ao configurar Push:', error);
            return false;
        }
    }, [userData?.uid]);

    // ✅ Enviar Notificação Local
    const sendLocalNotification = async (title: string, body: string, data?: any) => {
        try {
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title,
                        body,
                        id: Math.floor(Math.random() * 10000),
                        schedule: { at: new Date(Date.now() + 100) }, // Quase imediato
                        extra: data,
                        sound: 'default'
                    }
                ]
            });
        } catch (error) {
            console.error('❌ [Notifications] Erro ao enviar Local Notification:', error);
        }
    };

    // ✅ Monitorar Transações em Tempo Real + Verificação de "Perdidas"
    useEffect(() => {
        if (!isAuthenticated || !userData?.uid) return;

        console.log('🕵️ [Notifications] Iniciando monitor de transações para notificações...');

        const transactionsRef = collection(db, 'users', userData.uid, 'transactions');

        // Query para transações recentes (últimas 5)
        // Isso cobre tanto as de "agora" quanto as que aconteceram enquanto o app estava fechado
        const q = query(
            transactionsRef,
            where('status', '==', 'completed'),
            orderBy('createdAt', 'desc'),
            limit(5)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const tx = change.doc.data();
                    const txId = change.doc.id;

                    // Recuperar lista de notificações já exibidas do localStorage
                    const notifiedKey = `nNexCoin_notified_txs_${userData.uid}`;
                    const notifiedTxs = JSON.parse(localStorage.getItem(notifiedKey) || '[]');

                    // Se já foi notificado, ignora
                    if (notifiedTxs.includes(txId)) return;

                    const createdAt = tx.createdAt?.toDate ? tx.createdAt.toDate() : new Date(tx.createdAt);
                    const now = new Date();
                    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
                    const hoursDiff = diffTime / (1000 * 60 * 60);

                    // Só notificar se a transação tiver menos de 24h (para não spamar histórico antigo)
                    if (hoursDiff < 24) {
                        console.log('💰 [Notifications] Nova transação detectada (ou não vista):', tx);

                        const isReceive = [
                            'receive_crypto',
                            'crypto_receive',
                            'pix_receive',
                            'deposit_fiat'
                        ].includes(tx.type);

                        if (isReceive) {
                            const amountTitle = tx.type.includes('pix') ? 'PIX Recebido' : 'Cripto Recebida';
                            const message = `Você recebeu ${tx.amount} ${tx.currency}!`;

                            sendLocalNotification(amountTitle, message, { txId });

                            // Marcar como notificada
                            const updatedNotified = [...notifiedTxs, txId];
                            // Manter apenas os últimos 50 IDs para não estourar storage
                            if (updatedNotified.length > 50) updatedNotified.shift();

                            localStorage.setItem(notifiedKey, JSON.stringify(updatedNotified));
                        }
                    }
                }
            });
        });

        return () => unsubscribe();
    }, [isAuthenticated, userData?.uid]);

    // ✅ Inicialização automática
    useEffect(() => {
        if (isAuthenticated && !isInitialized) {
            setIsInitialized(true);

            // ⚠️ COMENTADO TEMPORARIAMENTE PARA EVITAR CRASH (Falta google-services.json)
            // registerPush();

            // Pedir permissão para Notificações Locais também
            LocalNotifications.requestPermissions();
        }
    }, [isAuthenticated, isInitialized, registerPush]);

    return (
        <NotificationContext.Provider value={{ pushToken, requestPermissions: registerPush, sendLocalNotification }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications deve ser usado dentro de NotificationProvider');
    }
    return context;
};
