import { INITIAL_LOGBOOK_ENTRIES } from '../data/initialData';
import { LogbookEntry, LogbookSummary, MagangPeriod, PesertaProfile } from '../types';
import { isDateInPeriod } from '../utils/dateUtils';

const STORAGE_KEYS = {
  ENTRIES: 'maganghub_logbook_entries',
  PROFILE: 'maganghub_peserta_profile',
  CATEGORIES: 'maganghub_activity_categories',
  MIGRATION_BPS: 'maganghub_profile_bps_parepare_v1'
};

export const DEFAULT_ACTIVITY_CATEGORIES: string[] = [
  'Teknis / Proyek Utama',
  'Riset & Analisis',
  'Pelatihan & Pembelajaran Mandiri',
  'Koordinasi & Rapat Tim',
  'Dokumentasi & Administrasi',
  'Operasional Lapangan',
  'Pengujian Sistem & QA',
  'Desain & Kreatif',
  'Lainnya'
];

const DEFAULT_PROFILE: PesertaProfile = {
  username: 'ainunnn',
  nama: '',
  email: '',
  perusahaan: 'Badan Pusat Statistik Kota Parepare',
  lokasiMagang: 'Badan Pusat Statistik Kota Parepare',
  posisiMagang: '',
  divisi: '',
  kotaPenempatan: '',
  telepon: '',
  periodeMulai: '',
  periodeSelesai: '',
  institusiAsal: '',
  jurusan: '',
  namaMentor: '',
  jabatanMentor: '',
  emailMentor: ''
};

export class UserService {
  private static runMigrationIfNeeded(): void {
    try {
      if (localStorage.getItem(STORAGE_KEYS.MIGRATION_BPS)) return;

      // Auto-setup profile lokasi magang to Badan Pusat Statistik Kota Parepare, blank other fields
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));

