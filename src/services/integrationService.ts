import { AdminIntegrationConfig, LogbookEntry } from '../types';
import { INITIAL_INTEGRATION_CONFIG } from '../data/initialData';
import { formatDuration, formatIndonesianDate } from '../utils/dateUtils';
import { getAccessToken, googleSignIn } from './firebaseAuth';
import { GoogleWorkspaceApi } from './googleWorkspaceApi';

const INTEGRATION_CONFIG_KEY = 'maganghub_admin_integration_config';

export class IntegrationService {
  static getConfig(): AdminIntegrationConfig {
    try {
      const data = localStorage.getItem(INTEGRATION_CONFIG_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error loading integration config', e);
    }
    localStorage.setItem(INTEGRATION_CONFIG_KEY, JSON.stringify(INITIAL_INTEGRATION_CONFIG));
    return INITIAL_INTEGRATION_CONFIG;
  }

  static saveConfig(config: AdminIntegrationConfig): void {
    try {
      localStorage.setItem(INTEGRATION_CONFIG_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Error saving integration config', e);
    }
  }

  /**
   * Syncs logbook entries to the configured Google Sheet via official Google Sheets API.
   * Prompts authentication if needed, creates a spreadsheet if missing, and appends the rows.
   */
  static async syncEntriesToGoogleSheet(entries: LogbookEntry[]): Promise<{
    success: boolean;
    syncedCount: number;
    message: string;
    spreadsheetUrl?: string;
  }> {
    const config = this.getConfig();

    if (entries.length === 0) {
      return {
        success: false,
        syncedCount: 0,
        message: 'Tidak ada data logbook untuk disinkronkan.'
      };
    }

    // 1. Get or prompt Google OAuth access token
    let accessToken = await getAccessToken();
    if (!accessToken) {
      try {
        const authRes = await googleSignIn();
        if (authRes?.accessToken) {
          accessToken = authRes.accessToken;
        }
      } catch (authErr: any) {
        return {
          success: false,
          syncedCount: 0,
          message: 'Sinkronisasi dibatalkan: Anda perlu menghubungkan akun Google untuk mengisi Google Sheet.'
        };
      }
    }

    if (!accessToken) {
      return {
        success: false,
        syncedCount: 0,
        message: 'Akun Google belum terhubung. Silakan hubungkan akun Google di menu Pengaturan Admin.'
      };
    }

    // 2. Extract or auto-create Google Spreadsheet
    let sheetId = config.sheetId || GoogleWorkspaceApi.extractSpreadsheetId(config.sheetUrl);
    const isPlaceholder = !sheetId || sheetId === '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';

    if (isPlaceholder) {
      try {
        const created = await GoogleWorkspaceApi.createMagangHubSpreadsheet(
          accessToken,
          'MagangHub Kemnaker - Rekap Logbook Pemagangan'
        );
        sheetId = created.spreadsheetId;
        const updatedConfig: AdminIntegrationConfig = {
          ...config,
          sheetUrl: created.spreadsheetUrl,
          sheetId: created.spreadsheetId,
          sheetTabName: created.sheetTabName
        };
        this.saveConfig(updatedConfig);
      } catch (createErr: any) {
        return {
          success: false,
          syncedCount: 0,
          message: `Gagal membuat spreadsheet baru: ${createErr.message}`
        };
      }
    }

    // 3. Write rows to Google Sheet via Google Sheets API
    try {
      const activeConfig = this.getConfig();
      const apiRes = await GoogleWorkspaceApi.syncEntriesDirectlyToSheet(
        accessToken,
        sheetId,
        activeConfig.sheetTabName || 'Rekap Logbook Magang',
        entries
      );

      activeConfig.lastGlobalSync = new Date().toISOString();
      this.saveConfig(activeConfig);

      return {
        success: true,
        syncedCount: apiRes.rowCount,
        message: apiRes.message,
        spreadsheetUrl: apiRes.spreadsheetUrl
      };
    } catch (apiErr: any) {
      console.error('Google Sheets API direct sync failed:', apiErr);
      return {
        success: false,
        syncedCount: 0,
        message: `Gagal menulis ke Google Sheet: ${apiErr.message}`
      };
    }
  }

  /**
   * Clears data rows from the connected Google Sheet while keeping official Kemnaker headers.
   */
  static async clearGoogleSheetData(): Promise<{
    success: boolean;
    message: string;
    sheetUrl?: string;
  }> {
    const config = this.getConfig();
    const sheetId = config.sheetId || GoogleWorkspaceApi.extractSpreadsheetId(config.sheetUrl);

    if (!sheetId) {
      return {
        success: false,
        message: 'Google Sheet belum diatur sehingga tidak ada isi sheet yang perlu dikosongkan.'
      };
    }

    let accessToken = await getAccessToken();
    if (!accessToken) {
      try {
        const authRes = await googleSignIn();
        if (authRes?.accessToken) {
          accessToken = authRes.accessToken;
        }
      } catch (err: any) {
        return {
          success: false,
          message: 'Akun Google belum terhubung. Silakan login akun Google Anda.'
        };
      }
    }

    if (!accessToken) {
      return {
        success: false,
        message: 'Akun Google belum terhubung. Silakan hubungkan akun Google Anda terlebih dahulu.'
      };
    }

    try {
      const res = await GoogleWorkspaceApi.clearSheetDataRows(
        accessToken,
        sheetId,
        config.sheetTabName || 'Rekap Logbook Magang'
      );
      return {
        success: true,
        message: res.message,
        sheetUrl: config.sheetUrl
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal mengosongkan isi Google Sheet: ${err.message}`
      };
    }
  }

  /**
   * Generates formatted tab-delimited text ready to copy-paste directly into Google Sheets
   */
  static generateTsvForGoogleSheet(entries: LogbookEntry[]): string {
    const headers = [
      'No',
      'Tanggal / Periode',
      'Tipe Logbook',
      'Nama Penulis',
      'Username',
      'Kategori',
      'Uraian Aktivitas',
      'Pelajaran Diperoleh',
      'Kendala Dihadapi',
      'Jumlah Foto',
      'Status Kegiatan',
      'Waktu Sinkron'
    ];

    const rows = entries.map((item, index) => {
      const periodeStr = item.tipeLogbook === 'mingguan'
        ? `${item.tanggal} s.d. ${item.tanggalSelesai || '-'}`
        : `${formatIndonesianDate(item.tanggal, false)} (${item.jamMulai || '-'} - ${item.jamSelesai || '-'})`;

      const cleanText = (str?: string) => (str ? str.replace(/\r?\n|\r/g, ' ').replace(/\t/g, ' ') : '-');

      return [
        index + 1,
        periodeStr,
        item.tipeLogbook,
        item.namaPenulis,
        item.username,
        item.kategori,
        cleanText(item.uraianAktivitas),
        cleanText(item.pelajaranDiperoleh),
        cleanText(item.kendalaDihadapi),
        item.fotoDokumentasi?.length || 0,
        item.statusKegiatan,
        new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' })
      ].join('\t');
    });

    return [headers.join('\t'), ...rows].join('\n');
  }
}
