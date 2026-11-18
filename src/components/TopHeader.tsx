import React from 'react';
import { Bell, Calendar, MapPin, Menu, Search } from 'lucide-react';
import { NavTabId, UserProfile } from '../types/resolveloop';

interface TopHeaderProps {
  titleLeading?: string;
  titleAccent?: string;
  titleSuffix?: string;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  profile: UserProfile | null;
  fallbackName: string;
  photoUrl: string | null;
  unreadCount: number;
  onOpenMenu: () => void;
  onNavigate: (tab: NavTabId) => void;
}

export function TopHeader({
  titleLeading,
  titleAccent,
  titleSuffix,
  searchQuery,
  onSearchChange,
  profile,
  fallbackName,
  photoUrl,
  unreadCount,
  onOpenMenu,
  onNavigate,
}: TopHeaderProps) {
  const displayName = profile?.fullName || fallbackName || 'Priya Sharma';
  const location = profile?.location || 'Coimbatore, India';
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open navigation menu"
          className="lg:hidden p-2.5 rounded-2xl bg-white shadow-sm border border-slate-100 text-slate-800 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {titleLeading || titleAccent ? (
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {titleLeading && <span className="text-[#f04f2d]">{titleLeading} </span>}
            {titleAccent && <span>{titleAccent}</span>}
            {titleSuffix && <span className="text-[#f04f2d]"> {titleSuffix}</span>}
          </h1>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3 ml-auto">
        <label className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search complaints, IDs..."
            className="w-48 sm:w-64 pl-9 pr-4 py-2 rounded-full bg-white border border-slate-200/80 text-sm text-slate-800 placeholder:text-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </label>

        <div className="hidden xl:flex items-center gap-3 px-4 py-2 rounded-full bg-white border border-slate-200/80 text-xs font-medium text-slate-600 shadow-xs">
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <MapPin className="w-3.5 h-3.5 text-[#f04f2d]" />
            {location}
          </span>
          <span className="text-slate-300" aria-hidden="true">
            |
          </span>
          <span className="flex items-center gap-1.5 whitespace-nowrap tabular-nums">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            {todayFormatted}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('notifications')}
          aria-label="Open notifications"
          className="relative p-2.5 rounded-full bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#f04f2d] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onNavigate('profile')}
          className="flex items-center gap-2.5 pl-3 pr-1.5 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow cursor-pointer"
        >
          <div className="text-right hidden sm:block leading-tight">
            <div className="text-xs font-bold text-slate-900 whitespace-nowrap">{displayName}</div>
            <div className="text-[11px] text-slate-500">Customer</div>
          </div>
          <img
            src={photoUrl || '/src/assets/images/avatar_customer_profile_1795024357561.jpg'}
            alt={displayName}
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full object-cover bg-orange-100"
          />
        </button>
      </div>
    </header>
  );
}
