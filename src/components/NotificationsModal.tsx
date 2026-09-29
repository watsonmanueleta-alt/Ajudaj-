import React from 'react';
import { X, Bell, Check, Clock, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';
import { NotificationItem } from '../types/index.ts';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.ts';

interface NotificationsModalProps {
  notifications: NotificationItem[];
  onClose: () => void;
  onRefresh: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  notifications,
  onClose,
  onRefresh,
}) => {
  const handleMarkAsRead = async (notifId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notifId), {
        read: true,
      });
      onRefresh();
    } catch (e) {
      console.warn('Erro ao marcar notificação como lida:', e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      for (const n of notifications.filter(x => !x.read)) {
        if (n.id) {
          await updateDoc(doc(db, 'notifications', n.id), { read: true });
        }
      }
      onRefresh();
    } catch (e) {
      console.warn('Erro ao marcar todas como lidas:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold">Notificações</h2>
          </div>

          <div className="flex items-center gap-2">
            {notifications.some(n => !n.read) && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] text-amber-300 hover:text-amber-200 font-semibold"
              >
                Marcar todas como lidas
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/10 text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 bg-slate-50">
          {notifications.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center text-slate-400 space-y-1">
              <Bell className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-semibold">Sem notificações no momento.</p>
              <p className="text-[10px] text-slate-400">Novos pedidos e mensagens aparecerão aqui.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => n.id && !n.read && handleMarkAsRead(n.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  n.read
                    ? 'bg-white border-slate-200/80 text-slate-600'
                    : 'bg-amber-50/80 border-amber-300 text-slate-900 font-medium shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1" />
                  )}
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  {n.message}
                </p>
                <span className="text-[9px] text-slate-400 block mt-1.5">
                  {new Date(n.createdAt).toLocaleDateString('pt-AO')} às {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
