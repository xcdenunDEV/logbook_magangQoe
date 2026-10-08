import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Copy, 
  Calendar, 
  Check, 
  FileSpreadsheet,
  GraduationCap
} from 'lucide-react';
import { LogbookEntry, PesertaProfile } from '../types';
import { formatDuration, formatIndonesianDate, NAMA_BULAN } from '../utils/dateUtils';
import { printOfficialLogbookReport } from '../utils/pdfExport';
import { GoogleWorkspaceService } from '../services/googleWorkspace';

interface ExportPreviewModalProps {
  entries: LogbookEntry[];
  profile: PesertaProfile;
}

export const ExportPreviewModal: React.FC<ExportPreviewModalProps> = ({
  entries,
  profile
}) => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [copied, setCopied] = useState<boolean>(false);

  const filteredEntries = useMemo(() => {
    return entries.filter(item => {
      const [year, month] = item.tanggal.split('-');
      return parseInt(year, 10) === selectedYear && parseInt(month, 10) === selectedMonth;
    }).sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
  }, [entries, selectedMonth, selectedYear]);

  const totalMinutes = useMemo(() => {
    return filteredEntries.reduce((acc, curr) => acc + (curr.durasiMenit || 0), 0);
  }, [filteredEntries]);

  const periodLabel = `${NAMA_BULAN[selectedMonth - 1]} ${selectedYear}`;

  const handlePrint = () => {
    printOfficialLogbookReport(filteredEntries, profile, periodLabel);
  };

  const handleDownloadCsv = () => {
    GoogleWorkspaceService.downloadCsv(
      filteredEntries, 
      profile, 
      `Laporan_MagangHub_Kemnaker_${profile.nama.replace(/\s+/g, '_')}_${periodLabel.replace(' ', '_')}.csv`
    );
  };

  const handleCopyText = () => {
    const text = GoogleWorkspaceService.copyFormattedSummary(filteredEntries, profile, periodLabel);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Control bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-sky-700" />
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Pratinjau & Ekspor Laporan Resmi MagangHub Kemnaker
            </h2>
            <p className="text-xs text-slate-500">
              Format baku laporan aktivitas pemagangan nasional siap cetak dan tanda tangan mentor
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
          >
            {NAMA_BULAN.map((bulan, idx) => (
              <option key={bulan} value={idx + 1}>
                {bulan}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>

          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Unduh CSV</span>
          </button>

          <button
            onClick={handleCopyText}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            <span className="hidden sm:inline">{copied ? 'Tersalin' : 'Salin Teks'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[#003B73] hover:bg-sky-800 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Sheet Document Preview */}
      <div className="bg-slate-100 p-4 sm:p-8 rounded-2xl border border-slate-200 shadow-inner flex justify-center overflow-x-auto">
        <div className="bg-white w-full max-w-4xl p-8 sm:p-12 rounded-xl shadow-md border border-slate-200 text-slate-900 font-sans">
          {/* Header Kop Surat Kemnaker */}
          <div className="border-b-2 border-slate-900 pb-3 mb-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#003B73] text-white flex items-center justify-center font-extrabold text-lg shrink-0">
              MH
            </div>
            <div className="text-center flex-1">
              <h2 className="text-xs sm:text-sm font-extrabold tracking-wider uppercase text-[#003B73]">
                KEMENTERIAN KETENAGAKERJAAN REPUBLIK INDONESIA
              </h2>
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                PROGRAM PEMAGANGAN NASIONAL - MAGANGHUB
              </h3>
              <p className="text-[10px] text-slate-600 mt-0.5">
                Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas (Binalavotas)
              </p>
              <p className="text-[9px] text-slate-500 font-mono">
                Portal Resmi: maganghub.kemnaker.go.id | Terintegrasi Sistem Informasi Ketenagakerjaan (SIAPKerja)
              </p>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center mb-6">
            <h1 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-slate-900">
              LAPORAN AKTIVITAS HARIAN PESERTA MAGANG
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Periode Laporan: <strong>{periodLabel}</strong>
            </p>
          </div>

          {/* Metadata Peserta & Perusahaan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-xs mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500">Nama Peserta:</span>{' '}
              <strong className="text-slate-900">{profile.nama}</strong>
            </div>
            <div>
              <span className="text-slate-500">Perusahaan Mitra:</span>{' '}
              <strong className="text-slate-900">{profile.perusahaan}</strong>
            </div>
            <div>
              <span className="text-slate-500">ID MagangHub:</span>{' '}
              <strong className="font-mono text-blue-700">{profile.idPeserta}</strong>
            </div>
            <div>
              <span className="text-slate-500">Divisi / Posisi:</span>{' '}
              <strong>{profile.posisiMagang} ({profile.divisi})</strong>
            </div>
            <div>
              <span className="text-slate-500">Email Akun Google:</span>{' '}
              <strong className="font-mono">{profile.email}</strong>
            </div>
            <div>
              <span className="text-slate-500">Mentor Perusahaan:</span>{' '}
              <strong>{profile.namaMentor}</strong> ({profile.jabatanMentor})
            </div>
            <div>
              <span className="text-slate-500">Institusi Asal:</span>{' '}
              <strong>{profile.institusiAsal}</strong> - {profile.jurusan}
            </div>
            <div>
              <span className="text-slate-500">Lokasi Penempatan:</span>{' '}
              <strong>{profile.lokasiMagang}</strong>
            </div>
          </div>

          {/* Table */}
          {filteredEntries.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-500">
              Tidak ada data laporan aktivitas magang pada periode {periodLabel}.
            </div>
          ) : (
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left border-collapse text-[11px] border border-slate-300">
                <thead>
                  <tr className="bg-[#003B73] text-white text-center font-bold">
                    <th className="p-2 border border-slate-300 w-8">No</th>
                    <th className="p-2 border border-slate-300 w-28">Tanggal & Waktu</th>
                    <th className="p-2 border border-slate-300">Uraian Aktivitas (Min. 100 Karakter)</th>
                    <th className="p-2 border border-slate-300 w-44">Pelajaran yang Diperoleh</th>
                    <th className="p-2 border border-slate-300 w-36">Kendala & Solusi</th>
                    <th className="p-2 border border-slate-300 w-20">Validasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {filteredEntries.map((item, idx) => (
                    <tr key={item.id} className="border-b border-slate-300">
                      <td className="p-2 border border-slate-300 text-center font-mono">{idx + 1}</td>
                      <td className="p-2 border border-slate-300">
                        <div className="font-bold">{formatIndonesianDate(item.tanggal, false)}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.jamMulai} - {item.jamSelesai}</div>
                        <div className="text-[10px] font-semibold text-sky-800">{formatDuration(item.durasiMenit)}</div>
                      </td>
                      <td className="p-2 border border-slate-300">
                        <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-800 inline-block mb-1">
                          {item.kategori}
                        </span>
                        <div className="leading-relaxed">{item.uraianAktivitas}</div>
                      </td>
                      <td className="p-2 border border-slate-300 leading-relaxed">
                        {item.pelajaranDiperoleh}
                      </td>
                      <td className="p-2 border border-slate-300 leading-relaxed">
                        {item.kendalaDihadapi}
                      </td>
                      <td className="p-2 border border-slate-300 text-center uppercase font-bold text-[10px]">
                        <span className="text-emerald-700">
                          {item.statusKegiatan}
                        </span>
                        <div className="text-[9px] text-slate-500 font-normal mt-0.5">
                          {item.fotoDokumentasi?.length ? `📷 ${item.fotoDokumentasi.length} Foto` : 'Tanpa Foto'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Ringkasan Durasi */}
          <div className="text-xs space-y-1 mb-8 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="font-bold text-slate-900">Ringkasan Aktivitas Pemagangan:</div>
            <div>- Jumlah Hari / Catatan: <strong>{filteredEntries.length} data tercatat</strong></div>
            <div>- Akumulasi Waktu Pemagangan: <strong>{formatDuration(totalMinutes)} ({(totalMinutes / 60).toFixed(1)} Jam)</strong></div>
          </div>

          {/* Tanda Tangan */}
          <div className="grid grid-cols-2 gap-8 text-center text-xs mt-10">
            <div></div>
            <div>
              <div>{profile.kotaPenempatan || 'Makassar'}, {formatIndonesianDate(new Date().toISOString().slice(0, 10), false)}</div>
              <div>Peserta Program Pemagangan Nasional,</div>
              <div className="text-slate-600">MagangHub Kemnaker RI</div>
              <div className="h-16"></div>
              <div className="font-bold underline">{profile.nama}</div>
              <div className="font-mono">ID: {profile.idPeserta}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPreviewModal;
