import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle,
  GraduationCap,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { AuthService } from '../services/authService';

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
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans text-slate-900 selection:bg-sky-600 selection:text-white">
      {/* Top back button */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-4">
        <button
          onClick={onBackToLanding}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-sky-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda MagangHub</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-200 space-y-6">
          {/* Header Card */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#003B73] via-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl mx-auto shadow-md shadow-sky-900/20">
              MH
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Masuk ke Logbook MagangHub
            </h2>
            <p className="text-xs text-slate-500">
              Program Pemagangan Nasional Kementerian Ketenagakerjaan RI
            </p>
          </div>

          {/* Quick Account Selector for the 3 Users */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <span>Pilih Akun Pengguna:</span>
              <span className="text-[10px] text-sky-700 font-semibold">1-Klik Masuk</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {/* User 1: Muhammad Ainun Anwar (Admin) */}
              <div 
                onClick={() => handleSelectAccount('ainunnn', 'password123')}
                className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                  username === 'ainunnn'
                    ? 'border-sky-600 bg-sky-50/70 ring-1 ring-sky-600'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#003B73] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    A
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                      <span>Muhammad Ainun Anwar</span>
                      <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-1.5 py-0.2 rounded">
                        Admin
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-500 mt-0.5">
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
                  className="px-2.5 py-1 text-[11px] font-bold text-white bg-[#003B73] hover:bg-sky-800 rounded-lg shadow-2xs"
                >
                  Masuk
                </button>
              </div>

              {/* User 2: Ayu Azhara (User) */}
              <div 
                onClick={() => handleSelectAccount('ayuazhara', 'password123')}
                className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                  username === 'ayuazhara'
                    ? 'border-sky-600 bg-sky-50/70 ring-1 ring-sky-600'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    A
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                      <span>Ayu Azhara</span>
                      <span className="text-[9px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.2 rounded">
                        User
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                      @ayuazhara
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickLogin('ayuazhara', 'password123');
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs"
                >
                  Masuk
                </button>
              </div>

              {/* User 3: Aliyah Meilidya (User) */}
              <div 
                onClick={() => handleSelectAccount('aliyah', 'password123')}
                className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                  username === 'aliyah'
                    ? 'border-sky-600 bg-sky-50/70 ring-1 ring-sky-600'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-indigo-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    A
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                      <span>Aliyah Meilidya</span>
                      <span className="text-[9px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.2 rounded">
                        User
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                      @aliyah
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickLogin('aliyah', 'password123');
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg shadow-2xs"
                >
                  Masuk
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Username atau Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ainunnn, ayuazhara, atau aliyah"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-hidden"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-hidden font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#003B73] hover:bg-sky-800 active:bg-sky-950 transition-all shadow-md shadow-sky-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Memverifikasi Akun...</span>
              ) : (
                <span>Masuk Sekarang</span>
              )}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          Program Pemagangan Nasional • Kementerian Ketenagakerjaan RI
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
