import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileDropdown from '../components/ProfileDropdown';
import TeacherSidebar from '../components/TeacherSidebar';
import { supabase } from '../lib/supabaseClient';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

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

      // Fetch Courses
      const { data: teacherCourses } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', session.user.id);

      if (teacherCourses) setCourses(teacherCourses);

      // Fetch Students (Enrollments)
      const courseIds = teacherCourses?.map(c => c.id) || [];
      if (courseIds.length > 0) {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select(`
            id,
            enrolled_at,
            course:course_id (title),
            profile:user_id (full_name, email)
          `)
          .in('course_id', courseIds)
          .order('enrolled_at', { ascending: false });

        if (enrollments) setStudents(enrollments);
      }

      setLoading(false);
    };

    fetchData();
  }, [navigate]);

  const formatPrice = (price) => {
    if (price >= 1000000) return `Rp ${(price / 1000000).toFixed(1)}M`;
    return `Rp ${price.toLocaleString()}`;
  };

  return (
    <div className="bg-surface font-sans text-on-surface min-h-screen antialiased flex">
      <TeacherSidebar user={user} />

      {/* Main Content */}
      <main className="flex-1 lg:ml-[280px] pt-20 lg:pt-10 pb-24 lg:pb-8 px-margin-mobile lg:px-margin-desktop w-full max-w-[1440px] mx-auto min-h-screen">
        {/* Welcome Section */}
        <section className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-on-surface mb-2">Selamat Datang, {user?.full_name?.split(' ')[0] || 'Coach'}! 👋</h1>
          <p className="text-lg text-on-surface-variant font-bold">Berikut adalah ringkasan aktivitas kelas Anda hari ini.</p>
        </section>

        {/* Metrics Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-primary-container p-8 rounded-[32px] border-4 border-on-surface shadow-[8px_8px_0px_0px_#1c1b1b]">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-white rounded-full border-2 border-on-surface flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl">group</span>
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
                <span className="material-symbols-outlined text-tertiary text-3xl">payments</span>
              </div>
              <span className="text-xs font-black px-4 py-1 bg-white border-2 border-on-surface rounded-full uppercase">Earnings</span>
            </div>
            <div className="text-5xl font-black text-on-tertiary-container mb-1 truncate">{formatPrice(courses.reduce((acc, c) => acc + (c.price * 0), 0))}</div>
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
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-2xl font-black text-on-surface line-clamp-1">{course.title}</h3>
                          <span className="px-3 py-1 bg-surface-variant border-2 border-on-surface rounded-full text-[10px] font-black uppercase tracking-wider">{course.category}</span>
                        </div>
                        <p className="text-on-surface-variant font-bold text-sm">Rp {course.price.toLocaleString()} • 4.9 Rating</p>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button className="px-6 py-2 bg-primary-container text-on-primary-container font-black rounded-xl border-2 border-on-surface shadow-[2px_2px_0px_0px_#1c1b1b] hover:translate-y-0.5 hover:shadow-none transition-all">Edit</button>
                        <button className="px-6 py-2 bg-surface text-error font-black rounded-xl border-2 border-on-surface shadow-[2px_2px_0px_0px_#1c1b1b] hover:translate-y-0.5 hover:shadow-none transition-all">Hapus</button>
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
      </main>
    </div>
  );
};

export default TeacherDashboard;
