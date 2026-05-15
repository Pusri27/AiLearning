import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileDropdown from '../components/ProfileDropdown';
import NotificationDropdown from '../components/NotificationDropdown';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import { showToast, friendlyError } from '../lib/toast';

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setUser(session.user);

      const { data, error } = await supabase
        .from('cart')
        .select(`
          id,
          courses (*)
        `)
        .eq('user_id', session.user.id);

      if (!error) {
        setCartItems(data.map(item => ({
          cartId: item.id,
          ...item.courses
        })));
      }
      setLoading(false);
    };

    fetchCart();
  }, [navigate]);

  const removeItem = async (cartId) => {
    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('id', cartId);

    if (!error) {
      setCartItems(cartItems.filter(item => item.cartId !== cartId));
      showToast('Item berhasil dihapus dari keranjang.');
    } else {
      showToast(friendlyError(error), 'error');
    }
  };

  const total = cartItems.reduce((acc, item) => acc + item.price, 0);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);
  };

  if (loading) {
    return (
      <div className="bg-background text-on-background flex h-screen items-center justify-center">
        <div className="w-16 h-16 border-4 border-on-surface border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-surface font-body-md flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-surface flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop h-20 sticky top-0 z-40 border-b-2 border-on-surface shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-4">
            <h1 className="font-headline-md text-headline-md font-extrabold">Keranjang Belanja</h1>
            <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full border-2 border-on-surface font-label-bold text-sm">
              {cartItems.length} Item
            </span>
          </div>
          <div className="flex items-center gap-4">
            <NotificationDropdown />
            <ProfileDropdown />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-margin-mobile md:p-margin-desktop">
          {cartItems.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-20">
              <div className="lg:col-span-8 space-y-6">
                {cartItems.map((item) => (
                  <div key={item.cartId} className="bg-surface border-2 border-on-surface p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row gap-6 relative group transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <div className="w-full md:w-40 h-28 border-2 border-on-surface overflow-hidden shrink-0">
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-black uppercase tracking-wider text-secondary bg-secondary-container px-2 py-0.5 border border-on-surface rounded-sm mb-2 inline-block">
                            {item.category}
                          </span>
                          <h3 className="font-headline-md text-xl text-on-surface">{item.title}</h3>
                          <p className="text-sm text-on-surface-variant italic">Oleh {item.instructor}</p>
                        </div>
                        <button 
                          onClick={() => removeItem(item.cartId)}
                          className="text-on-surface-variant hover:text-error transition-colors p-1"
                        >
                          <Icon name="delete" className="w-6 h-6" />
                        </button>
                      </div>
                      <div className="flex justify-between items-center mt-4">
                         <span className="font-headline-md text-primary text-lg">{formatPrice(item.price)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-4">
                <div className="bg-primary-container border-4 border-on-surface p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sticky top-24">
                  <h3 className="font-headline-md text-2xl mb-6">Ringkasan Pesanan</h3>
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between font-body-lg">
                      <span>Subtotal</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                    <div className="flex justify-between font-body-lg">
                      <span>Diskon</span>
                      <span className="text-error">- Rp 0</span>
                    </div>
                    <div className="border-t-2 border-on-surface pt-4 mt-4 flex justify-between">
                      <span className="font-headline-md text-xl">Total</span>
                      <span className="font-headline-md text-2xl text-on-surface">{formatPrice(total)}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate('/checkout')}
                    className="w-full bg-on-surface text-white py-4 font-headline-md text-xl border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] transition-all active:scale-95"
                  >
                    Checkout Sekarang
                  </button>
                  <p className="text-center text-xs mt-4 font-label-bold opacity-70 italic">Pajak sudah termasuk dalam harga</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 space-y-8">
              <div className="w-48 h-48 bg-surface-container-high rounded-full flex items-center justify-center border-4 border-dashed border-on-surface animate-pulse">
                <Icon name="shopping_cart" className="w-20 h-20 opacity-20" />
              </div>
              <div className="text-center">
                <h2 className="font-headline-lg text-3xl">Wah, Keranjangmu Kosong!</h2>
                <p className="text-on-surface-variant max-w-sm mx-auto mt-2">Sepertinya kamu belum menemukan kursus yang cocok. Yuk, jelajahi katalog kami sekarang.</p>
              </div>
              <button 
                onClick={() => navigate('/catalog')}
                className="bg-primary text-white px-10 py-4 font-headline-md text-xl border-2 border-on-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-10px_10px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                Mulai Belanja
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Cart;
