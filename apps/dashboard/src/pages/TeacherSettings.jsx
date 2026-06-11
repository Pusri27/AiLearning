import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import TeacherSidebar from '../components/TeacherSidebar';
import NotificationDropdown from '../components/NotificationDropdown';
import ProfileDropdown from '../components/ProfileDropdown';
import Icon from '../components/Icon';
import { useUserProfile } from '../context/UserProfileContext';

// ── Friendly error mapper ────────────────────────────────────────
const friendlyError = (err) => {
  if (!err) return 'Terjadi kesalahan. Silakan coba lagi.';
  const msg = (err?.message || String(err)).toLowerCase();
  if (msg.includes('username') && msg.includes('unique'))
    return 'Username sudah dipakai. Coba username lain.';
  if (msg.includes('password'))
    return 'Password tidak memenuhi syarat (minimal 6 karakter).';
  if (msg.includes('network') || msg.includes('fetch'))
    return 'Koneksi bermasalah. Periksa internet kamu.';
  if (msg.includes('rate limit') || msg.includes('too many'))
    return 'Terlalu banyak percobaan. Tunggu beberapa menit.';
  if (msg.includes('jwt') || msg.includes('session'))
    return 'Sesi kamu sudah habis. Silakan login ulang.';
  return 'Gagal menyimpan. Silakan coba lagi.';
};

// ── Enhanced Toast Banner ─────────────────────────────────────────
const ToastBanner = ({ msg, type }) => {
  if (!msg) return null;
  const isError = type === 'error';
  
  return (
    <div className={`fixed top-8 right-8 z-[300] flex items-center gap-4 px-6 py-4 border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-right-8 duration-300 font-black text-sm
      ${isError ? 'bg-error text-white' : 'bg-primary-container text-on-primary-container'}`}>
      <div className={`w-8 h-8 rounded-full border-2 border-on-surface flex items-center justify-center shrink-0 ${isError ? 'bg-white text-error' : 'bg-on-surface text-white'}`}>
        <Icon name={isError ? 'priority_high' : 'check'} className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="uppercase tracking-widest text-[10px] opacity-70 mb-0.5">{isError ? 'Terjadi Masalah' : 'Berhasil'}</p>
        <p className="leading-tight">{msg}</p>
      </div>
    </div>
  );
};

