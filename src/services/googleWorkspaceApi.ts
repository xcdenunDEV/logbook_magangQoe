import { LogbookEntry } from '../types';
import { formatIndonesianDate } from '../utils/dateUtils';

export class GoogleWorkspaceApi {
  /**
   * Extract Google Spreadsheet ID from a URL or raw ID
   */
  static extractSpreadsheetId(urlOrId: string): string {
    if (!urlOrId) return '';
    const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
    return urlOrId.trim();
  }

  /**
   * Extract Google Drive Folder ID from a URL or raw ID
   */
  static extractDriveFolderId(urlOrId: string): string {
    if (!urlOrId) return '';
    const match = urlOrId.match(/\/folders\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
    return urlOrId.trim();
  }

  /**
   * Creates a brand new Google Spreadsheet configured with MagangHub official columns
   */
  static async createMagangHubSpreadsheet(
    accessToken: string,
    title = 'MagangHub Kemnaker - Rekap Logbook Pemagangan'
  ): Promise<{
    spreadsheetId: string;
    spreadsheetUrl: string;
    sheetTabName: string;
  }> {
    const tabName = 'Rekap Logbook Magang';
    const body = {
      properties: {
        title
      },
      sheets: [
        {
          properties: {
            title: tabName,
            gridProperties: {
              frozenRowCount: 1
            }
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: [
                    { userEnteredValue: { stringValue: 'No' } },
                    { userEnteredValue: { stringValue: 'Tanggal & Waktu' } },
                    { userEnteredValue: { stringValue: 'Tipe Logbook' } },
                    { userEnteredValue: { stringValue: 'Nama Peserta' } },
                    { userEnteredValue: { stringValue: 'Username' } },
                    { userEnteredValue: { stringValue: 'Kategori Aktivitas' } },
                    { userEnteredValue: { stringValue: 'Uraian Aktivitas' } },
                    { userEnteredValue: { stringValue: 'Pelajaran Diperoleh' } },
                    { userEnteredValue: { stringValue: 'Kendala Dihadapi & Solusi' } },
                    { userEnteredValue: { stringValue: 'Jumlah Foto' } },
                    { userEnteredValue: { stringValue: 'Status Kegiatan' } },
                    { userEnteredValue: { stringValue: 'Waktu Sinkronisasi' } }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };

    const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gagal membuat spreadsheet baru (HTTP ${res.status}). Pastikan akun Google Anda telah terhubung.`);
    }

    const data = await res.json();
    const spreadsheetId = data.spreadsheetId;
    const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    return {
      spreadsheetId,
      spreadsheetUrl,
      sheetTabName: tabName
    };
  }

  /**
   * Creates a dedicated folder in Google Drive for photos
   */
  static async createMagangHubDriveFolder(
    accessToken: string,
    folderName = 'Dokumentasi Foto MagangHub'
  ): Promise<{
    folderId: string;
    folderUrl: string;
  }> {
    const body = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    };

    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gagal membuat folder Google Drive (HTTP ${res.status})`);
    }

    const data = await res.json();
    const folderId = data.id;
    const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;

    return {
      folderId,
      folderUrl
    };
  }

  /**
   * Appends logbook entries directly to the Google Sheet using Sheets API.
   * Auto-detects sheet tabs, adds headers if missing, and appends the data rows.
   */
  static async syncEntriesDirectlyToSheet(
    accessToken: string,
    spreadsheetId: string,
    preferredTabName: string,
    entries: LogbookEntry[]
  ): Promise<{
    success: boolean;
    message: string;
    rowCount: number;
    spreadsheetUrl: string;
    tabName: string;
  }> {
    if (!spreadsheetId) {
      throw new Error('Spreadsheet ID tidak valid atau belum diatur.');
    }

    // 1. Fetch metadata to get actual existing sheet tab names
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!metaRes.ok) {
      const errJson = await metaRes.json().catch(() => ({}));
      const errMsg = errJson.error?.message || `HTTP ${metaRes.status}`;
      if (metaRes.status === 404) {
        throw new Error('Spreadsheet tidak ditemukan. Silakan buat spreadsheet baru via tombol "Buat Spreadsheet Otomatis" di Pengaturan Admin.');
      } else if (metaRes.status === 403) {
        throw new Error('Akses ditolak ke Spreadsheet ini. Pastikan Anda masuk dengan akun Google yang memiliki izin edit, atau buat Spreadsheet baru otomatis.');
      }
      throw new Error(`Gagal mengakses spreadsheet: ${errMsg}`);
    }

    const metadata = await metaRes.json();
    const sheetsList: Array<{ properties: { sheetId: number; title: string } }> = metadata.sheets || [];

    if (sheetsList.length === 0) {
      throw new Error('Spreadsheet tidak memiliki lembar kerja (worksheet).');
    }

    // Determine target tab name
    let targetTab = preferredTabName;
    const foundTab = sheetsList.find(s => s.properties.title.toLowerCase() === preferredTabName.toLowerCase());

    if (foundTab) {
      targetTab = foundTab.properties.title;
    } else {
      // If preferred tab doesn't exist, try adding it or use the first tab
      try {
        const addTabRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requests: [
              {
                addSheet: {
                  properties: {
                    title: preferredTabName,
                    gridProperties: {
                      frozenRowCount: 1
                    }
                  }
                }
              }
            ]
          })
        });

        if (addTabRes.ok) {
          targetTab = preferredTabName;
        } else {
          // Fallback to first existing sheet title
          targetTab = sheetsList[0].properties.title;
        }
      } catch {
        targetTab = sheetsList[0].properties.title;
      }
    }

    // 2. Check if Header row exists
    try {
      const headerCheckRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(targetTab)}!A1:L1`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );

      if (headerCheckRes.ok) {
        const headerData = await headerCheckRes.json();
        // If row 1 is completely empty, insert standard Kemnaker headers
        if (!headerData.values || headerData.values.length === 0 || !headerData.values[0] || headerData.values[0].length === 0) {
          await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(targetTab)}!A1:L1?valueInputOption=USER_ENTERED`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                values: [
                  [
                    'No',
                    'Tanggal & Waktu',
                    'Tipe Logbook',
                    'Nama Peserta',
                    'Username',
                    'Kategori Aktivitas',
                    'Uraian Aktivitas',
                    'Pelajaran Diperoleh',
                    'Kendala Dihadapi & Solusi',
                    'Jumlah Foto',
                    'Status Kegiatan',
                    'Waktu Sinkronisasi'
                  ]
                ]
              })
            }
          );
        }
      }
    } catch (e) {
      console.warn('Notice checking sheet header:', e);
    }

    // 3. Format rows from entries
    const rows = entries.map((item, index) => {
      const periodeStr = item.tipeLogbook === 'mingguan'
        ? `${item.tanggal} s.d. ${item.tanggalSelesai || '-'}`
        : `${formatIndonesianDate(item.tanggal, false)} (${item.jamMulai || '-'} - ${item.jamSelesai || '-'})`;

      return [
        index + 1,
        periodeStr,
        item.tipeLogbook,
        item.namaPenulis,
        item.username,
        item.kategori,
        item.uraianAktivitas,
        item.pelajaranDiperoleh || '-',
        item.kendalaDihadapi || '-',
        item.fotoDokumentasi?.length || 0,
        item.statusKegiatan,
        new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' })
      ];
    });

    // 4. Append values to the spreadsheet
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(targetTab)}!A:L:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    
    const res = await fetch(appendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: rows
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gagal mengirim data ke Google Sheet (HTTP ${res.status})`);
    }

    const data = await res.json();
    const updatedRows = data.updates?.updatedRows || entries.length;
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    return {
      success: true,
      message: `Berhasil menambahkan ${updatedRows} baris logbook ke Google Sheet tab "${targetTab}"!`,
      rowCount: updatedRows,
      spreadsheetUrl,
      tabName: targetTab
    };
  }

  /**
   * Clears data rows (A2:Z) from the Google Sheet while preserving and formatting the header row (A1:L1).
   */
  static async clearSheetDataRows(
    accessToken: string,
    spreadsheetId: string,
    preferredTabName: string
  ): Promise<{
    success: boolean;
    message: string;
    clearedTab: string;
  }> {
    if (!spreadsheetId) {
      throw new Error('Spreadsheet ID belum diatur.');
    }

    // 1. Fetch metadata to get actual existing sheet tab names
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!metaRes.ok) {
      const errJson = await metaRes.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Gagal mengakses spreadsheet (HTTP ${metaRes.status})`);
    }

    const metadata = await metaRes.json();
    const sheetsList: Array<{ properties: { sheetId: number; title: string } }> = metadata.sheets || [];

    if (sheetsList.length === 0) {
      throw new Error('Spreadsheet tidak memiliki lembar kerja (worksheet).');
    }

    let targetTab = preferredTabName;
    const foundTab = sheetsList.find(s => s.properties.title.toLowerCase() === preferredTabName.toLowerCase());
    if (foundTab) {
      targetTab = foundTab.properties.title;
    } else {
      targetTab = sheetsList[0].properties.title;
    }

    // 2. Clear all data rows starting from row 2 (A2:Z)
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(targetTab)}!A2:Z:clear`;
    const clearRes = await fetch(clearUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (!clearRes.ok) {
      const err = await clearRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gagal mengosongkan baris data spreadsheet (HTTP ${clearRes.status})`);
    }

    // 3. Ensure Header row 1 is clean and properly formatted
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(targetTab)}!A1:L1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [
            [
              'No',
              'Tanggal & Waktu',
              'Tipe Logbook',
              'Nama Peserta',
              'Username',
              'Kategori Aktivitas',
              'Uraian Aktivitas',
              'Pelajaran Diperoleh',
              'Kendala Dihadapi & Solusi',
              'Jumlah Foto',
              'Status Kegiatan',
              'Waktu Sinkronisasi'
            ]
          ]
        })
      }
    );

    return {
      success: true,
      message: `Seluruh isi data pada Google Sheet tab "${targetTab}" telah berhasil dikosongkan (baris judul/header standar tetap dipertahankan).`,
      clearedTab: targetTab
    };
  }
}
