import React, { useState } from 'react';
import {
  CheckCircle2,
  CreditCard,
  Headphones,
  Laptop,
  Package,
  Search,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { Complaint, NavTabId } from '../types/resolveloop';
import { deleteDraftComplaint } from '../services/firestoreService';

interface MyComplaintsViewProps {
  complaints: Complaint[];
  globalSearch: string;
  onSelectForTrack: (complaintId: string) => void;
  onSelectForConfirm: (complaintId: string) => void;
  onEditDraft: (complaint: Complaint) => void;
  onNavigate: (tab: NavTabId) => void;
}

type FilterKey = 'All Complaints' | 'In Progress' | 'Awaiting Confirmation' | 'Resolved' | 'Drafts';

const FILTERS: FilterKey[] = [
  'All Complaints',
  'In Progress',
  'Awaiting Confirmation',
  'Resolved',
  'Drafts',
];

function getCategoryVisual(category: string, status: string) {
  if (status === 'Resolved') {
    return {
      bg: 'bg-emerald-100 text-emerald-700',
      Icon: CheckCircle2,
    };
  }
  const lower = category.toLowerCase();
  if (lower.includes('billing') || lower.includes('refund')) {
    return { bg: 'bg-amber-100 text-amber-700', Icon: CreditCard };
  }
  if (lower.includes('delivery')) {
    return { bg: 'bg-emerald-100 text-emerald-700', Icon: Truck };
  }
  if (lower.includes('damaged')) {
    return { bg: 'bg-rose-100 text-rose-700', Icon: Laptop };
  }
  if (lower.includes('service')) {
    return { bg: 'bg-sky-100 text-sky-700', Icon: Headphones };
  }
  return { bg: 'bg-orange-100 text-orange-700', Icon: Package };
}

export function MyComplaintsView({
  complaints,
  globalSearch,
  onSelectForTrack,
  onSelectForConfirm,
  onEditDraft,
  onNavigate,
}: MyComplaintsViewProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All Complaints');
  const [localSearch, setLocalSearch] = useState('');
  const [detailComplaint, setDetailComplaint] = useState<Complaint | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const combinedSearch = (localSearch || globalSearch).trim().toLowerCase();

  const filtered = complaints.filter((c) => {
    const matchesFilter =
      activeFilter === 'All Complaints' ||
      (activeFilter === 'Drafts' && c.status === 'Draft') ||
      (activeFilter === 'In Progress' &&
        (c.status === 'In Progress' || c.status === 'Escalated')) ||
      c.status === activeFilter;

    if (!matchesFilter) return false;
    if (!combinedSearch) return true;

    return (
      c.title.toLowerCase().includes(combinedSearch) ||
      c.ticketCode.toLowerCase().includes(combinedSearch) ||
      c.description.toLowerCase().includes(combinedSearch) ||
      c.category.toLowerCase().includes(combinedSearch)
    );
  });

  const handleDeleteDraft = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteDraftComplaint(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter bar + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filter complaints">
          {FILTERS.map((filter) => {
            const active = activeFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'rl-coral-btn text-white'
                    : filter === 'In Progress'
                      ? 'bg-[#d8f7eb] text-emerald-950 hover:bg-[#c5f2e0]'
                      : filter === 'Awaiting Confirmation'
                        ? 'bg-[#ffedd5] text-amber-950 hover:bg-[#fde2bd]'
                        : filter === 'Resolved'
                          ? 'bg-[#dcfce7] text-emerald-950 hover:bg-[#c8f7d9]'
                          : 'bg-[#f3e8ff] text-purple-950 hover:bg-[#e9d5ff]'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        <label className="relative flex items-center">
          <Search className="w-4 h-4 text-[#f04f2d] absolute left-3.5 pointer-events-none" />
          <input
            type="search"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Filter by title or ID..."
            className="w-56 pl-9 pr-4 py-2 rounded-full bg-[#ffe8e2]/60 border border-[#ffd6cb] text-xs text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#f04f2d]/40"
          />
        </label>
      </div>

      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-[28px] p-12 text-center shadow-sm border border-slate-100">
          <p className="text-base font-bold text-slate-900 mb-1">No complaints match this view</p>
          <p className="text-sm text-slate-500 mb-5">
            Try switching filters or submit a new complaint to track it here.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('submit')}
            className="rl-coral-btn text-white text-sm font-semibold px-5 py-2.5 rounded-2xl cursor-pointer"
          >
            Submit a Complaint
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((c) => {
            const { bg, Icon } = getCategoryVisual(c.category, c.status);
            const dateStr = c.createdAt?.toDate
              ? c.createdAt.toDate().toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Nov 18, 2026';

            return (
              <article
                key={c.id}
                className="bg-white rounded-[26px] p-5 shadow-sm border border-slate-100/90 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-start gap-3.5 mb-3">
                    <div
                      className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center shrink-0`}
                    >
                      <Icon className="w-7 h-7" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display font-bold text-base text-slate-900 leading-snug line-clamp-2">
                          {c.title}
                        </h3>
                        {c.status === 'Draft' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteDraft(c.id)}
                            disabled={deletingId === c.id}
                            aria-label="Delete draft"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[11px] font-semibold">
                        <span
                          className={
                            c.priority === 'High' || c.priority === 'Critical'
                              ? 'text-rose-700'
                              : 'text-amber-700'
                          }
                        >
                          {c.priority} priority
                        </span>
                        <span className="text-slate-300" aria-hidden="true">
                          ·
                        </span>
                        <span
                          className={
                            c.status === 'Resolved'
                              ? 'text-emerald-700'
                              : c.status === 'Awaiting Confirmation'
                                ? 'text-amber-700'
                                : 'text-teal-700'
                          }
                        >
                          {c.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-slate-700 mb-2 tabular-nums">
                    {dateStr} <span className="text-slate-300 mx-1">·</span>{' '}
                    <span className="font-mono-nums">{c.ticketCode}</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-5">
                    {c.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      c.status === 'Draft' ? onEditDraft(c) : onSelectForTrack(c.id)
                    }
                    className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-800 whitespace-nowrap cursor-pointer"
                  >
                    {c.status === 'Draft' ? 'Resume Draft' : 'View History'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (c.status === 'Awaiting Confirmation') {
                        onSelectForConfirm(c.id);
                      } else {
                        setDetailComplaint(c);
                      }
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold text-white whitespace-nowrap cursor-pointer ${
                      c.status === 'Resolved'
                        ? 'rl-teal-btn'
                        : 'rl-coral-btn'
                    }`}
                  >
                    {c.status === 'Awaiting Confirmation' ? 'Confirm Fix' : 'View Details'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {detailComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-[28px] max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="font-mono-nums text-xs font-semibold text-[#f04f2d]">
                  {detailComplaint.ticketCode} · {detailComplaint.orderId || 'No Order Ref'}
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
                  {detailComplaint.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDetailComplaint(null)}
                aria-label="Close details"
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex flex-wrap gap-4 text-xs text-slate-500 border-b border-slate-100 pb-3">
                <span>
                  Category: <strong className="text-slate-800">{detailComplaint.category}</strong>
                </span>
                <span>
                  Status: <strong className="text-slate-800">{detailComplaint.status}</strong>
                </span>
                <span>
                  Priority: <strong className="text-slate-800">{detailComplaint.priority}</strong>
                </span>
              </div>

              <p className="leading-relaxed">{detailComplaint.description}</p>

              <div className="rounded-2xl bg-[#eafaf4] p-4 space-y-1.5">
                <div className="text-xs font-bold text-emerald-950">AI Triage & Routing</div>
                <div className="text-xs text-slate-700">
                  {detailComplaint.aiClassification} · Clarity {detailComplaint.aiClarityScore}% ·{' '}
                  {detailComplaint.assignedTeam}
                </div>
                <div className="text-xs text-emerald-900">{detailComplaint.aiSuggestion}</div>
              </div>

              {detailComplaint.attachments.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-500 mb-1.5">Attachments</div>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-700">
                    {detailComplaint.attachments.map((file) => (
                      <span
                        key={file}
                        className="px-3 py-1 rounded-lg bg-slate-100 font-medium"
                      >
                        {file}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDetailComplaint(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Close
              </button>
              {detailComplaint.status !== 'Draft' && (
                <button
                  type="button"
                  onClick={() => {
                    const id = detailComplaint.id;
                    setDetailComplaint(null);
                    onSelectForTrack(id);
                  }}
                  className="px-4 py-2 rounded-xl rl-coral-btn text-white text-xs font-semibold cursor-pointer"
                >
                  Open Live Tracker
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
