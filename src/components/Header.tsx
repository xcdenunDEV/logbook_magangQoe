import React from 'react';
import { 
  BookOpen, 
  BarChart3, 
  Plus, 
  GraduationCap
} from 'lucide-react';
import { AuthUser, PesertaProfile } from '../types';
import UserAuthButton from './UserAuthButton';
import ThemeSwitcher from './ThemeSwitcher';

interface HeaderProps {
  activeView: 'logbook' | 'rekap';
  onSelectView: (view: 'logbook' | 'rekap') => void;
  onOpenNewLogbook: () => void;
  onOpenAIChat: () => void;
  onOpenSettings: () => void;
  onOpenAdminSettings?: () => void;
  profile: PesertaProfile;
  currentUser: AuthUser | null;
  onLogout: () => void;
  onThemeChanged?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onSelectView,
  onOpenNewLogbook,
  onOpenAIChat,
  onOpenSettings,
  onOpenAdminSettings,
  profile,
  currentUser,
  onLogout,
  onThemeChanged
}) => {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-30 shadow-xs transition-colors duration-200">
      {/* Top Professional Kemnaker Strip */}
      <div 
        className="text-slate-300 text-[11px] py-1.5 px-4 sm:px-8 transition-colors duration-200"
        style={{ backgroundColor: 'var(--theme-header-bg)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-white tracking-wide">
              KEMENTERIAN KETENAGAKERJAAN RI
            </span>
            <span className="text-slate-500 hidden sm:inline">·</span>
            <span className="hidden sm:inline text-slate-300">
              Program Pemagangan Nasional (maganghub.kemnaker.go.id)
            </span>
          </div>

          <div className="text-slate-300 text-[11px]">
            Mitra: <strong className="text-white font-semibold">{profile.perusahaan}</strong>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          {/* Brand Identity with dynamic theme gradient */}
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xs tracking-tight transition-all"
              style={{
                background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-accent))'
              }}
            >
              MH
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Magang<span style={{ color: 'var(--theme-accent)' }}>hub</span>
                </span>
                {isAdmin ? (
                  <span className="text-[10px] font-bold text-amber-900 bg-amber-100 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 px-1.5 py-0.2 rounded">
                    Admin
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.2 rounded">
                    Peserta
                  </span>
                )}
              </div>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 -mt-0.5">
                Logbook Aktivitas Pemagangan
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
            <button
              onClick={() => onSelectView('logbook')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeView === 'logbook'
                  ? 'text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              style={activeView === 'logbook' ? { backgroundColor: 'var(--theme-primary)' } : undefined}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Logbook Aktivitas</span>
            </button>

            <button
              onClick={() => onSelectView('rekap')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeView === 'rekap'
                  ? 'text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              style={activeView === 'rekap' ? { backgroundColor: 'var(--theme-primary)' } : undefined}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Rekap & Laporan</span>
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Theme Switcher: Dark Mode & Color Presets */}
            <ThemeSwitcher onThemeChanged={onThemeChanged} />

            <button
              onClick={onOpenNewLogbook}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-bold rounded-xl text-white transition-all shadow-xs cursor-pointer active:scale-95"
              style={{ backgroundColor: 'var(--theme-accent)' }}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Catat Logbook</span>
              <span className="sm:hidden">Catat</span>
            </button>

            <UserAuthButton
              currentUser={currentUser}
              profile={profile}
              onLogout={onLogout}
              onOpenSettings={onOpenSettings}
              onOpenAdminSettings={isAdmin ? onOpenAdminSettings : undefined}
              onOpenAIChat={onOpenAIChat}
            />
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden pb-3 pt-1">
          <nav className="w-full flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => onSelectView('logbook')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeView === 'logbook'
                  ? 'text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
              style={activeView === 'logbook' ? { backgroundColor: 'var(--theme-primary)' } : undefined}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Logbook</span>
            </button>

            <button
              onClick={() => onSelectView('rekap')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeView === 'rekap'
                  ? 'text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
              style={activeView === 'rekap' ? { backgroundColor: 'var(--theme-primary)' } : undefined}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Rekap & Laporan</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
