import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { courseService } from '../lib/courseService';
import Sidebar from '../components/Sidebar';
import ProfileDropdown from '../components/ProfileDropdown';
import NotificationDropdown from '../components/NotificationDropdown';
import Icon from '../components/Icon';
import { showToast } from '../lib/toast';
import { useUserProfile } from '../context/UserProfileContext';
import { getTranslation } from '../lib/i18n';

/* ─── Star Rating Component ─── */
const StarRating = ({ value, onChange }) => (
  <div className="flex gap-2">
    {[1, 2, 3, 4, 5].map(star => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        className={`text-5xl transition-transform hover:scale-125 ${star <= value ? 'text-[#FFB800]' : 'text-surface-variant'}`}
      >
        ★
      </button>
    ))}
  </div>
);

const CourseLearn = () => {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const t = (key) => getTranslation(profile.language || 'id', key);
  const lang = profile.language || 'id';

  const [translatedTitle, setTranslatedTitle] = useState('');
  const [translatedContent, setTranslatedContent] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslationActive, setIsTranslationActive] = useState(false);

  useEffect(() => {
    setIsTranslationActive(false);
    setTranslatedTitle('');
    setTranslatedContent('');
  }, [activeSyllabus, profile.language]);

  const handleTranslateClick = async () => {
    if (isTranslationActive) {
      setIsTranslationActive(false);
      return;
    }
    
    if (translatedTitle && translatedContent) {
      setIsTranslationActive(true);
      return;
    }
    
    setIsTranslating(true);
    try {
      const result = await courseService.translateContent(
        activeSyllabus.title,
        activeSyllabus.assignment_text || activeSyllabus.content || '',
        lang
      );
      setTranslatedTitle(result.title);
      setTranslatedContent(result.content);
      setIsTranslationActive(true);
      showToast(
        lang === 'en'
          ? "Translated with Harin AI! ✦"
          : lang === 'ja'
          ? "Harin AIで翻訳しました！ ✦"
          : lang === 'zh'
          ? "已通过 Harin AI 翻译！ ✦"
          : "Berhasil diterjemahkan dengan Harin AI! ✦"
      );
    } catch (err) {
      console.error(err);
      showToast("Gagal menerjemahkan konten. Coba lagi.", "error");
    } finally {
      setIsTranslating(false);
    }
  };

  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [activeSyllabus, setActiveSyllabus] = useState(null);
  const [completedIds, setCompletedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSubmission, setCurrentSubmission] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Rating modal states
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: courseData } = await supabase
          .from('courses').select('*').eq('id', courseId).single();
        setCourse(courseData);

        const content = await courseService.getCourseContent(courseId);
        setSections(content);

        const progress = await courseService.getUserProgress(profile.id, courseId);
        setCompletedIds(progress);

        const allSyl = content.flatMap(s => s.course_syllabus);
        const firstUncompleted = allSyl.find(s => !progress.includes(s.id)) || allSyl[0];
        setActiveSyllabus(firstUncompleted);

        // Check if already rated
        const { data: existingRating } = await supabase
          .from('course_ratings')
          .select('id')
          .eq('course_id', courseId)
          .eq('user_id', profile.id)
          .maybeSingle();
        if (existingRating) setHasRated(true);

        // If all completed and not yet rated, show modal
        if (progress.length === allSyl.length && allSyl.length > 0 && !existingRating) {
          setShowRatingModal(true);
        }
      } catch (err) {
        console.error(err);
        showToast('Gagal memuat materi.', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (profile.id) fetchData();
  }, [courseId, profile.id]);

  useEffect(() => {
    const fetchSubmission = async () => {
      if (activeSyllabus?.assignment_text) {
        try {
          const sub = await courseService.getUserSubmission(profile.id, activeSyllabus.id);
          setCurrentSubmission(sub);
        } catch (err) { console.error(err); }
      } else {
        setCurrentSubmission(null);
      }
    };
    if (activeSyllabus && profile.id) fetchSubmission();
  }, [activeSyllabus, profile.id]);

  const handleAssignmentUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const sub = await courseService.submitAssignment(profile.id, courseId, activeSyllabus.id, file);
      setCurrentSubmission(sub);
      showToast('Tugas berhasil dikumpulkan!', 'success');
    } catch (err) {
      showToast('Gagal mengumpulkan tugas.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleComplete = async () => {
    if (!activeSyllabus || completedIds.includes(activeSyllabus.id)) return;
    try {
      await courseService.markSyllabusCompleted(profile.id, courseId, activeSyllabus.id);
      const newCompleted = [...completedIds, activeSyllabus.id];
      setCompletedIds(newCompleted);
      showToast('Materi selesai!');

      const allSyl = sections.flatMap(s => s.course_syllabus);
      if (newCompleted.length === allSyl.length && !hasRated) {
        showToast('🎉 Selamat! Kamu menyelesaikan semua materi!', 'success');
        setTimeout(() => setShowRatingModal(true), 1200);
      }
    } catch (err) {
      showToast('Gagal menyimpan progress.', 'error');
    }
  };

  const handleSubmitRating = async () => {
    if (ratingValue === 0) { showToast('Pilih bintang terlebih dahulu.', 'error'); return; }
    setSubmittingRating(true);
    try {
      const { error } = await supabase.from('course_ratings').upsert({
        course_id: Number(courseId),
        user_id: profile.id,
        rating: ratingValue,
        feedback: feedbackText.trim() || null,
      }, { onConflict: 'course_id,user_id' });

      if (error) throw error;
      setHasRated(true);
      setShowRatingModal(false);
      showToast('Terima kasih atas ulasan kamu! 🌟', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan ulasan.', 'error');
    } finally {
      setSubmittingRating(false);
    }
  };

  const allSyllabus = sections.flatMap(s => s.course_syllabus);
  const isLastSyllabus = activeSyllabus && allSyllabus[allSyllabus.length - 1]?.id === activeSyllabus?.id;

  const handleNext = () => {
    const currentIndex = allSyllabus.findIndex(s => s.id === activeSyllabus.id);
    if (currentIndex < allSyllabus.length - 1) setActiveSyllabus(allSyllabus[currentIndex + 1]);
  };

  const handlePrev = () => {
    const currentIndex = allSyllabus.findIndex(s => s.id === activeSyllabus.id);
    if (currentIndex > 0) setActiveSyllabus(allSyllabus[currentIndex - 1]);
  };

  const getEmbedUrl = (url) => {
    if (!url) return '';
    url = url.trim();
    
    let videoId = null;
    
    try {
      if (url.includes('/embed/')) {
        return url;
      }
      
      if (url.includes('youtu.be/')) {
        const parts = url.split('youtu.be/');
        if (parts[1]) {
          videoId = parts[1].split('?')[0].split('/')[0];
        }
      } else if (url.includes('/shorts/')) {
        const parts = url.split('/shorts/');
        if (parts[1]) {
          videoId = parts[1].split('?')[0].split('/')[0];
        }
      } else if (url.includes('youtube.com')) {
        const urlObj = new URL(url);
        videoId = urlObj.searchParams.get('v');
      }
      
      if (!videoId) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
          videoId = match[2];
        }
      }
    } catch (e) {
      console.error("Failed to parse YouTube URL:", e);
    }
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="bg-background text-on-surface font-body-md flex h-screen overflow-hidden">
      <Sidebar />

      {/* ─── Rating Modal ─── */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] border-4 border-on-surface shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-10 max-w-lg w-full animate-in zoom-in-95 duration-300">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎓</div>
              <h2 className="text-3xl font-black text-on-surface mb-2">Kursus Selesai!</h2>
              <p className="text-on-surface-variant font-bold">Bagaimana pengalaman belajar kamu di kursus <span className="text-primary font-black">"{course?.title}"</span>?</p>
            </div>

            <div className="flex justify-center mb-6">
              <StarRating value={ratingValue} onChange={setRatingValue} />
            </div>
            {ratingValue > 0 && (
              <p className="text-center text-sm font-black text-on-surface-variant mb-6">
                {['', 'Sangat Buruk 😞', 'Kurang Baik 😕', 'Cukup Baik 🙂', 'Bagus! 😊', 'Luar Biasa! 🌟'][ratingValue]}
              </p>
            )}

            <textarea
              className="w-full p-4 rounded-2xl border-2 border-on-surface font-medium resize-none focus:outline-none focus:ring-4 focus:ring-primary/20 mb-6 bg-surface-container-low"
              rows={4}
              placeholder="Tulis ulasan kamu (opsional)... Apa yang paling kamu suka dari kursus ini?"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowRatingModal(false)}
                className="flex-1 py-4 rounded-2xl border-2 border-on-surface font-black hover:bg-surface-container transition-all"
              >
                Nanti Saja
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={submittingRating || ratingValue === 0}
                className="flex-1 py-4 rounded-2xl bg-primary text-on-primary border-2 border-on-surface font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 transition-all disabled:opacity-50"
              >
                {submittingRating ? 'Mengirim...' : 'Kirim Ulasan ⭐'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="sticky top-0 z-40 flex justify-between items-center px-6 py-4 bg-surface border-b-2 border-on-surface shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/courses/${courseId}`)} className="p-2 hover:bg-surface-variant rounded-lg transition-colors">
              <Icon name="arrow_back" className="w-6 h-6" />
            </button>
            <div>
              <h1 className="font-headline-sm font-black truncate max-w-[200px] md:max-w-md">{course?.title}</h1>
              <p className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest">
                Progress: {allSyllabus.length > 0 ? Math.round((completedIds.length / allSyllabus.length) * 100) : 0}%
                {completedIds.length === allSyllabus.length && allSyllabus.length > 0 && (
                  <span className="ml-2 text-success">✓ Selesai</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {activeSyllabus && (
              <button
                onClick={handleTranslateClick}
                disabled={isTranslating}
                className={`flex items-center gap-1.5 px-3 py-1.5 border-2 border-on-surface rounded-xl font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none ${
                  isTranslationActive
                    ? 'bg-primary text-white'
                    : 'bg-primary-container text-on-surface'
                }`}
              >
                <Icon name="auto_awesome" className={`w-4 h-4 ${isTranslating ? 'animate-spin' : ''}`} />
                {isTranslating
                  ? (lang === 'en' ? 'Translating...' : lang === 'ja' ? '翻訳中...' : lang === 'zh' ? '翻译中...' : 'Menerjemahkan...')
                  : isTranslationActive
                  ? (lang === 'en' ? 'Show Original' : lang === 'ja' ? '原文を表示' : lang === 'zh' ? '显示原文' : 'Tampilkan Asli')
                  : (lang === 'en' ? 'Translate with AI' : lang === 'ja' ? 'AI de Honyaku' : lang === 'zh' ? 'AI 翻译' : 'Terjemahkan (AI)')
                }
              </button>
            )}
            {completedIds.length === allSyllabus.length && allSyllabus.length > 0 && !hasRated && (
              <button
                onClick={() => setShowRatingModal(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary-container border-2 border-on-surface rounded-xl font-black text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 transition-all"
              >
                ⭐ Beri Rating
              </button>
            )}
            <NotificationDropdown />
            <ProfileDropdown />
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Syllabus Sidebar */}
          <aside className="w-[280px] bg-surface border-r-2 border-on-surface flex flex-col hidden lg:flex">
            <div className="p-5 border-b-2 border-on-surface">
              <h2 className="font-black text-lg">{{ id: 'Daftar Materi', en: 'Syllabus', ja: '講義内容', zh: '课程大纲' }[lang]}</h2>
              <p className="text-xs text-on-surface-variant font-bold mt-1">{completedIds.length}/{allSyllabus.length} {{ id: 'selesai', en: 'completed', ja: '完了', zh: '已完成' }[lang]}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {sections.map((section) => (
                <div key={section.id}>
                  <p className="text-[10px] font-black uppercase text-on-surface-variant mb-2 tracking-widest">{section.title}</p>
                  <div className="space-y-1">
                    {section.course_syllabus.map(syl => (
                      <button
                        key={syl.id}
                        onClick={() => setActiveSyllabus(syl)}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${activeSyllabus?.id === syl.id ? 'bg-primary-container border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'border-transparent hover:bg-surface-variant/20'}`}
                      >
                        <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border-2 ${completedIds.includes(syl.id) ? 'bg-success border-success text-white' : 'border-on-surface-variant'}`}>
                          {completedIds.includes(syl.id)
                            ? <Icon name="check" className="w-3 h-3" />
                            : <span className="text-[9px] font-black">{syl.sort_order + 1}</span>}
                        </div>
                        <span className={`text-xs font-bold leading-tight ${activeSyllabus?.id === syl.id ? 'text-on-primary-container' : 'text-on-surface'}`}>{syl.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-16 bg-white custom-scrollbar">
            {!activeSyllabus ? (
              <div className="h-full flex items-center justify-center flex-col gap-4 text-center opacity-40">
                <Icon name="school" className="w-20 h-20" />
                <p className="font-black text-xl">{{ id: 'Pilih materi untuk memulai belajar.', en: 'Select a lesson to start learning.', ja: '学習を始めるにはレッスンを選択してください。', zh: '选择课程开始学习。' }[lang]}</p>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeSyllabus.video_url && (
                  <div className="aspect-video w-full rounded-[40px] border-4 border-on-surface shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-black">
                    <iframe className="w-full h-full" src={getEmbedUrl(activeSyllabus.video_url)} title={activeSyllabus.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                  </div>
                )}

                <div className="space-y-6">
                  <h1 className="text-4xl md:text-5xl font-black">
                    {isTranslationActive && translatedTitle ? translatedTitle : activeSyllabus.title}
                  </h1>
                  <div className="prose prose-lg max-w-none font-medium leading-relaxed text-on-surface-variant whitespace-pre-wrap">
                    {isTranslationActive && translatedContent ? translatedContent : activeSyllabus.content}
                  </div>
                </div>

                {activeSyllabus.file_url && (
                  <div className="bg-surface-variant/20 p-8 rounded-[32px] border-2 border-on-surface flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white rounded-2xl border-2 border-on-surface flex items-center justify-center shadow-[4px_4px_0px_0px_#000]">
                        <Icon name="description" className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <p className="font-black text-lg">{{ id: 'Materi Pendukung', en: 'Supporting Material', ja: '参考資料', zh: '配套材料' }[lang]}</p>
                        <p className="text-xs font-bold text-on-surface-variant">{{ id: 'Unduh file materi (PDF/PPT/Word) untuk dipelajari secara offline.', en: 'Download lesson files (PDF/PPT/Word) to study offline.', ja: 'オフライン学習用のファイル（PDF/PPT/Word）をダウンロードします。', zh: '下载课程材料文件（PDF/PPT/Word）以进行离线学习。' }[lang]}</p>
                      </div>
                    </div>
                    <a href={activeSyllabus.file_url} target="_blank" rel="noopener noreferrer" className="bg-primary text-on-primary px-8 py-3 rounded-2xl border-4 border-on-surface font-black shadow-[4px_4px_0px_0px_#000] hover:translate-y-1 transition-all flex items-center gap-2">
                      <Icon name="download" className="w-5 h-5" /> {{ id: 'Unduh File', en: 'Download File', ja: 'ファイルをダウンロード', zh: '下载文件' }[lang]}
                    </a>
                  </div>
                )}

                {activeSyllabus.assignment_text && (
                  <div className="bg-secondary-container/20 p-8 rounded-[40px] border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-3 mb-6">
                      <Icon name="assignment" className="w-8 h-8 text-secondary" />
                      <h3 className="text-2xl font-black">{{ id: 'Tugas & Latihan', en: 'Tasks & Exercises', ja: '課題と演习', zh: '任务与练习' }[lang]}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border-2 border-on-surface font-bold text-on-surface-variant mb-8 italic">{activeSyllabus.assignment_text}</div>
                    <div className="border-t-2 border-on-surface/10 pt-8">
                      <p className="font-black text-xs uppercase tracking-widest text-on-surface-variant mb-4">{{ id: 'Pengumpulan Tugas', en: 'Assignment Submission', ja: '課題の提出', zh: '提交任务' }[lang]}</p>
                      {currentSubmission ? (
                        <div className="bg-success/10 border-2 border-success p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-success text-white rounded-xl flex items-center justify-center">
                              <Icon name="task_alt" className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-black text-success">{{ id: 'Tugas Sudah Dikumpulkan', en: 'Assignment Submitted', ja: '課題提出済み', zh: '任务已提交' }[lang]}</p>
                              <p className="text-[10px] font-bold text-on-surface-variant">
                                {{ id: 'Dikirim:', en: 'Submitted at:', ja: '提出日:', zh: '提交时间:' }[lang]} {new Date(currentSubmission.submitted_at).toLocaleString('id-ID')}
                              </p>
                            </div>
                          </div>
                          <a href={currentSubmission.file_url} target="_blank" rel="noopener noreferrer" className="text-xs font-black underline hover:text-primary transition-colors">
                            {{ id: 'Lihat File Saya', en: 'View My File', ja: 'ファイルを表示', zh: '查看我的文件' }[lang]}
                          </a>
                        </div>
                      ) : (
                        <label className={`group cursor-pointer block border-4 border-dashed rounded-2xl p-10 text-center transition-all ${uploading ? 'opacity-50 pointer-events-none' : 'border-on-surface/20 hover:border-secondary hover:bg-secondary/5'}`}>
                          <input type="file" className="hidden" onChange={(e) => handleAssignmentUpload(e.target.files[0])} />
                          <Icon name={uploading ? 'sync' : 'cloud_upload'} className={`w-12 h-12 mx-auto mb-3 text-secondary ${uploading ? 'animate-spin' : ''}`} />
                          <p className="font-black text-lg">
                            {uploading 
                              ? { id: 'Sedang Mengirim...', en: 'Submitting...', ja: '送信中...', zh: '提交中...' }[lang] 
                              : { id: 'Upload Jawaban Tugas', en: 'Upload Assignment Answer', ja: '課題の回答をアップロード', zh: '上传任务答案' }[lang]
                            }
                          </p>
                          <p className="text-xs font-bold text-on-surface-variant mt-2">
                            {{ id: 'Klik untuk memilih file (PDF, ZIP, Gambar, dll)', en: 'Click to choose file (PDF, ZIP, Image, etc.)', ja: 'クリックしてファイルを選択（PDF、ZIP、画像など）', zh: '点击选择文件（PDF、ZIP、图片等）' }[lang]}
                          </p>
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="pt-10 border-t-4 border-on-surface flex flex-col md:flex-row justify-between items-center gap-6 pb-20">
                  <div className="flex gap-4 flex-wrap">
                    {allSyllabus.findIndex(s => s.id === activeSyllabus.id) > 0 && (
                      <button onClick={handlePrev} className="px-8 py-4 bg-white rounded-2xl border-4 border-on-surface font-black text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all flex items-center gap-2">
                        <Icon name="arrow_back" className="w-6 h-6" /> {{ id: 'Materi Sebelumnya', en: 'Previous Lesson', ja: '前のレッスン', zh: '上一课' }[lang]}
                      </button>
                    )}

                    {!completedIds.includes(activeSyllabus.id) && (
                      <button onClick={handleComplete} className="px-10 py-4 bg-primary text-on-primary rounded-2xl border-4 border-on-surface font-black text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all flex items-center gap-2">
                        <Icon name="check_circle" className="w-6 h-6" /> {{ id: 'Sudah Selesai', en: 'Mark as Completed', ja: '完了とする', zh: '标记为已完成' }[lang]}
                      </button>
                    )}

                    {completedIds.includes(activeSyllabus.id) && (
                      <div className="px-10 py-4 bg-success/20 text-success rounded-2xl border-4 border-success font-black text-lg flex items-center gap-2">
                        <Icon name="check_circle" className="w-6 h-6" /> {{ id: 'Sudah Selesai', en: 'Completed', ja: '完了済み', zh: '已完成' }[lang]}
                      </div>
                    )}
                  </div>

                  {/* Right side: Next OR Rate button if last syllabus */}
                  {completedIds.includes(activeSyllabus.id) && (
                    isLastSyllabus ? (
                      !hasRated ? (
                        <button onClick={() => setShowRatingModal(true)} className="px-10 py-4 bg-[#FFB800] text-on-surface rounded-2xl border-4 border-on-surface font-black text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all flex items-center gap-2">
                          ⭐ {{ id: 'Beri Rating Kursus', en: 'Rate Course', ja: 'コースを評価', zh: '为课程评分' }[lang]}
                        </button>
                      ) : (
                        <div className="px-8 py-4 bg-secondary-container text-on-secondary-container rounded-2xl border-4 border-on-surface font-black text-lg flex items-center gap-2">
                          ✅ {{ id: 'Sudah Memberi Rating', en: 'Already Rated', ja: '評価済み', zh: '已评分' }[lang]}
                        </div>
                      )
                    ) : (
                      <button onClick={handleNext} className="px-10 py-4 bg-on-surface text-white rounded-2xl border-4 border-on-surface font-black text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all flex items-center gap-2">
                        {{ id: 'Materi Selanjutnya', en: 'Next Lesson', ja: '次のレッスン', zh: '下一课' }[lang]} <Icon name="arrow_forward" className="w-6 h-6" />
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CourseLearn;
