import { useState, useEffect } from 'react';
import { Bell, X, Clock, AlertTriangle, Info, History, Bus, Timer } from 'lucide-react';
import { getSocket } from '../utils/socket';
import api from '../utils/api';
import { formatRelativeTime } from '../utils/format';

const typeConfig = {
  info: { icon: Info, color: 'text-info', bg: 'bg-info-bg', border: 'border-info/20' },
  arrival: { icon: Bus, color: 'text-success', bg: 'bg-success-bg', border: 'border-success/20' },
  delay: { icon: Timer, color: 'text-warning', bg: 'bg-warning-bg', border: 'border-warning/20' },
  warning: { icon: AlertTriangle, color: 'text-error', bg: 'bg-error-bg', border: 'border-error/20' },
};

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    api.get('/notifications')
      .then(res => {
        setNotifications(res.data);
        setUnreadCount(res.data.filter(n => !n.read).length);
      })
      .catch(() => {});

    const socket = getSocket();
    if (socket) {
      socket.on('notification', (notif) => {
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(prev => prev + 1);
      });
    }

    return () => {
      if (socket) socket.off('notification');
    };
  }, []);

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const markAllRead = () => {
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const recentNotifications = notifications.filter(n => {
    const age = (Date.now() - new Date(n.createdAt).getTime()) / 1000;
    return age < 86400;
  });

  const displayList = showHistory ? notifications : recentNotifications;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) markAllRead(); }}
        className="w-11 h-11 rounded-md border border-border flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary/30 transition-colors relative"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-error text-white text-[10px] font-bold rounded-full px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 top-12 w-[min(340px,calc(100vw-32px))] z-50 card-raised overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-base font-semibold text-text-primary">Notifications</h3>
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className={`flex items-center gap-1 text-xs ${showHistory ? 'text-primary' : 'text-text-muted hover:text-text-secondary'}`}
                >
                  <History className="w-3.5 h-3.5" />
                  {showHistory ? 'Recent' : 'History'}
                </button>
                {notifications.length > 0 && (
                  <button type="button" onClick={clearAll} className="text-xs text-text-muted hover:text-error">
                    Clear
                  </button>
                )}
                <button type="button" onClick={() => setIsOpen(false)} className="text-text-muted hover:text-text-primary" aria-label="Close">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {displayList.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-text-muted opacity-40" />
                  <p className="text-sm text-text-secondary">No notifications</p>
                </div>
              ) : (
                displayList.slice(0, 30).map((notif, i) => {
                  const config = typeConfig[notif.type] || typeConfig.info;
                  const Icon = config.icon;
                  return (
                    <div
                      key={notif.id || i}
                      className={`flex gap-3 p-4 border-b border-border last:border-0 ${!notif.read ? 'bg-primary/5' : ''}`}
                    >
                      <div className={`p-2 rounded-md border flex-shrink-0 ${config.bg} ${config.border}`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-text-primary leading-relaxed">{notif.message}</p>
                        <div className="flex items-center gap-1 mt-1 text-text-muted text-xs">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(new Date(notif.createdAt).getTime()) || 'Just now'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
