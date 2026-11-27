import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  Check, 
  ShieldCheck,
  ChevronRight,
  Trash2,
  Tags,
  Plus,
  Edit3
} from 'lucide-react';
import { AuthUser, PesertaProfile } from '../types';
import { UserService } from '../services/userService';
import { IntegrationService } from '../services/integrationService';
import DateInputDDMMYYYY from './DateInputDDMMYYYY';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PesertaProfile;
  currentUser?: AuthUser | null;
  categories?: string[];
  initialTab?: 'perusahaan' | 'peserta' | 'kategori' | 'backup';
  onSaveProfile: (profile: PesertaProfile) => void;
  onCategoriesUpdated?: (categories: string[]) => void;
  onDataReset: () => void;
  onClearAllEntries?: () => void;
  onOpenAdminSettings?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  currentUser,
  categories,
  initialTab = 'perusahaan',
  onSaveProfile,
  onCategoriesUpdated,
  onDataReset,
  onClearAllEntries,
  onOpenAdminSettings
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const [formData, setFormData] = useState<PesertaProfile>({ ...profile });
  const [activeTab, setActiveTab] = useState<'peserta' | 'perusahaan' | 'kategori' | 'backup'>(initialTab);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Dynamic Categories State
  const [categoryList, setCategoryList] = useState<string[]>(() =>
    categories && categories.length > 0 ? categories : UserService.getCategories()
  );
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');
  const [categoryMessage, setCategoryMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({ ...profile });
      setActiveTab(initialTab);
      setCategoryList(categories && categories.length > 0 ? categories : UserService.getCategories());
      setNewCategoryInput('');
      setEditingCategoryIndex(null);
      setEditingCategoryValue('');
      setCategoryMessage(null);
    }
  }, [isOpen, profile, categories, initialTab]);

  if (!isOpen) return null;

  const persistCategories = (next: string[], feedbackMsg?: string) => {
    const saved = UserService.saveCategories(next);
    setCategoryList(saved);
    if (onCategoriesUpdated) {
      onCategoriesUpdated(saved);
    }
    if (feedbackMsg) {
      setCategoryMessage(feedbackMsg);
      setTimeout(() => setCategoryMessage(null), 2500);
    }
  };

  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if (categoryList.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      setCategoryMessage('Kategori dengan nama tersebut sudah ada.');
      return;
    }
    persistCategories([...categoryList, trimmed], `Kategori "${trimmed}" ditambahkan.`);
    setNewCategoryInput('');
  };

  const handleSaveEditedCategory = (idx: number) => {
    const trimmed = editingCategoryValue.trim();
    if (!trimmed) return;
    const oldName = categoryList[idx];
    const next = categoryList.map((c, i) => (i === idx ? trimmed : c));
    // Also update existing logbook entries that used the renamed category
    if (oldName && oldName !== trimmed) {
      const currentEntries = UserService.getEntries();
      const hasMatches = currentEntries.some(e => e.kategori === oldName);
      if (hasMatches) {
        const updatedEntries = currentEntries.map(e =>
          e.kategori === oldName ? { ...e, kategori: trimmed, isSyncedToSheet: false } : e
        );
        UserService.saveEntries(updatedEntries);
        onDataReset();
      }
    }
    setEditingCategoryIndex(null);
    setEditingCategoryValue('');
    persistCategories(next, `Kategori diperbarui menjadi "${trimmed}".`);
  };

  const handleDeleteCategory = (idx: number) => {
    if (categoryList.length <= 1) {
      setCategoryMessage('Minimal harus ada 1 kategori aktivitas.');
      return;
    }
    const target = categoryList[idx];
    const next = categoryList.filter((_, i) => i !== idx);
    persistCategories(next, `Kategori "${target}" dihapus.`);
  };

  const handleResetCategories = () => {
    const defaults = UserService.resetCategoriesToDefault();
    setCategoryList(defaults);
    if (onCategoriesUpdated) {
      onCategoriesUpdated(defaults);
    }
    setCategoryMessage('Daftar kategori dikembalikan ke setelan awal.');
    setTimeout(() => setCategoryMessage(null), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    persistCategories(categoryList);
    onSaveProfile({
      ...formData,
      lokasiMagang: formData.perusahaan
    });
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
    a.download = `Backup_MagangHub_Kemnaker_${(profile.nama || 'Peserta').replace(/\s+/g, '_')}.json`;
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
        setImportError(null);
      } else {
        setImportError('Format berkas JSON tidak valid.');
      }
    };
    reader.readAsText(file);
  };

  const inputClass =
    'w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-1 focus:ring-[var(--theme-accent)] focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden transition-colors';

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="text-white px-6 py-4 flex items-center justify-between"
          style={{ backgroundColor: 'var(--theme-header-bg)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              MH
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold">Pengaturan Profil & Lokasi Magang</h2>
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
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Shortcut Banner */}
        {isAdmin && onOpenAdminSettings && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 px-6 py-2.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-medium">
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
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
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 px-6 gap-2 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('perusahaan')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'perusahaan'
                ? 'border-[var(--theme-accent)] text-[var(--theme-accent)] font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Lokasi & Tempat Magang
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('peserta')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'peserta'
                ? 'border-[var(--theme-accent)] text-[var(--theme-accent)] font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Profil Peserta Magang
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kategori')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'kategori'
                ? 'border-[var(--theme-accent)] text-[var(--theme-accent)] font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Kategori Aktivitas ({categoryList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'backup'
                ? 'border-[var(--theme-accent)] text-[var(--theme-accent)] font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
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
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Nama Lengkap Peserta Magang
                </label>
                <input
                  type="text"
                  value={formData.nama || ''}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Isi nama lengkap peserta (opsional)"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Email Peserta
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama@email.com"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    value={formData.telepon || ''}
                    onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                    placeholder="08xx-xxxx-xxxx"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Universitas / Institusi Asal
                  </label>
                  <input
                    type="text"
                    value={formData.institusiAsal || ''}
                    onChange={(e) => setFormData({ ...formData, institusiAsal: e.target.value })}
                    placeholder="Nama universitas / institusi"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Program Studi / Jurusan
                  </label>
                  <input
                    type="text"
                    value={formData.jurusan || ''}
                    onChange={(e) => setFormData({ ...formData, jurusan: e.target.value })}
                    placeholder="Nama jurusan / prodi"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Lokasi & Tempat Magang */}
          {activeTab === 'perusahaan' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Lokasi / Instansi Tempat Magang *
                  </label>
                  <input
                    type="text"
                    value={formData.perusahaan || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        perusahaan: e.target.value,
                        lokasiMagang: e.target.value
                      })
                    }
                    placeholder="Badan Pusat Statistik Kota Parepare"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Divisi / Unit Kerja
                  </label>
                  <input
                    type="text"
                    value={formData.divisi || ''}
                    onChange={(e) => setFormData({ ...formData, divisi: e.target.value })}
                    placeholder="Opsional"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Posisi / Judul Magang
                  </label>
                  <input
                    type="text"
                    value={formData.posisiMagang || ''}
                    onChange={(e) => setFormData({ ...formData, posisiMagang: e.target.value })}
                    placeholder="Opsional"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Kota / Wilayah Penempatan
                  </label>
                  <input
                    type="text"
                    value={formData.kotaPenempatan || ''}
                    onChange={(e) => setFormData({ ...formData, kotaPenempatan: e.target.value })}
                    placeholder="Opsional"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Periode Mulai Magang (DD/MM/YYYY)
                  </label>
                  <DateInputDDMMYYYY
                    value={formData.periodeMulai || ''}
                    onChange={(iso) => setFormData({ ...formData, periodeMulai: iso })}
                    ariaLabel="Periode Mulai Magang"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Periode Selesai Magang (DD/MM/YYYY)
                  </label>
                  <DateInputDDMMYYYY
                    value={formData.periodeSelesai || ''}
                    onChange={(iso) => setFormData({ ...formData, periodeSelesai: iso })}
                    ariaLabel="Periode Selesai Magang"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab: Kategori Aktivitas Dinamis */}
          {activeTab === 'kategori' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100">
                    <Tags className="w-4 h-4" style={{ color: 'var(--theme-accent)' }} />
                    <span>Kelola Kategori Aktivitas Logbook</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetCategories}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Bawaan</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tambahkan, ubah nama, atau hapus kategori di bawah ini. Perubahan langsung tersedia pada formulir catat logbook dan filter tabel.
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCategory();
                      }
                    }}
                    placeholder="Nama kategori baru (misal: Pengolahan Survei SUSENAS)"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={!newCategoryInput.trim()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-white font-bold shrink-0 disabled:opacity-50 transition-opacity cursor-pointer"
                    style={{ backgroundColor: 'var(--theme-primary)' }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                </div>

                {categoryMessage && (
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                    {categoryMessage}
                  </div>
                )}
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {categoryList.map((cat, idx) => {
                  const isEditingThis = editingCategoryIndex === idx;
                  return (
                    <div
                      key={`${cat}-${idx}`}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40"
                    >
                      {isEditingThis ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={editingCategoryValue}
                            onChange={(e) => setEditingCategoryValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveEditedCategory(idx);
                              } else if (e.key === 'Escape') {
                                setEditingCategoryIndex(null);
                              }
                            }}
                            autoFocus
                            className="flex-1 px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-[var(--theme-accent)] rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditedCategory(idx)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                          >
                            Simpan
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCategoryIndex(null)}
                            className="px-2 py-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-mono text-slate-400 w-5">{idx + 1}.</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">{cat}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCategoryIndex(idx);
                                setEditingCategoryValue(cat);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Ubah nama kategori"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(idx)}
                              disabled={categoryList.length <= 1}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 cursor-pointer"
                              title="Hapus kategori"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: Backup & Reset */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 space-y-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Cadangkan Data (JSON)</span>
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  Unduh salinan berkas data logbook dan pengaturan profil peserta ke komputer Anda.
                </p>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-slate-800 dark:text-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Berkas Cadangan</span>
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 space-y-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Pulihkan Data dari JSON</span>
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  Unggah berkas cadangan JSON yang sebelumnya diunduh.
                </p>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/50 font-semibold text-purple-900 dark:text-purple-200 rounded-lg transition-colors cursor-pointer border border-purple-200 dark:border-purple-800">
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
                  <p className="text-rose-600 dark:text-rose-400 text-[11px] font-medium">{importError}</p>
                )}
              </div>

              <div className="p-4 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30 space-y-2">
                <h4 className="font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Kosongkan Seluruh Isi Logbook (Persiapan Deploy)</span>
                </h4>
                <p className="text-rose-700 dark:text-rose-300/90 text-[11px] leading-relaxed">
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

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-slate-500" />
                  <span>Muat Ulang Contoh Data Awal MagangHub</span>
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  Mengembalikan contoh entri logbook awal program MagangHub Kemnaker RI untuk keperluan pengujian fitur.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Apakah Anda ingin memuat ulang contoh data logbook awal?')) {
                      UserService.resetToInitialSampleEntries();
                      setFormData(UserService.getProfile());
                      onDataReset();
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold text-slate-700 dark:text-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Muat Ulang Contoh Demo</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              * Kolom bertanda bintang wajib diisi
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold rounded-xl transition-colors"
              >
                Tutup
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-white font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs hover:opacity-95"
                style={{ backgroundColor: 'var(--theme-primary)' }}
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
