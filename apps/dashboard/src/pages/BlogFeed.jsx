import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Sidebar from '../components/Sidebar';
import ProfileDropdown from '../components/ProfileDropdown';
import NotificationDropdown from '../components/NotificationDropdown';
import Icon from '../components/Icon';

const BlogFeed = () => {
  const navigate = useNavigate();
  const [posts,          setPosts]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [sortBy,         setSortBy]         = useState('newest');
  const [searchQuery,    setSearchQuery]    = useState('');

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    setLoading(true);
    
    // 1. Ambil data postingan
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (postsError) {
      console.error('Error fetching posts:', postsError);
      setPosts([]);
      setLoading(false);
      return;
    }

    if (!postsData || postsData.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    // 2. Kumpulkan ID penulis unik
    const authorIds = [...new Set(postsData.map(p => p.author_id).filter(Boolean))];
    let profilesData = [];
    
    // 3. Ambil data profil berdasarkan ID penulis
    if (authorIds.length > 0) {
      const { data: pData, error: pError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', authorIds);
        
      if (!pError && pData) {
        profilesData = pData;
      } else if (pError) {
        console.error('Error fetching profiles:', pError);
      }
    }

    // 4. Gabungkan data
    const processedData = postsData.map(post => {
      const authorProfile = profilesData.find(p => p.id === post.author_id);
      return {
        ...post,
        author: authorProfile || null
      };
    });

    setPosts(processedData);
    setLoading(false);
  };

  // ── Derive categories dynamically from real posts ──────────────
  const categories = useMemo(() => {
    const cats = [...new Set(posts.map(p => p.category).filter(Boolean))].sort();
    return ['Semua', ...cats];
  }, [posts]);

  // ── Client-side filter + sort ──────────────────────────────────
  const filteredPosts = useMemo(() => {
    let result = [...posts];

    if (activeCategory !== 'Semua') {
      result = result.filter(p => p.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.content?.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'newest')    result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else if (sortBy === 'oldest')    result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    else if (sortBy === 'az')        result.sort((a, b) => a.title?.localeCompare(b.title));
    else if (sortBy === 'popular')   result.sort((a, b) => (b.views || 0) - (a.views || 0));

    return result;
  }, [posts, activeCategory, sortBy, searchQuery]);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  const featuredPost = filteredPosts[0];
  const gridPosts    = filteredPosts.slice(1);

  const SORT_OPTIONS = [
    { value: 'newest',  label: 'Terbaru',     icon: 'schedule' },
    { value: 'oldest',  label: 'Terlama',     icon: 'history'  },
    { value: 'popular', label: 'Terpopuler',  icon: 'trending_up' },
    { value: 'az',      label: 'A-Z',         icon: 'sort_by_alpha' },
  ];

  return (
    <div className="bg-background text-on-surface font-plus-jakarta flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">

          {/* ── Top NavBar ───────────────────────────────────────── */}
          <header className="sticky top-0 z-40 flex justify-between items-center px-6 lg:px-margin-desktop py-4 bg-surface border-b-2 border-on-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-4">
              <h1 className="font-headline-md font-black text-primary">Blog Feed</h1>
              {posts.length > 0 && (
                <span className="hidden md:inline-flex items-center px-2.5 py-1 bg-primary-container text-on-primary-container border-2 border-on-surface text-xs font-black rounded-full">
                  {posts.length} artikel
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="hidden sm:flex items-center border-2 border-on-surface bg-surface-container px-3 py-1.5 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Icon name="search" className="w-4 h-4 text-on-surface-variant shrink-0" />
                <input
                  className="bg-transparent border-none focus:ring-0 text-sm placeholder:text-on-surface-variant/50 w-32 md:w-48 ml-2"
                  placeholder="Cari artikel..."
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="ml-1 text-on-surface-variant hover:text-on-surface">
                    <Icon name="close" className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <NotificationDropdown />
              <ProfileDropdown />
              <button
                onClick={() => navigate('/write')}
                className="bg-primary text-white border-2 border-on-surface px-4 py-2 font-label-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all flex items-center gap-2 rounded-lg"
              >
                <Icon name="add" className="w-5 h-5" />
                <span className="hidden md:inline">Tulis Artikel</span>
              </button>
            </div>
          </header>

          {/* ── Featured Article ──────────────────────────────────── */}
          {featuredPost && (
            <section className="p-6 lg:p-margin-desktop pb-0">
              <div
                className="grid lg:grid-cols-2 gap-0 border-2 border-on-background bg-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden rounded-xl cursor-pointer group"
                onClick={() => navigate(`/blog/${featuredPost.id}`)}
              >
                <div className="relative h-64 lg:h-full min-h-[360px] overflow-hidden">
                  <img
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src={featuredPost.image_url || 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&q=80&w=800'}
                    alt={featuredPost.title}
                  />
                  <div className="absolute top-5 left-5 flex items-center gap-2">
                    <span className="bg-primary-container text-on-primary-container border-2 border-on-surface px-3 py-1.5 font-label-bold text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase">
                      {sortBy === 'popular' ? '#1 Terpopuler' : searchQuery ? 'Hasil Teratas' : 'Unggulan'}
                    </span>
                    {featuredPost.category && (
                      <span className="bg-surface/90 border-2 border-on-surface px-3 py-1.5 font-label-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase">
                        {featuredPost.category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-8 lg:p-12 flex flex-col justify-center gap-5 bg-secondary-fixed">
                  <h2 className="font-headline-xl text-on-background text-2xl md:text-3xl font-black leading-tight">
                    {featuredPost.title}
                  </h2>
                  <p className="font-body-lg text-on-surface-variant line-clamp-3">
                    {featuredPost.content}
                  </p>
                  <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary-container border border-on-surface overflow-hidden flex items-center justify-center">
                          {featuredPost.author?.avatar_url ? (
                            <img src={featuredPost.author.avatar_url} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-black">{featuredPost.author?.full_name?.[0] || 'A'}</span>
                          )}
                        </div>
                        <span className="text-xs font-black text-on-surface">{featuredPost.author?.full_name || 'Penulis Harin'}</span>
                      </div>
                      <span className="text-on-surface-variant/30 hidden md:block">•</span>
                      <span className="text-xs font-bold text-on-surface-variant">
                        {formatDate(featuredPost.created_at)}
                        {featuredPost.updated_at && featuredPost.updated_at !== featuredPost.created_at && (
                          <span className="italic opacity-70 ml-1">(Diedit)</span>
                        )}
                      </span>
                      {featuredPost.views > 0 && (
                        <>
                          <span className="text-on-surface-variant/30 hidden md:block">•</span>
                          <span className="flex items-center gap-1 text-xs font-bold text-on-surface-variant">
                            <Icon name="visibility" className="w-3.5 h-3.5 shrink-0" />
                            <span>{featuredPost.views.toLocaleString('id-ID')} views</span>
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-primary font-label-bold text-sm group-hover:gap-2 transition-all">
                      <span>Baca Selengkapnya</span>
                      <Icon name="arrow_forward" className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ── Filter Bar ───────────────────────────────────────── */}
          <section className="px-6 lg:px-margin-desktop pt-6 pb-2 space-y-4">
            {/* Sort Tabs + Result count row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Sort pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-on-surface-variant uppercase tracking-wider shrink-0">Urutkan:</span>
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 font-label-bold text-xs transition-all ${
                      sortBy === opt.value
                        ? 'bg-on-surface text-white border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]'
                        : 'bg-surface border-on-surface/30 text-on-surface-variant hover:border-on-surface hover:text-on-surface'
                    }`}
                  >
                    <Icon name={opt.icon} className="w-3.5 h-3.5" />
                    {opt.label}
                  </button>
                ))}
              </div>
              {/* Result count */}
              {(searchQuery || activeCategory !== 'Semua') && (
                <p className="text-xs text-on-surface-variant font-bold shrink-0">
                  {filteredPosts.length} artikel
                  {searchQuery && ` untuk "${searchQuery}"`}
                  {activeCategory !== 'Semua' && ` · ${activeCategory}`}
                </p>
              )}
            </div>

            {/* Category chips — scrollable, dynamic from DB */}
            <div className="relative">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {loading ? (
                  // Skeleton chips
                  Array(6).fill(0).map((_, i) => (
                    <div key={i} className="h-9 w-24 rounded-full bg-surface-container border-2 border-on-surface/20 animate-pulse shrink-0" />
                  ))
                ) : (
                  categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-2 rounded-full font-label-bold text-sm border-2 transition-all shrink-0 ${
                        activeCategory === cat
                          ? 'bg-primary text-white border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]'
                          : 'bg-surface border-on-surface/30 text-on-surface-variant hover:border-primary/60 hover:text-on-surface hover:bg-primary-container/30'
                      }`}
                    >
                      {cat}
                      {cat !== 'Semua' && (
                        <span className={`ml-1.5 text-[10px] font-black opacity-60`}>
                          {posts.filter(p => p.category === cat).length}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
              {/* Fade right edge hint */}
              <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
            </div>
          </section>

          {/* ── Blog Grid ────────────────────────────────────────── */}
          <section className="px-6 lg:px-margin-desktop pb-24 pt-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <div key={n} className="h-80 border-2 border-on-surface bg-surface-container rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-20 border-4 border-dashed border-on-surface/20 rounded-3xl bg-surface-container/30">
                <Icon name="article" className="w-16 h-16 mx-auto mb-4 text-on-surface-variant opacity-20" />
                <h3 className="text-xl font-bold opacity-60">
                  {searchQuery ? 'Tidak ada artikel yang cocok.' : `Belum ada artikel di kategori "${activeCategory}".`}
                </h3>
                <p className="text-on-surface-variant/60 mb-8 text-sm mt-2">
                  {searchQuery ? 'Coba kata kunci lain atau reset filter.' : 'Jadilah yang pertama berbagi!'}
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  {(searchQuery || activeCategory !== 'Semua') && (
                    <button
                      onClick={() => { setSearchQuery(''); setActiveCategory('Semua'); }}
                      className="bg-surface text-on-surface border-2 border-on-surface px-6 py-2 font-label-bold rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      Reset Filter
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/write')}
                    className="bg-primary text-white border-2 border-on-surface px-8 py-2 font-label-bold rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-all"
                  >
                    Tulis Artikel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Popular banner (only when sort = popular) */}
                {sortBy === 'popular' && (
                  <div className="flex items-center gap-3 mb-5 p-3 bg-secondary-fixed border-2 border-on-surface rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Icon name="trending_up" className="w-5 h-5 text-secondary shrink-0" />
                    <p className="text-sm font-bold text-on-secondary-fixed">
                      Menampilkan artikel berdasarkan jumlah views terbanyak
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gridPosts.map((post, idx) => (
                    <article
                      key={post.id}
                      className="flex flex-col border-2 border-on-surface bg-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group"
                      onClick={() => navigate(`/blog/${post.id}`)}
                    >
                      <div className="h-44 relative overflow-hidden border-b-2 border-on-surface">
                        <img
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          src={post.image_url || 'https://images.unsplash.com/photo-1454165833767-01754ee98221?auto=format&fit=crop&q=80&w=600'}
                          alt={post.title}
                        />
                        {/* Rank badge for popular sort (Offset by +2 because #1 is the featured post) */}
                        {sortBy === 'popular' && idx < 3 && (
                          <div className={`absolute top-0 left-0 w-8 h-8 flex items-center justify-center font-black text-sm border-r-2 border-b-2 border-on-surface ${
                            idx === 0 ? 'bg-gray-300' : idx === 1 ? 'bg-amber-700 text-white' : 'bg-surface-variant'
                          }`}>
                            #{idx + 2}
                          </div>
                        )}
                        <span className="absolute top-3 right-3 bg-tertiary-container text-on-tertiary-container border-2 border-on-surface px-2 py-0.5 font-label-bold text-[11px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          {post.category}
                        </span>
                      </div>
                      <div className="p-5 flex flex-col gap-2 flex-grow">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-secondary-container border border-on-surface overflow-hidden flex items-center justify-center">
                              {post.author?.avatar_url ? (
                                <img src={post.author.avatar_url} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[8px] font-black">{post.author?.full_name?.[0] || 'A'}</span>
                              )}
                            </div>
                            <span className="text-[10px] font-black text-on-surface line-clamp-1">{post.author?.full_name || 'Penulis Harin'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-on-surface-variant font-bold">
                            <span>
                              {formatDate(post.created_at)}
                              {post.updated_at && post.updated_at !== post.created_at && (
                                <span className="italic opacity-70 ml-1">(Diedit)</span>
                              )}
                            </span>
                            {post.views > 0 && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-0.5">
                                  <Icon name="visibility" className="w-3.5 h-3.5 shrink-0" />
                                  <span>
                                    {post.views >= 1000
                                      ? `${(post.views / 1000).toFixed(1)}k`
                                      : post.views}
                                  </span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <h3 className="font-headline-md text-on-background leading-tight line-clamp-2 font-black">
                          {post.title}
                        </h3>
                        <p className="font-body-md text-on-surface-variant text-sm line-clamp-3 flex-grow">
                          {post.content}
                        </p>
                        <div className="mt-auto pt-3 flex items-center text-primary font-label-bold text-sm gap-1.5 group-hover:gap-2.5 transition-all border-t border-on-surface/10">
                          <span>Baca Artikel</span>
                          <Icon name="arrow_forward" className="w-4 h-4" />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Footer */}
          <footer className="bg-surface-container border-t-2 border-on-background px-6 lg:px-margin-desktop py-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h2 className="font-headline-md text-primary font-black">Harin Learning</h2>
                <p className="font-body-md text-on-surface-variant text-sm mt-1">© 2024 Harin Learning. Semua Hak Dilindungi.</p>
              </div>
              <div className="flex gap-3">
                <button className="w-10 h-10 border-2 border-on-surface bg-white rounded-lg flex items-center justify-center hover:bg-primary-container cursor-pointer transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Icon name="share" className="w-5 h-5" />
                </button>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default BlogFeed;