      // Remove sample entries from removed users (ayuazhara & aliyah)
      const rawEntries = localStorage.getItem(STORAGE_KEYS.ENTRIES);
      if (rawEntries) {
        const parsed = JSON.parse(rawEntries);
        if (Array.isArray(parsed)) {
          const cleanedEntries = parsed.filter((e: any) => {
            const uname = String(e?.username || '').toLowerCase();
            return uname !== 'ayuazhara' && uname !== 'aliyah';
          });
          localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(cleanedEntries));
        }
      }

      localStorage.setItem(STORAGE_KEYS.MIGRATION_BPS, 'done');
    } catch (e) {
      console.error('Error migrating profile/entries', e);
    }
  }

  static getProfile(): PesertaProfile {
    this.runMigrationIfNeeded();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (data) {
        const parsed = JSON.parse(data);
        const { idPeserta: _removed, ...cleanProfile } = parsed;
        return {
          ...DEFAULT_PROFILE,
          ...cleanProfile,
          perusahaan: cleanProfile.perusahaan || DEFAULT_PROFILE.perusahaan,
          lokasiMagang: cleanProfile.lokasiMagang || cleanProfile.perusahaan || DEFAULT_PROFILE.lokasiMagang
        };
      }
    } catch (e) {
      console.error('Error loading profile', e);
    }
    this.saveProfile(DEFAULT_PROFILE);
    return DEFAULT_PROFILE;
  }

  static saveProfile(profile: PesertaProfile): void {
    try {
      const { idPeserta: _removed, ...cleanProfile } = profile as PesertaProfile & { idPeserta?: string };
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(cleanProfile));
    } catch (e) {
      console.error('Error saving profile', e);
    }
  }

  static getEntries(): LogbookEntry[] {
    this.runMigrationIfNeeded();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ENTRIES);
      if (data !== null) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading logbook entries', e);
    }
    this.saveEntries(INITIAL_LOGBOOK_ENTRIES);
    return INITIAL_LOGBOOK_ENTRIES;
  }

  static clearAllEntries(): LogbookEntry[] {
    this.saveEntries([]);
    return [];
  }

  static resetToInitialSampleEntries(): LogbookEntry[] {
    this.saveEntries(INITIAL_LOGBOOK_ENTRIES);
    return INITIAL_LOGBOOK_ENTRIES;
  }

  static saveEntries(entries: LogbookEntry[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
    } catch (e) {
      console.error('Error saving logbook entries', e);
    }
  }

  static getCategories(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const cleaned = parsed
            .map((c: unknown) => (typeof c === 'string' ? c.trim() : ''))
            .filter(Boolean);
          if (cleaned.length > 0) {
            return Array.from(new Set(cleaned));
          }
        }
      }
    } catch (e) {
      console.error('Error loading activity categories', e);
    }
    this.saveCategories(DEFAULT_ACTIVITY_CATEGORIES);
    return [...DEFAULT_ACTIVITY_CATEGORIES];
  }

  static saveCategories(categories: string[]): string[] {
    const unique = Array.from(
      new Set(categories.map(c => c.trim()).filter(Boolean))
    );
    const finalCategories = unique.length > 0 ? unique : [...DEFAULT_ACTIVITY_CATEGORIES];
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(finalCategories));
    } catch (e) {
      console.error('Error saving activity categories', e);
    }
    return finalCategories;
  }

  static resetCategoriesToDefault(): string[] {
    return this.saveCategories([...DEFAULT_ACTIVITY_CATEGORIES]);
  }

  static getEntriesForUser(username: string, isAdmin = false): LogbookEntry[] {
    const all = this.getEntries();
    if (isAdmin) {
      return all;
    }
    return all.filter(e => e.username.toLowerCase() === username.toLowerCase());
  }

  static addOrUpdateEntry(entry: LogbookEntry): LogbookEntry[] {
    const entries = this.getEntries();
    const index = entries.findIndex(e => e.id === entry.id);
    let updated: LogbookEntry[];

    if (index >= 0) {
      updated = [...entries];
      updated[index] = { 
        ...entry, 
        updatedAt: new Date().toISOString()
      };
    } else {
      updated = [
        {
          ...entry,
          id: entry.id || `log-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        ...entries
      ];
    }

    this.saveEntries(updated);
    return updated;
  }

  static deleteEntry(id: string): LogbookEntry[] {
    const entries = this.getEntries();
    const updated = entries.filter(e => e.id !== id);
    this.saveEntries(updated);
    return updated;
  }

  static markEntriesAsSynced(entryIds: string[]): LogbookEntry[] {
    const entries = this.getEntries();
    const updated = entries.map(e => {
      if (entryIds.includes(e.id)) {
        return {
          ...e,
          isSyncedToSheet: true,
          syncedAt: new Date().toISOString()
        };
      }
      return e;
    });
    this.saveEntries(updated);
    return updated;
  }

  static calculateSummaryByPeriod(entries: LogbookEntry[], period: MagangPeriod | null): LogbookSummary {
    const filtered = period
      ? entries.filter(e => isDateInPeriod(e.tanggal, period))
      : entries;

    return this.buildSummaryFromEntries(filtered);
  }

  static calculateSummary(entries: LogbookEntry[], month: number, year: number): LogbookSummary {
    const filtered = entries.filter(e => {
      const [entryYear, entryMonth] = e.tanggal.split('-');
      return parseInt(entryYear, 10) === year && parseInt(entryMonth, 10) === month;
    });

    return this.buildSummaryFromEntries(filtered);
  }

  private static buildSummaryFromEntries(filtered: LogbookEntry[]): LogbookSummary {
    let totalMenit = 0;
    let totalHarian = 0;
    let totalMingguan = 0;
    let totalFotoDokumentasi = 0;
    let totalSyncedToSheet = 0;
    const byKategori: Record<string, number> = {};

    filtered.forEach(entry => {
      totalMenit += entry.durasiMenit || 0;
      if (entry.tipeLogbook === 'harian') totalHarian++;
      else totalMingguan++;

      totalFotoDokumentasi += entry.fotoDokumentasi?.length || 0;
      if (entry.isSyncedToSheet) totalSyncedToSheet++;

      byKategori[entry.kategori] = (byKategori[entry.kategori] || 0) + 1;
    });

    return {
      totalLogbook: filtered.length,
      totalHarian,
      totalMingguan,
      totalFotoDokumentasi,
      totalJamKerja: parseFloat((totalMenit / 60).toFixed(1)),
      totalSyncedToSheet,
      byKategori
    };
  }

  static exportToJson(): string {
    const backup = {
      version: '2.1.0',
      exportedAt: new Date().toISOString(),
      profile: this.getProfile(),
      categories: this.getCategories(),
      entries: this.getEntries()
    };
    return JSON.stringify(backup, null, 2);
  }

  static importFromJson(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.entries && Array.isArray(parsed.entries)) {
        this.saveEntries(parsed.entries);
        if (parsed.profile) {
          this.saveProfile(parsed.profile);
        }
        if (parsed.categories && Array.isArray(parsed.categories)) {
          this.saveCategories(parsed.categories);
        }
        return true;
      }
    } catch (e) {
      console.error('Import failed', e);
    }
    return false;
  }

  static resetToDefault(): void {
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(INITIAL_LOGBOOK_ENTRIES));
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_ACTIVITY_CATEGORIES));
  }
}
