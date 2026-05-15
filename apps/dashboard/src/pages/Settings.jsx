import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Sidebar from '../components/Sidebar';
import ProfileDropdown from '../components/ProfileDropdown';
import Icon from '../components/Icon';
import { useUserProfile } from '../context/UserProfileContext';

// ── Friendly error mapper (local) ────────────────────────────────
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

// ── Toast ─────────────────────────────────────────────────────────
const ToastBanner = ({ msg, type }) => {
  if (!msg) return null;
  return (
    <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-3 border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-label-bold text-sm transition-all ${type === 'error' ? 'bg-error text-on-error' : 'bg-on-surface text-surface'}`}>
      <Icon name={type === 'error' ? 'error' : 'check_circle'} className="w-5 h-5 shrink-0" />
      {msg}
    </div>
  );
};

const Settings = () => {
  const navigate   = useNavigate();
  const { profile, updateProfile } = useUserProfile();

  // ── Form state (pre-filled from context) ─────────────────────
  const [user,         setUser]         = useState(null);
  const [fullName,     setFullName]     = useState('');
  const [email,        setEmail]        = useState('');
  const [avatarUrl,    setAvatarUrl]    = useState('');
  const [newPw,        setNewPw]        = useState('');
  const [confirmPw,    setConfirmPw]    = useState('');
  const [showPw,       setShowPw]       = useState(false);
  const [dailyGoal,    setDailyGoal]    = useState(45);
  const [notifEmail,   setNotifEmail]   = useState(true);
  const [notifPush,    setNotifPush]    = useState(false);
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

  // ── Load session ──────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate('/login'); return; }
      setUser(session.user);
      setEmail(session.user.email || '');
    });
  }, [navigate]);

  // ── Sync form from context whenever context updates ───────────
  useEffect(() => {
    setFullName(profile.fullName || '');
    setAvatarUrl(profile.avatarUrl || '');
  }, [profile.fullName, profile.avatarUrl]);

  // ── Avatar initials fallback ──────────────────────────────────
  const initials = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  // ── Upload photo to Supabase Storage ─────────────────────────
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
    const publicUrl = urlData?.publicUrl + `?t=${Date.now()}`; // cache-bust

    // Save URL to profiles table
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

  // ── Save profile ──────────────────────────────────────────────
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
      updateProfile({ fullName, avatarUrl }); // sync globally
      showToast('Profil berhasil disimpan! ✓');
    }
  };

  // ── Change password ───────────────────────────────────────────
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
    <div className="bg-background text-on-background font-body-md h-screen overflow-hidden">
      <ToastBanner msg={toast.msg} type={toast.type} />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        <main className="flex-1 flex flex-col h-full overflow-y-auto">
          {/* TopAppBar — original style */}
          <header className="flex justify-between items-center px-margin-desktop h-20 w-full bg-surface-container-lowest border-b-2 border-on-surface shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <h2 className="font-headline-md text-headline-md font-extrabold text-on-surface">Settings</h2>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden lg:flex items-center bg-surface-container border-2 border-on-surface px-3 py-1.5 w-64 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Icon name="search" className="w-5 h-5 text-on-surface-variant mr-2 shrink-0" />
                <input className="bg-transparent border-none focus:ring-0 text-body-md w-full outline-none" placeholder="Search settings..." type="text" />
              </div>
              <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-surface-variant transition-transform duration-100 active:scale-95 border-2 border-on-surface rounded-lg">
                  <Icon name="notifications" className="w-6 h-6" />
                </button>
                <ProfileDropdown />
              </div>
            </div>
          </header>

          <div className="p-margin-desktop space-y-12 max-w-5xl mx-auto w-full">

            {/* ── Account Section ───────────────────────────────── */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              <div className="md:col-span-1">
                <h3 className="font-headline-lg text-headline-lg text-on-surface">Akun</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2">Kelola informasi profil dan detail identitas Anda.</p>
              </div>
              <div className="md:col-span-2 space-y-6">
                <div className="bg-surface-container-lowest border-2 border-on-surface p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  {/* Avatar row */}
                  <div className="flex items-center gap-6 mb-8">
                    <div className="relative">
                      <div className="w-24 h-24 border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-primary-container flex items-center justify-center overflow-hidden">
                        {avatarUrl
                          ? <img className="w-full h-full object-cover" src={avatarUrl} alt="Avatar" />
                          : <span className="text-2xl font-black text-on-primary-container">{initials}</span>
                        }
                      </div>
                      {/* Hidden file input */}
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
                      <h4 className="font-headline-md text-headline-md">{fullName || 'Nama Kamu'}</h4>
                      <p className="font-body-md text-body-md text-on-surface-variant">
                        {profile.role === 'teacher' ? 'Pengajar' : 'Premium Learner'}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-1">{email}</p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="group">
                      <label className="block font-label-bold text-label-bold mb-1.5 uppercase text-on-surface-variant">Nama Lengkap</label>
                      <input
                        className="w-full bg-white border-2 border-on-surface px-4 py-3 font-body-md text-body-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-0 focus:border-primary transition-all outline-none"
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="Nama lengkap kamu"
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
            <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              <div className="md:col-span-1">
                <h3 className="font-headline-lg text-headline-lg text-on-surface">Preferensi Belajar</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2">Sesuaikan pengalaman belajar Anda agar lebih optimal.</p>
              </div>
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-surface-container border-2 border-on-surface p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
                  <div>
                    <Icon name="schedule" className="w-10 h-10 text-secondary mb-4" />
                    <h4 className="font-label-bold text-label-bold uppercase mb-2">Target Harian</h4>
                    <p className="text-body-md text-on-surface-variant">Setel durasi waktu belajar minimum setiap hari.</p>
                  </div>
                  <div className="mt-6 flex items-center justify-between bg-white border-2 border-on-surface p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <span className="font-bold px-2">{dailyGoal} Menit</span>
                    <div className="flex gap-1">
                      <button onClick={() => setDailyGoal(g => Math.max(5, g - 5))} className="w-8 h-8 bg-surface-variant border border-on-surface flex items-center justify-center font-black hover:bg-surface-container transition-colors">−</button>
                      <button onClick={() => setDailyGoal(g => Math.min(480, g + 5))} className="w-8 h-8 bg-surface-variant border border-on-surface flex items-center justify-center font-black hover:bg-surface-container transition-colors">+</button>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-container border-2 border-on-surface p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
                  <div>
                    <Icon name="forum" className="w-10 h-10 text-tertiary mb-4" />
                    <h4 className="font-label-bold text-label-bold uppercase mb-2">Bahasa Konten</h4>
                    <p className="text-body-md text-on-surface-variant">Pilih bahasa utama untuk materi pelajaran.</p>
                  </div>
                  <div className="mt-6">
                    <select className="w-full bg-white border-2 border-on-surface px-3 py-2 font-body-md focus:ring-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <option>Bahasa Indonesia</option>
                      <option>English (US)</option>
                      <option>日本語</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-t-2 border-on-surface" />

            {/* ── Security Section ──────────────────────────────── */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter pb-20">
              <div className="md:col-span-1">
                <h3 className="font-headline-lg text-headline-lg text-on-surface">Notifikasi & Keamanan</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2">Kontrol keamanan akun dan bagaimana kami menghubungi Anda.</p>
              </div>
              <div className="md:col-span-2 space-y-4">
                {/* Notification toggles */}
                {[
                  { key: 'email', icon: 'notifications', label: 'Notifikasi Email', desc: 'Update mingguan dan pengumuman kursus.', val: notifEmail, set: setNotifEmail, bg: 'bg-secondary-fixed' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between bg-surface-container-lowest border-2 border-on-surface p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-surface-container-low transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${item.bg} border-2 border-on-surface flex items-center justify-center`}>
                        <Icon name={item.icon} className="w-6 h-6 text-on-secondary-container" />
                      </div>
                      <div>
                        <h5 className="font-label-bold text-label-bold">{item.label}</h5>
                        <p className="text-body-md text-on-surface-variant">{item.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => item.set(v => !v)}
                      className={`relative w-12 h-6 border-2 border-on-surface transition-all duration-200 ${item.val ? 'bg-primary' : 'bg-surface-container'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white border border-on-surface shadow transition-transform duration-200 ${item.val ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                ))}

                {/* Change Password */}
                <details className="group bg-surface-container-lowest border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-surface-container-low transition-colors list-none">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-fixed border-2 border-on-surface flex items-center justify-center">
                        <Icon name="lock" className="w-6 h-6 text-on-primary-fixed" />
                      </div>
                      <div>
                        <h5 className="font-label-bold text-label-bold">Ubah Kata Sandi</h5>
                        <p className="text-body-md text-on-surface-variant">Disarankan untuk mengganti sandi setiap 6 bulan.</p>
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
                      {confirmPw && newPw === confirmPw && confirmPw.length >= 6 && <p className="text-xs text-green-600 font-bold mt-1">✓ Password cocok.</p>}
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
                    <h4 className="font-headline-md text-headline-md text-on-error-container mb-2">Zona Berbahaya</h4>
                    <p className="text-body-md text-on-error-container mb-6">Menghapus akun Anda bersifat permanen dan tidak dapat dibatalkan. Semua data belajar akan hilang.</p>
                    <button
                      onClick={() => showToast('Untuk menghapus akun, hubungi kami di support@harin.app.', 'error')}
                      className="bg-error text-on-error border-2 border-on-surface py-2 px-6 font-label-bold text-label-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
                    >
                      Hapus Akun Selamanya
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t-2 border-on-surface flex justify-around items-center h-16 z-50">
        <NavLink to="/" className="flex flex-col items-center justify-center text-on-surface-variant"><Icon name="dashboard" className="w-6 h-6" /></NavLink>
        <NavLink to="/catalog" className="flex flex-col items-center justify-center text-on-surface-variant"><Icon name="menu_book" className="w-6 h-6" /></NavLink>
        <NavLink to="/settings" className="flex flex-col items-center justify-center text-primary font-bold"><Icon name="settings" className="w-6 h-6" /></NavLink>
      </nav>
    </div>
  );
};

export default Settings;
