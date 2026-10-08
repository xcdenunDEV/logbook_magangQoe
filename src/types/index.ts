export type UserRole = 'admin' | 'user';

export type TipeLogbook = 'harian' | 'mingguan';

export type StatusKegiatan = 'selesai' | 'proses';

export type KategoriAktivitas = string;

export interface FotoLampiran {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string; // Base64 data for image preview & download
  driveFileUrl?: string;
  uploadedAt: string;
}

export interface LogbookEntry {
  id: string;
  username: string; // 'ainunnn' | 'ayuazhara' | 'aliyah'
  namaPenulis: string;
  tipeLogbook: TipeLogbook; // harian atau mingguan
  tanggal: string; // YYYY-MM-DD
  tanggalSelesai?: string; // YYYY-MM-DD (jika mingguan)
  jamMulai?: string; // HH:mm
  jamSelesai?: string; // HH:mm
  durasiMenit: number;
  kategori: KategoriAktivitas;
  uraianAktivitas: string;
  pelajaranDiperoleh: string;
  kendalaDihadapi: string;
  fotoDokumentasi: FotoLampiran[];
  linkEviden?: string;
  statusKegiatan: StatusKegiatan; // 'selesai' | 'proses' (pribadi, tanpa approval mentor)
  isSyncedToSheet: boolean;
  syncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppUser {
  username: string;
  password: string;
  name: string;
  role: UserRole;
  email: string;
  idPeserta: string;
  institusiAsal: string;
  jurusan: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface PesertaProfile {
  username: string;
  nama: string;
  idPeserta: string;
  email: string;
  perusahaan: string;
  posisiMagang: string;
  divisi?: string;
  lokasiMagang?: string;
  kotaPenempatan?: string;
  telepon?: string;
  periodeMulai: string;
  periodeSelesai: string;
  tanggalMulaiMagang?: string;
  tanggalSelesaiMagang?: string;
  institusiAsal: string;
  jurusan: string;
  namaMentor?: string;
  jabatanMentor?: string;
  emailMentor?: string;
}

export interface AdminIntegrationConfig {
  sheetUrl: string;
  sheetId: string;
  sheetTabName: string;
  sheetWebhookUrl: string; // Google Apps Script web app endpoint (opsional)
  driveFolderUrl: string; // Google Drive folder tujuan foto dokumentasi
  driveFolderId: string;
  autoSyncEnabled: boolean;
  lastGlobalSync?: string;
}

export interface AuthUser {
  username: string;
  email: string;
  name: string;
  role: UserRole;
  idPeserta: string;
  token?: string;
  loginTime: string;
}

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  isCutiBersama: boolean;
}

export interface LogbookSummary {
  totalLogbook: number;
  totalHarian: number;
  totalMingguan: number;
  totalFotoDokumentasi: number;
  totalJamKerja: number;
  totalSyncedToSheet: number;
  byKategori: Record<string, number>;
}

export interface PresetAktivitasMagang {
  judul: string;
  kategori: KategoriAktivitas;
  uraianTemplate: string;
  pelajaranTemplate: string;
  kendalaTemplate: string;
  durasiMenitDefault: number;
}
