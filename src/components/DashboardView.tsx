import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FilePlus2,
  FolderKanban,
  ShieldCheck,
} from 'lucide-react';
import { Complaint, NavTabId, PromiseItem } from '../types/resolveloop';

interface DashboardViewProps {
  customerName: string;
  complaints: Complaint[];
  promises: PromiseItem[];
  onNavigate: (tab: NavTabId) => void;
  onSelectComplaint: (complaintId: string, targetTab: NavTabId) => void;
}

export function DashboardView({
  customerName,
  complaints,
  promises,
  onNavigate,
  onSelectComplaint,
}: DashboardViewProps) {
  const firstName = customerName.split(' ')[0] || 'there';
  const activeCount = complaints.filter(
    (c) => c.status === 'In Progress' || c.status === 'Escalated'
  ).length;
  const awaitingCount = complaints.filter((c) => c.status === 'Awaiting Confirmation').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;

  const keptPromises = promises.filter((p) => p.status === 'Kept').length;
  const keptPct = promises.length > 0 ? Math.round((keptPromises / promises.length) * 100) : 92;

  const recent = complaints.slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-white p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="text-xs font-semibold text-emerald-700 mb-1">Welcome back, {firstName}</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight text-balance">
            Every complaint tracked, every promise monitored.
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl">
            Monitor active escalations, review AI triage clarity scores, and confirm resolutions in one
            workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('submit')}
          className="rl-coral-btn text-white font-semibold text-sm px-5 py-3 rounded-2xl inline-flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer"
        >
          <FilePlus2 className="w-4 h-4" />
          New Complaint
        </button>
      </div>

      {/* 4 KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('complaints')}
          className="text-left bg-white rounded-3xl p-5 shadow-sm border border-slate-100 hover:border-emerald-200 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Active Complaints</span>
            <FolderKanban className="w-4 h-4 text-[#f04f2d]" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tabular-nums">{activeCount}</div>
          <div className="text-xs text-slate-500 mt-1">Currently under review</div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('promises')}
          className="text-left bg-[#dcf7ed] rounded-3xl p-5 shadow-sm border border-emerald-100 hover:border-emerald-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-emerald-900">Promises Kept</span>
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tabular-nums">{keptPct}%</div>
          <div className="text-xs text-emerald-900/80 mt-1">
            {keptPromises} of {promises.length} SLAs completed
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('confirm')}
          className="text-left bg-[#ffe9e1] rounded-3xl p-5 shadow-sm border border-orange-100 hover:border-orange-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-orange-950">Awaiting Confirmation</span>
            <Clock className="w-4 h-4 text-[#f04f2d]" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tabular-nums">{awaitingCount}</div>
          <div className="text-xs text-orange-900/80 mt-1">Ready for your sign-off</div>
        </button>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Resolved Cases</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tabular-nums">{resolvedCount}</div>
          <div className="text-xs text-slate-500 mt-1">Closed with customer rating</div>
        </div>
      </div>

      {/* Recent Complaints */}
      <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Recent Complaints</h3>
          <button
            type="button"
            onClick={() => onNavigate('complaints')}
            className="text-xs font-semibold text-[#f04f2d] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            View all
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recent.map((c) => (
            <div
              key={c.id}
              className="py-3.5 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50/70 px-2 rounded-xl transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5 text-sm font-bold text-slate-900">
                  <span className="font-mono-nums text-xs text-slate-500">{c.ticketCode}</span>
                  <span className="truncate">{c.title}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {c.category} · {c.priority} priority · {c.status}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    onSelectComplaint(
                      c.id,
                      c.status === 'Awaiting Confirmation' ? 'confirm' : 'track'
                    )
                  }
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 whitespace-nowrap cursor-pointer"
                >
                  {c.status === 'Awaiting Confirmation' ? 'Confirm Solution' : 'Track Progress'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
