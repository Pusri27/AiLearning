import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileDropdown from '../components/ProfileDropdown';
import NotificationDropdown from '../components/NotificationDropdown';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabaseClient';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { 
  CloudIcon, 
  SparklesIcon, 
  WarningIcon, 
  MusicIcon, 
  BrainIcon, 
  PianoIcon, 
  RainIcon, 
  CoffeeIcon, 
  FogIcon,
  PlayIcon,
  PauseIcon
} from '../components/Icons';

const getMoodIcon = (iconName, className) => {
  switch (iconName) {
    case 'music': return <MusicIcon className={className} />;
    case 'brain': return <BrainIcon className={className} />;
    case 'piano': return <PianoIcon className={className} />;
    case 'rain': return <RainIcon className={className} />;
    case 'coffee': return <CoffeeIcon className={className} />;
    case 'fog': return <FogIcon className={className} />;
    default: return null;
  }
};

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
        <div className="flex flex-col gap-3 p-3 bg-black/10 rounded-lg border border-on-surface/20 animate-pulse-once">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className={`text-[10px] font-black uppercase ${textColor} opacity-70`}>Fokus (menit)</label>
              <input
                type="number" min="1" max="180"
                value={customF}
                onChange={e => setCustomF(e.target.value)}
                className="h-9 w-full border-2 border-on-surface rounded-lg px-2 text-center font-black bg-white/80 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={`text-[10px] font-black uppercase ${textColor} opacity-70`}>Istirahat (menit)</label>
              <input
                type="number" min="1" max="60"
                value={customB}
                onChange={e => setCustomB(e.target.value)}
                className="h-9 w-full border-2 border-on-surface rounded-lg px-2 text-center font-black bg-white/80 focus:outline-none"
              />
            </div>
          </div>
          <button
            onClick={applyCustom}
            className="w-full h-9 bg-on-surface text-white rounded-lg border-2 border-on-surface font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:translate-y-[-1px] transition-all"
          >
            OK
          </button>
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
          <p className="text-[10px] font-black text-on-tertiary-fixed opacity-50 mt-0.5 flex items-center gap-1">Tersimpan otomatis <CloudIcon className="w-3 h-3" /></p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-on-tertiary-fixed opacity-60">{completed}/{tasks.length}</span>
          <Icon name="smart_toy" className="w-5 h-5 text-on-tertiary-fixed" />
        </div>
      </div>

      {/* AI Generate Input */}
      <div className="flex flex-col gap-2 p-3 bg-black/10 rounded-lg border border-on-surface/20">
        <p className="text-xs font-black text-on-tertiary-fixed opacity-70 uppercase tracking-wider flex items-center gap-1"><SparklesIcon className="w-3 h-3" /> Generate dengan AI</p>
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
        <p className="text-[10px] text-on-tertiary-fixed opacity-40 italic flex items-center gap-1"><WarningIcon className="w-3 h-3" /> Generate baru menggantikan rencana lama</p>
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
// (Removed local MOODS array as it is handled by MusicPlayerContext)

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
import { useUserProfile } from '../context/UserProfileContext';

