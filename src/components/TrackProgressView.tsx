import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Headphones,
  Hourglass,
  Mail,
  MessageSquare,
  PackageCheck,
  Search,
  Send,
  ShieldAlert,
  Star,
  X,
} from 'lucide-react';
import { Complaint, ComplaintEvent } from '../types/resolveloop';
import {
  addComplaintMessage,
  escalateComplaint,
  subscribeComplaintEvents,
} from '../services/firestoreService';

interface TrackProgressViewProps {
  uid: string;
  customerName: string;
  complaints: Complaint[];
  selectedComplaintId: string | null;
  onSelectComplaintId: (id: string) => void;
}

const MILESTONES = [
  { step: 1, title: 'Submitted', sub: 'Complaint Submitted', icon: Mail },
  { step: 2, title: 'AI Analysis', sub: 'AI Analysis Complete', icon: BrainCircuit },
  { step: 3, title: 'Assigned', sub: 'Support Staff Assigned', icon: Headphones },
  { step: 4, title: 'Under Investigation', sub: 'Investigation Active', icon: Search },
  { step: 5, title: 'Solution Provided', sub: 'Solution Suggested', icon: PackageCheck },
  { step: 6, title: 'Customer Confirmation', sub: 'Confirmation Needed', icon: CheckCircle2 },
];

