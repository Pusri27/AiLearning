import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, NavLink, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileDropdown from '../components/ProfileDropdown';
import NotificationDropdown from '../components/NotificationDropdown';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabaseClient';
import { showToast, friendlyError } from '../lib/toast';
import { useUserProfile } from '../context/UserProfileContext';
import { courseService } from '../lib/courseService';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const isGuest = profile.isGuest;
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [syllabus, setSyllabus] = useState([]);
  const [instructorStats, setInstructorStats] = useState({ courses: 0, students: 0 });
  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const [avgRating, setAvgRating] = useState(null);
  const [collaborators, setCollaborators] = useState([]);

  const [enrollmentProgress, setEnrollmentProgress] = useState(0);
  const [lessons, setLessons] = useState([]);

  const curriculumRef = React.useRef(null);
  const [sections, setSections] = useState([]);
  // Helper: Get first sentence for description
  const getBriefDesc = (text) => {
    if (!text) return 'Pelajari materi ini untuk meningkatkan skill kamu.';
    return text.split('.')[0] + '.';
  };

  // Helper: Calculate Hours based on video count
  const calculateHours = () => {
    const videoCount = syllabus.filter(s => s.video_url).length;
    if (videoCount === 0) return '2 Hours'; // Min hours
    return `${videoCount * 0.5} Hours`; // Estimate 30 mins per video
  };

  const [enrollmentId, setEnrollmentId] = useState(null);
  const [userCertificate, setUserCertificate] = useState(null);
  const [showCertPreview, setShowCertPreview] = useState(false);


  const handlePrintCertificate = (cert) => {
    const printWindow = window.open('', '_blank', 'width=900,height=650');
    const formattedDate = cert.issued_at ? new Date(cert.issued_at).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }) : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    
    const studentName = profile?.fullName || profile?.full_name || "Pelajar Premium";
    const courseTitle = cert.courses?.title || "Kelas AiLearning";
    
    const rawId = cert.id && String(cert.id).startsWith('cert-') ? cert.id.replace('cert-', '') : cert.id;
    const certId = `CERT-${rawId || 'ONLINE'}-${String(profile?.id || 'GUEST').slice(0, 8).toUpperCase()}`;

    const content = `
      <div style="font-family:'Outfit', 'Inter', sans-serif; display:flex; justify-content:center; align-items:center; min-height:98vh; background:#fefefe; padding:20px; box-sizing:border-box;">
        <div style="width:100%; max-width:800px; border:10px double #000; padding:40px; background:#fffcf5; text-align:center; position:relative; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
          <div style="position:absolute; top:15px; left:15px; width:40px; height:40px; border-top:4px solid #000; border-left:4px solid #000;"></div>
          <div style="position:absolute; top:15px; right:15px; width:40px; height:40px; border-top:4px solid #000; border-right:4px solid #000;"></div>
          <div style="position:absolute; bottom:15px; left:15px; width:40px; height:40px; border-bottom:4px solid #000; border-left:4px solid #000;"></div>
          <div style="position:absolute; bottom:15px; right:15px; width:40px; height:40px; border-bottom:4px solid #000; border-right:4px solid #000;"></div>
          
          <div style="font-size:24px; font-weight:900; letter-spacing:4px; margin-bottom:20px; text-transform:uppercase;">AiLearning Academy</div>
          <div style="font-size:38px; font-weight:900; color:#000; text-transform:uppercase; margin-bottom:30px; border-bottom:4px solid #000; display:inline-block; padding-bottom:10px; letter-spacing:1px;">SERTIFIKAT KELULUSAN</div>
          
          <div style="font-size:16px; font-weight:700; color:#4b5563; margin-bottom:10px; text-transform:uppercase; letter-spacing:2px;">Diberikan Kepada</div>
          <div style="font-size:34px; font-weight:900; color:#000; text-decoration:underline; text-transform:capitalize; margin-bottom:25px; font-style:italic;">${studentName}</div>
          
          <div style="font-size:16px; font-weight:700; color:#4b5563; margin-bottom:10px; text-transform:uppercase; letter-spacing:2px;">Atas Keberhasilannya Menyelesaikan Kelas</div>
          <div style="font-size:26px; font-weight:900; color:#2563eb; margin-bottom:40px; line-height:1.3;">${courseTitle}</div>
          
          <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:50px; padding:0 30px;">
            <div style="text-align:left;">
              <div style="font-size:12px; font-weight:700; color:#6b7280; text-transform:uppercase;">Tanggal Kelulusan</div>
              <div style="font-size:15px; font-weight:900; color:#000; margin-top:5px;">${formattedDate}</div>
            </div>
            <div style="text-align:center;">
              <div style="width:120px; height:2px; background:#000; margin-bottom:8px;"></div>
              <div style="font-size:12px; font-weight:900; text-transform:uppercase; color:#000;">Harin AI System</div>
              <div style="font-size:10px; font-weight:700; color:#6b7280;">Verifikasi Resmi</div>
            </div>
          </div>
          
          <div style="margin-top:40px; font-size:10px; font-weight:700; color:#9ca3af; letter-spacing:1px;">ID Verifikasi: ${certId}</div>
        </div>
      </div>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>Sertifikat Kelulusan - ${studentName}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap" rel="stylesheet">
          <style>
            body { margin: 0; padding: 0; background-color: #ffffff; }
            @media print {
              body { background: none; }
              @page { size: landscape; margin: 0; }
            }
          </style>
        </head>
        <body>
          ${content}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  useEffect(() => {
    fetchCourse();
    if (isGuest) {
      const timer = setTimeout(() => setShowGuestPrompt(true), 500);
      return () => clearTimeout(timer);
    }
  }, [id, isGuest]);

  const fetchCourse = useCallback(async () => {
    setLoading(true);
    try {
      const { data: courseData, error: courseError } = await supabase
        .from('courses').select('*').eq('id', id).single();

      if (courseError) throw courseError;

      if (courseData) {
        let instructorData = null;
        if (courseData.instructor_id) {
          const { data: instData } = await supabase
            .from('profiles').select('full_name, avatar_url').eq('id', courseData.instructor_id).maybeSingle();
          instructorData = instData;
        }

        if (!instructorData && courseData.instructor) {
          const { data: fallbackData } = await supabase
            .from('profiles').select('full_name, avatar_url').ilike('full_name', courseData.instructor).limit(1).maybeSingle();
          if (fallbackData) instructorData = fallbackData;
        }
        
        setCourse({ ...courseData, profiles: instructorData });
        const content = await courseService.getCourseContent(id);
        
        const sortSyllabus = (sylList) => {
          if (!sylList) return [];
          return [...sylList].sort((a, b) => {
            const aIsAssignment = a.type === 'assignment' || a.type === 'final_project' || !!a.assignment_text;
            const bIsAssignment = b.type === 'assignment' || b.type === 'final_project' || !!b.assignment_text;
            if (aIsAssignment && !bIsAssignment) return 1;
            if (!aIsAssignment && bIsAssignment) return -1;
            return a.sort_order - b.sort_order;
          });
        };

        const processedSections = content.map(sec => ({
          ...sec,
          course_syllabus: sortSyllabus(sec.course_syllabus)
        }));
        setSections(processedSections);

        const syllabusList = processedSections.flatMap(s => s.course_syllabus);
        setSyllabus(syllabusList);

        const { count: totalCount } = await supabase
          .from('enrollments').select('*', { count: 'exact', head: true }).eq('course_id', id);
        setEnrollmentCount(totalCount || 0);

        const { data: ratings } = await supabase
          .from('course_ratings').select('rating').eq('course_id', id);
        if (ratings && ratings.length > 0) {
          const avg = ratings.reduce((a, b) => a + b.rating, 0) / ratings.length;
          setAvgRating(avg.toFixed(1));
        }

        if (courseData.instructor_id) {
          const { data: instructorCourses } = await supabase
            .from('courses').select('id').eq('instructor_id', courseData.instructor_id);
          const instructorCourseIds = instructorCourses?.map(c => c.id) || [];
          const { count: totalStudents } = await supabase
            .from('enrollments').select('*', { count: 'exact', head: true }).in('course_id', instructorCourseIds);
          setInstructorStats({ courses: instructorCourseIds.length, students: totalStudents || 0 });
        }

        const { data: collabData } = await supabase
          .from('course_collaborators').select('teacher_id, role').eq('course_id', id).eq('status', 'accepted');
        if (collabData && collabData.length > 0) {
          const teacherIds = collabData.map(c => c.teacher_id);
          const { data: profileData } = await supabase.from('profiles').select('id, full_name, username, avatar_url').in('id', teacherIds);
          if (profileData) {
            const joinedCollaborators = collabData.map(c => {
              const p = profileData.find(prof => prof.id === c.teacher_id);
              return { ...p, role: c.role };
            }).filter(c => c.id);
            setCollaborators(joinedCollaborators);
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: enrollment } = await supabase
            .from('enrollments').select('id, progress, enrolled_at').eq('user_id', session.user.id).eq('course_id', id).maybeSingle();
          if (enrollment) {
            setIsEnrolled(true);
            setEnrollmentId(enrollment.id);
            const { data: userProgress } = await supabase
              .from('user_progress').select('syllabus_id').eq('user_id', session.user.id).eq('course_id', id);

            const mappedLessons = syllabusList.map(item => {
              const isComp = userProgress ? userProgress.some(p => p.syllabus_id === item.id) : false;
              let t = 'reading'; let ic = 'menu_book';
              if (item.type === 'assignment') { t = 'assignment'; ic = 'assignment'; }
              else if (item.video_url) { t = 'video'; ic = 'play_circle'; }
              return { 
                id: item.id, 
                title: item.title, 
                duration: item.type === 'assignment' ? 'Penugasan' : '30 mins', 
                type: t, 
                icon: ic, 
                content: item.content || item.assignment_text || '',
                completed: isComp 
              };
            });
            setLessons(mappedLessons);
            const compCount = mappedLessons.filter(l => l.completed).length;
            const newProg = mappedLessons.length > 0 ? Math.round((compCount / mappedLessons.length) * 100) : 0;
            setEnrollmentProgress(newProg);
            if (newProg !== enrollment.progress) {
              await supabase.from('enrollments').update({ progress: newProg }).eq('id', enrollment.id);
            }

            // Fetch certificate or synthesize auto-generated certificate if progress is 100%
            const { data: certData } = await supabase
              .from('certificates')
              .select('id, course_id, issued_at, certificate_url')
              .eq('user_id', session.user.id)
              .eq('course_id', id)
              .maybeSingle();

            if (certData) {
              setUserCertificate({
                ...certData,
                courses: courseData
              });
            } else if (newProg === 100) {
              setUserCertificate({
                id: `cert-${id}`,
                course_id: id,
                issued_at: enrollment.enrolled_at || new Date().toISOString(),
                certificate_url: null,
                courses: courseData,
                isAutoGenerated: true
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching course:', err);
      showToast(friendlyError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (isMounted) await fetchCourse();
    };
    loadData();
    
    if (isGuest) {
      const timer = setTimeout(() => {
        if (isMounted) setShowGuestPrompt(true);
      }, 500);
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
    return () => { isMounted = false; };
  }, [fetchCourse, isGuest]);

  const handleContinueLearning = () => {
    let nextLessonId = null;
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const uncompleted = section.course_syllabus.find(s => !lessons.find(l => l.id === s.id)?.completed);
      if (uncompleted) {
        let locked = false;
        for (let j = 0; j < i; j++) {
          if (!sections[j].course_syllabus.every(s => lessons.find(l => l.id === s.id)?.completed)) { locked = true; break; }
        }
        if (!locked) { nextLessonId = uncompleted.id; break; }
      }
    }
    if (nextLessonId) { navigate(`/courses/${id}/learn/${nextLessonId}`); }
    else if (lessons.length > 0) { navigate(`/courses/${id}/learn/${lessons[0].id}`); }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);
  };

  const handleAddToCart = async () => {
    if (isGuest) { setShowGuestPrompt(true); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate('/login'); return; }
    const { error } = await supabase.from('cart').insert([{ user_id: session.user.id, course_id: course.id }]);
    if (error) {
      if (error.code === '23505') { showToast('Kursus ini sudah ada di keranjang kamu.', 'error'); }
      else { showToast(friendlyError(error), 'error'); }
    } else {
      showToast('Kursus berhasil ditambahkan ke keranjang!');
      navigate('/cart');
    }
  };

  if (loading) return (
    <div className="bg-background text-on-background flex h-screen items-center justify-center">
      <div className="w-16 h-16 border-4 border-on-surface border-t-primary rounded-full animate-spin"></div>
    </div>
  );

  if (!course) return (
    <div className="bg-background text-on-background flex h-screen items-center justify-center flex-col gap-4">
      <h1 className="font-headline-lg">Kursus tidak ditemukan</h1>
      <button onClick={() => navigate('/catalog')} className="px-6 py-2 bg-primary text-white rounded-lg border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Kembali ke Katalog</button>
    </div>
  );

  // Parse what_will_learn safely
  let whatWillLearnList = [];
  if (course?.what_will_learn) {
    try {
      if (Array.isArray(course.what_will_learn)) {
        whatWillLearnList = course.what_will_learn;
      } else {
        whatWillLearnList = JSON.parse(course.what_will_learn);
      }
      whatWillLearnList = whatWillLearnList.filter(item => item && item.trim());
    } catch (e) {
      console.error("Failed to parse what_will_learn", e);
    }
  }

  // Formatting helpers for description
  const parseInlineStyles = (text) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-black text-on-surface">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={index} className="italic">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  const renderFormattedDescription = (desc) => {
    if (!desc) return <p className="italic text-on-surface-variant/70">Tidak ada deskripsi tersedia.</p>;
    const lines = desc.split('\n');
    return (
      <div className="space-y-2">
        {lines.map((line, idx) => {
          let trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-2" />;
          if (trimmed.startsWith('###')) {
            return <h4 key={idx} className="text-md font-black text-on-surface mt-4 mb-2">{trimmed.replace('###', '').trim()}</h4>;
          }
          if (trimmed.startsWith('##')) {
            return <h3 key={idx} className="text-lg font-black text-on-surface mt-4 mb-2">{trimmed.replace('##', '').trim()}</h3>;
          }
          if (trimmed.startsWith('•') || trimmed.startsWith('*') || trimmed.startsWith('-')) {
            const cleanText = trimmed.replace(/^[•*\-]\s*/, '');
            return (
              <div key={idx} className="flex gap-2 items-start pl-2">
                <span className="text-primary font-black mt-0.5">•</span>
                <span className="flex-1">{parseInlineStyles(cleanText)}</span>
              </div>
            );
          }
          const numMatch = trimmed.match(/^(\d+)[.)]\s*(.*)/);
          if (numMatch) {
            const num = numMatch[1];
            const cleanText = numMatch[2];
            return (
              <div key={idx} className="flex gap-2 items-start pl-2">
                <span className="text-primary font-black min-w-[16px] text-right">{num}.</span>
                <span className="flex-1">{parseInlineStyles(cleanText)}</span>
              </div>
            );
          }
          return <p key={idx} className="leading-relaxed">{parseInlineStyles(trimmed)}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="bg-background text-on-background font-body-md flex h-screen overflow-hidden relative">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex items-center justify-between px-margin-mobile md:px-margin-desktop py-4 bg-surface border-b-2 border-on-background shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] shrink-0">
          <div className="flex items-center gap-4 md:hidden">
            <Icon name="auto_awesome" className="w-8 h-8 text-primary-container" />
            <h1 className="font-headline-md text-headline-md font-black">Harin</h1>
          </div>
          <div className="hidden md:flex flex-1 max-w-xl relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
            <input className="w-full bg-surface-container-high border-2 border-on-background rounded-full py-2 pl-10 pr-4 font-body-md text-body-md focus:outline-none focus:border-primary-container focus:bg-surface transition-colors shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]" placeholder="Search courses..." type="text"/>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <NotificationDropdown />
            <ProfileDropdown />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-margin-mobile md:p-margin-desktop lg:p-10 max-w-container-max mx-auto w-full space-y-8">
          <nav className="flex items-center gap-2 text-sm font-label-bold text-on-surface-variant">
            <NavLink to="/catalog" className="hover:text-primary transition-colors">Courses</NavLink>
            <Icon name="chevron_right" className="w-4 h-4" />
            <span className="text-on-background">{course.title}</span>
          </nav>

          <div className="bg-surface rounded-xl border-2 border-on-background shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] overflow-hidden flex flex-col lg:flex-row">
            <div className="lg:w-2/3 p-8 lg:p-10 flex flex-col justify-center border-b-2 lg:border-b-0 lg:border-r-2 border-on-background">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full border-2 border-on-background font-label-bold text-xs uppercase tracking-wider">{course.category}</span>
                <span className="px-3 py-1 bg-primary-container text-on-primary-container rounded-full border-2 border-on-background font-label-bold text-xs uppercase tracking-wider">{course.level || 'Beginner'}</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-on-background mb-4">{course.title}</h1>
              <div className="flex flex-wrap items-center gap-6 mb-8 text-on-surface-variant font-body-md">
                <div className="flex items-center gap-1">
                  {enrollmentCount > 0 ? (
                    <>
                      <Icon name="star" className="w-5 h-5 text-primary-container fill-current" />
                      <span className="font-bold text-on-background">{avgRating}</span>
                      <span>({enrollmentCount} reviews)</span>
                    </>
                  ) : (
                    <span className="italic text-sm">Belum ada ulasan</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="group" className="w-5 h-5" />
                  <span>{enrollmentCount.toLocaleString()} Students</span>
                </div>
              </div>
              <div className="mb-8">
                <span className="text-3xl font-headline-xl text-primary">{formatPrice(course.price)}</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-auto w-full">
                {isEnrolled ? (
                  <>
                    <button 
                      onClick={handleContinueLearning}
                      className="px-8 py-4 bg-primary text-white rounded-lg border-2 border-on-background font-headline-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:scale-95 flex-1"
                    >
                      {enrollmentProgress === 100 ? 'Pelajari Kembali' : 'Lanjutkan Belajar'}
                    </button>
                    {enrollmentProgress === 100 && (
                      <button 
                        onClick={() => setShowCertPreview(true)}
                        className="px-8 py-4 bg-[#FFB800] text-on-background rounded-lg border-2 border-on-background font-headline-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:scale-95 flex-1 flex items-center justify-center gap-2"
                      >
                        <Icon name="workspace_premium" className="w-6 h-6" />
                        Lihat Sertifikat
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => isGuest ? setShowGuestPrompt(true) : navigate('/checkout', { state: { courseId: course.id } })}
                      className="px-8 py-4 bg-tertiary text-on-tertiary rounded-lg border-2 border-on-background font-headline-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:scale-95 flex-1"
                    >
                      Beli Sekarang
                    </button>
                    <button 
                      onClick={handleAddToCart}
                      className="px-8 py-4 bg-primary-container text-on-primary-container rounded-lg border-2 border-on-background font-headline-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:scale-95 flex-1 flex items-center justify-center gap-2"
                    >
                      <Icon name="shopping_cart" className="w-6 h-6" />
                      Tambah ke Keranjang
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="lg:w-1/3 bg-surface relative min-h-[300px] border-l-2 border-on-background">
              <img alt={course.title} className="absolute inset-0 w-full h-full object-cover" src={course.image_url || 'https://via.placeholder.com/600x400'}/>
              <div className="absolute bottom-6 right-6 bg-white border-2 border-on-background rounded-lg p-3 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] flex items-center gap-3 max-w-[280px]">
                <div className="flex -space-x-4">
                  <div className="w-12 h-12 rounded-full border-2 border-on-background overflow-hidden bg-white z-10 flex-shrink-0">
                    <img alt={course.profiles?.full_name || course.instructor} className="w-full h-full object-cover" src={course.profiles?.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(course.profiles?.full_name || course.instructor || 'I')}/>
                  </div>
                  {collaborators.slice(0, 2).map((collab, idx) => (
                    <div key={idx} className="w-12 h-12 rounded-full border-2 border-on-background overflow-hidden bg-white flex-shrink-0" style={{ zIndex: 9 - idx }}>
                      <img alt={collab.full_name} className="w-full h-full object-cover" src={collab.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(collab.full_name || 'C')}/>
                    </div>
                  ))}
                  {collaborators.length > 2 && (
                    <div className="w-12 h-12 rounded-full border-2 border-on-background bg-secondary-container flex items-center justify-center font-black text-xs text-on-secondary-container z-0 flex-shrink-0">
                      +{collaborators.length - 2}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-label-bold text-label-bold text-sm line-clamp-1">
                    {course.profiles?.full_name || course.instructor}
                    {collaborators.length > 0 && ` + ${collaborators.length} Guru`}
                  </p>
                  <p className="text-xs text-on-surface-variant line-clamp-1">
                    {collaborators.length > 0 ? 'Team Instructors' : (course.instructor_role || 'Lead Instructor')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
            <div className="lg:col-span-2 space-y-8">
              {isEnrolled && (
                <section 
                  ref={curriculumRef} 
                  className="bg-surface rounded-xl border-2 border-on-background p-6 md:p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-on-background">
                    <div>
                      <h2 className="font-headline-lg text-headline-lg">Materi & Modul Belajar</h2>
                      <p className="text-sm text-on-surface-variant mt-1">Selesaikan seluruh modul untuk meningkatkan progress belajarmu.</p>
                    </div>
                    <div className="bg-primary-container border-2 border-on-background px-4 py-2 rounded-lg text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <p className="text-xs font-bold text-on-primary-container-variant">Progres Kamu</p>
                      <p className="font-headline-md font-black text-xl text-primary">{enrollmentProgress}%</p>
                    </div>
                  </div>

                  <div className="space-y-10">
                    {sections.map((section, sIdx) => (
                      <div key={section.id}>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="px-3 py-1 bg-on-surface text-white rounded-lg text-xs font-black uppercase tracking-tighter">Bab {sIdx + 1}</div>
                          <h3 className="font-headline-md text-xl text-on-surface">{section.title}</h3>
                        </div>
                        <div className="space-y-3 pl-2 border-l-4 border-on-surface/10 ml-4">
                          {section.course_syllabus?.map((syl) => {
                            const isCompleted = lessons.find(l => l.id === syl.id)?.completed;
                            const isAssignment = syl.type === 'assignment' || 
                                                 syl.type === 'final_project' || 
                                                 !!syl.assignment_text;
                            const isCoding = syl.type === 'coding' || 
                                             syl.type === 'interactive' || 
                                             (syl.initial_code && syl.test_cases);
                            
                            return (
                              <div 
                                key={syl.id}
                                onClick={() => navigate(`/courses/${id}/learn/${syl.id}`)}
                                className={`group border-2 border-on-background p-4 rounded-xl flex items-center justify-between gap-4 cursor-pointer hover:bg-primary-container/20 transition-all ${isCompleted ? 'bg-surface-container-low opacity-80' : 'bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'} ${isAssignment ? 'bg-secondary-container/5 border-secondary/30' : ''}`}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-lg border-2 border-on-background flex items-center justify-center ${isCompleted ? 'bg-tertiary-container text-on-tertiary-container' : isAssignment ? 'bg-secondary-container text-secondary' : 'bg-surface-container text-on-surface'}`}>
                                    <Icon name={isCompleted ? 'check' : isAssignment ? 'assignment' : isCoding ? 'code' : (syl.video_url ? 'play_circle' : 'menu_book')} className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <h4 className="font-label-bold text-on-surface group-hover:text-primary transition-colors text-sm md:text-base">{syl.title}</h4>
                                    <div className="flex items-center gap-3 mt-0.5">
                                      <span className="text-[10px] text-on-surface-variant flex items-center gap-1 font-bold uppercase">
                                        <Icon name="schedule" className="w-3 h-3" /> {isAssignment ? 'Penugasan' : 'Materi'}
                                      </span>
                                      {isAssignment && (
                                        <span className="text-[9px] bg-secondary/10 text-secondary px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter border border-secondary/20">Wajib Selesai</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {isCompleted ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-600/30 flex items-center gap-1 uppercase">
                                        Selesai
                                      </span>
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/courses/${id}/learn/${syl.id}`);
                                      }}
                                      className={`px-4 py-1.5 text-xs font-black rounded-lg border-2 border-on-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-[-1px] group-hover:translate-y-[-1px] group-hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all ${isAssignment ? 'bg-secondary text-white' : 'bg-primary text-white'}`}
                                    >
                                      {isAssignment ? 'Lihat Tugas' : 'Mulai'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="bg-surface rounded-xl border-2 border-on-background p-6 md:p-8 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)]">
                <h2 className="font-headline-lg text-headline-lg mb-4 pb-4 border-b-2 border-on-background">Tentang Kursus Ini</h2>
                <div className="space-y-4 text-body-md font-body-md text-on-surface-variant">
                  {renderFormattedDescription(course.description)}
                </div>
              </section>

              <section className="bg-secondary-fixed rounded-xl border-2 border-on-background p-6 md:p-8 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)]">
                <h2 className="font-headline-lg text-headline-lg mb-6 text-on-secondary-fixed">Apa yang Akan Kamu Pelajari</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {whatWillLearnList.length > 0 ? (
                    whatWillLearnList.map((item, index) => (
                      <div key={index} className="bg-surface border-2 border-on-background p-4 rounded-lg flex gap-3 items-start shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]">
                        <div className="p-1.5 bg-emerald-100 rounded-full border border-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5 animate-bounce-once">
                          <Icon name="check" className="w-4 h-4 text-emerald-600 font-black" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-label-bold text-on-surface leading-tight">{item}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    syllabus.filter(s => s.type !== 'assignment').length > 0 ? 
                      syllabus.filter(s => s.type !== 'assignment').slice(0, 4).map((s) => (
                      <div key={s.id} className="bg-surface border-2 border-on-background p-4 rounded-lg flex gap-4 items-start shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]">
                        <div className="p-2 bg-secondary-container rounded-md border-2 border-on-surface flex items-center justify-center">
                          <Icon name="account_tree" className="w-6 h-6 text-secondary" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <h3 className="font-label-bold text-label-bold mb-1 truncate">{s.title}</h3>
                          <p className="text-[10px] text-on-surface-variant line-clamp-2">{getBriefDesc(s.content)}</p>
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm text-on-secondary-fixed italic">Belum ada materi silabus yang diunggah.</p>
                    )
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <div className="bg-surface rounded-xl border-2 border-on-background p-6 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full border-2 border-on-background overflow-hidden mb-4 shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]">
                  <img alt={course.profiles?.full_name || course.instructor} className="w-full h-full object-cover" src={course.profiles?.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(course.profiles?.full_name || course.instructor || 'I')}/>
                </div>
                <h3 className="font-headline-md text-headline-md mb-1">{course.profiles?.full_name || course.instructor || 'Instructor'}</h3>
                <p className="text-sm font-label-bold text-primary mb-4 uppercase tracking-wider">Lead Instructor</p>
                <div className="w-full grid grid-cols-2 gap-4 border-t-2 border-on-background pt-4">
                  <div>
                    <p className="font-headline-md text-xl">{instructorStats.courses}</p>
                    <p className="text-xs text-on-surface-variant">Courses</p>
                  </div>
                  <div>
                    <p className="font-headline-md text-xl">{instructorStats.students >= 1000 ? `${(instructorStats.students / 1000).toFixed(1)}k` : instructorStats.students}</p>
                    <p className="text-xs text-on-surface-variant">Students</p>
                  </div>
                </div>
              </div>
              {collaborators.length > 0 && (
                <div className="bg-surface rounded-xl border-2 border-on-background p-6 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)]">
                  <h3 className="font-headline-sm text-headline-sm mb-4 border-b-2 border-on-background pb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined font-black text-xl">group</span> Co-Instructors
                  </h3>
                  <div className="space-y-4">
                    {collaborators.map((collab, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-surface-container-low border-2 border-on-background rounded-lg shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]">
                        <div className="w-10 h-10 rounded-full border-2 border-on-background overflow-hidden flex-shrink-0">
                          <img alt={collab.full_name} className="w-full h-full object-cover" src={collab.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(collab.full_name || 'C')}/>
                        </div>
                        <div>
                          <p className="font-label-bold text-sm text-on-background line-clamp-1">{collab.full_name}</p>
                          <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{collab.role === 'editor' ? 'Co-Instructor' : 'Contributor'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isGuest && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-700 ${showGuestPrompt ? 'bg-black/60 backdrop-blur-sm opacity-100' : 'opacity-0 pointer-events-none'}`}>
           <div className={`bg-primary-container p-8 rounded-2xl border-4 border-on-surface shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] space-y-5 max-w-sm w-full transition-all duration-700 ease-out transform pointer-events-auto relative z-[110] ${showGuestPrompt ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
             <div className="flex justify-between items-start">
               <div className="bg-primary text-white p-2 rounded-lg border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><Icon name="lock" className="w-8 h-8" /></div>
               <button type="button" onClick={() => navigate('/catalog')} className="text-on-surface hover:text-error transition-colors p-2 bg-white/20 rounded-full border border-on-surface/10"><Icon name="close" className="w-6 h-6" /></button>
             </div>
             <div className="space-y-2">
               <h3 className="font-headline-lg text-2xl font-black text-on-primary-container">Eits, Tunggu Dulu!</h3>
               <p className="text-sm font-bold text-on-primary-container/80 leading-relaxed">Kamu sedang dalam mode tamu. Untuk membeli kursus ini dan mengakses materi lengkap, silakan daftar atau masuk ke akunmu ya!</p>
             </div>
             <div className="space-y-3 pt-2">
               <button type="button" onClick={() => navigate('/signup')} className="w-full bg-primary text-white brutal-border py-4 text-lg font-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 cursor-pointer">
                 <Icon name="person_add" className="w-5 h-5" /> Daftar Sekarang — Gratis!
               </button>
               <button type="button" onClick={() => navigate('/login')} className="w-full bg-white text-on-surface border-4 border-on-surface py-3 text-sm font-black rounded-xl hover:bg-surface-container transition-all cursor-pointer">Sudah punya akun? Masuk</button>
             </div>
             <p className="text-[10px] text-center font-bold text-on-primary-container/50 uppercase tracking-widest">Harin Learning Student Portal</p>
           </div>
        </div>
      )}

      {/* Certificate Preview Modal */}
      {showCertPreview && userCertificate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl w-full max-w-3xl overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b-2 border-on-surface bg-primary-container shrink-0">
              <span className="font-headline-sm font-black text-on-primary-container flex items-center gap-2">
                <Icon name="workspace_premium" className="w-6 h-6 text-primary" />
                Pratinjau Sertifikat
              </span>
              <button 
                onClick={() => setShowCertPreview(false)}
                className="text-on-surface hover:text-error transition-colors p-1 bg-white/20 rounded-full border border-on-surface/10"
              >
                <Icon name="close" className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-surface-container-lowest flex items-center justify-center min-h-[300px]">
              {userCertificate.certificate_url ? (
                // Custom Certificate Preview
                <div className="w-full max-w-2xl border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden rounded-xl bg-white aspect-video relative">
                  {userCertificate.certificate_url.endsWith('.pdf') ? (
                    <iframe 
                      src={`${userCertificate.certificate_url}#toolbar=0`}
                      className="w-full h-full border-none"
                      title="PDF Preview"
                    />
                  ) : (
                    <img 
                      src={userCertificate.certificate_url}
                      alt="Sertifikat"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              ) : (
                // Auto-Generated Certificate HTML Preview
                <div className="w-full max-w-2xl border-4 border-on-surface bg-[#fffcf5] p-6 md:p-10 text-center relative shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] font-sans" style={{ borderStyle: 'double', borderWidth: '10px' }}>
                  <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-on-surface border-t-black border-l-black"></div>
                  <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-right-2 border-on-surface border-t-black border-r-black"></div>
                  <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-on-surface border-b-black border-l-black"></div>
                  <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-right-2 border-on-surface border-b-black border-r-black"></div>
                  
                  <div className="text-[12px] md:text-sm font-black tracking-widest text-on-surface-variant/80 uppercase mb-2">AiLearning Academy</div>
                  <div className="text-xl md:text-3xl font-black text-on-surface border-b-2 border-on-surface inline-block pb-1 mb-4 uppercase">SERTIFIKAT KELULUSAN</div>
                  
                  <div className="text-[10px] md:text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Diberikan Kepada</div>
                  <div className="text-lg md:text-2xl font-black text-on-surface underline italic mb-4 capitalize">
                    {profile?.fullName || profile?.full_name || "Pelajar Premium"}
                  </div>
                  
                  <div className="text-[10px] md:text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Atas Keberhasilannya Menyelesaikan Kelas</div>
                  <div className="text-sm md:text-lg font-black text-primary leading-tight mb-6">
                    {userCertificate.courses?.title || "Kelas AiLearning"}
                  </div>
                  
                  <div className="flex justify-between items-end mt-4 md:mt-8 px-2 text-left">
                    <div>
                      <div className="text-[8px] md:text-[10px] font-bold text-on-surface-variant uppercase">Tanggal Kelulusan</div>
                      <div className="text-[10px] md:text-xs font-black text-on-surface mt-0.5">
                        {userCertificate.issued_at ? new Date(userCertificate.issued_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        }) : 'Baru saja'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="w-16 md:w-24 h-0.5 bg-on-surface mb-1"></div>
                      <div className="text-[8px] md:text-[10px] font-black uppercase text-on-surface">Harin AI System</div>
                      <div className="text-[6px] md:text-[8px] font-bold text-on-surface-variant">Verifikasi Resmi</div>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-6 text-[8px] font-bold text-on-surface-variant/60 tracking-wider">
                    ID: CERT-{(userCertificate.id && String(userCertificate.id).startsWith('cert-') ? userCertificate.id.replace('cert-', '') : userCertificate.id || 'ONLINE').toUpperCase()}-{String(profile?.id || 'GUEST').slice(0, 8).toUpperCase()}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t-2 border-on-surface bg-surface-container flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setShowCertPreview(false)}
                className="px-5 py-2 bg-white text-on-surface border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg font-bold text-sm hover:bg-surface-container transition-all"
              >
                Tutup
              </button>
              {userCertificate.certificate_url ? (
                <a
                  href={userCertificate.certificate_url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2 bg-primary text-white border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg font-black text-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2"
                >
                  <Icon name="download" className="w-4 h-4" />
                  Unduh / Simpan PDF
                </a>
              ) : (
                <button
                  onClick={() => handlePrintCertificate(userCertificate)}
                  className="px-5 py-2 bg-[#FFB800] text-on-background border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg font-black text-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2"
                >
                  <Icon name="print" className="w-4 h-4" />
                  Cetak / Simpan PDF
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CourseDetail;
