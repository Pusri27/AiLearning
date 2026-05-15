import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileDropdown from '../components/ProfileDropdown';
import NotificationDropdown from '../components/NotificationDropdown';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabaseClient';
import { useMusicPlayer } from '../context/MusicPlayerContext';

// ─── Pomodoro Timer ───────────────────────────────────────────────
const PRESETS = [
  { label: 'Classic 25:5',  focus: 25, breakMins: 5,  desc: 'Pomodoro klasik' },
  { label: 'Deep 50:10',    focus: 50, breakMins: 10, desc: 'Sesi panjang' },
  { label: 'Custom',        focus: null, breakMins: null, desc: 'Atur sendiri' },
];

function PomodoroTimer() {
  const [focusMins,  setFocusMins]  = useState(25);
  const [breakMins,  setBreakMins]  = useState(5);
  const [isBreak,    setIsBreak]    = useState(false);
  const [remaining,  setRemain]     = useState(25 * 60);
  const [running,    setRunning]    = useState(false);
  const [sessions,   setSessions]   = useState(0);
  const [showCustom, setShowCustom] = useState(false);
  const [customF,    setCustomF]    = useState('25');
  const [customB,    setCustomB]    = useState('5');
  const intervalRef = useRef(null);

  const totalSeconds = isBreak ? breakMins * 60 : focusMins * 60;
  const format = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const progress = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0;

  const applyPreset = (p) => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setIsBreak(false);
    if (p.focus !== null) {
      setFocusMins(p.focus);
      setBreakMins(p.breakMins);
      setRemain(p.focus * 60);
      setShowCustom(false);
    } else {
      setShowCustom(true);
    }
  };

  const applyCustom = () => {
    const f = Math.max(1, parseInt(customF) || 25);
    const b = Math.max(1, parseInt(customB) || 5);
    clearInterval(intervalRef.current);
    setRunning(false);
    setIsBreak(false);
    setFocusMins(f);
    setBreakMins(b);
    setRemain(f * 60);
    setShowCustom(false);
    setCustomF(String(f));
    setCustomB(String(b));
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setIsBreak(false);
    setRemain(focusMins * 60);
  };

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemain(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (!isBreak) {
              setSessions(s => s + 1);
              setIsBreak(true);
              setRemain(breakMins * 60);
            } else {
              setIsBreak(false);
              setRemain(focusMins * 60);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, isBreak, focusMins, breakMins]);

  const bgColor = isBreak ? 'bg-tertiary-fixed' : 'bg-secondary-fixed';
  const textColor = isBreak ? 'text-on-tertiary-fixed' : 'text-on-secondary-fixed';
  const phase = isBreak ? `Break — ${breakMins} min` : `Focus — ${focusMins} min`;

  return (
    <div className={`${bgColor} border-2 border-on-surface rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col gap-4 transition-colors duration-500`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className={`font-headline-md ${textColor}`}>Study Session</h3>
          <span className={`text-xs font-black ${textColor} opacity-60`}>{phase} · {sessions} sesi selesai</span>
        </div>
        <Icon name="schedule" className={`w-5 h-5 ${textColor}`} />
      </div>

      {/* Preset Buttons */}
      <div className="flex gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p)}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-black border-2 border-on-surface transition-all
              ${(p.focus === focusMins && p.breakMins === breakMins && !showCustom) || (p.focus === null && showCustom)
                ? 'bg-on-surface text-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]'
                : 'bg-white/30 hover:bg-white/50'} ${textColor}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom Input */}
      {showCustom && (
        <div className="flex gap-2 p-3 bg-black/10 rounded-lg border border-on-surface/20 animate-pulse-once">
          <div className="flex-1 flex flex-col gap-1">
            <label className={`text-[10px] font-black uppercase ${textColor} opacity-70`}>Fokus (menit)</label>
            <input
              type="number" min="1" max="180"
              value={customF}
              onChange={e => setCustomF(e.target.value)}
              className="h-9 w-full border-2 border-on-surface rounded-lg px-2 text-center font-black bg-white/80 focus:outline-none"
            />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <label className={`text-[10px] font-black uppercase ${textColor} opacity-70`}>Istirahat (menit)</label>
            <input
              type="number" min="1" max="60"
              value={customB}
              onChange={e => setCustomB(e.target.value)}
              className="h-9 w-full border-2 border-on-surface rounded-lg px-2 text-center font-black bg-white/80 focus:outline-none"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={applyCustom}
              className="h-9 px-3 bg-on-surface text-white rounded-lg border-2 border-on-surface font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:translate-y-[-1px] transition-all"
            >OK</button>
          </div>
        </div>
      )}

      {/* Timer Display */}
      <div className="flex flex-col items-center gap-2 py-1">
        <div className={`font-black tracking-tighter leading-none text-[64px] ${textColor}`}>
          {format(remaining)}
        </div>
        <div className="w-full h-3 bg-black/10 rounded-full border border-on-surface/20 overflow-hidden">
          <div
            className="h-full bg-on-surface/60 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex-none p-3 border-2 border-on-surface bg-white/30 rounded-lg hover:bg-white/50 transition-all"
          title="Reset"
        >
          <Icon name="close" className={`w-5 h-5 ${textColor}`} />
        </button>
        <button
          onClick={() => setRunning(r => !r)}
          className={`flex-1 py-3 font-headline-md rounded-lg border-2 border-on-surface bg-on-surface text-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all`}
        >
          {running ? 'PAUSE' : remaining === totalSeconds ? 'START' : 'RESUME'}
        </button>
      </div>
    </div>
  );
}

