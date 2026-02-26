import {
  ArrowLeft,
  Bell,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Shield,
  Wallet as WalletIcon,
  CheckCircle2,
  Smartphone
} from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Screen } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  type NotificationData 
} from '../lib/notifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationsProps {
  onNavigate: (screen: Screen) => void;
}

type NotificationType = 'all' | 'transactions' | 'security' | 'updates';

export function Notifications({ onNavigate }: NotificationsProps) {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<NotificationType>('all');
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await getUserNotifications(user.uid);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIconForType = (type: NotificationData['type'], metadata?: any) => {
    if (type === 'transaction') {
      if (metadata?.type === 'deposit') return TrendingUp;
      if (metadata?.type === 'withdrawal') return TrendingDown;
      if (metadata?.type === 'conversion') return WalletIcon;
      return TrendingUp;
    }
    if (type === 'security') return Shield;
    if (type === 'alert') return AlertCircle;
    if (type === 'info') return CheckCircle2;
    return Bell;
  };

  const filters: { label: string; value: NotificationType }[] = [
    { label: 'Todas', value: 'all' },
    { label: 'Transações', value: 'transactions' },
    { label: 'Segurança', value: 'security' },
    { label: 'Atualizações', value: 'updates' }
  ];

  const filteredNotifications = notifications.filter(notification => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'transactions') return notification.type === 'transaction';
    if (activeFilter === 'security') return notification.type === 'security';
    if (activeFilter === 'updates') return notification.type === 'info' || notification.type === 'alert';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    try {
      await markAllNotificationsAsRead(user.uid);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('profile')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Notificações</h1>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-400">{unreadCount} não lida{unreadCount > 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              Marcar todas
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar snap-x snap-mandatory">
          {filters.map(filter => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors snap-start flex-shrink-0 ${
                activeFilter === filter.value
                  ? 'bg-white text-black'
                  : 'bg-zinc-900 text-gray-400 hover:bg-zinc-800'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto pb-24 px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="font-semibold mb-2">Carregando...</h3>
            <p className="text-sm text-gray-400 text-center">
              Aguarde enquanto carregamos suas notificações
            </p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="font-semibold mb-2">Nenhuma notificação</h3>
            <p className="text-sm text-gray-400 text-center">
              Você não tem notificações nesta categoria
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map(notification => {
              const Icon = getIconForType(notification.type, notification.metadata);
              const iconColor = notification.read ? 'text-white/70' : 'text-white';
              return (
                <button
                  key={notification.id}
                  onClick={() => handleMarkAsRead(notification.id)}
                  className={`w-full p-4 rounded-2xl transition-colors text-left ${
                    notification.read
                      ? 'bg-zinc-900/50 hover:bg-zinc-900'
                      : 'bg-zinc-900 hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className={`font-semibold ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-white flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mb-1">{notification.message}</p>
                      <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(notification.timestamp), { locale: ptBR, addSuffix: true })}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Settings Footer */}
      <div className="px-6 pb-6 space-y-3">
        <button
          onClick={() => onNavigate('pushSettings')}
          className="w-full py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 transition-colors text-sm flex items-center justify-center gap-2"
        >
          <Smartphone className="w-4 h-4" />
          <span>Configurações de notificações push</span>
        </button>
      </div>
    </div>
  );
}