// ── Payout Methods Manager Component ─────────────────────────────
const PayoutMethodsManager = ({ showToast }) => {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  // We use the same table but distinct context: this is for receiving money
  const [newMethod, setNewMethod] = useState({ type: 'bank', provider: 'BCA', accountNumber: '' });

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setMethods(data || []);
    setLoading(false);
  };

  const handleAddManual = async (e) => {
    e.preventDefault();
    if (!newMethod.accountNumber.trim()) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase.from('payment_methods').insert({
      user_id: session.user.id,
      type: newMethod.type,
      provider: newMethod.provider,
      account_number: newMethod.accountNumber,
      is_default: methods.length === 0 
    }).select().single();

    if (!error && data) {
      setMethods([data, ...methods]);
      setIsAdding(false);
      setNewMethod({ type: 'bank', provider: 'BCA', accountNumber: '' });
      showToast('Rekening penarikan berhasil ditambahkan!');
    } else {
      showToast('Gagal menambahkan rekening penarikan.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    const { error } = await supabase.from('payment_methods').delete().eq('id', confirmDeleteId);
    if (!error) {
      setMethods(methods.filter(m => m.id !== confirmDeleteId));
      setConfirmDeleteId(null);
      showToast('Rekening berhasil dihapus.');
    } else {
      showToast('Gagal menghapus rekening.', 'error');
    }
  };

  const handleSetDefault = async (id) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase.from('payment_methods').update({ is_default: false }).eq('user_id', session.user.id);
    const { error } = await supabase.from('payment_methods').update({ is_default: true }).eq('id', id);
    
    if (!error) {
      setMethods(methods.map(m => ({ ...m, is_default: m.id === id })));
      showToast('Rekening utama berhasil diperbarui.');
    } else {
      showToast('Gagal memperbarui rekening utama.', 'error');
    }
  };

  if (loading) return <div className="h-20 bg-surface-container animate-pulse border-2 border-on-surface" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="font-label-bold uppercase text-xs text-on-surface-variant">Rekening Tersimpan ({methods.length})</h4>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-2 px-4 py-2 border-2 border-on-surface font-label-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${isAdding ? 'bg-error text-white' : 'bg-primary-container text-on-surface hover:translate-x-[-1px] hover:translate-y-[-1px]'}`}
        >
          <Icon name={isAdding ? 'close' : 'add'} className="w-4 h-4" />
          {isAdding ? 'Batal' : 'Tambah Rekening'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddManual} className="bg-white border-2 border-on-surface p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase mb-1.5">Tipe</label>
              <select 
                value={newMethod.type}
                onChange={e => setNewMethod({ ...newMethod, type: e.target.value, provider: e.target.value === 'bank' ? 'BCA' : 'GoPay' })}
                className="w-full bg-surface-container border-2 border-on-surface p-2.5 text-sm font-bold focus:ring-0"
              >
                <option value="bank">Rekening Bank</option>
                <option value="wallet">E-Wallet</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase mb-1.5">Penyedia (Provider)</label>
              {newMethod.type === 'bank' ? (
                <select value={newMethod.provider} onChange={e => setNewMethod({ ...newMethod, provider: e.target.value })} className="w-full bg-surface-container border-2 border-on-surface p-2.5 text-sm font-bold focus:ring-0">
                  {['BCA', 'Mandiri', 'BNI', 'BRI', 'BSI', 'CIMB Niaga'].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              ) : (
                <select value={newMethod.provider} onChange={e => setNewMethod({ ...newMethod, provider: e.target.value })} className="w-full bg-surface-container border-2 border-on-surface p-2.5 text-sm font-bold focus:ring-0">
                  {['GoPay', 'OVO', 'Dana', 'ShopeePay'].map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              )}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase mb-1.5">
              {newMethod.type === 'bank' ? 'Nomor Rekening' : 'Nomor Handphone'}
            </label>
            <input 
              type="text" 
              placeholder={newMethod.type === 'bank' ? 'Contoh: 1234567890' : 'Contoh: 0812 3456 7890'}
              required
              value={newMethod.accountNumber}
              onChange={e => setNewMethod({ ...newMethod, accountNumber: e.target.value })}
              className="w-full bg-surface-container border-2 border-on-surface p-2.5 text-sm font-bold focus:ring-0" 
            />
          </div>
          <button type="submit" className="w-full bg-on-surface text-white py-3 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:translate-y-[-2px] transition-all">
            Simpan Rekening Pencairan
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {methods.length === 0 && !isAdding ? (
          <div className="col-span-full p-8 border-2 border-on-surface border-dashed rounded-xl text-center bg-surface-container/30">
            <Icon name="account_balance_wallet" className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-bold text-on-surface-variant">Belum ada rekening penarikan dana.</p>
          </div>
        ) : (
          methods.map(method => (
            <div key={method.id} className={`bg-surface-container-lowest border-2 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex justify-between items-start group relative ${method.is_default ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-on-surface'}`}>
              <div className="flex gap-3">
                <div className={`w-10 h-10 bg-white border-2 flex items-center justify-center shrink-0 ${method.is_default ? 'border-primary text-primary' : 'border-on-surface'}`}>
                  <Icon name={method.type === 'bank' ? 'account_balance' : 'account_balance_wallet'} className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className="font-label-bold text-sm truncate uppercase">{method.provider}</h5>
                    {method.is_default && (
                      <span className="bg-primary text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">Utama</span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                    {method.account_number}
                  </p>
                  {!method.is_default && (
                    <button 
                      type="button"
                      onClick={() => handleSetDefault(method.id)}
                      className="text-[10px] font-bold text-primary hover:underline mt-1"
                    >
                      Jadikan Utama
                    </button>
                  )}
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setConfirmDeleteId(method.id)}
                className="text-on-surface-variant hover:text-error p-1 transition-colors"
              >
                <Icon name="delete" className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)} />
          <div className="relative bg-white border-4 border-on-surface p-8 max-w-sm w-full shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-error">
              <Icon name="delete_forever" className="w-10 h-10" />
            </div>
            <h5 className="text-xl font-black text-center mb-2">Hapus Rekening?</h5>
            <p className="text-sm text-center text-on-surface-variant mb-8 leading-relaxed">
              Anda tidak akan menerima pencairan dana ke rekening ini lagi. Lanjutkan hapus?
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDelete}
                className="w-full bg-error text-white py-3 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:translate-y-[-2px] transition-all"
              >
                Ya, Hapus Sekarang
              </button>
              <button 
                onClick={() => setConfirmDeleteId(null)}
                className="w-full bg-surface-container border-2 border-on-surface py-3 font-black hover:translate-y-[-2px] transition-all"
              >
                Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────
