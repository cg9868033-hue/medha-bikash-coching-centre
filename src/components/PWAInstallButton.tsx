import React, { useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';
import { Language } from '../types/madrasa';

export const PWAInstallButton: React.FC<{ lang?: Language; variant?: 'dark' | 'light' }> = ({
  lang = 'en',
  variant = 'dark',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  const btnStyle =
    variant === 'dark'
      ? 'border border-[#D4AF37]/50 bg-[#0E2240]/80 text-[#F2D06B] hover:bg-[#16335E]'
      : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50';

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${btnStyle}`}
      >
        <Download className="w-4 h-4" />
        {lang === 'bn' ? 'অ্যাপ ইনস্টল করুন' : 'Install App'}
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${btnStyle}`}
        >
          <Smartphone className="w-4 h-4" />
          {lang === 'bn' ? 'আইফোনে ইনস্টল' : 'Install on iOS'}
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#0B1B34] border border-[#D4AF37]/40 p-6 text-white shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-[#F2D06B]">
                  {lang === 'bn' ? 'আইফোন / আইপ্যাডে ইনস্টল' : 'Install on iPhone / iPad'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-white"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed space-y-1">
                {lang === 'bn'
                  ? '১. সাফারি ব্রাউজারের Share বাটনে ট্যাপ করুন। ২. নিচে স্ক্রল করে "Add to Home Screen" নির্বাচন করুন।'
                  : '1. Tap the Share button in Safari toolbar. 2. Scroll down and tap "Add to Home Screen".'}
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-[#D4AF37] py-2.5 text-sm font-bold text-[#071426] hover:bg-[#E5C158] transition-colors"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Got It'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC<{ lang?: Language }> = ({ lang = 'en' }) => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg border border-amber-400/50">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>
        {lang === 'bn'
          ? 'অফলাইন মোড — সংরক্ষিত তথ্য প্রদর্শিত হচ্ছে'
          : 'Offline Mode — Showing cached portal data'}
      </span>
    </div>
  );
};
