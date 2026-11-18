import React from 'react';
import {
  Bell,
  Bot,
  CheckCircle2,
  Clock,
  FilePlus2,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  MapPin,
  RefreshCw,
  ShieldCheck,
  User as UserIcon,
  X,
} from 'lucide-react';
import { NavTabId } from '../types/resolveloop';

interface SidebarProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  onOpenLogout: () => void;
  unreadNotifications: number;
  locationLabel: string;
  aiTip: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: { id: NavTabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'submit', label: 'Submit Complaint', icon: FilePlus2 },
  { id: 'complaints', label: 'My Complaints', icon: FolderKanban },
  { id: 'track', label: 'Track Progress', icon: Clock },
  { id: 'promises', label: 'Promise Tracker', icon: ShieldCheck },
  { id: 'confirm', label: 'Confirm Resolution', icon: CheckCircle2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'My Profile', icon: UserIcon },
];

export function Sidebar({
  activeTab,
  onSelectTab,
  onOpenLogout,
  unreadNotifications,
  locationLabel,
  aiTip,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const navContent = (
    <aside className="w-[248px] shrink-0 rl-sidebar-gradient text-slate-900 rounded-[28px] p-5 flex flex-col justify-between shadow-xl shadow-emerald-900/10 h-full">
      <div>
        <div className="flex items-center justify-between mb-6 px-1">
          <button
            type="button"
            onClick={() => {
              onSelectTab('dashboard');
              onCloseMobile();
            }}
            className="flex items-center gap-3 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded-xl"
          >
            <span className="w-10 h-10 rounded-2xl bg-white/90 shadow-sm flex items-center justify-center text-[#f04f2d]">
              <RefreshCw className="w-5 h-5 stroke-[2.4]" />
            </span>
            <div>
              <div className="font-display font-bold text-lg leading-tight text-slate-900">
                Resolve<span className="text-[#d93d1f]">Loop</span>
              </div>
              <div className="text-[10px] font-semibold tracking-wider text-emerald-950/75">
                SMART COMPLAINT MGMT
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="lg:hidden p-1.5 rounded-lg bg-white/40 hover:bg-white/70 text-slate-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="space-y-1.5" aria-label="Primary Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-md shadow-emerald-950/10'
                    : 'text-slate-900/90 hover:bg-white/30'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-[#ffe8e2] text-[#e04322]' : 'bg-white/35 text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="truncate">{item.label}</span>
                </span>
                {item.id === 'notifications' && unreadNotifications > 0 && (
                  <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#f04f2d] text-white text-xs font-bold flex items-center justify-center tabular-nums">
                    {unreadNotifications}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-5 space-y-3">
        <div className="rounded-2xl bg-white/75 backdrop-blur-sm p-3.5 border border-white/60">
          <div className="flex items-start gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#10a97f] text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-wide text-emerald-950">TIP FROM AI</p>
              <p className="text-xs text-slate-700 leading-snug mt-0.5 line-clamp-2">{aiTip}</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onCloseMobile();
            onOpenLogout();
          }}
          className="w-full py-2.5 px-4 rounded-2xl rl-coral-btn text-white text-sm font-semibold flex items-center justify-center gap-2 transition-transform active:scale-[0.99] cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>

        <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-950/80 pt-0.5">
          <MapPin className="w-3.5 h-3.5 text-[#d93d1f]" />
          <span className="truncate">{locationLabel}</span>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:block sticky top-5 h-[calc(100vh-2.5rem)]">{navContent}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 p-3 h-full">{navContent}</div>
        </div>
      )}
    </>
  );
}
