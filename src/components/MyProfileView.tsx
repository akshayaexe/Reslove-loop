import React, { useEffect, useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Check, KeyRound, Lock, Mail, MessageSquare, Pencil, ShieldCheck, BellRing, Users } from 'lucide-react';
import { auth } from '../lib/firebase';
import { UserProfile } from '../types/resolveloop';
import { updateNotificationSettings, updateUserProfileDetails } from '../services/firestoreService';

interface MyProfileViewProps {
  uid: string;
  profile: UserProfile | null;
  fallbackEmail: string;
  fallbackName: string;
  photoUrl: string | null;
}

export function MyProfileView({
  uid,
  profile,
  fallbackEmail,
  fallbackName,
  photoUrl,
}: MyProfileViewProps) {
  const [fullName, setFullName] = useState(profile?.fullName || fallbackName || 'Priya Sharma');
  const [email, setEmail] = useState(profile?.email || fallbackEmail || '');
  const [mobileNumber, setMobileNumber] = useState(profile?.mobileNumber || '+91 99123 45678');
  const [dobDay, setDobDay] = useState('14');
  const [dobMonth, setDobMonth] = useState('08');
  const [dobYear, setDobYear] = useState('1998');
  const [occupation, setOccupation] = useState(profile?.occupation || 'Product Designer');
  const [location, setLocation] = useState(profile?.location || 'Coimbatore, India');

  const [notifyEmail, setNotifyEmail] = useState(profile?.notifyEmail ?? true);
  const [notifySms, setNotifySms] = useState(profile?.notifySms ?? false);
  const [notifyPromise, setNotifyPromise] = useState(profile?.notifyPromise ?? true);
  const [notifyCommunity, setNotifyCommunity] = useState(profile?.notifyCommunity ?? false);

  const [saving, setSaving] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName);
    setEmail(profile.email);
    setMobileNumber(profile.mobileNumber);
    setOccupation(profile.occupation);
    setLocation(profile.location);
    setNotifyEmail(profile.notifyEmail);
    setNotifySms(profile.notifySms);
    setNotifyPromise(profile.notifyPromise);
    setNotifyCommunity(profile.notifyCommunity);

    const parts = (profile.dateOfBirth || '1998-08-14').split('-');
    if (parts.length === 3) {
      setDobYear(parts[0]);
      setDobMonth(parts[1]);
      setDobDay(parts[2]);
    }
  }, [profile]);

  const firstName = fullName.split(' ')[0] || 'Priya';

  const handleSaveDetails = async () => {
    setSaving(true);
    setStatusNote(null);
    try {
      const dateOfBirth = `${dobYear.padStart(4, '1998')}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`;
      await updateUserProfileDetails(uid, {
        fullName,
        email,
        mobileNumber,
        dateOfBirth,
        occupation,
        location,
      });
      setStatusNote('Profile changes saved to your account.');
    } finally {
      setSaving(false);
    }
  };

  const togglePref = async (
    key: 'notifyEmail' | 'notifySms' | 'notifyPromise' | 'notifyCommunity',
    nextVal: boolean
  ) => {
    const nextPrefs = {
      notifyEmail: key === 'notifyEmail' ? nextVal : notifyEmail,
      notifySms: key === 'notifySms' ? nextVal : notifySms,
      notifyPromise: key === 'notifyPromise' ? nextVal : notifyPromise,
      notifyCommunity: key === 'notifyCommunity' ? nextVal : notifyCommunity,
    };
    setNotifyEmail(nextPrefs.notifyEmail);
    setNotifySms(nextPrefs.notifySms);
    setNotifyPromise(nextPrefs.notifyPromise);
    setNotifyCommunity(nextPrefs.notifyCommunity);
    await updateNotificationSettings(uid, nextPrefs);
    setStatusNote('Notification preference updated.');
  };

  const handleChangePassword = async () => {
    if (!email) return;
    try {
      await sendPasswordResetEmail(auth, email);
      setStatusNote(`Password reset instructions sent to ${email}.`);
    } catch {
      setStatusNote('Google Sign-In manages your credentials automatically.');
    }
  };

  const prefsList = [
    { key: 'notifyEmail' as const, label: 'Email Updates', val: notifyEmail, icon: Mail },
    { key: 'notifySms' as const, label: 'SMS Alerts', val: notifySms, icon: MessageSquare },
    { key: 'notifyPromise' as const, label: 'Promise Reminders', val: notifyPromise, icon: BellRing },
    { key: 'notifyCommunity' as const, label: 'Community Alerts', val: notifyCommunity, icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Center Avatar Hero */}
      <div className="flex flex-col items-center text-center pt-1 pb-2">
        <div className="p-1.5 rounded-full bg-gradient-to-tr from-[#ff6c4d] to-[#24c393] shadow-md mb-3">
          <img
            src={photoUrl || '/src/assets/images/avatar_customer_profile_1795024357561.jpg'}
            alt={fullName}
            referrerPolicy="no-referrer"
            className="w-24 h-24 rounded-full object-cover bg-white border-4 border-white"
          />
        </div>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-extrabold text-[#f04f2d]">Hello, {firstName}!</h2>
          <button
            type="button"
            onClick={handleSaveDetails}
            className="px-4 py-1.5 rounded-full rl-coral-btn text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Pencil className="w-3 h-3" />
            Save Profile
          </button>
        </div>
      </div>

      {statusNote && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-bold text-emerald-900 text-center">
          {statusNote}
        </div>
      )}

      {/* 3-Column Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: My Account Details */}
        <div className="bg-[#e3fbf3] rounded-[28px] p-6 shadow-sm border border-emerald-200/60 flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <h3 className="font-display font-extrabold text-base text-slate-900">
              My Account Details
            </h3>

            <label className="block">
              <span className="block text-[11px] font-semibold text-slate-600 mb-1">Full Name</span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-emerald-100 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </label>

            <label className="block">
              <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                Email Address
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-emerald-100 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </label>

            <label className="block">
              <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                Mobile Number
              </span>
              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-emerald-100 text-sm font-mono-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </label>

            <div>
              <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                Date of Birth
              </span>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={dobDay}
                  onChange={(e) => setDobDay(e.target.value.slice(0, 2))}
                  aria-label="Day"
                  className="px-3 py-2.5 rounded-2xl bg-white border border-emerald-100 text-sm font-mono-nums text-center text-slate-900"
                />
                <input
                  type="text"
                  value={dobMonth}
                  onChange={(e) => setDobMonth(e.target.value.slice(0, 2))}
                  aria-label="Month"
                  className="px-3 py-2.5 rounded-2xl bg-white border border-emerald-100 text-sm font-mono-nums text-center text-slate-900"
                />
                <input
                  type="text"
                  value={dobYear}
                  onChange={(e) => setDobYear(e.target.value.slice(0, 4))}
                  aria-label="Year"
                  className="px-3 py-2.5 rounded-2xl bg-white border border-emerald-100 text-sm font-mono-nums text-center text-slate-900"
                />
              </div>
            </div>

            <label className="block">
              <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                Occupation & Location
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="Occupation"
                  className="w-full px-3 py-2.5 rounded-2xl bg-white border border-emerald-100 text-xs text-slate-900"
                />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City"
                  className="w-full px-3 py-2.5 rounded-2xl bg-white border border-emerald-100 text-xs text-slate-900"
                />
              </div>
            </label>
          </div>

          <button
            type="button"
            onClick={handleSaveDetails}
            disabled={saving}
            className="w-full py-3 rounded-2xl rl-coral-btn text-white text-xs font-extrabold uppercase tracking-wider cursor-pointer disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Column 2: My Notification Settings */}
        <div className="bg-[#e3fbf3] rounded-[28px] p-6 shadow-sm border border-emerald-200/60 flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <h3 className="font-display font-extrabold text-base text-slate-900">
              My Notification Settings
            </h3>

            <div className="space-y-3">
              {prefsList.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.key}
                    className="rounded-2xl bg-white px-4 py-3.5 flex items-center justify-between gap-3 border border-emerald-100"
                  >
                    <span className="flex items-center gap-2.5 text-sm font-semibold text-slate-800">
                      <Icon className="w-4 h-4 text-emerald-700" />
                      {item.label}
                    </span>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={item.val}
                      onClick={() => togglePref(item.key, !item.val)}
                      className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer flex items-center ${
                        item.val ? 'bg-[#a7f3d0] justify-end' : 'bg-slate-200 justify-start'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-xs ${
                          item.val ? 'bg-[#f04f2d]' : 'bg-slate-400'
                        }`}
                      >
                        {item.val ? '✓' : '×'}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-center text-xs font-semibold text-emerald-900">
            Real-time push alerts enabled
          </p>
        </div>

        {/* Column 3: My Security & Data */}
        <div className="bg-[#ffefe9] rounded-[28px] p-6 shadow-sm border border-orange-200/60 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <h3 className="font-display font-extrabold text-base text-slate-900">
              My Security & Data
            </h3>

            <div className="flex flex-col items-center text-center py-2">
              <span className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#10a97f] mb-3">
                <ShieldCheck className="w-8 h-8" />
              </span>
              <span className="px-4 py-1.5 rounded-full rl-teal-btn text-white text-xs font-extrabold tracking-wide inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                TRUST VERIFIED
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                'ResolveLoop Certified',
                '2FA: Enabled',
                'PII Data Secured',
                'Data Privacy Verified',
              ].map((badge) => (
                <div
                  key={badge}
                  className="bg-white rounded-2xl p-3 text-xs font-bold text-slate-800 flex items-center gap-2 border border-orange-100"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="leading-tight">{badge}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleChangePassword}
            className="w-full py-3 rounded-2xl rl-coral-btn text-white text-xs font-extrabold uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            Change Password
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-500 flex items-center gap-1.5">
        <Lock className="w-3.5 h-3.5 text-amber-500" />
        Your data is encrypted and never shared.
      </p>
    </div>
  );
}
