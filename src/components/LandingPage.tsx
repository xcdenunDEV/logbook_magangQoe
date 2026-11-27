import React from 'react';
import { 
  GraduationCap, 
  ArrowRight, 
  BookOpen, 
  Sparkles, 
  Lock,
  FileSpreadsheet,
  FolderOpen
} from 'lucide-react';
import ThemeSwitcher from './ThemeSwitcher';

interface LandingPageProps {
  onGoToLogin: () => void;
  onQuickDemoLogin?: (username?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onGoToLogin,
  onQuickDemoLogin
}) => {
  return (
    <div className="min-h-screen relative bg-slate-50 dark:bg-[#090D16] flex flex-col font-sans text-slate-900 dark:text-slate-100 selection:bg-[var(--theme-accent)] selection:text-white transition-colors duration-200">
      {/* Ambient Grid Pattern */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-grid-ambient bg-grid-mask opacity-80 dark:opacity-40"
        aria-hidden="true"
      />

      {/* Top Banner Kemnaker */}
      <div
        className="relative z-20 text-slate-200 text-xs py-2 px-4 sm:px-8 border-b border-white/10 transition-colors duration-200"
        style={{ backgroundColor: 'var(--theme-header-bg)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-amber-400" />
            <span className="font-bold tracking-wide text-white uppercase">
              KEMENTERIAN KETENAGAKERJAAN REPUBLIK INDONESIA
            </span>
            <span className="text-slate-500 hidden sm:inline">|</span>
            <span className="text-slate-300 hidden sm:inline">
              Badan Pusat Statistik Kota Parepare
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-slate-200 text-[11px] bg-white/10 px-2 py-0.5 rounded border border-white/15">
              maganghub.kemnaker.go.id
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md font-bold text-sm tracking-wide"
              style={{ background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-accent))' }}
            >
              MH
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                  Magang<span style={{ color: 'var(--theme-accent)' }}>Hub</span>
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full">
                  Kemnaker RI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-none">
                Logbook Harian & Mingguan Pemagangan Nasional
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeSwitcher />
            <button
              onClick={onGoToLogin}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl text-white transition-all shadow-sm hover:opacity-95"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Masuk ke Akun</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 overflow-hidden py-16 sm:py-20 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--theme-accent)' }} />
              Badan Pusat Statistik Kota Parepare · Program Pemagangan Nasional 2026
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              Logbook MagangHub dengan{' '}
              <span style={{ color: 'var(--theme-accent)' }}>Dokumentasi & Sinkronisasi</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Sistem pencatatan logbook harian dan mingguan untuk kebutuhan pribadi peserta pemagangan. 
              Dilengkapi unggah foto dokumentasi yang terhubung ke Google Drive dan sinkronisasi data rekap ke Google Sheets.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              <button
                onClick={onGoToLogin}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-md hover:opacity-95"
                style={{ backgroundColor: 'var(--theme-primary)' }}
              >
                <span>Masuk dengan Username & Password</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {onQuickDemoLogin && (
                <button
                  onClick={() => onQuickDemoLogin('ainunnn')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 transition-colors shadow-2xs"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Akses Cepat (Admin: Ainun)</span>
                </button>
              )}
            </div>

            {/* Single Quick Access Card for Ainun */}
            <div className="pt-4 max-w-sm mx-auto text-left">
              <div 
                onClick={() => onQuickDemoLogin && onQuickDemoLogin('ainunnn')}
                className="p-3.5 bg-white/95 dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs cursor-pointer hover:border-[var(--theme-accent)] transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                  <span>Muhammad Ainun Anwar</span>
                  <span className="text-[9px] bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 px-1.5 py-0.2 rounded font-bold">
                    Admin
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  User: <strong className="text-slate-800 dark:text-slate-200">ainunnn</strong>
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Lokasi Magang: Badan Pusat Statistik Kota Parepare
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Fitur Utama */}
      <section className="relative z-10 py-16 bg-white/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Dirancang untuk Kebutuhan Pencatatan Mandiri
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Tanpa prosedur approval mentor — catat aktivitas harian dan mingguan dengan rapi dan aman
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-slate-50 dark:bg-slate-900/90 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Logbook Harian & Mingguan
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Pencatatan fleksibel untuk kebutuhan personal. Tuliskan uraian aktivitas, pelajaran yang diperoleh, kendala kerja, dan durasi jam kerja secara mandiri.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 dark:bg-slate-900/90 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 flex items-center justify-center">
                <FolderOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Dokumentasi Foto & Google Drive
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Setiap logbook mendukung lampiran foto dokumentasi kegiatan dengan pratinjau instan. Admin mengatur tautan folder Google Drive tujuan penyimpanan berkas.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 dark:bg-slate-900/90 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Sinkronisasi Google Sheets Terpusat
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Data aktivitas dapat disinkronkan secara otomatis atau 1-klik ke Google Sheet spreadsheet yang telah dikonfigurasi oleh Admin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 py-8 text-xs text-slate-500 dark:text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">MagangHub Kemnaker RI</span>
            <span>•</span>
            <span>Badan Pusat Statistik Kota Parepare</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onGoToLogin}
              className="font-bold hover:underline"
              style={{ color: 'var(--theme-accent)' }}
            >
              Halaman Login
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="font-mono text-slate-400">Username: ainunnn</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
