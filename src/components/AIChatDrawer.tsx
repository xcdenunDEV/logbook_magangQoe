import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Check, 
  Copy, 
  Lightbulb,
  RefreshCw,
  GraduationCap
} from 'lucide-react';
import { LogbookEntry, PesertaProfile } from '../types';

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PesertaProfile;
  entries: LogbookEntry[];
  initialPrompt?: string;
  onApplySuggestedEntry?: (entry: {
    uraian: string;
    pelajaran: string;
    kendala: string;
    kategori: string;
    durasiMenit: number;
  }) => void;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  suggestion?: {
    uraian: string;
    pelajaran: string;
    kendala: string;
    kategori: string;
    durasiMenit: number;
  };
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  isOpen,
  onClose,
  profile,
  entries,
  initialPrompt,
  onApplySuggestedEntry
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-welcome',
      sender: 'ai',
      text: `Halo ${profile.nama}! Saya Asisten AI Logbook MagangHub Kemnaker (maganghub.kemnaker.go.id).

Ketentuan resmi Kemnaker mengharuskan setiap laporan harian memiliki **minimal 100 karakter** pada:
1. **Uraian Aktivitas**
2. **Pelajaran yang Diperoleh**
3. **Kendala yang Dihadapi & Solusi**

Sampaikan draft ringkas atau apa yang Anda kerjakan hari ini di ${profile.perusahaan}, dan saya akan kembangkan menjadi laporan yang memenuhi standar penilaian mentor!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPrompt && isOpen) {
      setInputPrompt(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          context: {
            nama: profile.nama,
            perusahaan: profile.perusahaan,
            divisi: profile.divisi,
            posisiMagang: profile.posisiMagang,
            idPeserta: profile.idPeserta,
            mentor: profile.namaMentor
          }
        })
      });

      if (!res.ok) {
        throw new Error('API server returned error');
      }

      const data = await res.json();
      const aiReply = data.reply || data.text || 'Maaf, terjadi kendala pemrosesan.';

      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: aiReply,
          suggestion: data.suggestion,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.warn('Backend call failed, using built-in generator:', err);
      // High quality fallback exceeding 100 chars per section
      const uraianFallback = `Melaksanakan ${query} di divisi ${profile.divisi} ${profile.perusahaan}. Tugas mencakup identifikasi kebutuhan teknis, pengujian fungsional modul, serta pendokumentasian hasil kerja untuk bahan diskusi bersama mentor industri.`;
      const pelajaranFallback = `Memahami secara mendalam konsep dan alur implementasi praktis terkait tugas yang diberikan, pentingnya komunikasi efektif antar anggota tim, serta standar efisiensi yang diterapkan di lingkungan kerja profesional.`;
      const kendalaFallback = `Sempat menemukan sedikit kendala penyesuaian alur kerja pada sistem perusahaan, namun berhasil diselesaikan dengan baik setelah berkonsultasi langsung dan mendapatkan arahan teknis dari mentor pembimbing.`;

      const fallbackText = `Berikut rekomendasi narasi Laporan MagangHub (ketiganya telah memenuhi syarat minimal 100 karakter):

1. **Uraian Aktivitas (${uraianFallback.length} karakter):**
${uraianFallback}

2. **Pelajaran yang Diperoleh (${pelajaranFallback.length} karakter):**
${pelajaranFallback}

3. **Kendala yang Dihadapi & Solusi (${kendalaFallback.length} karakter):**
${kendalaFallback}`;

      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: fallbackText,
          suggestion: {
            uraian: uraianFallback,
            pelajaran: pelajaranFallback,
            kendala: kendalaFallback,
            kategori: 'Teknis / Proyek Utama',
            durasiMenit: 420
          },
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div 
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#002B49] text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold flex items-center gap-1.5">
                <span>Asisten AI MagangHub Kemnaker</span>
              </h2>
              <p className="text-[11px] text-slate-300">
                Penyusun Laporan Harian Minimal 100 Karakter
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Prompts Suggestions */}
        <div className="bg-purple-50 border-b border-purple-100 p-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar text-[11px]">
          <span className="text-purple-700 font-bold shrink-0 flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5" /> Contoh:
          </span>
          <button
            onClick={() => handleSend('Hari ini saya mengerjakan pembersihan data dan pembuatan grafik visualisasi')}
            className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-900 rounded-md border border-purple-200 whitespace-nowrap transition-colors"
          >
            Pembersihan Data
          </button>
          <button
            onClick={() => handleSend('Saya mengikuti rapat koordinasi tim dan diskusi arsitektur fitur baru')}
            className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-900 rounded-md border border-purple-200 whitespace-nowrap transition-colors"
          >
            Rapat Koordinasi
          </button>
          <button
            onClick={() => handleSend('Buatkan draf laporan bulanan magang untuk evaluasi pencapaian kompetensi')}
            className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-900 rounded-md border border-purple-200 whitespace-nowrap transition-colors"
          >
            Laporan Bulanan
          </button>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3 space-y-2 ${
                  msg.sender === 'user'
                    ? 'bg-[#003B73] text-white rounded-br-xs'
                    : 'bg-slate-100 text-slate-800 rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-line leading-relaxed">
                  {msg.text}
                </div>

                {msg.suggestion && onApplySuggestedEntry && (
                  <div className="mt-2 pt-2 border-t border-slate-200 bg-white/90 p-2.5 rounded-lg text-slate-900 space-y-1.5">
                    <div className="font-bold text-[11px] text-purple-900">
                      Format Terstruktur MagangHub:
                    </div>
                    <div className="text-[10px] text-slate-600 line-clamp-2">
                      {msg.suggestion.uraian}
                    </div>
                    <button
                      onClick={() => {
                        onApplySuggestedEntry(msg.suggestion!);
                        onClose();
                      }}
                      className="w-full text-center py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors shadow-2xs"
                    >
                      Terapkan ke Formulir Laporan
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] opacity-70 pt-1">
                  <span>{msg.time}</span>
                  {msg.sender === 'ai' && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="hover:opacity-100 transition-opacity flex items-center gap-1"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
              <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
              <span>Menyusun 3 bagian laporan MagangHub (min. 100 karakter)...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <div className="p-3 border-t border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <textarea
              rows={2}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ceritakan aktivitas magang Anda hari ini..."
              className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-purple-500 focus:bg-white resize-none"
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputPrompt.trim() || isLoading}
              className="p-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl transition-colors shadow-2xs self-end"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 text-center">
            Otomatis memenuhi syarat &ge; 100 karakter pada Uraian, Pelajaran, dan Kendala
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIChatDrawer;
