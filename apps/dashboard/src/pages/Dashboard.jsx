import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileDropdown from '../components/ProfileDropdown';
import NotificationDropdown from '../components/NotificationDropdown';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabaseClient';
import { showToast } from '../lib/toast';
import { useUserProfile } from '../context/UserProfileContext';
import { getTranslation } from '../lib/i18n';
import { HaiIcon, CheckIcon } from '../components/Icons';

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

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const t = (key) => getTranslation(profile.language || 'id', key);
  const isGuest = profile.isGuest;
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Rating modal states
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingCourse, setRatingCourse] = useState(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: { session: currentSession } } = await supabase.auth.getSession();

      // Redirect teachers to their own dashboard
      if (profile.role === 'teacher') {
        navigate('/teacher/dashboard');
        return;
      }

      // Fetch enrolled courses (only if logged in)
      if (currentSession) {
        const { data: enrollData, error: enrollError } = await supabase
          .from('enrollments')
          .select(`
            id, 
            course_id,
            courses (
              id,
              title,
              image_url,
              category,
              status,
              course_syllabus (id)
            )
          `)
          .eq('user_id', currentSession.user.id);

        if (enrollError) {
          console.error("Enrollment Fetch Error:", enrollError);
          showToast(`Error Database: ${enrollError.message}`, 'error');
        }

        if (enrollData) {
          // Fetch user progress for all courses at once
          const { data: userProgress } = await supabase
            .from('user_progress')
            .select('course_id, syllabus_id')
            .eq('user_id', currentSession.user.id);

          // Fetch user ratings
          const { data: userRatings } = await supabase
            .from('course_ratings')
            .select('course_id, rating, feedback')
            .eq('user_id', currentSession.user.id);

          const mapped = enrollData
            .map(e => {
              const course = Array.isArray(e.courses) ? e.courses[0] : e.courses;
              if (!course || course.status === 'draft') return null;

              const totalSyllabus = course.course_syllabus?.length || 0;
              const completedInCourse = userProgress?.filter(p => p.course_id === course.id).length || 0;
              const progressPercent = totalSyllabus > 0 
                ? Math.round((completedInCourse / totalSyllabus) * 100) 
                : 0;

              const userRating = userRatings?.find(r => r.course_id === course.id) || null;

              return { 
                enrollId: e.id, 
                progress: progressPercent, 
                userRating,
                ...course 
              };
            })
            .filter(Boolean);
          
          setEnrolledCourses(mapped.slice(0, 4));
        }
      }

      // Fetch recent blog posts
      const { data: posts } = await supabase
        .from('posts')
        .select('id, title, created_at, category')
        .order('created_at', { ascending: false })
        .limit(3);
      if (posts) setRecentPosts(posts);

      setLoading(false);
    };
    fetchData();
  }, [navigate, isGuest, profile.role]);

  const handleOpenRating = (course) => {
    setRatingCourse(course);
    setRatingValue(0);
    setFeedbackText('');
    setShowRatingModal(true);
  };

  const handleSubmitRating = async () => {
    if (ratingValue === 0 || !ratingCourse) { showToast('Pilih bintang terlebih dahulu.', 'error'); return; }
    setSubmittingRating(true);
    try {
      const { error } = await supabase.from('course_ratings').upsert({
        course_id: Number(ratingCourse.id),
        user_id: profile.id,
        rating: ratingValue,
        feedback: feedbackText.trim() || null,
      }, { onConflict: 'course_id,user_id' });
      if (error) throw error;
      
      // Update state
      setEnrolledCourses(prev => prev.map(c => c.id === ratingCourse.id ? {
        ...c,
        userRating: { rating: ratingValue, feedback: feedbackText }
      } : c));

      setShowRatingModal(false);
      setRatingCourse(null);
      showToast('Terima kasih atas ulasan kamu! 🌟', 'success');
    } catch (err) {
      showToast('Gagal menyimpan ulasan.', 'error');
    } finally {
      setSubmittingRating(false);
    }
  };

  const totalProgress = useMemo(() => {
    if (!enrolledCourses.length) return 0;
    return Math.round(enrolledCourses.reduce((s, c) => s + c.progress, 0) / enrolledCourses.length);
  }, [enrolledCourses]);

  const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

  const lang = profile.language || 'id';

  const welcomeTitle = {
    id: `Selamat Datang, ${profile.fullName?.split(' ')[0] || 'Pelajar'}!`,
    en: `Welcome, ${profile.fullName?.split(' ')[0] || 'Learner'}!`,
    ja: `ようこそ、${profile.fullName?.split(' ')[0] || '受講生'}さん！`,
    zh: `欢迎您，${profile.fullName?.split(' ')[0] || '学员'}！`
  }[lang] || `Selamat Datang, ${profile.fullName?.split(' ')[0] || 'Pelajar'}!`;

  const welcomeSub = enrolledCourses.length > 0 
    ? {
        id: `Kamu terdaftar di ${enrolledCourses.length} kursus dengan rata-rata progress ${totalProgress}%. Terus semangat!`,
        en: `You are enrolled in ${enrolledCourses.length} courses with an average progress of ${totalProgress}%. Keep it up!`,
        ja: `現在、${enrolledCourses.length}個のコースに登録されており、平均進捗率は${totalProgress}%です。その調子で頑張りましょう！`,
        zh: `您已注册 ${enrolledCourses.length} 门课程，平均进度为 ${totalProgress}%。继续加油！`
      }[lang]
    : {
        id: 'Mulai petualangan belajarmu dengan memilih kursus pertamamu sekarang.',
        en: 'Start your learning journey by choosing your first course now.',
        ja: '最初のコースを選択して、今すぐ学習の旅を始めましょう。',
        zh: '现在就选择您的第一门课程，开启您的学习之旅吧。'
      }[lang];

  const btnText = enrolledCourses.length > 0
    ? { id: 'Lanjut Belajar', en: 'Continue Learning', ja: '学習を続ける', zh: '继续学习' }[lang]
    : { id: 'Mulai Sekarang', en: 'Get Started', ja: '今すぐ始める', zh: '立即开始' }[lang];

  const activeCoursesLabel = { id: 'Kursus Aktif', en: 'Active Courses', ja: '進行中のコース', zh: '进行中的课程' }[lang];
  const seeAllLabel = { id: 'Lihat Semua', en: 'See All', ja: 'すべて見る', zh: '查看全部' }[lang];

  const emptyActiveTitle = { id: 'Belum ada kursus aktif', en: 'No active courses yet', ja: 'アクティブなコースはありません', zh: '暂无进行中的课程' }[lang];
  const emptyActiveDesc = { id: 'Mulai petualangan belajarmu dari katalog.', en: 'Start your learning journey from the catalog.', ja: 'カタログから学習を始めましょう。', zh: '从课程目录开启您的学习之旅。' }[lang];
  const openCatalogLabel = { id: 'Buka Katalog', en: 'Open Catalog', ja: 'カタログを開く', zh: '浏览目录' }[lang];

  const recentArticlesLabel = { id: 'Artikel Terbaru', en: 'Recent Articles', ja: '最新記事', zh: '最新文章' }[lang];
  const summaryLabel = { id: 'Ringkasan', en: 'Summary', ja: '概要', zh: '数据统计' }[lang];

  const statLabels = {
    enrolled: { id: 'Kursus Terdaftar', en: 'Enrolled Courses', ja: '登録コース', zh: '已注册课程' }[lang],
    completed: { id: 'Kursus Selesai', en: 'Completed Courses', ja: '修了コース', zh: '已完成课程' }[lang],
    articles: { id: 'Artikel Dibaca', en: 'Articles Read', ja: '読んだ記事', zh: '已读文章' }[lang]
  };

  const quickActionsLabel = { id: 'Aksi Cepat', en: 'Quick Actions', ja: 'クイックアクション', zh: '快捷操作' }[lang];
  const quickActions = [
    { label: { id: 'Tulis Artikel', en: 'Write Article', ja: '記事を書く', zh: '撰写文章' }[lang],  icon: 'edit',   path: '/write',   bg: 'bg-secondary-fixed'  },
    { label: { id: 'Study Space',    en: 'Study Space',    ja: '学習スペース', zh: '学习空间' }[lang],    icon: 'music_note', path: '/study', bg: 'bg-primary-container' },
    { label: { id: 'Pencapaian',  en: 'Achievements',  ja: '実績', zh: '学习成就' }[lang],  icon: 'workspace_premium',  path: '/achievements', bg: 'bg-surface' },
  ];

  const courseProgressLabels = {
    notStarted: { id: 'Belum dimulai', en: 'Not started', ja: '未着手', zh: '未开始' }[lang],
    completed: { id: 'Selesai', en: 'Completed', ja: '完了', zh: '已完成' }[lang],
    inProgress: { id: 'Sedang berjalan', en: 'In progress', ja: '進行中', zh: '进行中' }[lang]
  };

  return (
    <div className="flex h-screen bg-background text-on-surface overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex justify-between items-center px-4 md:px-margin-desktop h-16 md:h-20 w-full bg-surface border-b-2 border-on-surface shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] z-[50] sticky top-0 shrink-0">
          <h2 className="font-headline-md font-extrabold text-on-surface">{t('dashboard')}</h2>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="hidden md:flex items-center bg-white border-2 border-on-surface px-3 py-2 w-56 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg">
              <Icon name="search" className="w-4 h-4 text-on-surface-variant shrink-0 mr-2" />
              <input className="border-none focus:ring-0 p-0 text-sm w-full bg-transparent" placeholder={t('searchCourses')} type="text" />
            </div>
            <NotificationDropdown />
            <ProfileDropdown />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-margin-desktop overflow-y-auto pb-24 md:pb-6">
          {/* Welcome Banner */}
          <section className="mb-8 relative overflow-hidden bg-primary-container border-2 border-on-surface p-8 md:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-center gap-6 rounded-xl">
            <div className="max-w-xl relative z-10">
              <h2 className="font-headline-xl font-black mb-3 text-on-surface">
                {welcomeTitle} <HaiIcon className="inline-block w-8 h-8 md:w-10 md:h-10 ml-2 text-on-surface hover:scale-110 transition-transform cursor-pointer" />
              </h2>
              <p className="font-body-lg text-on-surface-variant mb-6">
                {welcomeSub}
              </p>
              <button
                onClick={() => navigate(enrolledCourses.length > 0 ? '/courses' : '/catalog')}
                className="px-8 py-3 bg-on-surface text-white font-headline-md border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] transition-all rounded-xl"
              >
                {btnText}
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
                <h3 className="font-headline-lg text-on-surface">{activeCoursesLabel}</h3>
                <button onClick={() => navigate('/courses')} className="text-primary font-label-bold text-sm hover:underline flex items-center gap-1">
                  {seeAllLabel} <Icon name="arrow_forward" className="w-4 h-4" />
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
                          {course.progress >= 100 && (
                            <div className="mb-3">
                              {course.userRating ? (
                                <div className="text-xs font-black text-amber-500 flex items-center gap-1">
                                  <span>⭐ Rating Kamu: {course.userRating.rating}/5</span>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenRating(course);
                                  }}
                                  className="w-full py-1.5 bg-[#FFB800] text-on-surface text-xs font-black rounded-lg border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 transition-all flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  ⭐ Beri Rating Kursus
                                </button>
                              )}
                            </div>
                          )}
                          <div className="flex justify-between text-xs font-bold text-on-surface-variant mb-1.5">
                            <span>Progress</span>
                            <span className="text-primary">{course.progress}%</span>
                          </div>
                          <div className="w-full h-3 bg-surface-container border-2 border-on-surface rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${course.progress}%` }} />
                          </div>
                          <p className="text-xs text-on-surface-variant mt-1.5">
                            {course.progress === 0 ? courseProgressLabels.notStarted : course.progress >= 100 ? <span className="flex items-center gap-1"><CheckIcon className="w-4 h-4 text-green-600" /> {courseProgressLabels.completed}</span> : courseProgressLabels.inProgress}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 px-6 border-4 border-dashed border-on-surface bg-surface rounded-2xl text-center">
                  <Icon name="school" className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <h4 className="font-headline-md text-xl mb-2">{emptyActiveTitle}</h4>
                  <p className="text-on-surface-variant mb-6">{emptyActiveDesc}</p>
                  <button onClick={() => navigate('/catalog')} className="px-6 py-2 bg-primary text-white border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-label-bold rounded-lg">
                    {openCatalogLabel}
                  </button>
                </div>
              )}

              {/* Recent Blog Posts */}
              {recentPosts.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-headline-lg text-on-surface">{recentArticlesLabel}</h3>
                    <button onClick={() => navigate('/blog')} className="text-primary font-label-bold text-sm hover:underline flex items-center gap-1">
                      {seeAllLabel} <Icon name="arrow_forward" className="w-4 h-4" />
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
                <h3 className="font-headline-md mb-5 text-on-surface">{summaryLabel}</h3>
                <div className="space-y-4">
                  {[
                    { label: statLabels.enrolled, value: enrolledCourses.length, icon: 'school', color: 'text-primary' },
                    { label: statLabels.completed,   value: enrolledCourses.filter(c => c.progress >= 100).length, icon: 'task_alt',  color: 'text-tertiary' },
                    { label: statLabels.articles,   value: recentPosts.length,    icon: 'article', color: 'text-secondary' },
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
                <h3 className="font-headline-md mb-4 text-on-surface">{quickActionsLabel}</h3>
                <div className="flex flex-col gap-3">
                  {quickActions.map(action => (
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
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] border-4 border-on-surface shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-10 max-w-lg w-full animate-in zoom-in-95 duration-300">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎓</div>
              <h2 className="text-3xl font-black text-on-surface mb-2">Kursus Selesai!</h2>
              <p className="text-on-surface-variant font-bold">Bagaimana pengalaman belajar kamu di kursus <span className="text-primary font-black">"{ratingCourse?.title}"</span>?</p>
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
              rows={4} placeholder="Tulis ulasan kamu (opsional)..." value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowRatingModal(false); setRatingCourse(null); }} className="flex-1 py-4 rounded-2xl border-2 border-on-surface font-black hover:bg-surface-container transition-all">Nanti Saja</button>
              <button onClick={handleSubmitRating} disabled={submittingRating || ratingValue === 0} className="flex-1 py-4 rounded-2xl bg-primary text-on-primary border-2 border-on-surface font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 transition-all disabled:opacity-50">
                {submittingRating ? 'Mengirim...' : 'Kirim Ulasan ⭐'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Dashboard;
