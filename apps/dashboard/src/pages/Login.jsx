import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
    } else {
      // Fetch role from profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profile?.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/');
      }
    }
    setLoading(false);
  };

  return (
    <div className="bg-surface min-h-screen flex items-center justify-center p-4 md:p-10 font-plus-jakarta">
      <main className="w-full max-w-[1200px] grid grid-cols-1 md:grid-cols-2 bg-surface-container-lowest rounded-[32px] overflow-hidden border-2 border-on-surface shadow-[8px_8px_0px_0px_rgba(28,27,27,1)]">
        {/* ... left side content ... */}
        <section className="hidden md:flex flex-col justify-between p-12 bg-primary-container relative overflow-hidden border-r-2 border-on-surface">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-8 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-[#FF6B4A] rounded-xl flex items-center justify-center text-white font-black text-xl border-2 border-[#1a1a1a] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">H</div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tighter">Harin</h1>
            </div>
            <h2 className="font-headline-xl text-headline-xl text-on-surface leading-tight mb-6">
              Mulai petualangan <br/> belajarmu di sini.
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[400px]">
              Bergabunglah dengan ribuan pelajar lainnya dan tingkatkan potensimu dengan tutor AI tercanggih.
            </p>
          </div>
          <div className="relative w-full h-[400px] mt-12 z-10">
            <img alt="Students Learning" className="w-full h-full object-cover rounded-[24px] border-2 border-on-surface shadow-[6px_6px_0px_0px_rgba(28,27,27,1)]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuALfyDe67EepdVQGZqJoBdeQl4Ny7KTE33U9nxDLL4cksNLtSoaRx16HL_neow4uwqQNPep95Ckp8o5NRWqFHwpX9DJf06xnxY9GWGTVcaZ1nVlZP9k1eSpGHspRwmEpoBfItdDh5YXPSQtzPNzixnWoZYv72Hj0z95Gww-RA1KJp5RA9Us5fFC1DfAlIfK6OFWF56BFwVyQNs_aReq-asjssOshjMArf1dtJWiY9dh-GwWdGXrnltOcrXEDjyMWBbjLPhLcyzAqNI"/>
            <div className="absolute -top-6 -right-6 bg-secondary-container p-4 rounded-xl border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(28,27,27,1)]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-on-secondary-container">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a6.623 6.623 0 01-3 0M5.25 12.75a6.75 6.75 0 1113.5 0c0 1.579-.544 3.03-1.458 4.178-.363.457-.611 1.012-.611 1.572v.223h-6.75V18.5c0-.56-.248-1.115-.611-1.572A6.736 6.736 0 015.25 12.75z" />
              </svg>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-tertiary-container p-4 rounded-full border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(28,27,27,1)]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-on-tertiary-container">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary opacity-10 rounded-full blur-3xl -ml-24 -mb-24"></div>
        </section>

        <section className="flex flex-col justify-center p-8 md:p-16 bg-surface">
          {/* ... mobile and form start ... */}
          <div className="md:hidden flex items-center gap-2 mb-10 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-[#FF6B4A] rounded-lg flex items-center justify-center text-white font-black text-lg border-2 border-[#1a1a1a] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">H</div>
            <span className="font-headline-md text-headline-md text-on-surface">Harin</span>
          </div>
          <div className="w-full max-w-[400px] mx-auto">
            <header className="mb-10">
              <h3 className="font-headline-lg text-headline-lg text-on-surface mb-2">Selamat Datang!</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Senang melihatmu kembali. Silakan masuk ke akunmu.</p>
            </header>

            {error && (
              <div className="bg-error-container text-error p-4 rounded-xl border-2 border-error mb-6 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleLogin}>
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-surface block" htmlFor="email">Alamat Email</label>
                <div className="relative group">
                  <input 
                    className="w-full px-5 py-4 bg-surface-container-lowest rounded-xl border-2 border-on-surface focus:ring-0 focus:border-primary focus:shadow-[4px_4px_0px_0px_rgba(118,91,0,1)] transition-all outline-none" 
                    id="email" 
                    placeholder="nama@email.com" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-label-md text-label-md text-on-surface" htmlFor="password">Kata Sandi</label>
                  <a className="text-label-sm font-label-sm text-primary hover:underline" href="#">Lupa Kata Sandi?</a>
                </div>
                <div className="relative group">
                  <input 
                    className="w-full px-5 py-4 bg-surface-container-lowest rounded-xl border-2 border-on-surface focus:ring-0 focus:border-primary focus:shadow-[4px_4px_0px_0px_rgba(118,91,0,1)] transition-all outline-none" 
                    id="password" 
                    placeholder="••••••••" 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface transition-colors p-1"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#FF6B4A] text-white font-headline-md text-headline-md rounded-xl border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(28,27,27,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(28,27,27,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
              >
                {loading ? 'Masuk...' : 'Masuk'}
              </button>
            </form>
            <div className="my-8 flex items-center gap-4">
              <hr className="flex-1 border-outline-variant"/>
              <span className="text-label-sm text-on-surface-variant font-label-sm">Atau masuk dengan</span>
              <hr className="flex-1 border-outline-variant"/>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button type="button" className="flex items-center justify-center gap-3 py-3 bg-surface-container-lowest rounded-xl border-2 border-on-surface hover:bg-surface-container transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
                <img alt="Google" className="w-5 h-5" src="https://www.gstatic.com/images/branding/googleg/1x/googleg_standard_color_128dp.png"/>
                <span className="font-label-md text-label-md text-on-surface">Google</span>
              </button>
              <button type="button" className="flex items-center justify-center gap-3 py-3 bg-surface-container-lowest rounded-xl border-2 border-on-surface hover:bg-surface-container transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
                <svg viewBox="0 0 384 512" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                </svg>
                <span className="font-label-md text-label-md text-on-surface">Apple</span>
              </button>
            </div>
            <div className="space-y-4 text-center">
              <p className="font-body-md text-body-md text-on-surface-variant">
                Belum punya akun? <button onClick={() => navigate('/signup')} className="text-[#FF6B4A] font-bold hover:underline">Daftar Sekarang</button>
              </p>
              <div className="pt-4">
                <button type="button" onClick={() => navigate('/')} className="inline-flex items-center gap-2 px-6 py-2 rounded-full border-2 border-dashed border-outline text-outline hover:bg-surface-container-high hover:text-on-surface transition-all group">
                  <span className="font-label-md text-label-md">Masuk sebagai Tamu</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Login;
