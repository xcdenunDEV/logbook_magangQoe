import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV !== 'production';

app.use(express.json({ limit: '5mb' }));

const GEMINI_MODEL = 'gemini-4-hydrogen';

const DEFAULT_CATEGORIES = [
  'Teknis / Proyek Utama',
  'Riset & Analisis',
  'Desain & Kreatif',
  'Koordinasi & Rapat Tim',
  'Dokumentasi & Administrasi',
  'Operasional Lapangan',
  'Pelatihan & Pembelajaran Mandiri',
];

// Initialize Google GenAI client using current server environment variable
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  try {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
    return null;
  }
}

// Safely parse JSON even if model adds whitespace or markdown fences
function parseJsonSafely<T = Record<string, any>>(rawText?: string): T | null {
  if (!rawText) return null;
  const trimmed = rawText.trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(unfenced) as T;
  } catch {
    const start = unfenced.indexOf('{');
    const end = unfenced.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(unfenced.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

// Clean stray markdown formatting if model accidentally emits bold/bullets
function cleanPlainProse(text?: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/^[-*•]\s+/gm, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Normalize category to an exact item from user's configured categories
function normalizeCategory(candidate: string | undefined, categories: string[], fallback: string): string {
  if (!candidate) return fallback;
  const trimmed = candidate.trim();
  const exact = categories.find((c) => c.toLowerCase() === trimmed.toLowerCase());
  if (exact) return exact;
  const partial = categories.find(
    (c) => c.toLowerCase().includes(trimmed.toLowerCase()) || trimmed.toLowerCase().includes(c.toLowerCase())
  );
  return partial || fallback;
}

// Format actionable Indonesian error messages from Gemini API errors
function mapGeminiError(err: any, fallbackPrefix: string): { status: number; message: string } {
  const status = Number(err?.status || err?.code || 500);
  const rawMsg = String(err?.message || '');
  const upper = rawMsg.toUpperCase();

  if (status === 400 && upper.includes('API_KEY')) {
    return {
      status: 400,
      message: 'API key Gemini tidak valid. Periksa pengaturan API key pada panel Settings > Secrets.',
    };
  }
  if (status === 403 || upper.includes('PERMISSION_DENIED')) {
    return {
      status: 403,
      message: 'Akses ke layanan Gemini ditolak (403). Periksa API key pada panel Settings > Secrets.',
    };
  }
  if (status === 429 || upper.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message: 'Batas permintaan layanan AI sedang penuh (429). Tunggu beberapa detik lalu coba lagi.',
    };
  }
  if (status === 404 || upper.includes('NOT_FOUND')) {
    return {
      status: 404,
      message: 'Model AI yang diminta tidak tersedia. Silakan coba lagi beberapa saat.',
    };
  }

  return {
    status: status >= 400 && status < 600 ? status : 500,
    message: `${fallbackPrefix}: ${rawMsg || 'Terjadi gangguan koneksi ke layanan AI.'}`,
  };
}

// Retry transient upstream errors with short exponential backoff
async function callGeminiWithRetry(
  client: GoogleGenAI,
  params: Parameters<GoogleGenAI['models']['generateContent']>[0],
  maxRetries = 2
) {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await client.models.generateContent(params);
    } catch (err: any) {
      lastError = err;
      const status = Number(err?.status || err?.code || 0);
      const isRetryable =
        status === 0 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
      if (!isRetryable || attempt === maxRetries) {
        throw err;
      }
      const delayMs = 600 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

// API: Default Users Info for MagangHub Kemnaker
app.get('/api/users', (req, res) => {
  res.json({
    users: [
      {
        username: 'ainunnn',
        name: 'Muhammad Ainun Anwar',
        role: 'admin',
        email: '',
        canManageUsers: true,
      },
    ],
    lokasiMagang: 'Badan Pusat Statistik Kota Parepare',
    program: 'Program Pemagangan Nasional Kemnaker RI',
    portal: 'maganghub.kemnaker.go.id',
  });
});

// API: Inline Per-Field AI Refinement for Add/Edit Logbook Form
app.post('/api/gemini/refine-field', async (req, res) => {
  const { field, draft, context, dailyEntries } = req.body || {};

  const allowedFields = ['uraian', 'pelajaran', 'kendala', 'all'];
  if (!field || !allowedFields.includes(field)) {
    return res.status(400).json({
      error: 'Parameter field tidak valid (gunakan uraian, pelajaran, kendala, atau all).',
    });
  }

  const client = getAIClient();
  if (!client) {
    return res.status(503).json({
      error: 'Layanan AI belum dikonfigurasi (GEMINI_API_KEY tidak tersedia di server).',
    });
  }

  const lokasi = context?.perusahaan || context?.lokasiMagang || 'Badan Pusat Statistik Kota Parepare';
  const posisi = context?.posisiMagang || '';
  const divisi = context?.divisi || '';
  const categoriesList: string[] =
    Array.isArray(context?.categories) && context.categories.length > 0
      ? context.categories
      : DEFAULT_CATEGORIES;

  const tipeLogbook = draft?.tipeLogbook === 'mingguan' ? 'mingguan' : 'harian';
  const kategori = draft?.kategori || categoriesList[0];
  const uraian = (draft?.uraianAktivitas || '').trim();
  const pelajaran = (draft?.pelajaranDiperoleh || '').trim();
  const kendala = (draft?.kendalaDihadapi || '').trim();
  const tanggal = draft?.tanggal || '';
  const tanggalSelesai = draft?.tanggalSelesai || '';
  const isDiluarHariKerja = Boolean(draft?.isDiluarHariKerja);

  const weeklyDailyContext =
    tipeLogbook === 'mingguan' && Array.isArray(dailyEntries) && dailyEntries.length > 0
      ? `\nDaftar logbook harian pada minggu ini (${dailyEntries.length} catatan):\n` +
        dailyEntries
          .map(
            (e: any, idx: number) =>
              `${idx + 1}. ${e.tanggal || '-'} [${e.kategori || '-'}]: Uraian="${e.uraianAktivitas || '-'}", Pelajaran="${e.pelajaranDiperoleh || '-'}", Kendala="${e.kendalaDihadapi || '-'}"`
          )
          .join('\n')
      : '';

  const systemInstruction = `Anda adalah asisten penulisan logbook pemagangan di ${lokasi}${posisi ? `, posisi ${posisi}` : ''}${divisi ? `, divisi ${divisi}` : ''}.
Gunakan bahasa Indonesia yang baku, profesional, jelas, dan natural.
Dilarang menggunakan markdown, tanda bintang (**), nomor daftar, atau judul kolom.
Pertahankan seluruh fakta/istilah teknis dari draf pengguna tanpa mengarang angka fiktif.
Tulis 1 paragraf padat dan siap tempel (sekitar 130–300 karakter untuk harian, atau 220–450 karakter untuk mingguan).`;

  try {
    if (field === 'all') {
      const promptText = `Sempurnakan seluruh isi logbook ${tipeLogbook} berikut agar selaras antarbagian dan siap simpan.
Konteks saat ini:
- Periode/Tanggal: ${tipeLogbook === 'mingguan' && tanggalSelesai ? `${tanggal} s.d. ${tanggalSelesai}` : tanggal || '-'} ${isDiluarHariKerja ? '(Kegiatan di luar hari kerja Senin-Jumat)' : '(Hari kerja)'}
- Kategori tersedia: ${categoriesList.join(', ')}
- Kategori dipilih: ${kategori}
- Draf Uraian Aktivitas: "${uraian || '(kosong — buatkan sesuai kategori & lokasi magang)'}"
- Draf Pelajaran yang Diperoleh: "${pelajaran || '(kosong — turunkan dari uraian aktivitas)'}"
- Draf Kendala & Solusi: "${kendala || '(kosong — tuliskan kendala realistis beserta solusinya)'}"${weeklyDailyContext}

Kembalikan JSON dengan properti kategori, uraianAktivitas, pelajaranDiperoleh, dan kendalaDihadapi.`;

      const response = await callGeminiWithRetry(client, {
        model: GEMINI_MODEL,
        contents: promptText,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              kategori: { type: Type.STRING },
              uraianAktivitas: { type: Type.STRING },
              pelajaranDiperoleh: { type: Type.STRING },
              kendalaDihadapi: { type: Type.STRING },
            },
            required: ['kategori', 'uraianAktivitas', 'pelajaranDiperoleh', 'kendalaDihadapi'],
          },
        },
      });

      const parsed = parseJsonSafely<{
        kategori?: string;
        uraianAktivitas?: string;
        pelajaranDiperoleh?: string;
        kendalaDihadapi?: string;
      }>(response.text);

      if (!parsed || !parsed.uraianAktivitas) {
        return res.status(502).json({
          error: 'Respons AI tidak lengkap. Silakan klik tombol AI sekali lagi.',
        });
      }

      return res.json({
        success: true,
        field: 'all',
        kategori: normalizeCategory(parsed.kategori, categoriesList, kategori),
        uraianAktivitas: cleanPlainProse(parsed.uraianAktivitas),
        pelajaranDiperoleh: cleanPlainProse(parsed.pelajaranDiperoleh),
        kendalaDihadapi: cleanPlainProse(parsed.kendalaDihadapi),
      });
    }

    const fieldLabelMap: Record<string, string> = {
      uraian: tipeLogbook === 'mingguan' ? 'Ringkasan Aktivitas Mingguan' : 'Uraian Aktivitas Harian',
      pelajaran:
        tipeLogbook === 'mingguan'
          ? 'Capaian & Pelajaran Utama Minggu Ini'
          : 'Pelajaran yang Diperoleh (Pengetahuan / Keterampilan Baru)',
      kendala:
        tipeLogbook === 'mingguan'
          ? 'Kendala & Tindak Lanjut Mingguan'
          : 'Kendala yang Dihadapi & Cara Penyelesaiannya',
    };

    const currentFieldText =
      field === 'uraian' ? uraian : field === 'pelajaran' ? pelajaran : kendala;

    const taskInstruction =
      field === 'uraian'
        ? currentFieldText
          ? `Perbaiki tata bahasa dan kembangkan draf "${fieldLabelMap[field]}" agar lebih konkret, profesional, dan runtut tanpa mengubah makna aslinya.`
          : `Susun narasi "${fieldLabelMap[field]}" yang realistis dan profesional sesuai kategori "${kategori}" di ${lokasi}${weeklyDailyContext ? ' berdasarkan daftar logbook harian di bawah' : ''}.`
        : field === 'pelajaran'
        ? currentFieldText
          ? `Perbaiki dan pertajam draf "${fieldLabelMap[field]}" agar reflektif, spesifik, dan selaras dengan uraian aktivitas.`
          : `Susun narasi "${fieldLabelMap[field]}" yang spesifik mengenai keterampilan atau wawasan praktis yang relevan dengan uraian aktivitas.`
        : currentFieldText
        ? `Perbaiki draf "${fieldLabelMap[field]}" agar terdengar konstruktif, profesional, dan menonjolkan langkah penyelesaiannya.`
        : `Susun narasi "${fieldLabelMap[field]}" yang realistis dan konstruktif beserta langkah penyelesaian yang relevan dengan uraian aktivitas.`;

    const promptText = `Target kolom: ${fieldLabelMap[field]}
Tugas: ${taskInstruction}

Konteks logbook saat ini:
- Tipe: Logbook ${tipeLogbook}
- Tanggal: ${tipeLogbook === 'mingguan' && tanggalSelesai ? `${tanggal} s.d. ${tanggalSelesai}` : tanggal || '-'} ${isDiluarHariKerja ? '(Kegiatan di luar hari kerja)' : ''}
- Kategori: ${kategori}
- Uraian Aktivitas: "${uraian || '-'}"
- Pelajaran yang Diperoleh: "${pelajaran || '-'}"
- Kendala & Solusi: "${kendala || '-'}"${weeklyDailyContext}

Kembalikan JSON dengan properti "text" berisi 1 paragraf siap pakai tanpa judul kolom dan tanpa markdown.`;

    const response = await callGeminiWithRetry(client, {
      model: GEMINI_MODEL,
      contents: promptText,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
          },
          required: ['text'],
        },
      },
    });

    const parsed = parseJsonSafely<{ text?: string }>(response.text);
    const cleanedText = cleanPlainProse(parsed?.text || (!parsed ? response.text : ''));

    if (!cleanedText) {
      return res.status(502).json({
        error: 'AI tidak mengembalikan hasil teks. Silakan coba lagi.',
      });
    }

    return res.json({
      success: true,
      field,
      text: cleanedText,
    });
  } catch (err: any) {
    console.error('Gemini refine-field error:', err);
    const mapped = mapGeminiError(err, 'Gagal menyempurnakan dengan AI');
    return res.status(mapped.status).json({ error: mapped.message });
  }
});

