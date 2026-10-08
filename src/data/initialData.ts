import { AdminIntegrationConfig, AppUser, LogbookEntry, PresetAktivitasMagang } from '../types';

export const INITIAL_USERS: AppUser[] = [
  {
    username: 'ainunnn',
    password: 'password123',
    name: 'Muhammad Ainun Anwar',
    role: 'admin',
    email: 'ainun.anwar@maganghub.kemnaker.go.id',
    idPeserta: 'MH-2026-ADM01',
    institusiAsal: 'Universitas Hasanuddin',
    jurusan: 'Teknik Informatika & Sistem Informasi',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=256',
    createdAt: '2026-08-01T08:00:00Z'
  },
  {
    username: 'ayuazhara',
    password: 'password123',
    name: 'Ayu Azhara',
    role: 'user',
    email: 'ayu.azhara@maganghub.kemnaker.go.id',
    idPeserta: 'MH-2026-USR02',
    institusiAsal: 'Universitas Negeri Makassar',
    jurusan: 'Pendidikan Teknologi Informasi',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256',
    createdAt: '2026-08-01T08:00:00Z'
  },
  {
    username: 'aliyah',
    password: 'password123',
    name: 'Aliyah Meilidya',
    role: 'user',
    email: 'aliyah.meilidya@maganghub.kemnaker.go.id',
    idPeserta: 'MH-2026-USR03',
    institusiAsal: 'Politeknik Negeri Ujung Pandang',
    jurusan: 'Teknik Komputer & Jaringan',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=256',
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
    judul: 'Eksplorasi Data & Pembersihan Dataset (Data Cleaning)',
    kategori: 'Teknis / Proyek Utama',
    uraianTemplate: 'Melakukan pembersihan data mentah (data cleansing) dari sistem penjualan regional, menangani missing values dan duplikasi data sebanyak 12.000 baris menggunakan Python (Pandas) serta menyusun format standar untuk visualisasi dashboard.',
    pelajaranTemplate: 'Memahami teknik imputasi missing data yang tepat menggunakan nilai median dan modus sesuai distribusi data, serta pentingnya validasi tipe data sebelum diimpor ke data warehouse agar tidak menimbulkan anomali.',
    kendalaTemplate: 'Ditemukan inkonsistensi penamaan kategori produk dari beberapa cabang daerah, yang berhasil diatasi dengan membuat kamus pemetaan otomatis (dictionary mapping) di dalam skrip data pipeline.',
    durasiMenitDefault: 240
  },
  {
    judul: 'Pembuatan Dashboard Interaktif Business Intelligence',
    kategori: 'Teknis / Proyek Utama',
    uraianTemplate: 'Membangun dashboard analitik performa operasional mingguan pada platform BI, mengonfigurasi filter interaktif, metrik KPI pertumbuhan transaksi, serta menyelaraskan visualisasi grafik agar mudah dipahami oleh tim manajemen.',
    pelajaranTemplate: 'Mempelajari prinsip desain visualisasi data yang efektif (Data Storytelling), penggunaan palet warna yang ramah pembaca, serta optimasi query agregasi database agar dashboard dapat dimuat dengan cepat di bawah 2 detik.',
    kendalaTemplate: 'Query perhitungan running total sempat berjalan lambat karena beban tabel transaksi yang besar, kendala diselesaikan setelah mentor menyarankan pembuatan indeks khusus pada kolom tanggal transaksi.',
    durasiMenitDefault: 270
  },
  {
    judul: 'Daily Standup & Rapat Koordinasi Tim Proyek',
    kategori: 'Koordinasi & Rapat Tim',
    uraianTemplate: 'Mengikuti pertemuan koordinasi harian bersama tim pengembang dan mentor, memaparkan kemajuan modul visualisasi yang telah diselesaikan, mendiskusikan prioritas tugas harian, dan mencatat arahan perbaikan spesifikasi teknis.',
    pelajaranTemplate: 'Meningkatkan keterampilan komunikasi profesional dalam menyampaikan progres kerja secara ringkas menggunakan kerangka Scrum (apa yang telah selesai, kendala, dan apa yang akan dikerjakan berikutnya).',
    kendalaTemplate: 'Penyesuaian timeline kerja karena adanya perubahan mendadak pada struktur data dari klien eksternal, diselesaikan dengan menyepakati penyesuaian backlog sprint bersama scrum master.',
    durasiMenitDefault: 120
  },
  {
    judul: 'Riset Literatur & Pembelajaran Mandiri Framework Baru',
    kategori: 'Pelatihan & Pembelajaran Mandiri',
    uraianTemplate: 'Mempelajari dokumentasi resmi arsitektur REST API dan integrasi modul otentikasi OAuth2 dari Kemnaker serta menguji fungsionalitas simulasi endpoint menggunakan Postman sesuai arahan mentor magang.',
    pelajaranTemplate: 'Memahami secara mendalam alur pertukaran token otorisasi Bearer, penanganan status HTTP response yang aman, dan implementasi refresh token untuk menjaga sesi pengguna tetap aktif tanpa login berulang.',
    kendalaTemplate: 'Sempat mengalami kendala pembatasan CORS saat melakukan pengetesan di browser lokal, namun berhasil diatasi setelah melakukan konfigurasi proxy lokal pada file pengaturan development server.',
    durasiMenitDefault: 180
  },
  {
    judul: 'Penyusunan Dokumentasi Teknis & Laporan Mingguan',
    kategori: 'Dokumentasi & Administrasi',
    uraianTemplate: 'Menyusun dokumen panduan penggunaan sistem (User Manual) dan ringkasan dokumentasi teknis API yang telah dibuat sepanjang minggu ini untuk kebutuhan serah terima dan tinjauan berkala mentor industri.',
    pelajaranTemplate: 'Mengenal standar penulisan dokumentasi teknis yang terstruktur sesuai kaidah industri perangkat lunak, mencakup diagram alur proses, penjelasan parameter request-response, dan panduan troubleshooting umum.',
    kendalaTemplate: 'Format diagram alur sebelumnya kurang baku sehingga sulit dibaca tim non-teknis, diselesaikan dengan memperbarui bagan menggunakan standar notasi BPMN yang lebih universal.',
    durasiMenitDefault: 150
  }
];

