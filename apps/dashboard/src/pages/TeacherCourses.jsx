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

const TeacherCourses = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [ratingsMap, setRatingsMap] = useState({});     // courseId → [{rating, feedback, user_name, created_at}]
  const [expandedFeedback, setExpandedFeedback] = useState(null); // courseId that's expanded
  const [profilesMap, setProfilesMap] = useState({});

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

      // Merge and sort
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

      // Fetch enrollment counts separately
      let enrollments = [];
      if (courseIds.length > 0) {
        const { data: e } = await supabase
          .from('enrollments').select('course_id').in('course_id', courseIds);
        enrollments = e || [];
      }

      // Fetch ratings from course_ratings table
      let ratings = [];
      if (courseIds.length > 0) {
        const { data: r } = await supabase
          .from('course_ratings')
          .select('course_id, rating, feedback, user_id, created_at')
          .in('course_id', courseIds)
          .order('created_at', { ascending: false });
        ratings = r || [];
      }

      // Fetch profiles of raters
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

      // Build ratings map grouped by course_id
      const rMap = {};
      ratings?.forEach(r => {
        if (!rMap[r.course_id]) rMap[r.course_id] = [];
        rMap[r.course_id].push(r);
      });
      setRatingsMap(rMap);

      // Build count map
      const countMap = {};
      enrollments?.forEach(e => {
        countMap[e.course_id] = (countMap[e.course_id] || 0) + 1;
      });

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

  const filteredCourses = courses.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="bg-surface font-sans text-on-surface min-h-screen antialiased flex">
      <TeacherSidebar user={user} />

      <main className="flex-1 lg:ml-[280px] pt-20 lg:pt-10 pb-24 lg:pb-8 px-margin-mobile lg:px-margin-desktop w-full max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-on-surface mb-2">My Courses</h1>
            <p className="text-lg text-on-surface-variant">Manage and track your published and draft courses.</p>
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

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {loading ? (
            [1, 2, 3].map(i => <div key={i} className="h-64 bg-surface-container animate-pulse rounded-3xl border-2 border-on-surface"></div>)
          ) : (
            <>
              {filteredCourses.map((course) => {
                const courseRatings = ratingsMap[course.id] || [];
                const isExpanded = expandedFeedback === course.id;

                return (
                  <div key={course.id} className="flex flex-col">
                    <div className="bg-white rounded-[32px] border-2 border-on-surface p-8 flex flex-col shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container opacity-10 rounded-bl-full -z-10"></div>

                      <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-wrap gap-2">
                          <span className="px-4 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-black border border-secondary-fixed-dim uppercase">Active</span>
                          {course.isCollaboration && (
                            <span className="px-3 py-1 rounded-full bg-tertiary-container text-on-tertiary-container text-xs font-black border border-on-surface uppercase flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs font-black">group</span> Collab
                            </span>
                          )}
                        </div>
                        <span className={`w-3 h-3 rounded-full ${course.student_count > 0 ? 'bg-success' : 'bg-outline-variant'}`} title={course.student_count > 0 ? 'Ada siswa' : 'Belum ada siswa'} />
                      </div>

                      <h3 className="text-xl font-black text-on-surface mb-5 leading-tight line-clamp-2">{course.title}</h3>

                      <div className="flex gap-8 mb-6 mt-auto">
                        {/* Students */}
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Students</span>
                          <span className="text-xl font-black flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">group</span> {course.student_count}
                          </span>
                        </div>
                        {/* Rating */}
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
                      <div className="flex gap-2 pt-5 border-t border-surface-variant flex-wrap">
                        <button onClick={() => navigate(`/teacher/courses/edit/${course.id}`)} className="flex-1 py-3 rounded-2xl border-2 border-outline-variant font-bold hover:bg-surface-container-low transition-all flex justify-center items-center gap-2 text-sm">
                          <span className="material-symbols-outlined text-lg">edit</span> Edit
                        </button>
                        {courseRatings.length > 0 && (
                          <button
                            onClick={() => setExpandedFeedback(isExpanded ? null : course.id)}
                            className="flex-1 py-3 rounded-2xl border-2 border-primary-container bg-primary-container text-on-primary-container font-bold hover:opacity-80 transition-all flex justify-center items-center gap-2 text-sm"
                          >
                            <span className="material-symbols-outlined text-lg">reviews</span>
                            Feedback {isExpanded ? '▲' : '▼'}
                          </button>
                        )}
                        {!course.isCollaboration && (
                          <button onClick={() => handleDeleteCourse(course.id)} className={`py-3 px-4 rounded-2xl border-2 font-bold transition-all flex justify-center items-center gap-1 text-sm ${confirmDeleteId === course.id ? 'bg-error text-white border-error' : 'border-error-container text-error hover:bg-error-container'}`}>
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
    </div>
  );
};

export default TeacherCourses;
