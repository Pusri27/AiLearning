import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherSidebar from '../components/TeacherSidebar';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabaseClient';
import { showToast, friendlyError } from '../lib/toast';

const TeacherCreateCourse = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    price: '',
    description: '',
    level: 'beginner',
    language: 'en',
    image_url: ''
  });

  useEffect(() => {
    const checkUser = async () => {
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
    };
    checkUser();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const key = id.replace('course-', '');
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handlePublish = async (e) => {
    if (e) e.preventDefault();
    if (!formData.title || !formData.category || !formData.price) {
      showToast('Mohon isi Judul, Kategori, dan Harga terlebih dahulu.', 'error');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('courses')
        .insert([
          {
            title: formData.title,
            category: formData.category,
            price: parseFloat(formData.price),
            description: formData.description,
            instructor: user.full_name || 'Instructor',
            instructor_id: user.id,
            level: formData.level,
            language: formData.language,
            image_url: formData.image_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop'
          }
        ]);

      if (error) throw error;

      // Kirim Notifikasi Global
      await supabase.from('notifications').insert({
        title: 'Kursus Baru: ' + formData.title,
        content: `Mulai belajar sekarang di kategori ${formData.category}!`,
        type: 'course',
        link_to: '/catalog'
      });

      showToast('Kursus berhasil diterbitkan! 🎉');
      navigate('/teacher/courses');
    } catch (error) {
      showToast(friendlyError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface font-sans antialiased min-h-screen flex">
      <TeacherSidebar user={user} />

      {/* Main Content */}
      <main className="flex-1 lg:ml-[280px] pt-20 lg:pt-10 pb-24 lg:pb-8 px-margin-mobile lg:px-margin-desktop w-full max-w-[1440px] mx-auto min-h-screen">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-on-surface mb-2">Create Course</h1>
            <p className="text-lg text-on-surface-variant font-bold">Rancang kursus berkualitas tinggi untuk siswa Anda.</p>
          </div>
          <div className="flex gap-3">
             <button 
              onClick={() => navigate('/teacher/courses')}
              className="px-8 py-3 rounded-2xl border-4 border-on-surface font-black text-on-surface hover:bg-surface-variant transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
            >
              Cancel
            </button>
            <button 
              onClick={handlePublish}
              disabled={loading}
              className="px-8 py-3 rounded-2xl bg-primary text-on-primary font-black border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50"
            >
              {loading ? 'Publishing...' : 'Publish Course'}
            </button>
          </div>
        </div>

        <form onSubmit={handlePublish} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Primary Details */}
          <div className="col-span-1 lg:col-span-8 flex flex-col gap-10">
            
            {/* Basic Information Card */}
            <section className="bg-white rounded-[40px] p-8 md:p-10 border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-primary-container rounded-xl border-2 border-on-surface flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
                  <Icon name="info" className="w-6 h-6 text-on-primary-container" />
                </div>
                <h2 className="text-2xl font-black text-on-surface">Detail Kursus</h2>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block mb-3 font-black text-sm text-on-surface-variant uppercase tracking-widest" htmlFor="course-title">Judul Kursus</label>
                  <input 
                    className="w-full rounded-2xl border-4 border-on-surface bg-surface px-6 py-4 font-black text-on-surface placeholder:text-outline-variant focus:bg-primary-container/10 outline-none transition-all" 
                    id="course-title" 
                    placeholder="Contoh: Belajar UI/UX dari Nol" 
                    type="text"
                    value={formData.title}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block mb-3 font-black text-sm text-on-surface-variant uppercase tracking-widest" htmlFor="course-category">Kategori</label>
                    <div className="relative">
                      <select 
                        className="w-full appearance-none rounded-2xl border-4 border-on-surface bg-surface px-6 py-4 font-black text-on-surface focus:bg-primary-container/10 outline-none transition-all cursor-pointer" 
                        id="course-category"
                        value={formData.category}
                        onChange={handleInputChange}
                      >
                        <option value="">Pilih Kategori</option>
                        <option value="Technology">Technology</option>
                        <option value="Design">Design</option>
                        <option value="Business">Business</option>
                        <option value="Marketing">Marketing</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none font-black">keyboard_arrow_down</span>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-3 font-black text-sm text-on-surface-variant uppercase tracking-widest" htmlFor="course-price">Harga (IDR)</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface font-black">Rp</span>
                      <input 
                        className="w-full rounded-2xl border-4 border-on-surface bg-surface pl-14 pr-6 py-4 font-black text-on-surface placeholder:text-outline-variant focus:bg-primary-container/10 outline-none transition-all" 
                        id="course-price" 
                        placeholder="499000" 
                        type="number"
                        value={formData.price}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block mb-3 font-black text-sm text-on-surface-variant uppercase tracking-widest" htmlFor="course-description">Deskripsi Kursus</label>
                  <textarea 
                    className="w-full rounded-2xl border-4 border-on-surface bg-surface px-6 py-4 font-black text-on-surface placeholder:text-outline-variant focus:bg-primary-container/10 outline-none transition-all h-40 resize-none" 
                    id="course-description" 
                    placeholder="Apa yang akan dipelajari siswa?"
                    value={formData.description}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
              </div>
            </section>

            {/* Course Settings Card */}
            <section className="bg-white rounded-[40px] p-8 md:p-10 border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-secondary-container rounded-xl border-2 border-on-surface flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
                  <span className="material-symbols-outlined text-on-secondary-container font-black">tune</span>
                </div>
                <h2 className="text-2xl font-black text-on-surface">Pengaturan Lanjutan</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block mb-3 font-black text-sm text-on-surface-variant uppercase tracking-widest" htmlFor="course-level">Tingkat Kesulitan</label>
                  <div className="relative">
                    <select 
                      className="w-full appearance-none rounded-2xl border-4 border-on-surface bg-surface px-6 py-4 font-black text-on-surface outline-none cursor-pointer" 
                      id="course-level"
                      value={formData.level}
                      onChange={handleInputChange}
                    >
                      <option value="beginner">Pemula</option>
                      <option value="intermediate">Menengah</option>
                      <option value="advanced">Mahir</option>
                      <option value="all">Semua Level</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none font-black">keyboard_arrow_down</span>
                  </div>
                </div>
                <div>
                  <label className="block mb-3 font-black text-sm text-on-surface-variant uppercase tracking-widest" htmlFor="course-language">Bahasa</label>
                  <div className="relative">
                    <select 
                      className="w-full appearance-none rounded-2xl border-4 border-on-surface bg-surface px-6 py-4 font-black text-on-surface outline-none cursor-pointer" 
                      id="course-language"
                      value={formData.language}
                      onChange={handleInputChange}
                    >
                      <option value="id">Bahasa Indonesia</option>
                      <option value="en">English</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none font-black">keyboard_arrow_down</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Media */}
          <div className="col-span-1 lg:col-span-4 flex flex-col gap-10">
            <section className="bg-white rounded-[40px] p-8 border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] lg:sticky lg:top-28">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-tertiary-container rounded-xl border-2 border-on-surface flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
                  <span className="material-symbols-outlined text-on-tertiary-container font-black">perm_media</span>
                </div>
                <h2 className="text-xl font-black text-on-surface">Media Kursus</h2>
              </div>

              {/* Thumbnail Upload */}
              <div className="mb-10">
                <label className="block mb-3 font-black text-sm text-on-surface-variant uppercase tracking-widest">Thumbnail URL</label>
                <input 
                  className="w-full rounded-xl border-2 border-on-surface bg-surface px-4 py-3 font-black text-xs outline-none mb-6" 
                  id="course-image_url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.image_url}
                  onChange={handleInputChange}
                />
                <div className="w-full aspect-[4/3] rounded-[32px] border-4 border-dashed border-on-surface bg-surface flex flex-col items-center justify-center gap-4 hover:bg-surface-variant cursor-pointer transition-all overflow-hidden group">
                  {formData.image_url ? (
                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <div className="p-4 bg-primary-container text-on-primary-container rounded-full border-2 border-on-surface shadow-[2px_2px_0px_0px_#000]">
                        <span className="material-symbols-outlined text-3xl font-black">add_photo_alternate</span>
                      </div>
                      <div className="text-center px-4">
                        <p className="font-black text-sm">Preview Thumbnail</p>
                        <p className="text-[10px] text-on-surface-variant mt-1 font-black uppercase">Rekomendasi: 1920x1080</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="p-6 bg-secondary-container/20 rounded-2xl border-2 border-on-surface">
                 <p className="text-xs font-bold text-on-surface leading-relaxed">
                   <span className="font-black">💡 Tips:</span> Gunakan gambar yang menarik untuk meningkatkan minat calon siswa hingga 40%.
                 </p>
              </div>
            </section>
          </div>
        </form>
      </main>
    </div>
  );
};

export default TeacherCreateCourse;
