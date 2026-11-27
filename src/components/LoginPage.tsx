import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  AlertCircle
} from 'lucide-react';
import { AuthService } from '../services/authService';
import ThemeSwitcher from './ThemeSwitcher';

interface LoginPageProps {
  onLoginSuccess: (username: string) => void;
  onBackToLanding: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onBackToLanding
}) => {
  const [username, setUsername] = useState('ainunnn');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim()) {
      setErrorMessage('Username atau Email wajib diisi.');
      return;
    }
    if (!password) {
      setErrorMessage('Password wajib diisi.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const result = AuthService.login(username, password);
      setIsLoading(false);

      if (result.success && result.user) {
        onLoginSuccess(result.user.username);
      } else {
        setErrorMessage(result.message || 'Username atau Password tidak cocok.');
      }
    }, 350);
  };

  const handleSelectAccount = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setErrorMessage(null);
  };

  const handleQuickLogin = (user: string, pass: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setTimeout(() => {
      const result = AuthService.login(user, pass);
      setIsLoading(false);
      if (result.success && result.user) {
        onLoginSuccess(result.user.username);
      } else {
        setErrorMessage(result.message || 'Gagal masuk akun.');
      }
    }, 300);
  };

  return (
    <div className="min-h-screen relative bg-slate-50 dark:bg-[#090D16] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans text-slate-900 dark:text-slate-100 selection:bg-[var(--theme-accent)] selection:text-white transition-colors duration-200">
      {/* Ambient Grid Pattern */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-grid-ambient bg-grid-mask opacity-80 dark:opacity-40"
        aria-hidden="true"
      />

      {/* Top back button & theme switcher */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md mb-4 flex items-center justify-between">
        <button
          onClick={onBackToLanding}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-[var(--theme-accent)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </button>
        <ThemeSwitcher />
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-200 dark:border-slate-800 space-y-6">
          {/* Header Card */}
          <div className="text-center space-y-2">
            <div
              className="w-14 h-14 rounded-2xl text-white flex items-center justify-center font-bold text-xl mx-auto shadow-md"
              style={{ background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-accent))' }}
            >
              MH
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Masuk ke Logbook MagangHub
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Badan Pusat Statistik Kota Parepare · Program Pemagangan Nasional
            </p>
          </div>

          {/* Quick Account Selector for Ainun */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              <span>Akun Pengguna:</span>
              <span className="text-[10px] font-semibold" style={{ color: 'var(--theme-accent)' }}>
                1-Klik Masuk
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div 
                onClick={() => handleSelectAccount('ainunnn', 'password123')}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                  username === 'ainunnn'
                    ? 'border-[var(--theme-accent)] bg-slate-50 dark:bg-slate-800/90 ring-1 ring-[var(--theme-accent)]'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0"
                    style={{ backgroundColor: 'var(--theme-primary)' }}
                  >
                    A
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                      <span>Muhammad Ainun Anwar</span>
                      <span className="text-[9px] bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold px-1.5 py-0.2 rounded">
                        Admin
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      @ainunnn
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickLogin('ainunnn', 'password123');
                  }}
                  className="px-3 py-1.5 text-[11px] font-bold text-white rounded-lg shadow-2xs hover:opacity-95 transition-opacity"
                  style={{ backgroundColor: 'var(--theme-primary)' }}
                >
                  Masuk
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Username atau Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username (ainunnn)"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[var(--theme-accent)] focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[var(--theme-accent)] focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99]"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              {isLoading ? (
                <span>Memverifikasi Akun...</span>
              ) : (
                <span>Masuk Sekarang</span>
              )}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
          Program Pemagangan Nasional • Kementerian Ketenagakerjaan RI
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