const StudySpace = () => {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const isGuest = profile.isGuest;
  const { activeMood, isPlaying, moods, play, playCustom, setIsPlaying, customPlaylists, playbackMode } = useMusicPlayer();
  const [customUrl, setCustomUrl] = useState('');

  const handleMoodClick = (mood) => {
    play(mood);
  };

  return (
    <div className="bg-background text-on-surface font-body-md flex h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-y-auto min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-40 flex justify-between items-center px-4 md:px-6 lg:px-margin-desktop py-3 md:py-4 bg-surface border-b-2 border-on-surface shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
          <div>
            <h1 className="font-headline-md font-black text-on-surface">Study Space</h1>
            <p className="text-sm text-on-surface-variant hidden md:block">Focus tools & AI planner for deep learning sessions.</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationDropdown />
            <ProfileDropdown />
          </div>
        </header>

        <div className="p-4 md:p-6 lg:p-margin-desktop flex flex-col gap-6 md:gap-8 pb-24 md:pb-16">

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
                  <span className="text-lg">{getMoodIcon(activeMood.iconName, "w-6 h-6")}</span>
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
                    {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                  </div>
                </button>
                {/* Mood name on thumbnail */}
                <div className="absolute bottom-3 left-3">
                  <span className="text-white text-xs font-black opacity-80 uppercase tracking-wider">
                    {isPlaying ? (playbackMode === 'youtube' ? '▶ Playing via YouTube' : '▶ Playing Backup Stream') : 'Click to play'}
                  </span>
                </div>
              </div>

              {/* Description + mood pills */}
              <div className="p-4 flex flex-col gap-4 flex-1">
                <p className="text-xs text-on-surface-variant font-bold leading-relaxed">{activeMood.desc}</p>
                
                {/* Custom Link Input */}
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Paste YouTube link here..."
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="flex-1 bg-white/50 border-2 border-on-surface/20 rounded-lg px-3 py-1.5 text-[11px] font-bold focus:bg-white focus:border-on-surface outline-none transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        playCustom(customUrl);
                        setCustomUrl('');
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      playCustom(customUrl);
                      setCustomUrl('');
                    }}
                    className="px-3 bg-on-surface text-white rounded-lg border-2 border-on-surface text-[10px] font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
                  >
                    Play
                  </button>
                </div>

                {/* Mood selector pills */}
                <div className="flex gap-2 flex-wrap mt-1">
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
                        <span>{getMoodIcon(mood.iconName, "w-4 h-4")}</span>
                        <span>{mood.title}</span>
                        {isActive && isPlaying && <PlayIcon className="w-2 h-2 animate-pulse" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* AI Study Planner */}
            <div className="relative group">
              <AIStudyPlanner />
              {isGuest && (
                <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] z-10 flex items-center justify-center p-4">
                  <div className="bg-surface border-4 border-on-surface p-6 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center space-y-4 transform group-hover:scale-105 transition-transform">
                    <div className="w-12 h-12 bg-primary-container rounded-full flex items-center justify-center mx-auto border-2 border-on-surface">
                      <Icon name="lock" className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-headline-md text-on-surface">Fitur Terkunci</h4>
                      <p className="text-xs font-bold text-on-surface-variant mt-1">Masuk untuk membuat rencana belajar AI yang dipersonalisasi.</p>
                    </div>
                    <button 
                      onClick={() => navigate('/login')}
                      className="w-full py-2 bg-primary text-white font-black rounded-lg border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                    >
                      Masuk Sekarang
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Pomodoro + Daily Quiz */}
            <div className="flex flex-col gap-6">
              <PomodoroTimer />
              <div className="relative group">
                <div className="bg-primary-container border-2 border-on-surface rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-headline-md text-on-primary-container">Daily Quiz</h3>
                    <Icon name="lightbulb" className="w-5 h-5 text-on-primary-container" />
                  </div>
                  <p className="font-body-md text-on-primary-fixed-variant text-sm">Test your knowledge and earn a streak!</p>
                  <button
                    onClick={() => navigate('/challenge')}
                    disabled={isGuest}
                    className={`w-full py-3 bg-surface-container-lowest text-on-surface font-label-bold rounded-lg border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 ${isGuest ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span>Start Challenge</span>
                    <Icon name="arrow_forward" className="w-5 h-5" />
                  </button>
                </div>
                {isGuest && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-surface/90 border-2 border-on-surface px-3 py-1 rounded-full shadow-md">
                      <p className="text-[10px] font-black uppercase text-on-surface">Login Required</p>
                    </div>
                  </div>
                )}
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
              {moods.map((mood) => {
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
                      {/* Icon centered */}
                      <span className="absolute inset-0 flex items-center justify-center drop-shadow">{getMoodIcon(mood.iconName, "w-10 h-10 text-white")}</span>
                      {/* Active badge */}
                      {isActive && (
                        <div
                          className="absolute top-2 right-2 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-white/50"
                          style={{ backgroundColor: mood.accent }}
                        >
                          <PlayIcon className="w-4 h-4 animate-pulse" />
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

            {/* ── Recent Custom Streams ─────────────────────────── */}
            {customPlaylists && customPlaylists.length > 0 && (
              <div className="flex flex-col gap-4 mt-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between">
                  <h2 className="font-headline-md text-on-surface">Recent Custom Streams</h2>
                  <span className="text-[10px] font-black text-on-surface-variant opacity-60 uppercase tracking-wider">Tersimpan otomatis</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {customPlaylists.map((mood) => {
                    const isActive = activeMood.youtubeId === mood.youtubeId;
                    return (
                      <button
                        key={mood.youtubeId}
                        onClick={() => handleMoodClick(mood)}
                        className={`relative overflow-hidden border-2 rounded-xl text-left transition-all duration-200 ${
                          isActive
                            ? 'shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-1'
                            : 'border-on-surface shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]'
                        }`}
                        style={{ borderColor: isActive ? mood.accent : undefined }}
                      >
                        <div
                          className="h-20 bg-cover bg-center border-b-2 border-on-surface relative"
                          style={{ backgroundImage: `url("${mood.img}")` }}
                        >
                          <div className="absolute inset-0 bg-black/40" />
                          <span className="absolute inset-0 flex items-center justify-center text-white/80"><MusicIcon className="w-8 h-8" /></span>
                          {isActive && (
                            <div className="absolute top-2 right-2 p-1 rounded bg-pink-500 border border-white/50">
                              <PlayIcon className="w-3 h-3 text-white animate-pulse" />
                            </div>
                          )}
                        </div>
                        <div className="p-2 bg-white" style={isActive ? { backgroundColor: mood.accent + '15' } : {}}>
                          <p className="font-label-bold text-[11px] text-on-surface truncate">{mood.title}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default StudySpace;


