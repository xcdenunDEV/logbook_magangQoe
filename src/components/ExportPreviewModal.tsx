import React, { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  Copy,
  Check,
  FileSpreadsheet,
  Camera,
  CameraOff,
  Clock,
  Calendar,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { LogbookEntry, PesertaProfile } from '../types';
import {
  formatDuration,
  formatIndonesianDate,
  getDefaultPeriodId,
  getPeriodById,
  getTodayString,
  isDateInPeriod,
  isStandardWorkday,
  MAGANG_PERIODS
} from '../utils/dateUtils';
import { printOfficialLogbookReport } from '../utils/pdfExport';
import { GoogleWorkspaceService } from '../services/googleWorkspace';

interface ExportPreviewModalProps {
  entries: LogbookEntry[];
  profile: PesertaProfile;
}

function getInitials(name?: string, username?: string): string {
  const source = (name || username || 'LB').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export const ExportPreviewModal: React.FC<ExportPreviewModalProps> = ({
  entries,
  profile
}) => {
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | 'all'>(getDefaultPeriodId());
  const [copied, setCopied] = useState<boolean>(false);
  const [popupWarning, setPopupWarning] = useState<boolean>(false);

  const currentPeriod = useMemo(() => {
    return selectedPeriodId === 'all' ? null : getPeriodById(selectedPeriodId);
  }, [selectedPeriodId]);

  const filteredEntries = useMemo(() => {
    return entries
      .filter(item => (currentPeriod ? isDateInPeriod(item.tanggal, currentPeriod) : true))
      .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
  }, [entries, currentPeriod]);

  const stats = useMemo(() => {
    const totalMinutes = filteredEntries.reduce((acc, curr) => acc + (curr.durasiMenit || 0), 0);
    const totalPhotos = filteredEntries.reduce((acc, curr) => acc + (curr.fotoDokumentasi?.length || 0), 0);
    const entriesWithPhotos = filteredEntries.filter(e => (e.fotoDokumentasi?.length || 0) > 0).length;
    const nonWorkdayCount = filteredEntries.filter(
      e => e.isDiluarHariKerja || !isStandardWorkday(e.tanggal)
    ).length;
    return {
      totalMinutes,
      totalHours: (totalMinutes / 60).toFixed(1),
      totalPhotos,
      entriesWithPhotos,
      nonWorkdayCount,
      workdayCount: filteredEntries.length - nonWorkdayCount
    };
  }, [filteredEntries]);

  const periodLabel = currentPeriod
    ? `${currentPeriod.label} (${currentPeriod.fullRange})`
    : 'Semua Periode (Periode 1 – 6)';

  const handlePrint = () => {
    setPopupWarning(false);
    const opened = printOfficialLogbookReport(filteredEntries, profile, periodLabel);
    if (!opened) {
      setPopupWarning(true);
    }
  };

  const handleDownloadCsv = () => {
    const suffix = currentPeriod ? `Periode_${currentPeriod.id}` : 'Semua_Periode';
    GoogleWorkspaceService.downloadCsv(
      filteredEntries,
      profile,
      `Portofolio_Logbook_${(profile.nama || profile.username || 'Peserta').replace(/\s+/g, '_')}_${suffix}.csv`
    );
  };

  const handleCopyText = () => {
    const text = GoogleWorkspaceService.copyFormattedSummary(filteredEntries, profile, periodLabel);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const initials = getInitials(profile.nama, profile.username);
  const displayName = profile.nama || profile.username || 'Peserta Magang';

  return (
    <div className="space-y-5">
      {/* Control bar */}
      <div className="bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Pratinjau &amp; Cetak Portofolio Logbook
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Format portofolio aktivitas pribadi lengkap dengan dokumentasi foto kegiatan
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedPeriodId}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedPeriodId(val === 'all' ? 'all' : Number(val));
            }}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden cursor-pointer"
          >
            {MAGANG_PERIODS.map(p => (
              <option key={p.id} value={p.id}>
                {p.label} ({p.shortRange})
              </option>
            ))}
            <option value="all">Semua Periode (1–6)</option>
          </select>

          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Unduh CSV</span>
          </button>

          <button
            onClick={handleCopyText}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            <span className="hidden sm:inline">{copied ? 'Tersalin' : 'Salin Teks'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all shadow-xs hover:opacity-95 cursor-pointer"
            style={{ backgroundColor: 'var(--theme-primary)' }}
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {popupWarning && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Pop-up peramban diblokir. Mohon izinkan pop-up agar jendela cetak PDF dapat terbuka.</span>
        </div>
      )}

      {/* Portfolio Document Sheet Preview */}
      <div className="bg-slate-100 dark:bg-slate-900/60 p-4 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner flex justify-center overflow-x-auto">
        <div className="bg-white w-full max-w-4xl p-6 sm:p-10 rounded-2xl shadow-md border border-slate-200 text-slate-900 font-sans space-y-6">
          {/* Personal Portfolio KOP / Masthead (No Kemnaker / No BPS logo) */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center font-extrabold text-lg tracking-wide shrink-0">
                {initials}
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-300">
                  Portofolio &amp; Dokumentasi Magang
                </div>
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white mt-0.5">
                  LAPORAN LOGBOOK AKTIVITAS
                </h1>
                <p className="text-xs text-slate-300 mt-0.5">
                  {displayName} · {profile.perusahaan || '-'}
                </p>
              </div>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-xl px-3.5 py-2 text-left sm:text-right shrink-0">
              <div className="text-[9px] font-bold uppercase tracking-wider text-sky-300">
                Periode Laporan
              </div>
              <div className="text-xs font-bold text-white mt-0.5">
                {periodLabel}
              </div>
            </div>
          </div>

          {/* Participant Profile Panel (Tanpa Email & Kota Penempatan) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nama Peserta</div>
              <div className="font-bold text-slate-900 mt-0.5">{displayName}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lokasi / Instansi Magang</div>
              <div className="font-bold text-slate-900 mt-0.5">{profile.perusahaan || '-'}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Posisi / Divisi</div>
              <div className="font-semibold text-slate-800 mt-0.5">
                {profile.posisiMagang || '-'}
                {profile.divisi ? ` · ${profile.divisi}` : ''}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Institusi Asal</div>
              <div className="font-semibold text-slate-800 mt-0.5">
                {profile.institusiAsal || '-'}
                {profile.jurusan ? ` (${profile.jurusan})` : ''}
              </div>
            </div>
          </div>

          {/* Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Aktivitas</div>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">{filteredEntries.length}</div>
              <div className="text-[11px] text-slate-500">
                {stats.workdayCount} hari kerja · {stats.nonWorkdayCount} luar kerja
              </div>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Akumulasi Jam</div>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">{stats.totalHours} Jam</div>
              <div className="text-[11px] text-slate-500">{formatDuration(stats.totalMinutes)}</div>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dokumentasi Foto</div>
              <div className="text-lg font-extrabold text-sky-700 mt-0.5">{stats.totalPhotos} Foto</div>
              <div className="text-[11px] text-slate-500">
                {stats.entriesWithPhotos} dari {filteredEntries.length} logbook berfoto
              </div>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tanggal Laporan</div>
              <div className="text-xs font-extrabold text-slate-900 mt-1.5">
                {formatIndonesianDate(getTodayString(), false)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Portofolio Pribadi</div>
            </div>
          </div>

          {/* Card-Based Activity List (No Table) */}
          <div className="space-y-4">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 border-b border-slate-200 pb-2">
              Rincian Catatan Aktivitas &amp; Dokumentasi Foto
            </div>

            {filteredEntries.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                Belum ada data laporan aktivitas magang pada periode {periodLabel}.
              </div>
            ) : (
              filteredEntries.map((item, idx) => {
                const numberLabel = String(idx + 1).padStart(2, '0');
                const dateDisplay = item.tipeLogbook === 'mingguan'
                  ? `${formatIndonesianDate(item.tanggal, true)} s.d. ${formatIndonesianDate(item.tanggalSelesai || item.tanggal, true)}`
                  : formatIndonesianDate(item.tanggal, true);
                const isNonWorkday = Boolean(item.isDiluarHariKerja) || !isStandardWorkday(item.tanggal);
                const photos = item.fotoDokumentasi || [];

                return (
                  <article
                    key={item.id}
                    className="rounded-xl border border-slate-200 border-l-4 border-l-slate-800 bg-white overflow-hidden shadow-2xs"
                  >
                    {/* Card Header */}
                    <div className="bg-slate-50/90 px-4 py-3 border-b border-slate-200 flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 rounded-md bg-slate-900 text-white font-mono text-[11px] font-extrabold">
                          #{numberLabel}
                        </span>
                        <div>
                          <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>{dateDisplay}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{item.jamMulai || '07:30'} – {item.jamSelesai || '16:00'}</span>
                            <span>·</span>
                            <strong className="text-slate-700">{formatDuration(item.durasiMenit)}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                        <span className="px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 uppercase">
                          {item.tipeLogbook}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
                          {item.kategori}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded border ${
                            item.statusKegiatan === 'selesai'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {item.statusKegiatan === 'selesai' ? 'Selesai' : 'Dalam Proses'}
                        </span>
                        {isNonWorkday && (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300">
                            Luar Hari Kerja{item.alasanLuarHariKerja ? `: ${item.alasanLuarHariKerja}` : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 space-y-3 text-xs">
                      <div>
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                          Uraian Aktivitas
                        </div>
                        <p className="text-slate-800 leading-relaxed whitespace-pre-line">
                          {item.uraianAktivitas}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-sky-50/60 border border-sky-200/80">
                          <div className="text-[10px] font-extrabold uppercase tracking-wider text-sky-900 mb-1">
                            Pelajaran &amp; Kompetensi Diperoleh
                          </div>
                          <p className="text-slate-700 leading-relaxed whitespace-pre-line text-[11px]">
                            {item.pelajaranDiperoleh || '—'}
                          </p>
                        </div>

                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                            Kendala &amp; Solusi
                          </div>
                          <p className="text-slate-700 leading-relaxed whitespace-pre-line text-[11px]">
                            {item.kendalaDihadapi || 'Tidak ada kendala berarti selama pelaksanaan kegiatan.'}
                          </p>
                        </div>
                      </div>

                      {item.linkEviden && (
                        <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] flex items-center gap-2">
                          <ExternalLink className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                          <span className="font-bold text-slate-700">Tautan Eviden:</span>
                          <a
                            href={item.linkEviden}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-700 hover:underline truncate"
                          >
                            {item.linkEviden}
                          </a>
                        </div>
                      )}

                      {/* Photo Documentation Block (Always Informative) */}
                      {photos.length > 0 ? (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-800">
                            <Camera className="w-3.5 h-3.5" />
                            <span>Dokumentasi Foto Kegiatan ({photos.length} Lampiran)</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {photos.map((photo, pIdx) => (
                              <div
                                key={photo.id || pIdx}
                                className="rounded-lg overflow-hidden border border-slate-200 bg-white shadow-2xs"
                              >
                                <img
                                  src={photo.dataUrl}
                                  alt={photo.name || `Dokumentasi ${pIdx + 1}`}
                                  className="w-full h-36 object-cover"
                                />
                                <div className="px-2 py-1.5 text-[10px] font-mono text-slate-600 truncate border-t border-slate-100">
                                  {photo.name || `Foto ${pIdx + 1}`}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="px-3 py-2 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 flex items-center gap-2 text-[11px] text-slate-500 italic">
                          <CameraOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Status Dokumentasi: Tidak ada foto yang dilampirkan pada kegiatan ini.</span>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {/* Closing & Signature (Tanpa Kota Penempatan / Kemnaker) */}
          <div className="pt-5 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 text-xs">
            <div className="text-[11px] text-slate-500 max-w-md">
              <strong className="text-slate-700">Catatan:</strong> Laporan ini merupakan dokumentasi dan portofolio pribadi pelaksanaan kegiatan magang di {profile.perusahaan || 'instansi terkait'}.
            </div>

            <div className="text-center self-end min-w-[200px]">
              <div className="text-slate-700">{formatIndonesianDate(getTodayString(), false)}</div>
              <div className="text-slate-500 mt-0.5">Disusun oleh,</div>
              <div className="h-14" />
              <div className="font-bold underline text-slate-900">{displayName}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPreviewModal;
