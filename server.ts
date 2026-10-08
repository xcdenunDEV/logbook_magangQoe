import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV !== 'production';

app.use(express.json());

// Initialize Google GenAI client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

// API: Default Users Info for MagangHub Kemnaker
app.get('/api/users', (req, res) => {
  res.json({
    users: [
      {
        username: 'ainunnn',
        name: 'Muhammad Ainun Anwar',
        role: 'admin',
        email: 'ainun.anwar@maganghub.kemnaker.go.id',
        canManageUsers: true,
      },
      {
        username: 'ayuazhara',
        name: 'Ayu Azhara',
        role: 'user',
        email: 'ayu.azhara@maganghub.kemnaker.go.id',
        canManageUsers: false,
      },
      {
        username: 'aliyah',
        name: 'Aliyah Meilidya',
        role: 'user',
        email: 'aliyah.meilidya@maganghub.kemnaker.go.id',
        canManageUsers: false,
      },
    ],
    program: 'Program Pemagangan Nasional Kemnaker RI',
    portal: 'maganghub.kemnaker.go.id',
  });
});

// API: AI Assistant for MagangHub Kemnaker Logbook Generation
app.post('/api/gemini/assist', async (req, res) => {
  const { prompt, context } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  if (ai) {
    try {
      const systemInstruction = `Anda adalah Asisten Penyusunan Logbook Pemagangan Nasional MagangHub Kementerian Ketenagakerjaan RI (Kemnaker) yang bertugas di portal maganghub.kemnaker.go.id.
Tugas Anda adalah membantu peserta magang menyusun catatan logbook aktivitas secara terstruktur dan profesional.
Bantu susun 3 bagian dengan rapi:
1. Uraian Aktivitas: Menjelaskan secara rinci tugas/pekerjaan yang dilakukan (alur, peralatan/tools, atau hasil kerja).
2. Pelajaran yang Diperoleh: Menjelaskan keterampilan, ilmu baru, wawasan praktis, atau pemahaman kompetensi yang didapatkan.
3. Kendala yang Dihadapi & Solusi: Menjelaskan tantangan teknis atau koordinasi dan cara penyelesaiannya.

Format jawaban:
Sajikan dalam format yang rapi dan profesional untuk dokumentasi logbook pribadi peserta.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Konteks Peserta: ${JSON.stringify(context || {})}
Draft Aktivitas dari Peserta: "${prompt}"
Tolong kembangkan narasi logbook yang komprehensif, mencakup Uraian, Pembelajaran, dan Solusi Kendala.`,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const replyText = response.text || '';

      const uraianExt = `Melaksanakan ${prompt} pada unit kerja secara terstruktur. Aktivitas mencakup perencanaan teknis, pengolahan tugas harian, dan koordinasi dengan rekan tim kerja.`;
      const pelajaranExt = `Mempelajari penerapan praktis di lingkungan kerja nyata, memahami standar operasional prosedur perusahaan mitra, serta meningkatkan keterampilan pemecahan masalah.`;
      const kendalaExt = `Tantangan berupa penyesuaian alur kerja baru berhasil diatasi dengan baik melalui diskusi tim dan referensi panduan kerja yang relevan.`;

      return res.json({
        reply: replyText,
        suggestion: {
          uraian: uraianExt,
          pelajaran: pelajaranExt,
          kendala: kendalaExt,
          kategori: 'Teknis / Proyek Utama',
          durasiMenit: 420,
        },
      });
    } catch (err: any) {
      console.error('Gemini API call failed, falling back:', err.message);
    }
  }

  // Fallback offline response
  const uraianFallback = `Melaksanakan kegiatan ${prompt} di perusahaan mitra program MagangHub Kemnaker secara disiplin. Aktivitas mencakup perencanaan teknis, pengolahan tugas harian, serta penyiapan dokumentasi hasil kerja.`;
  const pelajaranFallback = `Mendapatkan pemahaman baru mengenai standar kerja profesional industri, pentingnya ketelitian dalam menyelesaikan tugas tepat waktu, serta koordinasi tim yang responsif.`;
  const kendalaFallback = `Tantangan berupa penyesuaian alur tugas teknis berhasil diatasi dengan baik melalui diskusi rekan kerja dan panduan operasional di tempat magang.`;

  const reply = `Berikut rancangan Laporan Aktivitas MagangHub Kemnaker:

1. **Uraian Aktivitas:**
${uraianFallback}

2. **Pelajaran yang Diperoleh:**
${pelajaranFallback}

3. **Kendala yang Dihadapi & Solusi:**
${kendalaFallback}`;

  res.json({
    reply,
    suggestion: {
      uraian: uraianFallback,
      pelajaran: pelajaranFallback,
      kendala: kendalaFallback,
      kategori: 'Teknis / Proyek Utama',
      durasiMenit: 420,
    },
  });
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
