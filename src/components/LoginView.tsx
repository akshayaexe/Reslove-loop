import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  User as UserIcon,
} from 'lucide-react';
import { auth, googleAuthProvider } from '../lib/firebase';

export function LoginView() {
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPwd, setShowSignInPwd] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [showSignUpPwd, setShowSignUpPwd] = useState(false);

  const [busyAction, setBusyAction] = useState<'google' | 'signin' | 'signup' | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'info'; text: string } | null>(null);

  const handleGoogleSignIn = async () => {
    setBusyAction('google');
    setStatusMessage(null);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to complete Google Sign-In.';
      setStatusMessage({ type: 'error', text: message });
    } finally {
      setBusyAction(null);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail.trim() || !signInPassword) {
      setStatusMessage({ type: 'error', text: 'Please enter both your email address and password.' });
      return;
    }
    setBusyAction('signin');
    setStatusMessage(null);
    try {
      await signInWithEmailAndPassword(auth, signInEmail.trim(), signInPassword);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setStatusMessage({
          type: 'info',
          text: 'Google Sign-In is active for instant access below. Enable Email/Password in Firebase Console to also sign in with passwords.',
        });
      } else {
        const message = err instanceof Error ? err.message : 'Sign-in failed.';
        setStatusMessage({ type: 'error', text: message });
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName.trim() || !signUpEmail.trim() || signUpPassword.length < 6) {
      setStatusMessage({
        type: 'error',
        text: 'Enter your full name, a valid email, and a password of at least 6 characters.',
      });
      return;
    }
    setBusyAction('signup');
    setStatusMessage(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, signUpEmail.trim(), signUpPassword);
      await updateProfile(cred.user, { displayName: signUpName.trim() });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setStatusMessage({
          type: 'info',
          text: 'Use "Continue with Google" in the Sign In card for one-click verified onboarding, or enable Email/Password in Firebase Console.',
        });
      } else {
        const message = err instanceof Error ? err.message : 'Could not create account.';
        setStatusMessage({ type: 'error', text: message });
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleForgotPassword = async () => {
    if (!signInEmail.trim()) {
      setStatusMessage({ type: 'info', text: 'Enter your email address above first, then click Forgot?.' });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, signInEmail.trim());
      setStatusMessage({ type: 'info', text: `Password reset email sent to ${signInEmail.trim()}.` });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not send password reset email.';
      setStatusMessage({ type: 'error', text: message });
    }
  };

  return (
    <div className="min-h-screen rl-pastel-canvas relative overflow-hidden flex items-center justify-center p-4 sm:p-8 lg:p-12">
      {/* Subtle geometric background accents matching screen1 */}
      <div
        className="pointer-events-none absolute -top-20 left-[32%] w-44 h-44 rounded-full border-[14px] border-emerald-400/20"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 right-[8%] w-64 h-64 rounded-full border-[18px] border-rose-400/20"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-[1220px] grid grid-cols-1 lg:grid-cols-12 gap-7 items-center">
        {/* Left Hero Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="inline-flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-[#ffb29d]/60 p-1.5 flex items-center justify-center shadow-sm">
              <span className="w-full h-full rounded-xl bg-[#10b981] text-white flex items-center justify-center">
                <RefreshCw className="w-5 h-5 stroke-[2.4]" />
              </span>
            </span>
            <span className="font-display font-extrabold text-2xl tracking-tight text-[#12b886]">
              Resolve<span className="text-[#f04f2d]">Loop</span>
            </span>
          </div>

          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#f04f2d] leading-[1.08] tracking-tight text-balance">
              Complaints solved, promises kept.
            </h1>
            <p className="mt-4 text-lg font-bold text-slate-900">Raise an issue once...</p>
            <ul className="mt-3 space-y-2 text-sm font-medium text-slate-800">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#10a97f] shrink-0" />
                <span>Easier complaint filing & live tracking</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#10a97f] shrink-0" />
                <span>Dedicated 24/7 customer resolution support</span>
              </li>
            </ul>
          </div>

          {/* Miniature Complaint Preview Card from screen1 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-4 shadow-lg shadow-slate-900/5 border border-white max-w-[280px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                Complaint
              </span>
              <span className="text-[11px] font-semibold text-emerald-700">Live SLA</span>
            </div>
            <div className="font-mono-nums font-bold text-slate-900 text-base mb-3">#CMP-0187</div>
            <div className="space-y-2">
              <div className="h-2.5 w-3/4 rounded-full bg-gradient-to-r from-[#ff6c4d] to-[#ff9b82]" />
              <div className="h-2.5 w-1/2 rounded-full bg-emerald-200" />
            </div>
          </div>
        </div>

        {/* Center Sign In Card */}
        <div className="lg:col-span-4 bg-white rounded-[28px] p-7 sm:p-8 shadow-xl shadow-slate-900/5 border border-white">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-6">Sign In</h2>

          {statusMessage && (
            <div
              role="alert"
              className={`mb-4 rounded-2xl px-4 py-3 text-xs font-medium leading-relaxed ${
                statusMessage.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <label className="block">
              <span className="sr-only">Email address</span>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                <input
                  type="email"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="Email address"
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f04f2d]/40 focus:border-[#f04f2d]"
                />
              </div>
            </label>

            <label className="block">
              <span className="sr-only">Password</span>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                <input
                  type={showSignInPwd ? 'text' : 'password'}
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  className="w-full pl-11 pr-11 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f04f2d]/40 focus:border-[#f04f2d]"
                />
                <button
                  type="button"
                  onClick={() => setShowSignInPwd((v) => !v)}
                  aria-label={showSignInPwd ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showSignInPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="inline-flex items-center gap-2 text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-[#f04f2d] focus:ring-[#f04f2d]"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-slate-600 hover:text-[#f04f2d] font-medium cursor-pointer"
              >
                Forgot?
              </button>
            </div>

            <button
              type="submit"
              disabled={busyAction !== null}
              className="w-full py-3.5 px-5 rounded-2xl rl-coral-btn text-white font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {busyAction === 'signin' ? 'Signing In...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="relative my-6 flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase whitespace-nowrap">
              Or continue with
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={busyAction !== null}
            className="w-full py-3 px-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-sm flex items-center justify-center gap-2.5 shadow-xs transition-all cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
              />
            </svg>
            {busyAction === 'google' ? 'Connecting Google...' : 'Google'}
          </button>
        </div>

        {/* Right Sign Up Card */}
        <div className="lg:col-span-4 bg-[#d1f5e7]/85 backdrop-blur-sm rounded-[28px] p-7 sm:p-8 shadow-xl shadow-emerald-900/5 border border-white/80">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-6">
            New User? Sign Up
          </h2>

          <form onSubmit={handleSignUp} className="space-y-3.5">
            <label className="block">
              <span className="sr-only">Full name</span>
              <div className="relative flex items-center">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  placeholder="Full name"
                  autoComplete="name"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/90 border border-emerald-200/70 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </label>

            <label className="block">
              <span className="sr-only">Email address</span>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-500 absolute left-4 pointer-events-none" />
                <input
                  type="email"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  placeholder="Email address"
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/90 border border-emerald-200/70 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </label>

            <label className="block">
              <span className="sr-only">Mobile number</span>
              <div className="relative flex items-center">
                <Phone className="w-4 h-4 text-slate-500 absolute left-4 pointer-events-none" />
                <input
                  type="tel"
                  value={signUpPhone}
                  onChange={(e) => setSignUpPhone(e.target.value)}
                  placeholder="Mobile number"
                  autoComplete="tel"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/90 border border-emerald-200/70 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </label>

            <label className="block">
              <span className="sr-only">Create password</span>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-500 absolute left-4 pointer-events-none" />
                <input
                  type={showSignUpPwd ? 'text' : 'password'}
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  placeholder="Create password"
                  autoComplete="new-password"
                  className="w-full pl-11 pr-11 py-3 rounded-2xl bg-white/90 border border-emerald-200/70 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowSignUpPwd((v) => !v)}
                  aria-label={showSignUpPwd ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  {showSignUpPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>

            <p className="text-xs text-slate-700 leading-relaxed pt-1">
              By signing up, you agree to our{' '}
              <span className="underline font-semibold">Terms</span> &{' '}
              <span className="underline font-semibold">Privacy</span>.
            </p>

            <button
              type="submit"
              disabled={busyAction !== null}
              className="w-full py-3.5 px-5 rounded-2xl rl-teal-btn text-white font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {busyAction === 'signup' ? 'Creating Account...' : 'Create Account'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
