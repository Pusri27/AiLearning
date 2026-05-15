import React, { useEffect, useState } from 'react';
import { useNavigate, NavLink, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileDropdown from '../components/ProfileDropdown';
import NotificationDropdown from '../components/NotificationDropdown';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabaseClient';
import { showToast, friendlyError } from '../lib/toast';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching course:', error);
      // Fallback if ID is a string slug from old hardcoded data
      if (id === 'ai-engineering') {
         setCourse({
           id: 'ai-engineering',
           title: 'Master AI Engineering',
           category: 'Computer Science',
           level: 'Intermediate',
           price: 1499000,
           duration: '20 Hours',
           students: '15k+',
           rating: 4.9,
           reviews: '2.5k',
           instructor: 'Sarah Jenkins',
           instructor_role: 'Lead AI Researcher',
           description: 'Dive deep into the world of Artificial Intelligence with our comprehensive Master AI Engineering course.',
           image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2LJJfpnZ2ROq0HbtyCrNvo4BVBAh4r5sRDo-mlasd95Wf3RUzaqJgje2skV5ndpuzcVtDXKFzYMzI4Lvxp-w7cWq91U3d45el4GB9Vh09nN5738gWVXErwllHea4CIaJ5k_rCZuBJatHzw_HC5Bd13-FNswv88zxUnJ8KlU7oPFpI1AFpLXMqNFIt4spmT_YeIyVDwlbOAkesLsK2ejYpe_G2c2km9b_93iqzlr1AvKQjGg4CVlb1QA4XVMIH4Z-8TvQHYXhw4ZI'
         });
      }
    } else {
      setCourse(data);
      // Cek apakah sudah terdaftar
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('course_id', id)
          .maybeSingle();
        if (enrollment) setIsEnrolled(true);
      }
    }
    setLoading(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);
  };

  const handleAddToCart = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }

    const { error } = await supabase
      .from('cart')
      .insert([
        { user_id: session.user.id, course_id: course.id }
      ]);

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
    <div className="bg-background text-on-background font-body-md flex h-screen overflow-hidden">
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
                  <Icon name="star" className="w-5 h-5 text-primary-container fill-current" />
                  <span className="font-bold text-on-background">4.9</span>
                  <span>(2.5k reviews)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="schedule" className="w-5 h-5" />
                  <span>{course.duration || '20 Hours'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="group" className="w-5 h-5" />
                  <span>{course.students || '15k+'} Students</span>
                </div>
              </div>
              <div className="mb-8">
                <span className="text-3xl font-headline-xl text-primary">{formatPrice(course.price)}</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                {isEnrolled ? (
                  <button 
                    onClick={() => navigate('/study')}
                    className="px-8 py-4 bg-primary text-white rounded-lg border-2 border-on-background font-headline-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:scale-95 flex-1"
                  >
                    Lanjutkan Belajar
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => navigate('/checkout', { state: { courseId: course.id } })}
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
              <div className="absolute bottom-6 right-6 bg-surface border-2 border-on-background rounded-lg p-3 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-on-background overflow-hidden">
                  <img alt={course.instructor} className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDLEpqpdh19OgQAjpf4BLYKQcirfyvHVXDpKMX5l3SGQ3gDc7KeXq0cB2_Yh0rNlbPzigVXGOC0hYdYuplTFYRRmZllIexjIGj-eN7n4S-570EzquU4-xvnlrcFs7aU3IH7zP65ivR_fBjQnOW9DDx5-Aa8Oz4ijDVQoomPn3msZ88eGiPrw150cpWxHyeT4s93K-IyDMq3c5QkOg3XMI1-3Rbwqj8HOwrG5_ULJlkv0OAhFSiq5bwO76JIUa7DWMyFdV0fFbQp1eM"/>
                </div>
                <div>
                  <p className="font-label-bold text-label-bold text-sm">{course.instructor}</p>
                  <p className="text-xs text-on-surface-variant">{course.instructor_role || 'Lead Instructor'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-surface rounded-xl border-2 border-on-background p-6 md:p-8 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)]">
                <h2 className="font-headline-lg text-headline-lg mb-4 pb-4 border-b-2 border-on-background">Tentang Kursus Ini</h2>
                <div className="space-y-4 text-body-md font-body-md text-on-surface-variant">
                  <p>{course.description || 'Tidak ada deskripsi tersedia.'}</p>
                </div>
              </section>

              <section className="bg-secondary-fixed rounded-xl border-2 border-on-background p-6 md:p-8 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)]">
                <h2 className="font-headline-lg text-headline-lg mb-6 text-on-secondary-fixed">Apa yang Akan Kamu Pelajari</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-surface border-2 border-on-background p-4 rounded-lg flex gap-4 items-start shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]">
                    <div className="p-2 bg-secondary-container rounded-md border-2 border-on-surface flex items-center justify-center">
                      <Icon name="account_tree" className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-label-bold text-label-bold mb-1">Building RAG apps</h3>
                      <p className="text-sm text-on-surface-variant">Create Retrieval-Augmented Generation applications.</p>
                    </div>
                  </div>
                  {/* ... other points ... */}
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <div className="bg-surface rounded-xl border-2 border-on-background p-6 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full border-2 border-on-background overflow-hidden mb-4 shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]">
                  <img alt={course.instructor} className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzKGDmVk-QUCgSmvJBv2Ls_wzh-BklBDgXkezS5_ju0ndmrH5rT_veXJSoHiy6Cee2gXUaiqhDQUsUSSFZ_bH-8I-0uliPmYQOwqI9ajud0KByNC-HY9Il0GJsFRfxlsLHCfNBcN3JqwSYCAh_mQf3pif91o8PNcYm3WxBOVMWuQNqtK5zKF_m551wixybylvW4F_zdT3mYyv0Bu3T8MGSQSanS1SecNksNEaMS1Zf-w8JwmbvR7uTXZ4qOXn7YnFEa9pSzLtwZVY"/>
                </div>
                <h3 className="font-headline-md text-headline-md mb-1">{course.instructor}</h3>
                <p className="text-sm font-label-bold text-primary mb-4 uppercase tracking-wider">{course.instructor_role || 'Lead Instructor'}</p>
                <div className="w-full grid grid-cols-2 gap-4 border-t-2 border-on-background pt-4">
                  <div>
                    <p className="font-headline-md text-xl">12</p>
                    <p className="text-xs text-on-surface-variant">Courses</p>
                  </div>
                  <div>
                    <p className="font-headline-md text-xl">45k</p>
                    <p className="text-xs text-on-surface-variant">Students</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
