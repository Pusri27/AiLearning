import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabaseClient';
import { showToast } from '../lib/toast';
import { useUserProfile } from '../context/UserProfileContext';
import confetti from 'canvas-confetti';

const CourseLesson = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [enrollmentProgress, setEnrollmentProgress] = useState(0);
  const [certificate, setCertificate] = useState(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const [showConfirmNext, setShowConfirmNext] = useState(false);
  const [codeBody, setCodeBody] = useState(
    "  // Tulis kode pemrosesan data di sini...\n  // Hapus duplikat & urutkan descending\n  \n  return data;"
  );
  const [terminalOutput, setTerminalOutput] = useState("");

  const [submission, setSubmission] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const triggerConfetti = useCallback(() => {
    const duration = 4 * 1000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0, y: 0.8 } });
      confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1, y: 0.8 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

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
    const fetchSubmission = async () => {
      if (activeLesson?.type === 'assignment') {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          try {
            const { data } = await supabase.from('submissions').select('*').eq('student_id', session.user.id).eq('syllabus_id', activeLesson.id).maybeSingle();
            setSubmission(data);
          } catch (err) { console.error("Error fetching submission:", err); }
        }
      } else {
        setSubmission(null);
        setSubmissionFile(null);
      }
    };
    fetchSubmission();
  }, [activeLesson]);

  const [sections, setSections] = useState([]);
  const [completedIds, setCompletedIds] = useState([]);

  const getSortedSyllabus = (syllabus) => {
    if (!syllabus) return [];
    return [...syllabus].sort((a, b) => {
      const aIsAssignment = a.type === 'assignment' || !!a.assignment_text;
      const bIsAssignment = b.type === 'assignment' || !!b.assignment_text;
      if (aIsAssignment && !bIsAssignment) return 1;
      if (!aIsAssignment && bIsAssignment) return -1;
      return a.sort_order - b.sort_order;
    });
  };

  const isSectionLocked = (sectionIndex) => {
    if (sectionIndex === 0) return false;
    for (let i = 0; i < sectionIndex; i++) {
      const prevSection = sections[i];
      if (!prevSection.course_syllabus.every(s => completedIds.includes(s.id))) return true;
    }
    return false;
  };

  const isLessonLocked = (sylId) => {
    const lessonIndex = lessons.findIndex(l => l.id === sylId);
    if (lessonIndex <= 0) return false;
    
    // Lesson is locked if any previous lesson is not completed
    for (let i = 0; i < lessonIndex; i++) {
      if (!completedIds.includes(lessons[i].id)) return true;
    }
    return false;
  };

  useEffect(() => {
    const fetchCourseAndProgress = async () => {
      setLoading(true);
      const cleanCourseId = isNaN(Number(courseId)) ? courseId : Number(courseId);
      const { data: courseData } = await supabase.from('courses').select('*').eq('id', cleanCourseId).single();
      if (!courseData) { setLoading(false); return; }
      setCourse(courseData);

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: sectionsData } = await supabase.from('course_sections').select(`*, course_syllabus (*)`).eq('course_id', cleanCourseId).order('sort_order');
        const processedSections = (sectionsData || []).map(sec => ({ ...sec, course_syllabus: getSortedSyllabus(sec.course_syllabus) }));
        setSections(processedSections);

        const allSyllabus = processedSections.flatMap(s => s.course_syllabus);
        const { data: progressData } = await supabase.from('user_progress').select('syllabus_id').eq('user_id', session.user.id).eq('course_id', cleanCourseId);
        const progIds = progressData ? progressData.map(p => p.syllabus_id) : [];
        setCompletedIds(progIds);

        const { data: enrollment } = await supabase.from('enrollments').select('id, progress').eq('user_id', session.user.id).eq('course_id', cleanCourseId).maybeSingle();
        const mappedLessons = allSyllabus.map(item => {
          const isCompleted = progIds.includes(item.id);
          let type = 'reading'; let icon = 'menu_book';
          
          // Priority 1: Explicit Type from Database
          if (item.type === 'final_project') { type = 'final_project'; icon = 'workspace_premium'; }
          else if (item.type === 'coding') { type = 'interactive'; icon = 'code'; }
          else if (item.type === 'assignment') { type = 'assignment'; icon = 'assignment'; }
          else if (item.type === 'material') { type = 'reading'; icon = 'menu_book'; }
          // Priority 2: Fallback to content-based detection if type is missing
          else if (item.initial_code && item.test_cases) { type = 'interactive'; icon = 'code'; }
          else if (!!item.assignment_text) { type = 'assignment'; icon = 'assignment'; }
          
          if (item.video_url && type === 'reading') { type = 'video'; icon = 'play_circle'; }
          
          return { id: item.id, title: item.title, duration: (type === 'assignment' || type === 'final_project') ? 'Penugasan' : '30 mins', type, icon, content: item.content || item.assignment_text || '', completed: isCompleted, video_url: item.video_url, assignment_text: item.assignment_text, allowed_file_types: item.allowed_file_types, initial_code: item.initial_code, test_cases: item.test_cases };
        });
        setLessons(mappedLessons);

        const newProgress = mappedLessons.length > 0 ? Math.round((progIds.length / mappedLessons.length) * 100) : 0;
        setEnrollmentProgress(newProgress);
        if (enrollment && newProgress !== enrollment.progress) { await supabase.from('enrollments').update({ progress: newProgress }).eq('id', enrollment.id); }

        const { data: certData } = await supabase.from('certificates').select('*').eq('course_id', cleanCourseId).eq('user_id', session.user.id).maybeSingle();
        setCertificate(certData);

        const current = mappedLessons.find(l => l.id.toString() === lessonId) || mappedLessons[0];
        setActiveLesson(current);
        if (current.type === 'interactive' && current.initial_code) {
          setCodeBody(current.initial_code);
        }
      } else { navigate('/login'); }
      setLoading(false);
    };
    fetchCourseAndProgress();
  }, [courseId, lessonId, navigate]);

  const handleToggleLessonCompleted = async (lessonToToggle) => {
    const isNowCompleted = !lessonToToggle.completed;
    const updated = lessons.map(l => l.id === lessonToToggle.id ? { ...l, completed: isNowCompleted } : l);
    setLessons(updated);
    
    const newCompletedIds = isNowCompleted ? [...completedIds, lessonToToggle.id] : completedIds.filter(id => id !== lessonToToggle.id);
    setCompletedIds(newCompletedIds);
    if (activeLesson?.id === lessonToToggle.id) { setActiveLesson({ ...activeLesson, completed: isNowCompleted }); }

    const newProgress = updated.length > 0 ? Math.round((newCompletedIds.length / updated.length) * 100) : 0;
    const prevProgress = enrollmentProgress;
    setEnrollmentProgress(newProgress);

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const cleanCourseId = isNaN(Number(courseId)) ? courseId : Number(courseId);
      if (!isNowCompleted) { await supabase.from('user_progress').delete().eq('user_id', session.user.id).eq('course_id', cleanCourseId).eq('syllabus_id', lessonToToggle.id); }
      else { await supabase.from('user_progress').upsert({ user_id: session.user.id, course_id: cleanCourseId, syllabus_id: lessonToToggle.id, completed_at: new Date().toISOString() }); }
      await supabase.from('enrollments').update({ progress: newProgress }).eq('course_id', cleanCourseId).eq('user_id', session.user.id);
      showToast(`Progress diperbarui!`);
      
      if (newProgress === 100 && prevProgress < 100) { 
        triggerConfetti(); 
        showToast("Selamat! Anda telah menyelesaikan seluruh materi di kursus ini.", "success");
        
        // --- Notify Instructors & Collaborators ---
        try {
          // 1. Get Course & Instructor Info
          const { data: courseData } = await supabase.from('courses').select('title, instructor_id').eq('id', cleanCourseId).single();
          
          // 2. Get Collaborators
          const { data: collabs } = await supabase.from('course_collaborators').select('teacher_id').eq('course_id', cleanCourseId).eq('status', 'accepted');
          
          const recipients = [courseData.instructor_id, ...(collabs || []).map(c => c.teacher_id)].filter(id => id !== session.user.id);
          
          if (recipients.length > 0) {
            const notifications = recipients.map(teacherId => ({
              user_id: teacherId,
              title: 'Siswa Menyelesaikan Kursus! 🎓',
              content: `${profile?.full_name || 'Seorang siswa'} telah berhasil menyelesaikan kursus "${courseData.title}".`,
              type: 'course',
              link_to: `/teacher/analytics` // Direct to analytics or students page
            }));

            await supabase.from('notifications').insert(notifications);
          }
        } catch (err) {
          console.error("Error sending completion notifications:", err);
        }
      }
    }
  };

  const handlePrintCertificate = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=650');
    const formattedDate = new Date(certificate?.issued_at || new Date()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const studentName = profile?.full_name || "Pelajar Premium";
    const courseTitle = course?.title || "Kelas AiLearning";
    const certId = certificate?.id ? `CERT-${certificate.id}` : `CERT-${courseId}-${profile?.id?.slice(0, 8).toUpperCase()}`;
    const content = certificate?.certificate_url ? `<div style="display:flex; justify-content:center; align-items:center; height:100vh; margin:0; padding:0; box-sizing:border-box; background:#1e293b;"><img src="${certificate.certificate_url}" style="max-width:100%; max-height:100%; object-fit:contain; border: 8px solid #000; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);" /></div>` : `<div style="font-family:'Outfit', 'Inter', sans-serif; display:flex; justify-content:center; align-items:center; min-height:98vh; background:#fefefe; padding:20px; box-sizing:border-box;"><div style="width:100%; max-width:800px; border:10px double #000; padding:40px; background:#fffcf5; text-align:center; position:relative; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"><div style="position:absolute; top:15px; left:15px; width:40px; height:40px; border-top:4px solid #000; border-left:4px solid #000;"></div><div style="position:absolute; top:15px; right:15px; width:40px; height:40px; border-top:4px solid #000; border-right:4px solid #000;"></div><div style="position:absolute; bottom:15px; left:15px; width:40px; height:40px; border-bottom:4px solid #000; border-left:4px solid #000;"></div><div style="position:absolute; bottom:15px; right:15px; width:40px; height:40px; border-bottom:4px solid #000; border-right:4px solid #000;"></div><div style="font-size:24px; font-weight:900; letter-spacing:4px; margin-bottom:20px; text-transform:uppercase;">AiLearning Academy</div><div style="font-size:38px; font-weight:900; color:#000; text-transform:uppercase; margin-bottom:30px; border-bottom:4px solid #000; display:inline-block; padding-bottom:10px; letter-spacing:1px;">SERTIFIKAT KELULUSAN</div><div style="font-size:16px; font-weight:700; color:#4b5563; margin-bottom:10px; text-transform:uppercase; letter-spacing:2px;">Diberikan Kepada</div><div style="font-size:34px; font-weight:900; color:#000; text-decoration:underline; text-transform:capitalize; margin-bottom:25px; font-style:italic;">${studentName}</div><div style="font-size:16px; font-weight:700; color:#4b5563; margin-bottom:10px; text-transform:uppercase; letter-spacing:2px;">Atas Keberhasilannya Menyelesaikan Kelas</div><div style="font-size:26px; font-weight:900; color:#2563eb; margin-bottom:40px; line-height:1.3;">${courseTitle}</div><div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:50px; padding:0 30px;"><div style="text-align:left;"><div style="font-size:12px; font-weight:700; color:#6b7280; text-transform:uppercase;">Tanggal Kelulusan</div><div style="font-size:15px; font-weight:900; color:#000; margin-top:5px;">${formattedDate}</div></div><div style="text-align:center;"><div style="width:120px; height:2px; background:#000; margin-bottom:8px;"></div><div style="font-size:12px; font-weight:900; text-transform:uppercase; color:#000;">Harin AI System</div><div style="font-size:10px; font-weight:700; color:#6b7280;">Verifikasi Resmi</div></div></div><div style="margin-top:40px; font-size:10px; font-weight:700; color:#9ca3af; letter-spacing:1px;">ID Verifikasi: ${certId}</div></div></div>`;
    printWindow.document.write(`<html><head><title>Sertifikat - ${studentName}</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap" rel="stylesheet"><style>body { margin: 0; padding: 0; background-color: #ffffff; } @media print { body { background: none; } @page { size: landscape; margin: 0; } }</style></head><body>${content}<script>window.onload = function() { setTimeout(function() { window.print(); window.close(); }, 500); };</script></body></html>`);
    printWindow.document.close();
  };

  const goToNextLesson = () => {
    setIsVideoPlaying(false);
    const currentIndex = lessons.findIndex(l => l.id === activeLesson.id);
    if (currentIndex < lessons.length - 1) { navigate(`/courses/${courseId}/learn/${lessons[currentIndex + 1].id}`); }
    else { showToast("Selamat! Anda telah mencapai akhir materi."); navigate(`/courses/${courseId}`); }
  };

  const handleNextLesson = () => { if (!activeLesson.completed) { setShowConfirmNext(true); } else { goToNextLesson(); } };
  const handleConfirmNext = async (completedThis) => { 
    setShowConfirmNext(false); 
    if (completedThis) { 
      await handleToggleLessonCompleted(activeLesson); 
      goToNextLesson(); 
    } 
    // If not completed, we don't go to the next lesson
  };
  const handlePrevLesson = () => { setIsVideoPlaying(false); const currentIndex = lessons.findIndex(l => l.id === activeLesson.id); if (currentIndex > 0) { navigate(`/courses/${courseId}/learn/${lessons[currentIndex - 1].id}`); } };

  const handleFileChange = (e) => { if (e.target.files && e.target.files[0]) { setSubmissionFile(e.target.files[0]); } };
  const handleSubmitAssignment = async () => {
    if (!submissionFile) { showToast("Silakan pilih file terlebih dahulu.", "error"); return; }
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("User session not found");
      const cleanCourseId = isNaN(Number(courseId)) ? courseId : Number(courseId);
      const ext = submissionFile.name.split('.').pop();
      const fileName = `submissions/${cleanCourseId}/${session.user.id}_${activeLesson.id}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('course-content').upload(fileName, submissionFile);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('course-content').getPublicUrl(fileName);
      const { data: submissionData, error: dbError } = await supabase.from('submissions').upsert({ student_id: session.user.id, course_id: cleanCourseId, syllabus_id: activeLesson.id, file_url: publicUrl, submitted_at: new Date().toISOString() }).select().single();
      if (dbError) throw dbError;
      setSubmission(submissionData); showToast("Tugas berhasil dikirim!");
      // Completion is manual as requested
    } catch (err) { console.error("Error submitting assignment:", err); showToast("Gagal mengirim tugas: " + err.message, "error"); }
    finally { setSubmitting(false); }
  };

  const handleResetCode = () => { setCodeBody(activeLesson.initial_code || "function solution(data) {\n  return data;\n}"); setTerminalOutput(""); };
  
  const handleRunCode = () => {
    setTerminalOutput("🚀 Menjalankan kode...\n");
    
    // Capture console.log
    let logs = [];
    const customConsole = {
      log: (...args) => {
        logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
      },
      error: (...args) => {
        logs.push("❌ Error: " + args.join(' '));
      }
    };

    setTimeout(() => {
      try {
        if (codeBody.includes("eval") || codeBody.includes("Function")) { 
          throw new Error("Penggunaan eval atau Function tidak diizinkan."); 
        }
        
        // Wrap student code
        const wrappedCode = codeBody.includes('function solution') ? codeBody + '\nreturn solution(data);' : codeBody;
        const runContext = new Function("data", "console", wrappedCode);
        
        let output = "";
        let testResults = "";
        let allPassed = true;

        if (activeLesson.test_cases && activeLesson.test_cases.length > 0) {
          activeLesson.test_cases.forEach((tc, idx) => {
            try {
              const input = JSON.parse(tc.input || "null");
              const expected = JSON.parse(tc.expected || "null");
              logs = [];
              const actual = runContext(input, customConsole);
              
              const logStr = logs.length > 0 ? `[Log]: ${logs.join(' | ')}` : "No logs";
              const isMatch = JSON.stringify(actual) === JSON.stringify(expected);
              
              output += `TEST ${idx + 1} | Input: ${tc.input} | ${logStr} | Result: ${JSON.stringify(actual)}\n`;
              
              if (isMatch) {
                testResults += `✅ Test ${idx + 1}: Passed\n`;
              } else {
                testResults += `❌ Test ${idx + 1}: Failed (Expected ${tc.expected})\n`;
                allPassed = false;
              }
            } catch (e) {
              output += `TEST ${idx + 1} | Error: ${e.message}\n`;
              allPassed = false;
            }
          });
          
          setTerminalOutput(output + "\nSTATUS PENGUJIAN:\n" + testResults);
          if (allPassed) showToast("Pengujian berhasil! Klik 'Kirim Jawaban' untuk mengumpulkan.");
        } else {
          logs = [];
          const actual = runContext(null, customConsole);
          output = (logs.length > 0 ? logs.join('\n') + '\n' : '') + "Result: " + JSON.stringify(actual);
          setTerminalOutput(output);
        }
      } catch (err) { 
        setTerminalOutput(`❌ SYNTAX/RUNTIME ERROR:\n${err.message}`); 
      }
    }, 500);
  };

  const handleSubmitCodingTask = async () => {
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("User session not found");
      const cleanCourseId = isNaN(Number(courseId)) ? courseId : Number(courseId);
      
      const { error: dbError } = await supabase.from('submissions').upsert({ 
        student_id: session.user.id, 
        course_id: cleanCourseId, 
        syllabus_id: activeLesson.id, 
        assignment_text: codeBody, 
        submitted_at: new Date().toISOString() 
      });
      
      if (dbError) throw dbError;
      showToast("Jawaban coding berhasil dikirim!");
      // Completion is manual as requested
    } catch (err) { 
      console.error("Error submitting coding task:", err); 
      showToast("Gagal mengirim jawaban: " + err.message, "error"); 
    } finally { 
      setSubmitting(false); 
    }
  };

  if (loading) return (<div className="bg-background text-on-background flex h-screen items-center justify-center"><div className="w-16 h-16 border-4 border-on-surface border-t-primary rounded-full animate-spin"></div></div>);
  if (!course || !activeLesson) return (<div className="bg-background text-on-background flex h-screen items-center justify-center flex-col gap-4"><h1 className="font-headline-lg">Materi tidak ditemukan</h1><button onClick={() => navigate(`/courses/${courseId}`)} className="px-6 py-2 bg-primary text-white rounded-lg border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Kembali ke Kursus</button></div>);

  return (
    <div className="bg-background text-on-background font-body-md flex h-screen overflow-hidden">
      <aside className="w-80 bg-surface border-r-2 border-on-background shadow-[4px_0px_0px_0px_rgba(0,0,0,1)] z-20 flex flex-col shrink-0">
        <div className="p-5 border-b-2 border-on-background bg-surface-container-low flex flex-col gap-4">
          <Link to={`/courses/${courseId}`} className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-primary-container-variant transition-colors group"><Icon name="arrow_back" className="w-4 h-4 transition-transform group-hover:-translate-x-1" /><span>Kembali ke Detail Kursus</span></Link>
          <div><span className="text-[9px] uppercase font-black tracking-widest text-on-surface-variant/80">MATERI BELAJAR</span><h2 className="font-headline-sm text-lg font-black text-on-surface mt-1 leading-snug line-clamp-2">{course.title}</h2></div>
          <div className="space-y-1.5 pt-1"><div className="flex justify-between items-center text-xs font-bold text-on-surface-variant"><span>Progres Kelas</span><span className="text-primary font-black">{enrollmentProgress}%</span></div><div className="w-full bg-white border-2 border-on-background rounded-full h-3 overflow-hidden"><div className="bg-primary h-full transition-all" style={{ width: `${enrollmentProgress}%` }} /></div>
          {enrollmentProgress === 100 && (<button onClick={() => { triggerConfetti(); setShowCompletionModal(true); }} className="mt-2.5 w-full py-2 bg-[#FFB800] hover:bg-[#e6a500] text-on-background border-2 border-on-background rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"><Icon name="workspace_premium" className="w-4 h-4" />Lihat Sertifikat</button>)}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-surface-container-lowest">
          {sections.map((section, sIdx) => {
            const isLocked = isSectionLocked(sIdx);
            return (
              <div key={section.id} className={`${isLocked ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between mb-2 px-1"><p className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest">Bab {sIdx + 1}: {section.title}</p>{isLocked && <Icon name="lock" className="w-3 h-3 text-on-surface-variant" />}</div>
                <div className="space-y-2">
                  {section.course_syllabus.map((syl) => {
                    const isActive = activeLesson?.id === syl.id;
                    const isCompleted = completedIds.includes(syl.id);
                    const isAssignment = syl.type === 'assignment' || 
                                         syl.type === 'final_project' || 
                                         !!syl.assignment_text;
                    const isLocked = isSectionLocked(sIdx) || isLessonLocked(syl.id);
                    return (
                      <button key={syl.id} disabled={isLocked} onClick={() => navigate(`/courses/${courseId}/learn/${syl.id}`)} className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-start gap-3 text-on-surface ${isActive ? 'bg-primary-container border-on-background shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' : isLocked ? 'border-transparent cursor-not-allowed opacity-50' : 'bg-white border-on-background/5 hover:border-on-background hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'} ${isAssignment && !isActive && !isLocked ? 'bg-secondary-container/5' : ''}`}>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${isCompleted ? 'bg-green-50 border-green-600 text-green-600' : isLocked ? 'bg-surface border-on-background/20 text-on-surface-variant/40' : isActive ? 'bg-white border-primary' : 'bg-white border-on-background/20'}`}>
                          {isCompleted ? (
                            <Icon name="check" className="w-2.5 h-2.5 text-green-600" />
                          ) : isLocked ? (
                            <Icon name="lock" className="w-2.5 h-2.5" />
                          ) : syl.type === 'final_project' ? (
                            <Icon name="workspace_premium" className="w-2.5 h-2.5 text-primary" />
                          ) : (syl.type === 'coding' || syl.type === 'interactive' || (syl.initial_code && syl.test_cases)) ? (
                            <Icon name="code" className="w-2.5 h-2.5 text-secondary" />
                          ) : isAssignment ? (
                            <Icon name="assignment" className="w-2.5 h-2.5 text-secondary" />
                          ) : isActive ? (
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          ) : null}
                        </div>
                        <div className="flex-1 min-w-0"><p className={`text-[11px] leading-snug ${isActive ? 'font-black' : 'font-bold'}`}>{syl.title}</p>{isAssignment && (<span className={`text-[8px] font-black ${syl.type === 'final_project' ? 'text-primary' : 'text-secondary'} uppercase mt-0.5 block tracking-tighter`}>{syl.type === 'final_project' ? 'Evaluasi Akhir' : 'Tugas Akhir Bab'}</span>)}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-surface-bright">
        <header className="h-16 bg-surface border-b-2 border-on-background shadow-[0px_2px_0px_0px_rgba(0,0,0,1)] flex items-center px-6 justify-between shrink-0"><div className="flex items-center gap-3"><Icon name="menu_book" className="w-6 h-6 text-primary" /><h1 className="font-headline-md font-black text-on-surface truncate">{activeLesson.title}</h1></div>
          <div className="flex gap-2">
            <button onClick={handlePrevLesson} disabled={lessons.findIndex(l => l.id === activeLesson.id) === 0} className="p-2 border-2 border-on-background rounded-lg hover:bg-surface-container transition-all disabled:opacity-50 disabled:cursor-not-allowed"><Icon name="chevron_left" className="w-5 h-5" /></button>
            <button onClick={handleNextLesson} className="p-2 border-2 border-on-background rounded-lg hover:bg-surface-container transition-all"><Icon name="chevron_right" className="w-5 h-5" /></button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 md:p-10 lg:px-20 max-w-5xl mx-auto w-full space-y-8">
          {activeLesson.type === 'video' ? (
            isVideoPlaying && activeLesson.video_url ? (<div className="aspect-video w-full bg-black border-4 border-on-background rounded-2xl overflow-hidden relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"><iframe className="w-full h-full animate-in fade-in zoom-in-95 duration-350" src={`${getEmbedUrl(activeLesson.video_url)}?autoplay=1&rel=0`} title={activeLesson.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>) : (<div className="aspect-video w-full bg-black border-4 border-on-background rounded-2xl overflow-hidden relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center group"><div className="absolute inset-0 bg-cover bg-center opacity-60 filter blur-sm" style={{ backgroundImage: `url(${course?.image_url})` }} /><div className="relative z-10 flex flex-col items-center gap-4"><button onClick={() => setIsVideoPlaying(true)} className="w-20 h-20 bg-primary text-white rounded-full border-4 border-on-background flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:scale-110 active:scale-95 transition-all"><Icon name="play_arrow" className="w-12 h-12 fill-current" /></button><span className="text-sm font-black bg-black/80 text-white px-4 py-1.5 rounded-full uppercase tracking-wider">Putar Video</span></div></div>)
          ) : activeLesson.type === 'assignment' || activeLesson.type === 'final_project' ? (
            <div className="p-6 bg-tertiary-container border-4 border-on-background rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4 text-on-surface">
              <div className="flex items-center gap-3 pb-3 border-b-2 border-on-background/10"><div className="p-2 bg-white border-2 border-on-background rounded-lg"><Icon name={activeLesson.type === 'final_project' ? 'workspace_premium' : 'assignment'} className={`w-8 h-8 ${activeLesson.type === 'final_project' ? 'text-primary' : 'text-tertiary'}`} /></div><div><h4 className="font-headline-md text-xl font-black">{activeLesson.type === 'final_project' ? 'Tugas Akhir (Final Project)' : 'Tugas Praktik'}</h4><p className="text-xs text-on-surface-variant font-bold">{activeLesson.type === 'final_project' ? 'Selesaikan tugas akhir ini untuk mendapatkan sertifikat kelulusan.' : 'Kirimkan pekerjaan Anda untuk dinilai.'}</p></div></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="bg-white border-2 border-on-background p-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"><span className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant/80">WAKTU PENGERJAAN</span><p className="font-headline-sm text-sm font-black text-on-surface mt-1">Flexible (Kapan Saja)</p></div><div className="bg-white border-2 border-on-background p-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"><span className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant/80">FORMAT FILE</span><p className="font-headline-sm text-sm font-black text-on-surface mt-1">{activeLesson.allowed_file_types || 'pdf, docx, zip, png, jpg'}</p></div></div>
              <div className="bg-white border-2 border-on-background p-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mt-2"><span className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant/80 block mb-2">PANDUAN TUGAS</span><p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">{activeLesson.assignment_text || 'Silakan ikuti instruksi.'}</p></div>
              <div className="bg-white border-2 border-on-background p-6 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mt-2">
                {submission ? (<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-green-50 border-2 border-green-600 rounded-lg"><div className="min-w-0 flex-1"><p className="text-sm font-black text-green-800 flex items-center gap-1.5"><Icon name="check_circle" className="w-5 h-5 text-green-600" />Tugas Terkirim</p><a href={submission.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline font-bold mt-1 block truncate">Lihat file: {submission.file_url.split('/').pop()}</a></div><label className="cursor-pointer px-4 py-2 bg-white text-green-700 font-label-bold text-xs rounded-lg border-2 border-green-600 hover:bg-green-50 transition-all text-center flex-shrink-0">Kirim Ulang<input type="file" className="hidden" onChange={handleFileChange} /></label></div>) : (<div className="flex flex-col gap-4"><div className="border-4 border-dashed border-on-background/20 rounded-xl p-6 text-center bg-surface-container-lowest"><Icon name="cloud_upload" className="w-10 h-10 mx-auto text-on-surface-variant/40 mb-2" /><p className="text-xs font-bold text-on-surface-variant">{submissionFile ? submissionFile.name : 'Pilih file tugas'}</p><input type="file" id="assignment-file-input" className="hidden" onChange={handleFileChange} /><button onClick={() => document.getElementById('assignment-file-input').click()} className="mt-3 px-4 py-2 bg-surface-container text-on-surface font-label-bold text-xs rounded-lg border-2 border-on-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">Pilih File</button></div>{submissionFile && (<button onClick={handleSubmitAssignment} disabled={submitting} className="w-full py-3 bg-tertiary text-on-tertiary font-headline-md rounded-lg border-2 border-on-background shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all text-center uppercase tracking-wider text-xs font-black disabled:opacity-50">{submitting ? 'Mengirim...' : 'Kirim Tugas Sekarang'}</button>)}</div>)}
              </div>
            </div>
          ) : activeLesson.type === 'interactive' ? (
            <div className="p-6 bg-[#181818] border-4 border-on-background rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col min-h-[480px]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500"></span><span className="w-3 h-3 rounded-full bg-yellow-500"></span><span className="w-3 h-3 rounded-full bg-green-500"></span></div>
                  <h4 className="font-mono text-sm text-gray-400 font-bold">interactive.js</h4>
                </div>
                {activeLesson.completed ? (
                  <span className="text-[10px] font-black text-green-400 uppercase flex items-center gap-1"><Icon name="check_circle" className="w-3 h-3" /> Terkirim</span>
                ) : (
                  <button 
                    onClick={handleSubmitCodingTask}
                    disabled={submitting}
                    className="px-4 py-1.5 bg-primary text-white text-[10px] font-black rounded-lg border-2 border-white shadow-[2px_2px_0px_0px_#fff] hover:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Mengirim...' : 'Kirim Jawaban'}
                  </button>
                )}
              </div>
              <div className="flex-1 font-mono text-sm text-green-400 flex flex-col">
                <textarea 
                  value={codeBody} 
                  onChange={(e) => setCodeBody(e.target.value)} 
                  className="w-full flex-grow bg-transparent border-none outline-none resize-none font-mono text-slate-100 py-2 focus:ring-0" 
                  rows={6} 
                  spellCheck="false" 
                />
                <div className="mt-4 pt-3 border-t border-white/10 flex justify-between">
                  <button onClick={handleResetCode} className="px-4 py-2 border border-white/20 text-gray-400 font-mono text-xs rounded hover:bg-white/5 transition-all">Reset</button>
                  <button onClick={handleRunCode} className="px-8 py-2.5 bg-green-500 text-black font-black uppercase text-xs rounded border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-y-0.5 active:shadow-none transition-all">Run Code</button>
                </div>
                {terminalOutput && (
                  <div className="mt-4 p-4 bg-black rounded-lg border-2 border-white/10 font-mono text-xs text-white max-h-48 overflow-y-auto">
                    <div className="flex items-center gap-2 mb-2 text-gray-500 border-b border-white/5 pb-1 uppercase text-[9px] font-black">
                      <Icon name="terminal" className="w-3 h-3" /> Terminal Output
                    </div>
                    <pre className="whitespace-pre-wrap leading-relaxed">{terminalOutput}</pre>
                  </div>
                )}
              </div>
            </div>
          ) : (<div className="w-full h-48 bg-secondary-container border-4 border-on-background rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden relative"><Icon name="menu_book" className="w-24 h-24 text-secondary/20 absolute -right-4 -bottom-4" /><div className="text-center relative z-10 p-6"><h4 className="font-headline-lg text-on-secondary-container">Bahan Bacaan</h4><p className="text-on-secondary-container/80 mt-2">Baca materi teks di bawah.</p></div></div>)}
          {activeLesson.type !== 'assignment' && (<div className="bg-white border-2 border-on-background rounded-xl p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"><h3 className="font-headline-md text-2xl mb-6">Materi: {activeLesson.title}</h3><div className="prose max-w-none text-on-surface-variant font-body-md space-y-4 text-lg"><p className="leading-relaxed whitespace-pre-wrap">{activeLesson.content || 'Tidak ada deskripsi.'}</p></div></div>)}
          <div className="flex justify-between items-center py-6 border-t-2 border-on-background">
            <button onClick={handlePrevLesson} disabled={lessons.findIndex(l => l.id === activeLesson.id) === 0} className="px-6 py-3 font-label-bold text-on-surface border-2 border-on-background rounded-lg hover:bg-surface-container transition-all disabled:opacity-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Materi Sebelumnya</button>
            <div className="flex gap-4">
              <button onClick={() => handleToggleLessonCompleted(activeLesson)} className={`px-6 py-3 font-headline-md rounded-lg border-2 border-on-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 ${activeLesson.completed ? 'bg-surface-container text-on-surface' : 'bg-tertiary text-on-tertiary'}`}><Icon name={activeLesson.completed ? 'close' : 'check_circle'} className="w-5 h-5" />{activeLesson.completed ? 'Batalkan Selesai' : 'Tandai Selesai'}</button>
              <button onClick={handleNextLesson} className="px-6 py-3 bg-primary text-white font-headline-md rounded-lg border-2 border-on-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2">Materi Selanjutnya <Icon name="arrow_forward" className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      </main>
      {showConfirmNext && (<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white border-4 border-on-background rounded-2xl p-6 max-w-md w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in-95 duration-150"><h3 className="font-headline-md text-xl font-black text-on-surface mb-4">Selesaikan Modul?</h3><p className="text-on-surface-variant mb-6">Apakah Anda sudah menyelesaikan modul "{activeLesson?.title}"?</p><div className="flex gap-3"><button onClick={() => handleConfirmNext(true)} className="flex-1 px-5 py-3 bg-tertiary text-on-tertiary font-headline-md rounded-lg border-2 border-on-background shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">Sudah Selesai</button><button onClick={() => handleConfirmNext(false)} className="flex-1 px-5 py-3 bg-surface-container text-on-surface font-headline-md rounded-lg border-2 border-on-background shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">Belum Selesai</button></div></div></div>)}
      {showCompletionModal && (<div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white border-4 border-on-background rounded-3xl p-6 max-w-2xl w-full shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center gap-6 relative"><button onClick={() => setShowCompletionModal(false)} className="absolute top-4 right-4 p-1.5 hover:bg-surface-variant rounded-lg border-2 border-on-background bg-white"><Icon name="close" className="w-5 h-5" /></button><div className="text-center space-y-1"><div className="text-5xl animate-bounce">🏆</div><h3 className="font-headline-lg text-3xl font-black text-on-surface">KURSUS SELESAI!</h3><p className="text-on-surface-variant font-bold text-sm">Selamat! Anda telah menyelesaikan semua modul dalam kelas ini.</p></div><div className="w-full border-4 border-double border-on-background p-6 rounded-2xl bg-[#fffcf5] flex flex-col items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"><h4 className="text-2xl font-black text-on-surface uppercase border-b-4 border-on-background pb-1 mb-5">Sertifikat Kelulusan</h4><p className="text-3xl font-black text-primary underline italic capitalize mb-5">{profile?.full_name || "Pelajar Premium"}</p><p className="text-base font-black text-on-surface text-center mb-8">{course?.title}</p></div><div className="flex gap-3 w-full"><button onClick={handlePrintCertificate} className="flex-1 py-3 px-4 bg-primary text-white font-black rounded-xl border-2 border-on-background shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 cursor-pointer"><Icon name="print" className="w-5 h-5" />Cetak Sertifikat</button><button onClick={() => setShowCompletionModal(false)} className="flex-1 py-3 px-4 bg-surface-container text-on-surface font-black rounded-xl border-2 border-on-background shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">Tutup</button></div></div></div>)}
    </div>
  );
};

export default CourseLesson;
