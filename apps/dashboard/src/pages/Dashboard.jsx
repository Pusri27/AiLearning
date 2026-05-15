import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileDropdown from '../components/ProfileDropdown';
import NotificationDropdown from '../components/NotificationDropdown';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabaseClient';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }
      setUser(session.user);

      // Redirect teachers
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', session.user.id).single();
      if (profile?.role === 'teacher') { navigate('/teacher/dashboard'); return; }

      // Fetch enrolled courses
      const { data: enrollData } = await supabase
        .from('enrollments')
        .select('id, progress, courses(*)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(4);
      if (enrollData) setEnrolledCourses(enrollData.map(e => ({ enrollId: e.id, progress: e.progress || 0, ...e.courses })));

      // Fetch recent blog posts
      const { data: posts } = await supabase
        .from('posts').select('id, title, created_at, category').order('created_at', { ascending: false }).limit(3);
      if (posts) setRecentPosts(posts);

      setLoading(false);
    };
    fetchData();
  }, [navigate]);

  const totalProgress = useMemo(() => {
    if (!enrolledCourses.length) return 0;
    return Math.round(enrolledCourses.reduce((s, c) => s + c.progress, 0) / enrolledCourses.length);
  }, [enrolledCourses]);

  const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

  return (
    <div className="flex h-screen bg-background text-on-surface overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex justify-between items-center px-6 md:px-margin-desktop h-20 w-full bg-surface border-b-2 border-on-surface shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] z-[50] sticky top-0 shrink-0">
          <h2 className="font-headline-md font-extrabold text-on-surface">Dashboard</h2>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-white border-2 border-on-surface px-3 py-2 w-56 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg">
              <Icon name="search" className="w-4 h-4 text-on-surface-variant shrink-0 mr-2" />
              <input className="border-none focus:ring-0 p-0 text-sm w-full bg-transparent" placeholder="Cari kursus..." type="text" />
            </div>
            <NotificationDropdown />
            <ProfileDropdown />
          </div>
        </header>

        <main className="flex-1 p-6 md:p-margin-desktop overflow-y-auto">
          {/* Welcome Banner */}
          <section className="mb-8 relative overflow-hidden bg-primary-container border-2 border-on-surface p-8 md:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-center gap-6 rounded-xl">
            <div className="max-w-xl relative z-10">
              <h2 className="font-headline-xl font-black mb-3 text-on-surface">
                Selamat Datang, {user?.user_metadata?.full_name?.split(' ')[0] || 'Pelajar'}! 👋
              </h2>
              <p className="font-body-lg text-on-surface-variant mb-6">
                {enrolledCourses.length > 0
                  ? `Kamu terdaftar di ${enrolledCourses.length} kursus dengan rata-rata progress ${totalProgress}%. Terus semangat!`
                  : 'Mulai petualangan belajarmu dengan memilih kursus pertamamu sekarang.'}
              </p>
              <button
                onClick={() => navigate(enrolledCourses.length > 0 ? '/courses' : '/catalog')}
                className="px-8 py-3 bg-on-surface text-white font-headline-md border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] transition-all rounded-xl"
              >
                {enrolledCourses.length > 0 ? 'Lanjut Belajar' : 'Mulai Sekarang'}
              </button>
            </div>
            {/* Decorative progress ring */}
            <div className="flex-shrink-0 relative w-40 h-40 hidden md:flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke="currentColor" strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - totalProgress / 100)}`}
                  className="text-primary transition-all duration-1000"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <p className="font-headline-lg font-black text-3xl text-on-surface">{totalProgress}%</p>
                <p className="text-xs font-bold text-on-surface-variant">Avg Progress</p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-10">
            {/* Left: Enrolled Courses */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-headline-lg text-on-surface">Kursus Aktif</h3>
                <button onClick={() => navigate('/courses')} className="text-primary font-label-bold text-sm hover:underline flex items-center gap-1">
                  Lihat Semua <Icon name="arrow_forward" className="w-4 h-4" />
                </button>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1,2].map(n => <div key={n} className="h-56 bg-surface-container border-2 border-on-surface animate-pulse rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />)}
                </div>
              ) : enrolledCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enrolledCourses.map((course) => (
                    <div
                      key={course.enrollId}
                      onClick={() => navigate(`/courses/${course.id}`)}
                      className="bg-surface border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all group cursor-pointer rounded-xl overflow-hidden"
                    >
                      <div className="h-36 overflow-hidden border-b-2 border-on-surface relative">
                        <img
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          src={course.image_url || 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&q=80&w=400'}
                          alt={course.title}
                        />
                        <span className="absolute top-3 left-3 bg-tertiary-container text-on-tertiary-container border-2 border-on-surface font-label-bold text-xs px-2 py-0.5 uppercase">
                          {course.category}
                        </span>
                      </div>
                      <div className="p-5 flex flex-col flex-grow">
                        <h4 className="font-headline-md mb-3 text-on-surface line-clamp-1">{course.title}</h4>
                        <div className="mt-auto">
                          <div className="flex justify-between text-xs font-bold text-on-surface-variant mb-1.5">
                            <span>Progress</span>
                            <span className="text-primary">{course.progress}%</span>
                          </div>
                          <div className="w-full h-3 bg-surface-container border-2 border-on-surface rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${course.progress}%` }} />
                          </div>
                          <p className="text-xs text-on-surface-variant mt-1.5">
                            {course.progress === 0 ? 'Belum dimulai' : course.progress >= 100 ? '✅ Selesai' : 'Sedang berjalan'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 px-6 border-4 border-dashed border-on-surface bg-surface rounded-2xl text-center">
                  <Icon name="school" className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <h4 className="font-headline-md text-xl mb-2">Belum ada kursus aktif</h4>
                  <p className="text-on-surface-variant mb-6">Mulai petualangan belajarmu dari katalog.</p>
                  <button onClick={() => navigate('/catalog')} className="px-6 py-2 bg-primary text-white border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-label-bold rounded-lg">
                    Buka Katalog
                  </button>
                </div>
              )}

              {/* Recent Blog Posts */}
              {recentPosts.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-headline-lg text-on-surface">Artikel Terbaru</h3>
                    <button onClick={() => navigate('/blog')} className="text-primary font-label-bold text-sm hover:underline flex items-center gap-1">
                      Lihat Semua <Icon name="arrow_forward" className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {recentPosts.map(post => (
                      <div
                        key={post.id}
                        onClick={() => navigate(`/blog/${post.id}`)}
                        className="flex items-center gap-4 p-4 border-2 border-on-surface bg-surface hover:bg-primary-container transition-colors cursor-pointer rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      >
                        <div className="w-10 h-10 bg-tertiary-container border-2 border-on-surface flex items-center justify-center rounded-lg shrink-0">
                          <Icon name="article" className="w-5 h-5 text-on-tertiary-container" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-label-bold text-on-surface text-sm line-clamp-1">{post.title}</p>
                          <p className="text-xs text-on-surface-variant">{post.category} · {formatDate(post.created_at)}</p>
                        </div>
                        <Icon name="arrow_forward" className="w-4 h-4 text-on-surface-variant shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar: Quick Stats */}
            <div className="lg:col-span-4 space-y-5">
              {/* Stat Cards */}
              <div className="bg-white border-2 border-on-surface p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl">
                <h3 className="font-headline-md mb-5 text-on-surface">Ringkasan</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Kursus Terdaftar', value: enrolledCourses.length, icon: 'school', color: 'text-primary' },
                    { label: 'Kursus Selesai',   value: enrolledCourses.filter(c => c.progress >= 100).length, icon: 'task_alt',  color: 'text-tertiary' },
                    { label: 'Artikel Dibaca',   value: recentPosts.length,    icon: 'article', color: 'text-secondary' },
                  ].map(stat => (
                    <div key={stat.label} className="flex items-center gap-4 p-3 border-2 border-on-surface bg-surface-container-low rounded-lg">
                      <Icon name={stat.icon} className={`w-8 h-8 ${stat.color} shrink-0`} />
                      <div>
                        <p className="text-xs font-bold text-on-surface-variant">{stat.label}</p>
                        <p className="font-headline-md font-black text-on-surface text-xl">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-tertiary-container border-2 border-on-surface p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl">
                <h3 className="font-headline-md mb-4 text-on-surface">Aksi Cepat</h3>
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'Tulis Artikel',  icon: 'edit',   path: '/write',   bg: 'bg-secondary-fixed'  },
                    { label: 'Study Space',    icon: 'music_note', path: '/study', bg: 'bg-primary-container' },
                    { label: 'Pencapaian',  icon: 'workspace_premium',  path: '/achievements', bg: 'bg-surface' },
                  ].map(action => (
                    <button
                      key={action.label}
                      onClick={() => navigate(action.path)}
                      className={`${action.bg} border-2 border-on-surface p-3 flex items-center gap-3 font-label-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all rounded-lg`}
                    >
                      <Icon name={action.icon} className="w-5 h-5 shrink-0" />
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
