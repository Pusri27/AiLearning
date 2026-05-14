import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

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
              <span className="material-symbols-outlined text-on-surface text-[40px]">auto_stories</span>
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tighter">Lumina</h1>
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
              <span className="material-symbols-outlined text-on-secondary-container">lightbulb</span>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-tertiary-container p-4 rounded-full border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(28,27,27,1)]">
              <span className="material-symbols-outlined text-on-tertiary-container">star</span>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary opacity-10 rounded-full blur-3xl -ml-24 -mb-24"></div>
        </section>

        <section className="flex flex-col justify-center p-8 md:p-16 bg-surface">
          {/* ... mobile and form start ... */}
          <div className="md:hidden flex items-center gap-2 mb-10 cursor-pointer" onClick={() => navigate('/')}>
            <span className="material-symbols-outlined text-primary text-[32px]">auto_stories</span>
            <span className="font-headline-md text-headline-md text-on-surface">Lumina</span>
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
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant">mail</span>
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
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant cursor-pointer">visibility</span>
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
              <button type="button" className="flex items-center justify-center gap-3 py-3 bg-surface-container-lowest rounded-xl border-2 border-on-surface hover:bg-surface-container transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <img alt="Google" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD317ffWjGDKN-GWW0XEE8lxfP6BnoIaFyYfWvFAlLKdfCcpTKKw_2HDdF_dap9zP0R2-QStCi24EjhtZUX8Gri9YOYHh6ZyAw-OI68NfZTPcb-s4PqU_MolKsqx48oC7NNjB8Wb_fe5IPgGtJaZ68hENPQ3D4ApvJD6vtNVAdDM5y2jsq3pL68T7OSN0YNdaZfMKwyZVmY6I_8sd_Qbj7loMcocpA3Uk88EgcSnNjKRKHfUiIMt5cvS71LiHyVHoWpwywAI3NuNyI"/>
                <span className="font-label-md text-label-md text-on-surface">Google</span>
              </button>
              <button type="button" className="flex items-center justify-center gap-3 py-3 bg-surface-container-lowest rounded-xl border-2 border-on-surface hover:bg-surface-container transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <span className="material-symbols-outlined text-[20px]">ios</span>
                <span className="font-label-md text-label-md text-on-surface">Apple</span>
              </button>
            </div>
            <div className="space-y-4 text-center">
              <p className="font-body-md text-body-md text-on-surface-variant">
                Belum punya akun? <button onClick={() => navigate('/signup')} className="text-[#FF6B4A] font-bold hover:underline">Daftar Sekarang</button>
              </p>
              <div className="pt-4">
                <button type="button" onClick={() => navigate('/')} className="inline-flex items-center gap-2 px-6 py-2 rounded-full border-2 border-dashed border-outline text-outline hover:bg-surface-container-high hover:text-on-surface transition-all group">
                  <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">person_search</span>
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
