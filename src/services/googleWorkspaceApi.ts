import { LogbookEntry } from '../types';
import { formatDateDDMMYYYY, formatIndonesianDate } from '../utils/dateUtils';

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

  private static readonly SHEET_HEADERS = [
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
    'Waktu Sinkronisasi',
    'ID Logbook'
  ];

  private static formatEntryRow(item: LogbookEntry, rowNo: number): (string | number)[] {
    const periodeStr = item.tipeLogbook === 'mingguan'
      ? `${formatDateDDMMYYYY(item.tanggal)} s.d. ${formatDateDDMMYYYY(item.tanggalSelesai || item.tanggal)}`
      : `${formatIndonesianDate(item.tanggal, true)} (${item.jamMulai || '07:30'} - ${item.jamSelesai || '16:00'})`;

    const statusLabel = item.isDiluarHariKerja
      ? `${item.statusKegiatan} (Luar Hari Kerja)`
      : item.statusKegiatan;

    return [
      rowNo,
      periodeStr,
      item.tipeLogbook,
      item.namaPenulis,
      item.username,
      item.kategori,
      item.uraianAktivitas,
      item.pelajaranDiperoleh || '-',
      item.kendalaDihadapi || '-',
      item.fotoDokumentasi?.length || 0,
      statusLabel,
      new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' }),
      item.id
    ];
  }

  /**
   * Creates a brand new Google Spreadsheet configured with standard Logbook columns
   */
  static async createMagangHubSpreadsheet(
    accessToken: string,
    title = 'Rekap Logbook Aktivitas Magang'
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
                  values: this.SHEET_HEADERS.map(h => ({ userEnteredValue: { stringValue: h } }))
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
    folderName = 'Dokumentasi Foto Logbook Magang'
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

  private static async resolveTargetTab(
    accessToken: string,
    spreadsheetId: string,
    preferredTabName: string
  ): Promise<string> {
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

    const foundTab = sheetsList.find(s => s.properties.title.toLowerCase() === preferredTabName.toLowerCase());
    if (foundTab) {
      return foundTab.properties.title;
    }

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
        return preferredTabName;
      }
    } catch {
      // Fallback below
    }

    return sheetsList[0].properties.title;
  }

  /**
   * Syncs logbook entries to Google Sheet WITHOUT duplicates.
   * - mode = 'full': clears existing data rows and writes deduplicated sorted entries cleanly (ideal for "Sync Semua" / auto-sync).
   * - mode = 'upsert': checks existing rows by ID Logbook (Col M) or fingerprint; updates matching rows in-place and appends only missing entries.
   */
  static async syncEntriesDirectlyToSheet(
    accessToken: string,
    spreadsheetId: string,
    preferredTabName: string,
    entries: LogbookEntry[],
    mode: 'full' | 'upsert' = 'full'
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

    // Deduplicate input entries by id
    const uniqueMap = new Map<string, LogbookEntry>();
    entries.forEach(item => {
      if (item?.id) {
        uniqueMap.set(item.id, item);
      }
    });
    const deduplicatedEntries = Array.from(uniqueMap.values()).sort((a, b) =>
      a.tanggal.localeCompare(b.tanggal)
    );

    const targetTab = await this.resolveTargetTab(accessToken, spreadsheetId, preferredTabName);
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    if (mode === 'full') {
      // Clear A2:Z first so old rows / duplicates / deleted entries are wiped cleanly
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(targetTab)}!A2:Z:clear`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        }
      );

      const formattedRows = deduplicatedEntries.map((item, idx) =>
        this.formatEntryRow(item, idx + 1)
      );
      const allValues = [this.SHEET_HEADERS, ...formattedRows];

      const putRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(targetTab)}!A1:M${allValues.length}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ values: allValues })
        }
      );

      if (!putRes.ok) {
        const err = await putRes.json().catch(() => ({}));
        throw new Error(err.error?.message || `Gagal menyinkronkan data ke Google Sheet (HTTP ${putRes.status})`);
      }

      return {
        success: true,
        message: `Berhasil menyinkronkan ${deduplicatedEntries.length} logbook ke Google Sheet tab "${targetTab}" tanpa duplikat.`,
        rowCount: deduplicatedEntries.length,
        spreadsheetUrl,
        tabName: targetTab
      };
    }

    // Upsert mode (single / partial sync): ensure header exists, read existing rows, update in-place or append
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(targetTab)}!A1:M1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: [this.SHEET_HEADERS] })
      }
    );

    const existingRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(targetTab)}!A2:M`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    const existingJson = existingRes.ok ? await existingRes.json().catch(() => ({})) : {};
    const existingRows: string[][] = Array.isArray(existingJson.values) ? existingJson.values : [];

    // Build lookup map: ID Logbook (col M / index 12) -> sheet row number (2-indexed)
    // Plus fallback fingerprint (tanggal/periode string + uraian) for legacy sheets
    const idToRowIndex = new Map<string, number>();
    const fingerprintToRowIndex = new Map<string, number>();

    existingRows.forEach((row, idx) => {
      const sheetRowNumber = idx + 2;
      const rowId = (row[12] || '').trim();
      const rowPeriode = (row[1] || '').trim();
      const rowUraian = (row[6] || '').trim();
      if (rowId) {
        idToRowIndex.set(rowId, sheetRowNumber);
      }
      if (rowPeriode && rowUraian) {
        fingerprintToRowIndex.set(`${rowPeriode}::${rowUraian}`, sheetRowNumber);
      }
    });

    let updatedCount = 0;
    const rowsToAppend: (string | number)[][] = [];

    for (const entry of deduplicatedEntries) {
      const rowPreview = this.formatEntryRow(entry, 0);
      const fingerprint = `${String(rowPreview[1]).trim()}::${String(rowPreview[6]).trim()}`;
      const matchedRowNum =
        idToRowIndex.get(entry.id) ||
        fingerprintToRowIndex.get(fingerprint);

      if (matchedRowNum) {
        const rowNo = matchedRowNum - 1;
        const rowValues = this.formatEntryRow(entry, rowNo);
        const updateRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(targetTab)}!A${matchedRowNum}:M${matchedRowNum}?valueInputOption=USER_ENTERED`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ values: [rowValues] })
          }
        );

        if (!updateRes.ok) {
          const err = await updateRes.json().catch(() => ({}));
          throw new Error(err.error?.message || `Gagal memperbarui baris ke-${matchedRowNum} di Google Sheet.`);
        }
        updatedCount++;
      } else {
        const nextRowNo = existingRows.length + rowsToAppend.length + 1;
        rowsToAppend.push(this.formatEntryRow(entry, nextRowNo));
      }
    }

    if (rowsToAppend.length > 0) {
      const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(targetTab)}!A:M:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
      const appendRes = await fetch(appendUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: rowsToAppend })
      });

      if (!appendRes.ok) {
        const err = await appendRes.json().catch(() => ({}));
        throw new Error(err.error?.message || `Gagal mengirim data ke Google Sheet (HTTP ${appendRes.status})`);
      }
    }

    const totalSynced = updatedCount + rowsToAppend.length;
    const detailMsg =
      updatedCount > 0 && rowsToAppend.length === 0
        ? `Data logbook diperbarui di Google Sheet tab "${targetTab}" tanpa duplikat (${updatedCount} baris diperbarui).`
        : updatedCount > 0 && rowsToAppend.length > 0
        ? `Berhasil menyinkronkan ke tab "${targetTab}": ${rowsToAppend.length} baris baru & ${updatedCount} baris diperbarui (tanpa duplikat).`
        : `Berhasil menambahkan ${rowsToAppend.length} baris logbook baru ke Google Sheet tab "${targetTab}".`;

    return {
      success: true,
      message: detailMsg,
      rowCount: totalSynced,
      spreadsheetUrl,
      tabName: targetTab
    };
  }

  /**
   * Clears data rows (A2:Z) from the Google Sheet while preserving and formatting the header row (A1:M1).
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

    const targetTab = await this.resolveTargetTab(accessToken, spreadsheetId, preferredTabName);

    // Clear all data rows starting from row 2 (A2:Z)
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

    // Ensure Header row 1 is clean and properly formatted
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(targetTab)}!A1:M1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [this.SHEET_HEADERS]
        })
      }
    );

    return {
      success: true,
      message: `Seluruh isi data pada Google Sheet tab "${targetTab}" telah berhasil dikosongkan (baris judul tetap dipertahankan).`,
      clearedTab: targetTab
    };
  }
}
