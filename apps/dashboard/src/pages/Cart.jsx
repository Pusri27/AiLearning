import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileDropdown from '../components/ProfileDropdown';
import NotificationDropdown from '../components/NotificationDropdown';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import { showToast, friendlyError } from '../lib/toast';

import { useUserProfile } from '../context/UserProfileContext';

const Cart = () => {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const isGuest = profile.isGuest;
  const [cartItems,     setCartItems]     = useState([]);
  const [selectedItems, setSelectedItems] = useState([]); // Array of cartId
  const [loading,       setLoading]       = useState(true);
  const [user,          setUser]          = useState(null);

  useEffect(() => {
    const fetchCart = async () => {
      if (isGuest) {
        setLoading(false);
        return;
      }

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

      if (!error && data) {
        const items = data.map(item => ({
          cartId: item.id,
          ...item.courses
        }));
        setCartItems(items);
        // Otomatis pilih semua saat awal
        setSelectedItems(items.map(i => i.cartId));
      }
      setLoading(false);
    };

    fetchCart();
  }, [navigate, isGuest]);

  const toggleItem = (cartId) => {
    setSelectedItems(prev => 
      prev.includes(cartId) ? prev.filter(id => id !== cartId) : [...prev, cartId]
    );
  };

  const toggleAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map(i => i.cartId));
    }
  };

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

  const total = cartItems
    .filter(item => selectedItems.includes(item.cartId))
    .reduce((acc, item) => acc + (item.price || 0), 0);

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

  if (isGuest) {
    return (
      <div className="bg-background text-on-surface font-body-md flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface-container-lowest">
          <div className="bg-white border-4 border-on-surface p-10 rounded-3xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md w-full text-center space-y-6">
            <div className="w-24 h-24 bg-tertiary-container text-tertiary rounded-full flex items-center justify-center mx-auto border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative">
              <Icon name="shopping_basket" className="w-12 h-12" />
              <div className="absolute -top-2 -right-2 bg-error text-white w-8 h-8 rounded-full border-2 border-on-surface flex items-center justify-center font-black">!</div>
            </div>
            <div className="space-y-2">
              <h2 className="font-headline-xl text-3xl font-black">Simpan Kursus Impianmu!</h2>
              <p className="font-bold text-on-surface-variant leading-relaxed">
                Keranjang hanya tersedia untuk pengguna terdaftar. Yuk, login atau daftar sekarang agar kursus pilihanmu tidak hilang!
              </p>
            </div>
            <div className="space-y-4 pt-4">
              <button
                onClick={() => navigate('/signup')}
                className="w-full bg-primary text-white py-4 text-xl font-black rounded-xl border-2 border-on-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                Daftar Sekarang — Gratis!
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-white text-on-surface py-3 text-sm font-bold rounded-xl border-2 border-on-surface hover:bg-surface-container transition-all"
              >
                Sudah punya akun? Masuk
              </button>
            </div>
            <div className="pt-4 border-t-2 border-on-surface border-dashed">
              <button 
                onClick={() => navigate('/catalog')}
                className="text-primary font-black hover:underline flex items-center justify-center gap-2 mx-auto"
              >
                <Icon name="arrow_back" className="w-4 h-4" />
                Kembali Lihat Katalog
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-surface font-body-md flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-surface flex justify-between items-center w-full px-4 md:px-margin-desktop h-14 md:h-20 sticky top-0 z-40 border-b-2 border-on-surface shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 md:gap-4">
            <h1 className="font-headline-md text-headline-md font-extrabold">Keranjang</h1>
            <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full border-2 border-on-surface font-label-bold text-sm">
              {cartItems.length} Item
            </span>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <NotificationDropdown />
            <ProfileDropdown />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-margin-desktop pb-24 md:pb-8">
          {cartItems.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-20">
              <div className="lg:col-span-8 space-y-6">
                {/* Pilih Semua Bar */}
                <div className="bg-white border-2 border-on-surface p-4 flex justify-between items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div 
                      onClick={toggleAll}
                      className={`w-6 h-6 border-2 border-on-surface flex items-center justify-center transition-all ${selectedItems.length === cartItems.length && cartItems.length > 0 ? 'bg-primary' : 'bg-white'}`}
                    >
                      {selectedItems.length === cartItems.length && cartItems.length > 0 && <Icon name="check" className="w-4 h-4 text-white" />}
                    </div>
                    <span className="font-label-bold text-sm">Pilih Semua ({cartItems.length})</span>
                  </label>
                  {selectedItems.length > 0 && (
                    <span className="text-xs font-black uppercase text-on-surface-variant">
                      {selectedItems.length} Terpilih
                    </span>
                  )}
                </div>

                {/* Item List */}
                {cartItems.map((item) => (
                  <div 
                    key={item.cartId} 
                    className={`bg-surface border-2 border-on-surface p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row gap-6 relative group transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${!selectedItems.includes(item.cartId) ? 'opacity-70' : ''}`}
                  >
                    {/* Checkbox */}
                    <div 
                      onClick={() => toggleItem(item.cartId)}
                      className={`w-6 h-6 border-2 border-on-surface flex items-center justify-center shrink-0 cursor-pointer transition-all ${selectedItems.includes(item.cartId) ? 'bg-primary' : 'bg-white'}`}
                    >
                      {selectedItems.includes(item.cartId) && <Icon name="check" className="w-4 h-4 text-white" />}
                    </div>

                    <div 
                      className="flex-grow flex flex-col md:flex-row gap-6 cursor-pointer"
                      onClick={() => navigate(`/courses/${item.id}`)}
                    >
                      <div className="w-full md:w-40 h-28 border-2 border-on-surface overflow-hidden shrink-0">
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-black uppercase tracking-wider text-secondary bg-secondary-container px-2 py-0.5 border border-on-surface rounded-sm mb-2 inline-block">
                              {item.category}
                            </span>
                            <h3 className="font-headline-md text-xl text-on-surface group-hover:text-primary transition-colors">{item.title}</h3>
                            <p className="text-sm text-on-surface-variant italic">Oleh {item.instructor}</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                           <span className="font-headline-md text-primary text-lg">{formatPrice(item.price)}</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(item.cartId);
                      }}
                      className="absolute top-4 right-4 text-on-surface-variant hover:text-error transition-colors p-1"
                    >
                      <Icon name="delete" className="w-6 h-6" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-4">
                <div className="bg-primary-container border-4 border-on-surface p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sticky top-24">
                  <h3 className="font-headline-md text-2xl mb-6">Ringkasan Pesanan</h3>
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between font-body-lg">
                      <span>Subtotal ({selectedItems.length} kursus)</span>
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
                    onClick={() => {
                      if (selectedItems.length === 0) {
                        showToast('Pilih setidaknya satu item untuk checkout', 'error');
                        return;
                      }
                      navigate('/checkout', { state: { selectedCartIds: selectedItems } });
                    }}
                    className={`w-full py-4 font-headline-md text-xl border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] transition-all flex items-center justify-center gap-2 ${selectedItems.length > 0 ? 'bg-on-surface text-white hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]' : 'bg-surface-container text-on-surface-variant cursor-not-allowed'}`}
                    disabled={selectedItems.length === 0}
                  >
                    <Icon name="shopping_cart_checkout" className="w-6 h-6" />
                    Checkout Sekarang ({selectedItems.length})
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
