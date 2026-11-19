import React, { useState } from 'react';
import { Globe, Home, LogOut, Menu, X } from 'lucide-react';
import { Language, SiteSettings, UserProfile } from '../types/madrasa';
import { resolveUserDisplayName } from '../services/firestoreService';
import { MadrasahLogo, ScholarAvatar } from './IslamicGraphics';
import { PWAInstallButton } from './PWAInstallButton';

export interface NavTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DashboardShellProps {
  profile: UserProfile;
  settings: SiteSettings;
  tabs: NavTab[];
  activeTab: string;
  onSelectTab: (id: string) => void;
  lang: Language;
  onToggleLang: () => void;
  onBackHome: () => void;
  onSignOut: () => void;
  children: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  profile,
  settings,
  tabs,
  activeTab,
  onSelectTab,
  lang,
  onToggleLang,
  onBackHome,
  onSignOut,
  children,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const roleTitle = profile.role.replace('_', ' ').toUpperCase();
  const safeDisplayName = resolveUserDisplayName(profile.displayName, profile.email, profile.role);
  const userAvatarUrl = profile.cloudinaryImageUrl || profile.photoUrl;

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#061224] text-white border-r border-[#1E3A63]">
      <div className="p-5 border-b border-[#1A355D] flex items-center gap-3">
        <MadrasahLogo className="w-10 h-10" logoUrl={settings.logoUrl} />
        <div className="min-w-0">
          <div className="font-display text-xs font-bold text-white truncate">
            {settings.madrasaName}
          </div>
          <div className="text-[10px] font-bold tracking-wider text-[#F2D06B] uppercase mt-0.5">
            {roleTitle} PORTAL
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                onSelectTab(tab.id);
                setDrawerOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left ${
                active
                  ? 'bg-[#D4AF37] text-[#071426]'
                  : 'text-slate-300 hover:bg-[#0D213F] hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#1A355D] space-y-2">
        <div className="px-1.5 py-1 flex items-center gap-2.5">
          <ScholarAvatar
            photoUrl={userAvatarUrl}
            name={safeDisplayName}
            className="w-9 h-9 text-xs"
          />
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">{safeDisplayName}</div>
            <div className="text-[11px] text-slate-400 truncate">{profile.email}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onBackHome}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-[#0D213F] transition-colors"
        >
          <Home className="w-4 h-4 text-[#F2D06B]" />
          <span>{lang === 'bn' ? 'পাবলিক ওয়েবসাইট' : 'Public Website'}</span>
        </button>
        <button
          type="button"
          onClick={onSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-300 hover:bg-rose-500/15 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>{lang === 'bn' ? 'লগআউট' : 'Sign Out'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen no-print">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex no-print">
          <div className="w-72 max-w-[85vw] h-full relative">
            <SidebarContent />
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="absolute top-4 right-3 p-1.5 rounded-lg bg-[#0D213F] text-white"
              aria-label="Close Sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div
            className="flex-1 bg-black/60"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="no-print sticky top-0 z-30 h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-700"
              aria-label="Open Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="text-sm font-bold text-slate-900 truncate">
              {tabs.find((t) => t.id === activeTab)?.label || 'Dashboard'}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onToggleLang}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Globe className="w-3.5 h-3.5 text-[#123466]" />
              <span>{lang === 'en' ? 'বাংলা' : 'EN'}</span>
            </button>
            <PWAInstallButton lang={lang} variant="light" />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};
