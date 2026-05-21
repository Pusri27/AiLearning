import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileDropdown from '../components/ProfileDropdown';
import NotificationDropdown from '../components/NotificationDropdown';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabaseClient';

const Catalog = () => {
  const navigate = useNavigate();
  const [courses,  setCourses]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [category, setCategory] = useState('Semua');
  const [search,   setSearch]   = useState('');
  const [sortBy,   setSortBy]   = useState('newest');
  const [ratingsMap, setRatingsMap] = useState({});

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        setCourses(data);
        // Fetch ratings from course_ratings
        const courseIds = data.map(c => c.id);
        if (courseIds.length > 0) {
          const { data: ratings } = await supabase
            .from('course_ratings')
            .select('course_id, rating')
            .in('course_id', courseIds);
          const rMap = {};
          ratings?.forEach(r => {
            if (!rMap[r.course_id]) rMap[r.course_id] = [];
            rMap[r.course_id].push(r.rating);
          });
          setRatingsMap(rMap);
        }
      }
      setLoading(false);
    };
    fetchCourses();
  }, []);

  // Derive category list from real data
  const categories = useMemo(() => {
    const cats = [...new Set(courses.map(c => c.category).filter(Boolean))];
    return ['Semua', ...cats];
  }, [courses]);

  const filtered = useMemo(() => {
    let result = [...courses];
    if (category !== 'Semua') result = result.filter(c => c.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c => c.title?.toLowerCase().includes(q) || c.instructor?.toLowerCase().includes(q));
    }
    if (sortBy === 'newest')   result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (sortBy === 'oldest')   result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    if (sortBy === 'price_asc')  result.sort((a, b) => a.price - b.price);
    if (sortBy === 'price_desc') result.sort((a, b) => b.price - a.price);
    if (sortBy === 'az')       result.sort((a, b) => a.title.localeCompare(b.title));
    return result;
  }, [courses, category, search, sortBy]);

  const formatPrice = (p) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);

  return (
    <div className="bg-background text-on-surface h-screen overflow-hidden flex">
      <Sidebar />

      <main className="flex-grow flex flex-col overflow-hidden">
        {/* TopAppBar */}
        <header className="flex justify-between items-center px-6 md:px-margin-desktop h-20 w-full bg-surface border-b-2 border-on-surface shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] sticky top-0 z-[60] shrink-0">
          <span className="font-headline-md font-extrabold text-on-surface">Katalog Kursus</span>
          <div className="flex items-center gap-4">
            <NotificationDropdown />
            <ProfileDropdown />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-margin-desktop space-y-8">
          {/* Hero Banner */}
          <section className="relative overflow-hidden border-2 border-on-surface bg-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] min-h-[240px] flex items-center px-8 md:px-12 rounded-xl">
            <div className="relative z-10 max-w-2xl">
              <div className="bg-on-surface text-primary-fixed-dim inline-block px-3 py-1 mb-4 font-black uppercase text-sm">
                {courses.length > 0 ? `${courses.length} Kursus Tersedia` : 'Featured Program'}
              </div>
              <h2 className="font-headline-xl text-on-primary mb-3">Temukan Kursus Idealmu</h2>
              <p className="font-body-lg text-primary-fixed mb-6">
                Belajar dari instruktur terbaik. Mulai dari teknologi, desain, hingga bisnis — semua ada di sini.
              </p>
              <button
                onClick={() => document.getElementById('catalog-grid')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-on-surface text-white font-headline-md px-8 py-3 border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(255,255,255,0.4)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.4)] transition-all rounded-lg flex items-center gap-2"
              >
                Lihat Semua Kursus
                <Icon name="arrow_forward" className="w-5 h-5" />
              </button>
            </div>
            <div className="absolute right-0 top-0 w-1/3 h-full hidden lg:block bg-primary-container border-l-2 border-on-surface overflow-hidden rounded-r-xl">
              <img
                className="w-full h-full object-cover opacity-70"
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=600"
                alt="Catalog Hero"
              />
            </div>
          </section>

          {/* Filter + Search + Sort */}
          <section className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Category Chips */}
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-2 border-2 font-label-bold text-sm transition-all rounded-full ${
                      category === cat
                        ? 'bg-on-surface text-white border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]'
                        : 'bg-white text-on-surface border-on-surface/40 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-primary-container'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {/* Sort */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="border-2 border-on-surface bg-white text-sm font-bold px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:ring-0 rounded-lg shrink-0 cursor-pointer"
              >
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
                <option value="price_asc">Harga ↑</option>
                <option value="price_desc">Harga ↓</option>
                <option value="az">A–Z</option>
              </select>
            </div>
            {/* Search Bar */}
            <div className="flex items-center bg-white border-2 border-on-surface px-4 py-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg gap-2">
              <Icon name="search" className="w-5 h-5 text-on-surface-variant shrink-0" />
              <input
                className="bg-transparent border-none outline-none text-sm focus:ring-0 w-full"
                placeholder="Cari kursus atau instruktur..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-on-surface-variant hover:text-on-surface">
                  <Icon name="close" className="w-4 h-4" />
                </button>
              )}
            </div>
            {/* Result count */}
            {(search || category !== 'Semua') && (
              <p className="text-xs text-on-surface-variant font-bold">
                {filtered.length} kursus ditemukan
                {search && ` untuk "${search}"`}
                {category !== 'Semua' && ` dalam kategori "${category}"`}
              </p>
            )}
          </section>

          {/* Course Grid */}
          <section id="catalog-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-80 bg-surface-container border-2 border-on-surface animate-pulse shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl" />
              ))
            ) : filtered.length > 0 ? (
              filtered.map((course) => (
                <div
                  key={course.id}
                  onClick={() => navigate(`/courses/${course.id}`)}
                  className="flex flex-col bg-surface border-2 border-on-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group rounded-xl"
                >
                  <div className="h-48 border-b-2 border-on-surface relative overflow-hidden">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={course.image_url || 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&q=80&w=400'}
                      alt={course.title}
                    />
                    <div className="absolute top-4 left-4 bg-tertiary text-white px-3 py-1 border-2 border-on-surface font-black uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      {course.category}
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="font-headline-md mb-1 line-clamp-2">{course.title}</h3>
                    <p className="text-on-surface-variant text-sm mb-4 italic">Oleh {course.instructor}</p>
                    <div className="mt-auto pt-4 border-t-2 border-on-surface/10 flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <Icon name="star" className="w-4 h-4 text-primary" />
                        <span className="font-label-bold text-xs">
                          {ratingsMap[course.id]?.length > 0
                            ? (ratingsMap[course.id].reduce((a, b) => a + b, 0) / ratingsMap[course.id].length).toFixed(1)
                            : '—'}
                        </span>
                        {ratingsMap[course.id]?.length > 0 && (
                          <span className="text-[10px] text-on-surface-variant font-bold">({ratingsMap[course.id].length})</span>
                        )}
                      </div>
                      <span className="font-headline-md text-primary">{formatPrice(course.price)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center border-4 border-dashed border-on-surface/20 bg-surface-container-low rounded-3xl">
                <Icon name="search" className="w-14 h-14 mx-auto mb-4 opacity-20" />
                <h3 className="font-headline-md text-2xl">
                  {search ? `Tidak ada hasil untuk "${search}"` : 'Belum ada kursus tersedia'}
                </h3>
                <p className="text-on-surface-variant mt-2">
                  {search ? 'Coba kata kunci lain atau hapus filter.' : 'Silakan tambahkan data kursus di Supabase.'}
                </p>
                {search && (
                  <button onClick={() => { setSearch(''); setCategory('Semua'); }} className="mt-4 px-6 py-2 bg-primary text-white border-2 border-on-surface rounded-lg font-label-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    Reset Filter
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Catalog;
