import React, { useState } from 'react';
import {
  BarChart3,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  HeartHandshake,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { NotificationItem } from '../types/resolveloop';
import { markNotificationRead } from '../services/firestoreService';

interface NotificationsViewProps {
  notifications: NotificationItem[];
  onConfirmFromNotification: (complaintId: string) => void;
  onOpenComplaintTrack: (complaintId: string) => void;
}

type NotifFilter = 'All' | 'Unread' | 'Status Updates' | 'Promise Alerts';

const FILTERS: NotifFilter[] = ['All', 'Unread', 'Status Updates', 'Promise Alerts'];

export function NotificationsView({
  notifications,
  onConfirmFromNotification,
  onOpenComplaintTrack,
}: NotificationsViewProps) {
  const [filter, setFilter] = useState<NotifFilter>('All');
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = notifications.filter((n) => {
    if (filter === 'Unread') return !n.isRead;
    if (filter === 'Status Updates')
      return n.type === 'Progress Update' || n.type === 'Agent Reply' || n.type === 'AI Analysis';
    if (filter === 'Promise Alerts')
      return n.type === 'Promise Met' || n.type === 'Resolution Confirm';
    return true;
  });

  const handleMarkRead = async (n: NotificationItem) => {
    if (n.isRead) return;
    setBusyId(n.id);
    try {
      await markNotificationRead(n.id);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2.5" role="tablist" aria-label="Notification filters">
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                active
                  ? 'rl-teal-btn text-white'
                  : f === 'Unread' || f === 'Promise Alerts'
                    ? 'bg-[#ffe9e1] text-[#9a2e16] hover:bg-[#ffd9cc]'
                    : 'bg-[#dcf7ed] text-emerald-950 hover:bg-[#c5f2e0]'
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-[28px] p-12 text-center shadow-sm border border-slate-100">
          <p className="text-base font-bold text-slate-900">You are all caught up</p>
          <p className="text-sm text-slate-500 mt-1">
            New updates from support specialists and promise trackers will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((n, index) => {
            const isMint = index % 2 === 0;
            const dateStr = n.createdAt?.toDate
              ? n.createdAt.toDate().toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Nov 18, 2026';

            const Icon =
              n.type === 'Agent Reply'
                ? MessageSquare
                : n.type === 'AI Analysis'
                  ? Bot
                  : n.type === 'Promise Met'
                    ? ShieldCheck
                    : n.type === 'Progress Update'
                      ? BarChart3
                      : HeartHandshake;

            return (
              <div
                key={n.id}
                onClick={() => handleMarkRead(n)}
                className={`relative rounded-[26px] p-5 shadow-sm border transition-all cursor-pointer ${
                  isMint
                    ? 'bg-[#e3fbf3] border-emerald-200/70'
                    : 'bg-[#ffefe9] border-orange-200/70'
                } ${n.isRead ? 'opacity-80' : 'hover:shadow-md'}`}
              >
                {!n.isRead && (
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#f04f2d] text-white text-xs font-extrabold flex items-center justify-center shadow-sm tabular-nums">
                    {Math.max(1, n.unreadCount)}
                  </span>
                )}

                <div className="flex items-start gap-3.5">
                  <span
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      isMint ? 'bg-[#10a97f] text-white' : 'bg-[#ff9e85] text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display font-extrabold text-base text-slate-900">
                        {n.title}
                      </h3>
                      {busyId === n.id && (
                        <span className="text-[10px] font-semibold text-slate-500">Reading...</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">{n.message}</p>
                  </div>
                </div>

                {n.previewText && (
                  <div className="mt-3.5 rounded-2xl bg-white/85 px-3.5 py-2.5 text-xs text-slate-700 leading-snug">
                    {n.previewText}
                  </div>
                )}

                {n.type === 'Progress Update' && (
                  <div className="mt-4">
                    <div className="h-2 rounded-full bg-white/80 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#10a97f]"
                        style={{ width: `${n.progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {n.type === 'Resolution Confirm' ? (
                  <div className="mt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleMarkRead(n);
                        onConfirmFromNotification(n.complaintId);
                      }}
                      className="px-5 py-2 rounded-full bg-white hover:bg-emerald-50 text-emerald-700 text-xs font-bold shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Yes, Resolved
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center justify-between text-[11px] font-medium text-slate-500">
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                      {n.type === 'AI Analysis' ? (
                        <Clock className="w-3.5 h-3.5" />
                      ) : (
                        <Calendar className="w-3.5 h-3.5" />
                      )}
                      {dateStr}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleMarkRead(n);
                        onOpenComplaintTrack(n.complaintId);
                      }}
                      className="font-bold text-slate-700 hover:text-[#f04f2d] cursor-pointer"
                    >
                      Open {n.ticketCode}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