export function TrackProgressView({
  uid,
  customerName,
  complaints,
  selectedComplaintId,
  onSelectComplaintId,
}: TrackProgressViewProps) {
  const trackable = complaints.filter((c) => c.status !== 'Draft');
  const activeComplaint =
    trackable.find((c) => c.id === selectedComplaintId) || trackable[0] || null;

  const [events, setEvents] = useState<ComplaintEvent[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!activeComplaint) return;
    const unsub = subscribeComplaintEvents(activeComplaint.id, uid, setEvents);
    return () => unsub();
  }, [activeComplaint?.id, uid]);

  if (!activeComplaint) {
    return (
      <div className="bg-white rounded-[28px] p-12 text-center shadow-sm border border-slate-100">
        <p className="text-base font-bold text-slate-900 mb-1">No active complaints to track</p>
        <p className="text-sm text-slate-500">
          Submit a complaint first to view its 6-stage live progress timeline.
        </p>
      </div>
    );
  }

  const progressPct = Math.round((activeComplaint.currentStep / 6) * 100);
  const ringCirc = 2 * Math.PI * 18;
  const ringOffset = ringCirc - (progressPct / 100) * ringCirc;

  const handleEscalate = async () => {
    if (activeComplaint.status === 'Resolved') return;
    setEscalating(true);
    setBannerMsg(null);
    try {
      await escalateComplaint(activeComplaint);
      setBannerMsg(`${activeComplaint.ticketCode} escalated to Critical priority.`);
    } finally {
      setEscalating(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    setSendingChat(true);
    setChatInput('');
    try {
      await addComplaintMessage({
        complaint: activeComplaint,
        senderType: 'customer',
        senderName: customerName,
        message: text,
      });

      const res = await fetch('/api/ai/agent-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketCode: activeComplaint.ticketCode,
          title: activeComplaint.title,
          category: activeComplaint.category,
          customerMessage: text,
          agentName: activeComplaint.assignedAgentName,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          await addComplaintMessage({
            complaint: activeComplaint,
            senderType: 'agent',
            senderName: activeComplaint.assignedAgentName || 'Rahul Verma',
            message: data.reply,
          });
        }
      }
    } finally {
      setSendingChat(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Selector & Promise Progress Ring */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2.5 shadow-xs border border-slate-200/80">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Tracking Case:</span>
          <select
            value={activeComplaint.id}
            onChange={(e) => onSelectComplaintId(e.target.value)}
            className="text-sm font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
          >
            {trackable.map((c) => (
              <option key={c.id} value={c.id}>
                {c.ticketCode} — {c.title}
              </option>
            ))}
          </select>
        </label>

        <div className="bg-white rounded-2xl px-4 py-2.5 shadow-xs border border-slate-200/80 flex items-center gap-3">
          <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
            <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44" aria-hidden="true">
              <circle cx="22" cy="22" r="18" stroke="#fee2e2" strokeWidth="4" fill="none" />
              <circle
                cx="22"
                cy="22"
                r="18"
                stroke="#f04f2d"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={ringCirc}
                strokeDashoffset={ringOffset}
              />
            </svg>
            <span className="absolute text-[10px] font-extrabold text-slate-900 tabular-nums">
              {progressPct}%
            </span>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Promise progress</div>
            <div className="text-[11px] font-semibold text-[#f04f2d]">
              {activeComplaint.estimatedResolution || '2 days left'}
            </div>
          </div>
        </div>
      </div>

      {bannerMsg && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs font-semibold text-amber-950">
          {bannerMsg}
        </div>
      )}

      {/* 6-Step Horizontal Milestone Stepper */}
      <div className="bg-white rounded-[28px] p-6 sm:p-7 shadow-sm border border-slate-100 overflow-x-auto">
        <div className="min-w-[760px] grid grid-cols-6 gap-3 relative">
          {/* Connecting dashed emerald line */}
          <div
            className="absolute top-[74px] left-[8%] right-[8%] h-3 rounded-full bg-[#45d9ad]/40 pointer-events-none"
            aria-hidden="true"
          />

          {MILESTONES.map((m) => {
            const Icon = m.icon;
            const isCurrent = activeComplaint.currentStep === m.step;
            const isDone = activeComplaint.currentStep > m.step;

            return (
              <div key={m.step} className="relative z-10 flex flex-col items-center text-center">
                <div
                  className={`text-xs font-bold mb-3 min-h-[32px] flex items-center ${
                    isCurrent ? 'text-[#f04f2d]' : 'text-slate-900'
                  }`}
                >
                  {m.title}
                </div>

                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform ${
                    isCurrent
                      ? 'rl-coral-btn text-white scale-110 ring-4 ring-rose-100'
                      : isDone
                        ? 'bg-[#c9f5e6] text-emerald-800'
                        : 'bg-rose-50 text-rose-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div
                  className={`mt-2 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-extrabold tabular-nums bg-white ${
                    isCurrent
                      ? 'border-[#f04f2d] text-[#f04f2d]'
                      : isDone
                        ? 'border-emerald-500 text-emerald-700'
                        : 'border-slate-300 text-slate-400'
                  }`}
                >
                  {m.step}
                </div>

                <div
                  className={`mt-3 text-[11px] font-semibold px-2.5 py-1 rounded-xl ${
                    isCurrent
                      ? 'bg-rose-50 text-[#f04f2d] border border-rose-200'
                      : 'text-slate-800'
                  }`}
                >
                  {m.sub}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom 3 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Activity Timeline */}
        <div className="lg:col-span-4 bg-white rounded-[26px] p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-900 mb-4">Timeline Activity</h3>
          {events.length === 0 ? (
            <p className="text-xs text-slate-500">Activity updates will appear here as your case progresses.</p>
          ) : (
            <div className="space-y-4 border-l-2 border-emerald-200 pl-4 ml-1.5">
              {events.map((ev) => {
                const timeStr = ev.createdAt?.toDate
                  ? ev.createdAt.toDate().toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Just now';
                return (
                  <div key={ev.id} className="relative">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tabular-nums">
                      {timeStr} · {ev.senderName}
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">{ev.title}</div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{ev.description}</p>
                    {ev.tag && (
                      <span className="inline-block mt-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {ev.tag}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Middle: Peach Events & Update Card */}
        <div className="lg:col-span-4 bg-[#fff0eb] rounded-[26px] p-5 shadow-sm border border-orange-100 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-extrabold tracking-wider text-[#d93d1f] uppercase mb-1">
                Events
              </div>
              <p className="text-sm font-bold text-slate-900">
                {activeComplaint.assignedAgentName} from {activeComplaint.assignedTeam} is handling
                your case.
              </p>
            </div>

            <div className="border-t border-orange-200/70 pt-4">
              <div className="text-[11px] font-extrabold tracking-wider text-[#d93d1f] uppercase mb-1">
                Update
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {activeComplaint.latestUpdateNote}
              </p>
            </div>
          </div>

          <div className="pt-5 flex items-center gap-2 text-xs font-extrabold text-[#d93d1f] font-mono-nums">
            <ShieldAlert className="w-4 h-4" />
            Case ID: {activeComplaint.ticketCode}
          </div>
        </div>

        {/* Right: Assigned Agent Card */}
        <div className="lg:col-span-4 bg-white rounded-[26px] p-5 shadow-sm border border-slate-100 flex flex-col items-center text-center justify-between">
          <div className="flex flex-col items-center">
            <img
              src="/src/assets/images/avatar_support_agent_1795024358457.jpg"
              alt={activeComplaint.assignedAgentName}
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-full object-cover ring-4 ring-emerald-100 mb-3"
            />
            <h3 className="text-lg font-extrabold text-slate-900">
              {activeComplaint.assignedAgentName}
            </h3>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
              <span>{activeComplaint.assignedAgentRole}</span>
              <span className="inline-flex items-center gap-0.5 text-amber-500 font-bold tabular-nums">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {activeComplaint.assignedAgentRating.toFixed(1)}
              </span>
            </p>
          </div>

          <div className="w-full space-y-2.5 mt-5">
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              className="w-full py-2.5 px-4 rounded-2xl rl-coral-btn text-white text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              Chat with {activeComplaint.assignedAgentName.split(' ')[0]}
            </button>
            <button
              type="button"
              onClick={handleEscalate}
              disabled={escalating || activeComplaint.status === 'Resolved'}
              className="w-full py-2.5 px-4 rounded-2xl bg-[#d93d1f] hover:bg-[#b92e14] text-white text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <AlertTriangle className="w-4 h-4" />
              {activeComplaint.status === 'Escalated'
                ? 'Escalated (Critical)'
                : escalating
                  ? 'Escalating...'
                  : 'Escalate Issue'}
            </button>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="bg-white rounded-2xl px-5 py-3 shadow-xs border border-slate-100 flex items-center justify-between text-xs text-slate-600">
        <span className="flex items-center gap-2">
          <Hourglass className="w-4 h-4 text-amber-500" />
          <strong className="text-[#f04f2d]">Tip from AI:</strong> Your data is encrypted and
          monitored against SLA deadlines in real time.
        </span>
        <Hourglass className="w-4 h-4 text-amber-500 hidden sm:block" />
      </div>

      {/* Live Support Chat Drawer Modal */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[82vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <img
                  src="/src/assets/images/avatar_support_agent_1795024358457.jpg"
                  alt={activeComplaint.assignedAgentName}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <div className="text-sm font-extrabold text-slate-900">
                    {activeComplaint.assignedAgentName}
                  </div>
                  <div className="text-xs text-emerald-700 font-medium">
                    {activeComplaint.ticketCode} · Support Chat
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                aria-label="Close chat"
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {events.map((ev) => {
                const isCustomer = ev.senderType === 'customer';
                return (
                  <div
                    key={ev.id}
                    className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] font-semibold text-slate-400 mb-1">
                      {ev.senderName}
                    </span>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        isCustomer
                          ? 'bg-[#f04f2d] text-white'
                          : 'bg-[#e6f9f2] text-slate-900'
                      }`}
                    >
                      {ev.description}
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Write a message to support..."
                className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <button
                type="submit"
                disabled={sendingChat || !chatInput.trim()}
                className="px-4 py-2.5 rounded-2xl rl-teal-btn text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {sendingChat ? '...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
