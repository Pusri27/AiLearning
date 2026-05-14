import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileDropdown from '../components/ProfileDropdown';
import TeacherSidebar from '../components/TeacherSidebar';
import { supabase } from '../lib/supabaseClient';

const TeacherStudents = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

      // Fetch Real Students from Enrollments
      const { data: teacherCourses } = await supabase
        .from('courses')
        .select('id, title')
        .eq('instructor_id', session.user.id);

      const courseIds = teacherCourses?.map(c => c.id) || [];
      
      if (courseIds.length > 0) {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select(`
            id,
            enrolled_at,
            course:course_id (title),
            profile:user_id (full_name, email)
          `)
          .in('course_id', courseIds)
          .order('enrolled_at', { ascending: false });

        // Group enrollments by student to show progress and courses
        const studentMap = {};
        enrollments?.forEach(e => {
          const email = e.profile?.email;
          if (!studentMap[email]) {
            studentMap[email] = {
              name: e.profile?.full_name,
              email: email,
              courses: [e.course?.title],
              lastActivity: e.enrolled_at,
              progress: Math.floor(Math.random() * 100) // Mock progress for now
            };
          } else {
            studentMap[email].courses.push(e.course?.title);
          }
        });

        setStudents(Object.values(studentMap));
      }

      setLoading(false);
    };

    fetchData();
  }, [navigate]);

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="bg-surface text-on-surface font-sans antialiased min-h-screen flex">
      <TeacherSidebar user={user} onOpenModal={() => navigate('/teacher/courses')} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 lg:ml-[280px] pt-20 lg:pt-0 pb-24 lg:pb-8 px-margin-mobile lg:px-margin-desktop bg-surface relative">
        {/* Header Section */}
        <div className="py-8 lg:py-10">
          <h2 className="text-4xl lg:text-6xl font-black text-on-surface mb-2">Students</h2>
          <p className="text-lg text-on-surface-variant max-w-2xl">Manage your enrolled learners, track their progress, and ensure everyone is staying on course.</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input 
              className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-2xl py-3 pl-12 pr-4 font-bold text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary transition-all shadow-sm" 
              placeholder="Search by name or email..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-transparent border-2 border-outline-variant text-on-surface font-bold rounded-2xl hover:bg-surface-variant transition-all shadow-sm">
            <span className="material-symbols-outlined">filter_list</span>
            Filter by Course
          </button>
        </div>

        {/* Students List */}
        <div className="flex flex-col gap-4">
          {/* Column Headers (Desktop Only) */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-4 bg-surface-container-low rounded-2xl border-2 border-outline-variant font-black text-xs uppercase tracking-widest text-on-surface-variant">
            <div className="col-span-4">Student</div>
            <div className="col-span-3">Active Courses</div>
            <div className="col-span-3">Overall Progress</div>
            <div className="col-span-2 text-right">Last Activity</div>
          </div>

          {loading ? (
            <div className="h-24 bg-surface-container animate-pulse rounded-3xl border-2 border-outline-variant"></div>
          ) : filteredStudents.length > 0 ? (
            filteredStudents.map((student, idx) => (
              <div 
                key={student.email}
                className="group bg-surface-container-lowest border-2 border-outline-variant rounded-[32px] p-6 lg:px-8 lg:py-6 shadow-sm hover:shadow-xl hover:border-primary transition-all duration-300 flex flex-col md:grid md:grid-cols-12 gap-6 items-start md:items-center relative overflow-hidden"
              >
                <div className={`absolute top-0 left-0 w-2 h-full ${idx % 2 === 0 ? 'bg-primary' : 'bg-secondary'} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                
                {/* Info */}
                <div className="col-span-4 flex items-center gap-4 w-full">
                  <div className={`w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center border-2 border-surface-container-lowest shadow-sm text-xl font-black ${
                    idx % 3 === 0 ? 'bg-tertiary-container text-on-tertiary-container' : 
                    idx % 3 === 1 ? 'bg-secondary-container text-on-secondary-container' : 
                    'bg-error-container text-on-error-container'
                  }`}>
                    {getInitials(student.name)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-black text-on-surface truncate">{student.name}</h3>
                    <p className="text-sm font-bold text-on-surface-variant truncate">{student.email}</p>
                  </div>
                </div>

                {/* Courses */}
                <div className="col-span-3 flex flex-wrap gap-2 w-full">
                  {student.courses.slice(0, 1).map((c, i) => (
                    <span key={i} className="px-3 py-1 rounded-full border-2 border-outline-variant bg-surface text-on-surface text-xs font-bold">{c}</span>
                  ))}
                  {student.courses.length > 1 && (
                    <span className="px-3 py-1 rounded-full border-2 border-outline-variant bg-surface text-on-surface text-xs font-bold">+{student.courses.length - 1} more</span>
                  )}
                </div>

                {/* Progress */}
                <div className="col-span-3 w-full">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-on-surface-variant">{student.progress}% Completed</span>
                  </div>
                  <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden border border-outline-variant">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${idx % 2 === 0 ? 'bg-primary' : 'bg-secondary'}`} 
                      style={{ width: `${student.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Activity & Action */}
                <div className="col-span-2 w-full flex items-center justify-between md:justify-end gap-6">
                  <span className="text-sm font-bold text-on-surface-variant whitespace-nowrap">
                    {new Date(student.lastActivity).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </span>
                  <button className="w-10 h-10 rounded-full hover:bg-surface-variant flex items-center justify-center text-on-surface-variant transition-colors border-2 border-transparent hover:border-outline">
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 border-4 border-dashed border-outline-variant rounded-[40px]">
              <p className="text-on-surface-variant font-black">Belum ada siswa yang terdaftar.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredStudents.length > 0 && (
          <div className="mt-12 flex justify-center items-center gap-3">
            <button className="w-12 h-12 rounded-2xl bg-surface-container-lowest border-2 border-outline-variant flex items-center justify-center hover:bg-surface-variant transition-all shadow-sm">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="w-12 h-12 rounded-2xl bg-primary text-on-primary font-black flex items-center justify-center shadow-lg">1</button>
            <button className="w-12 h-12 rounded-2xl bg-surface-container-lowest border-2 border-outline-variant font-black flex items-center justify-center hover:bg-surface-variant transition-all shadow-sm">2</button>
            <button className="w-12 h-12 rounded-2xl bg-surface-container-lowest border-2 border-outline-variant flex items-center justify-center hover:bg-surface-variant transition-all shadow-sm">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherStudents;
