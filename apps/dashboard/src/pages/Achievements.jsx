import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationDropdown from '../components/NotificationDropdown';
import ProfileDropdown from '../components/ProfileDropdown';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabaseClient';
import { checkAchievements } from '../lib/achievementService';

import { useUserProfile } from '../context/UserProfileContext';

const Achievements = () => {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const isGuest = profile.isGuest;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ certificates: 0, badges: 0 });
  const [certificates, setCertificates] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [lockedBadges, setLockedBadges] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session && !isGuest) {
        navigate('/login');
        return;
      }

      if (session) {
        // Cek lencana baru otomatis
        await checkAchievements(session.user.id);

        const uid = session.user.id;

        // Parallel Fetch
        const [enrollRes, earnedAchRes, allAchRes] = await Promise.all([
          // 1. Get completed courses for Certificates
          supabase
            .from('enrollments')
            .select('id, enrolled_at, courses(title, category, image_url)')
            .eq('user_id', uid)
            .eq('progress', 100),
          
          // 2. Get earned badges
          supabase
            .from('user_achievements')
            .select('achievement_id')
            .eq('user_id', uid),

          // 3. Get all master achievements
          supabase
            .from('achievements')
            .select('*')
        ]);

        const completedCourses = enrollRes.data || [];
        const earnedIds = earnedAchRes.data?.map(a => a.achievement_id) || [];
        const allBadges = allAchRes.data || [];

        // Categorize Badges
        const earned = allBadges.filter(b => earnedIds.includes(b.id));
        const locked = allBadges.filter(b => !earnedIds.includes(b.id));

        setCertificates(completedCourses);
        setEarnedBadges(earned);
        setLockedBadges(locked);
        setStats({
          certificates: completedCourses.length,
          badges: earned.length
        });
      } else {
        // Guest mode: fetch only public achievements as locked
        const { data: allBadges } = await supabase.from('achievements').select('*');
        setCertificates([]);
        setEarnedBadges([]);
        setLockedBadges(allBadges || []);
        setStats({ certificates: 0, badges: 0 });
      }
      setLoading(false);
    };

    fetchData();
  }, [navigate, isGuest]);

  const formatDate = (d) => 
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="bg-surface text-on-surface font-body-md flex h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 h-full overflow-y-auto bg-background p-8 md:p-10">
        {/* Header Section */}
        <header className="mb-12 border-b-4 border-on-surface pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-headline-xl text-on-surface mb-2 font-black">Pencapaian & Sertifikat</h1>
            <p className="font-body-lg text-on-surface-variant">Lacak perkembangan belajarmu dan rayakan setiap langkah.</p>
          </div>
          {/* Quick Stats Bento */}
          <div className="flex gap-4">
            <div className="bg-primary-container border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl p-4 flex flex-col items-center justify-center min-w-[140px]">
              <span className="font-headline-md text-on-primary-container font-black">{stats.certificates}</span>
              <span className="font-label-bold text-on-surface-variant text-[10px] uppercase">Sertifikat</span>
            </div>
            <div className="bg-secondary-fixed border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl p-4 flex flex-col items-center justify-center min-w-[140px]">
              <span className="font-headline-md text-on-secondary-container font-black">{stats.badges}</span>
              <span className="font-label-bold text-on-surface-variant text-[10px] uppercase">Lencana</span>
            </div>
          </div>
        </header>

        {/* Sertifikat Saya Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Icon name="workspace_premium" className="w-8 h-8 text-primary" />
            <h2 className="font-headline-lg text-on-surface font-black">Sertifikat Saya</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              [1, 2].map(i => <div key={i} className="h-64 bg-on-surface/5 animate-pulse border-4 border-on-surface rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />)
            ) : certificates.length === 0 ? (
              <div className="col-span-full bg-surface-container-low border-4 border-dashed border-on-surface rounded-xl flex flex-col items-center justify-center p-12 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Icon name="school" className="w-16 h-16 text-on-surface-variant opacity-30 mb-4" />
                <h3 className="font-headline-md text-on-surface mb-2">Belum Ada Sertifikat</h3>
                <p className="font-body-md text-on-surface-variant mb-6">Selesaikan kursus hingga 100% untuk mendapatkan sertifikat.</p>
                <button 
                  onClick={() => navigate('/catalog')}
                  className="bg-primary text-on-primary border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg py-2 px-8 font-label-bold hover:translate-x-[-2px] transition-all"
                >
                  Mulai Belajar
                </button>
              </div>
            ) : (
              certificates.map((cert, idx) => (
                <div key={idx} className="bg-white border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl flex flex-col overflow-hidden hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <div className="h-40 bg-surface-variant border-b-4 border-on-surface relative flex items-center justify-center overflow-hidden">
                    {cert.courses?.image_url && <img alt="Cert" className="absolute inset-0 w-full h-full object-cover opacity-40" src={cert.courses.image_url} />}
                    <div className="relative z-10 bg-primary-container border-2 border-on-surface px-4 py-1 rounded-full rotate-[-5deg] font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      CERTIFIED
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="font-headline-md text-on-surface mb-1 line-clamp-2">{cert.courses?.title}</h3>
                    <p className="text-xs font-bold text-on-surface-variant mb-4 uppercase">{cert.courses?.category}</p>
                    <p className="font-body-sm text-on-surface-variant mb-6 flex-1">Lulus pada {formatDate(cert.enrolled_at)}</p>
                    <button className="bg-secondary text-on-secondary border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg py-3 font-black text-sm flex items-center justify-center gap-2 hover:bg-secondary-container hover:text-on-secondary-container transition-all">
                      <Icon name="download" className="w-5 h-5" />
                      UNDUH PDF
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Lencana (Badges) Section */}
        <section>
          <div className="flex items-center gap-3 mb-8 pb-4 border-b-4 border-on-surface">
            <Icon name="military_tech" className="w-8 h-8 text-on-surface" />
            <h2 className="font-headline-lg text-on-surface font-black">Koleksi Lencana</h2>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 pb-20">
            {/* Earned Badges */}
            <div className="bg-surface-container-low border-4 border-on-surface rounded-xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-headline-md text-on-surface mb-8 flex items-center gap-3">
                <Icon name="check_circle" className="w-6 h-6 text-primary" />
                Sudah Didapat
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {loading ? (
                  [1, 2, 3].map(i => <div key={i} className="aspect-square bg-on-surface/5 animate-pulse rounded-lg border-2 border-on-surface" />)
                ) : earnedBadges.length === 0 ? (
                  <p className="col-span-full text-center text-on-surface-variant font-bold opacity-50 py-10 italic">Belum ada lencana yang didapat.</p>
                ) : (
                  earnedBadges.map((badge, idx) => (
                    <div key={idx} className="bg-white border-2 border-on-surface rounded-lg p-4 flex flex-col items-center text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-4px] transition-transform group relative">
                      <div className={`w-16 h-16 ${badge.color_class} border-2 border-on-surface rounded-full flex items-center justify-center mb-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                        <Icon name={badge.icon_name} className="w-8 h-8 text-on-surface" />
                      </div>
                      <span className="font-black text-on-surface text-[10px] uppercase leading-tight mb-1">{badge.title}</span>
                      <p className="text-[9px] text-on-surface-variant font-medium leading-tight">{badge.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Locked Badges */}
            <div className="bg-surface-variant border-4 border-on-surface rounded-xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] opacity-70">
              <h3 className="font-headline-md text-on-surface-variant mb-8 flex items-center gap-3">
                <Icon name="lock" className="w-6 h-6" />
                Belum Terbuka
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {loading ? (
                  [1, 2].map(i => <div key={i} className="aspect-square bg-on-surface/5 animate-pulse rounded-lg border-2 border-on-surface" />)
                ) : lockedBadges.length === 0 ? (
                  <p className="col-span-full text-center text-on-surface-variant font-bold py-10">Luar biasa! Semua lencana sudah terbuka.</p>
                ) : (
                  lockedBadges.map((badge, idx) => (
                    <div key={idx} className="bg-surface-dim border-2 border-dashed border-on-surface rounded-lg p-4 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-outline-variant border-2 border-dashed border-on-surface rounded-full flex items-center justify-center mb-3 grayscale opacity-30">
                        <Icon name={badge.icon_name} className="w-8 h-8" />
                      </div>
                      <span className="font-black text-on-surface-variant text-[10px] uppercase leading-tight mb-1">{badge.title}</span>
                      <p className="text-[9px] text-on-surface-variant italic leading-tight">Syarat: {badge.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Achievements;
