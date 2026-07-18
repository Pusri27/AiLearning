import React, { useEffect, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TeacherSidebar from '../components/TeacherSidebar';
import ProfileDropdown from '../components/ProfileDropdown';
import NotificationDropdown from '../components/NotificationDropdown';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabaseClient';
import { useUserProfile } from '../context/UserProfileContext';
import { checkAchievements } from '../lib/achievementService';

const Profile = () => {
  const navigate = useNavigate();
  const { profile } = useUserProfile();

  const [stats, setStats] = useState({
    enrolledCount:    0,
    completedCount:   0,
    postsCount:       0,
  });
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [recentPosts, setRecentPosts]         = useState([]);
  const [achievements, setAchievements]       = useState([]);
  const [loading, setLoading]                 = useState(true);

  const initials = profile.fullName
    ? profile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }

      // Cek lencana baru
      await checkAchievements(session.user.id);

      const uid = session.user.id;

      // Parallel fetches
      const [enrollRes, postsRes, achRes] = await Promise.all([
        supabase
          .from('enrollments')
          .select('id, progress, course_id, courses(title, image_url, category)')
          .eq('user_id', uid)
          .order('enrolled_at', { ascending: false }),
        supabase
          .from('posts')
          .select('id, title, category, created_at')
          .eq('author_id', uid)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('user_achievements')
          .select('achievement_id, achievements(*)')
          .eq('user_id', uid)
      ]);

      const enrollments = enrollRes.data || [];
      const posts       = postsRes.data  || [];
      let userAchs      = achRes.data?.map(a => a.achievements) || [];

      // Logic: Auto-award Pioneer badge if empty
      if (userAchs.length === 0) {
        const { data: pioneerAch } = await supabase.from('achievements').select('*').eq('id', 'pioneer').single();
        if (pioneerAch) {
          await supabase.from('user_achievements').insert({ user_id: uid, achievement_id: 'pioneer' });
          userAchs = [pioneerAch];
        }
      }

      setEnrolledCourses(enrollments);
      setRecentPosts(posts);
      setAchievements(userAchs);
      setStats({
        enrolledCount:  enrollments.length,
        completedCount: enrollments.filter(e => e.progress >= 100).length,
        postsCount:     posts.length,
      });
      setLoading(false);
    };
    fetchData();
  }, [navigate]);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="flex h-screen overflow-hidden bg-background font-body-md text-on-background">
      {profile.role === 'teacher' ? <TeacherSidebar user={profile} /> : <Sidebar />}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="flex justify-between items-center px-margin-mobile md:px-margin-desktop h-20 w-full bg-surface-container-lowest border-b-2 border-on-surface shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] sticky top-0 z-10">
          <h1 className="font-headline-md text-headline-md font-extrabold text-on-surface">Profil Saya</h1>
          <div className="flex items-center gap-4">
            <NotificationDropdown />
            <ProfileDropdown />
          </div>
        </header>

        <main className="p-margin-mobile md:p-margin-desktop space-y-gutter max-w-container-max mx-auto w-full pb-16">

          {/* ── Hero Card ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            <div className="lg:col-span-8 bg-surface-container-lowest border-2 border-on-surface p-gutter shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row gap-8 items-center md:items-start">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-32 h-32 md:w-40 md:h-40 border-[6px] border-on-surface shadow-[4px_4px_0px_0px_rgba(103,77,174,1)] bg-primary-container flex items-center justify-center overflow-hidden">
                  {profile.avatarUrl ? (
                    <img 
                      alt="User" 
                      className="w-full h-full object-cover" 
                      src={profile.avatarUrl} 
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span className={`${profile.avatarUrl ? 'hidden' : 'flex'} text-5xl font-black text-on-primary-container`}>
                    {initials}
                  </span>
                </div>
                <div
                  onClick={() => navigate('/settings')}
                  className="absolute -bottom-2 -right-2 bg-primary-container border-2 border-on-surface p-2 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:scale-110 transition-transform"
                  title="Ubah foto di Settings"
                >
                  <Icon name="edit" className="w-5 h-5 text-on-primary-container" />
                </div>
              </div>

              {/* Info */}
              <div className="text-center md:text-left space-y-3 flex-1 min-w-0">
                <div>
                  <h2 className="font-headline-xl text-headline-xl text-on-surface break-words">
                    {profile.fullName || 'Nama Belum Diisi'}
                  </h2>
                  {profile.username && (
                    <p className="text-sm font-bold text-on-surface-variant">@{profile.username}</p>
                  )}
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1">{profile.email}</p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 border-2 border-on-surface bg-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs font-black uppercase">
                  <Icon name={profile.role === 'teacher' ? 'school' : 'auto_stories'} className="w-4 h-4" />
                  {profile.role === 'teacher' ? 'Pengajar' : 'Pelajar Aktif'}
                </div>
                <p className="text-sm text-on-surface-variant">
                  Akun terdaftar di Harin Learning.{' '}
                  <button onClick={() => navigate('/settings')} className="underline font-bold hover:text-primary transition-colors">
                    Lengkapi profil →
                  </button>
                </p>
              </div>
            </div>

            {/* Stat cards */}
            <div className="lg:col-span-4 grid grid-cols-1 gap-gutter">
              <div className="bg-primary-container border-2 border-on-surface p-gutter shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center items-center text-center">
                <Icon name="auto_stories" className="w-10 h-10 mb-2" />
                {loading ? <div className="w-12 h-8 bg-on-surface/10 animate-pulse rounded" /> : (
                  <p className="font-headline-lg text-headline-lg">{stats.enrolledCount}</p>
                )}
                <p className="font-label-bold text-label-bold uppercase">Kursus Diambil</p>
              </div>
              <div className="bg-secondary-container border-2 border-on-surface p-gutter shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center items-center text-center">
                <Icon name="article" className="w-10 h-10 mb-2" />
                {loading ? <div className="w-12 h-8 bg-on-surface/10 animate-pulse rounded" /> : (
                  <p className="font-headline-lg text-headline-lg">{stats.postsCount}</p>
                )}
                <p className="font-label-bold text-label-bold uppercase">Post Ditulis</p>
              </div>
            </div>
          </div>

          {/* ── Stat chips ────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {[
              { icon: 'workspace_premium', color: 'bg-tertiary-container', label: 'Kursus Selesai', value: stats.completedCount },
              { icon: 'auto_stories',      color: 'bg-primary-fixed',      label: 'Kursus Aktif',   value: stats.enrolledCount - stats.completedCount },
              { icon: 'edit_note',         color: 'bg-secondary-fixed',    label: 'Blog Ditulis',   value: stats.postsCount },
            ].map((item, i) => (
              <div key={i} className="bg-surface-container-lowest border-2 border-on-surface p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4">
                <div className={`${item.color} border-2 border-on-surface p-3 rounded-lg`}>
                  <Icon name={item.icon} className="w-6 h-6 text-on-surface" />
                </div>
                <div>
                  <p className="font-label-bold text-label-bold text-on-surface-variant uppercase">{item.label}</p>
                  {loading
                    ? <div className="w-10 h-6 bg-on-surface/10 animate-pulse rounded mt-1" />
                    : <p className="font-headline-md text-headline-md">{item.value}</p>
                  }
                </div>
              </div>
            ))}
          </div>

          {/* ── My Courses + Recent Posts ─────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter pb-10">

            {/* Enrolled Courses */}
            <div className="bg-surface-container-lowest border-2 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">
              <div className="p-6 border-b-2 border-on-surface flex justify-between items-center bg-surface-container-low">
                <h2 className="font-headline-md text-headline-md">Kursus Saya</h2>
                <button onClick={() => navigate('/courses')} className="text-xs font-black text-primary hover:underline">
                  Lihat Semua →
                </button>
              </div>
              {loading ? (
                <div className="p-6 space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-on-surface/5 animate-pulse rounded" />)}
                </div>
              ) : enrolledCourses.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-10 text-center gap-3">
                  <Icon name="school" className="w-12 h-12 text-on-surface-variant opacity-30" />
                  <p className="font-bold text-on-surface-variant">Kamu belum mengambil kursus.</p>
                  <button onClick={() => navigate('/catalog')} className="px-4 py-2 bg-primary text-on-primary border-2 border-on-surface font-label-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                    Jelajahi Katalog
                  </button>
                </div>
              ) : (
                <div className="flex-1 divide-y-2 divide-on-surface/20">
                  {enrolledCourses.slice(0, 5).map((e, idx) => (
                    <div key={idx} className="p-4 flex items-center gap-4 hover:bg-surface-container transition-colors">
                      <div className="w-12 h-12 shrink-0 border-2 border-on-surface bg-primary-container overflow-hidden">
                        {e.courses?.image_url
                          ? <img src={e.courses.image_url} alt={e.courses.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full bg-primary-container flex items-center justify-center"><Icon name="school" className="w-6 h-6 text-on-primary-container" /></div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-label-bold text-sm line-clamp-1">{e.courses?.title}</p>
                        <p className="text-xs text-on-surface-variant">{e.courses?.category}</p>
                        {/* Progress bar */}
                        <div className="mt-1.5 h-1.5 bg-surface-container border border-on-surface/20 rounded-full overflow-hidden">
                          <div className="h-full bg-primary transition-all" style={{ width: `${e.progress || 0}%` }} />
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-black text-on-surface-variant">{e.progress || 0}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Blog Posts */}
            <div className="bg-surface-container-lowest border-2 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">
              <div className="p-6 border-b-2 border-on-surface flex justify-between items-center bg-surface-container-low">
                <h2 className="font-headline-md text-headline-md">Blog yang Saya Buat</h2>
                <button onClick={() => navigate('/write')} className="text-xs font-black text-primary hover:underline">
                  Tulis Post →
                </button>
              </div>
              {loading ? (
                <div className="p-6 space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-14 bg-on-surface/5 animate-pulse rounded" />)}
                </div>
              ) : recentPosts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-10 text-center gap-3">
                  <Icon name="edit_note" className="w-12 h-12 text-on-surface-variant opacity-30" />
                  <p className="font-bold text-on-surface-variant">Kamu belum menulis post.</p>
                  <button onClick={() => navigate('/write')} className="px-4 py-2 bg-secondary text-on-secondary border-2 border-on-surface font-label-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                    Tulis Sekarang
                  </button>
                </div>
              ) : (
                <div className="flex-1 divide-y-2 divide-on-surface/20">
                  {recentPosts.map((post, idx) => (
                    <button
                      key={idx}
                      onClick={() => navigate(`/blog/${post.id}`)}
                      className="w-full p-4 flex items-start gap-4 hover:bg-surface-container transition-colors text-left"
                    >
                      <div className="mt-1 w-8 h-8 shrink-0 bg-primary-container border-2 border-on-surface flex items-center justify-center">
                        <Icon name="article" className="w-4 h-4 text-on-primary-container" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-label-bold text-sm line-clamp-2">{post.title}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {post.category && <span className="font-bold mr-2">{post.category}</span>}
                          {formatDate(post.created_at)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default Profile;
