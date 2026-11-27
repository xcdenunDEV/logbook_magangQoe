import { LogbookEntry, PesertaProfile } from '../types';
import { formatDateDDMMYYYY, formatIndonesianDate, formatDuration } from '../utils/dateUtils';

export class GoogleWorkspaceService {
  /**
   * Generates a downloadable CSV string formatted for MagangHub Kemnaker
   */
  static generateCsv(entries: LogbookEntry[], profile: PesertaProfile): string {
    const headers = [
      'No',
      'Penulis / User',
      'Tipe Logbook',
      'Tanggal / Periode',
      'Waktu Mulai',
      'Waktu Selesai',
      'Durasi (Menit)',
      'Durasi (Jam)',
      'Kategori Aktivitas',
      'Uraian Aktivitas',
      'Pelajaran yang Diperoleh',
      'Kendala & Solusi',
      'Jml Foto Dokumentasi',
      'Status Kegiatan',
      'Sinkron Google Sheet',
      'Link Bukti Eviden'
    ];

    const rows = entries.map((entry, idx) => {
      const escape = (str: string | number | undefined) => {
        if (str === undefined || str === null) return '""';
        const stringified = String(str).replace(/"/g, '""');
        return `"${stringified}"`;
      };

      const periode = entry.tipeLogbook === 'mingguan'
        ? `${formatDateDDMMYYYY(entry.tanggal)} s.d. ${formatDateDDMMYYYY(entry.tanggalSelesai || entry.tanggal)}`
        : formatDateDDMMYYYY(entry.tanggal);

      return [
        idx + 1,
        escape(entry.namaPenulis),
        escape(entry.tipeLogbook.toUpperCase()),
        escape(periode),
        entry.jamMulai || '-',
        entry.jamSelesai || '-',
        entry.durasiMenit,
        (entry.durasiMenit / 60).toFixed(2),
        escape(entry.kategori),
        escape(entry.uraianAktivitas),
        escape(entry.pelajaranDiperoleh),
        escape(entry.kendalaDihadapi),
        entry.fotoDokumentasi?.length || 0,
        escape(entry.statusKegiatan),
        entry.isSyncedToSheet ? 'Tersinkron' : 'Belum',
        escape(entry.linkEviden || '-')
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\r\n');
  }

  static downloadCsv(entries: LogbookEntry[], profile: PesertaProfile, filename?: string): void {
    const csvContent = this.generateCsv(entries, profile);
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      filename || `Portofolio_Logbook_${(profile.nama || 'Peserta').replace(/\s+/g, '_')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static copyFormattedSummary(entries: LogbookEntry[], profile: PesertaProfile, periodTitle: string): string {
    let text = `*PORTOFOLIO & LOGBOOK AKTIVITAS MAGANG*\n`;
    text += `Nama Peserta: ${profile.nama || profile.username || '-'}\n`;
    text += `Lokasi Magang: ${profile.perusahaan || '-'}\n`;
    if (profile.posisiMagang) {
      text += `Posisi: ${profile.posisiMagang}${profile.divisi ? ` (${profile.divisi})` : ''}\n`;
    }
    if (profile.institusiAsal) {
      text += `Institusi Asal: ${profile.institusiAsal}${profile.jurusan ? ` - ${profile.jurusan}` : ''}\n`;
    }
    text += `Periode: ${periodTitle}\n`;
    text += `-------------------------------------------\n\n`;

    entries.forEach((e, i) => {
      const periode = e.tipeLogbook === 'mingguan'
        ? `${formatDateDDMMYYYY(e.tanggal)} s.d. ${formatDateDDMMYYYY(e.tanggalSelesai || e.tanggal)}`
        : formatIndonesianDate(e.tanggal, true);
      text += `${i + 1}. [${periode} | ${e.jamMulai || '07:30'} - ${e.jamSelesai || '16:00'}]\n`;
      text += `   • Tipe: ${e.tipeLogbook.toUpperCase()}${e.isDiluarHariKerja ? ' (Luar Hari Kerja)' : ''}\n`;
      text += `   • Kategori: ${e.kategori}\n`;
      text += `   • Uraian: ${e.uraianAktivitas}\n`;
      text += `   • Pembelajaran: ${e.pelajaranDiperoleh || '-'}\n`;
      text += `   • Kendala: ${e.kendalaDihadapi || '-'}\n`;
      text += `   • Foto Lampiran: ${e.fotoDokumentasi?.length ? `${e.fotoDokumentasi.length} foto` : 'Tidak ada foto'}\n`;
      if (e.linkEviden) {
        text += `   • Eviden: ${e.linkEviden}\n`;
      }
      text += `\n`;
    });

    const totalMinutes = entries.reduce((acc, curr) => acc + (curr.durasiMenit || 0), 0);
    text += `-------------------------------------------\n`;
    text += `Total Waktu Pemagangan: ${formatDuration(totalMinutes)} (${(totalMinutes / 60).toFixed(1)} Jam)\n`;

    return text;
  }
}
