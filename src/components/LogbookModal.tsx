import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  FileText, 
  CheckCircle, 
  Sparkles, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  FolderOpen, 
  ExternalLink,
  Layers,
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { AuthUser, FotoLampiran, LogbookEntry, PresetAktivitasMagang } from '../types';
import { PRESET_AKTIVITAS_MAGANG } from '../data/initialData';
import { formatDuration } from '../utils/dateUtils';
import { IntegrationService } from '../services/integrationService';

interface LogbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: LogbookEntry) => void;
  initialEntry?: LogbookEntry | null;
  defaultDate?: string;
  currentUser: AuthUser | null;
  onOpenAIChatForAssist?: (section: 'uraian' | 'pelajaran' | 'kendala', currentText: string) => void;
}

export const LogbookModal: React.FC<LogbookModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEntry,
  defaultDate,
  currentUser,
  onOpenAIChatForAssist
}) => {
  const adminConfig = IntegrationService.getConfig();

  const [formData, setFormData] = useState<Partial<LogbookEntry>>({
    tipeLogbook: 'harian',
    tanggal: defaultDate || new Date().toISOString().slice(0, 10),
    tanggalSelesai: '',
    jamMulai: '08:00',
    jamSelesai: '16:00',
    durasiMenit: 480,
    kategori: 'Teknis / Proyek Utama',
    uraianAktivitas: '',
    pelajaranDiperoleh: '',
    kendalaDihadapi: '',
    fotoDokumentasi: [],
    linkEviden: '',
    statusKegiatan: 'selesai',
    isSyncedToSheet: false
  });

  const [showPresets, setShowPresets] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialEntry) {
      setFormData({ ...initialEntry });
    } else {
      setFormData({
        username: currentUser?.username || 'ainunnn',
        namaPenulis: currentUser?.name || 'Muhammad Ainun Anwar',
        tipeLogbook: 'harian',
        tanggal: defaultDate || new Date().toISOString().slice(0, 10),
        tanggalSelesai: '',
        jamMulai: '08:00',
        jamSelesai: '16:00',
        durasiMenit: 480,
        kategori: 'Teknis / Proyek Utama',
        uraianAktivitas: '',
        pelajaranDiperoleh: '',
        kendalaDihadapi: '',
        fotoDokumentasi: [],
        linkEviden: '',
        statusKegiatan: 'selesai',
        isSyncedToSheet: false
      });
    }
    setErrors({});
    setShowPresets(false);
  }, [initialEntry, defaultDate, currentUser, isOpen]);

  const handleApplyPreset = (preset: PresetAktivitasMagang) => {
    setFormData(prev => ({
      ...prev,
      kategori: preset.kategori,
      uraianAktivitas: preset.uraianTemplate,
      pelajaranDiperoleh: preset.pelajaranTemplate,
      kendalaDihadapi: preset.kendalaTemplate,
      durasiMenit: preset.durasiMenitDefault
    }));
    setShowPresets(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        alert('Mohon unggah berkas foto (JPG, PNG, WebP).');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newPhoto: FotoLampiran = {
          id: `foto-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: dataUrl,
          driveFileUrl: `${adminConfig.driveFolderUrl}`,
          uploadedAt: new Date().toISOString()
        };

        setFormData(prev => ({
          ...prev,
          fotoDokumentasi: [...(prev.fotoDokumentasi || []), newPhoto]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (photoId: string) => {
    setFormData(prev => ({
      ...prev,
      fotoDokumentasi: (prev.fotoDokumentasi || []).filter(p => p.id !== photoId)
    }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.tanggal) errs.tanggal = 'Tanggal aktivitas wajib diisi.';
    if (formData.tipeLogbook === 'mingguan' && !formData.tanggalSelesai) {
      errs.tanggalSelesai = 'Tanggal akhir periode mingguan wajib diisi.';
    }
    if (!formData.uraianAktivitas || formData.uraianAktivitas.trim().length < 5) {
      errs.uraianAktivitas = 'Uraian aktivitas wajib diisi.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const entryToSave: LogbookEntry = {
      id: formData.id || `log-${Date.now()}`,
      username: formData.username || currentUser?.username || 'ainunnn',
      namaPenulis: formData.namaPenulis || currentUser?.name || 'Muhammad Ainun Anwar',
      tipeLogbook: formData.tipeLogbook || 'harian',
      tanggal: formData.tanggal!,
      tanggalSelesai: formData.tipeLogbook === 'mingguan' ? formData.tanggalSelesai : undefined,
      jamMulai: formData.jamMulai || undefined,
      jamSelesai: formData.jamSelesai || undefined,
      durasiMenit: formData.durasiMenit || 480,
      kategori: (formData.kategori || '').trim() || 'Umum',
      uraianAktivitas: (formData.uraianAktivitas || '').trim(),
      pelajaranDiperoleh: (formData.pelajaranDiperoleh || '').trim(),
      kendalaDihadapi: (formData.kendalaDihadapi || '').trim(),
      fotoDokumentasi: formData.fotoDokumentasi || [],
      linkEviden: (formData.linkEviden || '').trim(),
      statusKegiatan: formData.statusKegiatan || 'selesai',
      isSyncedToSheet: formData.isSyncedToSheet || false,
      syncedAt: formData.syncedAt,
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(entryToSave);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#002B49] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center font-bold text-white shadow-xs">
              MH
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>{initialEntry ? 'Edit Catatan Logbook' : 'Catat Logbook Magang Baru'}</span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Penulis: <strong>{currentUser?.name}</strong> (@{currentUser?.username})
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
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs">
          {/* Tipe Logbook Switcher (Harian vs Mingguan) */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">Format Catatan:</span>
              <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-white">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tipeLogbook: 'harian' })}
                  className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
                    formData.tipeLogbook === 'harian'
                      ? 'bg-[#003B73] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Logbook Harian
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tipeLogbook: 'mingguan' })}
                  className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
                    formData.tipeLogbook === 'mingguan'
                      ? 'bg-[#003B73] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Logbook Mingguan
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPresets(!showPresets)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 shadow-2xs"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>{showPresets ? 'Tutup Template' : 'Gunakan Template'}</span>
            </button>
          </div>

          {/* Presets List */}
          {showPresets && (
            <div className="max-h-48 overflow-y-auto space-y-2 p-2.5 bg-slate-100 rounded-xl border border-slate-200">
              {PRESET_AKTIVITAS_MAGANG.map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => handleApplyPreset(preset)}
                  className="p-3 rounded-lg bg-white border border-slate-200 hover:border-sky-500 hover:bg-sky-50/40 cursor-pointer transition-all space-y-1"
                >
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>{preset.judul}</span>
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {preset.kategori}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">
                    {preset.uraianTemplate}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Tanggal Inputs (Tanpa jam mulai & jam selesai) */}
          {formData.tipeLogbook === 'harian' ? (
            <div>
              <label className="block font-bold text-slate-800 mb-1">Tanggal Kegiatan *</label>
              <input
                type="date"
                value={formData.tanggal || ''}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:bg-white focus:ring-1 focus:ring-sky-600 focus:outline-hidden"
              />
              {errors.tanggal && <p className="text-[10px] text-rose-500 mt-1">{errors.tanggal}</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Tanggal Mulai Minggu Ini *</label>
                <input
                  type="date"
                  value={formData.tanggal || ''}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:bg-white focus:ring-1 focus:ring-sky-600 focus:outline-hidden"
                />
                {errors.tanggal && <p className="text-[10px] text-rose-500 mt-1">{errors.tanggal}</p>}
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Tanggal Akhir Minggu Ini *</label>
                <input
                  type="date"
                  value={formData.tanggalSelesai || ''}
                  onChange={(e) => setFormData({ ...formData, tanggalSelesai: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:bg-white focus:ring-1 focus:ring-sky-600 focus:outline-hidden"
                />
                {errors.tanggalSelesai && <p className="text-[10px] text-rose-500 mt-1">{errors.tanggalSelesai}</p>}
              </div>
            </div>
          )}

          {/* Kategori (Isian Teks Bebas) & Status Kegiatan Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Kategori Aktivitas</label>
              <input
                type="text"
                list="kategori-preset-list"
                value={formData.kategori || ''}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                placeholder="Tulis kategori (contoh: Pengembangan Web, Analisis Data, Desain UI, dll)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-sky-600 focus:outline-hidden"
              />
              <datalist id="kategori-preset-list">
                <option value="Teknis / Proyek Utama" />
                <option value="Riset & Analisis" />
                <option value="Pelatihan & Pembelajaran Mandiri" />
                <option value="Koordinasi & Rapat Tim" />
                <option value="Dokumentasi & Administrasi" />
                <option value="Operasional Lapangan" />
                <option value="Pengujian Sistem & QA" />
                <option value="Desain & Kreatif" />
                <option value="Lainnya" />
              </datalist>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Status Kegiatan</label>
              <select
                value={formData.statusKegiatan || 'selesai'}
                onChange={(e) => setFormData({ ...formData, statusKegiatan: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800 cursor-pointer focus:bg-white focus:ring-1 focus:ring-sky-600 focus:outline-hidden"
              >
                <option value="selesai">Selesai</option>
                <option value="proses">Dalam Proses</option>
              </select>
            </div>
          </div>

          {/* Section 1: Uraian Aktivitas */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900">
                1. Uraian Aktivitas {formData.tipeLogbook === 'mingguan' ? 'Mingguan' : 'Harian'} *
              </label>
              {onOpenAIChatForAssist && (
                <button
                  type="button"
                  onClick={() => onOpenAIChatForAssist('uraian', formData.uraianAktivitas || '')}
                  className="inline-flex items-center gap-1 font-semibold text-purple-600 hover:text-purple-800"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sempurnakan dengan AI</span>
                </button>
              )}
            </div>
            <textarea
              rows={3}
              value={formData.uraianAktivitas || ''}
              onChange={(e) => setFormData({ ...formData, uraianAktivitas: e.target.value })}
              placeholder="Jelaskan secara detail pekerjaan atau tugas yang Anda selesaikan..."
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl leading-relaxed focus:bg-white focus:ring-2 focus:ring-sky-600"
            />
            {errors.uraianAktivitas && <p className="text-[10px] text-rose-600 font-semibold">{errors.uraianAktivitas}</p>}
          </div>

          {/* Section 2: Pelajaran yang Diperoleh */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900">
                2. Pelajaran yang Diperoleh (Pengetahuan / Keterampilan Baru)
              </label>
              {onOpenAIChatForAssist && (
                <button
                  type="button"
                  onClick={() => onOpenAIChatForAssist('pelajaran', formData.pelajaranDiperoleh || '')}
                  className="inline-flex items-center gap-1 font-semibold text-purple-600 hover:text-purple-800"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Bantu Refleksi</span>
                </button>
              )}
            </div>
            <textarea
              rows={2}
              value={formData.pelajaranDiperoleh || ''}
              onChange={(e) => setFormData({ ...formData, pelajaranDiperoleh: e.target.value })}
              placeholder="Catat wawasan, konsep baru, atau keterampilan yang Anda dapatkan..."
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl leading-relaxed focus:bg-white focus:ring-2 focus:ring-sky-600"
            />
          </div>

          {/* Section 3: Kendala yang Dihadapi & Solusi */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900">
                3. Kendala yang Dihadapi & Cara Penyelesaiannya
              </label>
              {onOpenAIChatForAssist && (
                <button
                  type="button"
                  onClick={() => onOpenAIChatForAssist('kendala', formData.kendalaDihadapi || '')}
                  className="inline-flex items-center gap-1 font-semibold text-purple-600 hover:text-purple-800"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Bantu Formulasi</span>
                </button>
              )}
            </div>
            <textarea
              rows={2}
              value={formData.kendalaDihadapi || ''}
              onChange={(e) => setFormData({ ...formData, kendalaDihadapi: e.target.value })}
              placeholder="Catat hambatan atau solusi yang diterapkan (atau tuliskan jika berjalan lancar)..."
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl leading-relaxed focus:bg-white focus:ring-2 focus:ring-sky-600"
            />
          </div>

          {/* Section 4: Unggah Foto Dokumentasi / Lampiran (Google Drive Ready) */}
          <div className="p-4 bg-sky-50/50 border border-sky-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-bold text-sky-950 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-sky-700" />
                  <span>Foto Dokumentasi & Lampiran Kegiatan</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Foto akan terhubung dengan folder Google Drive yang telah diatur oleh Admin ({adminConfig.driveFolderId})
                </p>
              </div>

              {adminConfig.driveFolderUrl && (
                <a
                  href={adminConfig.driveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-800 hover:underline bg-white px-2 py-1 rounded-md border border-sky-300 shadow-2xs"
                >
                  <FolderOpen className="w-3 h-3 text-sky-600" />
                  <span>Buka Folder Drive</span>
                </a>
              )}
            </div>

            {/* Upload Area */}
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-sky-300 hover:bg-sky-100/60 text-sky-900 font-bold cursor-pointer transition-colors shadow-2xs">
                <Upload className="w-4 h-4 text-sky-700" />
                <span>Pilih Foto dari Perangkat</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              <span className="text-[11px] text-slate-500">
                {formData.fotoDokumentasi?.length || 0} foto terlampir
              </span>
            </div>

            {/* Photo Preview Grid */}
            {formData.fotoDokumentasi && formData.fotoDokumentasi.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                {formData.fotoDokumentasi.map(photo => (
                  <div key={photo.id} className="relative group rounded-xl overflow-hidden border border-slate-300 bg-white shadow-2xs">
                    <img
                      src={photo.dataUrl}
                      alt={photo.name}
                      className="w-full h-24 object-cover"
                    />
                    <div className="p-1.5 bg-white text-[10px] truncate text-slate-700 font-mono">
                      {photo.name}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow-md transition-colors"
                      title="Hapus foto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Link Eksternal Eviden (GitHub / Drive / Dokumen) */}
            <div className="pt-2">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Tautan Eviden Tambahan (Opsional)
              </label>
              <input
                type="url"
                value={formData.linkEviden || ''}
                onChange={(e) => setFormData({ ...formData, linkEviden: e.target.value })}
                placeholder="https://drive.google.com/... atau https://github.com/..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-200 font-bold"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl font-bold text-white bg-[#003B73] hover:bg-sky-800 active:bg-sky-950 transition-colors shadow-md shadow-sky-900/20"
          >
            {initialEntry ? 'Simpan Perubahan' : 'Simpan Catatan Logbook'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogbookModal;
