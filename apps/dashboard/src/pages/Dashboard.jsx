import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileDropdown from '../components/ProfileDropdown';
import { supabase } from '../lib/supabaseClient';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserDataAndEnrollments = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      setUser(session.user);

      // Check role and redirect if teacher
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role === 'teacher') {
        navigate('/teacher/dashboard');
        return;
      }

      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          courses (*)
        `)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error fetching enrollments:', error);
      } else {
        setEnrolledCourses(data.map(e => e.courses));
      }
      setLoading(false);
    };

    fetchUserDataAndEnrollments();
  }, [navigate]);

  return (
    <div className="flex h-screen bg-background text-on-surface overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex justify-between items-center px-margin-mobile md:px-margin-desktop h-20 w-full bg-surface-container-lowest border-b-2 border-on-surface shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] z-10 shrink-0">
          <h2 className="font-headline-md text-headline-md font-extrabold text-on-surface">Dashboard Siswa</h2>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center bg-white border-2 border-on-surface px-4 py-2 w-64 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="material-symbols-outlined mr-2 text-on-surface-variant">search</span>
              <input className="border-none focus:ring-0 p-0 text-body-md w-full" placeholder="Search courses..." type="text"/>
            </div>
            <div className="flex items-center gap-4">
              <button className="material-symbols-outlined text-on-surface-variant hover:scale-110 transition-transform">notifications</button>
              <ProfileDropdown />
            </div>
          </div>
        </header>

        <main className="flex-1 p-margin-mobile md:p-margin-desktop overflow-y-auto">
          <section className="mb-10 relative overflow-hidden bg-primary-container border-2 border-on-surface p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="max-w-2xl relative z-10 text-center md:text-left">
              <h2 className="font-headline-xl text-headline-xl mb-4 text-on-surface">
                Selamat Datang, {user?.user_metadata?.full_name || 'Pelajar'}!
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">Anda telah menyelesaikan 75% dari target belajar minggu ini. Teruslah berkarya dan raih mimpimu bersama Lumina.</p>
              <button className="px-8 py-4 bg-on-surface text-white font-headline-md rounded-none border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(67,67,67,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0 active:translate-y-0 active:shadow-none">
                Lanjut Belajar
              </button>
            </div>
            <div className="w-64 h-64 md:w-80 md:h-80 relative flex-shrink-0">
              <img alt="Learning Mascot" className="w-full h-full object-cover border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPxS3rHgCDUi2RiRJAk3T9rRa5LTeFOxPc8yTyzxZx8pQ1cmcKlmG1n42AlSbxDbSfv7coomqUuKwrYrJRZPOk6L7ycFT3fnQ1UXsi7FbN38AUAJnYmwDZKpx59Hv0T-hrmLisFweM41Z66e2JWUb4MjWI8XszSJ01GrJdMNYlBnReVjzE7g1ByTGzF7Yy9U4pP-lIw2O8b_0DY4tQzKQSr2WApsS8jEAARdZDYysouQMMlZF6uXLkKRGAbz7RLFNcGEoV29d1ryg"/>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter pb-10">
            <div className="lg:col-span-8 space-y-gutter">
              <h3 className="font-headline-lg text-headline-lg text-on-surface">Kursus Aktif</h3>
              
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                   <div className="h-64 bg-surface-container-low border-2 border-on-surface animate-pulse shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"></div>
                   <div className="h-64 bg-surface-container-low border-2 border-on-surface animate-pulse shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"></div>
                </div>
              ) : enrolledCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                  {enrolledCourses.map((course) => (
                    <div 
                      key={course.id}
                      onClick={() => navigate(`/courses/${course.id}`)}
                      className="bg-surface-container-low border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all group cursor-pointer"
                    >
                      <div className="h-40 overflow-hidden border-b-2 border-on-surface">
                        <img className="w-full h-full object-cover group-hover:scale-105 transition-transform" src={course.image_url || 'https://via.placeholder.com/400x200'} alt={course.title}/>
                      </div>
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                          <span className="px-3 py-1 bg-tertiary-container border-2 border-on-surface font-label-bold text-label-bold text-on-surface">{course.category}</span>
                          <span className="font-headline-md text-headline-md text-on-surface">0%</span>
                        </div>
                        <h4 className="font-headline-md text-headline-md mb-4 text-on-surface line-clamp-1">{course.title}</h4>
                        <div className="mt-auto">
                          <div className="w-full h-6 bg-white border-2 border-on-surface relative overflow-hidden mb-2">
                            <div className="absolute top-0 left-0 h-full bg-primary" style={{ width: '0%' }}></div>
                          </div>
                          <p className="font-body-md text-body-md text-on-surface-variant">Belum dimulai</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 px-6 border-4 border-dashed border-on-surface bg-surface-container-lowest rounded-2xl text-center">
                  <span className="material-symbols-outlined text-5xl mb-4 opacity-30">school</span>
                  <h4 className="font-headline-md text-xl mb-2">Belum ada kursus aktif</h4>
                  <p className="text-on-surface-variant mb-6">Mulai petualangan belajarmu dengan memilih kursus dari katalog.</p>
                  <button 
                    onClick={() => navigate('/catalog')}
                    className="px-6 py-2 bg-primary text-white border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-label-bold"
                  >
                    Buka Katalog
                  </button>
                </div>
              )}

              <div className="bg-white border-2 border-on-surface p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="font-headline-md text-headline-md mb-6 flex items-center gap-2 text-on-surface">
                  <span className="material-symbols-outlined text-primary">play_circle</span>
                  Pelajaran Selanjutnya
                </h3>
                <div className="space-y-4">
                  {[
                    { id: '01', title: 'Optimasi Performa Web', duration: '45 Menit' },
                    { id: '02', title: 'Desain untuk Aksesibilitas', duration: '30 Menit' },
                    { id: '03', title: 'Dasar-dasar Animasi CSS', duration: '55 Menit' },
                  ].map((lesson) => (
                    <div key={lesson.id} className="flex items-center justify-between p-4 border-2 border-on-surface bg-surface-container-low hover:bg-primary-container transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white border-2 border-on-surface flex items-center justify-center font-black">{lesson.id}</div>
                        <div>
                          <p className="font-label-bold text-label-bold">{lesson.title}</p>
                          <p className="text-sm text-on-surface-variant">Durasi: {lesson.duration}</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-gutter">
              <div className="bg-white border-2 border-on-surface p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="font-headline-md text-headline-md mb-6 text-on-surface">Aktivitas Belajar</h3>
                <div className="h-48 flex items-end justify-between gap-2 px-2">
                  <div className="w-full bg-primary-container border-2 border-on-surface h-[30%]"></div>
                  <div className="w-full bg-primary-container border-2 border-on-surface h-[60%]"></div>
                  <div className="w-full bg-primary-container border-2 border-on-surface h-[45%]"></div>
                  <div className="w-full bg-primary border-2 border-on-surface h-[90%] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"></div>
                  <div className="w-full bg-primary-container border-2 border-on-surface h-[50%]"></div>
                  <div className="w-full bg-primary-container border-2 border-on-surface h-[75%]"></div>
                  <div className="w-full bg-primary-container border-2 border-on-surface h-[40%]"></div>
                </div>
                <div className="flex justify-between mt-4 font-label-bold text-[10px] text-on-surface-variant">
                  <span>SEN</span><span>SEL</span><span>RAB</span><span>KAM</span><span>JUM</span><span>SAB</span><span>MIN</span>
                </div>
              </div>

              <div className="bg-tertiary-container border-2 border-on-surface p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="font-headline-md text-headline-md mb-6 text-on-surface">Pencapaian</h3>
                <div className="flex flex-wrap gap-4">
                  <div className="w-16 h-16 bg-white border-2 border-on-surface flex items-center justify-center rotate-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" title="Fast Learner">
                    <span className="material-symbols-outlined text-tertiary text-4xl">bolt</span>
                  </div>
                  <div className="w-16 h-16 bg-white border-2 border-on-surface flex items-center justify-center -rotate-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" title="7 Day Streak">
                    <span className="material-symbols-outlined text-secondary text-4xl">local_fire_department</span>
                  </div>
                  <div className="w-16 h-16 bg-white border-2 border-on-surface flex items-center justify-center rotate-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" title="Top Contributor">
                    <span className="material-symbols-outlined text-primary text-4xl">star</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-container-lowest border-t-2 border-on-surface flex justify-around items-center z-30">
        <button onClick={() => navigate('/')} className="text-primary"><span className="material-symbols-outlined text-3xl">dashboard</span></button>
        <button onClick={() => navigate('/catalog')} className="text-on-surface-variant"><span className="material-symbols-outlined text-3xl">menu_book</span></button>
        <button onClick={() => navigate('/hub')} className="text-on-surface-variant"><span className="material-symbols-outlined text-3xl">hub</span></button>
        <button onClick={() => navigate('/courses')} className="text-on-surface-variant"><span className="material-symbols-outlined text-3xl">school</span></button>
      </nav>
    </div>
  );
};

export default Dashboard;
