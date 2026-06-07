// NotificationsPage.jsx — All notifications with read/delete actions
import { useState, useEffect } from 'react';
import { notificationAPI } from '../api/notification.api';
import { LoadingScreen } from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { Bell, Clock, Calendar, RefreshCw, Target, Map, Zap, Check, Trash2 } from 'lucide-react';

const typeIcon = {
  'task-reminder':  <Clock size={16} />,
  'exam-reminder':  <Calendar size={16} />,
  'revision-alert': <RefreshCw size={16} />,
  'mission-due':    <Target size={16} />,
  'plan-generated': <Map size={16} />,
  'streak-alert':   <Zap size={16} />,
  'general':        <Bell size={16} />,
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getAll();
      const payload = res.data.data;
      setNotifications(payload.notifications || []);
      setUnreadCount(payload.unreadCount || 0);
    } catch {
      toast.error('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { toast.error('Failed to mark as read.'); }
  };

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read.');
    } catch { toast.error('Failed to mark all as read.'); }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationAPI.delete(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Notification deleted.');
    } catch { toast.error('Failed to delete.'); }
  };

  if (loading) return <LoadingScreen text="Loading notifications..." />;

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Notifications</h1>
          <p>
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary" onClick={markAllRead}>
            <Check size={14} style={{ marginRight: 6 }} /> Mark All Read
          </button>
        )}
      </div>

      {/* Empty state */}
      {!notifications.length && (
        <EmptyState
          icon={<Bell size={40} className="error-page-icon" />}
          title="No notifications yet"
          description="Notifications will appear here when you generate plans, complete missions, or have upcoming exams."
        />
      )}

      {/* Notification list */}
      {notifications.length > 0 && (
        <div className="notifications-list">
          {notifications.map(notif => (
            <div
              key={notif._id}
              className={`notification-item${!notif.isRead ? ' unread' : ''}`}
            >
              {/* Icon */}
              <div className="notification-icon">
                {typeIcon[notif.type] || <Bell size={16} />}
              </div>

              {/* Content */}
              <div className="notification-content">
                <div className="notification-header">
                  <div className="notification-title">
                    {notif.title}
                    {!notif.isRead && <span className="notification-dot-indicator" />}
                  </div>
                  <div className="notification-time">
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                  </div>
                </div>
                <p className="notification-message">
                  {notif.message}
                </p>
                <div className="notification-actions">
                  {!notif.isRead && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => markRead(notif._id)}
                      style={{ fontSize: '0.75rem', paddingLeft: 0, paddingRight: 0 }}
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => deleteNotification(notif._id)}
                    style={{ fontSize: '0.75rem', paddingLeft: 0, paddingRight: 0 }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
