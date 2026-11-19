import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { AlertCircle, ArrowLeft, CheckCircle2, KeyRound, Mail, ShieldCheck, UserPlus } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { Language, UserRole } from '../types/madrasa';
import { t } from '../i18n/translations';
import { IslamicPatternBackground, MadrasahLogo } from './IslamicGraphics';

interface AuthPortalProps {
  lang: Language;
  currentUser: User | null;
  onAuthenticated: (requestedRole?: UserRole, preferredName?: string) => Promise<void>;
  onBackHome: () => void;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({
  lang,
  currentUser,
  onAuthenticated,
  onBackHome,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.STUDENT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setError(null);
    setInfoMsg(null);
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await onAuthenticated(selectedRole, cred.user.displayName || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMsg(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        if (!cred.user.emailVerified) {
          setInfoMsg(
            'Your email is not verified yet. Please check your inbox and click the verification link, or resend below.'
          );
          setLoading(false);
          return;
        }
        await onAuthenticated(undefined, cred.user.displayName || undefined);
      } else if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (fullName.trim()) {
          await updateProfile(cred.user, { displayName: fullName.trim() });
          await cred.user.reload();
        }
        await sendEmailVerification(cred.user);
        setInfoMsg(
          'Account created! A verification email has been sent. Please verify your email address and then click "I Verified My Email".'
        );
      } else {
        await sendPasswordResetEmail(auth, email.trim());
        setInfoMsg('Password reset link sent to your email address.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed.';
      if (message.includes('auth/operation-not-allowed')) {
        setError(
          'Email/Password sign-in is not yet enabled in Firebase Console (Authentication -> Sign-in method -> Email/Password). Use Google Sign-In immediately or enable Email/Password in Firebase Console.'
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    setError(null);
    try {
      await sendEmailVerification(auth.currentUser);
      setInfoMsg('Verification email resent. Check your inbox or spam folder.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend verification email.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshVerification = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    setError(null);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        const resolvedName = fullName.trim() || auth.currentUser.displayName || undefined;
        await onAuthenticated(selectedRole, resolvedName);
      } else {
        setError('Email still shows unverified. Please click the verification link in your inbox first.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to refresh verification state.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#061224] text-white flex flex-col justify-center py-10 px-4 sm:px-6 relative overflow-hidden">
      <IslamicPatternBackground opacity={0.07} />

      <div className="relative z-10 max-w-md w-full mx-auto">
        <button
          type="button"
          onClick={onBackHome}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#F2D06B] hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {lang === 'bn' ? 'হোমপেজে ফিরে যান' : 'Back to Homepage'}
        </button>

        <div className="rounded-2xl bg-[#0B1E3B] border border-[#D4AF37]/45 p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-6">
            <MadrasahLogo className="w-16 h-16 mb-3" />
            <h1 className="font-display text-xl font-bold text-white">
              {lang === 'bn' ? 'মাদ্রাসা পোর্টাল লগইন' : 'Madrasah Portal Access'}
            </h1>
            <p className="text-xs text-sky-200/75 mt-1">
              Super Admin · Admin · Teacher · Student · Parent
            </p>
          </div>

          {currentUser && !currentUser.emailVerified && (
            <div className="mb-5 rounded-xl bg-amber-500/15 border border-amber-400/50 p-4 text-xs space-y-3">
              <div className="flex items-start gap-2 text-amber-200">
                <Mail className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Signed in as <strong>{currentUser.email}</strong>, awaiting email verification.
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleRefreshVerification}
                  className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[#071426] font-bold"
                >
                  I Verified My Email
                </button>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  className="px-3 py-1.5 rounded-lg border border-amber-400/50 text-amber-200"
                >
                  Resend Email
                </button>
                <button
                  type="button"
                  onClick={() => signOut(auth)}
                  className="px-3 py-1.5 rounded-lg text-slate-300 underline"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl bg-rose-500/15 border border-rose-400/50 p-3 text-xs text-rose-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {infoMsg && (
            <div className="mb-4 rounded-xl bg-emerald-500/15 border border-emerald-400/50 p-3 text-xs text-emerald-200 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{infoMsg}</span>
            </div>
          )}

          {/* Mode Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#071426] border border-[#1E3A63] mb-5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
                mode === 'login' ? 'bg-[#D4AF37] text-[#071426]' : 'text-slate-300 hover:text-white'
              }`}
            >
              {t(lang, 'signIn')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
                mode === 'register'
                  ? 'bg-[#D4AF37] text-[#071426]'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {t(lang, 'register')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('reset');
                setError(null);
              }}
              className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
                mode === 'reset' ? 'bg-[#D4AF37] text-[#071426]' : 'text-slate-300 hover:text-white'
              }`}
            >
              Reset
            </button>
          </div>

          {mode === 'register' && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-sky-200 mb-1.5">
                {t(lang, 'role')}
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full rounded-lg bg-[#071426] border border-[#244778] px-3 py-2 text-sm text-white"
              >
                <option value={UserRole.STUDENT}>Student Portal</option>
                <option value={UserRole.PARENT}>Parent / Guardian Portal</option>
                <option value={UserRole.TEACHER}>Teacher Application (Requires Admin Approval)</option>
              </select>
            </div>
          )}

          {/* Primary Google Sign-In */}
          {mode !== 'reset' && (
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full rounded-xl bg-white hover:bg-slate-100 text-slate-900 py-2.5 px-4 text-sm font-bold flex items-center justify-center gap-2.5 shadow-md transition-colors disabled:opacity-60"
            >
              <ShieldCheck className="w-4 h-4 text-[#123466]" />
              <span>
                {mode === 'register'
                  ? 'Continue with Google (Verified Instantly)'
                  : 'Sign In with Google'}
              </span>
            </button>
          )}

          {mode !== 'reset' && (
            <div className="my-5 flex items-center gap-3 text-[11px] text-slate-400">
              <div className="h-px flex-1 bg-[#1E3A63]" />
              <span>OR WITH EMAIL</span>
              <div className="h-px flex-1 bg-[#1E3A63]" />
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-sky-200 mb-1">
                  {t(lang, 'fullName')}
                </label>
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg bg-[#071426] border border-[#244778] px-3 py-2 text-sm text-white"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-sky-200 mb-1">
                {t(lang, 'email')}
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-[#071426] border border-[#244778] px-3 py-2 text-sm text-white"
              />
            </div>

            {mode !== 'reset' && (
              <div>
                <label className="block text-xs font-semibold text-sky-200 mb-1">
                  {t(lang, 'password')}
                </label>
                <input
                  required
                  type="password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg bg-[#071426] border border-[#244778] px-3 py-2 text-sm text-white"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] text-[#071426] py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              {mode === 'register' ? (
                <UserPlus className="w-4 h-4" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
              <span>
                {loading
                  ? 'Please wait...'
                  : mode === 'login'
                    ? t(lang, 'signIn')
                    : mode === 'register'
                      ? t(lang, 'register')
                      : 'Send Password Reset Email'}
              </span>
            </button>
          </form>

          <p className="mt-5 text-[11px] text-slate-400 text-center leading-relaxed">
            Initial Super Admin setup is secured exclusively to the verified project owner account.
            No default public admin credentials exist.
          </p>
        </div>
      </div>
    </div>
  );
};
