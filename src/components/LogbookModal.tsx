import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Trash2,
  FolderOpen,
  Lightbulb,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Wand2,
  Briefcase,
  Layers
} from 'lucide-react';
import { AuthUser, FotoLampiran, LogbookEntry, PesertaProfile, PresetAktivitasMagang } from '../types';
import { PRESET_AKTIVITAS_MAGANG } from '../data/initialData';
import {
  calculateDurationMinutes,
  formatDateDDMMYYYY,
  formatDuration,
  getDayName,
  getDefaultWorkHours,
  getPeriodForDate,
  getTodayString,
  getWeekRangeForDate,
  isStandardWorkday
} from '../utils/dateUtils';
import { getHolidayInfo, isWeekend } from '../data/holidays';
import { IntegrationService } from '../services/integrationService';
import { UserService } from '../services/userService';
import DateInputDDMMYYYY from './DateInputDDMMYYYY';

interface LogbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: LogbookEntry) => void;
  initialEntry?: LogbookEntry | null;
  defaultDate?: string;
  currentUser: AuthUser | null;
  profile: PesertaProfile;
  categories?: string[];
  entries?: LogbookEntry[];
  onOpenCategorySettings?: () => void;
}

type RefineFieldTarget = 'uraian' | 'pelajaran' | 'kendala';

