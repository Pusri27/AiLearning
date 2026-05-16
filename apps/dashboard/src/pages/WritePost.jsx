import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Sidebar from '../components/Sidebar';
import Icon from '../components/Icon';
import { showToast, friendlyError } from '../lib/toast';
import { awardAchievement } from '../lib/achievementService';
import { useUserProfile } from '../context/UserProfileContext';
import { WarningIcon, TadaIcon } from '../components/Icons';

// ── Category Groups with SVG Icon Names ──────────────────────────
const CATEGORY_GROUPS = [
  {
    group: 'Akademik & Belajar',
    icon: 'school',
    color: 'text-primary bg-primary-container',
    items: ['Study Tips', 'Research', 'Akademik', 'Ujian & Persiapan', 'Produktivitas', 'Motivasi Belajar'],
  },
  {
    group: 'Teknologi',
    icon: 'devices',
    color: 'text-secondary bg-secondary-fixed',
    items: ['Technology', 'Programming', 'AI & Machine Learning', 'Web Development', 'Mobile Development', 'Cybersecurity', 'Cloud Computing', 'Data Science'],
  },
  {
    group: 'Desain & Kreatif',
    icon: 'palette',
    color: 'text-tertiary bg-tertiary-fixed',
    items: ['UI/UX Design', 'Graphic Design', 'Fotografi', 'Videografi', 'Motion Design'],
  },
  {
    group: 'Karir & Bisnis',
    icon: 'work',
    color: 'text-primary bg-primary-fixed',
    items: ['Career', 'Entrepreneurship', 'Leadership', 'Keuangan & Investasi', 'Marketing', 'Personal Branding'],
  },
  {
    group: 'Kehidupan & Sosial',
    icon: 'people',
    color: 'text-secondary bg-secondary-container',
    items: ['Campus Life', 'Mental Health', 'Kesehatan & Gaya Hidup', 'Lingkungan & Sustainability', 'Travelling', 'Hobi & Komunitas'],
  },
  {
    group: 'Bahasa & Komunikasi',
    icon: 'translate',
    color: 'text-tertiary bg-tertiary-container',
    items: ['Bahasa Inggris', 'Bahasa Asing', 'Public Speaking', 'Penulisan Kreatif'],
  },
  {
    group: 'Sains & Teknik',
    icon: 'science',
    color: 'text-primary bg-primary-container',
    items: ['Sains', 'Matematika', 'Fisika', 'Kimia', 'Biologi', 'Teknik'],
  },
  {
    group: 'Lainnya',
    icon: 'more_horiz',
    color: 'text-on-surface bg-surface-container',
    items: ['Berita & Opini', 'Review', 'Tutorial', 'Lainnya'],
  },
];