// API: AI-Powered Template Generator for Add/Edit Logbook Form
app.post('/api/gemini/template', async (req, res) => {
  const { templateTitle, templateKategori, customTopic, tipeLogbook, tanggal, isDiluarHariKerja, context } =
    req.body || {};

  const topic = (customTopic || templateTitle || '').trim();
  if (!topic) {
    return res.status(400).json({ error: 'Topik atau judul template harus diisi.' });
  }

  const client = getAIClient();
  if (!client) {
    return res.status(503).json({
      error: 'Layanan AI belum dikonfigurasi (GEMINI_API_KEY tidak tersedia di server).',
    });
  }

  const lokasi = context?.perusahaan || context?.lokasiMagang || 'Badan Pusat Statistik Kota Parepare';
  const posisi = context?.posisiMagang || '';
  const divisi = context?.divisi || '';
  const mode = tipeLogbook === 'mingguan' ? 'mingguan' : 'harian';

  const categoriesList: string[] =
    Array.isArray(context?.categories) && context.categories.length > 0
      ? context.categories
      : DEFAULT_CATEGORIES;

  const systemInstruction = `Anda adalah asisten pembuat draf logbook pemagangan di ${lokasi}${posisi ? `, posisi ${posisi}` : ''}${divisi ? `, divisi ${divisi}` : ''}.
Buat draf logbook ${mode} dalam bahasa Indonesia formal, konkret, natural (tidak klise), tanpa markdown atau tanda bintang (**).`;

  try {
    const promptText = `Buatkan draf logbook ${mode} lengkap untuk topik: "${topic}".
${templateKategori ? `Referensi kategori: ${templateKategori}` : ''}
${tanggal ? `Tanggal kegiatan: ${tanggal}${isDiluarHariKerja ? ' (kegiatan di luar hari kerja Senin-Jumat)' : ''}` : ''}

Ketentuan output JSON:
1. "kategori": pilih SATU kategori persis dari daftar berikut: ${categoriesList.join(', ')}.
2. "uraianAktivitas": 1 paragraf konkret (150–300 karakter) menjelaskan pekerjaan, metode/alat, dan hasilnya.
3. "pelajaranDiperoleh": 1 paragraf (120–240 karakter) tentang keterampilan/wawasan praktis yang diperoleh.
4. "kendalaDihadapi": 1 paragraf (100–220 karakter) tentang tantangan nyata serta cara mengatasinya.
5. "durasiMenit": angka durasi wajar dalam menit (misal 510 untuk Senin-Kamis atau 540 untuk Jumat).`;

    const response = await callGeminiWithRetry(client, {
      model: GEMINI_MODEL,
      contents: promptText,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            kategori: { type: Type.STRING },
            uraianAktivitas: { type: Type.STRING },
            pelajaranDiperoleh: { type: Type.STRING },
            kendalaDihadapi: { type: Type.STRING },
            durasiMenit: { type: Type.INTEGER },
          },
          required: ['kategori', 'uraianAktivitas', 'pelajaranDiperoleh', 'kendalaDihadapi', 'durasiMenit'],
        },
      },
    });

    const parsed = parseJsonSafely<{
      kategori?: string;
      uraianAktivitas?: string;
      pelajaranDiperoleh?: string;
      kendalaDihadapi?: string;
      durasiMenit?: number;
    }>(response.text);

    if (!parsed || !parsed.uraianAktivitas) {
      return res.status(502).json({
        error: 'Format hasil template AI tidak lengkap. Silakan coba lagi.',
      });
    }

    const fallbackCat = normalizeCategory(templateKategori, categoriesList, categoriesList[0]);

    return res.json({
      success: true,
      template: {
        kategori: normalizeCategory(parsed.kategori, categoriesList, fallbackCat),
        uraianAktivitas: cleanPlainProse(parsed.uraianAktivitas),
        pelajaranDiperoleh: cleanPlainProse(parsed.pelajaranDiperoleh),
        kendalaDihadapi: cleanPlainProse(parsed.kendalaDihadapi),
        durasiMenit:
          typeof parsed.durasiMenit === 'number' && parsed.durasiMenit >= 30 && parsed.durasiMenit <= 720
            ? parsed.durasiMenit
            : 510,
      },
    });
  } catch (err: any) {
    console.error('Gemini template error:', err);
    const mapped = mapGeminiError(err, 'Gagal membuat template dengan AI');
    return res.status(mapped.status).json({ error: mapped.message });
  }
});

