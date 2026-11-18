import React from 'react';
import { Heart } from 'lucide-react';

interface LogoutModalProps {
  open: boolean;
  photoUrl: string | null;
  customerName: string;
  onStay: () => void;
  onConfirmLogout: () => void;
}

export function LogoutModal({
  open,
  photoUrl,
  customerName,
  onStay,
  onConfirmLogout,
}: LogoutModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#d68c7d]/45 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-dialog-title"
    >
      <div className="relative bg-white/95 rounded-[32px] max-w-md w-full pt-14 pb-8 px-8 text-center shadow-2xl border border-white">
        <div className="absolute -top-11 left-1/2 -translate-x-1/2">
          <div className="relative p-1.5 rounded-full bg-white shadow-lg">
            <img
              src={photoUrl || '/src/assets/images/avatar_customer_profile_1795024357561.jpg'}
              alt={customerName}
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-full object-cover bg-orange-100"
            />
            <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-[#f04f2d]">
              <Heart className="w-3.5 h-3.5 fill-[#f04f2d]" />
            </span>
          </div>
        </div>

        <h2 id="logout-dialog-title" className="text-2xl font-extrabold text-[#f04f2d]">
          Ready to sign out?
        </h2>
        <p className="text-sm text-slate-600 mt-2 mb-7 leading-relaxed">
          Your complaints and promise trackers remain safely monitored
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onStay}
            className="py-3 px-4 rounded-2xl rl-teal-btn text-white text-sm font-bold cursor-pointer"
          >
            Stay Logged In
          </button>
          <button
            type="button"
            onClick={onConfirmLogout}
            className="py-3 px-4 rounded-2xl rl-coral-btn text-white text-sm font-bold cursor-pointer"
          >
            Confirm Logout
          </button>
        </div>
      </div>
    </div>
  );
}
