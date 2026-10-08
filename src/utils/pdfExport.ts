import { LogbookEntry, PesertaProfile } from '../types';
import { formatDuration, formatIndonesianDate } from './dateUtils';

export function printOfficialLogbookReport(
  entries: LogbookEntry[],
  profile: PesertaProfile,
  periodLabel: string
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Mohon izinkan pop-up peramban untuk mencetak laporan MagangHub.');
    return;
  }

  const totalMenit = entries.reduce((acc, curr) => acc + (curr.durasiMenit || 0), 0);
  const totalJam = (totalMenit / 60).toFixed(1);

  const tableRows = entries.map((e, idx) => {
    const periode = e.tipeLogbook === 'mingguan'
      ? `${formatIndonesianDate(e.tanggal, false)} s.d. ${formatIndonesianDate(e.tanggalSelesai || e.tanggal, false)}`
      : formatIndonesianDate(e.tanggal, false);

    return `
    <tr>
      <td style="text-align: center; padding: 6px; border: 1px solid #333; font-weight: bold;">${idx + 1}</td>
      <td style="padding: 6px; border: 1px solid #333; white-space: nowrap;">
        <strong>${periode}</strong><br>
        <span style="font-size: 10px; color: #555;">${e.jamMulai || '-'} - ${e.jamSelesai || '-'} (${formatDuration(e.durasiMenit)})</span><br>
        <span style="font-size: 9.5px; font-weight: bold; color: #0284c7; text-transform: uppercase;">[${e.tipeLogbook}]</span>
      </td>
      <td style="padding: 6px; border: 1px solid #333;">
        <span style="font-size: 10.5px; background: #e0f2fe; color: #0369a1; padding: 2px 5px; border-radius: 3px; font-weight: bold;">${e.kategori}</span>
        <div style="margin-top: 4px; line-height: 1.35;">${e.uraianAktivitas}</div>
        ${e.linkEviden ? `<div style="margin-top: 4px; font-size: 10px; color: #0284c7;">Eviden: ${e.linkEviden}</div>` : ''}
      </td>
      <td style="padding: 6px; border: 1px solid #333; line-height: 1.35;">
        ${e.pelajaranDiperoleh || '-'}
      </td>
      <td style="padding: 6px; border: 1px solid #333; line-height: 1.35;">
        ${e.kendalaDihadapi || '-'}
      </td>
      <td style="text-align: center; padding: 6px; border: 1px solid #333;">
        <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #15803d;">
          ${e.statusKegiatan}
        </span>
        <div style="font-size: 9.5px; color: #555; margin-top: 3px;">
          ${e.fotoDokumentasi?.length ? `📷 ${e.fotoDokumentasi.length} Foto` : 'Tanpa Foto'}
        </div>
        ${e.isSyncedToSheet ? '<div style="font-size: 9px; color: #059669; font-weight: bold; margin-top: 2px;">✓ Sheet</div>' : ''}
      </td>
    </tr>
  `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Laporan Aktivitas MagangHub Kemnaker - ${profile.nama}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 10mm 12mm 10mm;
        }
        body {
          font-family: Arial, sans-serif;
          font-size: 11px;
          line-height: 1.3;
          color: #000;
          background: #fff;
          margin: 0;
          padding: 8px;
        }
        .header-table {
          width: 100%;
          border-collapse: collapse;
          border-bottom: 2.5px solid #003366;
          margin-bottom: 12px;
          padding-bottom: 8px;
        }
        .logo-col {
          width: 75px;
          text-align: center;
          vertical-align: middle;
        }
        .title-col {
          text-align: center;
          vertical-align: middle;
        }
        .title-col h2 {
          margin: 0;
          font-size: 14px;
          font-weight: 800;
          color: #003366;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .title-col h3 {
          margin: 2px 0;
          font-size: 12px;
          font-weight: 700;
          color: #1e293b;
        }
        .title-col p {
          margin: 1px 0;
          font-size: 9.5px;
          color: #475569;
        }
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
          font-size: 11px;
        }
        .info-table td {
          padding: 2.5px 4px;
          vertical-align: top;
        }
        .logbook-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 14px;
          font-size: 10.5px;
        }
        .logbook-table th {
          background-color: #f1f5f9;
          color: #003366;
          padding: 7px 5px;
          border: 1px solid #333;
          font-weight: bold;
          text-align: center;
          text-transform: uppercase;
          font-size: 10px;
        }
        .summary-box {
          border: 1px dashed #64748b;
          background-color: #f8fafc;
          padding: 8px 12px;
          margin-bottom: 20px;
          font-size: 10.5px;
          border-radius: 4px;
        }
        .signature-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          page-break-inside: avoid;
        }
        .signature-table td {
          width: 50%;
          text-align: center;
          vertical-align: top;
          padding: 10px;
          font-size: 11px;
        }
        .sig-space {
          height: 60px;
        }
      </style>
    </head>
    <body>
      <table class="header-table">
        <tr>
          <td class="logo-col">
            <div style="font-size: 26px; font-weight: 900; color: #003366;">MH</div>
          </td>
          <td class="title-col">
            <h2>KEMENTERIAN KETENAGAKERJAAN REPUBLIK INDONESIA</h2>
            <h3>PROGRAM PEMAGANGAN NASIONAL (MAGANGHUB)</h3>
            <p>Portal Resmi: maganghub.kemnaker.go.id • Dokumentasi Aktivitas Pemagangan</p>
          </td>
        </tr>
      </table>

      <table class="info-table">
        <tr>
          <td style="width: 18%;"><strong>Nama Peserta</strong></td>
          <td style="width: 2%;">:</td>
          <td style="width: 30%;"><strong>${profile.nama}</strong></td>
          <td style="width: 18%;"><strong>Perusahaan Mitra</strong></td>
          <td style="width: 2%;">:</td>
          <td style="width: 30%;"><strong>${profile.perusahaan}</strong></td>
        </tr>
        <tr>
          <td><strong>ID MagangHub</strong></td>
          <td>:</td>
          <td><strong>${profile.idPeserta}</strong></td>
          <td><strong>Posisi Magang</strong></td>
          <td>:</td>
          <td>${profile.posisiMagang}</td>
        </tr>
        <tr>
          <td><strong>Username / Akun</strong></td>
          <td>:</td>
          <td>${profile.username} (${profile.email})</td>
          <td><strong>Periode Laporan</strong></td>
          <td>:</td>
          <td>${periodLabel}</td>
        </tr>
        <tr>
          <td><strong>Institusi Asal</strong></td>
          <td>:</td>
          <td>${profile.institusiAsal} - ${profile.jurusan}</td>
          <td><strong>Penempatan</strong></td>
          <td>:</td>
          <td>${profile.kotaPenempatan || 'Indonesia'}</td>
        </tr>
      </table>

      <table class="logbook-table">
        <thead>
          <tr>
            <th style="width: 4%;">No</th>
            <th style="width: 15%;">Tanggal & Waktu</th>
            <th style="width: 35%;">Uraian Aktivitas Magang</th>
            <th style="width: 23%;">Pelajaran yang Diperoleh</th>
            <th style="width: 13%;">Kendala & Solusi</th>
            <th style="width: 10%;">Status & Eviden</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <div class="summary-box">
        <strong>Ringkasan Aktivitas Logbook MagangHub:</strong>
        <br>
        - Total Catatan Logbook: <strong>${entries.length} data tercatat</strong>
        <br>
        - Akumulasi Waktu Pemagangan: <strong>${formatDuration(totalMenit)} (${totalJam} Jam)</strong>
      </div>

      <table class="signature-table">
        <tr>
          <td></td>
          <td>
            ${profile.kotaPenempatan || 'Makassar'}, ${formatIndonesianDate(new Date().toISOString().slice(0, 10), false)}<br>
            <strong>Peserta Pemagangan Nasional</strong><br>
            Program MagangHub Kemnaker RI
            <div class="sig-space"></div>
            <strong><u>${profile.nama}</u></strong><br>
            ID MagangHub: ${profile.idPeserta}
          </td>
        </tr>
      </table>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
