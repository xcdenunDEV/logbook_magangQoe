import React, { useState } from 'react';
import { 
  X, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  Check, 
  ShieldCheck,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { AuthUser, PesertaProfile } from '../types';
import { UserService } from '../services/userService';
import { IntegrationService } from '../services/integrationService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PesertaProfile;
  currentUser?: AuthUser | null;
  onSaveProfile: (profile: PesertaProfile) => void;
  onDataReset: () => void;
  onClearAllEntries?: () => void;
  onOpenAdminSettings?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  currentUser,
  onSaveProfile,
  onDataReset,
  onClearAllEntries,
  onOpenAdminSettings
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const [formData, setFormData] = useState<PesertaProfile>({ ...profile });
  const [activeTab, setActiveTab] = useState<'peserta' | 'perusahaan' | 'backup'>('peserta');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  const handleExportJson = () => {
    const jsonStr = UserService.exportToJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_MagangHub_Kemnaker_${profile.nama.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = UserService.importFromJson(content);
      if (success) {
        setFormData(UserService.getProfile());
        onDataReset();
        alert('Data logbook & profil MagangHub berhasil dipulihkan!');
      } else {
        setImportError('Format berkas JSON tidak valid.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#002B49] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#003B73] flex items-center justify-center text-white font-bold text-xs">
              MH
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold">Pengaturan Profil & Tempat Magang</h2>
                {isAdmin && (
                  <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.2 rounded font-mono">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300">
                Program Pemagangan Nasional Kemnaker RI • Pengguna: @{profile.username}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Shortcut Banner */}
        {isAdmin && onOpenAdminSettings && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-medium">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Pengaturan Google Sheet & Akun Pengguna ada di menu khusus admin.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAdminSettings();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shrink-0"
            >
              <span>Pengaturan Khusus Admin</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('peserta')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'peserta'
                ? 'border-sky-700 text-sky-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Profil Peserta Magang
          </button>
          <button
            onClick={() => setActiveTab('perusahaan')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'perusahaan'
                ? 'border-sky-700 text-sky-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Mitra & Tempat Magang
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'backup'
                ? 'border-sky-700 text-sky-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Cadangan & Reset
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
          {/* Tab 1: Peserta */}
          {activeTab === 'peserta' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Nama Lengkap Peserta Magang *
                  </label>
                  <input
                    type="text"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500 focus:bg-white focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    ID Peserta MagangHub
                  </label>
                  <input
                    type="text"
                    value={formData.idPeserta}
                    onChange={(e) => setFormData({ ...formData, idPeserta: e.target.value })}
                    placeholder="MH-2026-XXXX"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Email Peserta
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    value={formData.telepon || ''}
                    onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Universitas / Institusi Asal
                  </label>
                  <input
                    type="text"
                    value={formData.institusiAsal || ''}
                    onChange={(e) => setFormData({ ...formData, institusiAsal: e.target.value })}
                    placeholder="Universitas Hasanuddin"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Program Studi / Jurusan
                  </label>
                  <input
                    type="text"
                    value={formData.jurusan || ''}
                    onChange={(e) => setFormData({ ...formData, jurusan: e.target.value })}
                    placeholder="Sistem Informasi / Teknik Informatika"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Perusahaan */}
          {activeTab === 'perusahaan' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Nama Perusahaan / Mitra Magang *
                  </label>
                  <input
                    type="text"
                    value={formData.perusahaan}
                    onChange={(e) => setFormData({ ...formData, perusahaan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Divisi / Unit Kerja
                  </label>
                  <input
                    type="text"
                    value={formData.divisi}
                    onChange={(e) => setFormData({ ...formData, divisi: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Posisi / Judul Magang
                  </label>
                  <input
                    type="text"
                    value={formData.posisiMagang || ''}
                    onChange={(e) => setFormData({ ...formData, posisiMagang: e.target.value })}
                    placeholder="Software Engineering Intern"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Kota / Wilayah Penempatan
                  </label>
                  <input
                    type="text"
                    value={formData.kotaPenempatan || ''}
                    onChange={(e) => setFormData({ ...formData, kotaPenempatan: e.target.value })}
                    placeholder="Makassar / Remote"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Periode Mulai Magang
                  </label>
                  <input
                    type="date"
                    value={formData.periodeMulai}
                    onChange={(e) => setFormData({ ...formData, periodeMulai: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Periode Selesai Magang
                  </label>
                  <input
                    type="date"
                    value={formData.periodeSelesai}
                    onChange={(e) => setFormData({ ...formData, periodeSelesai: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Backup & Reset */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-sky-700" />
                  <span>Cadangkan Data (JSON)</span>
                </h4>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Unduh salinan berkas data logbook dan pengaturan profil peserta ke komputer Anda.
                </p>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 font-semibold text-slate-800 rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Berkas Cadangan</span>
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-purple-700" />
                  <span>Pulihkan Data dari JSON</span>
                </h4>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Unggah berkas cadangan JSON yang sebelumnya diunduh.
                </p>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 font-semibold text-purple-900 rounded-lg transition-colors cursor-pointer border border-purple-200">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pilih Berkas JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJson}
                    className="hidden"
                  />
                </label>
                {importError && (
                  <p className="text-rose-600 text-[11px] font-medium">{importError}</p>
                )}
              </div>

              <div className="p-4 rounded-xl border border-rose-300 bg-rose-50/70 space-y-2">
                <h4 className="font-bold text-rose-900 flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Kosongkan Seluruh Isi Logbook (Persiapan Deploy)</span>
                </h4>
                <p className="text-rose-700 text-[11px] leading-relaxed">
                  Menghapus seluruh rekaman logbook harian & mingguan agar tabel bersih untuk deploy produksi baru. <strong>Akun pengguna, password, dan profil TIDAK AKAN DIHAPUS.</strong>
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    const confirmed = confirm('Konfirmasi Persiapan Deploy:\n\nApakah Anda yakin ingin mengosongkan SELURUH catatan logbook? Semua akun pengguna akan tetap aman.');
                    if (confirmed) {
                      const alsoClearSheet = confirm('Apakah Anda juga ingin mengosongkan baris data pada Google Sheet yang terhubung? (Header kolom standar akan tetap dipertahankan).');
                      if (onClearAllEntries) {
                        onClearAllEntries();
                      } else {
                        UserService.clearAllEntries();
                        onDataReset();
                      }
                      if (alsoClearSheet) {
                        await IntegrationService.clearGoogleSheetData().catch(() => {});
                      }
                      onClose();
                    }
                  }}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 font-bold text-white rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kosongkan Logbook Sekarang</span>
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-slate-500" />
                  <span>Muat Ulang Contoh Data Awal MagangHub</span>
                </h4>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Mengembalikan 3 contoh entri logbook awal program MagangHub Kemnaker RI untuk keperluan pengujian fitur.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Apakah Anda ingin memuat ulang 3 contoh data logbook awal?')) {
                      UserService.resetToInitialSampleEntries();
                      setFormData(UserService.getProfile());
                      onDataReset();
                      alert('Data contoh logbook berhasil dimuat kembali.');
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 font-semibold text-slate-700 rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Muat Ulang Contoh Demo</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              * Kolom bertanda bintang wajib diisi
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl transition-colors"
              >
                Tutup
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#003B73] hover:bg-sky-800 text-white font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Tersimpan!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Pengaturan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
