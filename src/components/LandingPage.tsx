import React from 'react';
import { 
  GraduationCap, 
  ArrowRight, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  FileText, 
  ShieldCheck, 
  Users, 
  Lock,
  FileSpreadsheet,
  FolderOpen,
  Image as ImageIcon
} from 'lucide-react';

interface LandingPageProps {
  onGoToLogin: () => void;
  onQuickDemoLogin?: (username?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onGoToLogin,
  onQuickDemoLogin
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-sky-600 selection:text-white">
      {/* Top Banner Kemnaker */}
      <div className="bg-[#002B49] text-slate-200 text-xs py-2 px-4 sm:px-8 border-b border-sky-900/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-amber-400" />
            <span className="font-bold tracking-wide text-sky-200 uppercase">
              KEMENTERIAN KETENAGAKERJAAN REPUBLIK INDONESIA
            </span>
            <span className="text-slate-500 hidden sm:inline">|</span>
            <span className="text-slate-300 hidden sm:inline">
              Program Pemagangan Nasional
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sky-300 text-[11px] bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800">
              maganghub.kemnaker.go.id
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#003B73] via-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-600/20 font-bold text-sm tracking-wide">
              MH
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-slate-900 leading-tight">
                  MagangHub
                </span>
                <span className="text-xs font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                  Kemnaker RI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-none">
                Logbook Harian & Mingguan Pemagangan Nasional
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onGoToLogin}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl text-white bg-[#003B73] hover:bg-sky-800 active:bg-sky-950 transition-all shadow-sm shadow-sky-900/20"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Masuk ke Akun</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-slate-50 py-16 sm:py-20 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-900 text-xs font-bold border border-blue-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              Program Pemagangan Nasional Kemnaker RI 2026
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Logbook MagangHub dengan <span className="text-[#003B73]">Dokumentasi & Sinkronisasi</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Sistem pencatatan logbook harian dan mingguan untuk kebutuhan pribadi peserta pemagangan. 
              Dilengkapi unggah foto dokumentasi yang terhubung ke Google Drive dan sinkronisasi data rekap ke Google Sheets yang diatur terpusat oleh Admin.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              <button
                onClick={onGoToLogin}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#003B73] hover:bg-sky-800 active:bg-sky-950 transition-all shadow-md shadow-sky-900/20"
              >
                <span>Masuk dengan Username & Password</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {onQuickDemoLogin && (
                <button
                  onClick={() => onQuickDemoLogin('ainunnn')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors shadow-2xs"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Akses Cepat (Admin: Ainun)</span>
                </button>
              )}
            </div>

            {/* Quick credentials cards */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              {/* Ainun */}
              <div 
                onClick={() => onQuickDemoLogin && onQuickDemoLogin('ainunnn')}
                className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-sky-500 transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>Muhammad Ainun Anwar</span>
                  <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                    Admin
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  User: <strong className="text-slate-800">ainunnn</strong>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Bisa mengatur user, Google Sheet & Drive
                </div>
              </div>

              {/* Ayu */}
              <div 
                onClick={() => onQuickDemoLogin && onQuickDemoLogin('ayuazhara')}
                className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-sky-500 transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>Ayu Azhara</span>
                  <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-bold">
                    User
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  User: <strong className="text-slate-800">ayuazhara</strong>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Logbook pribadi & foto dokumentasi
                </div>
              </div>

              {/* Aliyah */}
              <div 
                onClick={() => onQuickDemoLogin && onQuickDemoLogin('aliyah')}
                className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-sky-500 transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>Aliyah Meilidya</span>
                  <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-bold">
                    User
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  User: <strong className="text-slate-800">aliyah</strong>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Logbook pribadi & foto dokumentasi
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Fitur Utama */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Dirancang untuk Kebutuhan Pencatatan Mandiri
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Tanpa prosedur approval mentor — catat aktivitas harian dan mingguan dengan rapi dan aman
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Logbook Harian & Mingguan
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pencatatan fleksibel untuk kebutuhan personal. Tuliskan uraian aktivitas, pelajaran yang diperoleh, kendala kerja, dan durasi jam kerja secara mandiri.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center">
                <FolderOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Dokumentasi Foto & Google Drive
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Setiap logbook mendukung lampiran foto dokumentasi kegiatan dengan pratinjau instan. Admin mengatur tautan folder Google Drive tujuan penyimpanan berkas.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Sinkronisasi Google Sheets Terpusat
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Data aktivitas seluruh pengguna dapat disinkronkan secara otomatis atau 1-klik ke Google Sheet spreadsheet yang telah dikonfigurasi oleh Admin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">MagangHub Kemnaker RI</span>
            <span>•</span>
            <span>Program Pemagangan Nasional (maganghub.kemnaker.go.id)</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onGoToLogin}
              className="text-sky-800 font-bold hover:underline"
            >
              Halaman Login
            </button>
            <span className="text-slate-300">|</span>
            <span className="font-mono text-slate-400">Username: ainunnn, ayuazhara, aliyah</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
