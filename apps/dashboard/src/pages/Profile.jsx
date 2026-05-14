import React from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileDropdown from '../components/ProfileDropdown';

const Profile = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen overflow-hidden bg-background font-body-md text-on-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="flex justify-between items-center px-margin-mobile md:px-margin-desktop h-20 w-full bg-surface-container-lowest border-b-2 border-on-surface shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] sticky top-0 z-10">
          <div className="md:hidden">
            <span className="font-headline-md text-headline-md font-extrabold text-on-surface">Lumina</span>
          </div>
          <div className="hidden md:block">
            <div className="relative">
              <input className="pl-10 pr-4 py-2 border-2 border-on-surface rounded-lg bg-surface-bright focus:ring-0 focus:border-primary transition-all" placeholder="Search courses..." type="text"/>
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="material-symbols-outlined text-primary text-2xl transition-transform duration-100 active:scale-95">notifications</button>
            <div 
              onClick={() => navigate('/profile')}
              className="flex items-center gap-3 p-1 border-2 border-primary rounded-full bg-primary-container shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            >
              <span className="material-symbols-outlined text-primary text-2xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
            </div>
          </div>
        </header>

        <main className="p-margin-mobile md:p-margin-desktop space-y-gutter max-w-container-max mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            <div className="lg:col-span-8 bg-surface-container-lowest border-2 border-on-surface p-gutter shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row gap-8 items-center md:items-start">
              <div className="relative">
                <img alt="User" className="w-32 h-32 md:w-48 md:h-48 object-cover border-[6px] border-on-surface shadow-[4px_4px_0px_0px_rgba(103,77,174,1)]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMy8b4vUUoGY1Hx7F_jG8ASnDhwdbPkskPEuyqv4Tjn2ngQqWsC1gbJQoic8F9iuz-dF8Wx24-vfTSW8PS2y_bGMm0X-G-tnY_Ja9lPWfcJOXWBrkbctmOCQn8prcyLUpRoXu02WwaSwviuFtqTNlTBmCBDxKBe-NJvJniWA2kbA54iGP0IaxjsQ5QWP4QppoUoeKUh_2IlqTAsSvdCInOzQXKaQA53cJ4D4Y3JQ-GBGkZ0Gr-4zyXmqKh6-GtrGFfpy6z3iKdMMk"/>
                <div className="absolute -bottom-2 -right-2 bg-primary-container border-2 border-on-surface p-2 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer">
                  <span className="material-symbols-outlined text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>edit</span>
                </div>
              </div>
              <div className="text-center md:text-left space-y-4">
                <div>
                  <h1 className="font-headline-xl text-headline-xl text-on-surface">Aditya Wijaya</h1>
                  <p className="font-body-lg text-body-lg text-on-surface-variant">Full-stack Developer & Lifelong Learner</p>
                </div>
                <p className="font-body-md text-body-md max-w-lg">
                  Bersemangat mempelajari arsitektur cloud dan UI/UX yang humanis. Sedang mengejar sertifikasi Advanced Node.js di Lumina Learning. Suka kopi dan eksplorasi Open Source.
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  <span className="bg-secondary-fixed text-on-secondary-fixed-variant px-4 py-1 border-2 border-on-surface font-label-bold text-label-bold">UI/UX Design</span>
                  <span className="bg-secondary-fixed text-on-secondary-fixed-variant px-4 py-1 border-2 border-on-surface font-label-bold text-label-bold">Backend Systems</span>
                  <span className="bg-secondary-fixed text-on-secondary-fixed-variant px-4 py-1 border-2 border-on-surface font-label-bold text-label-bold">Cloud Arch</span>
                </div>
              </div>
            </div>
            <div className="lg:col-span-4 grid grid-cols-1 gap-gutter">
              <div className="bg-primary-container border-2 border-on-surface p-gutter shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center items-center text-center">
                <span className="material-symbols-outlined text-4xl mb-2">military_tech</span>
                <p className="font-headline-lg text-headline-lg">24</p>
                <p className="font-label-bold text-label-bold uppercase">Sertifikat Selesai</p>
              </div>
              <div className="bg-secondary-container border-2 border-on-surface p-gutter shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center items-center text-center">
                <span className="material-symbols-outlined text-4xl mb-2">bolt</span>
                <p className="font-headline-lg text-headline-lg">15,420</p>
                <p className="font-label-bold text-label-bold uppercase">Lumina Points</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            <div className="bg-surface-container-lowest border-2 border-on-surface p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4">
              <div className="bg-tertiary-container border-2 border-on-surface p-3 rounded-lg">
                <span className="material-symbols-outlined text-on-tertiary-container">local_fire_department</span>
              </div>
              <div>
                <p className="font-label-bold text-label-bold text-on-surface-variant uppercase">Streak Hari Ini</p>
                <p className="font-headline-md text-headline-md">15 Hari</p>
              </div>
            </div>
            <div className="bg-surface-container-lowest border-2 border-on-surface p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4">
              <div className="bg-primary-fixed border-2 border-on-surface p-3 rounded-lg">
                <span className="material-symbols-outlined text-on-primary-fixed-variant">auto_stories</span>
              </div>
              <div>
                <p className="font-label-bold text-label-bold text-on-surface-variant uppercase">Kursus Aktif</p>
                <p className="font-headline-md text-headline-md">4 Kursus</p>
              </div>
            </div>
            <div className="bg-surface-container-lowest border-2 border-on-surface p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4">
              <div className="bg-secondary-fixed border-2 border-on-surface p-3 rounded-lg">
                <span className="material-symbols-outlined text-on-secondary-fixed-variant">schedule</span>
              </div>
              <div>
                <p className="font-label-bold text-label-bold text-on-surface-variant uppercase">Waktu Belajar</p>
                <p className="font-headline-md text-headline-md">128 Jam</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter pb-10">
            <div className="lg:col-span-1 bg-surface-container-lowest border-2 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">
              <div className="p-6 border-b-2 border-on-surface flex justify-between items-center bg-surface-container-low">
                <h2 className="font-headline-md text-headline-md">Pencapaian</h2>
                <span className="material-symbols-outlined text-on-surface-variant">workspace_premium</span>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4 flex-1">
                <div className="flex flex-col items-center text-center p-3 border-2 border-on-surface bg-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <div className="w-16 h-16 mb-2 bg-primary-container border-2 border-on-surface rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl">history_edu</span>
                  </div>
                  <p className="font-label-bold text-label-bold">Pioneer</p>
                </div>
                <div className="flex flex-col items-center text-center p-3 border-2 border-on-surface bg-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <div className="w-16 h-16 mb-2 bg-secondary-container border-2 border-on-surface rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl">rocket_launch</span>
                  </div>
                  <p className="font-label-bold text-label-bold">Fast Learner</p>
                </div>
                <div className="flex flex-col items-center text-center p-3 border-2 border-on-surface bg-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <div className="w-16 h-16 mb-2 bg-tertiary-container border-2 border-on-surface rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl">forum</span>
                  </div>
                  <p className="font-label-bold text-label-bold">Helpful Soul</p>
                </div>
                <div className="flex flex-col items-center text-center p-3 border-2 border-on-surface bg-surface-variant shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] opacity-50 grayscale">
                  <div className="w-16 h-16 mb-2 bg-outline-variant border-2 border-on-surface rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl">lock</span>
                  </div>
                  <p className="font-label-bold text-label-bold">Elite Coder</p>
                </div>
              </div>
              <button className="m-6 py-2 border-2 border-on-surface font-label-bold text-label-bold hover:bg-surface-container transition-all">
                Lihat Semua (12)
              </button>
            </div>
            <div className="lg:col-span-2 bg-surface-container-lowest border-2 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">
              <div className="p-6 border-b-2 border-on-surface flex justify-between items-center bg-surface-container-low">
                <h2 className="font-headline-md text-headline-md">Riwayat Aktivitas</h2>
                <span className="material-symbols-outlined text-on-surface-variant">timeline</span>
              </div>
              <div className="flex-1 divide-y-2 divide-on-surface">
                {[
                  { icon: 'check_circle', color: 'bg-primary-container', title: 'Menyelesaikan Kursus', desc: 'Advanced React Patterns: State Management & Hooks', time: '2 Jam yang lalu' },
                  { icon: 'emoji_events', color: 'bg-secondary-container', title: 'Meraih Badge Baru', desc: 'Fast Learner: Selesaikan 5 pelajaran dalam 1 jam.', time: 'Kemarin' },
                  { icon: 'comment', color: 'bg-tertiary-container', title: 'Memberikan Komentar', desc: '"Penjelasan yang sangat bagus tentang goroutines!" di forum Go Fundamentals.', time: '2 Hari yang lalu' },
                  { icon: 'star', color: 'bg-primary-fixed', title: 'Update Profil', desc: 'Mengubah foto profil dan bio pengguna.', time: 'Minggu lalu' }
                ].map((item, idx) => (
                  <div key={idx} className="p-6 flex items-start gap-4 hover:bg-secondary-fixed transition-colors">
                    <div className={`mt-1 flex-shrink-0 w-10 h-10 border-2 border-on-surface ${item.color} flex items-center justify-center`}>
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="font-label-bold text-label-bold text-on-surface">{item.title}</p>
                        <p className="text-xs font-label-bold text-on-surface-variant">{item.time}</p>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface-variant">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t-2 border-on-surface flex justify-around items-center h-16 z-50">
        <NavLink to="/" className="flex flex-col items-center justify-center text-on-surface-variant">
          <span className="material-symbols-outlined">dashboard</span>
        </NavLink>
        <NavLink to="/catalog" className="flex flex-col items-center justify-center text-on-surface-variant">
          <span className="material-symbols-outlined">menu_book</span>
        </NavLink>
        <a className="flex flex-col items-center justify-center text-on-surface-variant" href="#">
          <span className="material-symbols-outlined">hub</span>
        </a>
        <NavLink to="/settings" className="flex flex-col items-center justify-center text-on-surface-variant">
          <span className="material-symbols-outlined">settings</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default Profile;
