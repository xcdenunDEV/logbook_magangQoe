import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Calendar as CalendarIcon, 
  Clock, 
  Copy, 
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
import {
  formatDuration,
  formatIndonesianDate,
  getDefaultPeriodId,
  getPeriodById,
  isDateInPeriod,
  MAGANG_PERIODS
} from '../utils/dateUtils';
import { printOfficialLogbookReport } from '../utils/pdfExport';

interface SummariesViewProps {
  entries: LogbookEntry[];
  profile: PesertaProfile;
}

export const SummariesView: React.FC<SummariesViewProps> = ({
  entries,
  profile
}) => {
  const [selectedPeriodId, setSelectedPeriodId] = useState<number>(getDefaultPeriodId());
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'preview'>('analytics');
  const [copied, setCopied] = useState<boolean>(false);
  const [popupBlocked, setPopupBlocked] = useState<boolean>(false);

  const currentPeriod = useMemo(() => getPeriodById(selectedPeriodId), [selectedPeriodId]);

  const summary = useMemo(() => {
    return UserService.calculateSummaryByPeriod(entries, currentPeriod);
  }, [entries, currentPeriod]);

  const filteredEntries = useMemo(() => {
    return entries
      .filter(e => isDateInPeriod(e.tanggal, currentPeriod))
      .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
  }, [entries, currentPeriod]);

  const totalMinutes = useMemo(() => {
    return filteredEntries.reduce((acc, curr) => acc + (curr.durasiMenit || 0), 0);
  }, [filteredEntries]);

  const periodLabel = `${currentPeriod.label} (${currentPeriod.fullRange})`;

  const handlePrevPeriod = () => {
    if (selectedPeriodId > 1) {
      setSelectedPeriodId(selectedPeriodId - 1);
    }
  };

  const handleNextPeriod = () => {
    if (selectedPeriodId < MAGANG_PERIODS.length) {
      setSelectedPeriodId(selectedPeriodId + 1);
    }
  };

  const handlePrint = () => {
    setPopupBlocked(false);
    const opened = printOfficialLogbookReport(filteredEntries, profile, periodLabel);
    if (!opened) {
      setPopupBlocked(true);
    }
  };

  const handleDownloadCsv = () => {
    GoogleWorkspaceService.downloadCsv(
      filteredEntries, 
      profile, 
      `Laporan_Logbook_Portofolio_${(profile.nama || 'Peserta').replace(/\s+/g, '_')}_Periode_${currentPeriod.id}.csv`
    );
  };

  const handleCopySummary = () => {
    const text = GoogleWorkspaceService.copyFormattedSummary(filteredEntries, profile, periodLabel);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="bg-white dark:bg-slate-900/90 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors duration-200">
        {/* Periode 1-6 Selector */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevPeriod}
            disabled={selectedPeriodId === 1}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
            title="Periode sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(Number(e.target.value))}
              className="bg-transparent font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden cursor-pointer"
              aria-label="Pilih Periode Rekap"
            >
              {MAGANG_PERIODS.map(p => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {p.label} ({p.shortRange})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleNextPeriod}
            disabled={selectedPeriodId === MAGANG_PERIODS.length}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
            title="Periode berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-view Switcher: Analytics vs Document Preview */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start md:self-center">
          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'analytics'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Ringkasan & Analitik
          </button>

          <button
            onClick={() => setActiveSubTab('preview')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'preview'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Unduh CSV</span>
              </button>

              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white transition-all shadow-2xs hover:opacity-95"
                style={{ backgroundColor: 'var(--theme-primary)' }}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak / PDF</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCopySummary}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                title="Salin Rangkuman Teks Siap Kirim"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {popupBlocked && (
        <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-200">
          <span>
            Jendela cetak diblokir oleh browser Anda. Mohon izinkan pop-up untuk situs ini lalu coba klik tombol Cetak / PDF lagi.
          </span>
          <button
            onClick={() => setPopupBlocked(false)}
            className="font-bold underline shrink-0"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Sub-view 1: Analytics & KPIs */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Jam Magang
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                {summary.totalJamKerja} <span className="text-xs font-normal text-slate-400">Jam</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {summary.totalLogbook} catatan logbook
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Logbook Harian
              </div>
              <div className="text-2xl font-extrabold font-mono" style={{ color: 'var(--theme-accent)' }}>
                {summary.totalHarian} <span className="text-xs font-normal text-slate-400">Hari</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Aktivitas reguler
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Logbook Mingguan
              </div>
              <div className="text-2xl font-extrabold text-purple-700 dark:text-purple-400 font-mono">
                {summary.totalMingguan} <span className="text-xs font-normal text-slate-400">Minggu</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Rekapitulasi sprint
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Dokumentasi & Sheet
              </div>
              <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                {summary.totalSyncedToSheet} <span className="text-xs font-normal text-slate-400">/ {summary.totalLogbook}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {summary.totalFotoDokumentasi} foto terlampir
              </div>
            </div>
          </div>

          {/* Breakdown by Kategori & Profile Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" style={{ color: 'var(--theme-accent)' }} />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
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
                        <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                          <span className="font-semibold">{kategori}</span>
                          <span className="font-mono text-slate-500 dark:text-slate-400">
                            {count} kegiatan ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${percentage}%`, backgroundColor: 'var(--theme-primary)' }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Profile Overview */}
            <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Profil Peserta
                </h3>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[11px]">Lokasi Magang:</span>
                  <span className="text-slate-900 dark:text-white font-semibold">{profile.perusahaan || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Nama:</span>
                  <strong className="text-slate-900 dark:text-white">{profile.nama || '-'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Posisi:</span>
                  <span className="text-slate-800 dark:text-slate-200">{profile.posisiMagang || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Institusi Asal:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {profile.institusiAsal || '-'}
                    {profile.jurusan ? ` (${profile.jurusan})` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-view 2: Portfolio Document Preview (Card Layout + Photos) */}
      {activeSubTab === 'preview' && (
        <div className="bg-slate-50 dark:bg-slate-900/60 p-4 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex justify-center overflow-x-auto animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-4xl p-6 sm:p-10 rounded-2xl shadow-xs border border-slate-200 text-slate-900 font-sans text-xs space-y-6">
            {/* Personal Portfolio Header */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center font-extrabold text-base shrink-0">
                  {(profile.nama || profile.username || 'LB')
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map(p => p[0])
                    .join('')
                    .toUpperCase()}
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-sky-300">
                    Portofolio &amp; Dokumentasi Magang
                  </div>
                  <h2 className="text-base font-extrabold tracking-tight text-white mt-0.5">
                    LAPORAN LOGBOOK AKTIVITAS
                  </h2>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {profile.nama || profile.username || 'Peserta Magang'} · {profile.perusahaan || '-'}
                  </p>
                </div>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-left sm:text-right shrink-0">
                <div className="text-[9px] font-bold uppercase tracking-wider text-sky-300">Periode</div>
                <div className="text-xs font-bold text-white mt-0.5">{periodLabel}</div>
              </div>
            </div>

            {/* Profile Meta Info (Tanpa Email & Kota Penempatan) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-xs border border-slate-200 p-4 rounded-xl bg-slate-50/70">
              <div><span className="text-slate-500">Nama Peserta:</span> <strong className="text-slate-900">{profile.nama || profile.username || '-'}</strong></div>
              <div><span className="text-slate-500">Lokasi Magang:</span> <strong className="text-slate-900">{profile.perusahaan || '-'}</strong></div>
              <div>
                <span className="text-slate-500">Posisi / Divisi:</span>{' '}
                <strong className="text-slate-800">
                  {profile.posisiMagang || '-'}
                  {profile.divisi ? ` · ${profile.divisi}` : ''}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Institusi Asal:</span>{' '}
                <strong className="text-slate-800">
                  {profile.institusiAsal || '-'}
                  {profile.jurusan ? ` (${profile.jurusan})` : ''}
                </strong>
              </div>
            </div>

            {/* Card-Based Entries with Photo Documentation */}
            {filteredEntries.length === 0 ? (
              <p className="text-center text-slate-400 italic py-8 border border-dashed border-slate-200 rounded-xl">
                Belum ada data logbook untuk periode {periodLabel}.
              </p>
            ) : (
              <div className="space-y-3.5">
                {filteredEntries.map((item, idx) => {
                  const photos = item.fotoDokumentasi || [];
                  return (
                    <article
                      key={item.id}
                      className="rounded-xl border border-slate-200 border-l-4 border-l-slate-800 bg-white overflow-hidden"
                    >
                      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px] font-bold">
                            #{String(idx + 1).padStart(2, '0')}
                          </span>
                          <div>
                            <div className="font-extrabold text-slate-900">
                              {item.tipeLogbook === 'mingguan'
                                ? `${formatIndonesianDate(item.tanggal, true)} s.d. ${formatIndonesianDate(item.tanggalSelesai || item.tanggal, true)}`
                                : formatIndonesianDate(item.tanggal, true)}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {item.jamMulai || '07:30'} – {item.jamSelesai || '16:00'} ({formatDuration(item.durasiMenit)})
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                          <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">{item.kategori}</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">{item.statusKegiatan}</span>
                        </div>
                      </div>

                      <div className="p-4 space-y-2.5">
                        <div>
                          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-0.5">Uraian Aktivitas</div>
                          <div className="text-slate-800 leading-relaxed whitespace-pre-line">{item.uraianAktivitas}</div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                          <div className="p-2.5 rounded-lg bg-sky-50/60 border border-sky-200/80">
                            <div className="text-[10px] font-bold uppercase text-sky-900 mb-0.5">Pelajaran Diperoleh</div>
                            <div className="text-slate-700">{item.pelajaranDiperoleh || '—'}</div>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                            <div className="text-[10px] font-bold uppercase text-slate-600 mb-0.5">Kendala &amp; Solusi</div>
                            <div className="text-slate-700">{item.kendalaDihadapi || 'Tidak ada kendala berarti.'}</div>
                          </div>
                        </div>

                        {photos.length > 0 ? (
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                            <div className="text-[10px] font-bold text-sky-800">
                              📷 Dokumentasi Foto ({photos.length} Lampiran)
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {photos.map((photo, pIdx) => (
                                <div key={photo.id || pIdx} className="rounded-lg overflow-hidden border border-slate-200 bg-white">
                                  <img src={photo.dataUrl} alt={photo.name} className="w-full h-32 object-cover" />
                                  <div className="px-2 py-1 text-[9.5px] font-mono text-slate-600 truncate border-t border-slate-100">
                                    {photo.name}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="px-3 py-1.5 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 text-[10.5px] text-slate-500 italic">
                            📷 Status Dokumentasi: Tidak ada foto yang dilampirkan pada kegiatan ini.
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Summary & Signature (Tanpa Kota Penempatan / Kemnaker) */}
            <div className="flex flex-col sm:flex-row justify-between items-end gap-6 pt-4 border-t border-slate-200">
              <div className="text-xs text-slate-600 space-y-1">
                <div>Total Catatan: <strong>{filteredEntries.length} logbook</strong></div>
                <div>Akumulasi Waktu: <strong>{formatDuration(totalMinutes)} ({(totalMinutes / 60).toFixed(1)} Jam)</strong></div>
              </div>

              <div className="text-center text-xs space-y-1 self-end min-w-[200px]">
                <div>{formatIndonesianDate(new Date().toISOString().slice(0, 10), false)}</div>
                <div className="text-slate-500">Disusun oleh,</div>
                <div className="h-14"></div>
                <div className="font-bold underline">{profile.nama || profile.username}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummariesView;
