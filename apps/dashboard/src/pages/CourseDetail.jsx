import React, { useEffect, useState } from 'react';
import { useNavigate, NavLink, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileDropdown from '../components/ProfileDropdown';
import NotificationDropdown from '../components/NotificationDropdown';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabaseClient';
import { showToast, friendlyError } from '../lib/toast';
import { useUserProfile } from '../context/UserProfileContext';

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
  const [ratingCount, setRatingCount] = useState(0);
  const [collaborators, setCollaborators] = useState([]);

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

  const [enrollmentProgress, setEnrollmentProgress] = useState(0);
  const [enrollmentId, setEnrollmentId] = useState(null);
  const [lessons, setLessons] = useState([]);

  const curriculumRef = React.useRef(null);

  const handleContinueLearning = () => {
    const nextLesson = lessons.find(l => !l.completed) || lessons[0];
    if (nextLesson) {
      navigate(`/courses/${id}/learn/${nextLesson.id}`);
    }
  };

  useEffect(() => {
    fetchCourse();
    if (isGuest) {
      const timer = setTimeout(() => setShowGuestPrompt(true), 500);
      return () => clearTimeout(timer);
    }
  }, [id, isGuest]);

  const fetchCourse = async () => {
    setLoading(true);
    // 1. Fetch Course Data
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (courseError) {
      console.error('Error fetching course:', courseError);
      showToast(friendlyError(courseError), 'error');
      setLoading(false);
      return;
    }

    if (courseData) {
      // 2. Fetch Instructor Data Separately
      let instructorData = null;
      if (courseData.instructor_id) {
        const { data: instData } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', courseData.instructor_id)
          .maybeSingle();
        instructorData = instData;
      }

      if (!instructorData && courseData.instructor) {
        const { data: fallbackData } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .ilike('full_name', courseData.instructor)
          .limit(1)
          .maybeSingle();
        if (fallbackData) instructorData = fallbackData;
      }
      
      // Combine them manually
      setCourse({ ...courseData, profiles: instructorData });
      
      // 3. Fetch Syllabus
      const { data: syllabusData } = await supabase
        .from('course_syllabus')
        .select('*')
        .eq('course_id', id)
        .order('sort_order', { ascending: true });
      const syllabusList = syllabusData || [];
      setSyllabus(syllabusList);

      // Fetch enrollment count (correct syntax)
      const { count: totalCount } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', id);
      setEnrollmentCount(totalCount || 0);

      // Fetch real ratings from course_ratings table
      const { data: ratings } = await supabase
        .from('course_ratings')
        .select('rating')
        .eq('course_id', id);
      if (ratings && ratings.length > 0) {
        const avg = ratings.reduce((a, b) => a + b.rating, 0) / ratings.length;
        setAvgRating(avg.toFixed(1));
        setRatingCount(ratings.length);
      }

      // 4. Fetch Instructor Stats
      if (courseData.instructor_id) {
        const { data: instructorCourses } = await supabase
          .from('courses')
          .select('id')
          .eq('instructor_id', courseData.instructor_id);
        
        const instructorCourseIds = instructorCourses?.map(c => c.id) || [];
        const { count: totalStudents } = await supabase
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .in('course_id', instructorCourseIds);

        setInstructorStats({
          courses: instructorCourseIds.length,
          students: totalStudents || 0
        });
      }

      // 4b. Fetch Accepted Collaborators Safely
      const { data: collabData } = await supabase
        .from('course_collaborators')
        .select('teacher_id, role')
        .eq('course_id', id)
        .eq('status', 'accepted');
      
      if (collabData && collabData.length > 0) {
        const teacherIds = collabData.map(c => c.teacher_id);
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .in('id', teacherIds);
          
        if (profileData) {
          const joinedCollaborators = collabData.map(c => {
            const p = profileData.find(prof => prof.id === c.teacher_id);
            return { ...p, role: c.role };
          }).filter(c => c.id); // ensure profile was found
          
          setCollaborators(joinedCollaborators);
        }
      }

      // 5. Check Enrollment Status for Current User
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('id, progress')
          .eq('user_id', session.user.id)
          .eq('course_id', id)
          .maybeSingle();
        if (enrollment) {
          setIsEnrolled(true);
          setEnrollmentId(enrollment.id);

          // Fetch user progress for individual syllabus items
          const { data: userProgress } = await supabase
            .from('user_progress')
            .select('syllabus_id')
            .eq('user_id', session.user.id)
            .eq('course_id', id);

          const mappedLessons = syllabusList.map(item => {
            const isCompleted = userProgress ? userProgress.some(p => p.syllabus_id === item.id) : false;
            let type = 'reading';
            let icon = 'menu_book';
            if (item.type === 'assignment') {
              type = 'assignment';
              icon = 'assignment';
            } else if (item.video_url) {
              type = 'video';
              icon = 'play_circle';
            }

            return {
              id: item.id,
              title: item.title,
              duration: item.type === 'assignment' ? 'Penugasan' : '30 mins',
              type: type,
              icon: icon,
              content: item.content || item.assignment_text || '',
              completed: isCompleted
            };
          });

          setLessons(mappedLessons);

          const completedCount = mappedLessons.filter(l => l.completed).length;
          const newProgress = mappedLessons.length > 0 ? Math.round((completedCount / mappedLessons.length) * 100) : 0;
          setEnrollmentProgress(newProgress);

          // Update enrollment progress in DB if it mismatched (e.g. syllabus items deleted/added by teacher)
          if (newProgress !== enrollment.progress) {
            await supabase
              .from('enrollments')
              .update({ progress: newProgress })
              .eq('id', enrollment.id);
          }
        }
      }
    }
    setLoading(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);
  };

  const handleAddToCart = async () => {
    if (isGuest) {
      setShowGuestPrompt(true);
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }

    const { error } = await supabase
      .from('cart')
      .insert([{ user_id: session.user.id, course_id: course.id }]);

    if (error) {
      if (error.code === '23505') {
        showToast('Kursus ini sudah ada di keranjang kamu.', 'error');
      } else {
        showToast(friendlyError(error), 'error');
      }
    } else {
      showToast('Kursus berhasil ditambahkan ke keranjang!');
      navigate('/cart');
    }
  };

  if (loading) {
    return (
      <div className="bg-background text-on-background flex h-screen items-center justify-center">
        <div className="w-16 h-16 border-4 border-on-surface border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="bg-background text-on-background flex h-screen items-center justify-center flex-col gap-4">
        <h1 className="font-headline-lg">Kursus tidak ditemukan</h1>
        <button onClick={() => navigate('/catalog')} className="px-6 py-2 bg-primary text-white rounded-lg border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Kembali ke Katalog</button>
      </div>
    );
  }

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
              <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                {isEnrolled ? (
                  <button 
                    onClick={handleContinueLearning}
                    className="px-8 py-4 bg-primary text-white rounded-lg border-2 border-on-background font-headline-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:scale-95 flex-1"
                  >
                    Lanjutkan Belajar
                  </button>
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

                  <div className="space-y-4">
                    {lessons.map((lesson) => (
                      <div 
                        key={lesson.id}
                        onClick={() => navigate(`/courses/${id}/learn/${lesson.id}`)}
                        className={`group border-2 border-on-background p-4 rounded-xl flex items-center justify-between gap-4 cursor-pointer hover:bg-primary-container/20 transition-all ${lesson.completed ? 'bg-surface-container-low opacity-80' : 'bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg border-2 border-on-background flex items-center justify-center ${lesson.completed ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-surface-container text-on-surface'}`}>
                            <Icon name={lesson.completed ? 'check' : lesson.icon} className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-label-bold text-on-surface group-hover:text-primary transition-colors">{lesson.title}</h4>
                            <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                              <Icon name="schedule" className="w-3.5 h-3.5" /> {lesson.duration}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {lesson.completed ? (
                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-600/30 flex items-center gap-1">
                              Selesai
                            </span>
                          ) : (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/courses/${id}/learn/${lesson.id}`);
                              }}
                              className="px-4 py-1.5 bg-primary text-white text-xs font-label-bold rounded-lg border-2 border-on-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-[-1px] group-hover:translate-y-[-1px] group-hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                            >
                              Mulai
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="bg-surface rounded-xl border-2 border-on-background p-6 md:p-8 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)]">
                <h2 className="font-headline-lg text-headline-lg mb-4 pb-4 border-b-2 border-on-background">Tentang Kursus Ini</h2>
                <div className="space-y-4 text-body-md font-body-md text-on-surface-variant">
                  <p>{course.description || 'Tidak ada deskripsi tersedia.'}</p>
                </div>
              </section>

              <section className="bg-secondary-fixed rounded-xl border-2 border-on-background p-6 md:p-8 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)]">
                <h2 className="font-headline-lg text-headline-lg mb-6 text-on-secondary-fixed">Apa yang Akan Kamu Pelajari</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {syllabus.filter(s => s.type !== 'assignment').length > 0 ? 
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
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-8">
              {/* Lead Instructor Card */}
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

              {/* Collaborators Card */}
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

      {/* ── Guest Prompt Animation ────────────────────────────────── */}
      {isGuest && (
        <div 
          className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-700 ${showGuestPrompt ? 'bg-black/60 backdrop-blur-sm opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
           <div 
             className={`bg-primary-container p-8 rounded-2xl border-4 border-on-surface shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] space-y-5 max-w-sm w-full transition-all duration-700 ease-out transform pointer-events-auto relative z-[110]
               ${showGuestPrompt 
                 ? 'scale-100 translate-x-0 translate-y-0 opacity-100' 
                 : 'scale-50 -translate-x-[40vw] translate-y-[40vh] opacity-0'
               }`}
           >
             <div className="flex justify-between items-start">
               <div className="bg-primary text-white p-2 rounded-lg border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                 <Icon name="lock" className="w-8 h-8" />
               </div>
               <button 
                 type="button"
                 onClick={(e) => {
                   e.stopPropagation();
                   navigate('/catalog');
                 }} 
                 className="text-on-surface hover:text-error transition-colors p-2 bg-white/20 rounded-full border border-on-surface/10"
               >
                 <Icon name="close" className="w-6 h-6" />
               </button>
             </div>
             <div className="space-y-2">
               <h3 className="font-headline-lg text-2xl font-black text-on-primary-container">Eits, Tunggu Dulu!</h3>
               <p className="text-sm font-bold text-on-primary-container/80 leading-relaxed">
                 Kamu sedang dalam mode tamu. Untuk membeli kursus ini dan mengakses materi lengkap, silakan daftar atau masuk ke akunmu ya!
               </p>
             </div>
             <div className="space-y-3 pt-2">
               <button
                 type="button"
                 onClick={(e) => {
                   e.stopPropagation();
                   navigate('/signup');
                 }}
                 className="w-full bg-primary text-white brutal-border py-4 text-lg font-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 cursor-pointer"
               >
                 <Icon name="person_add" className="w-5 h-5" />
                 Daftar Sekarang — Gratis!
               </button>
               <button
                 type="button"
                 onClick={(e) => {
                   e.stopPropagation();
                   navigate('/login');
                 }}
                 className="w-full bg-white text-on-surface border-4 border-on-surface py-3 text-sm font-black rounded-xl hover:bg-surface-container transition-all cursor-pointer"
               >
                 Sudah punya akun? Masuk
               </button>
             </div>
             <p className="text-[10px] text-center font-bold text-on-primary-container/50 uppercase tracking-widest">Harin Learning Student Portal</p>
           </div>
        </div>
      )}

    </div>
  );
};

export default CourseDetail;
