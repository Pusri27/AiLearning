import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useUserProfile } from '../context/UserProfileContext';

// ── Lightweight markdown renderer ──────────────────────────────────
const renderMarkdown = (text) => {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Bullet list
    if (/^[-*] /.test(line)) {
      const content = line.replace(/^[-*] /, '');
      elements.push(<li key={key++} className="ml-4 list-disc">{inlineFormat(content)}</li>);
      continue;
    }
    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const content = line.replace(/^\d+\.\s/, '');
      elements.push(<li key={key++} className="ml-4 list-decimal">{inlineFormat(content)}</li>);
      continue;
    }
    // Empty line = spacing
    if (line.trim() === '') {
      elements.push(<div key={key++} className="h-2" />);
      continue;
    }
    // Normal paragraph
    elements.push(<p key={key++} className="leading-relaxed">{inlineFormat(line)}</p>);
  }
  return elements;
};

// Convert **bold**, *italic*, `code` inline
const inlineFormat = (text) => {
  // Split on markdown tokens
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/);
  return parts.map((part, i) => {
    if (/^\*\*(.+)\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (/^\*(.+)\*$/.test(part))   return <em key={i}>{part.slice(1, -1)}</em>;
    if (/^`(.+)`$/.test(part))     return <code key={i} className="bg-surface-container px-1 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
    return part;
  });
};