const TeacherSettings = () => {
  const navigate   = useNavigate();
  const { profile, updateProfile } = useUserProfile();

  const [user,         setUser]         = useState(null);
  const [fullName,     setFullName]     = useState('');
  const [email,        setEmail]        = useState('');
  const [avatarUrl,    setAvatarUrl]    = useState('');
  const [newPw,        setNewPw]        = useState('');
  const [confirmPw,    setConfirmPw]    = useState('');
  const [showPw,       setShowPw]       = useState(false);
  
  // Teacher preferences
  const [notifEnroll,  setNotifEnroll]  = useState(true);
  const [notifSubmit,  setNotifSubmit]  = useState(true);
  
  const [savingProf,   setSavingProf]   = useState(false);
  const [savingPw,     setSavingPw]     = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [toast,        setToast]        = useState({ msg: '', type: 'success' });
  const avatarInputRef = useRef(null);
  const toastTimer     = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast({ msg: '', type: 'success' }), 3500);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error || !user) {
        supabase.auth.signOut();
        navigate('/login');
        return;
      }
      setUser(user);
      setEmail(user.email || '');
    });
  }, [navigate]);

  useEffect(() => {
    setFullName(profile.fullName || '');
    setAvatarUrl(profile.avatarUrl || '');
  }, [profile.fullName, profile.avatarUrl]);

  const initials = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      showToast('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Ukuran file terlalu besar. Maksimal 2 MB.', 'error');
      return;
    }

    setUploadingImg(true);
    const ext      = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      showToast('Gagal mengunggah foto. Pastikan storage "avatars" sudah dibuat di Supabase.', 'error');
      setUploadingImg(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const publicUrl = urlData?.publicUrl + `?t=${Date.now()}`;

    await supabase.from('profiles').upsert({
      id: user.id,
      avatar_url: publicUrl,
      updated_at: new Date().toISOString(),
    });

    setAvatarUrl(publicUrl);
    updateProfile({ avatarUrl: publicUrl });
    setUploadingImg(false);
    showToast('Foto profil berhasil diperbarui! ✓');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) { showToast('Nama tidak boleh kosong.', 'error'); return; }
    setSavingProf(true);
    const { error } = await supabase.from('profiles').upsert({
      id:         user.id,
      full_name:  fullName,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    });
    setSavingProf(false);
    if (error) showToast(friendlyError(error), 'error');
    else {
      updateProfile({ fullName, avatarUrl });
      showToast('Profil berhasil disimpan! ✓');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPw)            { showToast('Password baru tidak boleh kosong.', 'error'); return; }
    if (newPw.length < 6)  { showToast('Password minimal 6 karakter.', 'error'); return; }
    if (newPw !== confirmPw) { showToast('Konfirmasi password tidak cocok.', 'error'); return; }
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setSavingPw(false);
    if (error) showToast(friendlyError(error), 'error');
    else { showToast('Sandi berhasil diperbarui! ✓'); setNewPw(''); setConfirmPw(''); }
  };

  return (
    <div className="bg-background text-on-background font-body-md h-screen overflow-hidden flex">
      <ToastBanner msg={toast.msg} type={toast.type} />
      
      <TeacherSidebar user={user} />

      <main className="flex-1 flex flex-col h-full overflow-y-auto lg:ml-[280px]">
        {/* Top Header */}
        <header className="flex justify-between items-center px-8 lg:px-12 h-20 w-full bg-surface-container-lowest border-b-2 border-on-surface shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="font-headline-md text-headline-md font-extrabold text-on-surface">Settings</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <NotificationDropdown />
              <ProfileDropdown />
            </div>
          </div>
        </header>

        <div className="p-8 lg:p-12 space-y-12 max-w-5xl mx-auto w-full">

          {/* ── Account Section ───────────────────────────────── */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <h3 className="font-headline-lg text-headline-lg text-on-surface">Akun Pengajar</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2">Kelola informasi profil pengajar dan identitas Anda.</p>
            </div>
            <div className="md:col-span-2 space-y-6">
              <div className="bg-surface-container-lowest border-2 border-on-surface p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-6 mb-8">
                  <div className="relative">
                    <div className="w-24 h-24 border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-primary-container flex items-center justify-center overflow-hidden">
                      {avatarUrl
                        ? <img className="w-full h-full object-cover" src={avatarUrl} alt="Avatar" />
                        : <span className="text-2xl font-black text-on-primary-container">{initials}</span>
                      }
                    </div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingImg}
                      className="absolute -bottom-2 -right-2 bg-primary-container border-2 border-on-surface p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-60"
                    >
                      <Icon name={uploadingImg ? 'sync' : 'edit'} className={`w-5 h-5 text-on-surface ${uploadingImg ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <div>
                    <h4 className="font-headline-md text-headline-md font-bold">{fullName || 'Nama Kamu'}</h4>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      Pengajar / Instruktur
                    </p>
                    <p className="text-xs text-on-surface-variant mt-1">{email}</p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="group">
                    <label className="block font-label-bold text-label-bold mb-1.5 uppercase text-on-surface-variant">Nama Tampilan</label>
                    <input
                      className="w-full bg-white border-2 border-on-surface px-4 py-3 font-body-md text-body-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-0 focus:border-primary transition-all outline-none"
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Nama yang tampil ke siswa"
                    />
                  </div>
                  <div className="group">
                    <label className="block font-label-bold text-label-bold mb-1.5 uppercase text-on-surface-variant">Email</label>
                    <input
                      className="w-full bg-surface-container border-2 border-on-surface px-4 py-3 font-body-md text-body-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-0 transition-all outline-none opacity-60 cursor-not-allowed"
                      type="email"
                      value={email}
                      disabled
                    />
                  </div>
                  <div className="mt-8 flex justify-end">
                    <button
                      type="submit"
                      disabled={savingProf}
                      className="flex items-center gap-2 bg-primary text-on-primary border-2 border-on-surface py-3 px-8 font-label-bold text-label-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all disabled:opacity-60"
                    >
                      <Icon name={savingProf ? 'sync' : 'save'} className={`w-4 h-4 ${savingProf ? 'animate-spin' : ''}`} />
                      {savingProf ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>

          <hr className="border-t-2 border-on-surface" />

          {/* ── Preferences Section ───────────────────────────── */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <h3 className="font-headline-lg text-headline-lg text-on-surface">Preferensi Mengajar</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2">Sesuaikan pengalaman notifikasi dashboard Anda.</p>
            </div>
            <div className="md:col-span-2 space-y-4">
              {[
                { key: 'enroll', icon: 'person_add', label: 'Notifikasi Siswa Baru', desc: 'Terima info ketika ada siswa yang mendaftar ke kursus Anda.', val: notifEnroll, set: setNotifEnroll, bg: 'bg-primary-container' },
                { key: 'submit', icon: 'assignment_turned_in', label: 'Notifikasi Pengumpulan Tugas', desc: 'Terima peringatan saat ada tugas baru yang perlu dinilai.', val: notifSubmit, set: setNotifSubmit, bg: 'bg-secondary-container' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between bg-surface-container-lowest border-2 border-on-surface p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${item.bg} border-2 border-on-surface flex items-center justify-center`}>
                      <Icon name={item.icon} className="w-6 h-6 text-on-surface" />
                    </div>
                    <div>
                      <h5 className="font-label-bold text-label-bold font-bold">{item.label}</h5>
                      <p className="text-body-md text-on-surface-variant">{item.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      item.set(v => !v);
                      showToast('Preferensi berhasil disimpan.');
                    }}
                    className={`relative w-12 h-6 border-2 border-on-surface transition-all duration-200 ${item.val ? 'bg-primary' : 'bg-surface-container'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white border border-on-surface shadow transition-transform duration-200 ${item.val ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-t-2 border-on-surface" />
          
          {/* ── Payout Methods Section ────────────────────────── */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <h3 className="font-headline-lg text-headline-lg text-on-surface">Pencairan Dana</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2">Kelola rekening tujuan untuk pencairan hasil penjualan kursus Anda.</p>
            </div>
            <div className="md:col-span-2 space-y-4">
              <PayoutMethodsManager showToast={showToast} />
            </div>
          </section>

          <hr className="border-t-2 border-on-surface" />

          {/* ── Security Section ──────────────────────────────── */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-20">
            <div className="md:col-span-1">
              <h3 className="font-headline-lg text-headline-lg text-on-surface">Keamanan Akun</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2">Kontrol keamanan kredensial akun Anda.</p>
            </div>
            <div className="md:col-span-2 space-y-4">
              
              {/* Change Password */}
              <details className="group bg-surface-container-lowest border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-surface-container-low transition-colors list-none">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-surface-variant border-2 border-on-surface flex items-center justify-center">
                      <Icon name="lock" className="w-6 h-6 text-on-surface" />
                    </div>
                    <div>
                      <h5 className="font-label-bold text-label-bold font-bold">Ubah Kata Sandi</h5>
                      <p className="text-body-md text-on-surface-variant">Perbarui password untuk menjaga keamanan akun Anda.</p>
                    </div>
                  </div>
                  <Icon name="arrow_forward" className="w-6 h-6 group-open:rotate-90 transition-transform" />
                </summary>
                <form onSubmit={handleChangePassword} className="p-5 border-t-2 border-on-surface space-y-4 bg-white">
                  <div>
                    <label className="block font-label-bold text-label-bold mb-1.5 uppercase text-on-surface-variant text-xs">Password Baru</label>
                    <div className="relative">
                      <input
                        className="w-full bg-white border-2 border-on-surface px-4 py-3 font-body-md text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:ring-0 focus:border-primary outline-none pr-12"
                        type={showPw ? 'text' : 'password'}
                        placeholder="Minimal 6 karakter"
                        value={newPw}
                        onChange={e => setNewPw(e.target.value)}
                      />
                      <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
                        <Icon name={showPw ? 'visibility_off' : 'visibility'} className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block font-label-bold text-label-bold mb-1.5 uppercase text-on-surface-variant text-xs">Konfirmasi Password Baru</label>
                    <input
                      className="w-full bg-white border-2 border-on-surface px-4 py-3 font-body-md text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:ring-0 focus:border-primary outline-none"
                      type={showPw ? 'text' : 'password'}
                      placeholder="Ulangi password baru"
                      value={confirmPw}
                      onChange={e => setConfirmPw(e.target.value)}
                    />
                    {confirmPw && newPw !== confirmPw && <p className="text-xs text-error font-bold mt-1">Password tidak cocok.</p>}
                    {confirmPw && newPw === confirmPw && confirmPw.length >= 6 && <p className="text-xs text-success font-bold mt-1">✓ Password cocok.</p>}
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingPw || !newPw || !confirmPw}
                      className="flex items-center gap-2 bg-on-surface text-surface border-2 border-on-surface py-2.5 px-7 font-label-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50"
                    >
                      <Icon name={savingPw ? 'sync' : 'lock_reset'} className={`w-4 h-4 ${savingPw ? 'animate-spin' : ''}`} />
                      {savingPw ? 'Memperbarui...' : 'Perbarui Sandi'}
                    </button>
                  </div>
                </form>
              </details>

              {/* Danger Zone */}
              <div className="mt-12 pt-8 border-t-2 border-on-surface border-dashed">
                <div className="bg-error-container border-2 border-error p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
                  <h4 className="font-headline-md text-headline-md text-on-error-container mb-2 font-bold">Zona Berbahaya</h4>
                  <p className="text-body-md text-on-error-container mb-6">Menghapus akun instruktur akan mencabut akses Anda dan menghentikan kursus Anda. Proses ini tidak dapat dibatalkan.</p>
                  <button
                    onClick={() => showToast('Untuk menghapus akun pengajar, silakan kontak support@harin.app.', 'error')}
                    className="bg-error text-on-error border-2 border-on-surface py-2 px-6 font-label-bold text-label-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
                  >
                    Hapus Akun Pengajar
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default TeacherSettings;