export const LogbookModal: React.FC<LogbookModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEntry,
  defaultDate,
  currentUser,
  profile,
  categories,
  entries = [],
  onOpenCategorySettings
}) => {
  const adminConfig = IntegrationService.getConfig();
  const activeCategories = useMemo(() => {
    const base = categories && categories.length > 0 ? categories : UserService.getCategories();
    if (initialEntry?.kategori && !base.includes(initialEntry.kategori)) {
      return [...base, initialEntry.kategori];
    }
    return base;
  }, [categories, initialEntry, isOpen]);

  const initialDateFallback = defaultDate || getTodayString();
  const initialWorkHours = getDefaultWorkHours(initialDateFallback);

  const [formData, setFormData] = useState<Partial<LogbookEntry>>({
    tipeLogbook: 'harian',
    tanggal: initialDateFallback,
    tanggalSelesai: '',
    jamMulai: initialWorkHours.jamMulai,
    jamSelesai: initialWorkHours.jamSelesai,
    durasiMenit: initialWorkHours.durasiMenit,
    kategori: activeCategories[0] || 'Teknis / Proyek Utama',
    uraianAktivitas: '',
    pelajaranDiperoleh: '',
    kendalaDihadapi: '',
    fotoDokumentasi: [],
    linkEviden: '',
    statusKegiatan: 'selesai',
    isDiluarHariKerja: false,
    alasanLuarHariKerja: '',
    isSyncedToSheet: false
  });

  const [showPresets, setShowPresets] = useState(false);
  const [customTemplateTopic, setCustomTemplateTopic] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Direct inline AI states
  const [aiLoadingTarget, setAiLoadingTarget] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiRetryAction, setAiRetryAction] = useState<(() => void) | null>(null);
  const [aiSuccessField, setAiSuccessField] = useState<string | null>(null);
  const [previousSnapshot, setPreviousSnapshot] = useState<{
    kategori?: string;
    uraianAktivitas?: string;
    pelajaranDiperoleh?: string;
    kendalaDihadapi?: string;
  } | null>(null);

  const matchActiveCategory = (candidate?: string, fallback?: string): string => {
    const defaultCat = fallback || activeCategories[0] || 'Teknis / Proyek Utama';
    if (!candidate) return defaultCat;
    const trimmed = candidate.trim();
    const exact = activeCategories.find(c => c.toLowerCase() === trimmed.toLowerCase());
    if (exact) return exact;
    const partial = activeCategories.find(
      c => c.toLowerCase().includes(trimmed.toLowerCase()) || trimmed.toLowerCase().includes(c.toLowerCase())
    );
    return partial || defaultCat;
  };

  const postAIJson = async (url: string, payload: Record<string, unknown>, timeoutMs = 35000) => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      const rawText = await response.text();
      let data: any = null;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        data = null;
      }
      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error ||
            (response.status === 504 || response.status === 502
              ? 'Server AI sedang sibuk. Silakan klik Coba Lagi.'
              : `Gagal memproses permintaan AI (kode ${response.status}).`)
        );
      }
      return data;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw new Error('Permintaan AI terlalu lama merespons. Silakan klik Coba Lagi.');
      }
      throw err;
    } finally {
      window.clearTimeout(timer);
    }
  };

  useEffect(() => {
    const initialDate = initialEntry?.tanggal || defaultDate || getTodayString();
    const isInitialNonWorkday = !isStandardWorkday(initialDate);

    const defaultWorkHours = getDefaultWorkHours(initialDate);

    if (initialEntry) {
      const jamMulai = initialEntry.jamMulai || defaultWorkHours.jamMulai;
      const jamSelesai = initialEntry.jamSelesai || defaultWorkHours.jamSelesai;
      const computedDuration = calculateDurationMinutes(jamMulai, jamSelesai);
      setFormData({
        ...initialEntry,
        jamMulai,
        jamSelesai,
        durasiMenit: initialEntry.durasiMenit || computedDuration || defaultWorkHours.durasiMenit,
        isDiluarHariKerja:
          initialEntry.isDiluarHariKerja !== undefined
            ? initialEntry.isDiluarHariKerja
            : isInitialNonWorkday
      });
    } else {
      setFormData({
        username: currentUser?.username || 'ainunnn',
        namaPenulis: currentUser?.name || 'Muhammad Ainun Anwar',
        tipeLogbook: 'harian',
        tanggal: initialDate,
        tanggalSelesai: '',
        jamMulai: defaultWorkHours.jamMulai,
        jamSelesai: defaultWorkHours.jamSelesai,
        durasiMenit: defaultWorkHours.durasiMenit,
        kategori: activeCategories[0] || 'Teknis / Proyek Utama',
        uraianAktivitas: '',
        pelajaranDiperoleh: '',
        kendalaDihadapi: '',
        fotoDokumentasi: [],
        linkEviden: '',
        statusKegiatan: 'selesai',
        isDiluarHariKerja: isInitialNonWorkday,
        alasanLuarHariKerja: '',
        isSyncedToSheet: false
      });
    }
    setErrors({});
    setPhotoError(null);
    setAiError(null);
    setAiRetryAction(null);
    setAiSuccessField(null);
    setPreviousSnapshot(null);
    setShowPresets(false);
    setCustomTemplateTopic('');
  }, [initialEntry, defaultDate, currentUser, isOpen]);

  // Evaluate workday status (Senin–Jumat, non-holiday)
  const dateStatus = useMemo(() => {
    const dateStr = formData.tanggal || '';
    if (!dateStr) {
      return {
        isWorkday: true,
        isWeekendDay: false,
        holiday: undefined,
        dayName: '',
        period: null,
        workHours: getDefaultWorkHours(getTodayString())
      };
    }
    const weekend = isWeekend(dateStr);
    const holiday = getHolidayInfo(dateStr);
    const period = getPeriodForDate(dateStr);
    const workHours = getDefaultWorkHours(dateStr);
    return {
      isWorkday: !weekend && !holiday,
      isWeekendDay: weekend,
      holiday,
      dayName: getDayName(dateStr),
      period,
      workHours
    };
  }, [formData.tanggal]);

  // Daily logbook entries inside the selected weekly range (for Weekly auto-generation)
  const matchedDailyEntries = useMemo(() => {
    if (formData.tipeLogbook !== 'mingguan' || !formData.tanggal || !formData.tanggalSelesai) {
      return [];
    }
    return entries
      .filter(
        e =>
          e.tipeLogbook === 'harian' &&
          e.tanggal >= formData.tanggal! &&
          e.tanggal <= formData.tanggalSelesai!
      )
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }, [entries, formData.tipeLogbook, formData.tanggal, formData.tanggalSelesai]);

  const matchedDailyTotalMinutes = useMemo(() => {
    return matchedDailyEntries.reduce((sum, e) => sum + (e.durasiMenit || 0), 0);
  }, [matchedDailyEntries]);

  // Set of dates that already have a daily logbook entry (highlighted on the Period Calendar picker)
  const loggedDailyDateSet = useMemo(() => {
    const set = new Set<string>();
    entries.forEach(e => {
      if (e.tipeLogbook === 'harian' && e.tanggal) {
        set.add(e.tanggal);
      }
    });
    return set;
  }, [entries]);

  const markSuccessFlash = (target: string) => {
    setAiSuccessField(target);
    setTimeout(() => {
      setAiSuccessField(prev => (prev === target ? null : prev));
    }, 3500);
  };

  const saveUndoSnapshot = () => {
    setPreviousSnapshot({
      kategori: formData.kategori,
      uraianAktivitas: formData.uraianAktivitas,
      pelajaranDiperoleh: formData.pelajaranDiperoleh,
      kendalaDihadapi: formData.kendalaDihadapi
    });
  };

  const handleUndoAI = () => {
    if (!previousSnapshot) return;
    setFormData(prev => ({
      ...prev,
      ...previousSnapshot
    }));
    setPreviousSnapshot(null);
    setAiError(null);
  };

  // Direct per-field AI refinement via /api/gemini/refine-field
  const handleRefineWithAI = async (target: RefineFieldTarget) => {
    setAiError(null);
    setAiRetryAction(null);
    setAiLoadingTarget(target);

    try {
      const data = await postAIJson('/api/gemini/refine-field', {
        field: target,
        draft: {
          kategori: formData.kategori,
          tipeLogbook: formData.tipeLogbook,
          tanggal: formatDateDDMMYYYY(formData.tanggal),
          tanggalSelesai:
            formData.tipeLogbook === 'mingguan' ? formatDateDDMMYYYY(formData.tanggalSelesai) : undefined,
          isDiluarHariKerja: formData.isDiluarHariKerja || !dateStatus.isWorkday,
          uraianAktivitas: formData.uraianAktivitas,
          pelajaranDiperoleh: formData.pelajaranDiperoleh,
          kendalaDihadapi: formData.kendalaDihadapi
        },
        dailyEntries:
          formData.tipeLogbook === 'mingguan'
            ? matchedDailyEntries.map(e => ({
                tanggal: formatDateDDMMYYYY(e.tanggal),
                kategori: e.kategori,
                uraianAktivitas: e.uraianAktivitas,
                pelajaranDiperoleh: e.pelajaranDiperoleh,
                kendalaDihadapi: e.kendalaDihadapi
              }))
            : undefined,
        context: {
          nama: profile.nama || currentUser?.name || '',
          perusahaan: profile.perusahaan || 'Badan Pusat Statistik Kota Parepare',
          lokasiMagang: profile.lokasiMagang || profile.perusahaan || 'Badan Pusat Statistik Kota Parepare',
          divisi: profile.divisi || '',
          posisiMagang: profile.posisiMagang || '',
          categories: activeCategories
        }
      });

      if (!data.text) {
        throw new Error('AI tidak mengembalikan hasil teks. Silakan coba lagi.');
      }

      saveUndoSnapshot();

      if (target === 'uraian') {
        setFormData(prev => ({ ...prev, uraianAktivitas: data.text }));
        setErrors(prev => ({ ...prev, uraianAktivitas: '' }));
        markSuccessFlash('uraian');
      } else if (target === 'pelajaran') {
        setFormData(prev => ({ ...prev, pelajaranDiperoleh: data.text }));
        markSuccessFlash('pelajaran');
      } else if (target === 'kendala') {
        setFormData(prev => ({ ...prev, kendalaDihadapi: data.text }));
        markSuccessFlash('kendala');
      }
    } catch (err: any) {
      setAiError(err?.message || 'Gagal menyambung ke layanan AI.');
      setAiRetryAction(() => () => handleRefineWithAI(target));
    } finally {
      setAiLoadingTarget(null);
    }
  };

  // Apply static preset directly
  const handleApplyPreset = (preset: PresetAktivitasMagang) => {
    saveUndoSnapshot();
    setFormData(prev => ({
      ...prev,
      kategori: preset.kategori,
      uraianAktivitas: preset.uraianTemplate,
      pelajaranDiperoleh: preset.pelajaranTemplate,
      kendalaDihadapi: preset.kendalaTemplate,
      durasiMenit: preset.durasiMenitDefault
    }));
    setErrors(prev => ({ ...prev, uraianAktivitas: '' }));
    setShowPresets(false);
  };

  // Generate fresh AI template (from preset card OR custom topic)
  const handleGenerateTemplateWithAI = async (opts: {
    preset?: PresetAktivitasMagang;
    presetIndex?: number;
    customTopic?: string;
  }) => {
    const topic = (opts.customTopic || opts.preset?.judul || '').trim();
    if (!topic) {
      setAiError('Masukkan topik singkat terlebih dahulu untuk membuat template dengan AI.');
      return;
    }

    const loadKey = opts.presetIndex !== undefined ? `preset-${opts.presetIndex}` : 'custom-template';
    setAiError(null);
    setAiRetryAction(null);
    setAiLoadingTarget(loadKey);

    try {
      const data = await postAIJson('/api/gemini/template', {
        templateTitle: opts.preset?.judul,
        templateKategori: opts.preset?.kategori,
        customTopic: opts.customTopic,
        tipeLogbook: formData.tipeLogbook,
        tanggal: formatDateDDMMYYYY(formData.tanggal),
        isDiluarHariKerja: formData.isDiluarHariKerja || !dateStatus.isWorkday,
        context: {
          perusahaan: profile.perusahaan || 'Badan Pusat Statistik Kota Parepare',
          lokasiMagang: profile.lokasiMagang || profile.perusahaan || 'Badan Pusat Statistik Kota Parepare',
          divisi: profile.divisi || '',
          posisiMagang: profile.posisiMagang || '',
          categories: activeCategories
        }
      });

      if (!data.template) {
        throw new Error('Gagal membuat template dengan AI.');
      }

      saveUndoSnapshot();
      setFormData(prev => ({
        ...prev,
        kategori: matchActiveCategory(data.template.kategori, prev.kategori),
        uraianAktivitas: data.template.uraianAktivitas || prev.uraianAktivitas,
        pelajaranDiperoleh: data.template.pelajaranDiperoleh || prev.pelajaranDiperoleh,
        kendalaDihadapi: data.template.kendalaDihadapi || prev.kendalaDihadapi,
        durasiMenit: data.template.durasiMenit || prev.durasiMenit
      }));
      setErrors(prev => ({ ...prev, uraianAktivitas: '' }));
      setShowPresets(false);
      setCustomTemplateTopic('');
      markSuccessFlash('all');
    } catch (err: any) {
      setAiError(err?.message || 'Gagal menghasilkan template AI.');
      setAiRetryAction(() => () => handleGenerateTemplateWithAI(opts));
    } finally {
      setAiLoadingTarget(null);
    }
  };

  // Switch between Harian and Mingguan cleanly
  const handleSwitchTipeLogbook = (nextTipe: 'harian' | 'mingguan') => {
    if (nextTipe === 'mingguan') {
      const range = getWeekRangeForDate(formData.tanggal || getTodayString());
      setFormData(prev => ({
        ...prev,
        tipeLogbook: 'mingguan',
        tanggal: prev.tanggalSelesai ? prev.tanggal : range.startDate,
        tanggalSelesai: prev.tanggalSelesai || range.endDate,
        isDiluarHariKerja: false,
        alasanLuarHariKerja: ''
      }));
      setShowPresets(false);
    } else {
      setFormData(prev => ({
        ...prev,
        tipeLogbook: 'harian'
      }));
    }
    setErrors({});
    setAiError(null);
  };

  const applyQuickWeekRange = (offsetWeeks: number) => {
    const base = new Date();
    base.setDate(base.getDate() + offsetWeeks * 7);
    const iso = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`;
    const range = getWeekRangeForDate(iso);
    setFormData(prev => ({
      ...prev,
      tanggal: range.startDate,
      tanggalSelesai: range.endDate
    }));
    setErrors(prev => ({ ...prev, tanggal: '', tanggalSelesai: '' }));
  };

  // Local deterministic compilation of daily entries -> weekly logbook
  const handleAutoCompileWeeklyLocal = () => {
    if (matchedDailyEntries.length === 0) {
      setAiError('Belum ada catatan logbook harian pada rentang tanggal yang dipilih.');
      return;
    }
    setAiError(null);
    saveUndoSnapshot();

    const categoryCounts: Record<string, number> = {};
    matchedDailyEntries.forEach(e => {
      if (e.kategori) {
        categoryCounts[e.kategori] = (categoryCounts[e.kategori] || 0) + 1;
      }
    });
    const dominantCategory =
      Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      formData.kategori ||
      activeCategories[0] ||
      'Teknis / Proyek Utama';

    const compiledUraian = matchedDailyEntries
      .map(e => `[${formatDateDDMMYYYY(e.tanggal)} - ${e.kategori}] ${e.uraianAktivitas.trim()}`)
      .join('\n');

    const uniquePelajaran = Array.from(
      new Set(
        matchedDailyEntries
          .map(e => (e.pelajaranDiperoleh || '').trim())
          .filter(Boolean)
      )
    );
    const compiledPelajaran = uniquePelajaran.join(' ');

    const uniqueKendala = Array.from(
      new Set(
        matchedDailyEntries
          .map(e => (e.kendalaDihadapi || '').trim())
          .filter(Boolean)
      )
    );
    const compiledKendala = uniqueKendala.join(' ');

    setFormData(prev => ({
      ...prev,
      kategori: dominantCategory,
      durasiMenit: matchedDailyTotalMinutes > 0 ? matchedDailyTotalMinutes : prev.durasiMenit,
      uraianAktivitas: compiledUraian,
      pelajaranDiperoleh: compiledPelajaran || prev.pelajaranDiperoleh,
      kendalaDihadapi: compiledKendala || prev.kendalaDihadapi
    }));
    setErrors(prev => ({ ...prev, uraianAktivitas: '' }));
    markSuccessFlash('all');
  };

  // AI synthesis of daily entries -> cohesive weekly summary
  const handleAutoGenerateWeeklyWithAI = async () => {
    if (matchedDailyEntries.length === 0) {
      setAiError('Belum ada catatan logbook harian pada rentang tanggal yang dipilih.');
      return;
    }

    setAiError(null);
    setAiRetryAction(null);
    setAiLoadingTarget('weekly-ai');

    try {
      const data = await postAIJson('/api/gemini/weekly-summary', {
        startDate: formatDateDDMMYYYY(formData.tanggal),
        endDate: formatDateDDMMYYYY(formData.tanggalSelesai),
        dailyEntries: matchedDailyEntries.map(e => ({
          tanggal: formatDateDDMMYYYY(e.tanggal),
          kategori: e.kategori,
          durasiMenit: e.durasiMenit,
          uraianAktivitas: e.uraianAktivitas,
          pelajaranDiperoleh: e.pelajaranDiperoleh,
          kendalaDihadapi: e.kendalaDihadapi
        })),
        context: {
          perusahaan: profile.perusahaan || 'Badan Pusat Statistik Kota Parepare',
          lokasiMagang: profile.lokasiMagang || profile.perusahaan || 'Badan Pusat Statistik Kota Parepare',
          divisi: profile.divisi || '',
          posisiMagang: profile.posisiMagang || '',
          categories: activeCategories
        }
      });

      if (!data.summary) {
        throw new Error('Gagal menyusun rangkuman mingguan dengan AI.');
      }

      saveUndoSnapshot();
      setFormData(prev => ({
        ...prev,
        kategori: matchActiveCategory(data.summary.kategori, prev.kategori),
        durasiMenit: matchedDailyTotalMinutes > 0 ? matchedDailyTotalMinutes : prev.durasiMenit,
        uraianAktivitas: data.summary.uraianAktivitas || prev.uraianAktivitas,
        pelajaranDiperoleh: data.summary.pelajaranDiperoleh || prev.pelajaranDiperoleh,
        kendalaDihadapi: data.summary.kendalaDihadapi || prev.kendalaDihadapi
      }));
      setErrors(prev => ({ ...prev, uraianAktivitas: '' }));
      markSuccessFlash('all');
    } catch (err: any) {
      setAiError(err?.message || 'Gagal menyambung ke layanan AI.');
      setAiRetryAction(() => () => handleAutoGenerateWeeklyWithAI());
    } finally {
      setAiLoadingTarget(null);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setPhotoError(null);

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        setPhotoError('Mohon unggah berkas foto berformat JPG, PNG, atau WebP.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newPhoto: FotoLampiran = {
          id: `foto-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
    if (!formData.tanggal) errs.tanggal = 'Tanggal wajib diisi dengan format DD/MM/YYYY.';
    if (formData.tipeLogbook === 'mingguan') {
      if (!formData.tanggalSelesai) {
        errs.tanggalSelesai = 'Tanggal akhir periode mingguan wajib diisi (DD/MM/YYYY).';
      } else if (formData.tanggal && formData.tanggalSelesai < formData.tanggal) {
        errs.tanggalSelesai = 'Tanggal akhir harus sama dengan atau setelah tanggal mulai.';
      }
    }
    if (formData.tipeLogbook === 'harian' && formData.tanggal && !dateStatus.isWorkday && !formData.isDiluarHariKerja) {
      errs.tanggal = 'Hari kerja standar adalah Senin–Jumat. Aktifkan opsi "Kegiatan di luar hari kerja" jika ada kegiatan di tanggal ini.';
    }
    if (!formData.uraianAktivitas || formData.uraianAktivitas.trim().length < 5) {
      errs.uraianAktivitas = 'Uraian aktivitas wajib diisi.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const computedWeeklyMinutes =
      formData.tipeLogbook === 'mingguan' && matchedDailyTotalMinutes > 0
        ? matchedDailyTotalMinutes
        : formData.durasiMenit || 510;

    const entryToSave: LogbookEntry = {
      id: formData.id || `log-${Date.now()}`,
      username: formData.username || currentUser?.username || 'ainunnn',
      namaPenulis: formData.namaPenulis || currentUser?.name || 'Muhammad Ainun Anwar',
      tipeLogbook: formData.tipeLogbook || 'harian',
      tanggal: formData.tanggal!,
      tanggalSelesai: formData.tipeLogbook === 'mingguan' ? formData.tanggalSelesai : undefined,
      jamMulai: formData.tipeLogbook === 'mingguan' ? undefined : formData.jamMulai || undefined,
      jamSelesai: formData.tipeLogbook === 'mingguan' ? undefined : formData.jamSelesai || undefined,
      durasiMenit: computedWeeklyMinutes,
      kategori: (formData.kategori || '').trim() || activeCategories[0] || 'Umum',
      uraianAktivitas: (formData.uraianAktivitas || '').trim(),
      pelajaranDiperoleh: (formData.pelajaranDiperoleh || '').trim(),
      kendalaDihadapi: (formData.kendalaDihadapi || '').trim(),
      fotoDokumentasi: formData.fotoDokumentasi || [],
      linkEviden: (formData.linkEviden || '').trim(),
      statusKegiatan: formData.statusKegiatan || 'selesai',
      isDiluarHariKerja: formData.tipeLogbook === 'harian' ? Boolean(formData.isDiluarHariKerja) : false,
      alasanLuarHariKerja:
        formData.tipeLogbook === 'harian' && formData.isDiluarHariKerja
          ? (formData.alasanLuarHariKerja || '').trim()
          : undefined,
      isSyncedToSheet: formData.isSyncedToSheet || false,
      syncedAt: formData.syncedAt,
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(entryToSave);
    onClose();
  };

  if (!isOpen) return null;

  const isAnyAiLoading = aiLoadingTarget !== null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="text-white px-6 py-4 flex items-center justify-between"
          style={{ backgroundColor: 'var(--theme-header-bg)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-xs"
              style={{ backgroundColor: 'var(--theme-accent)' }}
            >
              MH
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>{initialEntry ? 'Edit Catatan Logbook' : 'Catat Logbook Magang Baru'}</span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Penulis: <strong>{currentUser?.name}</strong> (@{currentUser?.username}) · {profile.perusahaan}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs">
          {/* Tipe Logbook Switcher & Template AI Trigger (Harian only) */}
          <div className="bg-slate-50 dark:bg-slate-800/70 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-slate-200">Format Catatan:</span>
              <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-600 p-0.5 bg-white dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => handleSwitchTipeLogbook('harian')}
                  className={`px-3 py-1.5 rounded-md font-bold transition-colors cursor-pointer ${
                    formData.tipeLogbook === 'harian'
                      ? 'text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  style={formData.tipeLogbook === 'harian' ? { backgroundColor: 'var(--theme-primary)' } : undefined}
                >
                  Logbook Harian
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchTipeLogbook('mingguan')}
                  className={`px-3 py-1.5 rounded-md font-bold transition-colors cursor-pointer ${
                    formData.tipeLogbook === 'mingguan'
                      ? 'text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  style={formData.tipeLogbook === 'mingguan' ? { backgroundColor: 'var(--theme-primary)' } : undefined}
                >
                  Logbook Mingguan
                </button>
              </div>
            </div>

            {formData.tipeLogbook === 'harian' ? (
              <button
                type="button"
                onClick={() => setShowPresets(!showPresets)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors shadow-2xs cursor-pointer ${
                  showPresets
                    ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>{showPresets ? 'Tutup Template AI' : 'Template & Generator AI'}</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800 text-[11px] font-bold">
                <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Mode Rekap Mingguan Otomatis</span>
              </span>
            )}
          </div>

          {/* AI-Supported Presets & Custom AI Template Drawer (Harian only) */}
          {showPresets && formData.tipeLogbook === 'harian' && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in duration-150">
              {/* Custom AI Template Box */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/60 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-purple-900 dark:text-purple-300">
                  <Wand2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Buat Draf Template Otomatis dengan AI</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Ketik topik singkat kegiatan Anda, lalu AI akan langsung mengisi Kategori, Uraian, Pelajaran, dan Kendala ke formulir.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={customTemplateTopic}
                    onChange={(e) => setCustomTemplateTopic(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleGenerateTemplateWithAI({ customTopic: customTemplateTopic });
                      }
                    }}
                    placeholder="Contoh: Validasi data survei BPS, desain infografis inflasi, rapat evaluasi..."
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                    disabled={isAnyAiLoading}
                  />
                  <button
                    type="button"
                    disabled={isAnyAiLoading || !customTemplateTopic.trim()}
                    onClick={() => handleGenerateTemplateWithAI({ customTopic: customTemplateTopic })}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
                  >
                    {aiLoadingTarget === 'custom-template' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyusun...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate ke Form</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Preset Templates List with Direct Apply & AI Generate */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-0.5">
                  Template Cepat Siap Pakai / Kembangkan dengan AI
                </div>
                {PRESET_AKTIVITAS_MAGANG.map((preset, idx) => {
                  const isGeneratingThis = aiLoadingTarget === `preset-${idx}`;
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-[var(--theme-accent)] transition-all space-y-2"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{preset.judul}</div>
                          <span className="inline-block mt-0.5 text-[10px] font-semibold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 px-2 py-0.5 rounded">
                            {preset.kategori}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isAnyAiLoading}
                            onClick={() => handleApplyPreset(preset)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Pakai Langsung
                          </button>
                          <button
                            type="button"
                            disabled={isAnyAiLoading}
                            onClick={() => handleGenerateTemplateWithAI({ preset, presetIndex: idx })}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800 font-bold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                            title="Minta AI menyusun variasi baru sesuai lokasi magang Anda"
                          >
                            {isGeneratingThis ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Membuat...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                <span>Generate AI</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                        {preset.uraianTemplate}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tanggal (DD/MM/YYYY) & Panel Khusus Harian vs Mingguan */}
          <div className="space-y-3">
            {formData.tipeLogbook === 'harian' ? (
              <>
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--theme-accent)' }} />
                      <span>Tanggal Kegiatan (DD/MM/YYYY) *</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {dateStatus.period && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {dateStatus.period.label} ({dateStatus.period.shortRange})
                        </span>
                      )}
                      {dateStatus.isWorkday ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Hari Kerja ({dateStatus.dayName})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          <AlertTriangle className="w-3 h-3" />
                          <span>
                            Di Luar Hari Kerja ({dateStatus.holiday ? dateStatus.holiday.name : dateStatus.dayName})
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                  <DateInputDDMMYYYY
                    value={formData.tanggal || ''}
                    hasError={Boolean(errors.tanggal)}
                    ariaLabel="Tanggal Kegiatan (DD/MM/YYYY)"
                    loggedDates={loggedDailyDateSet}
                    onChange={(nextDate) => {
                      const nextHours = getDefaultWorkHours(nextDate);
                      const nextIsNonWorkday = nextDate ? !isStandardWorkday(nextDate) : false;
                      setFormData(prev => ({
                        ...prev,
                        tanggal: nextDate,
                        jamMulai: nextHours.jamMulai,
                        jamSelesai: nextHours.jamSelesai,
                        durasiMenit: nextHours.durasiMenit,
                        isDiluarHariKerja: nextIsNonWorkday
                      }));
                      setErrors(prev => ({ ...prev, tanggal: '' }));
                    }}
                  />
                  {errors.tanggal && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">{errors.tanggal}</p>
                  )}
                </div>

                {/* Workday Rule & Out-of-Workday Activity Option (Harian only) */}
                <div
                  className={`p-3 rounded-xl border transition-colors ${
                    !dateStatus.isWorkday
                      ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/70'
                      : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80'
                  }`}
                >
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.isDiluarHariKerja)}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          isDiluarHariKerja: e.target.checked
                        }));
                        if (e.target.checked) {
                          setErrors(prev => ({ ...prev, tanggal: '' }));
                        }
                      }}
                      className="mt-0.5 rounded border-slate-300 dark:border-slate-600 accent-amber-600"
                    />
                    <div className="space-y-0.5 flex-1">
                      <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Catat sebagai kegiatan di luar hari kerja (Senin–Jumat)</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        {!dateStatus.isWorkday
                          ? `Tanggal ini jatuh pada ${dateStatus.holiday ? `hari libur (${dateStatus.holiday.name})` : `hari ${dateStatus.dayName}`}. Centang opsi ini untuk tetap mencatat aktivitas tambahan/kegiatan khusus.`
                          : 'Hari kerja standar ditetapkan Senin–Jumat. Aktifkan opsi ini bila Anda ingin menandai kegiatan tambahan di luar jadwal kerja normal.'}
                      </p>
                    </div>
                  </label>

                  {formData.isDiluarHariKerja && (
                    <div className="mt-2.5 pl-6">
                      <input
                        type="text"
                        value={formData.alasanLuarHariKerja || ''}
                        onChange={(e) => setFormData({ ...formData, alasanLuarHariKerja: e.target.value })}
                        placeholder="Keterangan singkat (opsional, misal: Pendampingan survei lapangan / Acara instansi / Lembur)"
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                {/* Rentang Minggu (DD/MM/YYYY) + Pintasan Cepat */}
                <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--theme-accent)' }} />
                      <span>Rentang Periode Mingguan (DD/MM/YYYY)</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyQuickWeekRange(0)}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        Minggu Ini
                      </button>
                      <button
                        type="button"
                        onClick={() => applyQuickWeekRange(-1)}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        Minggu Lalu
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Tanggal Mulai Minggu (DD/MM/YYYY) *
                      </label>
                      <DateInputDDMMYYYY
                        value={formData.tanggal || ''}
                        hasError={Boolean(errors.tanggal)}
                        ariaLabel="Tanggal Mulai Minggu"
                        loggedDates={loggedDailyDateSet}
                        rangeStart={formData.tanggal}
                        rangeEnd={formData.tanggalSelesai}
                        onChange={(nextDate) => {
                          setFormData(prev => ({
                            ...prev,
                            tanggal: nextDate
                          }));
                          setErrors(prev => ({ ...prev, tanggal: '' }));
                        }}
                      />
                      {errors.tanggal && (
                        <p className="text-[10px] text-rose-500 mt-1">{errors.tanggal}</p>
                      )}
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Tanggal Akhir Minggu (DD/MM/YYYY) *
                      </label>
                      <DateInputDDMMYYYY
                        value={formData.tanggalSelesai || ''}
                        hasError={Boolean(errors.tanggalSelesai)}
                        ariaLabel="Tanggal Akhir Minggu"
                        loggedDates={loggedDailyDateSet}
                        rangeStart={formData.tanggal}
                        rangeEnd={formData.tanggalSelesai}
                        onChange={(nextEnd) => {
                          setFormData(prev => ({ ...prev, tanggalSelesai: nextEnd }));
                          setErrors(prev => ({ ...prev, tanggalSelesai: '' }));
                        }}
                      />
                      {errors.tanggalSelesai && (
                        <p className="text-[10px] text-rose-500 mt-1">{errors.tanggalSelesai}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Panel Auto-Generate dari Logbook Harian */}
                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/25 border border-purple-200 dark:border-purple-900/60 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-purple-950 dark:text-purple-100 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span>Auto-Generate dari Logbook Harian</span>
                      </div>
                      <p className="text-[11px] text-purple-900/80 dark:text-purple-300/80 mt-0.5">
                        {matchedDailyEntries.length > 0
                          ? `Ditemukan ${matchedDailyEntries.length} catatan harian (${formatDuration(matchedDailyTotalMinutes)}) pada ${formatDateDDMMYYYY(formData.tanggal)} – ${formatDateDDMMYYYY(formData.tanggalSelesai)}.`
                          : `Belum ada catatan logbook harian pada rentang ${formatDateDDMMYYYY(formData.tanggal)} – ${formatDateDDMMYYYY(formData.tanggalSelesai)}.`}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isAnyAiLoading || matchedDailyEntries.length === 0}
                        onClick={handleAutoCompileWeeklyLocal}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 hover:bg-purple-100/60 dark:hover:bg-slate-800 text-purple-900 dark:text-purple-200 font-bold text-[11px] transition-colors disabled:opacity-45 cursor-pointer"
                        title="Gabungkan catatan harian secara langsung tanpa mengubah kalimat"
                      >
                        <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Gabung Harian</span>
                      </button>

                      <button
                        type="button"
                        disabled={isAnyAiLoading || matchedDailyEntries.length === 0}
                        onClick={handleAutoGenerateWeeklyWithAI}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] shadow-2xs transition-colors disabled:opacity-45 cursor-pointer"
                        title="Rangkum seluruh logbook harian di minggu ini menjadi narasi mingguan dengan AI"
                      >
                        {aiLoadingTarget === 'weekly-ai' ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Merangkum...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Auto-Generate AI</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {matchedDailyEntries.length > 0 && (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {matchedDailyEntries.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-white/90 dark:bg-slate-900/80 border border-purple-200/70 dark:border-purple-900/50 text-[11px]"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100">
                              <span className="font-mono text-purple-700 dark:text-purple-300">
                                {formatDateDDMMYYYY(item.tanggal)}
                              </span>
                              <span className="text-slate-400">·</span>
                              <span className="truncate">{item.kategori}</span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {item.uraianAktivitas}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                            {formatDuration(item.durasiMenit)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Kategori & Status Kegiatan Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Kategori Aktivitas
                </label>
                {onOpenCategorySettings && (
                  <button
                    type="button"
                    onClick={onOpenCategorySettings}
                    className="text-[10px] font-bold hover:underline cursor-pointer"
                    style={{ color: 'var(--theme-accent)' }}
                  >
                    Atur Kategori
                  </button>
                )}
              </div>
              <select
                value={formData.kategori || activeCategories[0] || ''}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium text-slate-900 dark:text-slate-100 cursor-pointer focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-[var(--theme-accent)] focus:outline-hidden"
              >
                {activeCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Status Kegiatan
              </label>
              <select
                value={formData.statusKegiatan || 'selesai'}
                onChange={(e) => setFormData({ ...formData, statusKegiatan: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-800 dark:text-slate-100 cursor-pointer focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-[var(--theme-accent)] focus:outline-hidden"
              >
                <option value="selesai">Selesai</option>
                <option value="proses">Dalam Proses</option>
              </select>
            </div>
          </div>

          {/* Undo Bar (appears only after an AI fill/refine action) */}
          {previousSnapshot && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60">
              <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200">
                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                <span className="font-medium text-[11px]">
                  Hasil AI telah diterapkan. Anda dapat mengembalikan teks sebelumnya bila perlu.
                </span>
              </div>
              <button
                type="button"
                onClick={handleUndoAI}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Kembalikan teks sebelum disempurnakan AI"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Urungkan</span>
              </button>
            </div>
          )}

          {/* Inline AI Error Banner */}
          {aiError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center justify-between gap-2 text-[11px] font-medium">
              <span className="flex-1">{aiError}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                {aiRetryAction && (
                  <button
                    type="button"
                    disabled={isAnyAiLoading}
                    onClick={() => aiRetryAction()}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Coba Lagi
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setAiError(null);
                    setAiRetryAction(null);
                  }}
                  className="p-0.5 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Section 1: Uraian / Ringkasan Aktivitas */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>
                  {formData.tipeLogbook === 'mingguan'
                    ? '1. Ringkasan Aktivitas Mingguan *'
                    : '1. Uraian Aktivitas Harian *'}
                </span>
                {(aiSuccessField === 'uraian' || aiSuccessField === 'all') && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3" />
                    Diisi Otomatis
                  </span>
                )}
              </label>
              <button
                type="button"
                disabled={isAnyAiLoading}
                onClick={() => handleRefineWithAI('uraian')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800/80 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {aiLoadingTarget === 'uraian' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{formData.uraianAktivitas?.trim() ? 'Sempurnakan dengan AI' : 'Buat dengan AI'}</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={formData.tipeLogbook === 'mingguan' ? 4 : 3}
              value={formData.uraianAktivitas || ''}
              onChange={(e) => setFormData({ ...formData, uraianAktivitas: e.target.value })}
              placeholder={
                formData.tipeLogbook === 'mingguan'
                  ? 'Klik "Gabung Harian" atau "Auto-Generate AI" di atas untuk menyusun ringkasan mingguan otomatis dari catatan harian Anda...'
                  : 'Jelaskan secara detail pekerjaan atau tugas yang Anda selesaikan (atau ketik poin singkat lalu klik Sempurnakan dengan AI)...'
              }
              className={`w-full p-3 bg-slate-50 dark:bg-slate-800/80 border rounded-xl leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-hidden transition-colors ${
                aiSuccessField === 'uraian' || aiSuccessField === 'all'
                  ? 'border-emerald-400 dark:border-emerald-600'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
            />
            {errors.uraianAktivitas && (
              <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">{errors.uraianAktivitas}</p>
            )}
          </div>

          {/* Section 2: Pelajaran yang Diperoleh */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>
                  {formData.tipeLogbook === 'mingguan'
                    ? '2. Capaian & Pelajaran Utama Minggu Ini'
                    : '2. Pelajaran yang Diperoleh (Pengetahuan / Keterampilan Baru)'}
                </span>
                {(aiSuccessField === 'pelajaran' || aiSuccessField === 'all') && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3" />
                    Diisi Otomatis
                  </span>
                )}
              </label>
              <button
                type="button"
                disabled={isAnyAiLoading}
                onClick={() => handleRefineWithAI('pelajaran')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800/80 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {aiLoadingTarget === 'pelajaran' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{formData.pelajaranDiperoleh?.trim() ? 'Sempurnakan dengan AI' : 'Bantu Refleksi AI'}</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={2}
              value={formData.pelajaranDiperoleh || ''}
              onChange={(e) => setFormData({ ...formData, pelajaranDiperoleh: e.target.value })}
              placeholder="Catat wawasan, konsep baru, atau keterampilan yang Anda dapatkan (AI juga bisa membuatnya otomatis dari uraian aktivitas)..."
              className={`w-full p-3 bg-slate-50 dark:bg-slate-800/80 border rounded-xl leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-hidden transition-colors ${
                aiSuccessField === 'pelajaran' || aiSuccessField === 'all'
                  ? 'border-emerald-400 dark:border-emerald-600'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
            />
          </div>

          {/* Section 3: Kendala yang Dihadapi & Solusi */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>
                  {formData.tipeLogbook === 'mingguan'
                    ? '3. Kendala & Tindak Lanjut Mingguan'
                    : '3. Kendala yang Dihadapi & Cara Penyelesaiannya'}
                </span>
                {(aiSuccessField === 'kendala' || aiSuccessField === 'all') && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3" />
                    Diisi Otomatis
                  </span>
                )}
              </label>
              <button
                type="button"
                disabled={isAnyAiLoading}
                onClick={() => handleRefineWithAI('kendala')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800/80 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {aiLoadingTarget === 'kendala' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{formData.kendalaDihadapi?.trim() ? 'Sempurnakan dengan AI' : 'Bantu Formulasi AI'}</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={2}
              value={formData.kendalaDihadapi || ''}
              onChange={(e) => setFormData({ ...formData, kendalaDihadapi: e.target.value })}
              placeholder="Catat hambatan atau solusi yang diterapkan (atau klik Bantu Formulasi AI untuk mengisi otomatis)..."
              className={`w-full p-3 bg-slate-50 dark:bg-slate-800/80 border rounded-xl leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-hidden transition-colors ${
                aiSuccessField === 'kendala' || aiSuccessField === 'all'
                  ? 'border-emerald-400 dark:border-emerald-600'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
            />
          </div>

          {/* Section 4: Unggah Foto Dokumentasi / Lampiran */}
          <div className="p-4 bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/60 rounded-2xl space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <label className="font-bold text-sky-950 dark:text-sky-200 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                  <span>Foto Dokumentasi & Lampiran Kegiatan</span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {adminConfig.driveFolderId
                    ? `Terhubung dengan folder Google Drive (${adminConfig.driveFolderId})`
                    : 'Lampirkan foto dokumentasi aktivitas sebagai bukti pendukung'}
                </p>
              </div>

              {adminConfig.driveFolderUrl && (
                <a
                  href={adminConfig.driveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-800 dark:text-sky-300 hover:underline bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-sky-300 dark:border-sky-800 shadow-2xs shrink-0"
                >
                  <FolderOpen className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                  <span>Buka Folder Drive</span>
                </a>
              )}
            </div>

            {photoError && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">{photoError}</p>
            )}

            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 hover:bg-sky-100/60 dark:hover:bg-slate-800 text-sky-900 dark:text-sky-200 font-bold cursor-pointer transition-colors shadow-2xs">
                <Upload className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                <span>Pilih Foto dari Perangkat</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {formData.fotoDokumentasi?.length || 0} foto terlampir
              </span>
            </div>

            {formData.fotoDokumentasi && formData.fotoDokumentasi.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                {formData.fotoDokumentasi.map(photo => (
                  <div
                    key={photo.id}
                    className="relative group rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xs"
                  >
                    <img
                      src={photo.dataUrl}
                      alt={photo.name}
                      className="w-full h-24 object-cover"
                    />
                    <div className="p-1.5 bg-white dark:bg-slate-900 text-[10px] truncate text-slate-700 dark:text-slate-300 font-mono">
                      {photo.name}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow-md transition-colors cursor-pointer"
                      title="Hapus foto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tautan Eviden Tambahan (Opsional)
              </label>
              <input
                type="url"
                value={formData.linkEviden || ''}
                onChange={(e) => setFormData({ ...formData, linkEviden: e.target.value })}
                placeholder="https://drive.google.com/... atau https://github.com/..."
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[var(--theme-accent)]"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isAnyAiLoading}
            className="px-6 py-2.5 rounded-xl font-bold text-white transition-all shadow-md hover:opacity-95 disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: 'var(--theme-primary)' }}
          >
            {initialEntry ? 'Simpan Perubahan' : 'Simpan Catatan Logbook'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogbookModal;
