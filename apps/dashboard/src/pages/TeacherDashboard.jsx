import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileDropdown from '../components/ProfileDropdown';
import NotificationDropdown from '../components/NotificationDropdown';
import TeacherSidebar from '../components/TeacherSidebar';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabaseClient';
import { showToast, showConfirm } from '../lib/toast';
import { HaiIcon, WaveIcon } from '../components/Icons';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingsMap, setRatingsMap] = useState({});
  const [invitations, setInvitations] = useState([]);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate('/login');
        return;
      }

      // Check if user is a teacher
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', session.user.id)
        .single();

      if (profile?.role !== 'teacher') {
        navigate('/');
        return;
      }

      setUser({ ...session.user, full_name: profile.full_name });

      // Fetch owned courses
      const { data: ownedCourses } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', session.user.id);

      // Fetch collaborated courses
      const { data: collaborations } = await supabase
        .from('course_collaborators')
        .select('course_id, courses(*)')
        .eq('teacher_id', session.user.id)
        .eq('status', 'accepted');

      const collabCourses = collaborations?.map(c => c.courses).filter(Boolean) || [];

      const ownedFormatted = (ownedCourses || []).map(c => ({ ...c, isCollaboration: false }));
      const collabFormatted = collabCourses.map(c => ({ ...c, isCollaboration: true }));

      // Merge unique courses
      const allCoursesMap = {};
      ownedFormatted.forEach(c => { allCoursesMap[c.id] = c; });
      collabFormatted.forEach(c => { allCoursesMap[c.id] = c; });
      const teacherCourses = Object.values(allCoursesMap);

      if (teacherCourses) {
        const cIds = teacherCourses.map(c => c.id);
        
        // Fetch enrollment counts
        let enrollmentsList = [];
        if (cIds.length > 0) {
          const { data: eData } = await supabase
            .from('enrollments').select('course_id').in('course_id', cIds);
          enrollmentsList = eData || [];
        }

        // Build enrollment count map
        const countMap = {};
        enrollmentsList.forEach(e => {
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

        // Fetch real ratings
        if (cIds.length > 0) {
          const { data: ratings } = await supabase
            .from('course_ratings').select('course_id, rating').in('course_id', cIds);
          const rMap = {};
          ratings?.forEach(r => {
            if (!rMap[r.course_id]) rMap[r.course_id] = [];
            rMap[r.course_id].push(r.rating);
          });
          setRatingsMap(rMap);
        }

        setCourses(teacherCourses);
      }

      // Fetch pending invitations
      const { data: pendingInvites } = await supabase
        .from('course_collaborators')
        .select('id, course_id, invited_by, courses(title, image_url)')
        .eq('teacher_id', session.user.id)
        .eq('status', 'pending');

      let invitesWithProfiles = [];
      if (pendingInvites && pendingInvites.length > 0) {
        const inviterIds = [...new Set(pendingInvites.map(i => i.invited_by))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, username')
          .in('id', inviterIds);

        invitesWithProfiles = pendingInvites.map(invite => ({
          ...invite,
          inviterProfile: profiles?.find(p => p.id === invite.invited_by) || { full_name: 'Rekan Pengajar', username: 'pengajar' }
        }));
      }
      setInvitations(invitesWithProfiles);

      // Fetch Enrollments (simple, no join to avoid RLS issues)
      const courseIds = teacherCourses?.map(c => c.id) || [];
      if (courseIds.length > 0) {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('id, user_id, course_id, enrolled_at')
          .in('course_id', courseIds)
          .order('enrolled_at', { ascending: false });

        if (enrollments && enrollments.length > 0) {
          // Fetch profiles separately
          const studentIds = [...new Set(enrollments.map(e => e.user_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, username')
            .in('id', studentIds);

          // Attach profile and course info
          const enriched = enrollments.map(e => ({
            ...e,
            profile: profiles?.find(p => p.id === e.user_id) || null,
            course: { title: teacherCourses?.find(c => String(c.id) === String(e.course_id))?.title }
          }));

          setStudents(enriched);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [navigate, reloadTrigger]);

  const handleInvitationAction = async (inviteId, action) => {
    try {
      if (action === 'accept') {
        const { error } = await supabase
          .from('course_collaborators')
          .update({ status: 'accepted' })
          .eq('id', inviteId);
        if (error) throw error;
        showToast('Undangan diterima! Anda sekarang dapat ikut mengedit course ini.');
      } else {
        const { error } = await supabase
          .from('course_collaborators')
          .delete()
          .eq('id', inviteId);
        if (error) throw error;
        showToast('Undangan berhasil ditolak.');
      }
      setReloadTrigger(prev => prev + 1);
    } catch (err) {
      showToast('Gagal memproses undangan: ' + err.message, 'error');
    }
  };

  const formatPrice = (price) => {
    return `Rp ${price.toLocaleString('id-ID')}`;
  };

  const handleDeleteCourse = async (id) => {
    if (await showConfirm('Apakah Anda yakin ingin menghapus kursus ini? Semua data terkait (syllabus, section) akan ikut terhapus.')) {
      setLoading(true);
      try {
        const { error } = await supabase.from('courses').delete().eq('id', id);
        if (error) throw error;
        setCourses(courses.filter(c => c.id !== id));
        showToast('Kursus berhasil dihapus.');
      } catch (err) {
        showToast('Gagal menghapus kursus: ' + err.message, 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="bg-surface font-sans text-on-surface min-h-screen antialiased flex overflow-x-hidden">
      <TeacherSidebar user={user} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden lg:ml-[280px]">
        {/* Top Header */}
        <header className="flex justify-between items-center px-4 md:px-8 lg:px-12 h-14 md:h-20 w-full bg-surface-container-lowest border-b-2 border-on-surface shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="font-headline-md text-headline-md font-extrabold text-on-surface">Dashboard</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <NotificationDropdown />
              <ProfileDropdown />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pt-8 lg:pt-10 pb-24 lg:pb-8 px-margin-mobile lg:px-margin-desktop w-full max-w-[1440px] mx-auto">
          {/* Welcome Section */}
          <section className="mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-on-surface mb-2 flex items-center gap-3">Selamat Datang, {user?.full_name?.split(' ')[0] || 'Coach'}! <WaveIcon className="w-10 h-10 md:w-12 md:h-12" /></h1>
            <p className="text-lg text-on-surface-variant font-bold">Berikut adalah ringkasan aktivitas kelas Anda hari ini.</p>
          </section>

          {/* Pending Invitations Section */}
          {invitations.length > 0 && (
            <section className="mb-12">
              <div className="bg-tertiary-container text-on-tertiary-container rounded-[32px] p-8 border-4 border-on-surface shadow-[8px_8px_0px_0px_#1c1b1b]">
                <div className="flex items-center gap-3 mb-6">
                  <span className="material-symbols-outlined text-4xl font-black">group_add</span>
                  <h2 className="text-2xl font-black text-on-tertiary-container">Undangan Kolaborasi Baru</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {invitations.map((invite) => (
                    <div key={invite.id} className="bg-white p-6 rounded-[24px] border-4 border-on-surface shadow-[4px_4px_0px_0px_#1c1b1b] flex flex-col justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-black text-on-surface line-clamp-1">{invite.courses?.title}</h3>
                        <p className="text-sm font-bold text-on-surface-variant mt-1">
                          Diundang oleh: <span className="text-primary font-black">{invite.inviterProfile?.full_name}</span> (@{invite.inviterProfile?.username})
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleInvitationAction(invite.id, 'accept')}
                          className="flex-1 py-3 bg-[#FF6B4A] hover:bg-[#ff5533] text-white font-black rounded-xl border-2 border-on-surface shadow-[2px_2px_0px_0px_#000] active:translate-y-0.5 active:shadow-none transition-all text-sm flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm font-black">check</span> Terima
                        </button>
                        <button
                          onClick={() => handleInvitationAction(invite.id, 'reject')}
                          className="flex-1 py-3 bg-white hover:bg-surface-variant/20 text-error font-black rounded-xl border-2 border-on-surface shadow-[2px_2px_0px_0px_#000] active:translate-y-0.5 active:shadow-none transition-all text-sm flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm font-black">close</span> Tolak
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Metrics Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-primary-container p-8 rounded-[32px] border-4 border-on-surface shadow-[8px_8px_0px_0px_#1c1b1b]">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-white rounded-full border-2 border-on-surface flex items-center justify-center">
                <Icon name="school" className="w-8 h-8 text-primary" />
              </div>
              <span className="text-xs font-black px-4 py-1 bg-white border-2 border-on-surface rounded-full uppercase">Live</span>
            </div>
            <div className="text-6xl font-black text-on-primary-container mb-1">{students.length}</div>
            <div className="text-xl text-on-primary-container font-black">Total Siswa</div>
          </div>

          <div className="bg-secondary-container p-8 rounded-[32px] border-4 border-on-surface shadow-[8px_8px_0px_0px_#1c1b1b]">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-white rounded-full border-2 border-on-surface flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-3xl">menu_book</span>
              </div>
              <span className="text-xs font-black px-4 py-1 bg-white border-2 border-on-surface rounded-full uppercase">Katalog</span>
            </div>
            <div className="text-6xl font-black text-on-secondary-container mb-1">{courses.length}</div>
            <div className="text-xl text-on-secondary-container font-black">Total Kursus</div>
          </div>

          <div className="bg-tertiary-container p-8 rounded-[32px] border-4 border-on-surface shadow-[8px_8px_0px_0px_#1c1b1b]">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-white rounded-full border-2 border-on-surface flex items-center justify-center">
                <Icon name="payments" className="w-8 h-8 text-tertiary" />
              </div>
              <span className="text-xs font-black px-4 py-1 bg-white border-2 border-on-surface rounded-full uppercase">Earnings</span>
            </div>
            <div className="text-2xl font-black text-on-tertiary-container mb-1 truncate">{formatPrice(students.reduce((acc, s) => { const course = courses.find(c => String(c.id) === String(s.course_id)); return acc + (course?.price || 0); }, 0))}</div>
            <div className="text-xl text-on-tertiary-container font-black">Pendapatan</div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Kursus Saya */}
          <section className="lg:col-span-2">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-on-surface">Kursus Saya</h2>
              <button
                onClick={() => navigate('/teacher/courses/create')}
                className="hidden md:flex items-center gap-2 px-8 py-3 bg-[#FF6B4A] text-white font-black rounded-full border-2 border-on-surface shadow-[4px_4px_0px_0px_#1c1b1b] hover:translate-y-1 hover:shadow-none transition-all"
              >
                <span className="material-symbols-outlined font-black">add</span>
                Tambah Kursus
              </button>
            </div>

            <div className="flex flex-col gap-6">
              {loading ? (
                <div className="h-40 bg-surface-container animate-pulse border-4 border-on-surface rounded-[32px]"></div>
              ) : courses.length > 0 ? (
                courses.map((course) => (
                  <div key={course.id} className="bg-white p-6 rounded-[32px] border-4 border-on-surface shadow-[6px_6px_0px_0px_#1c1b1b] flex flex-col md:flex-row gap-6 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#1c1b1b] transition-all group">
                    <div className="w-full md:w-48 h-32 bg-primary-container border-2 border-on-surface rounded-2xl overflow-hidden relative flex-shrink-0">
                      <img src={course.image_url || 'https://via.placeholder.com/400x200'} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex-grow flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                          <h3 className="text-2xl font-black text-on-surface line-clamp-1">{course.title}</h3>
                          <div className="flex items-center gap-2">
                            {course.isCollaboration && (
                              <span className="px-3 py-1 bg-tertiary-container border-2 border-on-surface rounded-full text-[10px] font-black uppercase tracking-wider text-on-tertiary-container flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs font-black">group</span> Collab
                              </span>
                            )}
                            <span className="px-3 py-1 bg-surface-variant border-2 border-on-surface rounded-full text-[10px] font-black uppercase tracking-wider">{course.category}</span>
                          </div>
                        </div>
                        {course.status === 'locked' && (
                          <div className="mb-2 p-2 bg-error/5 border border-error/30 rounded-xl flex items-center gap-2 max-w-max">
                            <span className="material-symbols-outlined text-error text-xs">lock</span>
                            <p className="text-[9px] text-error font-black uppercase tracking-wider">Terkunci — Sudah ada student yang enroll</p>
                          </div>
                        )}
                        <p className="text-on-surface-variant font-bold text-sm">
                          {formatPrice(course.price)} •{' '}
                          {ratingsMap[course.id]?.length > 0
                            ? `⭐ ${(ratingsMap[course.id].reduce((a, b) => a + b, 0) / ratingsMap[course.id].length).toFixed(1)} (${ratingsMap[course.id].length} ulasan)`
                            : 'Belum ada rating'}
                        </p>
                      </div>
                      <div className="flex gap-3 mt-4">
                        {course.status !== 'locked' ? (
                          <button 
                            onClick={() => navigate(`/teacher/courses/edit/${course.id}`)}
                            className="px-6 py-2 bg-primary-container text-on-primary-container font-black rounded-xl border-2 border-on-surface shadow-[2px_2px_0px_0px_#1c1b1b] hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                          >
                            Edit
                          </button>
                        ) : (
                          <button 
                            disabled
                            className="px-6 py-2 bg-primary-container text-on-primary-container font-black rounded-xl border-2 border-on-surface opacity-40 cursor-not-allowed flex items-center gap-1.5"
                            title="Course terkunci karena sudah ada student yang enroll"
                          >
                            <span className="material-symbols-outlined text-sm font-black">lock</span> Terkunci
                          </button>
                        )}
                        {!course.isCollaboration && course.status !== 'locked' && (
                          <button 
                            onClick={() => handleDeleteCourse(course.id)}
                            className="px-6 py-2 bg-white text-error font-black rounded-xl border-2 border-on-surface shadow-[2px_2px_0px_0px_#1c1b1b] hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center border-4 border-dashed border-on-surface bg-surface-container-low rounded-[40px]">
                  <p className="text-on-surface-variant mb-6 font-black text-xl">Anda belum memiliki kursus.</p>
                  <button onClick={() => navigate('/teacher/courses/create')} className="bg-primary text-on-primary px-10 py-4 border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] font-black text-lg rounded-2xl active:translate-y-1 active:shadow-none transition-all">Buat Kursus Pertama</button>
                </div>
              )}
            </div>
          </section>

          {/* Aktivitas Terbaru */}
          <section className="lg:col-span-1">
            <h2 className="text-3xl font-black text-on-surface mb-8">Aktivitas</h2>
            <div className="bg-white rounded-[40px] border-4 border-on-surface shadow-[8px_8px_0px_0px_#1c1b1b] p-8">
              <div className="flex flex-col gap-8">
                {students.slice(0, 5).map((s, idx) => (
                  <div key={s.id} className="flex gap-4 items-start">
                    <div className={`w-12 h-12 rounded-full border-2 border-on-surface flex-shrink-0 flex items-center justify-center font-black ${idx % 2 === 0 ? 'bg-secondary-container' : 'bg-tertiary-container'}`}>
                      {s.profile?.full_name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <p className="text-sm text-on-surface leading-snug"><span className="font-black">{s.profile?.full_name}</span> mendaftar di <span className="font-black text-primary">{s.course?.title}</span></p>
                      <p className="text-[10px] font-black text-on-surface-variant uppercase mt-1 tracking-wider">{new Date(s.enrolled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                ))}
                {students.length === 0 && (
                  <p className="text-sm text-on-surface-variant italic text-center py-8 font-bold">Belum ada aktivitas.</p>
                )}
              </div>
              <button onClick={() => navigate('/teacher/activity')} className="w-full mt-10 py-4 border-4 border-on-surface rounded-2xl font-black hover:bg-surface-variant transition-all text-on-surface shadow-[4px_4px_0px_0px_#1c1b1b] active:translate-y-1 active:shadow-none">Lihat Semua Log</button>
            </div>
          </section>
        </div>
      </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
