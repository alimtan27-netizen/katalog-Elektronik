import React from 'react';
import { AppNotification } from '../types';
import { formatTimeAgo } from '../utils/formatters';
import { Bell, CheckCheck, X, ShoppingBag, CreditCard, MessageSquare, Info, Volume2 } from 'lucide-react';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onSelectNotification?: (notif: AppNotification) => void;
  onTestNotification: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onSelectNotification,
  onTestNotification,
}) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'payment':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'order':
        return <ShoppingBag className="w-4 h-4 text-blue-600" />;
      case 'chat':
        return <MessageSquare className="w-4 h-4 text-amber-600" />;
      default:
        return <Info className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden my-4 border border-slate-200 flex flex-col max-h-[82vh] cursor-default"
      >
        {/* Header */}
        <div className="p-4 px-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Notifikasi Real-time</h2>
              <p className="text-xs text-slate-500">
                {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="px-5 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between text-xs">
          <button
            onClick={onTestNotification}
            className="flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Tes Notifikasi Suara</span>
          </button>

          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="flex items-center gap-1 font-semibold text-slate-500 hover:text-slate-800"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Tandai Semua Dibaca</span>
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2.5 bg-slate-50/50">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Bell className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">Belum ada notifikasi</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Notifikasi transaksi otomatis dan balasan Admin akan muncul di sini secara real-time.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => onSelectNotification && onSelectNotification(notif)}
                className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                  notif.read
                    ? 'bg-white border-slate-200/70 text-slate-700'
                    : 'bg-blue-50/70 border-blue-200 text-slate-900 shadow-2xs'
                }`}
              >
                <div className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs shrink-0">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold truncate">{notif.title}</h4>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatTimeAgo(notif.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {notif.message}
                  </p>
                </div>
                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
