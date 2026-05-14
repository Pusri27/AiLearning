import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const SignUp = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState(null);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
    } else {
      // Upsert profile to ensure role is saved
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: data.user.id, 
          full_name: fullName, 
          role: role 
        });

      if (profileError) {
        console.error('Error saving profile:', profileError);
      }

      alert('Registrasi berhasil! Silakan cek email kamu untuk verifikasi (atau langsung login jika konfirmasi dimatikan).');
      navigate('/login');
    }
    setLoading(false);
  };

  return (
    <div className={`${isDark ? 'dark' : ''}`}>
      <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display">
        <nav className="p-6 md:px-12 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-[#FF6B4A] rounded-xl flex items-center justify-center text-white font-black text-xl border-2 border-[#1a1a1a] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">L</div>
            <span className="text-2xl font-extrabold tracking-tight">Lumina</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-sm font-medium opacity-70">Sudah punya akun?</span>
            <button 
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 rounded-full border-2 border-[#1a1a1a] dark:border-slate-700 font-bold text-sm bg-white dark:bg-slate-800 hover:translate-y-[-2px] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Masuk
            </button>
          </div>
        </nav>

        <main className="flex-grow flex items-center justify-center p-4 md:p-8">
          <div className="max-w-5xl w-full grid md:grid-cols-2 gap-12 items-center">
            <div className="hidden md:flex flex-col gap-8">
              <div className="space-y-4">
                <h1 className="text-5xl font-extrabold leading-tight">
                  Mulai Perjalanan <br/>
                  <span className="text-[#FF6B4A]">Belajarmu</span> Bersama Kami.
                </h1>
                <p className="text-lg opacity-80 max-w-md">
                  Bergabunglah dengan ribuan pelajar profesional dan kembangkan keahlianmu dengan kurikulum standar industri.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-[#FDE68A] border-2 border-[#1a1a1a] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-[20px] text-slate-900">
                  <span className="material-symbols-outlined text-3xl mb-2">school</span>
                  <h3 className="font-bold">500+ Kursus</h3>
                  <p className="text-xs opacity-75">Materi terupdate setiap minggu.</p>
                </div>
                <div className="p-6 bg-[#C4B5FD] border-2 border-[#1a1a1a] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-[20px] text-slate-900">
                  <span className="material-symbols-outlined text-3xl mb-2">workspace_premium</span>
                  <h3 className="font-bold">Sertifikat</h3>
                  <p className="text-xs opacity-75">Diakui secara profesional.</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border-2 border-[#1a1a1a] dark:border-slate-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 md:p-10 rounded-[20px]">
              <div className="mb-8">
                <h2 className="text-3xl font-extrabold mb-2">Buat Akun Baru</h2>
                <p className="opacity-60 text-sm">Silakan lengkapi data diri Anda untuk memulai.</p>
              </div>

              {error && (
                <div className="bg-error-container text-error p-4 rounded-xl border-2 border-error mb-6 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                  {error}
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSignUp}>
                <div>
                  <label className="block text-sm font-bold mb-2 ml-1">Mendaftar Sebagai</label>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <button
                      type="button"
                      onClick={() => setRole('student')}
                      className={`py-3 rounded-xl border-2 border-[#1a1a1a] font-bold text-sm transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${role === 'student' ? 'bg-[#FF6B4A] text-white' : 'bg-white text-slate-900'}`}
                    >
                      Siswa
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('teacher')}
                      className={`py-3 rounded-xl border-2 border-[#1a1a1a] font-bold text-sm transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${role === 'teacher' ? 'bg-[#FF6B4A] text-white' : 'bg-white text-slate-900'}`}
                    >
                      Pengajar
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 ml-1">Nama Lengkap</label>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-[#FF6B4A] dark:focus:border-[#FF6B4A] outline-none transition-all" 
                    placeholder="Masukkan nama lengkap" 
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 ml-1">Alamat Email</label>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-[#FF6B4A] dark:focus:border-[#FF6B4A] outline-none transition-all" 
                    placeholder="contoh@email.com" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 ml-1">Kata Sandi</label>
                  <div className="relative">
                    <input 
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-[#FF6B4A] dark:focus:border-[#FF6B4A] outline-none transition-all" 
                      placeholder="Min. 8 karakter" 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 opacity-40 cursor-pointer">visibility</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-2">
                  <input className="mt-1 w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-600 text-[#FF6B4A] focus:ring-[#FF6B4A] bg-slate-50 dark:bg-slate-800" id="terms" type="checkbox" required/>
                  <label className="text-xs leading-relaxed opacity-70" htmlFor="terms">
                    Saya menyetujui <a className="text-[#FF6B4A] font-bold hover:underline" href="#">Syarat & Ketentuan</a> serta <a className="text-[#FF6B4A] font-bold hover:underline" href="#">Kebijakan Privasi</a> yang berlaku di Lumina Learning.
                  </label>
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FF6B4A] text-white font-extrabold py-4 rounded-xl border-2 border-[#1a1a1a] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Memproses...' : 'Daftar Sekarang'}
                </button>
                <div className="relative py-4 flex items-center">
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                  <span className="px-4 text-xs font-bold opacity-40 uppercase tracking-widest">Atau daftar dengan</span>
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-[#1a1a1a] dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <img alt="Google Logo" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCrFIcQUDiEHMSuP6zbYx5hZdEbWPgyiR05bPGxiBYrwDi68qCogXDylthyeJ7rTPTKHlibOg-LtxxTVD1xGFT9ppgfgYJZy-zd_DNnAdA3ASUD6fNrwWFR1LdJ4ZdDcLyMSj_4PihPiC-abWrp1YhcgYvCodWO_RiIDLhulhz3Af9k2MFIaQ2UVPn7p1TpqKWENvu-MDGifg8YxcrOyztKppr2eYYmPrTc8zo-ZGtq-2_PBIkguKd6EjV2f3f6LjF6dIE-6vDdGOc"/>
                    Google
                  </button>
                  <button type="button" className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-[#1a1a1a] dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <span className="material-symbols-outlined text-blue-600">facebook</span>
                    Facebook
                  </button>
                </div>
                <div className="text-center pt-4">
                  <button 
                    type="button"
                    onClick={() => navigate('/')}
                    className="text-sm font-bold opacity-60 hover:opacity-100 hover:text-[#FF6B4A] transition-all"
                  >
                    Masuk sebagai Tamu
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>

        <footer className="p-8 text-center text-xs opacity-50 font-medium">
          © 2024 Lumina Learning. Seluruh hak cipta dilindungi undang-undang.
        </footer>

        <button 
          className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-white dark:bg-slate-800 border-2 border-[#1a1a1a] dark:border-slate-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center z-50" 
          onClick={() => setIsDark(!isDark)}
        >
          <span className="material-symbols-outlined block dark:hidden">dark_mode</span>
          <span className="material-symbols-outlined hidden dark:block text-yellow-400">light_mode</span>
        </button>
      </div>
    </div>
  );
};

export default SignUp;
