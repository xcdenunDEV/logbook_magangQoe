import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Calendar, 
  ExternalLink, 
  Edit3, 
  Copy, 
  CheckCircle2, 
  Image as ImageIcon,
  FolderOpen,
  FileSpreadsheet,
  RefreshCw,
  Download
} from 'lucide-react';
import { AuthUser, LogbookEntry } from '../types';
import { formatDuration, formatIndonesianDate } from '../utils/dateUtils';
import { IntegrationService } from '../services/integrationService';

interface LogbookDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: LogbookEntry | null;
  currentUser: AuthUser | null;
  onEdit: (entry: LogbookEntry) => void;
  onDuplicate: (entry: LogbookEntry) => void;
  onSyncSingleEntry?: (entry: LogbookEntry) => void;
}

export const LogbookDetailModal: React.FC<LogbookDetailModalProps> = ({
  isOpen,
  onClose,
  entry,
  currentUser,
  onEdit,
  onDuplicate,
  onSyncSingleEntry
}) => {
  const adminConfig = IntegrationService.getConfig();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  if (!isOpen || !entry) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#002B49] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center font-bold text-white shadow-xs">
              MH
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold">Rincian Catatan Logbook</h2>
                <span className="text-[10px] font-bold bg-sky-900 text-sky-200 px-2 py-0.5 rounded border border-sky-700 uppercase">
                  {entry.tipeLogbook}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Oleh: <strong>{entry.namaPenulis}</strong> (@{entry.username})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
          {/* Metadata bar */}
          <div className="flex flex-wrap items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-700" />
              <span className="font-bold text-slate-900 text-sm">
                {entry.tipeLogbook === 'mingguan'
                  ? `${formatIndonesianDate(entry.tanggal, false)} s.d. ${formatIndonesianDate(entry.tanggalSelesai || entry.tanggal, false)}`
                  : formatIndonesianDate(entry.tanggal, true)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {entry.jamMulai && entry.jamSelesai && (
                <div className="font-mono text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">
                  {entry.jamMulai} - {entry.jamSelesai} ({formatDuration(entry.durasiMenit)})
                </div>
              )}

              {entry.isSyncedToSheet ? (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Tersinkron ke Sheet
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                  Belum Disinkronkan
                </span>
              )}
            </div>
          </div>

          {/* Kategori */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Kategori:</span>
            <span className="px-2.5 py-0.5 rounded-md font-bold text-sky-900 bg-sky-50 border border-sky-200">
              {entry.kategori}
            </span>
            <span className="text-slate-500 font-semibold ml-2">Status:</span>
            <span className="px-2 py-0.5 rounded font-bold capitalize bg-slate-100 text-slate-800">
              {entry.statusKegiatan}
            </span>
          </div>

          {/* 1. Uraian Aktivitas */}
          <div className="space-y-1 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wide">
              1. Uraian Aktivitas
            </div>
            <p className="text-slate-800 leading-relaxed text-xs whitespace-pre-line">
              {entry.uraianAktivitas}
            </p>
          </div>

          {/* 2. Pelajaran Diperoleh */}
          {entry.pelajaranDiperoleh && (
            <div className="space-y-1 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wide">
                2. Pelajaran yang Diperoleh
              </div>
              <p className="text-slate-800 leading-relaxed text-xs whitespace-pre-line">
                {entry.pelajaranDiperoleh}
              </p>
            </div>
          )}

          {/* 3. Kendala & Solusi */}
          {entry.kendalaDihadapi && (
            <div className="space-y-1 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wide">
                3. Kendala yang Dihadapi & Solusi
              </div>
              <p className="text-slate-800 leading-relaxed text-xs whitespace-pre-line">
                {entry.kendalaDihadapi}
              </p>
            </div>
          )}

          {/* 4. Foto Dokumentasi & Lampiran */}
          {entry.fotoDokumentasi && entry.fotoDokumentasi.length > 0 && (
            <div className="p-4 bg-sky-50/50 border border-sky-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sky-950 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-sky-700" />
                  <span>Foto Dokumentasi Kegiatan ({entry.fotoDokumentasi.length} Lampiran)</span>
                </span>

                {adminConfig.driveFolderUrl && (
                  <a
                    href={adminConfig.driveFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-sky-800 hover:underline text-[11px]"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-sky-600" />
                    <span>Buka Folder Drive Admin</span>
                  </a>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {entry.fotoDokumentasi.map(photo => (
                  <div 
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo.dataUrl)}
                    className="cursor-pointer group rounded-xl overflow-hidden border border-slate-300 bg-white shadow-2xs hover:shadow-md transition-all"
                  >
                    <img
                      src={photo.dataUrl}
                      alt={photo.name}
                      className="w-full h-28 object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="p-2 bg-white flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-700 truncate max-w-[120px]">
                        {photo.name}
                      </span>
                      <a
                        href={photo.dataUrl}
                        download={photo.name}
                        onClick={(e) => e.stopPropagation()}
                        className="text-slate-400 hover:text-sky-700"
                        title="Unduh Foto"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Link Eviden Tambahan */}
          {entry.linkEviden && (
            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between">
              <span className="font-semibold text-slate-800">Tautan Eksternal / Eviden:</span>
              <a
                href={entry.linkEviden}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-sky-800 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Tautan</span>
              </a>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onDuplicate(entry);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Duplikasi</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(entry);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Catatan</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onSyncSingleEntry && !entry.isSyncedToSheet && (
              <button
                onClick={() => {
                  onSyncSingleEntry(entry);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Sinkronkan ke Sheet</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>

        {/* Lightbox Photo Preview Modal */}
        {selectedPhoto && (
          <div 
            className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="relative max-w-3xl max-h-[90vh]">
              <img
                src={selectedPhoto}
                alt="Foto Dokumentasi Penuh"
                className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
              />
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogbookDetailModal;