// ─── AI Study Planner ─────────────────────────────────────────────
function AIStudyPlanner() {
  const [tasks,     setTasks]     = useState([]);
  const [input,     setInput]     = useState('');
  const [goal,      setGoal]      = useState('');
  const [aiLoading, setAILoading] = useState(false);
  const [aiError,   setAIError]   = useState('');
  const [dbLoading, setDbLoading] = useState(true);
  const userIdRef   = useRef(null);  // useRef so saveToDb always reads current value
  const saveTimeout = useRef(null);

  // ── Load from Supabase on mount ──────────────────────────────────
  useEffect(() => {
    const loadPlan = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setDbLoading(false); return; }
      userIdRef.current = session.user.id; // set ref immediately (no async delay)
      const { data, error } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', session.user.id)
        .order('sort_order', { ascending: true });
      if (!error && data) {
        setTasks(data.map(row => ({ id: row.id, text: row.text, done: row.done, duration: row.duration || '' })));
      }
      setDbLoading(false);
    };
    loadPlan();
  }, []);

  // ── Save helpers ─────────────────────────────────────────────────
  const saveToDb = async (newTasks) => {
    const uid = userIdRef.current;
    if (!uid) { console.warn('[StudyPlanner] saveToDb: uid is null, skipping save'); return; }
    console.log('[StudyPlanner] saving', newTasks.length, 'tasks for', uid);
    const { error: delErr } = await supabase.from('study_plans').delete().eq('user_id', uid);
    if (delErr) { console.error('[StudyPlanner] delete error:', delErr); return; }
    if (newTasks.length > 0) {
      const { error: insErr } = await supabase.from('study_plans').insert(
        newTasks.map((t, i) => ({ user_id: uid, text: t.text, done: t.done, duration: t.duration || '', sort_order: i }))
      );
      if (insErr) console.error('[StudyPlanner] insert error:', insErr);
    }
  };

  const debouncedSave = (newTasks) => {
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => saveToDb(newTasks), 600);
  };

  const addTask = () => {
    const text = input.trim();
    if (!text) return;
    const newTasks = [...tasks, { id: `local-${Date.now()}`, text, done: false, duration: '' }];
    setTasks(newTasks);
    setInput('');
    debouncedSave(newTasks);
  };

  const toggleTask = (id) => {
    const newTasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setTasks(newTasks);
    debouncedSave(newTasks);
  };

  const removeTask = (id) => {
    const newTasks = tasks.filter(t => t.id !== id);
    setTasks(newTasks);
    debouncedSave(newTasks);
  };

  const generatePlan = async () => {
    if (!goal.trim()) { setAIError('Masukkan tujuan belajarmu dulu.'); return; }
    setAILoading(true);
    setAIError('');
    try {
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      const model  = import.meta.env.VITE_AI_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free';
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [{
            role: 'system',
            content: 'You are a study planner assistant. You MUST respond with ONLY a valid JSON array, no markdown, no explanation, no code fences. Example: [{"text":"task name","duration":"30 min"}]'
          }, {
            role: 'user',
            content: `Create a daily study plan for this goal: "${goal}". Return ONLY a JSON array of exactly 4 tasks. Format: [{"text":"task","duration":"duration"}]. No markdown, no explanation.`
          }],
          max_tokens: 400,
        }),
      });
      const data = await res.json();
      let raw = data.choices?.[0]?.message?.content || '';
      console.log('[AI Study Planner] raw response:', raw);

      // Strategy 1: strip markdown code fences (```json ... ``` or ``` ... ```)
      raw = raw.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();

      // Strategy 2: extract first JSON array in the string
      const arrayMatch = raw.match(/\[[\s\S]*?\]/);
      if (!arrayMatch) {
        // Strategy 3: maybe it's wrapped in an object {"tasks": [...]}
        const objMatch = raw.match(/\{[\s\S]*\}/);
        if (objMatch) {
          const obj = JSON.parse(objMatch[0]);
          const arr = obj.tasks || obj.plan || obj.steps || Object.values(obj)[0];
          if (Array.isArray(arr)) {
            const newTasks = arr.slice(0, 6).map((t, i) => ({
              id: `ai-${Date.now()}-${i}`,
              text: t.text || t.task || t.name || String(t),
              done: false,
              duration: t.duration || t.time || '',
            }));
            setTasks(newTasks);
            setGoal('');
            await saveToDb(newTasks);
            return;
          }
        }
        throw new Error('Tidak ada JSON array ditemukan dalam respons AI');
      }

      const aiTasks = JSON.parse(arrayMatch[0]);
      if (!Array.isArray(aiTasks) || aiTasks.length === 0) {
        throw new Error('AI tidak menghasilkan tugas yang valid');
      }

      const newTasks = aiTasks.slice(0, 6).map((t, i) => ({
        id: `ai-${Date.now()}-${i}`,
        text: t.text || t.task || t.name || String(t),
        done: false,
        duration: t.duration || t.time || '',
      }));
      setTasks(newTasks);
      setGoal('');
      await saveToDb(newTasks);
    } catch (e) {
      console.error('[AI Study Planner] error:', e);
      setAIError('Gagal membuat rencana: ' + e.message);
    } finally {
      setAILoading(false);
    }
  };

  const completed = tasks.filter(t => t.done).length;

  return (
    <div className="bg-tertiary-fixed border-2 border-on-surface rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col gap-5 h-full">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-headline-md text-on-tertiary-fixed">AI Study Planner</h3>
          <p className="text-[10px] font-black text-on-tertiary-fixed opacity-50 mt-0.5">Tersimpan otomatis ☁️</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-on-tertiary-fixed opacity-60">{completed}/{tasks.length}</span>
          <Icon name="smart_toy" className="w-5 h-5 text-on-tertiary-fixed" />
        </div>
      </div>

      {/* AI Generate Input */}
      <div className="flex flex-col gap-2 p-3 bg-black/10 rounded-lg border border-on-surface/20">
        <p className="text-xs font-black text-on-tertiary-fixed opacity-70 uppercase tracking-wider">✨ Generate dengan AI</p>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg h-9 border-2 border-on-surface bg-white/80 px-3 text-sm font-body-md focus:outline-none focus:ring-0 placeholder:opacity-50"
            placeholder="Tujuan belajar hari ini..."
            value={goal}
            onChange={e => setGoal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && generatePlan()}
          />
          <button
            onClick={generatePlan}
            disabled={aiLoading}
            className="px-3 h-9 bg-on-surface text-white rounded-lg border-2 border-on-surface text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all disabled:opacity-50"
          >
            {aiLoading ? '...' : 'Buat'}
          </button>
        </div>
        {aiError && <p className="text-xs text-error font-bold">{aiError}</p>}
        <p className="text-[10px] text-on-tertiary-fixed opacity-40 italic">⚠️ Generate baru menggantikan rencana lama</p>
      </div>

      {/* Task List */}
      {dbLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-on-surface border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-40">
          <Icon name="smart_toy" className="w-10 h-10 text-on-tertiary-fixed" />
          <p className="text-xs font-bold text-on-tertiary-fixed text-center">Belum ada rencana.<br/>Generate AI atau tambah manual.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2 flex-1 overflow-y-auto max-h-56">
          {tasks.map(t => (
            <li key={t.id} className="flex items-center gap-3 bg-surface-container-lowest border-2 border-on-surface p-3 rounded-lg group">
              <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} className="w-5 h-5 rounded border-2 border-on-surface text-tertiary focus:ring-0 cursor-pointer shrink-0" />
              <span className={`font-label-bold text-on-surface flex-1 text-sm ${t.done ? 'line-through opacity-50' : ''}`}>{t.text}</span>
              {t.duration && <span className="text-xs font-black text-on-surface-variant shrink-0">{t.duration}</span>}
              <button onClick={() => removeTask(t.id)} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                <Icon name="close" className="w-4 h-4 text-on-surface-variant hover:text-error" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add Task Manually */}
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg h-10 border-2 border-on-surface bg-white/70 px-3 font-body-md text-sm focus:outline-none focus:ring-0 placeholder:opacity-50"
          placeholder="Tambah tugas manual..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
        />
        <button onClick={addTask} className="h-10 px-4 bg-on-surface text-surface rounded-lg border-2 border-on-surface font-label-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all">
          <Icon name="add" className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ─── Mood Playlists ───────────────────────────────────────────────
const MOODS = [
  { title: 'Lo-fi Beats',    desc: 'Chill rhythmic loops to keep momentum going.',   emoji: '🎵', accent: '#a78bfa', chip: 'bg-violet-100 border-violet-400', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400', youtubeId: 'jfKfPfyJRdk' },
  { title: 'Deep Focus',     desc: 'Binaural beats & soft drones for deep work.',    emoji: '🧠', accent: '#60a5fa', chip: 'bg-blue-100 border-blue-400',   img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=400', youtubeId: '5qap5aO4i9A' },
  { title: 'Classical',      desc: 'Timeless piano for reading & problem solving.',  emoji: '🎹', accent: '#f59e0b', chip: 'bg-amber-100 border-amber-400', img: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=400', youtubeId: 'mDX8QrcDI_g' },
  { title: 'Nature Ambient', desc: 'Rain & ocean waves to block distractions.',      emoji: '🌧️', accent: '#34d399', chip: 'bg-emerald-100 border-emerald-400', img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=400', youtubeId: 'eKFTSSKCzWA' },
  { title: 'Jazz Cafe',      desc: 'Smooth jazz for a cozy café atmosphere.',        emoji: '☕', accent: '#f97316', chip: 'bg-orange-100 border-orange-400', img: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?auto=format&fit=crop&q=80&w=400', youtubeId: 'HuFYqnbVbzY' },
  { title: 'White Noise',    desc: 'Pure steady noise to drown out distractions.',   emoji: '🌫️', accent: '#94a3b8', chip: 'bg-slate-100 border-slate-400',  img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=80&w=400', youtubeId: 'nMfPqeZjc2c' },
];

// Animated equalizer bars component
const EqualizerBars = ({ color = '#000' }) => (
  <div className="flex items-end gap-[3px] h-5">
    {[1,2,3,4,5].map(i => (
      <div
        key={i}
        className="w-[3px] rounded-full"
        style={{
          backgroundColor: color,
          height: `${Math.random() * 60 + 40}%`,
          animation: `equalizerBounce ${0.4 + i * 0.1}s ease-in-out infinite alternate`,
        }}
      />
    ))}
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────
const StudySpace = () => {
  const navigate = useNavigate();
  // Use global music context — iframe lives in PersistentMusicPlayer (always mounted)
  const { activeMood, isPlaying, iframeKey, moods, play, setIsPlaying } = useMusicPlayer();

  return (
    <div className="bg-background text-on-surface font-body-md flex h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-40 flex justify-between items-center px-6 lg:px-margin-desktop py-4 bg-surface border-b-2 border-on-surface shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
          <div>
            <h1 className="font-headline-md font-black text-on-surface">Study Space</h1>
            <p className="text-sm text-on-surface-variant">Focus tools & AI planner for deep learning sessions.</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationDropdown />
            <ProfileDropdown />
          </div>
        </header>

        <div className="p-6 lg:p-margin-desktop flex flex-col gap-8 pb-16">

          {/* ── Top Grid ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── YouTube Music Player Card ─────────────────────── */}
            <div
              className="border-2 border-on-surface rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col transition-all duration-300"
              style={{ backgroundColor: activeMood.accent + '18' }}
            >
              {/* Header bar */}
              <div
                className="flex items-center justify-between px-4 py-3 border-b-2 border-on-surface"
                style={{ backgroundColor: activeMood.accent + '30' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{activeMood.emoji}</span>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-on-surface opacity-60">Study Tunes</p>
                    <h3 className="font-headline-md text-on-surface leading-tight">{activeMood.title}</h3>
                  </div>
                </div>
                {/* Equalizer bars — animated when playing */}
                {isPlaying ? (
                  <div className="flex items-end gap-[3px] h-5">
                    {[70,40,90,55,75].map((h, i) => (
                      <div key={i} className="w-[3px] rounded-sm"
                        style={{ backgroundColor: activeMood.accent, height: `${h}%`, animation: `equalizerBounce ${0.35 + i * 0.08}s ease-in-out infinite alternate` }}
                      />
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] font-black text-on-surface-variant opacity-50">Paused</span>
                )}
              </div>

              {/* Thumbnail with play/pause overlay */}
              <div
                className="relative w-full border-b-2 border-on-surface bg-cover bg-center"
                style={{ paddingBottom: '56.25%', backgroundImage: `url("${activeMood.img}")` }}
              >
                <div className="absolute inset-0 bg-black/40" />
                {/* Play / Pause button */}
                <button
                  onClick={() => setIsPlaying(p => !p)}
                  className="absolute inset-0 flex items-center justify-center group"
                >
                  <div
                    className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center text-white text-3xl shadow-lg group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: activeMood.accent + 'cc' }}
                  >
                    {isPlaying ? '⏸' : '▶'}
                  </div>
                </button>
                {/* Mood name on thumbnail */}
                <div className="absolute bottom-3 left-3">
                  <span className="text-white text-xs font-black opacity-80 uppercase tracking-wider">
                    {isPlaying ? '▶ Playing via YouTube' : 'Click to play'}
                  </span>
                </div>
              </div>

              {/* Description + mood pills */}
              <div className="p-4 flex flex-col gap-3 flex-1">
                <p className="text-xs text-on-surface-variant font-bold leading-relaxed">{activeMood.desc}</p>
                {/* Mood selector pills */}
                <div className="flex gap-2 flex-wrap">
                  {moods.map((mood) => {
                    const isActive = activeMood.youtubeId === mood.youtubeId;
                    return (
                      <button
                        key={mood.youtubeId}
                        onClick={() => play(mood)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border-2 font-label-bold text-[11px] transition-all ${
                          isActive
                            ? 'border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] -translate-y-0.5 text-on-surface'
                            : 'border-on-surface/30 text-on-surface-variant hover:border-on-surface hover:-translate-y-0.5'
                        }`}
                        style={isActive ? { backgroundColor: mood.accent + '30', borderColor: mood.accent } : {}}
                      >
                        <span>{mood.emoji}</span>
                        <span>{mood.title}</span>
                        {isActive && isPlaying && <span className="text-[8px] animate-pulse">▶</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* AI Study Planner */}
            <AIStudyPlanner />

            {/* Pomodoro + Daily Quiz */}
            <div className="flex flex-col gap-6">
              <PomodoroTimer />
              <div className="bg-primary-container border-2 border-on-surface rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-headline-md text-on-primary-container">Daily Quiz</h3>
                  <Icon name="lightbulb" className="w-5 h-5 text-on-primary-container" />
                </div>
                <p className="font-body-md text-on-primary-fixed-variant text-sm">Test your knowledge and earn a streak!</p>
                <button
                  onClick={() => navigate('/challenge')}
                  className="w-full py-3 bg-surface-container-lowest text-on-surface font-label-bold rounded-lg border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
                >
                  <span>Start Challenge</span>
                  <Icon name="arrow_forward" className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Mood Cards Grid ─────────────────────────────────── */}
          <div className="flex flex-col gap-4 pb-4">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-lg text-on-surface">Study Moods</h2>
              <span className="text-xs font-black text-on-surface-variant opacity-60 uppercase tracking-wider">Klik untuk putar</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {MOODS.map((mood) => {
                const isActive = activeMood.youtubeId === mood.youtubeId;
                return (
                  <button
                    key={mood.youtubeId}
                    onClick={() => handleMoodClick(mood)}
                    className={`relative overflow-hidden border-2 rounded-xl text-left transition-all duration-200 ${
                      isActive
                        ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-1'
                        : 'border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                    style={{ borderColor: isActive ? mood.accent : undefined }}
                  >
                    {/* Photo */}
                    <div
                      className="h-24 bg-cover bg-center border-b-2 border-on-surface relative"
                      style={{ backgroundImage: `url("${mood.img}")` }}
                    >
                      {/* Dark overlay */}
                      <div className="absolute inset-0 bg-black/30" />
                      {/* Emoji centered */}
                      <span className="absolute inset-0 flex items-center justify-center text-3xl drop-shadow">{mood.emoji}</span>
                      {/* Active badge */}
                      {isActive && (
                        <div
                          className="absolute top-2 right-2 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-white/50"
                          style={{ backgroundColor: mood.accent }}
                        >
                          <span className="animate-pulse">▶</span>
                        </div>
                      )}
                    </div>
                    {/* Label area */}
                    <div
                      className="p-2.5"
                      style={{ backgroundColor: isActive ? mood.accent + '25' : 'white' }}
                    >
                      <p className="font-label-bold text-xs text-on-surface truncate">{mood.title}</p>
                      {isActive && (
                        <div className="flex items-end gap-[2px] h-3 mt-1">
                          {[1,2,3,4,5].map(i => (
                            <div
                              key={i}
                              className="w-[2px] rounded-sm"
                              style={{
                                backgroundColor: mood.accent,
                                height: `${[70,40,90,55,75][i-1]}%`,
                                animation: `equalizerBounce ${0.3+i*0.1}s ease-in-out infinite alternate`,
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default StudySpace;


