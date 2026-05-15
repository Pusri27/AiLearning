import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileDropdown from '../components/ProfileDropdown';
import TeacherSidebar from '../components/TeacherSidebar';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabaseClient';
import { showToast, friendlyError } from '../lib/toast';

const TeacherCourses = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', session.user.id)
        .single();

      if (profile?.role !== 'teacher') {
        navigate('/');
        return;
      }

      setUser({ ...session.user, full_name: profile.full_name });

      // Fetch teacher's courses
      const { data: teacherCourses } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', session.user.id)
        .order('created_at', { ascending: false });

      if (teacherCourses) setCourses(teacherCourses);
      setLoading(false);
    };

    fetchData();
  }, [navigate]);

  const handleDeleteCourse = async (id) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      showToast('Klik hapus sekali lagi untuk konfirmasi.', 'error');
      setTimeout(() => setConfirmDeleteId(null), 4000);
      return;
    }
    const { error } = await supabase.from('courses').delete().eq('id', id);
    setConfirmDeleteId(null);
    if (error) showToast(friendlyError(error), 'error');
    else {
      setCourses(courses.filter(c => c.id !== id));
      showToast('Kursus berhasil dihapus.');
    }
  };

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-surface font-sans text-on-surface min-h-screen antialiased flex">
      <TeacherSidebar user={user} />

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-[280px] pt-20 lg:pt-10 pb-24 lg:pb-8 px-margin-mobile lg:px-margin-desktop w-full max-w-[1440px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-on-surface mb-2">My Courses</h2>
            <p className="text-lg text-on-surface-variant">Manage and track your published and draft courses.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
              <input 
                className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-outline-variant bg-surface-container-lowest focus:border-primary transition-all outline-none" 
                placeholder="Search courses..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="bg-surface-container-lowest border-2 border-outline-variant p-3 rounded-2xl hover:bg-surface-container-low transition-colors">
              <Icon name="filter_list" className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {loading ? (
            [1, 2, 3].map(i => <div key={i} className="h-64 bg-surface-container animate-pulse rounded-3xl"></div>)
          ) : (
            <>
              {filteredCourses.map((course) => (
                <div key={course.id} className="bg-surface-container-lowest rounded-[32px] border-2 border-outline-variant p-8 flex flex-col hover:shadow-xl transition-all relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container opacity-10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                  
                  <div className="flex justify-between items-start mb-6">
                    <span className="px-4 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-bold border border-secondary-fixed-dim">Active</span>
                    <button className="text-on-surface-variant hover:text-on-surface">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  </div>

                  <h3 className="text-2xl font-black text-on-surface mb-6 leading-tight line-clamp-2">{course.title}</h3>
                  
                  <div className="flex gap-8 mb-8 mt-auto">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Students</span>
                      <span className="text-lg font-black flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">group</span> 0
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Rating</span>
                      <span className="text-lg font-black flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-[#FFB800] icon-fill">star</span> 4.9
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-surface-variant">
                    <button className="flex-1 py-3 rounded-2xl border-2 border-outline-variant font-bold hover:bg-surface-container-low transition-all flex justify-center items-center gap-2">
                      <span className="material-symbols-outlined text-lg">edit</span> Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteCourse(course.id)}
                      className="flex-1 py-3 rounded-2xl border-2 border-error-container text-error font-bold hover:bg-error-container transition-all flex justify-center items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span> Delete
                    </button>
                  </div>
                </div>
              ))}

              {/* Create New Course Card */}
              <div 
                onClick={() => navigate('/teacher/courses/create')}
                className="bg-surface-container-low border-4 border-dashed border-outline-variant rounded-[32px] p-8 flex flex-col items-center justify-center text-center hover:bg-surface-container-high transition-all cursor-pointer min-h-[320px]"
              >
                <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-6 shadow-md">
                  <span className="material-symbols-outlined text-3xl font-bold">add</span>
                </div>
                <h3 className="text-2xl font-black text-on-surface mb-2">Create New Course</h3>
                <p className="text-sm text-on-surface-variant max-w-[200px]">Start building your next engaging learning experience.</p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default TeacherCourses;
