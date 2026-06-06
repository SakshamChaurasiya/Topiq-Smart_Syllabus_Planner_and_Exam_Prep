// NotificationsPage.jsx — All notifications with read/delete actions
import { useState, useEffect } from 'react';
import { notificationAPI } from '../api/notification.api';
import { LoadingScreen } from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';

const typeIcon = {
  'task-reminder':  '⏰',
  'exam-reminder':  '📅',
  'revision-alert': '🔄',
  'mission-due':    '🎯',
  'plan-generated': '🗺️',
  'streak-alert':   '🔥',
  'general':        '🔔',
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getAll();
      // Backend returns { notifications, unreadCount }
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
          <h1>🔔 Notifications</h1>
          <p>
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary" onClick={markAllRead}>
            ✓ Mark All Read
          </button>
        )}
      </div>

      {/* Empty state */}
      {!notifications.length && (
        <EmptyState
          icon="🔔"
          title="No notifications yet"
          description="Notifications will appear here when you generate plans, complete missions, or have upcoming exams."
        />
      )}

      {/* Notification list */}
      {notifications.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 720 }}>
          {notifications.map(notif => (
            <div
              key={notif._id}
              style={{
                background: notif.isRead ? 'var(--bg-card)' : 'rgba(99,102,241,0.06)',
                border: `1px solid ${notif.isRead ? 'var(--border-subtle)' : 'rgba(99,102,241,0.25)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                transition: 'all 0.2s',
              }}
            >
              {/* Icon */}
              <div style={{
                width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                background: notif.isRead ? 'var(--bg-elevated)' : 'var(--primary-glow)',
                border: `1px solid ${notif.isRead ? 'var(--border-subtle)' : 'rgba(99,102,241,0.3)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem',
              }}>
                {typeIcon[notif.type] || '🔔'}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: notif.isRead ? 600 : 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {notif.title}
                    {!notif.isRead && (
                      <span style={{
                        display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
                        background: 'var(--primary)', marginLeft: 8, verticalAlign: 'middle',
                      }} />
                    )}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-disabled)', flexShrink: 0 }}>
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                  </div>
                </div>
                <p style={{ fontSize: '0.83rem', margin: '4px 0 8px', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                  {notif.message}
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {!notif.isRead && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => markRead(notif._id)}
                      style={{ fontSize: '0.75rem', color: 'var(--primary-light)' }}
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => deleteNotification(notif._id)}
                    style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}
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