const AIAssistant = ({ userRole = 'student', userName = 'User' }) => {
  const { profile } = useUserProfile();
  const isGuest = profile.isGuest;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Halo ${userName}! Saya Harin AI, asisten pribadimu. Ada yang bisa saya bantu terkait ${userRole === 'teacher' ? 'manajemen kelas' : 'perjalanan belajarmu'}?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const projectContext = `
    Kamu adalah Harin AI, asisten cerdas untuk platform "Harin Learning".
    
    ATURAN PENTING — WAJIB DIIKUTI:
    1. SELALU gunakan Bahasa Indonesia yang santai, ramah, dan mudah dipahami.
    2. JANGAN gunakan simbol markdown seperti **, *, ##, ###, atau backtick dalam jawabanmu.
    3. Gunakan tanda titik, koma, dan enter biasa untuk memisahkan ide.
    4. Untuk daftar/list, cukup gunakan tanda - (strip) di awal baris.
    5. JANGAN pernah membocorkan API Key, URL database, password, atau informasi teknis internal.
    6. Jika ditanya hal teknis yang bersifat rahasia, jawab: "Itu adalah informasi internal sistem yang tidak bisa saya bagikan."
    
    STRUKTUR & FITUR WEBSITE HARIN LEARNING:
    - Halaman Utama / Dashboard (/): Pusat informasi belajar, target harian (dalam menit), ringkasan progress, dan pintasan cepat.
    - Katalog Kursus (/catalog): Tempat menjelajahi seluruh kursus premium, filter kategori, harga, dan rating.
    - Detail Kursus (/courses/:id): Halaman detail materi, silabus, instruktur, dan tombol untuk mendaftar/membeli kursus.
    - Study Space (/study): Ruang belajar santai yang dilengkapi dengan pemutar musik latar interaktif (suara Hujan/Rain, Kabut/Fog, Kopi/Coffee, Piano, dll.) serta Pomodoro timer untuk fokus belajar.
    - Kursus Saya (/courses): Daftar kursus yang sedang diikuti oleh siswa beserta progress belajar mereka.
    - Prestasi / Achievements (/achievements): Halaman penghargaan/badge yang didapatkan siswa setelah mencapai target belajar.
    - Komunitas / Community (/community): Tempat mengobrol real-time dalam grup/grup server, channel chat, dan voice channel (WebRTC) terintegrasi dengan fitur mute/unmute, daftar teman, dan notifikasi pesan belum dibaca per channel.
    - Keranjang (/cart) & Pembayaran (/checkout): Proses pembelian kursus secara aman.
    - Blog Feed (/blog) & Tulis Artikel (/blog/write): Platform artikel edukatif yang bisa dibaca dan ditulis oleh pengguna.
    - Pengaturan / Settings (/settings): Mengubah profil dan menetapkan Target Belajar Harian ("Target Harian") dalam menit yang tersimpan secara lokal.
    - Dashboard Pengajar (/teacher): Halaman khusus pengajar untuk mengelola materi kursus, memantau daftar siswa, dan merespons undangan kolaborasi mengajar dari rekan instruktur lain.

    KONTEKS PENGGUNA:
    - Platform: Harin Learning (Edukasi Online Modern dengan Desain Neobrutalism premium).
    - Peran pengguna saat ini: ${userRole}.
    - Nama pengguna: ${userName}.
    
    TUGAS:
    - Jika SISWA: bantu memahami materi, berikan motivasi belajar, dan jelaskan cara menggunakan fitur platform di atas (seperti menyetel Target Harian di Pengaturan atau memutar musik di Study Space).
    - Jika PENGAJAR: bantu analisis performa siswa, saran kurikulum, pengelolaan materi di dashboard pengajar, dan kolaborasi instruktur.
    
    GAYA:
    - Seperti teman diskusi yang pintar — ramah tapi informatif.
    - Jawaban singkat dan langsung ke inti penjelasan, kecuali jika pengguna meminta penjelasan mendalam.
  `;

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    if (isGuest) {
      const userMsg = { role: 'user', content: input };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setLoading(true);
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "Halo! Sebagai tamu, akses obrolan saya agak terbatas. Yuk, daftar akun Harin Learning dulu supaya kita bisa ngobrol lebih seru dan saya bisa bantu belajarmu lebih maksimal!" 
        }]);
        setLoading(false);
      }, 800);
      return;
    }

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": import.meta.env.VITE_AI_MODEL || "nvidia/nemotron-3-super-120b-a12b:free",
          "messages": [
            { "role": "system", "content": projectContext },
            ...messages,
            userMessage
          ]
        })
      });

      const data = await response.json();
      const aiResponse = data.choices[0].message;
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Maaf, sepertinya saya sedang mengalami gangguan koneksi. Coba lagi nanti ya!" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-10 right-10 z-[100] flex flex-col items-end gap-4">
      {/* Chat Card */}
      {isOpen && (
        <div className="w-[350px] md:w-[400px] bg-white border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300 rounded-[32px]">
          <div className="bg-primary p-5 border-b-4 border-on-surface flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl border-2 border-on-surface shadow-[2px_2px_0px_0px_#000]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.008v.008H12V18zM12 14h.008v.008H12V14zM12 10h.008v.008H12V10zM12 6h.008v.008H12V6zM8.25 18h.008v.008H8.25V18zm0-4h.008v.008H8.25V14zm0-4h.008v.008H8.25V10zm0-4h.008v.008H8.25V6zm11.25 12h.008v.008H19.5V18zm0-4h.008v.008H19.5V14zm0-4h.008v.008H19.5V10zm0-4h.008v.008H19.5V6z" />
                </svg>
              </div>
              <div>
                <h3 className="font-black text-white text-lg">Harin AI</h3>
                <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest">{userRole} Mode</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:rotate-90 transition-transform p-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div ref={scrollRef} className="h-96 overflow-y-auto p-5 space-y-4 bg-surface-variant/10">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 border-2 border-on-surface shadow-[4px_4px_0px_0px_#000] ${
                  msg.role === 'user' ? 'bg-primary-container text-on-surface rounded-l-2xl rounded-tr-2xl' : 'bg-white text-on-surface rounded-r-2xl rounded-tl-2xl'
                }`}>
                  <div className="text-sm font-medium leading-relaxed space-y-0.5">
                    {renderMarkdown(msg.content)}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white p-4 border-2 border-on-surface shadow-[4px_4px_0px_0px_#000] rounded-r-2xl rounded-tl-2xl flex gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-5 border-t-4 border-on-surface bg-white flex gap-3">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Tanya Harin AI..." 
              className="flex-1 bg-surface border-2 border-on-surface rounded-xl px-4 py-3 text-sm font-bold focus:bg-primary-container/10 outline-none transition-all shadow-[2px_2px_0px_0px_#000]"
            />
            <button 
              onClick={handleSend}
              disabled={loading}
              className="bg-primary p-3 rounded-xl border-2 border-on-surface hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[4px_4px_0px_0px_#000] transition-all active:scale-95 disabled:opacity-50"
            >
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-primary border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-white hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0 active:translate-y-0 active:shadow-none group relative overflow-hidden rounded-2xl"
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 relative z-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 relative z-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default AIAssistant;