// API: Auto-Generate Weekly Logbook Summary from Daily Entries
app.post('/api/gemini/weekly-summary', async (req, res) => {
  const { startDate, endDate, dailyEntries, context } = req.body || {};

  if (!Array.isArray(dailyEntries) || dailyEntries.length === 0) {
    return res.status(400).json({ error: 'Tidak ada data logbook harian pada rentang tanggal tersebut.' });
  }

  const client = getAIClient();
  if (!client) {
    return res.status(503).json({
      error: 'Layanan AI belum dikonfigurasi (GEMINI_API_KEY tidak tersedia di server).',
    });
  }

  const lokasi = context?.perusahaan || context?.lokasiMagang || 'Badan Pusat Statistik Kota Parepare';
  const posisi = context?.posisiMagang || '';
  const divisi = context?.divisi || '';
  const categoriesList: string[] =
    Array.isArray(context?.categories) && context.categories.length > 0
      ? context.categories
      : DEFAULT_CATEGORIES;

  const systemInstruction = `Anda adalah asisten penyusun rekapitulasi logbook mingguan pemagangan di ${lokasi}${posisi ? ` (posisi: ${posisi})` : ''}${divisi ? ` (divisi: ${divisi})` : ''}.
Gabungkan catatan logbook harian menjadi rangkuman mingguan yang terstruktur, profesional, kohesif, dan tidak berulang-ulang.
Dilarang menggunakan markdown, tanda bintang (**), atau bullet list.`;

  const formattedDaily = dailyEntries
    .map((e: any, idx: number) => {
      return `${idx + 1}. Tanggal ${e.tanggal} | Kategori: ${e.kategori || '-'} | Durasi: ${e.durasiMenit || 0} menit
   - Uraian: ${e.uraianAktivitas || '-'}
   - Pelajaran: ${e.pelajaranDiperoleh || '-'}
   - Kendala: ${e.kendalaDihadapi || '-'}`;
    })
    .join('\n');

  try {
    const promptText = `Susun laporan Logbook Mingguan untuk periode ${startDate || '-'} s.d. ${endDate || '-'} berdasarkan ${dailyEntries.length} catatan logbook harian berikut:

${formattedDaily}

Hasilkan JSON berisi:
1. "kategori": pilih SATU kategori dominan persis dari daftar berikut: ${categoriesList.join(', ')}.
2. "uraianAktivitas": 1–2 paragraf ringkas dan runtut merangkum keseluruhan pekerjaan/progres utama selama minggu ini.
3. "pelajaranDiperoleh": 1 paragraf merangkum kompetensi, keterampilan, dan wawasan penting yang diperoleh sepanjang minggu.
4. "kendalaDihadapi": 1 paragraf merangkum kendala utama yang ditemui beserta langkah penyelesaian/tindak lanjutnya.`;

    const response = await callGeminiWithRetry(client, {
      model: GEMINI_MODEL,
      contents: promptText,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            kategori: { type: Type.STRING },
            uraianAktivitas: { type: Type.STRING },
            pelajaranDiperoleh: { type: Type.STRING },
            kendalaDihadapi: { type: Type.STRING },
          },
          required: ['kategori', 'uraianAktivitas', 'pelajaranDiperoleh', 'kendalaDihadapi'],
        },
      },
    });

    const parsed = parseJsonSafely<{
      kategori?: string;
      uraianAktivitas?: string;
      pelajaranDiperoleh?: string;
      kendalaDihadapi?: string;
    }>(response.text);

    if (!parsed || !parsed.uraianAktivitas) {
      return res.status(502).json({
        error: 'Hasil rangkuman mingguan AI tidak lengkap. Silakan coba lagi.',
      });
    }

    const fallbackCat = normalizeCategory(dailyEntries[0]?.kategori, categoriesList, categoriesList[0]);

    return res.json({
      success: true,
      summary: {
        kategori: normalizeCategory(parsed.kategori, categoriesList, fallbackCat),
        uraianAktivitas: cleanPlainProse(parsed.uraianAktivitas),
        pelajaranDiperoleh: cleanPlainProse(parsed.pelajaranDiperoleh),
        kendalaDihadapi: cleanPlainProse(parsed.kendalaDihadapi),
      },
    });
  } catch (err: any) {
    console.error('Gemini weekly-summary error:', err);
    const mapped = mapGeminiError(err, 'Gagal menyusun rangkuman mingguan AI');
    return res.status(mapped.status).json({ error: mapped.message });
  }
});

// Start dev or production server
async function startServer() {
  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`MagangHub Kemnaker Server running at http://localhost:${PORT}`);
  });
}

startServer();
