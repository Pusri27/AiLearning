import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileDropdown from '../components/ProfileDropdown';
import TeacherSidebar from '../components/TeacherSidebar';
import { supabase } from '../lib/supabaseClient';

const TeacherAnalytics = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenue: 0,
    students: 0,
    completion: 68,
    activeToday: 342
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

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

      // Fetch Real Stats from Supabase
      const { data: teacherCourses } = await supabase
        .from('courses')
        .select('id, price')
        .eq('instructor_id', session.user.id);

      const courseIds = teacherCourses?.map(c => c.id) || [];
      
      if (courseIds.length > 0) {
        const { count: studentCount } = await supabase
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .in('course_id', courseIds);

        setStats(prev => ({
          ...prev,
          students: studentCount || 0,
          revenue: (studentCount || 0) * (teacherCourses[0]?.price || 0) * 0.7 // Mock revenue based on enrollments
        }));
      }

      setLoading(false);
    };

    fetchData();
  }, [navigate]);

  return (
    <div className="bg-surface text-on-surface font-sans antialiased min-h-screen flex">
      <TeacherSidebar user={user} onOpenModal={() => navigate('/teacher/courses')} />

      {/* Main Content */}
      <main className="flex-1 lg:ml-[280px] pt-20 lg:pt-12 pb-24 lg:pb-8 px-margin-mobile lg:px-margin-desktop max-w-[1440px] mx-auto">
        {/* Page Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-on-background mb-2">Analytics Overview</h2>
            <p className="text-lg text-on-surface-variant">Track your course performance and student engagement.</p>
          </div>
          <div className="flex items-center gap-2 bg-surface-container-lowest px-4 py-2 rounded-lg border border-outline-variant shadow-sm">
            <span className="material-symbols-outlined text-on-surface-variant">calendar_month</span>
            <span className="font-bold text-sm text-on-surface-variant">Last 30 Days</span>
            <span className="material-symbols-outlined text-on-surface-variant">arrow_drop_down</span>
          </div>
        </div>

        {/* Bento Grid: Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Revenue Card */}
          <div className="bg-primary-container text-on-primary-container p-6 rounded-[32px] shadow-sm relative overflow-hidden group border-2 border-on-surface">
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
              <span className="material-symbols-outlined text-7xl">payments</span>
            </div>
            <h3 className="font-bold text-sm opacity-80 mb-2">Total Revenue</h3>
            <div className="text-4xl font-black mb-4">Rp {stats.revenue.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs bg-white/30 w-max px-3 py-1 rounded-full font-bold">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span>+14.5% vs last month</span>
            </div>
          </div>

          {/* Students Card */}
          <div className="bg-secondary-container text-on-secondary-container p-6 rounded-[32px] shadow-sm relative overflow-hidden group border-2 border-on-surface">
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
              <span className="material-symbols-outlined text-7xl">groups</span>
            </div>
            <h3 className="font-bold text-sm opacity-80 mb-2">Total Students</h3>
            <div className="text-4xl font-black mb-4">{stats.students}</div>
            <div className="flex items-center gap-1 text-xs bg-white/30 w-max px-3 py-1 rounded-full font-bold">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span>+8.2% vs last month</span>
            </div>
          </div>

          {/* Completion Card */}
          <div className="bg-tertiary-container text-on-tertiary-container p-6 rounded-[32px] shadow-sm relative overflow-hidden group border-2 border-on-surface">
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
              <span className="material-symbols-outlined text-7xl">task_alt</span>
            </div>
            <h3 className="font-bold text-sm opacity-80 mb-2">Avg. Completion</h3>
            <div className="text-4xl font-black mb-4">{stats.completion}%</div>
            <div className="flex items-center gap-1 text-xs bg-white/30 w-max px-3 py-1 rounded-full font-bold">
              <span className="material-symbols-outlined text-sm">trending_flat</span>
              <span>Stable</span>
            </div>
          </div>

          {/* Active Learners */}
          <div className="bg-surface-container-lowest text-on-surface p-6 rounded-[32px] border-2 border-on-surface shadow-sm relative overflow-hidden">
            <h3 className="font-bold text-sm text-on-surface-variant mb-2">Active Today</h3>
            <div className="text-4xl font-black mb-4">{stats.activeToday}</div>
            <div className="flex items-end h-8 gap-1 mt-auto">
              {[30, 50, 40, 70, 60, 80, 100].map((h, i) => (
                <div key={i} className={`w-full rounded-t-sm transition-all duration-500 ${i === 6 ? 'bg-primary' : 'bg-surface-variant'}`} style={{ height: `${h}%` }}>
                  {i === 6 && <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Student Growth */}
          <div className="col-span-1 lg:col-span-2 bg-surface-container-lowest p-8 rounded-[40px] border-2 border-on-surface shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black">Student Growth</h3>
              <button className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-all">
                <span className="material-symbols-outlined">more_vert</span>
              </button>
            </div>
            
            <div className="flex-1 relative min-h-[300px] w-full flex items-end">
              {/* Y Axis Grid */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                {[1, 2, 3, 4].map(i => <div key={i} className="w-full border-b-2 border-on-surface"></div>)}
              </div>
              
              {/* SVG Line Chart */}
              <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="lineGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffd66b" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#ffd66b" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,80 Q10,70 20,75 T40,50 T60,60 T80,30 T100,20 L100,100 L0,100 Z" fill="url(#lineGrad)" />
                <path d="M0,80 Q10,70 20,75 T40,50 T60,60 T80,30 T100,20" fill="none" stroke="#765b00" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                <circle cx="40" cy="50" fill="#ffffff" r="3" stroke="#765b00" strokeWidth="2" />
                <circle cx="80" cy="30" fill="#ffffff" r="3" stroke="#765b00" strokeWidth="2" />
              </svg>
            </div>

            <div className="flex justify-between mt-6 text-on-surface-variant font-bold text-xs px-2">
              <span>Week 1</span>
              <span>Week 2</span>
              <span>Week 3</span>
              <span>Week 4</span>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="col-span-1 bg-surface-container-lowest p-8 rounded-[40px] border-2 border-on-surface shadow-sm flex flex-col items-center justify-center text-center">
            <h3 className="text-2xl font-black w-full text-left mb-8">Completion Rate</h3>
            
            <div className="relative w-56 h-56 rounded-full mb-8 shadow-inner border-2 border-on-surface overflow-hidden" style={{ background: `conic-gradient(#665397 ${stats.completion}%, #e5e2e1 0)` }}>
              <div className="absolute inset-6 bg-surface-container-lowest rounded-full flex flex-col items-center justify-center shadow-lg border-2 border-on-surface">
                <span className="text-5xl font-black text-on-surface">{stats.completion}%</span>
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Completed</span>
              </div>
            </div>

            <div className="w-full flex flex-col gap-3">
              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border-2 border-on-surface">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-secondary"></div>
                  <span className="font-bold text-sm">Completed</span>
                </div>
                <span className="font-black">68%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border-2 border-on-surface">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-surface-variant"></div>
                  <span className="font-bold text-sm">In Progress</span>
                </div>
                <span className="font-black">32%</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherAnalytics;
