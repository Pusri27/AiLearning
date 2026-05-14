import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProfileDropdown from '../components/ProfileDropdown';
import { supabase } from '../lib/supabaseClient';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId } = location.state || {};
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setUser(session.user);
      
      if (courseId) {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();
        
        if (!error) setCourse(data);
      }
      setLoading(false);
    };
    init();
  }, [courseId, navigate]);

  const handlePayment = async () => {
    if (!user || !course) return;
    
    setProcessing(true);
    const { error } = await supabase
      .from('enrollments')
      .insert([
        { user_id: user.id, course_id: course.id }
      ]);

    if (error) {
      alert('Terjadi kesalahan saat memproses pendaftaran: ' + error.message);
    } else {
      alert('Pembayaran Berhasil! Selamat Belajar!');
      navigate('/');
    }
    setProcessing(false);
  };

  const total = course?.price || 0;

  if (loading) {
    return (
      <div className="bg-background text-on-background flex h-screen items-center justify-center">
        <div className="w-16 h-16 border-4 border-on-surface border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="bg-background text-on-background flex h-screen items-center justify-center flex-col gap-4">
        <h1 className="font-headline-lg">Keranjang Kosong</h1>
        <button onClick={() => navigate('/catalog')} className="px-6 py-2 bg-primary text-white rounded-lg border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Lihat Katalog</button>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md overflow-x-hidden pb-20">
      <header className="w-full top-0 sticky bg-background border-b-[2px] border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50">
        <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-4 w-full max-w-container-max mx-auto">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/')} className="font-headline-md text-headline-md font-black text-primary">Lumina Learning</button>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/cart')}
              className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-on-surface bg-surface hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <span className="material-symbols-outlined text-primary">shopping_cart</span>
            </button>
            <ProfileDropdown />
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12">
        <div className="mb-8 text-center md:text-left">
          <h1 className="font-headline-xl text-headline-xl text-on-surface">Pembayaran</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">Selesaikan transaksi Anda untuk akses instan.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-surface rounded-xl border-[2px] border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className="p-6 border-b-[2px] border-on-surface bg-inverse-on-surface">
                <h2 className="font-headline-md text-headline-md text-on-surface mb-1">Rincian Kursus</h2>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div className="flex gap-4 items-center">
                  <div className="w-20 h-20 rounded-lg border-[2px] border-on-surface overflow-hidden flex-shrink-0">
                    <img alt={course.title} className="w-full h-full object-cover" src={course.image_url}/>
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-label-bold text-on-surface line-clamp-1">{course.title}</h3>
                    <p className="text-sm text-on-surface-variant">Rp {course.price.toLocaleString()}</p>
                  </div>
                </div>
                <div className="border-t-[2px] border-on-surface pt-4 flex justify-between items-center">
                  <span className="font-body-lg text-on-surface">Subtotal</span>
                  <span className="font-headline-md text-on-surface font-black">Rp {total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-surface rounded-xl border-[2px] border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className="p-6 border-b-[2px] border-on-surface bg-primary-fixed">
                <h2 className="font-headline-md text-headline-md text-on-surface">Metode Pembayaran</h2>
              </div>
              <div className="p-6 flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                   <button 
                     onClick={() => setPaymentMethod('bank')}
                     className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'bank' ? 'bg-primary-container border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]' : 'border-on-surface/20 hover:border-on-surface/50'}`}
                   >
                     <span className="material-symbols-outlined text-3xl">account_balance</span>
                     <span className="font-label-bold text-xs">Bank Transfer</span>
                   </button>
                   <button 
                     onClick={() => setPaymentMethod('card')}
                     className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'card' ? 'bg-primary-container border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]' : 'border-on-surface/20 hover:border-on-surface/50'}`}
                   >
                     <span className="material-symbols-outlined text-3xl">credit_card</span>
                     <span className="font-label-bold text-xs">Credit Card</span>
                   </button>
                   <button 
                     onClick={() => setPaymentMethod('wallet')}
                     className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'wallet' ? 'bg-primary-container border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]' : 'border-on-surface/20 hover:border-on-surface/50'}`}
                   >
                     <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
                     <span className="font-label-bold text-xs">E-Wallet</span>
                   </button>
                </div>

                <div className="bg-surface-container-lowest border-2 border-on-surface p-6 rounded-xl animate-in fade-in slide-in-from-top-2">
                  {paymentMethod === 'bank' && (
                    <div className="space-y-4">
                      <p className="font-label-bold text-on-surface-variant mb-4">Pilih Bank Transfer:</p>
                      <div className="grid grid-cols-2 gap-3">
                        {['BCA', 'Mandiri', 'BNI', 'BRI'].map(bank => (
                          <label key={bank} className="flex items-center gap-3 p-3 border-2 border-on-surface rounded-lg cursor-pointer hover:bg-primary-container transition-colors">
                            <input type="radio" name="bank" className="accent-primary" />
                            <span className="font-label-bold text-sm">{bank} Virtual Account</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'card' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-black uppercase mb-1">Nomor Kartu</label>
                        <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-white border-2 border-on-surface p-3 rounded-lg focus:outline-none focus:border-primary" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-black uppercase mb-1">Masa Berlaku</label>
                          <input type="text" placeholder="MM/YY" className="w-full bg-white border-2 border-on-surface p-3 rounded-lg focus:outline-none focus:border-primary" />
                        </div>
                        <div>
                          <label className="block text-xs font-black uppercase mb-1">CVV</label>
                          <input type="text" placeholder="123" className="w-full bg-white border-2 border-on-surface p-3 rounded-lg focus:outline-none focus:border-primary" />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'wallet' && (
                    <div className="space-y-4">
                      <p className="font-label-bold text-on-surface-variant mb-4">Pilih E-Wallet:</p>
                      <div className="grid grid-cols-2 gap-3">
                        {['GoPay', 'OVO', 'Dana', 'ShopeePay'].map(wallet => (
                          <label key={wallet} className="flex items-center gap-3 p-3 border-2 border-on-surface rounded-lg cursor-pointer hover:bg-primary-container transition-colors">
                            <input type="radio" name="wallet" className="accent-primary" />
                            <span className="font-label-bold text-sm">{wallet}</span>
                          </label>
                        ))}
                      </div>
                      <div className="mt-4">
                        <label className="block text-xs font-black uppercase mb-1">Nomor Handphone</label>
                        <input type="text" placeholder="08xx xxxx xxxx" className="w-full bg-white border-2 border-on-surface p-3 rounded-lg focus:outline-none focus:border-primary" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-primary-container rounded-xl border-[2px] border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 flex flex-col gap-6">
              <div className="flex justify-between items-end border-b-[2px] border-on-surface pb-4">
                <span className="font-headline-md text-on-primary-container">Total Tagihan</span>
                <span className="font-headline-lg text-on-primary-container font-black text-3xl">Rp {total.toLocaleString()}</span>
              </div>
              <button 
                onClick={handlePayment}
                disabled={processing}
                className="w-full bg-on-surface text-white font-headline-md text-xl py-5 rounded-xl border-[2px] border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all active:scale-95 disabled:opacity-50"
              >
                {processing ? 'Memproses...' : 'Bayar Sekarang'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
