import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Calendar as CalendarIcon, 
  Clock, 
  Copy, 
  Sparkles, 
  Briefcase, 
  Check, 
  TrendingUp, 
  FileText, 
  Printer, 
  Download, 
  FileSpreadsheet, 
  ChevronLeft, 
  ChevronRight,
  User
} from 'lucide-react';
import { LogbookEntry, PesertaProfile } from '../types';
import { UserService } from '../services/userService';
import { GoogleWorkspaceService } from '../services/googleWorkspace';
import { formatDuration, formatIndonesianDate, NAMA_BULAN } from '../utils/dateUtils';
import { printOfficialLogbookReport } from '../utils/pdfExport';

interface SummariesViewProps {
  entries: LogbookEntry[];
  profile: PesertaProfile;
  onOpenAIChatWithPrompt?: (prompt: string) => void;
}

export const SummariesView: React.FC<SummariesViewProps> = ({
  entries,
  profile,
  onOpenAIChatWithPrompt
}) => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'preview'>('analytics');
  const [copied, setCopied] = useState<boolean>(false);

  const summary = useMemo(() => {
    return UserService.calculateSummary(entries, selectedMonth, selectedYear);
  }, [entries, selectedMonth, selectedYear]);

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const [year, month] = e.tanggal.split('-');
      return parseInt(year, 10) === selectedYear && parseInt(month, 10) === selectedMonth;
    }).sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
  }, [entries, selectedMonth, selectedYear]);

  const totalMinutes = useMemo(() => {
    return filteredEntries.reduce((acc, curr) => acc + (curr.durasiMenit || 0), 0);
  }, [filteredEntries]);

  const periodLabel = `${NAMA_BULAN[selectedMonth - 1]} ${selectedYear}`;

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const handlePrint = () => {
    printOfficialLogbookReport(filteredEntries, profile, periodLabel);
  };

  const handleDownloadCsv = () => {
    GoogleWorkspaceService.downloadCsv(
      filteredEntries, 
      profile, 
      `Laporan_MagangHub_Kemnaker_${profile.nama.replace(/\s+/g, '_')}_${periodLabel.replace(' ', '_')}.csv`
    );
  };

  const handleCopySummary = () => {
    const text = GoogleWorkspaceService.copyFormattedSummary(filteredEntries, profile, periodLabel);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAskAISummary = () => {
    if (onOpenAIChatWithPrompt) {
      const prompt = `Tolong buatkan narasi Rangkuman Bulanan MagangHub Kemnaker untuk periode ${periodLabel}. Saya magang di ${profile.perusahaan} sebagai ${profile.posisiMagang}. Rangkumkan capaian kompetensi, pembelajaran penting, dan kontribusi proyek saya selama bulan ini secara komprehensif.`;
      onOpenAIChatWithPrompt(prompt);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Month Selector */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Bulan sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400 mr-1" />
            <span>{NAMA_BULAN[selectedMonth - 1]}</span>
            <span className="text-slate-400 font-normal">/</span>
            <span>{selectedYear}</span>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Bulan berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-view Switcher: Analytics vs Document Preview */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl self-start md:self-center">
          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'analytics'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ringkasan & Analitik
          </button>

          <button
            onClick={() => setActiveSubTab('preview')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'preview'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pratinjau Cetak & Ekspor
          </button>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          {activeSubTab === 'preview' ? (
            <>
              <button
                onClick={handleDownloadCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Unduh CSV</span>
              </button>

              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#003B73] hover:bg-sky-800 transition-colors shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak / PDF</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCopySummary}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                title="Salin Rangkuman Teks Siap Kirim"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
              </button>

              <button
                onClick={handleAskAISummary}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>AI Rangkuman</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sub-view 1: Analytics & KPIs */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Jam Magang
              </div>
              <div className="text-2xl font-extrabold text-slate-900 font-mono">
                {summary.totalJamKerja} <span className="text-xs font-normal text-slate-400">Jam</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {summary.totalLogbook} catatan logbook
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Logbook Harian
              </div>
              <div className="text-2xl font-extrabold text-sky-800 font-mono">
                {summary.totalHarian} <span className="text-xs font-normal text-slate-400">Hari</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Aktivitas reguler
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Logbook Mingguan
              </div>
              <div className="text-2xl font-extrabold text-purple-700 font-mono">
                {summary.totalMingguan} <span className="text-xs font-normal text-slate-400">Minggu</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Rekapitulasi sprint
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Dokumentasi & Sheet
              </div>
              <div className="text-2xl font-extrabold text-emerald-700 font-mono">
                {summary.totalSyncedToSheet} <span className="text-xs font-normal text-slate-400">/ {summary.totalLogbook}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {summary.totalFotoDokumentasi} foto terlampir
              </div>
            </div>
          </div>

          {/* Breakdown by Kategori & Profile Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-sky-700" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Distribusi Kategori Kegiatan Magang
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {periodLabel}
                </span>
              </div>

              <div className="space-y-3">
                {Object.entries(summary.byKategori).length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">
                    Belum ada aktivitas yang dicatat pada periode ini.
                  </p>
                ) : (
                  Object.entries(summary.byKategori).map(([kategori, count]) => {
                    const percentage = Math.round((count / (summary.totalLogbook || 1)) * 100);
                    return (
                      <div key={kategori} className="space-y-1 text-xs">
                        <div className="flex justify-between items-center text-slate-700">
                          <span className="font-semibold">{kategori}</span>
                          <span className="font-mono text-slate-500">
                            {count} kegiatan ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-[#003B73] rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Profile Overview */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <User className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  Profil Peserta
                </h3>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[11px]">Nama:</span>
                  <strong className="text-slate-900">{profile.nama}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">ID Magang:</span>
                  <span className="font-mono text-slate-800">{profile.idPeserta}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Perusahaan Mitra:</span>
                  <span className="text-slate-900 font-medium">{profile.perusahaan}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Posisi:</span>
                  <span className="text-slate-800">{profile.posisiMagang}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Institusi Asal:</span>
                  <span className="text-slate-700">{profile.institusiAsal} ({profile.jurusan})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-view 2: Document Preview (Clean & Official) */}
      {activeSubTab === 'preview' && (
        <div className="bg-slate-50 p-4 sm:p-8 rounded-2xl border border-slate-200/80 flex justify-center overflow-x-auto animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-4xl p-6 sm:p-10 rounded-xl shadow-xs border border-slate-200 text-slate-900 font-sans text-xs">
            {/* Header Kemnaker */}
            <div className="border-b-2 border-slate-900 pb-3 mb-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#003B73] text-white flex items-center justify-center font-extrabold text-base shrink-0">
                MH
              </div>
              <div className="text-center flex-1">
                <h2 className="text-xs sm:text-sm font-extrabold tracking-wide uppercase text-[#003B73]">
                  KEMENTERIAN KETENAGAKERJAAN REPUBLIK INDONESIA
                </h2>
                <h3 className="text-xs font-bold text-slate-800">
                  PROGRAM PEMAGANGAN NASIONAL (MAGANGHUB)
                </h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  maganghub.kemnaker.go.id · Laporan Aktivitas Pemagangan
                </p>
              </div>
            </div>

            {/* Profile Meta Info Table */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs mb-6 border border-slate-200 p-3 rounded-lg bg-slate-50/50">
              <div><span className="text-slate-500">Nama Peserta:</span> <strong className="text-slate-900">{profile.nama}</strong></div>
              <div><span className="text-slate-500">Perusahaan Mitra:</span> <strong className="text-slate-900">{profile.perusahaan}</strong></div>
              <div><span className="text-slate-500">ID Magang:</span> <span className="font-mono text-slate-800">{profile.idPeserta}</span></div>
              <div><span className="text-slate-500">Posisi:</span> <span className="text-slate-800">{profile.posisiMagang}</span></div>
              <div><span className="text-slate-500">Periode:</span> <strong className="text-slate-900">{periodLabel}</strong></div>
              <div><span className="text-slate-500">Institusi:</span> <span className="text-slate-800">{profile.institusiAsal}</span></div>
            </div>

            {/* Table of Entries */}
            {filteredEntries.length === 0 ? (
              <p className="text-center text-slate-400 italic py-8 border border-dashed border-slate-200 rounded-lg">
                Belum ada data logbook untuk periode {periodLabel}.
              </p>
            ) : (
              <div className="border border-slate-300 rounded-lg overflow-hidden mb-6">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 uppercase">
                    <tr>
                      <th className="p-2 border-r border-slate-300 text-center w-10">No</th>
                      <th className="p-2 border-r border-slate-300 w-36">Waktu</th>
                      <th className="p-2 border-r border-slate-300">Uraian Tugas</th>
                      <th className="p-2 border-r border-slate-300 w-44">Pembelajaran</th>
                      <th className="p-2 border-r border-slate-300 w-36">Kendala</th>
                      <th className="p-2 text-center w-24">Lampiran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredEntries.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-200">
                          <div className="font-bold">{item.tipeLogbook === 'mingguan' ? `${item.tanggal} s.d. ${item.tanggalSelesai || '-'}` : formatIndonesianDate(item.tanggal, false)}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{item.jamMulai} - {item.jamSelesai} ({(item.durasiMenit / 60).toFixed(1)} Jam)</div>
                        </td>
                        <td className="p-2 border-r border-slate-200">
                          <div className="font-semibold text-slate-700 text-[10px] mb-0.5">{item.kategori}</div>
                          <div>{item.uraianAktivitas}</div>
                        </td>
                        <td className="p-2 border-r border-slate-200">{item.pelajaranDiperoleh || '-'}</td>
                        <td className="p-2 border-r border-slate-200">{item.kendalaDihadapi || '-'}</td>
                        <td className="p-2 text-center">
                          {item.fotoDokumentasi?.length ? `📷 ${item.fotoDokumentasi.length} Foto` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Summary & Signature */}
            <div className="flex flex-col sm:flex-row justify-between items-end gap-6 pt-4 border-t border-slate-200">
              <div className="text-xs text-slate-600 space-y-1">
                <div>Total Catatan: <strong>{filteredEntries.length} logbook</strong></div>
                <div>Akumulasi Waktu: <strong>{formatDuration(totalMinutes)} ({(totalMinutes / 60).toFixed(1)} Jam)</strong></div>
              </div>

              <div className="text-center text-xs space-y-1 self-end min-w-[200px]">
                <div>{profile.kotaPenempatan || 'Makassar'}, {formatIndonesianDate(new Date().toISOString().slice(0, 10), false)}</div>
                <div className="text-slate-500">Peserta Pemagangan Nasional,</div>
                <div className="h-14"></div>
                <div className="font-bold underline">{profile.nama}</div>
                <div className="font-mono text-[10px] text-slate-500">ID: {profile.idPeserta}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummariesView;
