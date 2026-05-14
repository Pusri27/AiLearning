import React from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileDropdown from '../components/ProfileDropdown';

const Wishlist = () => {
  const navigate = useNavigate();

  const wishlistItems = [
    {
      id: 1,
      title: "Master AI Engineering",
      instructor: "Sarah Jenkins",
      price: "Rp 499.000",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAOb2_PA1kJkXrm3om5LK7KWnM6LZv50Wth9O0ntMgXDK-aJOS6SCDF7q2t57dergr_Q1bM0y_MtMGda1zh1NNenr-68EEQfInOB1nQvYLPXdxkRaAdBXcByoG2AFiF1WmJFqY2Op9LcN0DwXN9BmKtEJV8qe7PMlV4QpDxInrmh9V8BGObCkkYaO7W-fCPWFJanPteZHaZD4edAj-BjUdDlFQfuIcHXNAD86QN9Jf30o9hGY1mo1Ll5HHGso0Iwd3nV8iklkcH7Xc",
      category: "Engineering"
    },
    {
      id: 2,
      title: "UI/UX Strategy for Fintech",
      instructor: "Siska Pratiwi",
      price: "Rp 850.000",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAC0YF0fqK5FxHSwsLi172iD1A12B0jVGxHzBpnA6IX25eK14MPnTlhF9gwziFxPwKYW36xa0eQNZA8RrlhbuO0gbfnyvOTaLTope3NLrXNwhnprig8mvHBanTM4aixfoIagadkYDqy9NFGUmjW2p1s-p6S2PdUYdnschdptIeWMK9WciS1HeL_fdds2QbFetijNFQrlcuwvqiWH75FTe-D47YivUUc9zlkCioNmHKspwtw_rBU9eiEhKkXsj2FJZuGQZwrmkn7WPs",
      category: "Design"
    }
  ];

  return (
    <div className="bg-background text-on-surface font-body-md flex h-screen overflow-hidden">
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-surface flex justify-between items-center w-full px-gutter h-20 sticky top-0 z-40 border-b-2 border-on-surface shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-4">
            <h1 className="font-headline-md text-headline-md font-extrabold text-on-surface">Wishlist Saya</h1>
            <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full border-2 border-on-surface font-label-bold text-sm">
              {wishlistItems.length} Kursus
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="material-symbols-outlined p-2 border-2 border-on-surface bg-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all rounded-lg">
              notifications
            </button>
            <ProfileDropdown />
          </div>
        </header>

        {/* Wishlist Content */}
        <main className="flex-1 overflow-y-auto p-margin-mobile md:p-margin-desktop space-y-8">
          {wishlistItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {wishlistItems.map((item) => (
                <div key={item.id} className="bg-surface border-2 border-on-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all group">
                  <div className="h-48 border-b-2 border-on-surface relative overflow-hidden">
                    <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={item.image} alt={item.title} />
                    <button className="absolute top-4 right-4 bg-white p-2 border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-none transition-all rounded-lg text-error">
                      <span className="material-symbols-outlined fill">favorite</span>
                    </button>
                    <div className="absolute bottom-4 left-4">
                      <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full border-2 border-on-surface font-label-bold text-xs uppercase">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-grow gap-4">
                    <div className="space-y-1">
                      <h3 className="font-headline-md text-headline-md text-on-surface line-clamp-1">{item.title}</h3>
                      <p className="font-body-md text-on-surface-variant text-sm">Instruktur: {item.instructor}</p>
                    </div>
                    <div className="flex justify-between items-center mt-auto pt-4 border-t-2 border-on-surface">
                      <span className="font-headline-md text-primary">{item.price}</span>
                      <button 
                        onClick={() => navigate('/checkout')}
                        className="bg-on-surface text-white px-4 py-2 border-2 border-on-surface font-label-bold shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-none transition-all active:scale-95"
                      >
                        Beli Sekarang
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
              <div className="w-32 h-32 bg-surface-container-high rounded-full flex items-center justify-center border-4 border-dashed border-on-surface">
                <span className="material-symbols-outlined text-6xl text-on-surface-variant opacity-30">heart_broken</span>
              </div>
              <div>
                <h2 className="font-headline-lg text-on-surface">Wishlist Kosong</h2>
                <p className="text-on-surface-variant font-body-lg">Belum ada kursus yang Anda simpan. Yuk, cari kursus idamanmu!</p>
              </div>
              <button 
                onClick={() => navigate('/catalog')}
                className="bg-primary text-white px-10 py-4 font-headline-md border-2 border-on-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                Jelajahi Katalog
              </button>
            </div>
          )}

          {/* Recommended for You */}
          <section className="mt-16 space-y-6">
            <h2 className="font-headline-lg text-on-surface">Rekomendasi Untuk Anda</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
               <div className="bg-primary-container p-8 border-2 border-on-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row gap-6 items-center">
                  <div className="flex-1 space-y-4">
                    <h3 className="font-headline-md">Belum menemukan yang pas?</h3>
                    <p className="text-on-primary-container font-body-md">Dapatkan rekomendasi personal berdasarkan minat belajarmu.</p>
                    <button className="bg-on-surface text-white px-6 py-2 border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">Mulai Kuis Minat</button>
                  </div>
                  <span className="material-symbols-outlined text-8xl text-on-primary-container/20">psychology</span>
               </div>
               <div className="bg-secondary-container p-8 border-2 border-on-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row gap-6 items-center">
                  <div className="flex-1 space-y-4">
                    <h3 className="font-headline-md">Dapatkan Diskon Khusus!</h3>
                    <p className="text-on-secondary-container font-body-md">Gunakan kode "WISHLISTNEW" untuk diskon 15% pada kursus pertama.</p>
                    <button className="bg-on-surface text-white px-6 py-2 border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">Salin Kode</button>
                  </div>
                  <span className="material-symbols-outlined text-8xl text-on-secondary-container/20">sell</span>
               </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Wishlist;
