import { AdminIntegrationConfig, AppUser, LogbookEntry, PresetAktivitasMagang } from '../types';

export const INITIAL_USERS: AppUser[] = [
  {
    username: 'ainunnn',
    password: 'password123',
    name: 'Muhammad Ainun Anwar',
    role: 'admin',
    email: '',
    institusiAsal: '',
    jurusan: '',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=256',
    createdAt: '2026-08-01T08:00:00Z'
  }
];

export const INITIAL_INTEGRATION_CONFIG: AdminIntegrationConfig = {
  sheetUrl: '',
  sheetId: '',
  sheetTabName: 'Rekap Logbook Magang',
  sheetWebhookUrl: '', // Opsional Google Apps Script Webhook
  driveFolderUrl: '',
  driveFolderId: '',
  autoSyncEnabled: true,
  lastGlobalSync: ''
};

export const PRESET_AKTIVITAS_MAGANG: PresetAktivitasMagang[] = [
  {
    judul: 'Pengolahan & Validasi Data Statistik (BPS)',
    kategori: 'Teknis / Proyek Utama',
    uraianTemplate: 'Melakukan pemeriksaan kelengkapan, pembersihan, dan validasi tabulasi data hasil survei statistik di Badan Pusat Statistik Kota Parepare menggunakan spreadsheet dan perangkat pengolahan data untuk memastikan konsistensi antarvariabel sebelum tahap kompilasi.',
    pelajaranTemplate: 'Memahami alur verifikasi dan validasi kualitas data statistik resmi, teknik pengecekan anomali angka secara sistematis, serta pentingnya ketelitian dalam menjaga akurasi indikator daerah.',
    kendalaTemplate: 'Terdapat beberapa isian kuesioner yang format penulisannya belum seragam sehingga memerlukan pengecekan ulang terhadap dokumen sumber, berhasil diselesaikan dengan koordinasi bersama pembimbing lapangan.',
    durasiMenitDefault: 420
  },
  {
    judul: 'Penyusunan Infografis & Publikasi Data Daerah',
    kategori: 'Desain & Kreatif',
    uraianTemplate: 'Merancang bahan visualisasi infografis dan menyusun draf tabel publikasi indikator statistik bulanan agar informasi data mudah dipahami oleh masyarakat dan pemangku kepentingan di lingkungan Kota Parepare.',
    pelajaranTemplate: 'Mempelajari prinsip penyajian data visual (data storytelling) yang informatif, pemilihan jenis grafik yang tepat untuk setiap karakteristik data, serta standar tata letak publikasi resmi instansi.',
    kendalaTemplate: 'Penyesuaian proporsi teks dan grafik pada ruang desain yang terbatas agar tetap terbaca jelas, diatasi dengan menyederhanakan ringkasan poin utama dan mengelompokkan indikator sejenis.',
    durasiMenitDefault: 360
  },
  {
    judul: 'Eksplorasi Data & Pembersihan Dataset (Data Cleaning)',
    kategori: 'Riset & Analisis',
    uraianTemplate: 'Melakukan pembersihan data mentah (data cleansing) dari basis data operasional, menangani nilai kosong (missing values) dan duplikasi baris menggunakan Python/Excel serta menyusun format tabel terstruktur siap analisis.',
    pelajaranTemplate: 'Memahami teknik pembersihan data tabular yang efektif, standardisasi format tanggal dan kode wilayah, serta pentingnya dokumentasi langkah pengolahan data agar mudah ditelusuri kembali.',
    kendalaTemplate: 'Ditemukan inkonsistensi penamaan kategori pada beberapa berkas lama, yang berhasil diatasi dengan membuat tabel pemetaan standar secara otomatis.',
    durasiMenitDefault: 300
  },
  {
    judul: 'Rapat Koordinasi & Evaluasi Progres Kerja Tim',
    kategori: 'Koordinasi & Rapat Tim',
    uraianTemplate: 'Mengikuti pertemuan koordinasi rutin bersama tim unit kerja dan pembimbing magang, memaparkan progres penugasan yang telah diselesaikan, mendiskusikan prioritas target mingguan, serta mencatat arahan perbaikan teknis.',
    pelajaranTemplate: 'Meningkatkan keterampilan komunikasi profesional di lingkungan instansi pemerintah, cara menyampaikan laporan progres secara ringkas dan jelas, serta memahami pembagian peran antarbagian.',
    kendalaTemplate: 'Penyesuaian jadwal target karena adanya prioritas kegiatan mendadak di unit kerja, diselesaikan dengan menyusun ulang daftar prioritas tugas bersama pembimbing.',
    durasiMenitDefault: 180
  },
  {
    judul: 'Pelayanan Informasi, Pengarsipan & Administrasi',
    kategori: 'Dokumentasi & Administrasi',
    uraianTemplate: 'Membantu pengelolaan dokumen administrasi harian, pengarsipan berkas kegiatan secara digital maupun fisik, serta penyusunan rekapitulasi laporan operasional mingguan sesuai tata naskah dinas yang berlaku.',
    pelajaranTemplate: 'Mengenal standar pengarsipan dokumen yang rapi dan sistematis, alur administrasi perkantoran, serta disiplin pencatatan evidensi kegiatan kerja.',
    kendalaTemplate: 'Sebagian berkas arsip lama belum memiliki penamaan file yang seragam sehingga memerlukan waktu penelusuran ekstra, diatasi dengan menerapkan format penamaan folder dan file yang baku.',
    durasiMenitDefault: 300
  }
];

export const INITIAL_LOGBOOK_ENTRIES: LogbookEntry[] = [
  {
    id: 'log-ainun-001',
    username: 'ainunnn',
    namaPenulis: 'Muhammad Ainun Anwar',
    tipeLogbook: 'harian',
    tanggal: '2026-09-28',
    jamMulai: '07:30',
    jamSelesai: '16:00',
    durasiMenit: 510,
    kategori: 'Teknis / Proyek Utama',
    uraianAktivitas: 'Melakukan analisis kebutuhan data dan pembersihan awal (data preprocessing) pada basis data transaksi mitra kerja menggunakan pustaka Pandas di Python, mengidentifikasi anomali duplikasi baris dan merapikan kolom tanggal serta format mata uang.',
    pelajaranDiperoleh: 'Mempelajari cara menangani missing data pada dataset tabular besar dengan metode interpolasi linier, serta memahami pentingnya validasi skema data sebelum proses pengolahan lebih lanjut.',
    kendalaDihadapi: 'Terdapat format tanggal yang tidak seragam pada file log lama dari tahun sebelumnya. Berhasil diselesaikan dengan membuat fungsi regex parsing.',
    fotoDokumentasi: [
      {
        id: 'foto-1',
        name: 'dokumentasi-data-cleaning.png',
        size: 142000,
        type: 'image/png',
        dataUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600',
        driveFileUrl: 'https://drive.google.com/file/d/1example_foto_ainun/view',
        uploadedAt: '2026-09-28T16:35:00Z'
      }
    ],
    linkEviden: 'https://github.com/maganghub/project-analytics-pipeline',
    statusKegiatan: 'selesai',
    isSyncedToSheet: false,
    createdAt: '2026-09-28T08:00:00Z',
    updatedAt: '2026-09-28T16:35:00Z'
  }
];
