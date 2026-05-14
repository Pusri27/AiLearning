import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileDropdown from '../components/ProfileDropdown';
import { supabase } from '../lib/supabaseClient';

const Catalog = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching courses:', error);
    } else {
      setCourses(data);
    }
    setLoading(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="bg-background text-on-surface h-screen overflow-hidden">
      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        {/* Main Content Canvas */}
        <main className="flex-grow flex flex-col overflow-hidden">
          {/* TopAppBar */}
          <header className="flex justify-between items-center px-margin-mobile md:px-margin-desktop h-20 w-full bg-surface-container-lowest border-b-2 border-on-surface shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] sticky top-0 z-40 shrink-0">
            <div className="flex items-center gap-4">
              <span className="md:hidden material-symbols-outlined text-on-surface">menu</span>
              <span className="font-headline-md text-headline-md font-extrabold text-on-surface">Katalog Kursus</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-on-surface hover:bg-surface-variant p-2 rounded-full cursor-pointer transition-transform duration-100 active:scale-95">notifications</span>
                <ProfileDropdown />
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-margin-mobile md:p-margin-desktop space-y-12">
            {/* Hero Banner */}
            <section className="relative overflow-hidden border-2 border-on-surface bg-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] min-h-[300px] flex items-center p-gutter">
              <div className="relative z-10 max-w-2xl">
                <div className="bg-on-surface text-primary-fixed-dim inline-block px-3 py-1 mb-4 font-black uppercase text-sm">Featured Program</div>
                <h2 className="font-headline-xl text-headline-xl text-on-primary mb-4">Master AI Engineering</h2>
                <p className="font-body-lg text-body-lg text-primary-fixed mb-8">Pelajari arsitektur LLM, prompt engineering, dan integrasi AI ke aplikasi modern dengan kurikulum berbasis proyek nyata.</p>
                <button className="bg-on-surface text-white font-headline-md px-8 py-4 border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(255,255,255,0.4)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.4)] transition-all">
                  Mulai Belajar Sekarang
                </button>
              </div>
              <div className="absolute right-0 top-0 w-1/3 h-full hidden lg:block bg-primary-container border-l-2 border-on-surface">
                <img className="w-full h-full object-cover opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDT2NeiJcjzzkspibaB81KN-l3lrrRuq9dv2LBthP0dtPyxCYSuTqqpAaAPuJx6ZLI4juEfRsw6ZYVcFa60XVQSqi0yltzIg2z-TGQSsuzhdn6ohVbsa6S59RMTrrxDyLjUcU-BdylZI4RquDAxk3hfNlBRbVWi8Bg6I1CKOZXCN1HYdGurd3ld2_tC1e1aJZMhyMyLvo-1QZckpPZOE3yLhgECpM0tqE2abk32wMZU6z8Qojf4BvB48EVVMQuHGgMgtifBcz92vOA" alt="AI Engineering" />
              </div>
            </section>

            {/* Filter Chips */}
            <section className="flex flex-wrap items-center gap-4">
              <button className="px-6 py-2 border-2 border-on-surface bg-on-surface text-white font-label-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Semua Kursus</button>
              <button className="px-6 py-2 border-2 border-on-surface bg-white text-on-surface font-label-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-primary-container transition-all">Technology</button>
              <button className="px-6 py-2 border-2 border-on-surface bg-white text-on-surface font-label-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-secondary-container transition-all">Design</button>
              <button className="px-6 py-2 border-2 border-on-surface bg-white text-on-surface font-label-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-tertiary-container transition-all">Data</button>
              
              <div className="flex items-center bg-white border-2 border-on-surface px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-w-[300px] ml-auto">
                <span className="material-symbols-outlined text-on-surface-variant mr-2">search</span>
                <input className="bg-transparent border-none outline-none text-body-md focus:ring-0 w-full" placeholder="Cari kursus idamanmu..." type="text"/>
              </div>
            </section>

            {/* Course Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter pb-10">
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <div key={i} className="h-96 bg-surface-container-low border-2 border-on-surface animate-pulse shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"></div>
                ))
              ) : courses.length > 0 ? (
                courses.map((course) => (
                  <div 
                    key={course.id}
                    onClick={() => navigate(`/courses/${course.id}`)}
                    className="flex flex-col bg-surface-container-lowest border-2 border-on-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group"
                  >
                    <div className="h-48 border-b-2 border-on-surface relative">
                      <img className="w-full h-full object-cover" src={course.image_url || 'https://via.placeholder.com/400x200'} alt={course.title} />
                      <div className="absolute top-4 left-4 bg-tertiary text-white px-3 py-1 border-2 border-on-surface font-black uppercase text-xs">
                        {course.category}
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <h3 className="font-headline-md text-headline-md mb-2 line-clamp-2">{course.title}</h3>
                      <p className="text-on-surface-variant font-body-md text-sm mb-4 italic">Oleh {course.instructor}</p>
                      <div className="mt-auto pt-4 border-t-2 border-on-surface/10 flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="font-label-bold text-xs">4.9</span>
                        </div>
                        <span className="font-headline-md text-primary text-lg">{formatPrice(course.price)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center border-4 border-dashed border-on-surface bg-surface-container-low rounded-2xl">
                  <span className="material-symbols-outlined text-6xl opacity-20 mb-4">folder_off</span>
                  <h3 className="font-headline-md text-2xl">Belum ada kursus tersedia</h3>
                  <p className="text-on-surface-variant mt-2">Silakan tambahkan data kursus di dashboard Supabase kamu.</p>
                </div>
              )}
            </section>

            {/* Trending Topics Section */}
            <section className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="font-headline-lg text-headline-lg">Topik Populer</h2>
                <a className="font-label-bold text-primary flex items-center gap-1 hover:underline" href="#">Lihat Semua <span className="material-symbols-outlined text-sm">arrow_forward</span></a>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {["Cyber Security", "Product Mgmt", "Deep Learning", "Blockchain", "Motion Design", "Cloud Arch"].map((topic, i) => (
                  <div key={i} className="p-4 border-2 border-on-surface bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center hover:bg-primary-fixed transition-all cursor-pointer">
                    <span className="font-label-bold">{topic}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Footer Content */}
            <footer className="mt-12 border-t-2 border-on-surface p-margin-desktop bg-surface-container-low -mx-margin-desktop">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                <div>
                  <h4 className="font-headline-md text-headline-md mb-4 text-primary">Lumina</h4>
                  <p className="text-on-surface-variant font-body-md max-w-xs">Platform edukasi masa depan dengan pendekatan praktis dan terukur untuk profesional modern.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <h5 className="font-label-bold mb-2">Tautan Cepat</h5>
                  <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Tentang Kami</a>
                  <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Menjadi Instruktur</a>
                  <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Program Afiliasi</a>
                </div>
                <div className="flex flex-col gap-4">
                  <h5 className="font-label-bold mb-2">Dapatkan Update</h5>
                  <div className="flex border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    <input className="flex-grow p-3 bg-white outline-none" placeholder="Email Anda" type="email"/>
                    <button className="bg-on-surface text-white px-6 font-label-bold">Daftar</button>
                  </div>
                </div>
              </div>
              <div className="mt-12 pt-8 border-t-2 border-on-surface/10 text-center text-sm font-label-bold text-on-surface-variant">
                © 2024 Lumina Learning. Crafted with Soft Brutalism.
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Catalog;
