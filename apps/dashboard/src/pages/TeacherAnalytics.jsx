import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherSidebar from '../components/TeacherSidebar';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabaseClient';

const DATE_RANGE_OPTIONS = [
  { label: 'Last 7 Days',  value: 7 },
  { label: 'Last 30 Days', value: 30 },
  { label: 'Last 90 Days', value: 90 },
  { label: 'All Time',     value: 9999 },
];

const TeacherAnalytics = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [allEnrollments, setAllEnrollments] = useState([]);
  const [allProgress, setAllProgress] = useState([]);
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [stats, setStats] = useState({
    revenue: 0,
    students: 0,
    enrollmentCount: 0,
    completion: 0,
    activeToday: 0,
    newStudentsThisMonth: 0,
    newStudentsLastMonth: 0,
  });
  const [weeklyData, setWeeklyData] = useState([0, 0, 0, 0]);

  // Fetch raw data once
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', session.user.id)
        .single();

      if (profile?.role !== 'teacher') { navigate('/'); return; }
      setUser({ ...session.user, full_name: profile.full_name });

      const { data: courses } = await supabase
        .from('courses')
        .select('id, price, course_syllabus(id)')
        .eq('instructor_id', session.user.id);

      setTeacherCourses(courses || []);
      const courseIds = courses?.map(c => c.id) || [];

      if (courseIds.length > 0) {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('course_id, enrolled_at, user_id')
          .in('course_id', courseIds);

        const { data: progress } = await supabase
          .from('user_progress')
          .select('user_id, course_id, completed_at')
          .in('course_id', courseIds);

        setAllEnrollments(enrollments || []);
        setAllProgress(progress || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [navigate]);

  // Recalculate stats when dateRange or raw data changes
  useEffect(() => {
    if (allEnrollments.length === 0 && !loading) return;

    const cutoff = dateRange === 9999
      ? new Date(0).toISOString()
      : new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000).toISOString();

    const filtered = allEnrollments.filter(e => e.enrolled_at >= cutoff);
    const studentIds = [...new Set(filtered.map(e => e.user_id))];

    // ── Revenue: sum prices of all enrollments in date range ──────────────────
    const totalRevenue = filtered.reduce((acc, curr) => {
      const course = teacherCourses.find(c => String(c.id) === String(curr.course_id));
      return acc + (course?.price || 0);
    }, 0);

    // ── Total Students: ALL unique students ever enrolled (not date-filtered) ──
    const allStudentIds = [...new Set(allEnrollments.map(e => e.user_id))];

    // ── Avg Completion: across ALL enrolled students (all-time) ───────────────
    let totalProgressPercent = 0;
    allStudentIds.forEach(sId => {
      let totalSyl = 0, doneSyl = 0;
      allEnrollments.filter(e => e.user_id === sId).forEach(se => {
        const course = teacherCourses.find(c => String(c.id) === String(se.course_id));
        totalSyl += course?.course_syllabus?.length || 0;
        doneSyl += allProgress.filter(p =>
          String(p.user_id) === String(sId) &&
          String(p.course_id) === String(se.course_id)
        ).length || 0;
      });
      if (totalSyl > 0) totalProgressPercent += (doneSyl / totalSyl) * 100;
    });
    const avgCompletion = allStudentIds.length > 0
      ? Math.round(totalProgressPercent / allStudentIds.length) : 0;

    // ── Active Today ──────────────────────────────────────────────────────────
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const activeTodayIds = new Set(
      allProgress
        .filter(p => p.completed_at && p.completed_at >= oneDayAgo)
        .map(p => p.user_id)
    );
    const activeToday = activeTodayIds.size;

    // ── Student growth: new unique students this period vs previous period ────
    const prevCutoff = dateRange === 9999
      ? new Date(0).toISOString()
      : new Date(Date.now() - dateRange * 2 * 24 * 60 * 60 * 1000).toISOString();
    const prevFiltered = allEnrollments.filter(e => e.enrolled_at >= prevCutoff && e.enrolled_at < cutoff);
    const newThisMonth = [...new Set(filtered.map(e => e.user_id))].length;
    const newLastMonth = [...new Set(prevFiltered.map(e => e.user_id))].length;

    // ── Weekly enrollment bar chart ───────────────────────────────────────────
    const bucketSize = dateRange === 9999 ? 30 : dateRange / 4;
    const weeks = [0, 0, 0, 0];
    allEnrollments.forEach(e => {
      const daysAgo = (Date.now() - new Date(e.enrolled_at)) / (1000 * 60 * 60 * 24);
      if (daysAgo < bucketSize)          weeks[3]++;
      else if (daysAgo < bucketSize * 2) weeks[2]++;
      else if (daysAgo < bucketSize * 3) weeks[1]++;
      else if (daysAgo < bucketSize * 4) weeks[0]++;
    });

    setWeeklyData(weeks);
    setStats({
      revenue:             totalRevenue,
      students:            allStudentIds.length,      // all-time unique students
      enrollmentCount:     allEnrollments.length,     // total enrollment rows (for revenue label)
      completion:          avgCompletion,
      activeToday,
      newStudentsThisMonth: newThisMonth,
      newStudentsLastMonth: newLastMonth,
    });
  }, [dateRange, allEnrollments, allProgress, teacherCourses, loading]);

  const formatRupiah = (n) => `Rp ${n.toLocaleString('id-ID')}`;

  const studentGrowthPct = stats.newStudentsLastMonth > 0
    ? Math.round(((stats.newStudentsThisMonth - stats.newStudentsLastMonth) / stats.newStudentsLastMonth) * 100)
    : stats.newStudentsThisMonth > 0 ? 100 : 0;

  const maxWeekly = Math.max(...weeklyData, 1);

  return (
    <div className="bg-surface text-on-surface font-sans antialiased min-h-screen flex">
      <TeacherSidebar user={user} />

      <main className="flex-1 lg:ml-[280px] pt-20 lg:pt-12 pb-24 lg:pb-8 px-margin-mobile lg:px-margin-desktop max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-on-surface mb-2">Analytics Overview</h1>
            <p className="text-lg text-on-surface-variant">Track your course performance and student engagement.</p>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(p => !p)}
              className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all font-black text-sm"
            >
              <Icon name="calendar_month" className="w-5 h-5 text-on-surface-variant" />
              <span>{DATE_RANGE_OPTIONS.find(o => o.value === dateRange)?.label}</span>
              <span className="material-symbols-outlined text-lg text-on-surface-variant">
                {showDatePicker ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {showDatePicker && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl border-2 border-on-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden z-50">
                {DATE_RANGE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setDateRange(opt.value); setShowDatePicker(false); }}
                    className={`w-full text-left px-5 py-3 text-sm font-bold hover:bg-surface-container transition-colors flex items-center justify-between ${
                      dateRange === opt.value ? 'bg-primary-container text-on-primary-container font-black' : 'text-on-surface'
                    }`}
                  >
                    {opt.label}
                    {dateRange === opt.value && <span className="material-symbols-outlined text-sm">check</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          {/* Revenue */}
          <div className="bg-primary-container text-on-primary-container p-6 rounded-[32px] border-2 border-on-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Icon name="payments" className="w-16 h-16" />
            </div>
            <h3 className="font-bold text-sm opacity-80 mb-2">Total Revenue</h3>
            {loading ? (
              <div className="h-10 bg-black/10 animate-pulse rounded-xl mb-4 w-3/4"></div>
            ) : (
              <div className="text-2xl font-black mb-4 leading-tight">{formatRupiah(stats.revenue)}</div>
            )}
            <div className="flex items-center gap-1 text-xs bg-white/30 w-max px-3 py-1 rounded-full font-bold">
              <Icon name="info" className="w-3 h-3" />
              <span>Berdasarkan {stats.enrollmentCount} enrollment</span>
            </div>
          </div>

          {/* Students */}
          <div className="bg-secondary-container text-on-secondary-container p-6 rounded-[32px] border-2 border-on-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-7xl">groups</span>
            </div>
            <h3 className="font-bold text-sm opacity-80 mb-2">Total Students</h3>
            {loading ? (
              <div className="h-10 bg-black/10 animate-pulse rounded-xl mb-4 w-1/4"></div>
            ) : (
              <div className="text-4xl font-black mb-4">{stats.students}</div>
            )}
            <div className="flex items-center gap-1 text-xs bg-white/30 w-max px-3 py-1 rounded-full font-bold">
              {studentGrowthPct >= 0 ? (
                <><span className="material-symbols-outlined text-sm">trending_up</span>
                <span>+{studentGrowthPct}% bulan ini</span></>
              ) : (
                <><span className="material-symbols-outlined text-sm">trending_down</span>
                <span>{studentGrowthPct}% bulan ini</span></>
              )}
            </div>
          </div>

          {/* Completion */}
          <div className="bg-tertiary-container text-on-tertiary-container p-6 rounded-[32px] border-2 border-on-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-7xl">task_alt</span>
            </div>
            <h3 className="font-bold text-sm opacity-80 mb-2">Avg. Completion</h3>
            {loading ? (
              <div className="h-10 bg-black/10 animate-pulse rounded-xl mb-4 w-1/4"></div>
            ) : (
              <div className="text-4xl font-black mb-4">{stats.completion}%</div>
            )}
            <div className="flex items-center gap-1 text-xs bg-white/30 w-max px-3 py-1 rounded-full font-bold">
              <span className="material-symbols-outlined text-sm">
                {stats.completion >= 50 ? 'trending_up' : stats.completion > 20 ? 'trending_flat' : 'trending_down'}
              </span>
              <span>{stats.completion >= 50 ? 'On Track' : stats.completion > 0 ? 'In Progress' : 'Just Started'}</span>
            </div>
          </div>

          {/* Active Today */}
          <div className="bg-white text-on-surface p-6 rounded-[32px] border-2 border-on-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-bold text-sm text-on-surface-variant mb-2">Active Today</h3>
            {loading ? (
              <div className="h-10 bg-surface-container animate-pulse rounded-xl mb-4 w-1/4"></div>
            ) : (
              <div className="text-4xl font-black mb-4">{stats.activeToday}</div>
            )}
            {/* Mini bar chart - weekly data */}
            <div className="flex items-end h-8 gap-1">
              {weeklyData.map((v, i) => (
                <div
                  key={i}
                  className={`w-full rounded-t transition-all duration-700 ${i === 3 ? 'bg-primary' : 'bg-surface-variant'}`}
                  style={{ height: `${maxWeekly > 0 ? Math.max((v / maxWeekly) * 100, 10) : 10}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Student Growth Bar Chart */}
          <div className="col-span-1 lg:col-span-2 bg-white p-8 rounded-[40px] border-2 border-on-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black">Student Growth</h3>
                <p className="text-xs text-on-surface-variant font-bold mt-1">Jumlah enrollment per minggu</p>
              </div>
            </div>

            {loading ? (
              <div className="flex-1 flex items-end gap-4 min-h-[200px]">
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex-1 bg-surface-container animate-pulse rounded-t-2xl" style={{height: `${i*20+20}%`}}></div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-end gap-6 min-h-[200px] pt-4">
                {weeklyData.map((count, i) => {
                  const height = maxWeekly > 0 ? Math.max((count / maxWeekly) * 100, 5) : 5;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-sm font-black text-on-surface">{count}</span>
                      <div className="w-full relative group">
                        <div
                          className={`w-full rounded-t-2xl border-2 border-on-surface transition-all duration-700 ${i === 3 ? 'bg-primary-container' : 'bg-secondary-container'}`}
                          style={{ height: `${height * 2}px`, minHeight: '8px' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between mt-4 text-on-surface-variant font-bold text-xs px-2">
              <span>3 minggu lalu</span>
              <span>2 minggu lalu</span>
              <span>Minggu lalu</span>
              <span className="text-primary">Minggu ini</span>
            </div>
          </div>

          {/* Completion Rate Donut */}
          <div className="col-span-1 bg-white p-8 rounded-[40px] border-2 border-on-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center">
            <h3 className="text-2xl font-black w-full text-left mb-8">Completion Rate</h3>

            <div
              className="relative w-48 h-48 rounded-full mb-8 border-2 border-on-surface shadow-md"
              style={{ background: `conic-gradient(#665397 ${stats.completion * 3.6}deg, #e5e2e1 0deg)` }}
            >
              <div className="absolute inset-5 bg-white rounded-full flex flex-col items-center justify-center border-2 border-on-surface">
                <span className="text-4xl font-black text-on-surface">{stats.completion}%</span>
                <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Completed</span>
              </div>
            </div>

            <div className="w-full flex flex-col gap-3">
              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border-2 border-on-surface">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-secondary border border-on-surface"></div>
                  <span className="font-bold text-sm">Completed</span>
                </div>
                <span className="font-black">{stats.completion}%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border-2 border-on-surface">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-surface-variant border border-on-surface"></div>
                  <span className="font-bold text-sm">In Progress</span>
                </div>
                <span className="font-black">{100 - stats.completion}%</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherAnalytics;
