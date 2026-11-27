import { LogbookEntry, PesertaProfile } from '../types';
import { formatDuration, formatIndonesianDate, getTodayString, isStandardWorkday } from './dateUtils';

function escapeHtml(value: string | undefined | null): string {
  if (!value) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getInitials(name?: string, username?: string): string {
  const source = (name || username || 'LB').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function printOfficialLogbookReport(
  entries: LogbookEntry[],
  profile: PesertaProfile,
  periodLabel: string
): boolean {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    return false;
  }

  const totalMenit = entries.reduce((acc, curr) => acc + (curr.durasiMenit || 0), 0);
  const totalJam = (totalMenit / 60).toFixed(1);
  const totalPhotos = entries.reduce((acc, curr) => acc + (curr.fotoDokumentasi?.length || 0), 0);
  const entriesWithPhotos = entries.filter(e => (e.fotoDokumentasi?.length || 0) > 0).length;
  const nonWorkdayCount = entries.filter(e => e.isDiluarHariKerja || !isStandardWorkday(e.tanggal)).length;
  const workdayCount = entries.length - nonWorkdayCount;

  const initials = escapeHtml(getInitials(profile.nama, profile.username));
  const displayName = escapeHtml(profile.nama || profile.username || 'Peserta Magang');
  const displayLokasi = escapeHtml(profile.perusahaan || profile.lokasiMagang || '-');
  const displayPosisi = escapeHtml(
    `${profile.posisiMagang || '-'}${profile.divisi ? ` · ${profile.divisi}` : ''}`
  );
  const displayInstitusi = escapeHtml(
    `${profile.institusiAsal || '-'}${profile.jurusan ? ` (${profile.jurusan})` : ''}`
  );
  const todayFormatted = formatIndonesianDate(getTodayString(), false);

  const activityCardsHtml = entries.length === 0
    ? `<div class="empty-box">Belum ada catatan aktivitas magang untuk periode <strong>${escapeHtml(periodLabel)}</strong>.</div>`
    : entries.map((e, idx) => {
        const numberLabel = String(idx + 1).padStart(2, '0');
        const periode = e.tipeLogbook === 'mingguan'
          ? `${formatIndonesianDate(e.tanggal, true)} s.d. ${formatIndonesianDate(e.tanggalSelesai || e.tanggal, true)}`
          : formatIndonesianDate(e.tanggal, true);
        const isLuarHariKerja = Boolean(e.isDiluarHariKerja) || !isStandardWorkday(e.tanggal);
        const photos = e.fotoDokumentasi || [];

        const photosSection = photos.length > 0
          ? `
            <div class="photo-section">
              <div class="photo-section-header">
                <span class="photo-badge-yes">📷 Dokumentasi Foto (${photos.length} Lampiran)</span>
              </div>
              <div class="photo-grid ${photos.length === 1 ? 'photo-grid-single' : photos.length === 2 ? 'photo-grid-two' : 'photo-grid-three'}">
                ${photos.map((photo, pIdx) => `
                  <div class="photo-card">
                    <div class="photo-frame">
                      <img src="${photo.dataUrl}" alt="${escapeHtml(photo.name || `Foto ${pIdx + 1}`)}" />
                    </div>
                    <div class="photo-caption">${escapeHtml(photo.name || `Dokumentasi ${pIdx + 1}`)}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          `
          : `
            <div class="photo-empty-strip">
              <span class="photo-badge-no">📷 Status Dokumentasi: Tidak ada foto yang dilampirkan pada kegiatan ini</span>
            </div>
          `;

        return `
          <article class="activity-card">
            <div class="card-header">
              <div class="card-header-left">
                <span class="entry-index">#${numberLabel}</span>
                <div>
                  <div class="entry-date">${escapeHtml(periode)}</div>
                  <div class="entry-meta">
                    <span>${escapeHtml(e.jamMulai || '07:30')} – ${escapeHtml(e.jamSelesai || '16:00')}</span>
                    <span class="dot">•</span>
                    <strong>${escapeHtml(formatDuration(e.durasiMenit))}</strong>
                  </div>
                </div>
              </div>
              <div class="card-badges">
                <span class="badge badge-type">${escapeHtml(e.tipeLogbook.toUpperCase())}</span>
                <span class="badge badge-cat">${escapeHtml(e.kategori)}</span>
                <span class="badge ${e.statusKegiatan === 'selesai' ? 'badge-done' : 'badge-prog'}">${escapeHtml(e.statusKegiatan === 'selesai' ? 'Selesai' : 'Dalam Proses')}</span>
                ${isLuarHariKerja ? `<span class="badge badge-outside">Luar Hari Kerja${e.alasanLuarHariKerja ? `: ${escapeHtml(e.alasanLuarHariKerja)}` : ''}</span>` : ''}
              </div>
            </div>

            <div class="card-body">
              <div class="section-block">
                <div class="section-label">Uraian Aktivitas</div>
                <p class="section-text">${escapeHtml(e.uraianAktivitas)}</p>
              </div>

              <div class="two-col-grid">
                <div class="callout-box callout-learn">
                  <div class="section-label">Pelajaran &amp; Kompetensi Diperoleh</div>
                  <p class="section-text">${escapeHtml(e.pelajaranDiperoleh) || '—'}</p>
                </div>
                <div class="callout-box callout-issue">
                  <div class="section-label">Kendala &amp; Solusi</div>
                  <p class="section-text">${escapeHtml(e.kendalaDihadapi) || 'Tidak ada kendala berarti selama pelaksanaan kegiatan.'}</p>
                </div>
              </div>

              ${e.linkEviden ? `
                <div class="eviden-strip">
                  <span class="eviden-label">Tautan Eviden:</span>
                  <span class="eviden-url">${escapeHtml(e.linkEviden)}</span>
                </div>
              ` : ''}

              ${photosSection}
            </div>
          </article>
        `;
      }).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Portofolio &amp; Logbook Aktivitas Magang - ${displayName}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 12mm 14mm 12mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Arial, sans-serif;
          font-size: 11px;
          line-height: 1.45;
          color: #0f172a;
          background: #ffffff;
          margin: 0;
          padding: 0;
        }
        .masthead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 16px 18px;
          border-radius: 12px;
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
          color: #ffffff;
          margin-bottom: 14px;
        }
        .masthead-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .monogram {
          width: 46px;
          height: 46px;
          border-radius: 11px;
          background: rgba(255, 255, 255, 0.14);
          border: 1.5px solid rgba(255, 255, 255, 0.28);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 16px;
          letter-spacing: 0.5px;
          color: #ffffff;
          flex-shrink: 0;
        }
        .eyebrow {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.4px;
          text-transform: uppercase;
          color: #93c5fd;
          margin-bottom: 2px;
        }
        .masthead h1 {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: -0.2px;
          color: #ffffff;
        }
        .masthead-sub {
          margin-top: 2px;
          font-size: 11px;
          color: #cbd5e1;
        }
        .period-pill {
          text-align: right;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.22);
          padding: 7px 12px;
          border-radius: 9px;
          flex-shrink: 0;
        }
        .period-pill-label {
          font-size: 8.5px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #93c5fd;
          font-weight: 700;
        }
        .period-pill-value {
          font-size: 11px;
          font-weight: 700;
          color: #ffffff;
          margin-top: 1px;
        }

        .profile-panel {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px 18px;
          padding: 12px 14px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          margin-bottom: 12px;
        }
        .profile-item-label {
          font-size: 9.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
        }
        .profile-item-value {
          font-size: 11.5px;
          font-weight: 600;
          color: #0f172a;
          margin-top: 1px;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }
        .kpi-card {
          border: 1px solid #e2e8f0;
          border-radius: 9px;
          padding: 9px 11px;
          background: #ffffff;
        }
        .kpi-label {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
        }
        .kpi-val {
          font-size: 15px;
          font-weight: 800;
          color: #0f172a;
          margin-top: 2px;
        }
        .kpi-sub {
          font-size: 9.5px;
          color: #64748b;
          margin-top: 1px;
        }

        .section-heading {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #334155;
          margin: 0 0 10px 0;
          padding-bottom: 5px;
          border-bottom: 1.5px solid #e2e8f0;
        }

        .activity-card {
          border: 1px solid #cbd5e1;
          border-left: 4px solid #1e3a5f;
          border-radius: 10px;
          background: #ffffff;
          margin-bottom: 12px;
          overflow: hidden;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 13px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        .card-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .entry-index {
          background: #1e3a5f;
          color: #ffffff;
          font-weight: 800;
          font-size: 11px;
          padding: 4px 7px;
          border-radius: 6px;
          font-family: ui-monospace, SFMono-Regular, monospace;
        }
        .entry-date {
          font-size: 12px;
          font-weight: 800;
          color: #0f172a;
        }
        .entry-meta {
          font-size: 10px;
          color: #475569;
          margin-top: 1px;
        }
        .dot {
          margin: 0 4px;
          color: #94a3b8;
        }
        .card-badges {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 4px;
        }
        .badge {
          font-size: 9px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 5px;
          border: 1px solid transparent;
        }
        .badge-type {
          background: #e2e8f0;
          color: #334155;
        }
        .badge-cat {
          background: #eff6ff;
          color: #1d4ed8;
          border-color: #bfdbfe;
        }
        .badge-done {
          background: #ecfdf5;
          color: #047857;
          border-color: #a7f3d0;
        }
        .badge-prog {
          background: #fefce8;
          color: #a16207;
          border-color: #fde68a;
        }
        .badge-outside {
          background: #fffbeb;
          color: #b45309;
          border-color: #fcd34d;
        }

        .card-body {
          padding: 11px 13px;
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .section-block {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .section-label {
          font-size: 9.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: #475569;
        }
        .section-text {
          margin: 0;
          font-size: 10.8px;
          color: #1e293b;
          white-space: pre-line;
        }
        .two-col-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .callout-box {
          padding: 8px 10px;
          border-radius: 7px;
          border: 1px solid #e2e8f0;
        }
        .callout-learn {
          background: #f0f9ff;
          border-color: #bae6fd;
        }
        .callout-issue {
          background: #f8fafc;
          border-color: #e2e8f0;
        }
        .eviden-strip {
          font-size: 10px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 5px 9px;
          border-radius: 6px;
          color: #334155;
        }
        .eviden-label {
          font-weight: 700;
          margin-right: 4px;
        }
        .eviden-url {
          color: #0369a1;
          word-break: break-all;
        }

        .photo-section {
          margin-top: 2px;
          padding: 9px;
          border-radius: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .photo-section-header {
          margin-bottom: 7px;
        }
        .photo-badge-yes {
          font-size: 10px;
          font-weight: 700;
          color: #0369a1;
        }
        .photo-grid {
          display: grid;
          gap: 8px;
        }
        .photo-grid-single {
          grid-template-columns: minmax(0, 260px);
        }
        .photo-grid-two {
          grid-template-columns: repeat(2, 1fr);
        }
        .photo-grid-three {
          grid-template-columns: repeat(3, 1fr);
        }
        .photo-card {
          border: 1px solid #cbd5e1;
          border-radius: 7px;
          overflow: hidden;
          background: #ffffff;
        }
        .photo-frame {
          width: 100%;
          height: 135px;
          background: #e2e8f0;
          overflow: hidden;
        }
        .photo-frame img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .photo-caption {
          padding: 4px 7px;
          font-size: 9px;
          color: #475569;
          font-family: ui-monospace, SFMono-Regular, monospace;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          border-top: 1px solid #e2e8f0;
        }
        .photo-empty-strip {
          padding: 6px 10px;
          border-radius: 7px;
          border: 1px dashed #cbd5e1;
          background: #f8fafc;
        }
        .photo-badge-no {
          font-size: 10px;
          color: #64748b;
          font-style: italic;
        }

        .empty-box {
          padding: 28px;
          text-align: center;
          border: 1px dashed #cbd5e1;
          border-radius: 10px;
          color: #64748b;
          margin-bottom: 16px;
        }

        .closing-footer {
          margin-top: 18px;
          padding-top: 14px;
          border-top: 1.5px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .doc-note {
          font-size: 9.5px;
          color: #64748b;
          max-width: 55%;
        }
        .signature-box {
          text-align: center;
          min-width: 190px;
          font-size: 10.5px;
        }
        .sig-space {
          height: 54px;
        }
      </style>
    </head>
    <body>
      <!-- Personal Portfolio Masthead -->
      <header class="masthead">
        <div class="masthead-left">
          <div class="monogram">${initials}</div>
          <div>
            <div class="eyebrow">Portofolio &amp; Dokumentasi Magang</div>
            <h1>LAPORAN LOGBOOK AKTIVITAS</h1>
            <div class="masthead-sub">${displayName} · ${displayLokasi}</div>
          </div>
        </div>
        <div class="period-pill">
          <div class="period-pill-label">Periode Laporan</div>
          <div class="period-pill-value">${escapeHtml(periodLabel)}</div>
        </div>
      </header>

      <!-- Participant Information (Tanpa Email & Kota Penempatan) -->
      <section class="profile-panel">
        <div>
          <div class="profile-item-label">Nama Peserta</div>
          <div class="profile-item-value">${displayName}</div>
        </div>
        <div>
          <div class="profile-item-label">Lokasi / Instansi Magang</div>
          <div class="profile-item-value">${displayLokasi}</div>
        </div>
        <div>
          <div class="profile-item-label">Posisi / Divisi</div>
          <div class="profile-item-value">${displayPosisi}</div>
        </div>
        <div>
          <div class="profile-item-label">Institusi Asal</div>
          <div class="profile-item-value">${displayInstitusi}</div>
        </div>
      </section>

      <!-- Executive KPI Strip -->
      <section class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Total Aktivitas</div>
          <div class="kpi-val">${entries.length} <span style="font-size: 10px; font-weight: 600; color: #64748b;">Catatan</span></div>
          <div class="kpi-sub">${workdayCount} hari kerja · ${nonWorkdayCount} luar hari kerja</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Akumulasi Durasi</div>
          <div class="kpi-val">${totalJam} <span style="font-size: 10px; font-weight: 600; color: #64748b;">Jam</span></div>
          <div class="kpi-sub">${escapeHtml(formatDuration(totalMenit))}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Dokumentasi Foto</div>
          <div class="kpi-val">${totalPhotos} <span style="font-size: 10px; font-weight: 600; color: #64748b;">Foto</span></div>
          <div class="kpi-sub">${entriesWithPhotos} dari ${entries.length} kegiatan berfoto</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Tanggal Cetak</div>
          <div class="kpi-val" style="font-size: 12px; margin-top: 4px;">${escapeHtml(todayFormatted)}</div>
          <div class="kpi-sub">Laporan Logbook Pribadi</div>
        </div>
      </section>

      <!-- Activity Cards -->
      <h2 class="section-heading">Rincian Catatan Aktivitas &amp; Dokumentasi</h2>
      ${activityCardsHtml}

      <!-- Closing & Signature -->
      <footer class="closing-footer">
        <div class="doc-note">
          <strong>Catatan Dokumen:</strong> Laporan ini disusun secara pribadi sebagai dokumentasi dan portofolio pelaksanaan kegiatan pemagangan pada ${displayLokasi}.
        </div>
        <div class="signature-box">
          <div>${escapeHtml(todayFormatted)}</div>
          <div style="color: #475569; margin-top: 2px;">Disusun oleh,</div>
          <div class="sig-space"></div>
          <div><strong><u>${displayName}</u></strong></div>
        </div>
      </footer>

      <script>
        (function() {
          var imgs = Array.prototype.slice.call(document.images || []);
          var promises = imgs.map(function(img) {
            if (img.complete) return Promise.resolve();
            return new Promise(function(resolve) {
              img.addEventListener('load', resolve, { once: true });
              img.addEventListener('error', resolve, { once: true });
            });
          });
          Promise.all(promises).then(function() {
            setTimeout(function() {
              window.print();
            }, 250);
          });
        })();
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  return true;
}
