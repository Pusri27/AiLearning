import React from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileDropdown from '../components/ProfileDropdown';
import Icon from '../components/Icon';

const Pricing = () => {
  const navigate = useNavigate();

  return (
    <div className="text-on-surface bg-background font-plus-jakarta flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">

        <main className="flex-1">
          {/* Hero Title */}
          <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-12 pb-8 text-center">
            <h1 className="text-headline-lg md:text-headline-xl mb-4">Pilih Paket Belajar Anda</h1>
            <p className="text-body-lg max-w-2xl mx-auto text-on-surface-variant">
              Buka potensi AI sepenuhnya untuk perjalanan belajarmu. Pilih paket yang sesuai dengan kebutuhan belajarmu mulai dari dasar hingga profesional.
            </p>
          </section>

          {/* Pricing Grid */}
          <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              {/* Free Plan */}
              <div className="brutal-border brutal-shadow bg-surface-container-lowest p-8 rounded-xl flex flex-col">
                <div className="mb-6">
                  <span className="brutal-border bg-surface-container-highest px-3 py-1 rounded-full text-xs font-bold uppercase">Beginner</span>
                  <h2 className="text-headline-md mt-4">Free</h2>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-extrabold">Rp 0</span>
                    <span className="text-on-surface-variant font-medium">/bulan</span>
                  </div>
                </div>
                <p className="text-sm mb-8 text-on-surface-variant">Sangat cocok untuk kamu yang baru ingin mencoba belajar dengan asisten AI.</p>
                <ul className="space-y-4 mb-10 flex-1">
                  <li className="flex items-center gap-3">
                    <Icon name="check_circle" className="w-5 h-5 text-primary" />
                    <span className="text-sm">Akses Dasar Kursus</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Icon name="check_circle" className="w-5 h-5 text-primary" />
                    <span className="text-sm">AI Tutor Standar (Limited)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Icon name="check_circle" className="w-5 h-5 text-primary" />
                    <span className="text-sm">Dukungan Komunitas</span>
                  </li>
                </ul>
                <button className="w-full brutal-border brutal-shadow-sm bg-surface-container hover:bg-surface-container-high py-3 rounded-lg font-bold transition-all">Mulai Gratis</button>
              </div>

              {/* Pro Plan (Highligted) */}
              <div className="brutal-border brutal-shadow bg-secondary-fixed p-8 rounded-xl flex flex-col relative transform md:-translate-y-4">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 brutal-border bg-primary-container px-4 py-1 rounded-full text-xs font-bold uppercase brutal-shadow-sm whitespace-nowrap">
                  Paling Populer ⭐
                </div>
                <div className="mb-6">
                  <span className="brutal-border bg-on-secondary-fixed-variant text-on-secondary px-3 py-1 rounded-full text-xs font-bold uppercase">Pro Learner</span>
                  <h2 className="text-headline-md mt-4">Pro</h2>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-extrabold">Rp 99.000</span>
                    <span className="text-on-surface-variant font-medium">/bulan</span>
                  </div>
                </div>
                <p className="text-sm mb-8 text-on-surface-variant">Optimalkan belajarmu dengan fitur AI tanpa batas dan sertifikasi resmi.</p>
                <ul className="space-y-4 mb-10 flex-1">
                  <li className="flex items-center gap-3">
                    <Icon name="star" className="w-5 h-5 text-secondary fill-current" />
                    <span className="text-sm font-bold">Unlimited AI Tutor 24/7</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Icon name="check_circle" className="w-5 h-5 text-secondary" />
                    <span className="text-sm">Mode Offline Tersedia</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Icon name="check_circle" className="w-5 h-5 text-secondary" />
                    <span className="text-sm">Sertifikat Resmi Terverifikasi</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Icon name="check_circle" className="w-5 h-5 text-secondary" />
                    <span className="text-sm">Personalized Study Path AI</span>
                  </li>
                </ul>
                <button className="w-full brutal-border brutal-shadow-sm bg-primary-container hover:bg-primary hover:text-on-primary py-4 rounded-lg font-extrabold text-lg transition-all">Upgrade ke Pro</button>
              </div>

              {/* Institution Plan */}
              <div className="brutal-border brutal-shadow bg-tertiary-fixed p-8 rounded-xl flex flex-col">
                <div className="mb-6">
                  <span className="brutal-border bg-on-tertiary-fixed-variant text-on-tertiary px-3 py-1 rounded-full text-xs font-bold uppercase">Organizational</span>
                  <h2 className="text-headline-md mt-4">Institution</h2>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-extrabold">Custom</span>
                  </div>
                </div>
                <p className="text-sm mb-8 text-on-surface-variant">Solusi terbaik untuk sekolah, universitas, atau tim korporasi.</p>
                <ul className="space-y-4 mb-10 flex-1">
                  <li className="flex items-center gap-3">
                    <Icon name="groups" className="w-5 h-5 text-tertiary" />
                    <span className="text-sm">Manajemen Tim & Dashboard</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Icon name="analytics" className="w-5 h-5 text-tertiary" />
                    <span className="text-sm">Analitik Belajar Kustom</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Icon name="support_agent" className="w-5 h-5 text-tertiary" />
                    <span className="text-sm">Dukungan Prioritas 1-on-1</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Icon name="integration_instructions" className="w-5 h-5 text-tertiary" />
                    <span className="text-sm">Integrasi LMS (Canvas/Moodle)</span>
                  </li>
                </ul>
                <button className="w-full brutal-border brutal-shadow-sm bg-surface-container-lowest hover:bg-tertiary hover:text-on-tertiary py-3 rounded-lg font-bold transition-all">Hubungi Sales</button>
              </div>
            </div>
          </section>

          {/* Feature Comparison */}
          <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16">
            <h2 className="text-headline-lg text-center mb-10">Perbandingan Detail Fitur</h2>
            <div className="overflow-x-auto brutal-border brutal-shadow rounded-xl bg-surface-container-lowest">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container border-b-2 border-on-surface">
                    <th className="p-6 font-bold text-lg">Fitur Utama</th>
                    <th className="p-6 font-bold text-center">Free</th>
                    <th className="p-6 font-bold text-center bg-secondary-fixed/30">Pro</th>
                    <th className="p-6 font-bold text-center">Institution</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Akses Perpustakaan Materi', free: true, pro: true, institution: true, icon: true },
                    { name: 'AI Tutor Response Time', free: 'Standar', pro: 'Instan', institution: 'Prioritas Tertinggi', icon: false },
                    { name: 'Sertifikat Digital', free: false, pro: true, institution: true, icon: true },
                    { name: 'Mode Offline (Mobile)', free: false, pro: true, institution: true, icon: true },
                    { name: 'Custom Learning Path', free: 'Template', pro: 'AI-Powered', institution: 'Organizational', icon: false },
                    { name: 'User Admin Dashboard', free: false, pro: false, institution: true, icon: true },
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b-2 border-on-surface/10">
                      <td className="p-6 font-medium">{row.name}</td>
                      <td className="p-6 text-center">
                        {row.icon ? (row.free ? <Icon name="check" className="w-5 h-5 text-primary mx-auto" /> : <Icon name="close" className="w-5 h-5 text-on-surface-variant mx-auto" />) : <span className="text-sm">{row.free}</span>}
                      </td>
                      <td className="p-6 text-center bg-secondary-fixed/10">
                        {row.icon ? (row.pro ? <Icon name="check" className="w-5 h-5 text-secondary mx-auto" /> : <Icon name="close" className="w-5 h-5 text-on-surface-variant mx-auto" />) : <span className="text-sm font-bold">{row.pro}</span>}
                      </td>
                      <td className="p-6 text-center">
                        {row.icon ? (row.institution ? <Icon name="check" className="w-5 h-5 text-tertiary mx-auto" /> : <Icon name="close" className="w-5 h-5 text-on-surface-variant mx-auto" />) : <span className="text-sm font-bold">{row.institution}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop py-16">
            <h2 className="text-headline-lg text-center mb-10">Pertanyaan Umum</h2>
            <div className="space-y-6">
              {[
                { q: 'Apakah saya bisa membatalkan langganan kapan saja?', a: 'Ya, Anda dapat membatalkan paket Pro kapan saja melalui pengaturan akun. Anda tetap akan memiliki akses Pro hingga akhir periode penagihan saat ini.' },
                { q: 'Metode pembayaran apa saja yang tersedia?', a: 'Kami menerima pembayaran melalui Kartu Kredit, GoPay, OVO, Dana, ShopeePay, dan Transfer Bank Virtual Account.' },
                { q: 'Apakah ada diskon untuk pelajar?', a: 'Kami menawarkan harga khusus untuk pelajar dengan verifikasi email institusi atau kartu tanda mahasiswa. Silakan hubungi tim dukungan kami.' },
              ].map((faq, idx) => (
                <div key={idx} className="brutal-border brutal-shadow-sm p-6 rounded-lg bg-surface-container-lowest">
                  <h3 className="text-lg font-bold mb-2">{faq.q}</h3>
                  <p className="text-on-surface-variant">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Bottom CTA */}
          <section className="bg-primary-container border-y-2 border-on-surface py-16 overflow-hidden relative">
            <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center relative z-10">
              <h2 className="text-headline-lg mb-6">Siap untuk Mengakselerasi Belajarmu?</h2>
              <p className="text-xl mb-10 font-medium">Bergabunglah dengan ribuan pelajar yang sudah merasakan manfaat AI Tutor Harin.</p>
              <nav className="hidden md:flex items-center justify-center gap-8">
            <NavLink to="/catalog" className="font-label-bold text-on-surface hover:text-primary transition-colors">Kursus</NavLink>
            <NavLink to="/courses" className="font-label-bold text-on-surface hover:text-primary transition-colors">Sertifikasi</NavLink>
            <button 
              onClick={() => navigate('/login')}
              className="bg-primary text-on-primary brutal-border px-8 py-3 font-label-bold text-label-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
            >
              Masuk
            </button>
          </nav>
            </div>
            {/* Abstract Brutalist Shapes */}
            <div className="absolute -right-20 -top-20 size-64 brutal-border bg-secondary-container rounded-full opacity-20"></div>
            <div className="absolute -left-20 -bottom-20 size-64 brutal-border bg-tertiary-container rotate-12 opacity-20"></div>
          </section>
        </main>

        {/* Footer Component */}
        <footer className="bg-surface-container-lowest border-t-2 border-on-surface pt-16 pb-28 md:pb-8">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-4 gap-gutter mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="size-6 text-primary">
                  <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z"></path>
                  </svg>
                </div>
                <span className="text-xl font-bold tracking-tight">Harin Learning</span>
              </div>
              <p className="text-sm text-on-surface-variant mb-6">Platform edukasi berbasis AI yang membantu setiap individu belajar lebih cerdas, bukan lebih keras.</p>
              <div className="flex gap-4">
                <a className="brutal-border brutal-shadow-sm bg-surface-container p-2 rounded-lg hover:bg-primary-container transition-all" href="#"><Icon name="share" className="w-5 h-5" /></a>
                <a className="brutal-border brutal-shadow-sm bg-surface-container p-2 rounded-lg hover:bg-primary-container transition-all" href="#"><Icon name="language" className="w-5 h-5" /></a>
                <a className="brutal-border brutal-shadow-sm bg-surface-container p-2 rounded-lg hover:bg-primary-container transition-all" href="#"><Icon name="mail" className="w-5 h-5" /></a>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-lg">Program</h4>
              <ul className="space-y-3 text-sm font-medium text-on-surface-variant">
                <li><a className="hover:text-primary" href="#">Kursus Coding</a></li>
                <li><a className="hover:text-primary" href="#">Data Science</a></li>
                <li><a className="hover:text-primary" href="#">Desain UI/UX</a></li>
                <li><a className="hover:text-primary" href="#">Manajemen Bisnis</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-lg">Perusahaan</h4>
              <ul className="space-y-3 text-sm font-medium text-on-surface-variant">
                <li><a className="hover:text-primary" href="#">Tentang Kami</a></li>
                <li><a className="hover:text-primary" href="#">Karir</a></li>
                <li><a className="hover:text-primary" href="#">Blog</a></li>
                <li><a className="hover:text-primary" href="#">Kerjasama</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-lg">Dukungan</h4>
              <ul className="space-y-3 text-sm font-medium text-on-surface-variant">
                <li><a className="hover:text-primary" href="#">Pusat Bantuan</a></li>
                <li><a className="hover:text-primary" href="#">Kebijakan Privasi</a></li>
                <li><a className="hover:text-primary" href="#">Syarat & Ketentuan</a></li>
                <li><a className="hover:text-primary" href="#">Kontak</a></li>
              </ul>
            </div>
          </div>
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-8 border-t border-on-surface/10 text-center">
            <p className="text-xs font-bold text-on-surface-variant">© 2024 Harin Learning. Dibuat dengan semangat untuk Pendidikan Indonesia.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Pricing;
