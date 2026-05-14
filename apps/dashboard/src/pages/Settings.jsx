import React from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const Settings = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-background text-on-background font-body-md h-screen overflow-hidden">
      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full overflow-y-auto">
          {/* TopAppBar */}
          <header className="flex justify-between items-center px-margin-desktop h-20 w-full bg-surface-container-lowest border-b-2 border-on-surface shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <h2 className="font-headline-md text-headline-md font-extrabold text-on-surface">Settings</h2>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden lg:flex items-center bg-surface-container border-2 border-on-surface px-3 py-1.5 w-64 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <span className="material-symbols-outlined text-on-surface-variant mr-2">search</span>
                <input className="bg-transparent border-none focus:ring-0 text-body-md w-full" placeholder="Search settings..." type="text"/>
              </div>
              <div className="flex items-center gap-4">
                <button className="material-symbols-outlined p-2 hover:bg-surface-variant transition-transform duration-100 active:scale-95">notifications</button>
                <div className="w-10 h-10 border-2 border-on-surface overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZA0gZc59nta0-SDs4RYazk2Klwk6zDuS51FYHZ9W_nYfIC96tgWLbPPROiMApLI9ygdzYpNsxRo4JkmFTa8jr6NDCBtk1L_GalQG4jvamQMdLsRt1XR9Ce4Hrly_vPNgL8LlTxUbFo3_tG4J5FAwc9mIVbwim6xJsqcMcDQO6rfBvT6ies5wVDEQisy26465TgJimIy9tYS4WSFjUo-YYsqkTONfqHIBzzLXbnoyjTieBe9g_YXmdhxcnI5ujUKzB4QODkUeqcHo" alt="Avatar"/>
                </div>
              </div>
            </div>
          </header>

          <div className="p-margin-desktop space-y-12 max-w-5xl mx-auto w-full">
            {/* Account Section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              <div className="md:col-span-1">
                <h3 className="font-headline-lg text-headline-lg text-on-surface">Akun</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2">Kelola informasi profil dan detail identitas Anda.</p>
              </div>
              <div className="md:col-span-2 space-y-6">
                <div className="bg-surface-container-lowest border-2 border-on-surface p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="relative">
                      <div className="w-24 h-24 border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmhJp6fSyg3SS9IlxqJA8Bev4qU6JXgEH6EtEZnnJg2DubslKybUP8R5uXnT-v5DVUMCl_w94_wycpdJqyebwg4-sJ4dwy3UjXxuy4THxN-RLimIgHUIzn6NhyJHjVFGb4KhIDy3G4QeNzBrL872T0bqQe-XjawrNNMDtEyyGa3GYmVU_UCtwuyKLLnwE4-YbBWdO4wXXuFAULWzga1ZTcUxWFyEmoo7cMtaHEfhWc30lgzzWyGJHJbwt3ZpIsfTOgkDyF4LGNu1I" alt="Budi Santoso"/>
                      </div>
                      <button className="absolute -bottom-2 -right-2 bg-primary-container border-2 border-on-surface p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all">
                        <span className="material-symbols-outlined text-on-surface">edit</span>
                      </button>
                    </div>
                    <div>
                      <h4 className="font-headline-md text-headline-md">Budi Santoso</h4>
                      <p className="font-body-md text-body-md text-on-surface-variant">Premium Learner • Sejak 2023</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="group">
                      <label className="block font-label-bold text-label-bold mb-1.5 uppercase text-on-surface-variant">Nama Lengkap</label>
                      <input className="w-full bg-white border-2 border-on-surface px-4 py-3 font-body-md text-body-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-0 focus:border-primary transition-all outline-none" type="text" defaultValue="Budi Santoso"/>
                    </div>
                    <div className="group">
                      <label className="block font-label-bold text-label-bold mb-1.5 uppercase text-on-surface-variant">Email</label>
                      <input className="w-full bg-white border-2 border-on-surface px-4 py-3 font-body-md text-body-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-0 focus:border-primary transition-all outline-none" type="email" defaultValue="budi.santoso@email.com"/>
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end">
                    <button className="bg-primary text-on-primary border-2 border-on-surface py-3 px-8 font-label-bold text-label-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all">Simpan Perubahan</button>
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-t-2 border-on-surface"/>

            {/* Preferences Section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              <div className="md:col-span-1">
                <h3 className="font-headline-lg text-headline-lg text-on-surface">Preferensi Belajar</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2">Sesuaikan pengalaman belajar Anda agar lebih optimal.</p>
              </div>
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-surface-container border-2 border-on-surface p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
                  <div>
                    <span className="material-symbols-outlined text-secondary text-4xl mb-4">timer</span>
                    <h4 className="font-label-bold text-label-bold uppercase mb-2">Target Harian</h4>
                    <p className="text-body-md text-on-surface-variant">Setel durasi waktu belajar minimum setiap hari.</p>
                  </div>
                  <div className="mt-6 flex items-center justify-between bg-white border-2 border-on-surface p-2">
                    <span className="font-bold px-2">45 Menit</span>
                    <div className="flex gap-1">
                      <button className="w-8 h-8 bg-surface-variant border border-on-surface flex items-center justify-center">-</button>
                      <button className="w-8 h-8 bg-surface-variant border border-on-surface flex items-center justify-center">+</button>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-container border-2 border-on-surface p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
                  <div>
                    <span className="material-symbols-outlined text-tertiary text-4xl mb-4">language</span>
                    <h4 className="font-label-bold text-label-bold uppercase mb-2">Bahasa Konten</h4>
                    <p className="text-body-md text-on-surface-variant">Pilih bahasa utama untuk materi pelajaran.</p>
                  </div>
                  <div className="mt-6">
                    <select className="w-full bg-white border-2 border-on-surface px-3 py-2 font-body-md focus:ring-0">
                      <option>Bahasa Indonesia</option>
                      <option>English (US)</option>
                      <option>日本語</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-t-2 border-on-surface"/>

            {/* Security Section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter pb-20">
              <div className="md:col-span-1">
                <h3 className="font-headline-lg text-headline-lg text-on-surface">Notifikasi & Keamanan</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2">Kontrol keamanan akun dan bagaimana kami menghubungi Anda.</p>
              </div>
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between bg-surface-container-lowest border-2 border-on-surface p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-secondary-fixed border-2 border-on-surface flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-secondary-container">notifications_active</span>
                    </div>
                    <div>
                      <h5 className="font-label-bold text-label-bold">Notifikasi Email</h5>
                      <p className="text-body-md text-on-surface-variant">Update mingguan dan pengumuman kursus.</p>
                    </div>
                  </div>
                  <div className="relative inline-block w-12 h-6 transition duration-200 ease-in bg-primary border-2 border-on-surface cursor-pointer">
                    <div className="absolute left-6 top-0.5 bg-white border border-on-surface w-4 h-4 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-surface-container-lowest border-2 border-on-surface p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-tertiary-container border-2 border-on-surface flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-tertiary-container">lock</span>
                    </div>
                    <div>
                      <h5 className="font-label-bold text-label-bold">Autentikasi Dua Faktor</h5>
                      <p className="text-body-md text-on-surface-variant">Tambahkan lapisan keamanan ekstra ke akun Anda.</p>
                    </div>
                  </div>
                  <button className="border-2 border-on-surface px-4 py-1.5 font-label-bold text-label-bold hover:bg-on-surface hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Aktifkan</button>
                </div>
                <div className="flex items-center justify-between bg-surface-container-lowest border-2 border-on-surface p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-fixed border-2 border-on-surface flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-primary-fixed">password</span>
                    </div>
                    <div>
                      <h5 className="font-label-bold text-label-bold">Ubah Kata Sandi</h5>
                      <p className="text-body-md text-on-surface-variant">Disarankan untuk mengganti sandi setiap 6 bulan.</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined cursor-pointer hover:translate-x-1 transition-transform">chevron_right</span>
                </div>

                <div className="mt-12 pt-8 border-t-2 border-on-surface border-dashed">
                  <div className="bg-error-container border-2 border-error p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
                    <h4 className="font-headline-md text-headline-md text-on-error-container mb-2">Zona Berbahaya</h4>
                    <p className="text-body-md text-on-error-container mb-6">Menghapus akun Anda bersifat permanen dan tidak dapat dibatalkan. Semua data belajar akan hilang.</p>
                    <button className="bg-error text-on-error border-2 border-on-surface py-2 px-6 font-label-bold text-label-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all">Hapus Akun Selamanya</button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
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
        <NavLink to="/settings" className="flex flex-col items-center justify-center text-primary font-bold">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>settings</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default Settings;
