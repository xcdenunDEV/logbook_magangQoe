import { INITIAL_LOGBOOK_ENTRIES, INITIAL_USERS } from '../data/initialData';
import { LogbookEntry, LogbookSummary, PesertaProfile } from '../types';

const STORAGE_KEYS = {
  ENTRIES: 'maganghub_logbook_entries',
  PROFILE: 'maganghub_peserta_profile'
};

const DEFAULT_PROFILE: PesertaProfile = {
  username: 'ainunnn',
  nama: 'Muhammad Ainun Anwar',
  idPeserta: 'MH-2026-ADM01',
  email: 'ainun.anwar@maganghub.kemnaker.go.id',
  perusahaan: 'PT Teknologi Digital Nusantara',
  posisiMagang: 'Data Analyst & Software Engineer Intern',
  periodeMulai: '2026-08-01',
  periodeSelesai: '2026-12-31',
  institusiAsal: 'Universitas Hasanuddin',
  jurusan: 'Teknik Informatika & Sistem Informasi',
  kotaPenempatan: 'Makassar / Remote'
};

export class UserService {
  static getProfile(): PesertaProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error loading profile', e);
    }
    this.saveProfile(DEFAULT_PROFILE);
    return DEFAULT_PROFILE;
  }

  static saveProfile(profile: PesertaProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Error saving profile', e);
    }
  }

  static getEntries(): LogbookEntry[] {
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

  static calculateSummary(entries: LogbookEntry[], month: number, year: number): LogbookSummary {
    const filtered = entries.filter(e => {
      const [entryYear, entryMonth] = e.tanggal.split('-');
      return parseInt(entryYear, 10) === year && parseInt(entryMonth, 10) === month;
    });

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
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      profile: this.getProfile(),
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
  }
}