export const INITIAL_LOGBOOK_ENTRIES: LogbookEntry[] = [
  {
    id: 'log-ainun-001',
    username: 'ainunnn',
    namaPenulis: 'Muhammad Ainun Anwar',
    tipeLogbook: 'harian',
    tanggal: '2026-09-28',
    jamMulai: '08:00',
    jamSelesai: '16:30',
    durasiMenit: 450,
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
  },
  {
    id: 'log-ayu-001',
    username: 'ayuazhara',
    namaPenulis: 'Ayu Azhara',
    tipeLogbook: 'harian',
    tanggal: '2026-09-29',
    jamMulai: '08:00',
    jamSelesai: '16:00',
    durasiMenit: 420,
    kategori: 'Riset & Analisis',
    uraianAktivitas: 'Merancang arsitektur dashboard visualisasi analitik performa operasional mingguan pada platform PowerBI, menyusun metrik KPI retensi pengguna, dan menghubungkan data pipeline yang telah dibersihkan pada sesi sebelumnya.',
    pelajaranDiperoleh: 'Memahami konsep Data Modeling tipe Star Schema (tabel fakta dan tabel dimensi) yang mempermudah proses slicing dan dicing data analitik secara interaktif.',
    kendalaDihadapi: 'Koneksi ke server database pengujian sempat mengalami timeout, diselesaikan setelah koordinasi dengan tim devops untuk pembukaan port.',
    fotoDokumentasi: [
      {
        id: 'foto-2',
        name: 'dashboard-preview-ayu.jpg',
        size: 215000,
        type: 'image/jpeg',
        dataUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600',
        driveFileUrl: 'https://drive.google.com/file/d/2example_foto_ayu/view',
        uploadedAt: '2026-09-29T16:10:00Z'
      }
    ],
    linkEviden: 'https://drive.google.com/drive/folders/maganghub-dashboard-eviden',
    statusKegiatan: 'selesai',
    isSyncedToSheet: false,
    createdAt: '2026-09-29T08:00:00Z',
    updatedAt: '2026-09-29T16:10:00Z'
  },
  {
    id: 'log-aliyah-001',
    username: 'aliyah',
    namaPenulis: 'Aliyah Meilidya',
    tipeLogbook: 'mingguan',
    tanggal: '2026-09-25',
    tanggalSelesai: '2026-09-29',
    durasiMenit: 2100,
    kategori: 'Teknis / Proyek Utama',
    uraianAktivitas: 'Rekapitulasi aktivitas minggu ke-8: Menyelesaikan implementasi modul integrasi API autentikasi, melakukan stress testing beban jaringan pada 500 concurrent request, dan menyusun laporan audit keamanan endpoint.',
    pelajaranDiperoleh: 'Memahami optimasi throughput server, caching response menggunakan Redis, dan penanganan exception handling yang rapi pada service layer.',
    kendalaDihadapi: 'Lonjakan penggunaan CPU saat stress testing diatasi dengan mengaktifkan clustering instance Node.js.',
    fotoDokumentasi: [
      {
        id: 'foto-3',
        name: 'stress-test-benchmark.png',
        size: 180000,
        type: 'image/png',
        dataUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=600',
        driveFileUrl: 'https://drive.google.com/file/d/3example_foto_aliyah/view',
        uploadedAt: '2026-09-29T17:00:00Z'
      }
    ],
    linkEviden: 'https://github.com/maganghub/network-benchmark',
    statusKegiatan: 'selesai',
    isSyncedToSheet: false,
    createdAt: '2026-09-29T17:00:00Z',
    updatedAt: '2026-09-29T17:00:00Z'
  }
];
