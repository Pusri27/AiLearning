import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import { showToast, friendlyError } from '../lib/toast';

const SignUp = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

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
      setError(friendlyError(signUpError));
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

      showToast('Registrasi berhasil! Silakan cek email kamu untuk verifikasi.');
      navigate('/login');
    }
    setLoading(false);
  };

  return (
    <div className={`${isDark ? 'dark' : ''}`}>
      <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display">
        <nav className="p-6 md:px-12 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-[#FF6B4A] rounded-xl flex items-center justify-center text-white font-black text-xl border-2 border-[#1a1a1a] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">H</div>
            <span className="text-2xl font-extrabold tracking-tight">Harin</span>
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
                  <Icon name="school" className="w-8 h-8 mb-2" />
                  <h3 className="font-bold">500+ Kursus</h3>
                  <p className="text-xs opacity-75">Materi terupdate setiap minggu.</p>
                </div>
                <div className="p-6 bg-[#C4B5FD] border-2 border-[#1a1a1a] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-[20px] text-slate-900">
                  <Icon name="workspace_premium" className="w-8 h-8 mb-2" />
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
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 transition-opacity p-1"
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-2">
                  <input className="mt-1 w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-600 text-[#FF6B4A] focus:ring-[#FF6B4A] bg-slate-50 dark:bg-slate-800" id="terms" type="checkbox" required/>
                  <label className="text-xs leading-relaxed opacity-70" htmlFor="terms">
                    Saya menyetujui <a className="text-[#FF6B4A] font-bold hover:underline" href="#">Syarat & Ketentuan</a> serta <a className="text-[#FF6B4A] font-bold hover:underline" href="#">Kebijakan Privasi</a> yang berlaku di Harin Learning.
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
                  <button type="button" className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-[#1a1a1a] dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
                    <img alt="Google Logo" className="w-5 h-5" src="https://www.gstatic.com/images/branding/googleg/1x/googleg_standard_color_128dp.png"/>
                    Google
                  </button>
                  <button type="button" className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-[#1a1a1a] dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
                    <svg viewBox="0 0 384 512" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                    </svg>
                    Apple
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>

        <footer className="p-8 text-center text-xs opacity-50 font-medium">
          © 2024 Harin Learning. Seluruh hak cipta dilindungi undang-undang.
        </footer>

      </div>
    </div>
  );
};

export default SignUp;
