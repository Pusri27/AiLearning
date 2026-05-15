import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileDropdown from '../components/ProfileDropdown';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabaseClient';
import { showToast, friendlyError } from '../lib/toast';
import { awardAchievement } from '../lib/achievementService';

const Checkout = () => {
  const navigate = useNavigate();

  const [cartItems,      setCartItems]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [processing,     setProcessing]     = useState(false);
  const [paymentMethod,  setPaymentMethod]  = useState('bank');
  const [user,           setUser]           = useState(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }
      setUser(session.user);

      // Ambil semua item di cart milik user beserta detail kursusnya
      const { data, error } = await supabase
        .from('cart')
        .select(`id, courses (*)`)
        .eq('user_id', session.user.id);

      if (!error && data) {
        setCartItems(data.map(item => ({ cartId: item.id, ...item.courses })));
      }
      setLoading(false);
    };
    init();
  }, [navigate]);

  const total = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);

  const formatPrice = (p) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);

  const handlePayment = async () => {
    if (!user || cartItems.length === 0) return;
    setProcessing(true);

    try {
      // Enroll ke semua kursus sekaligus
      const enrollments = cartItems.map(item => ({
        user_id:   user.id,
        course_id: item.id,
      }));

      const { error: enrollError } = await supabase
        .from('enrollments')
        .insert(enrollments);

      if (enrollError) throw enrollError;

      // Hapus semua item dari cart setelah berhasil
      const cartIds = cartItems.map(item => item.cartId);
      await supabase.from('cart').delete().in('id', cartIds);

      // Achievements Logic
      await awardAchievement(user.id, 'first_step');
      
      // Check for top_student
      const { data: allEnrolls } = await supabase.from('enrollments').select('id').eq('user_id', user.id);
      if (allEnrolls && allEnrolls.length >= 5) {
        await awardAchievement(user.id, 'top_student');
      }

      showToast(`Pembayaran berhasil! ${cartItems.length} kursus siap diakses. Selamat belajar! 🎉`);
      navigate('/courses');
    } catch (err) {
      showToast(friendlyError(err), 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-background flex h-screen items-center justify-center">
        <div className="w-16 h-16 border-4 border-on-surface border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="bg-background text-on-background flex h-screen items-center justify-center flex-col gap-6">
        <Icon name="shopping_cart" className="w-24 h-24 opacity-20" />
        <h1 className="font-headline-lg text-2xl">Keranjang Kosong</h1>
        <p className="text-on-surface-variant">Tambahkan kursus ke keranjang terlebih dahulu.</p>
        <button
          onClick={() => navigate('/catalog')}
          className="px-8 py-3 bg-primary text-white rounded-lg border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
        >
          Lihat Katalog
        </button>
      </div>
    );
  }

  const PAYMENT_METHODS = [
    { id: 'bank',   icon: 'account_balance', label: 'Bank Transfer' },
    { id: 'card',   icon: 'credit_card',     label: 'Credit Card'   },
    { id: 'wallet', icon: 'payments',        label: 'E-Wallet'      },
  ];

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-surface border-b-2 border-on-surface shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] z-50">
        <div className="flex justify-between items-center px-6 md:px-margin-desktop py-4 max-w-6xl mx-auto w-full">
          <button onClick={() => navigate('/')} className="font-headline-md font-black text-primary">
            Harin Learning
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/cart')}
              className="p-2 border-2 border-on-surface bg-surface rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
            >
              <Icon name="shopping_cart" className="w-5 h-5 text-primary" />
            </button>
            <ProfileDropdown />
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-6xl mx-auto px-6 md:px-margin-desktop py-10 w-full">
        <div className="mb-8">
          <h1 className="font-headline-xl text-on-surface">Pembayaran</h1>
          <p className="font-body-lg text-on-surface-variant mt-1">Selesaikan transaksi untuk akses instan ke semua kursus.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Order Summary */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="bg-surface rounded-xl border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className="p-5 border-b-2 border-on-surface bg-surface-container">
                <h2 className="font-headline-md text-on-surface">Ringkasan Pesanan</h2>
                <p className="text-xs text-on-surface-variant font-bold mt-1">{cartItems.length} kursus</p>
              </div>
              <div className="p-5 flex flex-col gap-4">
                {cartItems.map(item => (
                  <div key={item.cartId} className="flex gap-3 items-center">
                    <div className="w-14 h-14 rounded-lg border-2 border-on-surface overflow-hidden shrink-0">
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-label-bold text-on-surface text-sm line-clamp-1">{item.title}</p>
                      <p className="text-xs text-primary font-black mt-0.5">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                ))}
                <div className="border-t-2 border-on-surface pt-4 mt-2 space-y-2">
                  <div className="flex justify-between text-sm font-body-md text-on-surface-variant">
                    <span>Subtotal ({cartItems.length} item)</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-body-md text-on-surface-variant">
                    <span>Diskon</span>
                    <span className="text-error">- Rp 0</span>
                  </div>
                  <div className="flex justify-between font-black text-on-surface border-t-2 border-on-surface pt-2 mt-2">
                    <span className="font-headline-md">Total</span>
                    <span className="font-headline-md text-primary">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Method Selector */}
            <div className="bg-surface rounded-xl border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className="p-5 border-b-2 border-on-surface bg-primary-fixed">
                <h2 className="font-headline-md text-on-surface">Metode Pembayaran</h2>
              </div>
              <div className="p-5 flex flex-col gap-5">
                {/* Method Tabs */}
                <div className="grid grid-cols-3 gap-3">
                  {PAYMENT_METHODS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === m.id
                          ? 'bg-primary-container border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]'
                          : 'border-on-surface/30 hover:border-on-surface'
                      }`}
                    >
                      <Icon name={m.icon} className="w-7 h-7" />
                      <span className="font-label-bold text-xs">{m.label}</span>
                    </button>
                  ))}
                </div>

                {/* Method Detail */}
                <div className="bg-surface-container-lowest border-2 border-on-surface p-5 rounded-xl">
                  {paymentMethod === 'bank' && (
                    <div className="space-y-3">
                      <p className="text-xs font-black uppercase text-on-surface-variant mb-3">Pilih Bank:</p>
                      <div className="grid grid-cols-2 gap-3">
                        {['BCA', 'Mandiri', 'BNI', 'BRI'].map(bank => (
                          <label key={bank} className="flex items-center gap-3 p-3 border-2 border-on-surface rounded-lg cursor-pointer hover:bg-primary-container transition-colors">
                            <input type="radio" name="bank" defaultChecked={bank === 'BCA'} className="accent-primary" />
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
                    <div className="space-y-3">
                      <p className="text-xs font-black uppercase text-on-surface-variant mb-3">Pilih E-Wallet:</p>
                      <div className="grid grid-cols-2 gap-3">
                        {['GoPay', 'OVO', 'Dana', 'ShopeePay'].map(w => (
                          <label key={w} className="flex items-center gap-3 p-3 border-2 border-on-surface rounded-lg cursor-pointer hover:bg-primary-container transition-colors">
                            <input type="radio" name="wallet" className="accent-primary" />
                            <span className="font-label-bold text-sm">{w}</span>
                          </label>
                        ))}
                      </div>
                      <div className="mt-3">
                        <label className="block text-xs font-black uppercase mb-1">Nomor Handphone</label>
                        <input type="text" placeholder="08xx xxxx xxxx" className="w-full bg-white border-2 border-on-surface p-3 rounded-lg focus:outline-none focus:border-primary" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <div className="bg-primary-container rounded-xl border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col gap-5">
              <div className="flex justify-between items-end border-b-2 border-on-surface pb-4">
                <span className="font-headline-md text-on-primary-container">Total Tagihan</span>
                <span className="font-headline-lg text-primary font-black text-3xl">{formatPrice(total)}</span>
              </div>
              <button
                onClick={handlePayment}
                disabled={processing}
                className="w-full bg-on-surface text-white font-headline-md text-xl py-5 rounded-xl border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0 active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? '⏳ Memproses...' : `🔒 Bayar ${formatPrice(total)}`}
              </button>
              <p className="text-center text-xs font-bold opacity-60">Transaksi aman & terenkripsi. Pajak sudah termasuk.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
