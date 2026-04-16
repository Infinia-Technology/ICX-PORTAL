import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Bell, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch unread count on mount and every 30s
  useEffect(() => {
    const fetchCount = () => {
      api.get('/notifications/unread-count')
        .then((r) => setUnreadCount(r.data.count))
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (open) {
      setLoading(true);
      api.get('/notifications?limit=20')
        .then((r) => setNotifications(r.data.data || r.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`).catch(() => {});
    setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all').catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleClick = (notif) => {
    if (!notif.read) markRead(notif._id);
    if (notif.link) {
      navigate(notif.link);
      setOpen(false);
    }
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <header className="h-[var(--topbar-height)] bg-[var(--color-surface)] border-b border-[var(--color-border)] fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6">
      <div className="flex flex-col items-start gap-0.5">
        <img src="/logo.svg" alt="Infinia" className="h-5 w-auto" />
        <span className="text-[11px] font-medium tracking-wide text-[var(--color-text-secondary)] leading-none">Compute Exchange</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="relative p-2 hover:bg-gray-100 rounded-[var(--radius-md)] transition-colors"
          >
            <Bell className="w-5 h-5 text-[var(--color-text-secondary)]" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-xl overflow-hidden z-50">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
                <h3 className="text-sm font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="overflow-y-auto max-h-72">
                {loading && (
                  <p className="text-sm text-gray-400 text-center py-8">Loading...</p>
                )}
                {!loading && notifications.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-8">No notifications</p>
                )}
                {!loading && notifications.map((n) => (
                  <button
                    key={n._id}
                    onClick={() => handleClick(n)}
                    className={`
                      w-full text-left px-4 py-3 border-b border-[var(--color-border)] last:border-0
                      hover:bg-gray-50 transition-colors flex gap-3
                      ${!n.read ? 'bg-blue-50/50' : ''}
                    `}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm truncate ${!n.read ? 'font-semibold' : 'font-medium'}`}>
                          {n.title}
                        </p>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markRead(n._id); }}
                        className="shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-[var(--color-border)]">
          <div className="text-right">
            <p className="text-sm font-medium">{user?.email}</p>
            <p className="text-xs text-[var(--color-text-muted)] capitalize">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 hover:bg-gray-100 rounded-[var(--radius-md)] transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5 text-[var(--color-text-secondary)]" />
          </button>
        </div>
      </div>
    </header>
  );
}
