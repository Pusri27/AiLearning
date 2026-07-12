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
            .select('id, enrolled_at, courses(id, title, category, image_url, instructor, instructor_id)')
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

        // Fetch instructor profiles for signatures
        const instructorIds = [...new Set(completedCourses.map(e => e.courses?.instructor_id).filter(Boolean))];
        let instructorsMap = {};
        if (instructorIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, signature_url')
            .in('id', instructorIds);
          if (profilesData) {
            profilesData.forEach(p => {
              instructorsMap[p.id] = p;
            });
          }
        }

        // Attach instructor info
        const completedCoursesWithInstructors = completedCourses.map(e => {
          const instId = e.courses?.instructor_id;
          return {
            ...e,
            instructorProfile: instId ? instructorsMap[instId] : null
          };
        });

        // Categorize Badges
        const earned = allBadges.filter(b => earnedIds.includes(b.id));
        const locked = allBadges.filter(b => !earnedIds.includes(b.id));

        setCertificates(completedCoursesWithInstructors);
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

  const handlePrintCertificate = (cert) => {
    const studentName = profile.fullName || profile.full_name || 'Pelajar Harin';
    const courseTitle = cert.courses?.title || 'Kursus';
    const issueDate = formatDate(cert.enrolled_at);
    const instructorName = cert.instructorProfile?.full_name || cert.courses?.instructor || 'Pengajar Harin';
    const signatureUrl = cert.instructorProfile?.signature_url || '';

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup blocker aktif! Izinkan popup untuk mencetak sertifikat.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sertifikat Kelulusan - ${courseTitle}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Cinzel:wght@600;800&family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">
        <style>
          @page {
            size: landscape;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background-color: #f3f4f6;
            font-family: 'Plus Jakarta Sans', sans-serif;
            -webkit-print-color-adjust: exact;
          }
          .cert-container {
            width: 297mm;
            height: 210mm;
            box-sizing: border-box;
            background: #ffffff;
            position: relative;
            padding: 20mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
            border: 15px solid #1c1b1b;
            box-shadow: inset 0 0 100px rgba(0,0,0,0.05);
          }
          .cert-badge {
            position: absolute;
            top: 20px;
            right: 20px;
            background: #ffe082;
            border: 3px solid #1c1b1b;
            padding: 10px 20px;
            font-weight: 800;
            font-size: 14px;
            transform: rotate(5deg);
            box-shadow: 4px 4px 0px 0px #1c1b1b;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .accent-line-1 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 10px;
            background: linear-gradient(90deg, #6366f1, #a855f7, #ec4899);
          }
          .logo-container {
            text-align: center;
            margin-top: 10px;
          }
          .logo-text {
            font-family: 'Cinzel', serif;
            font-size: 28px;
            font-weight: 800;
            color: #1c1b1b;
            letter-spacing: 3px;
          }
          .logo-subtitle {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 4px;
            color: #6b7280;
            margin-top: 5px;
          }
          .content-container {
            text-align: center;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            margin: 20px 0;
          }
          .cert-title {
            font-family: 'Cinzel', serif;
            font-size: 42px;
            font-weight: 800;
            color: #1c1b1b;
            margin: 0;
            letter-spacing: 2px;
            text-transform: uppercase;
          }
          .cert-subtitle {
            font-size: 16px;
            color: #4b5563;
            margin: 15px 0 30px 0;
            font-weight: 600;
          }
          .student-name {
            font-size: 38px;
            font-weight: 800;
            color: #6366f1;
            margin: 10px 0;
            text-decoration: underline;
            text-underline-offset: 8px;
            text-decoration-color: #1c1b1b;
            text-decoration-thickness: 3px;
          }
          .cert-text {
            font-size: 14px;
            color: #4b5563;
            max-width: 700px;
            margin: 20px auto;
            line-height: 1.6;
            font-weight: 500;
          }
          .course-title {
            font-size: 24px;
            font-weight: 800;
            color: #1c1b1b;
            display: inline-block;
            border-bottom: 2px solid #a855f7;
            padding-bottom: 4px;
          }
          .footer-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding: 0 40px;
            margin-bottom: 10px;
          }
          .footer-col {
            width: 30%;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .signature-wrapper {
            height: 70px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 8px;
          }
          .signature-image {
            max-height: 65px;
            max-width: 160px;
            object-fit: contain;
          }
          .signature-text {
            font-family: 'Caveat', cursive;
            font-size: 32px;
            color: #4f46e5;
            line-height: 1;
          }
          .footer-line {
            width: 100%;
            height: 2px;
            background-color: #1c1b1b;
            margin-bottom: 8px;
          }
          .footer-label {
            font-size: 11px;
            font-weight: 800;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .footer-value {
            font-size: 13px;
            font-weight: 800;
            color: #1c1b1b;
          }
          @media print {
            body {
              background-color: #ffffff;
            }
            .cert-container {
              box-shadow: none;
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="cert-container">
          <div class="accent-line-1"></div>
          <div class="cert-badge">Official Certified</div>
          
          <div class="logo-container">
            <div class="logo-text">Harin Academy</div>
            <div class="logo-subtitle">Pusat Keunggulan Teknologi & AI</div>
          </div>

          <div class="content-container">
            <h1 class="cert-title">Sertifikat Kelulusan</h1>
            <p class="cert-subtitle">Dengan bangga mempersembahkan penghargaan ini kepada:</p>
            <div class="student-name">${studentName}</div>
            <p class="cert-text">
              yang telah menyelesaikan dengan sangat baik seluruh kurikulum pelatihan dan ujian kompetensi untuk program pembelajaran:
              <br><br>
              <span class="course-title">${courseTitle}</span>
            </p>
          </div>

          <div class="footer-container">
            <div class="footer-col">
              <div class="signature-wrapper" style="font-size: 14px; font-weight: 800; color: #4b5563; display: flex; align-items: flex-end;">
                ${issueDate}
              </div>
              <div class="footer-line"></div>
              <div class="footer-label">Tanggal Kelulusan</div>
            </div>

            <div class="footer-col">
              <div class="signature-wrapper">
                ${signatureUrl 
                  ? `<img src="${signatureUrl}" class="signature-image" alt="Tanda Tangan Pengajar" />` 
                  : `<span class="signature-text">${instructorName}</span>`
                }
              </div>
              <div class="footer-line"></div>
              <div class="footer-value">${instructorName}</div>
              <div class="footer-label">Instruktur Kelas</div>
            </div>

            <div class="footer-col">
              <div class="signature-wrapper" style="display: flex; align-items: center; justify-content: center;">
                <svg width="60" height="60" viewBox="0 0 100 100" style="color: #6366f1;">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="6 3" />
                  <path d="M 30 50 L 45 65 L 70 35" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <div class="footer-line"></div>
              <div class="footer-value">Harin Verification System</div>
              <div class="footer-label">ID Terverifikasi</div>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

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
                    <button 
                      onClick={() => handlePrintCertificate(cert)}
                      className="bg-secondary text-on-secondary border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg py-3 font-black text-sm flex items-center justify-center gap-2 hover:bg-secondary-container hover:text-on-secondary-container transition-all"
                    >
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
