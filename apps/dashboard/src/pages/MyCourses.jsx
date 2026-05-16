import React, { useEffect, useState, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileDropdown from '../components/ProfileDropdown';
import NotificationDropdown from '../components/NotificationDropdown';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabaseClient';

import { useUserProfile } from '../context/UserProfileContext';

const MyCourses = () => {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const isGuest = profile.isGuest;
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0 });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session && !isGuest) {
        navigate('/login');
        return;
      }

      if (session) {
        const { data, error } = await supabase
          .from('enrollments')
          .select('id, progress, courses(*)')
          .eq('user_id', session.user.id);

        if (!error && data) {
          const mapped = data.map(e => ({
            enrollmentId: e.id,
            progress: e.progress || 0,
            ...e.courses,
          }));
          setCourses(mapped);
          setStats({
            total: mapped.length,
            completed: mapped.filter(c => c.progress >= 100).length,
            inProgress: mapped.filter(c => c.progress > 0 && c.progress < 100).length,
          });
        }
      } else {
        // Guest mode: no courses
        setCourses([]);
        setStats({ total: 0, completed: 0, inProgress: 0 });
      }
      setLoading(false);
    };
    fetchData();
  }, [navigate, isGuest]);

  const filtered = useMemo(() => {
    let result = [...courses];
    if (filter === 'inprogress') result = result.filter(c => c.progress > 0 && c.progress < 100);
    if (filter === 'completed')  result = result.filter(c => c.progress >= 100);
    if (filter === 'notstarted') result = result.filter(c => c.progress === 0);
    if (search.trim()) result = result.filter(c => c.title?.toLowerCase().includes(search.toLowerCase()));
    return result;
  }, [courses, filter, search]);

  const formatPrice = (p) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);

  const FILTER_TABS = [
    { key: 'all',        label: 'Semua Kursus' },
    { key: 'inprogress', label: 'Sedang Berjalan' },
    { key: 'completed',  label: 'Selesai' },
    { key: 'notstarted', label: 'Belum Mulai' },
  ];

  return (
    <div className="bg-background text-on-surface font-body-md flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-col flex-grow overflow-hidden">
        {/* TopAppBar */}
        <header className="bg-surface flex justify-between items-center w-full px-6 md:px-margin-desktop h-16 sticky top-0 z-[50] border-b-2 border-on-surface shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="font-headline-md font-extrabold text-primary hidden md:block">Kursus Saya</h1>
          <div className="hidden md:flex items-center flex-grow max-w-sm mx-6">
            <div className="flex w-full bg-white border-2 border-on-surface rounded-lg items-center px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Icon name="search" className="w-4 h-4 text-on-surface-variant shrink-0" />
              <input
                className="w-full bg-transparent border-none focus:ring-0 text-sm ml-2"
                placeholder="Cari materi..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationDropdown />
            <ProfileDropdown />
          </div>
        </header>

        <main className="flex-grow overflow-y-auto bg-surface-bright">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
            {/* Page Title + Stats */}
            <div className="mb-6">
              <h2 className="font-headline-lg text-on-surface">Kursus Saya</h2>
              <p className="text-on-surface-variant mt-1">Lanjutkan perjalanan belajarmu hari ini.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total Kursus',     value: stats.total,       color: 'bg-primary-container'   },
                { label: 'Sedang Berjalan',  value: stats.inProgress,  color: 'bg-secondary-fixed'     },
                { label: 'Selesai',          value: stats.completed,   color: 'bg-tertiary-fixed'      },
              ].map(s => (
                <div key={s.label} className={`${s.color} border-2 border-on-surface p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center`}>
                  <p className="font-headline-lg text-2xl font-black text-on-surface">{s.value}</p>
                  <p className="text-xs font-bold text-on-surface-variant mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Courses */}
              <div className="lg:col-span-8 flex flex-col gap-5">
                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {FILTER_TABS.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setFilter(tab.key)}
                      className={`whitespace-nowrap px-4 py-2 rounded-full border-2 font-label-bold text-sm transition-all ${
                        filter === tab.key
                          ? 'bg-on-surface text-white border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]'
                          : 'bg-white text-on-surface-variant border-on-surface/30 hover:border-on-surface'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {loading ? (
                  <div className="space-y-4">
                    {[1,2,3].map(n => <div key={n} className="h-40 border-2 border-on-surface bg-surface-container animate-pulse rounded-xl" />)}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-16 border-4 border-dashed border-on-surface/20 rounded-3xl">
                    <Icon name="school" className="w-14 h-14 mx-auto mb-4 opacity-20" />
                    <h3 className="font-headline-md text-xl mb-2">
                      {search ? 'Kursus tidak ditemukan' : 'Tidak ada kursus di kategori ini'}
                    </h3>
                    <button onClick={() => navigate('/catalog')} className="mt-4 px-6 py-2 bg-primary text-white border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-label-bold rounded-lg">
                      Cari Kursus
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-5">
                    {filtered.map(course => (
                      <div
                        key={course.enrollmentId}
                        className="bg-white border-2 border-on-surface rounded-xl p-4 flex flex-col md:flex-row gap-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                      >
                        <div className="w-full md:w-40 h-32 rounded-lg border-2 border-on-surface overflow-hidden relative flex-shrink-0">
                          <span className="absolute top-2 left-2 bg-secondary-container text-on-secondary-container font-label-bold text-[11px] px-2 py-1 rounded border-2 border-on-surface z-10 uppercase">
                            {course.category}
                          </span>
                          <img
                            alt={course.title}
                            className="w-full h-full object-cover"
                            src={course.image_url || 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&q=80&w=400'}
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-headline-md text-on-surface mb-1 line-clamp-1">{course.title}</h3>
                            <p className="text-sm text-on-surface-variant flex items-center gap-1">
                              <Icon name="account_circle" className="w-4 h-4" />
                              {course.instructor}
                            </p>
                          </div>
                          <div className="mt-3">
                            <div className="flex justify-between items-end mb-1.5">
                              <span className="text-xs font-bold text-on-surface-variant">Progress</span>
                              <span className="font-label-bold text-sm text-primary">{course.progress}%</span>
                            </div>
                            <div className="h-3 w-full bg-surface-container border-2 border-on-surface rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-500"
                                style={{ width: `${course.progress}%` }}
                              />
                            </div>
                            {course.progress >= 100 && (
                              <p className="text-xs text-green-600 font-black mt-1 flex items-center gap-1">
                                <Icon name="task_alt" className="w-3 h-3" /> Selesai!
                              </p>
                            )}
                          </div>
                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={() => navigate(`/courses/${course.id}`)}
                              className="bg-primary text-white font-label-bold text-sm px-5 py-2 rounded-lg border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] hover:translate-x-[-1px] transition-all"
                            >
                              {course.progress === 0 ? 'Mulai Belajar' : course.progress >= 100 ? 'Tinjau Kembali' : 'Lanjutkan'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Stats Widget */}
              <div className="lg:col-span-4 flex flex-col gap-5">
                <div className="bg-secondary-fixed border-2 border-on-surface rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h3 className="font-headline-md mb-4 flex items-center gap-2 text-on-secondary-fixed">
                    <Icon name="trending_up" className="w-5 h-5 text-secondary" />
                    Statistik Belajar
                  </h3>
                  <div className="bg-white border-2 border-on-surface rounded-lg p-4 mb-4">
                    <p className="text-xs text-on-surface-variant font-bold">Kursus Terdaftar</p>
                    <p className="font-headline-lg text-primary font-black text-3xl">{stats.total}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white border-2 border-on-surface rounded-lg p-3 text-center">
                      <Icon name="workspace_premium" className="w-7 h-7 text-tertiary mx-auto mb-1" />
                      <p className="font-label-bold text-sm text-on-surface">{stats.completed} Selesai</p>
                    </div>
                    <div className="bg-white border-2 border-on-surface rounded-lg p-3 text-center">
                      <Icon name="bolt" className="w-7 h-7 text-secondary mx-auto mb-1" />
                      <p className="font-label-bold text-sm text-on-surface">{stats.inProgress} Aktif</p>
                    </div>
                  </div>
                </div>

                {/* Quick Access to Catalog */}
                <div className="bg-primary-container border-2 border-on-surface rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h3 className="font-headline-md mb-2 text-on-primary-container">Tambah Kursus</h3>
                  <p className="text-sm text-on-primary-fixed-variant mb-4">Temukan lebih banyak kursus menarik di katalog kami.</p>
                  <button
                    onClick={() => navigate('/catalog')}
                    className="w-full py-3 bg-on-surface text-white border-2 border-on-surface font-label-bold rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2"
                  >
                    <Icon name="search" className="w-4 h-4" />
                    Jelajahi Katalog
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MyCourses;
