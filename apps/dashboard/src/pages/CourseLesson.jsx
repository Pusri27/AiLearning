import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabaseClient';
import { showToast } from '../lib/toast';

const CourseLesson = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [enrollmentProgress, setEnrollmentProgress] = useState(0);

  const [showConfirmNext, setShowConfirmNext] = useState(false);
  const [codeBody, setCodeBody] = useState(
    "  // Tulis kode pemrosesan data di sini...\n  // Hapus duplikat & urutkan descending\n  \n  return data;"
  );
  const [terminalOutput, setTerminalOutput] = useState("");

  const [submission, setSubmission] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const getEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('youtu.be/')) return `https://www.youtube.com/embed/${url.split('youtu.be/')[1].split('?')[0]}`;
    if (url.includes('watch?v=')) return `https://www.youtube.com/embed/${url.split('watch?v=')[1].split('&')[0]}`;
    return url;
  };

  useEffect(() => {
    setIsVideoPlaying(false);
    const fetchSubmission = async () => {
      if (activeLesson?.type === 'assignment') {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          try {
            const { data } = await supabase
              .from('submissions')
              .select('*')
              .eq('student_id', session.user.id)
              .eq('syllabus_id', activeLesson.id)
              .maybeSingle();
            setSubmission(data);
          } catch (err) {
            console.error("Error fetching submission:", err);
          }
        }
      } else {
        setSubmission(null);
        setSubmissionFile(null);
      }
    };
    fetchSubmission();
  }, [activeLesson]);

  // 1. Fetch Course, Syllabus & Enrollment details dynamically
  useEffect(() => {
    const fetchCourseAndProgress = async () => {
      setLoading(true);
      console.log("--- CourseLesson: Fetching Course & Progress ---");
      console.log("courseId from URL:", courseId);

      const cleanCourseId = isNaN(Number(courseId)) ? courseId : Number(courseId);
      console.log("cleanCourseId used for query:", cleanCourseId);

      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', cleanCourseId)
        .single();

      if (courseError) {
        console.error("Error fetching course:", courseError);
        showToast("Gagal memuat detail kursus", "error");
        setLoading(false);
        return;
      }
      setCourse(courseData);

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Fetch syllabus
        const { data: syllabusData } = await supabase
          .from('course_syllabus')
          .select('*')
          .eq('course_id', cleanCourseId)
          .order('sort_order', { ascending: true });
        
        const syllabusList = syllabusData || [];

        // Fetch user progress
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('syllabus_id')
          .eq('user_id', session.user.id)
          .eq('course_id', cleanCourseId);

        // Fetch enrollment
        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('id, progress')
          .eq('user_id', session.user.id)
          .eq('course_id', cleanCourseId)
          .maybeSingle();

        const mappedLessons = syllabusList.map(item => {
          const isCompleted = progressData ? progressData.some(p => p.syllabus_id === item.id) : false;
          let type = 'reading';
          let icon = 'menu_book';
          if (item.type === 'assignment') {
            type = 'assignment';
            icon = 'assignment';
          } else if (item.video_url) {
            type = 'video';
            icon = 'play_circle';
          }

          return {
            id: item.id,
            title: item.title,
            duration: item.type === 'assignment' ? 'Penugasan' : '30 mins',
            type: type,
            icon: icon,
            content: item.content || item.assignment_text || '',
            completed: isCompleted,
            video_url: item.video_url,
            assignment_text: item.assignment_text,
            allowed_file_types: item.allowed_file_types,
            deadline: item.deadline
          };
        });

        setLessons(mappedLessons);

        const completedCount = mappedLessons.filter(l => l.completed).length;
        const newProgress = mappedLessons.length > 0 ? Math.round((completedCount / mappedLessons.length) * 100) : 0;
        setEnrollmentProgress(newProgress);

        // If enrollment exist, check if progress matches
        if (enrollment && newProgress !== enrollment.progress) {
          await supabase
            .from('enrollments')
            .update({ progress: newProgress })
            .eq('id', enrollment.id);
        }

        // Set active lesson based on lessonId in URL or default to first
        const current = mappedLessons.find(l => l.id.toString() === lessonId) || mappedLessons[0];
        setActiveLesson(current);
      } else {
        console.warn("No active session found, redirecting to login");
        navigate('/login');
      }
      setLoading(false);
    };

    fetchCourseAndProgress();
  }, [courseId, lessonId, navigate]);

  // Keep activeLesson state in sync when URL lessonId changes
  useEffect(() => {
    if (lessons.length > 0) {
      const current = lessons.find(l => l.id.toString() === lessonId) || lessons[0];
      setActiveLesson(current);
    }
  }, [lessonId, lessons]);

  const handleToggleLessonCompleted = async (lessonToToggle) => {
    const updated = lessons.map(l => {
      if (l.id === lessonToToggle.id) {
        return { ...l, completed: !l.completed };
      }
      return l;
    });
    
    // Update local state first for snappiness
    setLessons(updated);
    if (activeLesson?.id === lessonToToggle.id) {
      setActiveLesson({ ...activeLesson, completed: !activeLesson.completed });
    }

    const completedCount = updated.filter(l => l.completed).length;
    const newProgress = updated.length > 0 ? Math.round((completedCount / updated.length) * 100) : 0;
    setEnrollmentProgress(newProgress);

    console.log("--- CourseLesson: handleToggleLessonCompleted ---");
    console.log("lessonToToggle:", lessonToToggle);
    console.log("newProgress calculated:", newProgress);

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const cleanCourseId = isNaN(Number(courseId)) ? courseId : Number(courseId);
      console.log("Updating progress in database for course_id:", cleanCourseId, "user_id:", session.user.id);
      
      let dbError;
      if (lessonToToggle.completed) {
        // Toggling to incomplete, delete from user_progress
        const { error } = await supabase
          .from('user_progress')
          .delete()
          .eq('user_id', session.user.id)
          .eq('course_id', cleanCourseId)
          .eq('syllabus_id', lessonToToggle.id);
        dbError = error;
      } else {
        // Toggling to complete, upsert into user_progress
        const { error } = await supabase
          .from('user_progress')
          .upsert({
            user_id: session.user.id,
            course_id: cleanCourseId,
            syllabus_id: lessonToToggle.id,
            completed_at: new Date().toISOString()
          });
        dbError = error;
      }

      if (dbError) {
        console.error("Error updating progress in database:", dbError);
      } else {
        // Update enrollment progress
        const { error: enrollErr } = await supabase
          .from('enrollments')
          .update({ progress: newProgress })
          .eq('course_id', cleanCourseId)
          .eq('user_id', session.user.id);
        if (enrollErr) {
          console.error("Error updating enrollment progress in database:", enrollErr);
        } else {
          showToast(`Progress belajar diperbarui menjadi ${newProgress}%!`);
        }
      }
    }
  };

  const goToNextLesson = () => {
    const currentIndex = lessons.findIndex(l => l.id === activeLesson.id);
    if (currentIndex < lessons.length - 1) {
      navigate(`/courses/${courseId}/learn/${lessons[currentIndex + 1].id}`);
    } else {
      showToast("Selamat! Anda telah mencapai akhir materi.");
      navigate(`/courses/${courseId}`);
    }
  };

  const handleNextLesson = () => {
    if (!activeLesson.completed) {
      setShowConfirmNext(true);
    } else {
      goToNextLesson();
    }
  };

  const handleConfirmNext = async (completedThis) => {
    setShowConfirmNext(false);
    if (completedThis) {
      await handleToggleLessonCompleted(activeLesson);
    }
    goToNextLesson();
  };

  const handlePrevLesson = () => {
    const currentIndex = lessons.findIndex(l => l.id === activeLesson.id);
    if (currentIndex > 0) {
      navigate(`/courses/${courseId}/learn/${lessons[currentIndex - 1].id}`);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSubmissionFile(e.target.files[0]);
    }
  };

  const handleSubmitAssignment = async () => {
    if (!submissionFile) {
      showToast("Silakan pilih file terlebih dahulu.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("User session not found");
      const cleanCourseId = isNaN(Number(courseId)) ? courseId : Number(courseId);
      
      const ext = submissionFile.name.split('.').pop();
      const fileName = `submissions/${cleanCourseId}/${session.user.id}_${activeLesson.id}_${Date.now()}.${ext}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('course-content')
        .upload(fileName, submissionFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course-content')
        .getPublicUrl(fileName);

      const { data: submissionData, error: dbError } = await supabase
        .from('submissions')
        .upsert({
          student_id: session.user.id,
          course_id: cleanCourseId,
          syllabus_id: activeLesson.id,
          file_url: publicUrl,
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setSubmission(submissionData);
      showToast("Tugas berhasil dikirim!");
      
      // Auto-toggle completed if not completed yet
      if (!activeLesson.completed) {
        await handleToggleLessonCompleted(activeLesson);
      }
    } catch (err) {
      console.error("Error submitting assignment:", err);
      showToast("Gagal mengirim tugas: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetCode = () => {
    setCodeBody(
      "  // Tulis kode pemrosesan data di sini...\n  // Hapus duplikat & urutkan descending\n  \n  return data;"
    );
    setTerminalOutput("");
  };

  const handleRunCode = () => {
    setTerminalOutput("Menjalankan test case...\n");
    
    setTimeout(() => {
      try {
        if (codeBody.includes("eval") || codeBody.includes("Function")) {
          throw new Error("Penggunaan eval atau Function tidak diizinkan demi keamanan.");
        }

        const testFn = new Function("data", codeBody);
        
        const testCase1 = [5, 2, 5, 1, 2, 8];
        const expected1 = [8, 5, 2, 1];
        
        const testCase2 = [10, 10, 20, 30, 20, 40];
        const expected2 = [40, 30, 20, 10];

        const res1 = testFn(testCase1);
        const res2 = testFn(testCase2);

        const isArrayEqual = (arr1, arr2) => {
          if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
          if (arr1.length !== arr2.length) return false;
          return arr1.every((val, index) => val === arr2[index]);
        };

        const passed1 = isArrayEqual(res1, expected1);
        const passed2 = isArrayEqual(res2, expected2);

        let output = "";
        output += `Test Case 1: optimizeQuery([5, 2, 5, 1, 2, 8])\n`;
        output += ` -> Expected: [${expected1.join(", ")}]\n`;
        output += ` -> Received: ${JSON.stringify(res1)}\n`;
        output += ` -> Status: ${passed1 ? "✅ PASSED" : "❌ FAILED"}\n\n`;

        output += `Test Case 2: optimizeQuery([10, 10, 20, 30, 20, 40])\n`;
        output += ` -> Expected: [${expected2.join(", ")}]\n`;
        output += ` -> Received: ${JSON.stringify(res2)}\n`;
        output += ` -> Status: ${passed2 ? "✅ PASSED" : "❌ FAILED"}\n\n`;

        if (passed1 && passed2) {
          output += `🎉 STATUS: SUCCESS! Semua test case berhasil dilewati.\n`;
          output += `Modul pembelajaran ini telah ditandai sebagai Selesai secara otomatis!`;
          setTerminalOutput(output);
          showToast("Selamat! Kode Anda berhasil menyelesaikan tantangan.");
          
          if (!activeLesson.completed) {
            handleToggleLessonCompleted(activeLesson);
          }
        } else {
          output += `❌ STATUS: FAILED. Coba periksa kembali logika kode Anda.\n`;
          output += `Tips: gunakan Set untuk menghapus duplikat, lalu sort((a, b) => b - a) untuk mengurutkan descending.`;
          setTerminalOutput(output);
        }
      } catch (err) {
        setTerminalOutput(`❌ RUNTIME/SYNTAX ERROR:\n${err.message}`);
      }
    }, 600);
  };

  if (loading) {
    return (
      <div className="bg-background text-on-background flex h-screen items-center justify-center">
        <div className="w-16 h-16 border-4 border-on-surface border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!course || !activeLesson) {
    return (
      <div className="bg-background text-on-background flex h-screen items-center justify-center flex-col gap-4">
        <h1 className="font-headline-lg">Materi tidak ditemukan</h1>
        <button onClick={() => navigate(`/courses/${courseId}`)} className="px-6 py-2 bg-primary text-white rounded-lg border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Kembali ke Kursus</button>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background font-body-md flex h-screen overflow-hidden">
      {/* ── Left Sidebar: Curriculum List ── */}
      <aside className="w-80 bg-surface border-r-2 border-on-background shadow-[4px_0px_0px_0px_rgba(0,0,0,1)] z-20 flex flex-col shrink-0">
        {/* Sidebar Header */}
        <div className="p-5 border-b-2 border-on-background bg-surface-container-low flex flex-col gap-4">
          <Link to={`/courses/${courseId}`} className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-primary-container-variant transition-colors group">
            <Icon name="arrow_back" className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Kembali ke Detail Kursus</span>
          </Link>
          
          <div>
            <span className="text-[9px] uppercase font-black tracking-widest text-on-surface-variant/80">MATERI BELAJAR</span>
            <h2 className="font-headline-sm text-lg font-black text-on-surface mt-1 leading-snug line-clamp-2" title={course.title}>
              {course.title}
            </h2>
          </div>
          
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-xs font-bold text-on-surface-variant">
              <span>Progres Kelas</span>
              <span className="text-primary font-black">{enrollmentProgress}%</span>
            </div>
            <div className="w-full bg-white border-2 border-on-background rounded-full h-3 overflow-hidden">
              <div className="bg-primary h-full transition-all" style={{ width: `${enrollmentProgress}%` }} />
            </div>
          </div>
        </div>

        {/* Lessons List Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-container-lowest">
          {lessons.map((lesson, idx) => {
            const isActive = activeLesson.id === lesson.id;
            return (
              <button 
                key={lesson.id}
                onClick={() => navigate(`/courses/${courseId}/learn/${lesson.id}`)}
                className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-start gap-3.5 text-on-surface
                  ${isActive 
                    ? 'bg-primary-container border-on-background shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-[2px] -translate-x-[2px]' 
                    : 'bg-white border-on-background/10 hover:border-on-background hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px]'
                  }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all
                  ${lesson.completed 
                    ? 'bg-green-50 border-green-600 text-green-600 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' 
                    : isActive 
                      ? 'bg-white border-primary shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' 
                      : 'bg-white border-on-background/20'
                  }
                `}>
                  {lesson.completed ? (
                    <Icon name="check" className="w-3 h-3 text-green-600" />
                  ) : isActive ? (
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  ) : null}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`font-label-bold text-xs leading-snug ${isActive ? 'text-on-primary-container font-black' : 'text-on-surface'}`}>
                    {lesson.title}
                  </p>
                  <span className="text-[10px] text-on-surface-variant/80 flex items-center gap-1 mt-1.5 font-bold">
                    <Icon name="schedule" className="w-3.5 h-3.5" /> {lesson.duration}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── Main Content Area: Lesson Player ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-surface-bright">
        {/* Header */}
        <header className="h-16 bg-surface border-b-2 border-on-background shadow-[0px_2px_0px_0px_rgba(0,0,0,1)] flex items-center px-6 justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Icon name="menu_book" className="w-6 h-6 text-primary" />
            <h1 className="font-headline-md font-black text-on-surface truncate">{activeLesson.title}</h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handlePrevLesson}
              disabled={lessons.findIndex(l => l.id === activeLesson.id) === 0}
              className="p-2 border-2 border-on-background rounded-lg hover:bg-surface-container transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="chevron_left" className="w-5 h-5" />
            </button>
            <button 
              onClick={handleNextLesson}
              className="p-2 border-2 border-on-background rounded-lg hover:bg-surface-container transition-all"
            >
              <Icon name="chevron_right" className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 lg:px-20 max-w-5xl mx-auto w-full space-y-8">
          
          {/* Media Player / Interactive Space */}
          {/* Media Player / Interactive Space */}
          {activeLesson.type === 'video' ? (
            isVideoPlaying && activeLesson.video_url ? (
              <div className="aspect-video w-full bg-black border-4 border-on-background rounded-2xl overflow-hidden relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <iframe 
                  className="w-full h-full animate-in fade-in zoom-in-95 duration-350" 
                  src={`${getEmbedUrl(activeLesson.video_url)}?autoplay=1&rel=0`} 
                  title={activeLesson.title} 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen 
                />
              </div>
            ) : (
              <div className="aspect-video w-full bg-black border-4 border-on-background rounded-2xl overflow-hidden relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center group">
                <div className="absolute inset-0 bg-cover bg-center opacity-60 filter blur-sm" style={{ backgroundImage: `url(${course?.image_url})` }} />
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <button 
                    onClick={() => setIsVideoPlaying(true)}
                    className="w-20 h-20 bg-primary text-white rounded-full border-4 border-on-background flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:scale-110 active:scale-95 transition-all"
                  >
                    <Icon name="play_arrow" className="w-12 h-12 fill-current" />
                  </button>
                  <span className="text-sm font-black bg-black/80 text-white px-4 py-1.5 rounded-full uppercase tracking-wider">Putar Video Pembelajaran</span>
                </div>
              </div>
            )
          ) : activeLesson.type === 'assignment' ? (
            <div className="p-6 bg-tertiary-container border-4 border-on-background rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4 text-on-surface">
              <div className="flex items-center justify-between pb-3 border-b-2 border-on-background/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white border-2 border-on-background rounded-lg flex items-center justify-center">
                    <Icon name="assignment" className="w-8 h-8 text-tertiary" />
                  </div>
                  <div>
                    <h4 className="font-headline-md text-xl font-black">Tugas / Penugasan Praktik</h4>
                    <p className="text-xs text-on-surface-variant font-bold">Kirimkan pekerjaan Anda untuk dinilai oleh instruktur.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border-2 border-on-background p-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant/80">BATAS WAKTU (DEADLINE)</span>
                  <p className="font-headline-sm text-sm font-black text-on-surface mt-1">
                    {activeLesson.deadline ? new Date(activeLesson.deadline).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Tidak ada batas waktu'}
                  </p>
                </div>
                <div className="bg-white border-2 border-on-background p-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant/80">FORMAT FILE YANG DIIZINKAN</span>
                  <p className="font-headline-sm text-sm font-black text-on-surface mt-1">
                    {activeLesson.allowed_file_types || 'pdf, docx, zip, png, jpg'}
                  </p>
                </div>
              </div>

              <div className="bg-white border-2 border-on-background p-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mt-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant/80 block mb-2">PANDUAN TUGAS</span>
                <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">{activeLesson.assignment_text || activeLesson.content || 'Silakan ikuti instruksi yang diberikan.'}</p>
              </div>

              <div className="bg-white border-2 border-on-background p-6 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mt-2">
                <span className="text-xs uppercase font-black tracking-widest text-on-surface-variant/80 block mb-3">STATUS PENGIRIMAN</span>
                
                {submission ? (
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-green-50 border-2 border-green-600 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-green-800 flex items-center gap-1.5">
                        <Icon name="check_circle" className="w-5 h-5 text-green-600" />
                        Tugas Berhasil Dikirim
                      </p>
                      <a href={submission.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline font-bold mt-1 block truncate">
                        Lihat file yang dikirim: {submission.file_url.split('/').pop()}
                      </a>
                      <p className="text-[10px] text-green-700/80 mt-1">
                        Dikirim pada: {new Date(submission.submitted_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                    
                    <label className="cursor-pointer px-4 py-2 bg-white text-green-700 font-label-bold text-xs rounded-lg border-2 border-green-600 hover:bg-green-50 transition-all text-center flex-shrink-0">
                      Kirim Ulang File
                      <input type="file" className="hidden" onChange={handleFileChange} />
                    </label>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="border-4 border-dashed border-on-background/20 rounded-xl p-6 text-center bg-surface-container-lowest">
                      <Icon name="cloud_upload" className="w-10 h-10 mx-auto text-on-surface-variant/40 mb-2" />
                      <p className="text-xs font-bold text-on-surface-variant">
                        {submissionFile ? `File terpilih: ${submissionFile.name}` : 'Pilih file tugas Anda untuk diunggah'}
                      </p>
                      <input type="file" id="assignment-file-input" className="hidden" onChange={handleFileChange} />
                      <button 
                        onClick={() => document.getElementById('assignment-file-input').click()}
                        className="mt-3 px-4 py-2 bg-surface-container text-on-surface font-label-bold text-xs rounded-lg border-2 border-on-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
                      >
                        Pilih File
                      </button>
                    </div>

                    {submissionFile && (
                      <button
                        onClick={handleSubmitAssignment}
                        disabled={submitting}
                        className="w-full py-3 bg-tertiary text-on-tertiary font-headline-md rounded-lg border-2 border-on-background shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 transition-all text-center uppercase tracking-wider text-xs font-black disabled:opacity-50"
                      >
                        {submitting ? 'Mengirim...' : 'Kirim Tugas Sekarang'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : activeLesson.type === 'interactive' ? (
            <div className="p-6 bg-[#181818] border-4 border-on-background rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col min-h-[480px]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  </div>
                  <h4 className="font-mono text-sm text-gray-400 font-bold">interactive_workspace.js</h4>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="terminal" className="w-5 h-5 text-green-400" />
                  <span className="font-mono text-xs text-green-400">ONLINE JS ENVIRONMENT</span>
                </div>
              </div>

              <div className="mb-4 bg-white/5 p-3 rounded-lg border border-white/10 text-xs font-mono text-gray-300">
                <span className="text-yellow-400 font-bold">💡 TANTANGAN:</span> Hapus semua nilai duplikat dari array <code className="bg-white/10 px-1.5 py-0.5 rounded text-white font-bold">data</code> dan urutkan hasilnya secara menurun (<code className="text-white font-bold">descending</code>).
              </div>

              <div className="flex-1 font-mono text-sm text-green-400 flex flex-col">
                <div className="text-gray-500">// optimizeQuery menerima parameter 'data' berupa array angka</div>
                <div className="text-pink-400">export const <span className="text-blue-300">optimizeQuery</span> = (data) =&gt; &#123;</div>
                <textarea
                  value={codeBody}
                  onChange={(e) => setCodeBody(e.target.value)}
                  className="w-full flex-grow bg-transparent border-none outline-none resize-none font-mono text-slate-100 pl-6 py-2 focus:ring-0 focus:outline-none placeholder-gray-600 line-clamp-10"
                  rows={6}
                  spellCheck="false"
                  placeholder="  // Tulis kode pemrosesan data di sini...&#10;  // contoh: return [...new Set(data)];"
                />
                <div className="text-pink-400">&#125;;</div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                <button
                  onClick={handleResetCode}
                  className="px-4 py-2 border border-white/20 text-gray-400 font-mono text-xs rounded hover:text-white hover:border-white transition-colors"
                >
                  Reset Kode
                </button>
                <button
                  onClick={handleRunCode}
                  className="px-6 py-2.5 bg-green-500 text-black font-black uppercase text-xs rounded border-2 border-black hover:bg-green-400 transition-colors shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
                >
                  Jalankan Kode
                </button>
              </div>

              {terminalOutput && (
                <div className="mt-4 p-4 bg-black rounded-lg border border-white/10 font-mono text-xs text-white">
                  <div className="text-gray-500 border-b border-white/10 pb-1 mb-2 flex justify-between">
                    <span>OUTPUT TERMINAL</span>
                    <button onClick={() => setTerminalOutput('')} className="hover:text-white">Clear</button>
                  </div>
                  <pre className="whitespace-pre-wrap leading-relaxed">{terminalOutput}</pre>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-48 bg-secondary-container border-4 border-on-background rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden relative">
              <Icon name="menu_book" className="w-24 h-24 text-secondary/20 absolute -right-4 -bottom-4" />
              <div className="text-center relative z-10 p-6">
                <h4 className="font-headline-lg text-on-secondary-container">Bahan Bacaan & Modul</h4>
                <p className="text-on-secondary-container/80 mt-2">Silakan baca materi teks di bawah untuk melengkapi pemahaman Anda.</p>
              </div>
            </div>
          )}

          {/* Text Content */}
          {activeLesson.type !== 'assignment' && (
            <div className="bg-white border-2 border-on-background rounded-xl p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-headline-md text-2xl mb-6">Materi: {activeLesson.title}</h3>
              <div className="prose max-w-none text-on-surface-variant font-body-md space-y-4 text-lg">
                <p className="leading-relaxed whitespace-pre-wrap">{activeLesson.content || 'Tidak ada deskripsi materi tambahan.'}</p>
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex justify-between items-center py-6 border-t-2 border-on-background">
            <button 
              onClick={handlePrevLesson}
              disabled={lessons.findIndex(l => l.id === activeLesson.id) === 0}
              className="px-6 py-3 font-label-bold text-on-surface border-2 border-on-background rounded-lg hover:bg-surface-container transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Materi Sebelumnya
            </button>

            <div className="flex gap-4">
              <button 
                onClick={() => handleToggleLessonCompleted(activeLesson)}
                className={`px-6 py-3 font-headline-md rounded-lg border-2 border-on-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 ${activeLesson.completed ? 'bg-surface-container text-on-surface' : 'bg-tertiary text-on-tertiary'}`}
              >
                <Icon name={activeLesson.completed ? 'close' : 'check_circle'} className="w-5 h-5" />
                {activeLesson.completed ? 'Batalkan Selesai' : 'Tandai Selesai'}
              </button>
              
              <button 
                onClick={handleNextLesson}
                className="px-6 py-3 bg-primary text-white font-headline-md rounded-lg border-2 border-on-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2"
              >
                Materi Selanjutnya <Icon name="arrow_forward" className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── Custom Neobrutalist Confirmation Modal ── */}
      {showConfirmNext && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border-4 border-on-background rounded-2xl p-6 max-w-md w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-warning mb-4">
              <Icon name="help" className="w-8.5 h-8.5 text-amber-500" />
              <h3 className="font-headline-md text-xl font-black text-on-surface">Selesaikan Modul?</h3>
            </div>
            <p className="text-on-surface-variant font-body-md leading-relaxed mb-6">
              Apakah Anda sudah menyelesaikan modul <span className="font-bold text-on-surface">"{activeLesson?.title}"</span>? 
              Jika sudah, kami akan menandainya sebagai selesai dan lanjut ke materi berikutnya.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => handleConfirmNext(true)}
                className="flex-1 px-5 py-3 bg-tertiary text-on-tertiary font-headline-md rounded-lg border-2 border-on-background shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all text-center"
              >
                Sudah Selesai
              </button>
              <button 
                onClick={() => handleConfirmNext(false)}
                className="flex-1 px-5 py-3 bg-surface-container text-on-surface font-headline-md rounded-lg border-2 border-on-background shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all text-center"
              >
                Belum Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseLesson;
