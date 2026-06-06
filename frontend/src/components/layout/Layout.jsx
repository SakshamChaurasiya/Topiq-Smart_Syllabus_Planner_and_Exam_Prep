// Layout.jsx — Main app shell (sidebar + topbar + page)
import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { notificationAPI } from '../../api/notification.api';

const Layout = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await notificationAPI.getAll();
        const notifications = res.data.data || [];
        setUnreadCount(notifications.filter(n => !n.isRead).length);
      } catch { /* silent */ }
    };
    fetchUnread();
    // Refresh every 60 seconds
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-layout">
      <Sidebar unreadCount={unreadCount} />
      <div className="main-content">
        <Topbar />
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
