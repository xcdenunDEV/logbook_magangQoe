import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  Copy, 
  Check, 
  FileEdit, 
  Minimize2, 
  Maximize2,
  RefreshCw,
  Lightbulb,
  Zap
} from 'lucide-react';
import { LogbookEntry, PesertaProfile } from '../types';

interface FloatingAIBotProps {
  profile: PesertaProfile;
  entries: LogbookEntry[];
  onApplySuggestedEntry?: (entry: {
    uraian: string;
    pelajaran: string;
    kendala: string;
    kategori: string;
    durasiMenit: number;
  }) => void;
  onOpenNewLogbook?: () => void;
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

export const FloatingAIBot: React.FC<FloatingAIBotProps> = ({
  profile,
  entries,
  onApplySuggestedEntry,
  onOpenNewLogbook
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-welcome',
      sender: 'ai',
      text: `Halo ${profile.nama || 'Rekan Magang'}! 👋\n\nSaya **Bot AI Logbook MagangHub Kemnaker**. Saya siap membantu Anda menyusun catatan harian dan mingguan yang memenuhi standar resmi Kemnaker RI:\n\n✨ **Minimal 100 karakter** untuk Uraian, Pelajaran, dan Kendala.\n✨ Tata bahasa profesional & evaluasi terstruktur.\n\nKetik tugas atau aktivitas Anda hari ini, atau pilih salah satu menu cepat di bawah!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const QUICK_PROMPTS = [
    {
      label: 'Draft Harian Teknis',
      query: `Tolong buatkan narasi logbook harian untuk tugas pengembangan fitur dan pengujian modul di ${profile.perusahaan}. Minimal 100 karakter per bagian.`
    },
    {
      label: 'Riset & Analisis',
      query: `Buatkan logbook aktivitas riset data, analisis kebutuhan pengguna, dan dokumentasi teknis di divisi ${profile.divisi}.`
    },
    {
      label: 'Refleksi Kendala & Solusi',
      query: `Bantu saya merumuskan kendala teknis penyesuaian alur kerja serta solusi konkretnya sesuai standar mentor industri.`
    },
    {
      label: 'Format Mingguan',
      query: `Susun ringkasan evaluasi logbook mingguan formal untuk diserahkan ke mentor ${profile.namaMentor} di ${profile.perusahaan}.`
    }
  ];

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isLoading]);

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
        throw new Error('API server unavailable');
      }

      const data = await res.json();
      const aiReply = data.reply || data.text || 'Maaf, terjadi kendala saat memproses laporan.';

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
    } catch {
      // Smart offline fallback ensuring >= 100 characters per section
      const uraian = `Melaksanakan implementasi dan pengujian tugas ${query} pada lingkungan kerja divisi ${profile.divisi} di ${profile.perusahaan}. Kegiatan mencakup penelaahan requirement kerja, koordinasi dengan tim teknis, serta validasi hasil pekerjaan agar sesuai target capaian program pemagangan Kemnaker RI.`;
      const pelajaran = `Memperdalam kompetensi teknis dan pemahaman proses bisnis riil di ${profile.perusahaan}, membiasakan diri dengan alur kerja tim profesional, serta menyadari pentingnya kedisiplinan dan pelaporan progres harian secara transparan.`;
      const kendala = `Menjumpai sedikit perbedaan teknis implementasi antara teori kampus dengan sistem internal perusahaan, yang berhasil diatasi melalui diskusi aktif dan rekomendasi arahan teknis dari pembimbing mentor ${profile.namaMentor}.`;

      const fallbackReply = `Berikut draf rekomendasi logbook resmi MagangHub (seluruh bagian telah memenuhi ketentuan minimal 100 karakter):

1. **Uraian Aktivitas (${uraian.length} karakter):**
${uraian}

2. **Pelajaran yang Diperoleh (${pelajaran.length} karakter):**
${pelajaran}

3. **Kendala yang Dihadapi & Solusi (${kendala.length} karakter):**
${kendala}`;

      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: fallbackReply,
          suggestion: {
            uraian,
            pelajaran,
            kendala,
            kategori: 'Teknis / Proyek Utama',
            durasiMenit: 480
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

  const handleApply = (id: string, suggestion: Message['suggestion']) => {
    if (!suggestion) return;
    if (onApplySuggestedEntry) {
      onApplySuggestedEntry(suggestion);
    } else if (onOpenNewLogbook) {
      onOpenNewLogbook();
    }
    setAppliedId(id);
    setTimeout(() => setAppliedId(null), 2500);
  };

  return (
    <>
      {/* Floating Action Button (Sudut Kanan Bawah) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Tooltip Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-semibold shadow-lg backdrop-blur-xs border border-sky-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Bot AI Logbook MagangHub</span>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#003B73] via-[#0055A5] to-[#0077E6] text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white/30"
            aria-label="Buka Bot AI Logbook"
          >
            {/* Sparkle Glow Effect */}
            <div className="absolute inset-0 rounded-2xl bg-sky-400 opacity-20 blur-md group-hover:opacity-40 transition-opacity"></div>
            
            <div className="relative flex items-center justify-center">
              <Bot className="w-7 h-7 text-white" />
              <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1.5 -right-1.5 animate-bounce" />
            </div>

            {/* Notification Dot */}
            <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-[#003B73]"></span>
          </button>
        </div>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div className={`fixed z-50 transition-all duration-200 ${
          isMinimized 
            ? 'bottom-6 right-6 w-72' 
            : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[94vw] sm:w-[410px] h-[580px] max-h-[85vh]'
        }`}>
          <div className="bg-white rounded-2xl shadow-2xl border border-sky-200/80 flex flex-col h-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header with Deep Kemnaker Blue */}
            <div className="bg-gradient-to-r from-[#002B49] via-[#003B73] to-[#004d99] text-white px-4 py-3 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shadow-inner">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-xs sm:text-sm tracking-tight">Bot AI Logbook</h3>
                    <span className="text-[9px] font-bold bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full uppercase">
                      Kemnaker
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Aktif & Siap Bantu Draf Logbook</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  title={isMinimized ? 'Perbesar' : 'Kecilkan'}
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  title="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Body (Hidden when Minimized) */}
            {!isMinimized && (
              <>
                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-gradient-to-b from-slate-50/60 to-white text-xs">
                  {/* Info Pill */}
                  <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/80 text-blue-900 text-[11px] leading-relaxed flex items-start gap-2">
                    <Zap className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      Dibuat khusus untuk peserta <strong>{profile.perusahaan}</strong>. Semua rekomendasi otomatis disesuaikan dengan syarat 100 karakter Kemnaker RI.
                    </span>
                  </div>

                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {m.sender === 'ai' && (
                        <div className="w-7 h-7 rounded-lg bg-[#003B73] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs font-bold text-[10px]">
                          AI
                        </div>
                      )}

                      <div className={`max-w-[85%] rounded-2xl p-3 space-y-2 shadow-2xs ${
                        m.sender === 'user'
                          ? 'bg-[#003B73] text-white rounded-br-xs'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                      }`}>
                        <div className="whitespace-pre-line text-[11px] leading-relaxed">
                          {m.text}
                        </div>

                        {/* Suggestion Card Actions */}
                        {m.suggestion && (
                          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleApply(m.id, m.suggestion)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-2xs transition-colors"
                            >
                              {appliedId === m.id ? (
                                <>
                                  <Check className="w-3 h-3 text-white" />
                                  <span>Diterapkan!</span>
                                </>
                              ) : (
                                <>
                                  <FileEdit className="w-3 h-3" />
                                  <span>Terapkan ke Form Logbook</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopy(m.id, m.text)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[10px] transition-colors"
                            >
                              {copiedId === m.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Tersalin</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Salin</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        <div className={`text-[9px] ${m.sender === 'user' ? 'text-blue-200' : 'text-slate-400'} text-right`}>
                          {m.time}
                        </div>
                      </div>

                      {m.sender === 'user' && (
                        <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-2.5 justify-start">
                      <div className="w-7 h-7 rounded-lg bg-[#003B73] text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                      </div>
                      <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs p-3 text-slate-500 text-[11px] flex items-center gap-2 shadow-2xs">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" />
                        <span>Menyusun narasi logbook standar Kemnaker...</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Prompts Bar */}
                <div className="p-2 bg-slate-50 border-t border-slate-200 overflow-x-auto flex gap-1.5 no-scrollbar">
                  {QUICK_PROMPTS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(p.query)}
                      disabled={isLoading}
                      className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white border border-slate-300 hover:border-sky-500 hover:bg-sky-50/50 text-[10px] font-semibold text-slate-700 transition-colors shadow-2xs disabled:opacity-50"
                    >
                      💡 {p.label}
                    </button>
                  ))}
                </div>

                {/* Input Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    placeholder="Ketik tugas hari ini atau minta bantuan logbook..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-sky-600 focus:outline-hidden"
                    disabled={isLoading}
                  />

                  <button
                    type="submit"
                    disabled={!inputPrompt.trim() || isLoading}
                    className="p-2.5 rounded-xl bg-[#003B73] hover:bg-sky-800 text-white font-bold transition-colors disabled:opacity-40 shadow-xs"
                    title="Kirim"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAIBot;
