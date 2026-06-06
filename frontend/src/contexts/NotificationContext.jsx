import { createContext, useState, useCallback, useEffect } from 'react';
import { notificationService } from '../services/notificationService';

export const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationService.getAll();
      setNotifications(res.data.data || []);
    } catch {
      // silently fail — notifications are non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAsRead = useCallback(async (id) => {
    setNotifications(prev =>
      prev.map(n => n._id === id ? { ...n, read: true } : n)
    );
    try { await notificationService.markRead(id); } catch {}
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try { await notificationService.markAllRead(); } catch {}
  }, []);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    try { await notificationService.clearAll(); } catch {}
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications, loading, unreadCount,
      fetchNotifications, markAsRead, markAllAsRead, clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export default NotificationContext;
