import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Icon from '../components/Icon';

const Help = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-background text-on-background font-body-md flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <main className="max-w-container-max mx-auto px-margin-mobile lg:px-margin-desktop py-12">
        {/* Hero Search Section */}
        <section className="mb-16">
          <div className="brutal-border rounded-xl p-8 md:p-16 bg-secondary-container flex flex-col items-center text-center relative overflow-hidden soft-brutal-shadow">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(#000 2px, transparent 2px)", backgroundSize: "24px 24px" }}></div>
            <h2 className="font-headline-xl text-on-secondary-container mb-4 relative z-10">Ada yang bisa kami bantu?</h2>
            <p className="font-body-lg text-on-secondary-container mb-10 max-w-2xl relative z-10">
              Temukan panduan, tutorial, dan jawaban dari pertanyaan yang sering diajukan di ekosistem belajar Harin.
            </p>
            <div className="w-full max-w-2xl relative z-10">
              <div className="flex brutal-border rounded-xl bg-white soft-brutal-shadow group transition-all focus-within:translate-x-1 focus-within:translate-y-1 focus-within:shadow-none">
                <div className="flex items-center justify-center pl-6 text-on-surface-variant">
                  <Icon name="search" className="w-6 h-6" />
                </div>
                <input className="w-full py-5 px-4 bg-transparent border-none focus:ring-0 text-body-md font-medium placeholder:text-outline" placeholder="Ketik masalah atau pertanyaan Anda di sini..." type="text"/>
                <button className="bg-primary-container brutal-border border-y-0 border-r-0 border-l-2 px-8 font-label-bold rounded-r-[10px] hover:bg-yellow-400 transition-colors">
                  Cari
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="mb-16">
          <h3 className="font-headline-lg mb-8">Kategori Populer</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {/* Category 1 */}
            <div className="brutal-border rounded-xl p-6 bg-surface-container-lowest soft-brutal-shadow soft-brutal-shadow-hover transition-all cursor-pointer group">
              <div className="w-14 h-14 bg-primary-fixed brutal-border rounded-lg flex items-center justify-center mb-6 group-hover:rotate-3 transition-transform">
                <Icon name="account_balance_wallet" className="w-8 h-8 text-on-primary-fixed fill-current" />
              </div>
              <h4 className="font-headline-md mb-2">Akun & Pembayaran</h4>
              <p className="text-on-surface-variant mb-6">Kelola profil, pengaturan keamanan, langganan, dan riwayat tagihan Anda secara mandiri.</p>
              <div className="flex items-center text-primary font-label-bold gap-2 group-hover:gap-4 transition-all">
                <span className="">Lihat Semua Artikel</span>
                <Icon name="arrow_forward" className="w-4 h-4" />
              </div>
            </div>
            {/* Category 2 */}
            <div className="brutal-border rounded-xl p-6 bg-surface-container-lowest soft-brutal-shadow soft-brutal-shadow-hover transition-all cursor-pointer group">
              <div className="w-14 h-14 bg-secondary-fixed brutal-border rounded-lg flex items-center justify-center mb-6 group-hover:-rotate-3 transition-transform">
                <Icon name="build" className="w-8 h-8 text-on-secondary-fixed fill-current" />
              </div>
              <h4 className="font-headline-md mb-2">Masalah Teknis</h4>
              <p className="text-on-surface-variant mb-6">Solusi untuk kendala akses video, pemuatan platform, sinkronisasi aplikasi, dan error sistem.</p>
              <div className="flex items-center text-secondary font-label-bold gap-2 group-hover:gap-4 transition-all">
                <span className="">Lihat Semua Artikel</span>
                <Icon name="arrow_forward" className="w-4 h-4" />
              </div>
            </div>
            {/* Category 3 */}
            <div className="brutal-border rounded-xl p-6 bg-surface-container-lowest soft-brutal-shadow soft-brutal-shadow-hover transition-all cursor-pointer group">
              <div className="w-14 h-14 bg-tertiary-fixed brutal-border rounded-lg flex items-center justify-center mb-6 group-hover:rotate-3 transition-transform">
                <Icon name="menu_book" className="w-8 h-8 text-on-tertiary-fixed fill-current" />
              </div>
              <h4 className="font-headline-md mb-2">Cara Belajar</h4>
              <p className="text-on-surface-variant mb-6">Panduan kurikulum, pengerjaan kuis, forum diskusi, dan cara klaim sertifikat kelulusan.</p>
              <div className="flex items-center text-tertiary font-label-bold gap-2 group-hover:gap-4 transition-all">
                <span className="">Lihat Semua Artikel</span>
                <Icon name="arrow_forward" className="w-4 h-4" />
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16 grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          <div className="lg:col-span-4">
            <h3 className="font-headline-lg mb-4">Pertanyaan Umum (FAQ)</h3>
            <p className="text-on-surface-variant mb-8">Tidak menemukan apa yang Anda cari? Berikut adalah jawaban dari pertanyaan yang paling sering diajukan oleh komunitas Harin.</p>
            <div className="brutal-border rounded-xl p-1 overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <img alt="Students collaborating" className="w-full h-48 object-cover rounded-lg" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPor1sfwqm-2XqxeqvEReTKDnl-bUDqREhxRrZ4L-yuWom_s4T-uL_VrRZ8Nb5yw0MjEgBws20LVow7dpk7fzYTr_08fCDDdXO5lg-UEIsjLvE5fOUcmOi8yL3ieP6Xa_LOVr6G7eoF4S_Dp9mSrSymj8Rlc-BuywOxIGaJ8_vISwNfdyk-CyKefzOfRh9TRIBsxndM-Ll7ALwxkf2DniZTKHuMKwLeuWK-kObHgVBerq8APBskuezoaLnz5-Pb1iveALLj2LjuWI"/>
            </div>
          </div>
          <div className="lg:col-span-8 flex flex-col gap-4">
            {[
              { q: "Bagaimana cara membatalkan langganan bulanan saya?", a: "Anda dapat membatalkan langganan kapan saja melalui menu 'Pengaturan Akun' > 'Tagihan'. Setelah pembatalan, akses Anda akan tetap aktif hingga akhir periode penagihan yang sedang berjalan." },
              { q: "Apakah saya bisa mengakses kursus secara offline?", a: "Ya, fitur download tersedia di aplikasi mobile Harin Learning. Anda dapat mengunduh video materi saat terhubung ke Wi-Fi dan menontonnya nanti tanpa koneksi internet." },
              { q: "Sertifikat saya belum muncul setelah menyelesaikan kuis, mengapa?", a: "Pastikan Anda telah menyelesaikan semua modul (status 100%) dan mendapatkan skor minimal 80% pada kuis akhir. Sertifikat biasanya diproses secara otomatis dalam waktu 24 jam." },
              { q: "Metode pembayaran apa saja yang tersedia?", a: "Kami menerima pembayaran melalui Transfer Bank (Virtual Account), Kartu Kredit, E-Wallet (GoPay, OVO, Dana), dan gerai retail seperti Alfamart dan Indomaret." }
            ].map((faq, idx) => (
              <div key={idx} className="brutal-border rounded-xl bg-white p-6 soft-brutal-shadow">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <h5 className="font-headline-md text-lg md:text-xl">{faq.q}</h5>
                    <Icon name="expand_more" className="w-6 h-6 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="pt-4 text-on-surface-variant border-t-2 border-black mt-4">
                    {faq.a}
                  </div>
                </details>
              </div>
            ))}
          </div>
        </section>

        {/* Support CTA Section */}
        <section className="brutal-border rounded-2xl p-8 md:p-12 bg-white flex flex-col md:flex-row items-center justify-between gap-8 soft-brutal-shadow">
          <div className="flex-1">
            <h3 className="font-headline-lg mb-4">Masih butuh bantuan?</h3>
            <p className="text-body-lg text-on-surface-variant">Tim dukungan kami siap membantu Anda melalui saluran langsung. Pilih cara yang paling nyaman bagi Anda.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <button className="flex items-center justify-center gap-3 brutal-border bg-primary-container px-8 py-4 font-label-bold rounded-xl soft-brutal-shadow soft-brutal-shadow-hover transition-all w-full sm:w-auto">
              <Icon name="smart_toy" className="w-6 h-6 fill-current" />
              Chat dengan AI
            </button>
            <button className="flex items-center justify-center gap-3 brutal-border bg-white px-8 py-4 font-label-bold rounded-xl soft-brutal-shadow soft-brutal-shadow-hover transition-all w-full sm:w-auto">
              <Icon name="mail" className="w-6 h-6 fill-current" />
              Kirim Email
            </button>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t-2 border-on-surface p-margin-desktop bg-surface-container-low">
        <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-3 gap-gutter">
          <div>
            <h4 className="font-headline-md text-headline-md mb-4 text-primary">Harin</h4>
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
          © 2024 Harin Learning. Crafted with Soft Brutalism.
        </div>
      </footer>
      </div>
    </div>
  );
};

export default Help;
