import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileDropdown from '../components/ProfileDropdown';

const BlogFeed = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-background text-on-surface font-plus-jakarta flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden h-full">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {/* TopNavBar (Shared Component) */}
        <header className="sticky top-0 z-40 flex justify-between items-center px-6 lg:px-margin-desktop py-4 w-full bg-surface border-b-2 border-on-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-8">
            <div className="lg:hidden font-headline-md text-headline-md font-black text-primary">Lumina</div>
            <nav className="hidden md:flex gap-6">
              <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Explore</a>
              <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Tutors</a>
              <a className="font-body-md text-body-md text-primary font-bold border-b-2 border-primary pb-1" href="#">Courses</a>
              <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Resources</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center brutal-border bg-surface-container px-3 py-1.5 rounded-lg">
              <span className="material-symbols-outlined text-on-surface-variant">search</span>
              <input className="bg-transparent border-none focus:ring-0 text-body-md placeholder:text-on-surface-variant/50 w-32 md:w-48" placeholder="Cari artikel..." type="text"/>
            </div>
            <div className="flex items-center gap-3">
              <button className="material-symbols-outlined p-2 hover:bg-surface-variant rounded-full transition-colors">notifications</button>
              <button className="material-symbols-outlined p-2 hover:bg-surface-variant rounded-full transition-colors">bookmark</button>
              <div className="h-10 w-10 border-2 border-on-background rounded-full overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <img alt="User avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDybAYCJS0mxrgSJwCGioplN6b8w4DHdlpFKVcZrajLGmGRGGcvzf2E-LjOmSbfmCBNC16k1kmuYIJ1LyGZbhqmv7j4kR1rIODp_CZnJvYawLeykQ08Zs44zJiKDCWKMttUbtNsB3cvb1U2rSMvjc5EoZjOl-dXXhun5k9r9nTev6hf8zmb2rBFfsZgQHMqhQiMtUg7Om1v2w8ipu31cDO14VgKsVTXpjq6XXLBRcNf6GmpUL64btKngQBGGImiUcpOTdMnz0iSsfw"/>
              </div>
            </div>
          </div>
        </header>

        {/* Featured Article Hero */}
        <section className="p-6 lg:p-margin-desktop">
          <div className="grid lg:grid-cols-2 gap-0 border-2 border-on-background bg-surface-container-lowest shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden rounded-xl">
            <div className="relative h-64 lg:h-full min-h-[400px]">
              <img className="absolute inset-0 w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWy0LU0ZBSj2qtaFyhnd1SvZcxQhj59UCT3Q9dJst1Bt4svTLRGI7nW2kOQLz5450EM2CFsWyDDML2q6i-59nRYFsirTGt6GK4u_SmTpOAUpJCRPtTl98GNzltUkFBZnwDFn8HSlyXYzwwJMGmwI0RTBLJIZGi2tCfPwQVUxTeNXAderTMNmlaMDql_vKN1UR61EAstTeXuKtE-s-sjQSykZ-6kx2hL3tKJSrtaMfyHEZfO5RFnhGyuDcb6nqkEIAlIVc5evuSKdI" alt="Featured"/>
              <div className="absolute top-6 left-6">
                <span className="bg-primary-container text-on-primary-container brutal-border px-4 py-2 font-label-bold text-label-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase">Unggulan</span>
              </div>
            </div>
            <div className="p-8 lg:p-12 flex flex-col justify-center gap-6 bg-secondary-fixed">
              <div className="flex gap-2">
                <span className="text-secondary font-label-bold text-label-bold">12 Okt 2023</span>
                <span className="text-on-surface-variant opacity-30">•</span>
                <span className="text-secondary font-label-bold text-label-bold">8 Menit Baca</span>
              </div>
              <h2 className="font-headline-xl text-headline-xl lg:text-headline-xl text-on-background">Masa Depan AI dalam Transformasi Pendidikan 2024</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
                Bagaimana kecerdasan buatan mengubah cara kita belajar dan mengajar? Jelajahi tren terbaru yang akan mendominasi kurikulum global tahun depan.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <button className="bg-primary-container text-on-primary-container brutal-border px-8 py-4 font-label-bold text-label-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all flex items-center gap-2">
                  Baca Selengkapnya
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Categories & Filter */}
        <section className="px-6 lg:px-margin-desktop pb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-2 border-outline-variant pb-8">
            <div className="flex flex-wrap gap-3">
              <button className="bg-on-background text-white px-6 py-2 rounded-full font-label-bold text-label-bold">Semua</button>
              <button className="bg-surface brutal-border px-6 py-2 rounded-full font-label-bold text-label-bold hover:bg-primary-container transition-colors">Tips Belajar</button>
              <button className="bg-surface brutal-border px-6 py-2 rounded-full font-label-bold text-label-bold hover:bg-tertiary-container transition-colors">Berita Edukasi</button>
              <button className="bg-surface brutal-border px-6 py-2 rounded-full font-label-bold text-label-bold hover:bg-secondary-container transition-colors">Teknologi</button>
              <button className="bg-surface brutal-border px-6 py-2 rounded-full font-label-bold text-label-bold hover:bg-primary-fixed transition-colors">Karir</button>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-label-bold text-label-bold text-on-surface-variant">Urutkan:</span>
              <select className="bg-transparent border-none font-label-bold text-label-bold focus:ring-0 cursor-pointer">
                <option>Terbaru</option>
                <option>Terpopuler</option>
              </select>
            </div>
          </div>
        </section>

        {/* Blog Grid (Bento Style Layout) */}
        <section className="px-6 lg:px-margin-desktop pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {/* Card 1 */}
            <article className="flex flex-col brutal-border bg-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="h-48 relative overflow-hidden border-b-2 border-on-background">
                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuACKIMIZEPkzkZp32pd-KrB3A-WHbhew5hBDa3cdZOYdPiz7C429ioKXpXvObKmE-CJ18H-SbxYAcsYpVRdIGxkB5rGKSqViBY_nV2zExrS3dSxf_dZ74TAx6PMfWN2z8HvS8ypPGeHwb7WUcNisPwoz-zfCbhBn5AJUDnglFmDZy8b2aJpoKmDo3yHMODOc3FtsPsrV0CLyAMbCFq4MuHV8N5MjSkN5p2VvsIQygwgBEMhF5tsWgweP7IknA2TMVkpHuj9l2UJKNk" alt="Blog 1"/>
                <span className="absolute top-4 left-4 bg-tertiary-container text-on-tertiary-container brutal-border px-3 py-1 font-label-bold text-[12px] uppercase">Berita Edukasi</span>
              </div>
              <div className="p-6 flex flex-col gap-4 flex-grow">
                <div className="flex justify-between items-center text-[12px] text-on-surface-variant font-bold">
                  <span>15 Okt 2023</span>
                  <span>5 Min Baca</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-background leading-tight">Beasiswa Lumina 2024 Resmi Dibuka Hari Ini</h3>
                <p className="font-body-md text-body-md text-on-surface-variant line-clamp-3">
                  Kesempatan emas bagi pelajar berprestasi untuk mendapatkan dukungan penuh biaya pendidikan di universitas mitra terbaik.
                </p>
                <div className="mt-auto pt-4 flex items-center text-primary font-label-bold text-label-bold gap-2 group cursor-pointer">
                  <span>Baca Artikel</span>
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_right_alt</span>
                </div>
              </div>
            </article>

            {/* Card 2 */}
            <article className="flex flex-col brutal-border bg-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="h-48 relative overflow-hidden border-b-2 border-on-background">
                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0YUN68GlCYVcN4h7wlylwipz4t2ppp6-6871xXFe_xHzgR4SJU0_4t6-3UF-Pj2DsojEJAGbALGVMBQoIHzzgqhwgEMPXn7PF_a2pO8chBW7PktkdhmojDtfDMvMygpn2weBdzIBe4E_VJ5SQdTcJkZem1GKP7xf90FbfvFJdVoDHLgVsyWwvyUyFzkEIpchEMuuw3JEEwGVoUKYlXyigioHDJ0BWF7GU9Jcg9FtCM5CxRxO1tVB21MVegTpTJ0kTkndGCbN8qGw" alt="Blog 2"/>
                <span className="absolute top-4 left-4 bg-primary-container text-on-primary-container brutal-border px-3 py-1 font-label-bold text-[12px] uppercase">Tips Belajar</span>
              </div>
              <div className="p-6 flex flex-col gap-4 flex-grow">
                <div className="flex justify-between items-center text-[12px] text-on-surface-variant font-bold">
                  <span>14 Okt 2023</span>
                  <span>10 Min Baca</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-background leading-tight">5 Teknik Pomodoro untuk Mahasiswa Sibuk</h3>
                <p className="font-body-md text-body-md text-on-surface-variant line-clamp-3">
                  Tingkatkan produktivitas belajar Anda dengan metode manajemen waktu yang sudah terbukti secara ilmiah ini.
                </p>
                <div className="mt-auto pt-4 flex items-center text-primary font-label-bold text-label-bold gap-2 group cursor-pointer">
                  <span>Baca Artikel</span>
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_right_alt</span>
                </div>
              </div>
            </article>

            {/* Card 3 */}
            <article className="flex flex-col brutal-border bg-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="h-48 relative overflow-hidden border-b-2 border-on-background">
                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCAFcG_dK3_tvuEkmV2IiCw_CKgL9j2taK8P5Sp9-jiyVIfwBdaHo0NNGFoRegufuN0S8xSm7OE1EpXhITZEexFCo5QxMR5JSxzpqBhAI1oxicrBD03EQ0Cq2oGgo4zRaPPdYtRneJYXxNKQUYr8wjYbqv2qdDrrkvY9Dg5u5kw0M8il7PUckIOzcN3TDXaLWUTP1YysRADOxQ2vBzT36W8oabYIgRaNF15tIpD247hwYkj3nKqo9OVsAGUfioCO6h1Ml39P9TsvPA" alt="Blog 3"/>
                <span className="absolute top-4 left-4 bg-secondary-container text-on-secondary-container brutal-border px-3 py-1 font-label-bold text-[12px] uppercase">Teknologi</span>
              </div>
              <div className="p-6 flex flex-col gap-4 flex-grow">
                <div className="flex justify-between items-center text-[12px] text-on-surface-variant font-bold">
                  <span>10 Okt 2023</span>
                  <span>12 Min Baca</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-background leading-tight">Mengenal Blockchain di Luar Cryptocurrency</h3>
                <p className="font-body-md text-body-md text-on-surface-variant line-clamp-3">
                  Kenapa teknologi blockchain sangat penting untuk sistem keamanan data pendidikan di masa depan?
                </p>
                <div className="mt-auto pt-4 flex items-center text-primary font-label-bold text-label-bold gap-2 group cursor-pointer">
                  <span>Baca Artikel</span>
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_right_alt</span>
                </div>
              </div>
            </article>

            {/* Card 4 (Double Width) */}
            <article className="md:col-span-2 flex flex-col md:flex-row brutal-border bg-tertiary-fixed-dim shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="md:w-1/2 h-64 md:h-full relative border-b-2 md:border-b-0 md:border-r-2 border-on-background">
                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBBNbqGc59gBTiEKJIuGNHaWD0xKgkdZTGckozQDs96TAV8L2xVkmCAJC7cKqTvAZksj4s6-o_XCXO5uN_Y-Ggwf5gtsEPTofRkw0ZV2nC1a8VxOCuotG1KszyvcfKS1hRIZgcHHzG35Jyco6IbS0Aed6gzshMBYJOjQUgX2S7AA5Kpfs1GGf8vwZygsTpIVn0NtsPM8KmrQ5dah-wDNDfCuNTAPfrN791BJBXHcD5vjKiM5L_nTEgbmuQE2rIZRzji9UyQc086yhs" alt="Blog 4"/>
                <span className="absolute top-4 left-4 bg-primary-fixed text-on-primary-fixed brutal-border px-3 py-1 font-label-bold text-[12px] uppercase">Karir</span>
              </div>
              <div className="md:w-1/2 p-8 flex flex-col gap-4">
                <div className="flex justify-between items-center text-[12px] text-on-tertiary-fixed-variant font-bold">
                  <span>08 Okt 2023</span>
                  <span>15 Min Baca</span>
                </div>
                <h3 className="font-headline-lg text-headline-lg text-on-background leading-tight">Navigasi Karir di Era Ekonomi Digital yang Dinamis</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Pelajari skill apa saja yang paling dicari perusahaan multinasional di tahun 2024 dan bagaimana mempersiapkan diri sejak dini.
                </p>
                <div className="mt-auto pt-6">
                  <button className="bg-on-background text-white brutal-border border-white px-6 py-3 font-label-bold text-label-bold hover:bg-primary-container hover:text-on-background transition-all">Baca Panduan Karir</button>
                </div>
              </div>
            </article>

            {/* Card 5 */}
            <article className="flex flex-col brutal-border bg-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="h-48 relative overflow-hidden border-b-2 border-on-background">
                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDU9XckZFtwDMrX7ZOxxvpF0m09AJVgIRrHKLZSPpRQZwbmo5YuGIChzlrmCy3SSRJ17kX80ysSJ3eieB72ZaWqpjSa3H96pSbhYdUonqixu-1_0oA98uMhl1tUYY1yZSDPp2rLiZnfG79RY8kVBiFi9bQLXDuuTWdKQMStRgnqL8KO9YSS1qNvsJ2NxZPpr-scq0SnaQrMmPSFe_AouAIhy84EqPUyUq6uf6EGQnD08ZikN1axnOxe36fVSOgDtir9WSBFgTo_KFA" alt="Blog 5"/>
                <span className="absolute top-4 left-4 bg-primary-container text-on-primary-container brutal-border px-3 py-1 font-label-bold text-[12px] uppercase">Tips Belajar</span>
              </div>
              <div className="p-6 flex flex-col gap-4 flex-grow">
                <div className="flex justify-between items-center text-[12px] text-on-surface-variant font-bold">
                  <span>05 Okt 2023</span>
                  <span>6 Min Baca</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-background leading-tight">Seni Mencatat: Digital vs Tradisional</h3>
                <p className="font-body-md text-body-md text-on-surface-variant line-clamp-3">
                  Mana yang lebih efektif untuk retensi memori jangka panjang? Simak hasil riset terbaru tim edukasi kami.
                </p>
                <div className="mt-auto pt-4 flex items-center text-primary font-label-bold text-label-bold gap-2 group cursor-pointer">
                  <span>Baca Artikel</span>
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_right_alt</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* Newsletter Subscription Section */}
        <section className="px-6 lg:px-margin-desktop pb-24">
          <div className="bg-primary-container brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 lg:p-16 rounded-2xl flex flex-col items-center text-center gap-8">
            <div className="bg-white p-4 brutal-border rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="material-symbols-outlined text-[48px] text-primary">mail</span>
            </div>
            <div className="max-w-2xl">
              <h2 className="font-headline-xl text-headline-xl text-on-primary-container mb-4">Langganan Buletin</h2>
              <p className="font-body-lg text-body-lg text-on-primary-container/80">
                Dapatkan update artikel terbaru, tips belajar eksklusif, dan info beasiswa langsung ke email Anda setiap minggu.
              </p>
            </div>
            <form className="flex flex-col sm:flex-row w-full max-w-xl gap-4">
              <input className="flex-grow brutal-border px-6 py-4 rounded-lg focus:ring-0 text-body-md" placeholder="Alamat email Anda" type="email"/>
              <button className="bg-on-background text-white px-10 py-4 font-label-bold text-label-bold brutal-border border-white hover:bg-secondary transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none" type="submit">
                Daftar Sekarang
              </button>
            </form>
            <p className="text-[12px] font-bold text-on-primary-container/60">Tanpa spam. Kami menghargai privasi data Anda.</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-surface-container border-t-2 border-on-background px-6 lg:px-margin-desktop py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col gap-2 items-center md:items-start">
              <h2 className="font-headline-md text-headline-md text-primary font-black">Lumina Learning</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">© 2023 Lumina Learning. Semua Hak Dilindungi.</p>
            </div>
            <div className="flex gap-8">
              <a className="font-label-bold text-label-bold hover:text-primary transition-colors" href="#">Bantuan</a>
              <a className="font-label-bold text-label-bold hover:text-primary transition-colors" href="#">Privasi</a>
              <a className="font-label-bold text-label-bold hover:text-primary transition-colors" href="#">Syarat & Ketentuan</a>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 brutal-border bg-white rounded-lg flex items-center justify-center hover:bg-primary-container cursor-pointer transition-colors">
                <span className="material-symbols-outlined">share</span>
              </div>
              <div className="w-10 h-10 brutal-border bg-white rounded-lg flex items-center justify-center hover:bg-primary-container cursor-pointer transition-colors">
                <span className="material-symbols-outlined">rss_feed</span>
              </div>
            </div>
          </div>
        </footer>
      </main>
      </div>
    </div>
  );
};

export default BlogFeed;
