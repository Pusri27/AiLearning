import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const Achievements = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-surface text-on-surface font-body-md flex h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 h-full overflow-y-auto bg-background p-8 md:p-10">
        {/* Header Section */}
        <header className="mb-12 border-b-4 border-on-surface pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-headline-xl text-on-surface mb-2">Pencapaian & Sertifikat</h1>
            <p className="font-body-lg text-on-surface-variant">Lacak perkembangan belajarmu dan rayakan setiap langkah.</p>
          </div>
          {/* Quick Stats Bento */}
          <div className="flex gap-4">
            <div className="bg-primary-container brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg p-4 flex flex-col items-center justify-center min-w-[140px]">
              <span className="font-headline-md text-on-primary-container">12</span>
              <span className="font-label-bold text-on-surface-variant">Total Sertifikat</span>
            </div>
            <div className="bg-secondary-fixed brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg p-4 flex flex-col items-center justify-center min-w-[140px]">
              <span className="font-headline-md text-on-secondary-container">24</span>
              <span className="font-label-bold text-on-surface-variant">Total Lencana</span>
            </div>
          </div>
        </header>

        {/* Sertifikat Saya Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
            <h2 className="font-headline-lg text-on-surface">Sertifikat Saya</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Certificate Card 1 */}
            <div className="bg-white border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl flex flex-col overflow-hidden hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="h-44 bg-surface-variant border-b-4 border-on-surface relative flex items-center justify-center overflow-hidden">
                <img alt="Certificate background" className="absolute inset-0 w-full h-full object-cover opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4JYNzJ-OgOtafCvmLYUhz3Xzp5gBbrAM5uGEiQGYY6Oj_tB0jwbXcuhxLn9kZOjlBOIgIwMuEIYAcKV4QVPne3Uqyc9nUJ-6AWrjxeD2SxTlacoaaGmee3RqqMFr_pCQo0JAK_aq6Xz9qt8D3ulf-tzIfNdVAmSY4OJ-zxkgyWFrU-wLzi60jv5R7wXFTYfE7DV1PQW2WrAD4r-nry_TvF4OS8fjuKS407NpiuIEG7Np3ggzKE8vr5VVK6hBjsfWfX1uezIAOyuw"/>
                <div className="relative z-10 bg-primary-container border-2 border-on-surface px-4 py-2 rounded-full rotate-[-5deg] font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  Lulus Terbaik
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-headline-md text-on-surface mb-2">Desain UX Lanjutan</h3>
                <p className="font-body-md text-on-surface-variant mb-6 flex-1">Diselesaikan pada 12 Okt 2023</p>
                <button className="bg-primary text-on-primary border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg py-3 px-4 font-label-bold flex items-center justify-center gap-2 w-full hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-0 active:translate-y-0 transition-all">
                  <span className="material-symbols-outlined">download</span>
                  Unduh PDF
                </button>
              </div>
            </div>
            {/* Certificate Card 2 */}
            <div className="bg-white border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl flex flex-col overflow-hidden hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="h-44 bg-surface-variant border-b-4 border-on-surface relative flex items-center justify-center overflow-hidden">
                <img alt="Certificate background" className="absolute inset-0 w-full h-full object-cover opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTu_tZO6g086yDPNJW_g-eEOTMbBnfRHJ-Lh05O09IhLn9VP1fYK04Bf87c3BT_ENND3t2kwcq8V6Z3xNvOVwFiY2hc-06wYBHe9JtvbPvNXG_N6zySng5nsd1r8-i2WxC0JZD74aLY5fTdCZ0bwukHWwbTrU4xaPcBejwjwtWtONEv4K0DsIiNOQ1Ma0e6Ec7vUDCztxtypS7EOfWlf5qK9wlK4QdSrcYDU4GJgqQjOb33hnxfZu7ymiI9jAFyEQsb0d2_zTWhM4"/>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-headline-md text-on-surface mb-2">Fundamental JavaScript</h3>
                <p className="font-body-md text-on-surface-variant mb-6 flex-1">Diselesaikan pada 05 Sep 2023</p>
                <button className="bg-primary text-on-primary border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg py-3 px-4 font-label-bold flex items-center justify-center gap-2 w-full hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-0 active:translate-y-0 transition-all">
                  <span className="material-symbols-outlined">download</span>
                  Unduh PDF
                </button>
              </div>
            </div>
            {/* Empty State / Keep Going */}
            <div className="bg-tertiary-container border-4 border-dashed border-on-surface rounded-xl flex flex-col items-center justify-center p-8 text-center min-h-[300px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="material-symbols-outlined text-5xl text-on-tertiary-container mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
              <h3 className="font-headline-md text-on-surface mb-2">Terus Belajar!</h3>
              <p className="font-body-md text-on-surface-variant mb-6">Selesaikan kursus lain untuk menambah koleksi sertifikatmu.</p>
              <button 
                onClick={() => navigate('/catalog')}
                className="bg-surface text-on-surface border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg py-2 px-6 font-label-bold hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
              >
                Jelajahi Katalog
              </button>
            </div>
          </div>
        </section>

        {/* Lencana (Badges) Section */}
        <section>
          <div className="flex items-center gap-3 mb-8 pb-4 border-b-4 border-on-surface">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
            <h2 className="font-headline-lg text-on-surface">Lencana (Badges)</h2>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Sudah Didapat (Earned) */}
            <div className="bg-surface-container-low border-4 border-on-surface rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-headline-md text-on-surface mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                Sudah Didapat
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {[
                  { title: '7 Hari Beruntun', icon: 'local_fire_department', color: 'bg-primary-container' },
                  { title: 'Pemikir Kritis', icon: 'lightbulb', color: 'bg-secondary-container' },
                  { title: 'Forum Aktif', icon: 'forum', color: 'bg-tertiary-container' }
                ].map((badge, idx) => (
                  <div key={idx} className="bg-white border-2 border-on-surface rounded-lg p-4 flex flex-col items-center text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-transform cursor-pointer">
                    <div className={`w-16 h-16 ${badge.color} border-2 border-on-surface rounded-full flex items-center justify-center mb-3`}>
                      <span className="material-symbols-outlined text-[32px] text-on-surface" style={{ fontVariationSettings: "'FILL' 1" }}>{badge.icon}</span>
                    </div>
                    <span className="font-label-bold text-on-surface text-sm">{badge.title}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Belum Terbuka (Locked) */}
            <div className="bg-surface-variant border-4 border-on-surface rounded-xl p-6 opacity-75 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-headline-md text-on-surface-variant mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined">lock</span>
                Belum Terbuka
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {[
                  { title: 'Penyelesaian Cepat', icon: 'rocket_launch' },
                  { title: 'Mentor Sebaya', icon: 'groups' }
                ].map((badge, idx) => (
                  <div key={idx} className="bg-surface border-2 border-dashed border-on-surface rounded-lg p-4 flex flex-col items-center text-center grayscale">
                    <div className="w-16 h-16 bg-surface-dim border-2 border-dashed border-on-surface rounded-full flex items-center justify-center mb-3 text-on-surface-variant/50">
                      <span className="material-symbols-outlined text-[32px]">{badge.icon}</span>
                    </div>
                    <span className="font-label-bold text-on-surface-variant text-sm">{badge.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Achievements;
