'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Bell, Check, X, AlertTriangle, Droplets, Info, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Notification } from '@/types';

const typeIcons: Record<string, typeof Bell> = {
  new_incident: AlertTriangle,
  incident_nearby: AlertTriangle,
  status_update: Info,
  water_alert: Droplets,
  weekly_digest: Bell,
  system: Info,
  incident_verified: CheckCircle,
};

const typeColors: Record<string, string> = {
  new_incident: 'text-red-500 bg-red-100',
  incident_nearby: 'text-orange-500 bg-orange-100',
  status_update: 'text-blue-500 bg-blue-100',
  water_alert: 'text-purple-500 bg-purple-100',
  weekly_digest: 'text-ghana-green bg-green-100',
  system: 'text-gray-500 bg-gray-100',
  incident_verified: 'text-green-500 bg-green-100',
};

export default function NotificationBell() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  useEffect(() => {
    if (!session?.user) return;

    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [session]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchNotifications() {
    try {
      const response = await fetch('/api/notifications?limit=10');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }

  async function markAllRead() {
    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function markAsRead(id: number) {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  function handleNotificationClick(notification: Notification) {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.link) {
      setIsOpen(false);
      router.push(notification.link);
    }
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center transform translate-x-1 -translate-y-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={isLoading}
                className="text-sm text-ghana-green hover:underline disabled:opacity-50"
              >
                {isLoading ? 'Marking...' : 'Mark all read'}
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {notifications.map((notification) => {
                  const Icon = typeIcons[notification.type] || Bell;
                  const colorClass = typeColors[notification.type] || 'text-gray-500 bg-gray-100';

                  return (
                    <li key={notification.id}>
                      <button
                        onClick={() => handleNotificationClick(notification)}
                        className={`w-full px-4 py-3 hover:bg-gray-50 text-left flex items-start gap-3 ${
                          !notification.read ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div className={`p-2 rounded-lg flex-shrink-0 ${colorClass}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notification.read ? 'font-medium' : ''} text-gray-900`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No notifications yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  You&apos;ll be notified about important updates
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/settings/notifications');
                }}
                className="text-sm text-ghana-green hover:underline w-full text-center"
              >
                Manage notification preferences
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