// ── Custom Category Picker Component ─────────────────────────────
const CategoryPicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [searchCat, setSearchCat] = useState('');
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Find which group the current value belongs to
  const activeGroup = CATEGORY_GROUPS.find(g => g.items.includes(value));

  const filteredGroups = searchCat.trim()
    ? CATEGORY_GROUPS.map(g => ({
        ...g,
        items: g.items.filter(i => i.toLowerCase().includes(searchCat.toLowerCase())),
      })).filter(g => g.items.length > 0)
    : CATEGORY_GROUPS;

  return (
    <div className="relative" ref={ref}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 bg-surface border-2 border-on-background rounded-xl py-2.5 px-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          {activeGroup && (
            <span className={`w-6 h-6 flex items-center justify-center rounded-md shrink-0 ${activeGroup.color}`}>
              <Icon name={activeGroup.icon} className="w-3.5 h-3.5" />
            </span>
          )}
          <span className="font-label-bold text-sm truncate">{value}</span>
        </div>
        <Icon name="expand_more" className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border-2 border-on-background rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b-2 border-on-background/10">
            <div className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-lg border border-on-background/20">
              <Icon name="search" className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
              <input
                className="bg-transparent border-none text-xs focus:ring-0 w-full"
                placeholder="Cari kategori..."
                value={searchCat}
                onChange={e => setSearchCat(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {/* Scrollable list */}
          <div className="max-h-72 overflow-y-auto">
            {filteredGroups.map(group => (
              <div key={group.group}>
                {/* Group Header */}
                <div className="flex items-center gap-2 px-3 py-2 bg-surface-container sticky top-0 border-b border-on-background/5">
                  <span className={`w-5 h-5 flex items-center justify-center rounded shrink-0 ${group.color}`}>
                    <Icon name={group.icon} className="w-3 h-3" />
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    {group.group}
                  </span>
                </div>
                {/* Options */}
                {group.items.map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => { onChange(item); setOpen(false); setSearchCat(''); }}
                    className={`w-full text-left px-4 py-2 text-sm font-body-md transition-colors flex items-center gap-2 ${
                      value === item
                        ? 'bg-primary-container text-on-primary-container font-label-bold'
                        : 'hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    {value === item && <Icon name="task_alt" className="w-3.5 h-3.5 text-primary shrink-0" />}
                    <span className={value === item ? '' : 'ml-[22px]'}>{item}</span>
                  </button>
                ))}
              </div>
            ))}
            {filteredGroups.length === 0 && (
              <div className="text-center py-6 text-sm text-on-surface-variant font-bold">
                Kategori tidak ditemukan
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main WritePost Page ───────────────────────────────────────────
const WritePost = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { profile } = useUserProfile();
  const isGuest = profile.isGuest;
  const isEditing = !!id;

  const [loading,  setLoading]  = useState(false);
  const [title,    setTitle]    = useState('');
  const [content,  setContent]  = useState('');
  const [category, setCategory] = useState('Study Tips');
  const [imageUrl, setImageUrl] = useState('');
  const [error,    setError]    = useState(null);

  useEffect(() => {
    if (isEditing) {
      const fetchPost = async () => {
        const { data } = await supabase.from('posts').select('*').eq('id', id).single();
        if (data) {
          setTitle(data.title);
          setContent(data.content);
          setCategory(data.category || 'Study Tips');
          setImageUrl(data.image_url === 'https://images.unsplash.com/photo-1454165833767-01754ee98221?auto=format&fit=crop&q=80&w=1000' ? '' : data.image_url);
        }
      };
      fetchPost();
    }
  }, [id, isEditing]);

  const handlePublish = async (e) => {
    e.preventDefault();
    if (isGuest) {
      showToast('Fitur ini hanya tersedia untuk pengguna terdaftar.', 'error');
      return;
    }
    if (!title || !content) { setError('Judul dan konten tidak boleh kosong.'); return; }
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }
      if (isEditing) {
        const { error: postError } = await supabase.from('posts').update({
          title,
          content,
          category,
          image_url: imageUrl || 'https://images.unsplash.com/photo-1454165833767-01754ee98221?auto=format&fit=crop&q=80&w=1000',
          updated_at: new Date().toISOString()
        }).eq('id', id);
        if (postError) throw postError;

        showToast('Postingan berhasil diperbarui!');
        navigate(`/blog/${id}`);
      } else {
        const { error: postError } = await supabase.from('posts').insert({
          title,
          content,
          category,
          image_url: imageUrl || 'https://images.unsplash.com/photo-1454165833767-01754ee98221?auto=format&fit=crop&q=80&w=1000',
          author_id: user.id,
        });
        if (postError) throw postError;

        // Kirim Notifikasi Global
        await supabase.from('notifications').insert({
          title: 'Artikel Baru: ' + title,
          content: `Cek artikel terbaru kami di kategori ${category}!`,
          type: 'blog',
          link_to: '/blog'
        });

        // Lencana Author
        await awardAchievement(user.id, 'author');

        showToast('Postingan berhasil diterbitkan!');
        navigate('/blog');
      }

    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  if (isGuest) {
    return (
      <div className="bg-background text-on-background font-plus-jakarta flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white border-4 border-on-background p-10 rounded-3xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md w-full text-center space-y-6">
            <div className="w-24 h-24 bg-primary-container text-primary rounded-2xl flex items-center justify-center mx-auto border-4 border-on-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-3">
              <Icon name="edit_note" className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h2 className="font-headline-xl text-3xl font-black">Tuangkan Ide Kamu!</h2>
              <p className="font-bold text-on-surface-variant leading-relaxed">
                Menulis artikel adalah fitur eksklusif untuk kontributor Harin. Yuk, daftar atau masuk untuk mulai berbagi pengetahuan dengan komunitas!
              </p>
            </div>
            <div className="space-y-4 pt-4">
              <button
                onClick={() => navigate('/signup')}
                className="w-full bg-primary text-white py-4 text-xl font-black rounded-xl border-2 border-on-background shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                Daftar Jadi Penulis
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-white text-on-surface py-3 text-sm font-bold rounded-xl border-2 border-on-background hover:bg-surface-container transition-all"
              >
                Masuk ke Akun
              </button>
            </div>
            <button 
              onClick={() => navigate('/blog')}
              className="text-primary font-black hover:underline flex items-center justify-center gap-2 mx-auto pt-2"
            >
              <Icon name="arrow_back" className="w-4 h-4" />
              Kembali ke Blog
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background font-plus-jakarta flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 md:p-margin-desktop flex flex-col xl:flex-row gap-6">
        {/* Content Creation Area */}
        <div className="flex-1 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="bg-surface border-2 border-on-background p-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <Icon name="arrow_back" className="w-6 h-6" />
            </button>
            <h2 className="font-headline-lg text-on-surface">{isEditing ? 'Edit Postingan' : 'Buat Postingan'}</h2>
          </div>

          {error && (
            <div className="bg-error-container text-error p-4 rounded-xl border-2 border-error text-sm font-bold">
              {error}
            </div>
          )}

          {/* Editor Surface */}
          <div className="bg-white border-2 border-on-background rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="p-6 border-b-2 border-on-background">
              <input
                className="w-full font-headline-md text-headline-md border-none focus:ring-0 placeholder:text-on-surface-variant/30"
                placeholder="Masukkan judul postingan..."
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="bg-surface-container flex flex-wrap items-center gap-2 p-3 border-b-2 border-on-background">
              <div className="flex gap-1 pr-4 border-r-2 border-on-background/10">
                <button type="button" className="p-2 hover:bg-secondary-container/20 rounded-md transition-colors font-bold">B</button>
                <button type="button" className="p-2 hover:bg-secondary-container/20 rounded-md transition-colors italic">I</button>
                <button type="button" className="p-2 hover:bg-secondary-container/20 rounded-md transition-colors underline">U</button>
              </div>
              <div className="flex-1" />
              <p className="text-xs font-bold opacity-40 uppercase tracking-widest px-4">Markdown Didukung</p>
            </div>
            <textarea
              className="w-full min-h-[400px] p-8 font-body-lg text-body-lg border-none focus:ring-0 resize-none leading-relaxed"
              placeholder="Mulai bagikan pengetahuanmu di sini..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>

        {/* Right Sidebar (Post Settings) */}
        <aside className="w-full xl:w-80 space-y-4">
          {/* Publishing Actions */}
          <div className="bg-white border-2 border-on-background rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 space-y-4">
            <h3 className="font-headline-md text-on-surface">Terbitkan</h3>
            <button
              onClick={handlePublish}
              disabled={loading}
              className="w-full bg-primary text-white border-2 border-on-background py-3 font-label-bold rounded-lg flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50"
            >
              <Icon name="send" className="w-5 h-5" />
              {loading ? (isEditing ? 'Menyimpan...' : 'Mengirim...') : (isEditing ? 'Simpan Perubahan' : 'Terbitkan Sekarang')}
            </button>
          </div>

          {/* Post Settings Card */}
          <div className="bg-white border-2 border-on-background rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="p-4 border-b-2 border-on-background bg-secondary-fixed">
              <h3 className="font-label-bold uppercase tracking-wider text-on-secondary-fixed">Pengaturan Post</h3>
            </div>
            <div className="p-5 space-y-5">
              {/* Custom Category Picker */}
              <div className="space-y-2">
                <label className="font-label-bold text-sm text-on-surface flex items-center gap-1.5">
                  <Icon name="label" className="w-4 h-4 text-primary" />
                  Kategori
                </label>
                <CategoryPicker value={category} onChange={setCategory} />
                {/* Selected badge */}
                {category && (() => {
                  const grp = CATEGORY_GROUPS.find(g => g.items.includes(category));
                  return grp ? (
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-on-background/20 ${grp.color} text-xs font-bold`}>
                      <Icon name={grp.icon} className="w-3 h-3" />
                      {grp.group}
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Featured Image URL */}
              <div className="space-y-2">
                <label className="font-label-bold text-sm text-on-surface flex items-center gap-1.5">
                  <Icon name="image" className="w-4 h-4 text-primary" />
                  URL Gambar Utama
                </label>
                <input
                  className="w-full bg-surface border-2 border-on-background rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-primary-container"
                  placeholder="https://..."
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                {imageUrl && (
                  <div className="mt-1 border-2 border-on-background rounded-lg overflow-hidden h-28">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
                  </div>
                )}
              </div>

              {/* Visibility Toggle */}
              <div className="pt-4 border-t-2 border-on-background/10">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input defaultChecked className="sr-only peer" type="checkbox" />
                    <div className="w-10 h-6 bg-surface-variant border-2 border-on-background rounded-full peer-checked:bg-primary transition-colors" />
                    <div className="absolute left-1 top-1 w-4 h-4 bg-on-background rounded-full transition-transform peer-checked:translate-x-4" />
                  </div>
                  <div>
                    <span className="font-label-bold text-sm block">Postingan Publik</span>
                    <span className="text-xs text-on-surface-variant">Bisa dilihat semua orang</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Writing Tips */}
          <div className="bg-primary-container/10 border-2 border-on-background border-dashed rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="lightbulb" className="w-5 h-5 text-primary" />
              <h4 className="font-label-bold text-primary">Tips Pro</h4>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Mulailah dengan "Bagaimana" atau "Mengapa" untuk menarik perhatian pembaca. Postingan edukasi performanya 40% lebih baik jika menggunakan list dan sub-heading.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default WritePost;
