import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Icon from '../components/Icon';
import TeacherSidebar from '../components/TeacherSidebar';
import { supabase } from '../lib/supabaseClient';
import { showToast } from '../lib/toast';
import RichMaterialRenderer from '../components/RichMaterialRenderer';

const TeacherCoursePreview = () => {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const from = queryParams.get('from'); // 'edit' or 'list'

  const handleExitPreview = () => {
    if (from === 'edit') {
      navigate(`/teacher/courses/edit/${courseId}`);
    } else {
      navigate('/teacher/courses');
    }
  };

  const handleMarkCompleteSimulation = () => {
    const isNowCompleted = !activeLesson.completed;
    const updatedLessons = lessons.map(l => 
      l.id === activeLesson.id ? { ...l, completed: isNowCompleted } : l
    );
    setLessons(updatedLessons);
    setActiveLesson({ ...activeLesson, completed: isNowCompleted });
    
    if (isNowCompleted) {
      showToast('Mode Preview: Simulasi selesai (Progress tidak disimpan).');
      // Otomatis ke materi selanjutnya setelah delay singkat agar guru bisa melihat tanda centang
      setTimeout(() => {
        const idx = updatedLessons.findIndex(l => l.id === activeLesson.id);
        if (idx < updatedLessons.length - 1) {
          handleSelectLesson(updatedLessons[idx + 1]);
        }
      }, 800);
    } else {
      showToast('Mode Preview: Status selesai dibatalkan.');
    }
  };

  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [codeBody, setCodeBody] = useState('');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const [showConfirmNext, setShowConfirmNext] = useState(false);

  const getEmbedUrl = (url) => {
    if (!url) return '';
    url = url.trim();
    let videoId = null;
    try {
      if (url.includes('/embed/')) return url;
      if (url.includes('youtu.be/')) {
        const parts = url.split('youtu.be/');
        if (parts[1]) videoId = parts[1].split('?')[0].split('/')[0];
      } else if (url.includes('/shorts/')) {
        const parts = url.split('/shorts/');
        if (parts[1]) videoId = parts[1].split('?')[0].split('/')[0];
      } else if (url.includes('youtube.com')) {
        const urlObj = new URL(url);
        videoId = urlObj.searchParams.get('v');
      }
      if (!videoId) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) videoId = match[2];
      }
    } catch { /* ignore */ }
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    return url;
  };

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      const cleanId = isNaN(Number(courseId)) ? courseId : Number(courseId);
      const { data: courseData } = await supabase.from('courses').select('*').eq('id', cleanId).single();
      if (!courseData) { setLoading(false); return; }
      setCourse(courseData);

      const { data: sectionsData } = await supabase
        .from('course_sections')
        .select('*, course_syllabus(*)')
        .eq('course_id', cleanId)
        .order('sort_order');

      const processedSections = (sectionsData || []).map(sec => ({
        ...sec,
        course_syllabus: (sec.course_syllabus || []).sort((a, b) => a.sort_order - b.sort_order)
      }));
      setSections(processedSections);

      const allSyllabus = processedSections.flatMap(s => s.course_syllabus);
      const mappedLessons = allSyllabus.map(item => {
        let type = 'reading';
        let icon = 'menu_book';
        if (item.type === 'final_project') { type = 'final_project'; icon = 'workspace_premium'; }
        else if (item.type === 'coding') { type = 'interactive'; icon = 'code'; }
        else if (item.type === 'assignment') { type = 'assignment'; icon = 'assignment'; }
        else if (item.type === 'material') { type = 'reading'; icon = 'menu_book'; }
        if (item.video_url && type === 'reading') { type = 'video'; icon = 'play_circle'; }
        return {
          id: item.id,
          title: item.title,
          type,
          icon,
          content: item.content || item.assignment_text || '',
          video_url: item.video_url,
          assignment_text: item.assignment_text,
          allowed_file_types: item.allowed_file_types,
          initial_code: item.initial_code,
          completed: false, // Default for preview
        };
      });
      setLessons(mappedLessons);
      if (mappedLessons.length > 0) {
        setActiveLesson(mappedLessons[0]);
        if (mappedLessons[0].initial_code) setCodeBody(mappedLessons[0].initial_code);
      }
      setLoading(false);
    };
    fetchCourse();
  }, [courseId]);

  const handleSelectLesson = (lesson) => {
    setActiveLesson(lesson);
    setIsVideoPlaying(false);
    if (lesson.initial_code) setCodeBody(lesson.initial_code);
    else setCodeBody('');
  };

  const handleNextLesson = () => {
    if (!activeLesson.completed) {
      setShowConfirmNext(true);
      return;
    }
    const idx = lessons.findIndex(l => l.id === activeLesson.id);
    if (idx < lessons.length - 1) handleSelectLesson(lessons[idx + 1]);
    else showToast('Selamat! Anda telah mencapai akhir materi (Preview).');
  };

  const handleConfirmNext = (completedThis) => {
    setShowConfirmNext(false);
    if (completedThis) {
      handleMarkCompleteSimulation();
    }
  };

  const handlePrevLesson = () => {
    const idx = lessons.findIndex(l => l.id === activeLesson.id);
    if (idx > 0) handleSelectLesson(lessons[idx - 1]);
  };

  const isLessonLocked = (sylId) => {
    const lessonIndex = lessons.findIndex(l => l.id === sylId);
    if (lessonIndex <= 0) return false;
    
    // Lesson is locked if any previous lesson is not completed
    for (let i = 0; i < lessonIndex; i++) {
      if (!lessons[i].completed) return true;
    }
    return false;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface font-sans">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface font-sans flex-col gap-4">
        <Icon name="error" className="w-16 h-16 opacity-20" />
        <p className="font-black text-xl">Kursus tidak ditemukan.</p>
        <button onClick={handleExitPreview} className="px-6 py-3 bg-primary text-white rounded-2xl font-black">Kembali</button>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface font-sans antialiased min-h-screen flex">
      <TeacherSidebar />

      <div className="flex-1 lg:ml-[280px] flex flex-col min-h-screen">
        {/* Preview Banner */}
        <div className="bg-on-surface text-white px-6 py-3 flex items-center justify-between shrink-0 z-50 sticky top-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">visibility</span>
            <div>
              <span className="font-black text-sm">👁️ PREVIEW MODE</span>
              <span className="text-white/60 text-xs ml-2 font-bold">— Simulasi tampilan Student. Klik "Tandai Selesai" untuk navigasi materi.</span>
            </div>
          </div>
          <button
            onClick={handleExitPreview}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-black text-sm transition-all border border-white/20"
          >
            <span className="material-symbols-outlined text-sm">close</span>
            Keluar Preview
          </button>
        </div>

        {activeLesson ? (
          <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 48px)' }}>
            {/* Sidebar: Section & Lesson List */}
            <aside className="w-72 shrink-0 bg-surface border-r-2 border-on-background flex flex-col overflow-hidden">
              {/* Course Title */}
              <div className="p-5 border-b-2 border-on-background bg-surface-container">
                <div className="flex items-center gap-3 mb-3">
                  <button onClick={handleExitPreview} className="p-1.5 hover:bg-surface-variant rounded-lg border border-on-background transition-all">
                    <Icon name="arrow_back" className="w-4 h-4" />
                  </button>
                  <h2 className="font-black text-sm text-on-surface truncate">{course.title}</h2>
                </div>
                {/* Fake progress bar */}
                <div className="w-full bg-surface-variant rounded-full h-2 border border-on-background/20 overflow-hidden">
                  <div className="bg-primary h-full rounded-full w-0 transition-all" style={{ width: '0%' }} />
                </div>
                <p className="text-[10px] text-on-surface-variant font-bold mt-1">0% selesai (Preview)</p>
              </div>

              {/* Lessons */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-surface-container-lowest">
                {sections.map((section, sIdx) => (
                  <div key={section.id}>
                    <div className="flex items-center justify-between mb-2 px-1">
                      <p className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest">Bab {sIdx + 1}: {section.title}</p>
                    </div>
                    <div className="space-y-2">
                      {section.course_syllabus.map((syl) => {
                        const lesson = lessons.find(l => l.id === syl.id);
                        const isActive = activeLesson?.id === syl.id;
                        const isCompleted = lesson?.completed;
                        const isLocked = isLessonLocked(syl.id);
                        const isFinalProject = syl.type === 'final_project';
                        const isAssignment = syl.type === 'assignment' || syl.type === 'final_project';
                        return (
                          <button
                            key={syl.id}
                            disabled={isLocked}
                            onClick={() => lesson && handleSelectLesson(lesson)}
                            className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-start gap-3 text-on-surface ${
                              isActive
                                ? 'bg-primary-container border-on-background shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                                : isLocked
                                ? 'border-transparent cursor-not-allowed opacity-50'
                                : 'bg-white border-on-background/5 hover:border-on-background hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${isCompleted ? 'bg-green-50 border-green-600 text-green-600' : isLocked ? 'bg-surface border-on-background/20 text-on-surface-variant/40' : isActive ? 'bg-white border-primary' : 'bg-white border-on-background/20'}`}>
                              {isCompleted ? (
                                <Icon name="check" className="w-2.5 h-2.5 text-green-600" />
                              ) : isLocked ? (
                                <Icon name="lock" className="w-2.5 h-2.5" />
                              ) : isFinalProject ? (
                                <Icon name="workspace_premium" className="w-2.5 h-2.5 text-primary" />
                              ) : isAssignment ? (
                                <Icon name="assignment" className="w-2.5 h-2.5 text-secondary" />
                              ) : isActive ? (
                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                              ) : null}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-[11px] leading-snug ${isActive ? 'font-black' : 'font-bold'}`}>{syl.title}</p>
                              {isAssignment && (
                                <span className={`text-[8px] font-black ${isFinalProject ? 'text-primary' : 'text-secondary'} uppercase mt-0.5 block tracking-tighter`}>
                                  {isFinalProject ? 'Evaluasi Akhir' : 'Tugas Akhir Bab'}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-surface-bright">
              <header className="h-16 bg-surface border-b-2 border-on-background shadow-[0px_2px_0px_0px_rgba(0,0,0,1)] flex items-center px-6 justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <Icon name={activeLesson.icon || 'menu_book'} className="w-6 h-6 text-primary" />
                  <h1 className="font-black text-on-surface truncate">{activeLesson.title}</h1>
                </div>
                <div className="flex gap-2">
                  <button onClick={handlePrevLesson} disabled={lessons.findIndex(l => l.id === activeLesson.id) === 0} className="p-2 border-2 border-on-background rounded-lg hover:bg-surface-container transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    <Icon name="chevron_left" className="w-5 h-5" />
                  </button>
                  <button onClick={handleNextLesson} className="p-2 border-2 border-on-background rounded-lg hover:bg-surface-container transition-all">
                    <Icon name="chevron_right" className="w-5 h-5" />
                  </button>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-6 md:p-10 lg:px-20 max-w-5xl mx-auto w-full space-y-8">
                {/* Video */}
                {activeLesson.type === 'video' && (
                  isVideoPlaying && activeLesson.video_url ? (
                    <div className="aspect-video w-full bg-black border-4 border-on-background rounded-2xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                      <iframe className="w-full h-full" src={`${getEmbedUrl(activeLesson.video_url)}?autoplay=1&rel=0`} title={activeLesson.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    </div>
                  ) : (
                    <div className="aspect-video w-full bg-black border-4 border-on-background rounded-2xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center relative">
                      <div className="absolute inset-0 bg-cover bg-center opacity-60 filter blur-sm" style={{ backgroundImage: `url(${course?.image_url})` }} />
                      <div className="relative z-10 flex flex-col items-center gap-4">
                        <button onClick={() => setIsVideoPlaying(true)} className="w-20 h-20 bg-primary text-white rounded-full border-4 border-on-background flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:scale-110 transition-all">
                          <Icon name="play_arrow" className="w-12 h-12 fill-current" />
                        </button>
                        <span className="text-sm font-black bg-black/80 text-white px-4 py-1.5 rounded-full uppercase tracking-wider">Putar Video</span>
                      </div>
                    </div>
                  )
                )}

                {/* Assignment / Final Project */}
                {(activeLesson.type === 'assignment' || activeLesson.type === 'final_project') && (
                  <div className="p-6 bg-tertiary-container border-4 border-on-background rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
                    <div className="flex items-center gap-3 pb-3 border-b-2 border-on-background/10">
                      <div className="p-2 bg-white border-2 border-on-background rounded-lg">
                        <Icon name={activeLesson.type === 'final_project' ? 'workspace_premium' : 'assignment'} className={`w-8 h-8 ${activeLesson.type === 'final_project' ? 'text-primary' : 'text-tertiary'}`} />
                      </div>
                      <div>
                        <h4 className="text-xl font-black">{activeLesson.type === 'final_project' ? 'Tugas Akhir (Final Project)' : 'Tugas Praktik'}</h4>
                        <p className="text-xs text-on-surface-variant font-bold">{activeLesson.type === 'final_project' ? 'Evaluasi akhir sebagai syarat kelulusan.' : 'Kirimkan hasil pekerjaan Anda.'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white border-2 border-on-background p-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        <span className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant/80">WAKTU PENGERJAAN</span>
                        <p className="text-sm font-black text-on-surface mt-1">Flexible (Kapan Saja)</p>
                      </div>
                      <div className="bg-white border-2 border-on-background p-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        <span className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant/80">FORMAT FILE</span>
                        <p className="text-sm font-black text-on-surface mt-1">{activeLesson.allowed_file_types || 'pdf, docx, zip, png, jpg'}</p>
                      </div>
                    </div>
                    <div className="bg-white border-2 border-on-background p-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      <span className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant/80 block mb-2">PANDUAN TUGAS</span>
                      <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">{activeLesson.assignment_text || 'Silakan ikuti instruksi.'}</p>
                    </div>
                    {/* Disabled upload zone */}
                    <div className="bg-white border-2 border-on-background p-6 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mt-2 opacity-50 pointer-events-none">
                      <div className="border-4 border-dashed border-on-background/20 rounded-xl p-6 text-center">
                        <Icon name="cloud_upload" className="w-10 h-10 mx-auto text-on-surface-variant/40 mb-2" />
                        <p className="text-xs font-bold text-on-surface-variant">Upload file (dinonaktifkan di Preview)</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Interactive / Coding */}
                {activeLesson.type === 'interactive' && (
                  <div className="p-6 bg-[#181818] border-4 border-on-background rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col min-h-[480px]">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-red-500" />
                          <span className="w-3 h-3 rounded-full bg-yellow-500" />
                          <span className="w-3 h-3 rounded-full bg-green-500" />
                        </div>
                        <h4 className="font-mono text-sm text-gray-400 font-bold">interactive.js</h4>
                      </div>
                      <span className="text-[10px] font-black text-white/40 border border-white/20 px-3 py-1 rounded-lg uppercase">Preview — Kirim Jawaban Dinonaktifkan</span>
                    </div>
                    <div className="flex-1 font-mono text-sm text-green-400 flex flex-col">
                      <textarea
                        value={codeBody}
                        onChange={(e) => setCodeBody(e.target.value)}
                        className="w-full flex-grow bg-transparent border-none outline-none resize-none font-mono text-slate-100 py-2 focus:ring-0"
                        rows={8}
                        spellCheck="false"
                        placeholder="// Initial code akan tampil di sini..."
                      />
                      <div className="mt-4 pt-3 border-t border-white/10 flex justify-between">
                        <span className="text-[10px] text-white/30 font-bold uppercase">Preview Mode — Run & Submit Dinonaktifkan</span>
                        <div className="flex gap-2">
                          <button disabled className="px-4 py-2 border border-white/20 text-gray-600 font-mono text-xs rounded cursor-not-allowed">Reset</button>
                          <button disabled className="px-8 py-2.5 bg-green-900 text-green-700 font-black uppercase text-xs rounded border-2 border-green-800 cursor-not-allowed">Run Code</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reading Content */}
                {(activeLesson.type === 'reading' || activeLesson.type === 'video') && (
                  <div className="bg-white border-2 border-on-background rounded-xl p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="text-2xl font-black mb-6">Materi: {activeLesson.title}</h3>
                    <div className="prose max-w-none text-on-surface-variant font-medium">
                      <RichMaterialRenderer content={activeLesson.content} />
                    </div>
                  </div>
                )}

                {/* Navigation Footer */}
                <div className="flex justify-between items-center py-6 border-t-2 border-on-background">
                  <button onClick={handlePrevLesson} disabled={lessons.findIndex(l => l.id === activeLesson.id) === 0} className="px-6 py-3 font-bold text-on-surface border-2 border-on-background rounded-lg hover:bg-surface-container transition-all disabled:opacity-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    Materi Sebelumnya
                  </button>
                  <div className="flex gap-4">
                    {/* Simulation action button */}
                    <button 
                      onClick={handleMarkCompleteSimulation}
                      className={`px-6 py-3 rounded-lg border-2 border-on-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 transition-all active:translate-y-0.5 active:shadow-none font-black ${
                        activeLesson.completed ? 'bg-surface-container text-on-surface' : 'bg-white text-on-surface hover:bg-primary-container/20'
                      }`}
                    >
                      <Icon name={activeLesson.completed ? 'close' : 'check_circle'} className={`w-5 h-5 ${activeLesson.completed ? 'text-on-surface-variant' : 'text-success'}`} />
                      {activeLesson.completed ? 'Batalkan Selesai' : 'Tandai Selesai'}
                    </button>
                    <button onClick={handleNextLesson} className="px-6 py-3 bg-primary text-white font-black rounded-lg border-2 border-on-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2">
                      Materi Selanjutnya <Icon name="arrow_forward" className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </main>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col gap-6 p-10">
            <Icon name="menu_book" className="w-20 h-20 opacity-10" />
            <h2 className="text-2xl font-black text-on-surface">Kursus ini belum memiliki materi.</h2>
            <p className="text-on-surface-variant font-bold">Tambahkan section dan materi terlebih dahulu.</p>
            <button onClick={() => navigate(`/teacher/courses/edit/${courseId}`)} className="px-8 py-3 bg-primary text-white rounded-2xl font-black border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Edit Kursus
            </button>
          </div>
        )}
      </div>

      {showConfirmNext && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border-4 border-on-background rounded-2xl p-6 max-w-md w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-xl font-black text-on-surface mb-4">Selesaikan Modul?</h3>
            <p className="text-on-surface-variant mb-6 font-bold">Apakah Anda sudah menyelesaikan modul "{activeLesson?.title}"?</p>
            <div className="flex gap-3">
              <button onClick={() => handleConfirmNext(true)} className="flex-1 px-5 py-3 bg-primary text-white font-black rounded-lg border-2 border-on-background shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-y-0.5 active:shadow-none">Sudah Selesai</button>
              <button onClick={() => handleConfirmNext(false)} className="flex-1 px-5 py-3 bg-surface-container text-on-surface font-black rounded-lg border-2 border-on-background shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-y-0.5 active:shadow-none">Belum Selesai</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherCoursePreview;
