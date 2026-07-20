import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherSidebar from '../components/TeacherSidebar';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabaseClient';
import { showToast, friendlyError } from '../lib/toast';

const StarDisplay = ({ rating }) => (
  <span className="text-[#FFB800] font-black tracking-tighter">
    {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
  </span>
);

const STATUS_CONFIG = {
  draft:     { label: 'DRAFT',     bg: 'bg-surface-variant', text: 'text-on-surface-variant', border: 'border-outline-variant',        icon: 'edit_note' },
  published: { label: 'PUBLISHED', bg: 'bg-emerald-100',      text: 'text-emerald-700',            border: 'border-emerald-500',           icon: 'public' },
  locked:    { label: 'LOCKED',    bg: 'bg-error/10',         text: 'text-error',              border: 'border-error',                 icon: 'lock' },
};

const FILTER_TABS = ['all', 'draft', 'published', 'locked'];

const TeacherCourses = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [ratingsMap, setRatingsMap] = useState({});
  const [expandedFeedback, setExpandedFeedback] = useState(null);
  const [profilesMap, setProfilesMap] = useState({});
  const [publishingId, setPublishingId] = useState(null);
  
  // Confirmation Modal
  const [showConfirmPublish, setShowConfirmPublish] = useState(false);
  const [courseToPublish, setCourseToPublish] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles').select('role, full_name').eq('id', session.user.id).single();
      if (profile?.role !== 'teacher') { navigate('/'); return; }
      setUser({ ...session.user, full_name: profile.full_name });

      // Fetch owned courses
      const { data: ownedCourses } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', session.user.id)
        .order('created_at', { ascending: false });

      // Fetch collaborated courses
      const { data: collaborations } = await supabase
        .from('course_collaborators')
        .select('course_id, courses(*)')
        .eq('teacher_id', session.user.id)
        .eq('status', 'accepted');

      const collabCourses = collaborations?.map(c => c.courses).filter(Boolean) || [];
      const ownedFormatted = (ownedCourses || []).map(c => ({ ...c, isCollaboration: false }));
      const collabFormatted = collabCourses.map(c => ({ ...c, isCollaboration: true }));

      const allCoursesMap = {};
      ownedFormatted.forEach(c => { allCoursesMap[c.id] = c; });
      collabFormatted.forEach(c => { allCoursesMap[c.id] = c; });
      const teacherCourses = Object.values(allCoursesMap).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      if (teacherCourses.length === 0) {
        setCourses([]);
        setLoading(false);
        return;
      }

      const courseIds = teacherCourses.map(c => c.id);

      // Fetch enrollment counts
      let enrollments = [];
      if (courseIds.length > 0) {
        const { data: e } = await supabase
          .from('enrollments').select('course_id').in('course_id', courseIds);
        enrollments = e || [];
      }

      // Build enrollment count map
      const countMap = {};
      enrollments?.forEach(e => {
        countMap[e.course_id] = (countMap[e.course_id] || 0) + 1;
      });

      // Auto-lock courses that have students but are not already locked
      const coursesToLock = teacherCourses.filter(c =>
        countMap[c.id] > 0 && c.status !== 'locked' && !c.isCollaboration
      );
      if (coursesToLock.length > 0) {
        await Promise.all(
          coursesToLock.map(c =>
            supabase.from('courses').update({ status: 'locked' }).eq('id', c.id)
          )
        );
        coursesToLock.forEach(c => { c.status = 'locked'; });
      }

      // Fetch ratings
      let ratings = [];
      if (courseIds.length > 0) {
        const { data: r } = await supabase
          .from('course_ratings')
          .select('course_id, rating, feedback, user_id, created_at')
          .in('course_id', courseIds)
          .order('created_at', { ascending: false });
        ratings = r || [];
      }

      const raterIds = [...new Set(ratings?.map(r => r.user_id) || [])];
      let profiles = [];
      if (raterIds.length > 0) {
        const { data: p } = await supabase
          .from('profiles').select('id, full_name, username').in('id', raterIds);
        profiles = p || [];
      }
      const pMap = {};
      profiles.forEach(p => { pMap[p.id] = p; });
      setProfilesMap(pMap);

      const rMap = {};
      ratings?.forEach(r => {
        if (!rMap[r.course_id]) rMap[r.course_id] = [];
        rMap[r.course_id].push(r);
      });
      setRatingsMap(rMap);

      const formatted = teacherCourses.map(c => {
        const courseRatings = rMap[c.id] || [];
        const avgRating = courseRatings.length > 0
          ? (courseRatings.reduce((a, b) => a + b.rating, 0) / courseRatings.length).toFixed(1)
          : null;
        return { ...c, student_count: countMap[c.id] || 0, avg_rating: avgRating, rating_count: courseRatings.length };
      });

      setCourses(formatted);
      setLoading(false);
    };
    fetchData();
  }, [navigate]);

  const handleDeleteCourse = async (id) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      showToast('Klik hapus sekali lagi untuk konfirmasi.', 'error');
      setTimeout(() => setConfirmDeleteId(null), 4000);
      return;
    }
    const { error } = await supabase.from('courses').delete().eq('id', id);
    setConfirmDeleteId(null);
    if (error) showToast(friendlyError(error), 'error');
    else { setCourses(courses.filter(c => c.id !== id)); showToast('Kursus berhasil dihapus.'); }
  };

  const handlePublishCourse = async (courseId) => {
    setPublishingId(courseId);
    try {
      // Validate that course has a final project
      const { data: fpItems, error: fpErr } = await supabase
        .from('course_syllabus')
        .select('id')
        .eq('course_id', courseId)
        .eq('type', 'final_project')
        .limit(1);

      if (fpErr) throw fpErr;
      if (!fpItems || fpItems.length === 0) {
        showToast('Kursus tidak dapat dipublikasikan karena belum memiliki Final Project (Tugas Akhir).', 'error');
        return;
      }

      const { error } = await supabase.from('courses').update({ status: 'published' }).eq('id', courseId);
      if (error) throw error;
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: 'published' } : c));
      showToast('Kursus berhasil dipublikasikan! 🎉');
    } catch (err) {
      showToast(friendlyError(err), 'error');
    } finally {
      setPublishingId(null);
    }
  };

  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (c.status || 'draft') === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const countByStatus = {
    all:       courses.length,
    draft:     courses.filter(c => (c.status || 'draft') === 'draft').length,
    published: courses.filter(c => c.status === 'published').length,
    locked:    courses.filter(c => c.status === 'locked').length,
  };

  return (
    <div className="bg-surface font-sans text-on-surface min-h-screen antialiased flex">
      <TeacherSidebar user={user} />

      <main className="flex-1 lg:ml-[280px] pt-20 lg:pt-10 pb-24 lg:pb-8 px-margin-mobile lg:px-margin-desktop w-full max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-on-surface mb-2">My Courses</h1>
            <p className="text-lg text-on-surface-variant">Kelola draft, terbitkan, dan pantau kursus Anda.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
              <input
                className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-outline-variant bg-white focus:border-primary transition-all outline-none font-bold"
                placeholder="Cari kursus..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {FILTER_TABS.map(tab => {
            const cfg = tab === 'all' ? null : STATUS_CONFIG[tab];
            const isActive = statusFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl border-2 font-black text-xs sm:text-sm uppercase tracking-wide transition-all ${
                  isActive
                    ? 'bg-on-surface text-white border-on-surface shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]'
                    : 'bg-white border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                {tab === 'all' ? 'Semua' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-surface-variant text-on-surface-variant'}`}>
                  {countByStatus[tab]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {loading ? (
            [1, 2, 3].map(i => <div key={i} className="h-64 bg-surface-container animate-pulse rounded-3xl border-2 border-on-surface"></div>)
          ) : (
            <>
              {filteredCourses.map((course) => {
                const courseRatings = ratingsMap[course.id] || [];
                const isExpanded = expandedFeedback === course.id;
                const status = course.status || 'draft';
                const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
                const isLocked = status === 'locked';
                const isDraft = status === 'draft';

                return (
                  <div key={course.id} className="flex flex-col">
                    <div className={`bg-white rounded-[32px] border-2 border-on-surface p-8 flex flex-col shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all relative overflow-hidden ${isLocked ? 'opacity-80' : ''}`}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container opacity-10 rounded-bl-full -z-10"></div>

                      {/* Top Row: Status + Lock Dot */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-wrap gap-2">
                          {/* Status Badge */}
                          <span className={`px-3 py-1 rounded-full text-xs font-black border uppercase flex items-center gap-1 ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                            <span className="material-symbols-outlined text-xs">{statusCfg.icon}</span>
                            {statusCfg.label}
                          </span>
                          {course.isCollaboration && (
                            <span className="px-3 py-1 rounded-full bg-tertiary-container text-on-tertiary-container text-xs font-black border border-on-surface uppercase flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">group</span> Collab
                            </span>
                          )}
                        </div>
                        <span
                          className={`w-3 h-3 rounded-full ${course.student_count > 0 ? 'bg-success' : 'bg-outline-variant'}`}
                          title={course.student_count > 0 ? 'Ada siswa' : 'Belum ada siswa'}
                        />
                      </div>

                      {/* Lock Banner */}
                      {isLocked && (
                        <div className="mb-4 p-3 bg-error/5 border border-error/30 rounded-xl flex items-center gap-2">
                          <span className="material-symbols-outlined text-error text-sm">lock</span>
                          <p className="text-[10px] text-error font-black uppercase tracking-wider">Terkunci — Sudah ada student yang enroll</p>
                        </div>
                      )}

                      <h3 className="text-xl font-black text-on-surface mb-5 leading-tight line-clamp-2">{course.title}</h3>

                      <div className="flex gap-8 mb-6 mt-auto">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Students</span>
                          <span className="text-xl font-black flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">group</span> {course.student_count}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Rating</span>
                          {course.avg_rating ? (
                            <span className="flex items-center gap-1">
                              <span className="text-xl font-black">{course.avg_rating}</span>
                              <span className="text-[#FFB800] text-lg">★</span>
                              <span className="text-xs text-on-surface-variant font-bold">({course.rating_count})</span>
                            </span>
                          ) : (
                            <span className="text-xs text-on-surface-variant italic font-bold">Belum ada rating</span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 pt-5 border-t border-surface-variant w-full">
                        {/* Preview Button — always available */}
                        <button
                          onClick={() => navigate(`/teacher/courses/preview/${course.id}?from=list`)}
                          className="col-span-1 py-3 px-3 rounded-2xl border-2 border-primary-container bg-primary-container text-on-primary-container font-bold hover:opacity-80 transition-all flex justify-center items-center gap-1 text-xs md:text-sm"
                          title="Preview tampilan student"
                        >
                          <span className="material-symbols-outlined text-lg">visibility</span>
                          Preview
                        </button>

                        {/* Edit — disabled for locked */}
                        {!isLocked ? (
                          <button
                            onClick={() => navigate(`/teacher/courses/edit/${course.id}`)}
                            className="col-span-1 py-3 rounded-2xl border-2 border-outline-variant font-bold hover:bg-surface-container-low transition-all flex justify-center items-center gap-2 text-xs md:text-sm"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span> Edit
                          </button>
                        ) : (
                          <button
                            disabled
                            className="col-span-1 py-3 rounded-2xl border-2 border-outline-variant font-bold flex justify-center items-center gap-2 text-xs md:text-sm opacity-40 cursor-not-allowed"
                            title="Course terkunci karena sudah ada student yang enroll"
                          >
                            <span className="material-symbols-outlined text-lg">lock</span> Terkunci
                          </button>
                        )}

                        {/* Publish — only for draft, only if owner */}
                        {isDraft && !course.isCollaboration && (
                          <button
                            onClick={() => {
                              setCourseToPublish(course);
                              setShowConfirmPublish(true);
                            }}
                            disabled={publishingId === course.id}
                            className="col-span-2 sm:flex-1 py-3 rounded-2xl bg-emerald-600 text-white border-2 border-on-surface font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all flex justify-center items-center gap-2 text-xs md:text-sm disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-lg">public</span>
                            {publishingId === course.id ? 'Proses...' : 'Publish'}
                          </button>
                        )}

                        {/* Feedback */}
                        {courseRatings.length > 0 && (
                          <button
                            onClick={() => setExpandedFeedback(isExpanded ? null : course.id)}
                            className="col-span-1 py-3 px-3 rounded-2xl border-2 border-outline-variant font-bold hover:bg-surface-container-low transition-all flex justify-center items-center gap-2 text-xs md:text-sm"
                          >
                            <span className="material-symbols-outlined text-lg">reviews</span>
                            {isExpanded ? '▲' : '▼'}
                          </button>
                        )}

                        {/* Delete — only owner, only non-locked */}
                        {!course.isCollaboration && !isLocked && (
                          <button
                            onClick={() => handleDeleteCourse(course.id)}
                            className={`col-span-1 py-3 px-3 rounded-2xl border-2 font-bold transition-all flex justify-center items-center gap-1 text-xs md:text-sm ${confirmDeleteId === course.id ? 'bg-error text-white border-error' : 'border-error-container text-error hover:bg-error-container'}`}
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Feedback Panel */}
                    {isExpanded && courseRatings.length > 0 && (
                      <div className="bg-surface-container-low rounded-b-[32px] border-2 border-t-0 border-on-surface -mt-2 p-6 space-y-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                        <h4 className="font-black text-sm uppercase tracking-widest text-on-surface-variant mb-4">Ulasan Siswa</h4>
                        {courseRatings.map((r, i) => {
                          const raterProfile = profilesMap[r.user_id];
                          return (
                            <div key={i} className="bg-white rounded-2xl p-4 border-2 border-on-surface shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-primary-container border border-on-surface flex items-center justify-center font-black text-sm">
                                    {(raterProfile?.full_name || raterProfile?.username || 'S').charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-black text-sm">{raterProfile?.full_name || raterProfile?.username || 'Student'}</span>
                                </div>
                                <StarDisplay rating={r.rating} />
                              </div>
                              {r.feedback && <p className="text-sm text-on-surface-variant font-medium italic">"{r.feedback}"</p>}
                              <p className="text-[10px] text-on-surface-variant font-bold mt-2">{new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Create New Card */}
              <div onClick={() => navigate('/teacher/courses/create')} className="bg-surface-container-low border-4 border-dashed border-outline-variant rounded-[32px] p-8 flex flex-col items-center justify-center text-center hover:bg-surface-container-high transition-all cursor-pointer min-h-[280px]">
                <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-6 shadow-md border-2 border-on-surface">
                  <span className="material-symbols-outlined text-3xl font-bold">add</span>
                </div>
                <h3 className="text-2xl font-black text-on-surface mb-2">Buat Kursus Baru</h3>
                <p className="text-sm text-on-surface-variant max-w-[200px]">Mulai membangun pengalaman belajar yang menarik.</p>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmPublish && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[32px] border-4 border-on-surface p-8 max-w-md w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary-container rounded-xl border-2 border-on-surface flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
                <span className="material-symbols-outlined text-on-primary-container text-2xl font-bold">help</span>
              </div>
              <h3 className="text-2xl font-black text-on-surface">Publish Kursus?</h3>
            </div>
            
            <p className="text-on-surface-variant font-medium leading-relaxed mb-8">
              Apakah Anda yakin ingin mempublikasikan kursus <strong>{courseToPublish?.title}</strong>? Setelah dipublikasikan, kursus akan dapat diakses dan di-enroll oleh siswa di Katalog.
              <br /><br />
              Kami menyarankan Anda untuk mengecek tampilannya terlebih dahulu menggunakan <strong>Preview Mode</strong>.
            </p>

            <div className="flex flex-col gap-3">
              {/* Preview Button */}
              <button
                type="button"
                onClick={() => {
                  setShowConfirmPublish(false);
                  navigate(`/teacher/courses/preview/${courseToPublish?.id}?from=list`);
                  setCourseToPublish(null);
                }}
                className="w-full py-3.5 rounded-2xl bg-primary-container text-on-primary-container font-black border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all flex justify-center items-center gap-2"
              >
                <span className="material-symbols-outlined">visibility</span>
                Cek Tampilan Dulu (Preview)
              </button>

              {/* Confirm Publish */}
              <button
                type="button"
                onClick={() => {
                  setShowConfirmPublish(false);
                  if (courseToPublish) {
                    handlePublishCourse(courseToPublish.id);
                  }
                  setCourseToPublish(null);
                }}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-black border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all flex justify-center items-center gap-2"
              >
                <span className="material-symbols-outlined">public</span>
                Ya, Publikasikan Sekarang
              </button>

              {/* Cancel */}
              <button
                type="button"
                onClick={() => {
                  setShowConfirmPublish(false);
                  setCourseToPublish(null);
                }}
                className="w-full py-3 rounded-2xl border-4 border-outline text-on-surface-variant font-bold hover:bg-surface-variant transition-all text-center"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherCourses;
