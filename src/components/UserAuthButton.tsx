import React, { useState } from 'react';
import { 
  ChevronDown, 
  LogOut, 
  ShieldCheck, 
  Settings,
  FolderOpen
} from 'lucide-react';
import { AuthUser, PesertaProfile } from '../types';
import { IntegrationService } from '../services/integrationService';

interface UserAuthButtonProps {
  currentUser: AuthUser | null;
  profile: PesertaProfile;
  onLogout: () => void;
  onOpenSettings: () => void;
  onOpenAdminSettings?: () => void;
}

export const UserAuthButton: React.FC<UserAuthButtonProps> = ({
  currentUser,
  profile,
  onLogout,
  onOpenSettings,
  onOpenAdminSettings
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const adminConfig = IntegrationService.getConfig();

  if (!currentUser) return null;
  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left shadow-2xs"
      >
        <div
          className={`w-7 h-7 rounded-lg text-white flex items-center justify-center font-bold text-xs shrink-0 ${
            isAdmin ? 'bg-amber-600' : ''
          }`}
          style={!isAdmin ? { backgroundColor: 'var(--theme-primary)' } : undefined}
        >
          {currentUser.name.charAt(0)}
        </div>
        <div className="hidden md:block text-left">
          <div className="text-[11px] font-bold text-slate-900 dark:text-white leading-none truncate max-w-[120px]">
            {currentUser.name}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate max-w-[120px]">
            @{currentUser.username} {isAdmin ? '· Admin' : ''}
          </div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-2.5 px-3 z-50 animate-in fade-in zoom-in-95 duration-100">
            {/* User Details */}
            <div className="px-2 py-2 border-b border-slate-100 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {currentUser.name}
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                @{currentUser.username}{currentUser.email ? ` · ${currentUser.email}` : ''}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Lokasi: <strong className="text-slate-800 dark:text-slate-200">{profile.perusahaan}</strong>
              </div>
            </div>

            {/* Menu List */}
            <div className="pt-2 space-y-1 text-xs">
              {isAdmin && onOpenAdminSettings && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenAdminSettings();
                  }}
                  className="w-full flex items-center gap-2 py-2 px-2.5 rounded-lg text-amber-950 dark:text-amber-200 bg-amber-50/80 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 font-bold transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Pengaturan Khusus Admin</span>
                </button>
              )}

              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings();
                }}
                className="w-full flex items-center gap-2 py-2 px-2.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Pengaturan Profil & Kategori</span>
              </button>

              {adminConfig.driveFolderUrl && (
                <a
                  href={adminConfig.driveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center gap-2 py-2 px-2.5 rounded-lg text-sky-800 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/50 font-medium transition-colors"
                >
                  <FolderOpen className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span>Folder Google Drive Foto</span>
                </a>
              )}

              <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 py-2 px-2.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>Keluar (Logout)</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserAuthButton;
