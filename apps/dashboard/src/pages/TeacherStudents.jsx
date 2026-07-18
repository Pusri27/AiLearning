import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileDropdown from '../components/ProfileDropdown';
import TeacherSidebar from '../components/TeacherSidebar';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabaseClient';
import { showToast } from '../lib/toast';

const TeacherStudents = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Student Detail Modal States
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState({ enrollments: [], submissions: [], syllabus: [] });
  const [loadingDetails, setLoadingDetails] = useState(false);

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
            progress,
            course:course_id (id, title),
            profile:user_id (id, full_name, email)
          `)
          .in('course_id', courseIds)
          .order('enrolled_at', { ascending: false });

        // Group enrollments by student to show progress and courses
        const studentMap = {};
        enrollments?.forEach(e => {
          const email = e.profile?.email;
          const studentId = e.profile?.id;
          if (!email) return;

          if (!studentMap[email]) {
            studentMap[email] = {
              id: studentId,
              name: e.profile?.full_name || 'Pelajar Harin',
              email: email,
              courses: [e.course?.title],
              courseList: [{ id: e.course?.id, title: e.course?.title, progress: e.progress || 0 }],
              lastActivity: e.enrolled_at,
              progressSum: e.progress || 0,
              enrollmentCount: 1
            };
          } else {
            studentMap[email].courses.push(e.course?.title);
            studentMap[email].courseList.push({ id: e.course?.id, title: e.course?.title, progress: e.progress || 0 });
            studentMap[email].progressSum += e.progress || 0;
            studentMap[email].enrollmentCount += 1;
            if (new Date(e.enrolled_at) > new Date(studentMap[email].lastActivity)) {
              studentMap[email].lastActivity = e.enrolled_at;
            }
          }
        });

        // Compute average progress
        const studentList = Object.values(studentMap).map(s => ({
          ...s,
          progress: Math.round(s.progressSum / s.enrollmentCount)
        }));

        setStudents(studentList);
      }

      setLoading(false);
    };

    fetchData();
  }, [navigate]);

  const handleOpenStudentDetail = async (student) => {
    if (!student.id) {
      showToast('ID siswa tidak valid.', 'error');
      return;
    }
    setSelectedStudent(student);
    setLoadingDetails(true);
    try {
      // 1. Fetch student enrollments
      const { data: enrollData } = await supabase
        .from('enrollments')
        .select(`
          id,
          progress,
          enrolled_at,
          courses (
            id,
            title,
            category
          )
        `)
        .eq('user_id', student.id);

      // 2. Fetch student submissions
      const { data: subData, error: subErr } = await supabase
        .from('submissions')
        .select(`
          id,
          course_id,
          syllabus_id,
          file_url,
          submitted_at
        `)
        .eq('student_id', student.id);
      
      let finalSubmissions = subData || [];
      if (subErr) {
        console.warn('Query student_id error, trying user_id...');
        const { data: subData2 } = await supabase
          .from('submissions')
          .select(`
            id,
            course_id,
            syllabus_id,
            file_url,
            submitted_at
          `)
          .eq('user_id', student.id);
        finalSubmissions = subData2 || [];
      }

      // 3. Fetch syllabus to match title with submissions
      const courseIds = enrollData?.map(e => e.courses?.id).filter(Boolean) || [];
      let syllabusList = [];
      if (courseIds.length > 0) {
        const { data: sylData } = await supabase
          .from('course_syllabus')
          .select('id, course_id, title, type')
          .in('course_id', courseIds);
        syllabusList = sylData || [];
      }

      setStudentDetails({
        enrollments: enrollData || [],
        submissions: finalSubmissions,
        syllabus: syllabusList
      });
    } catch (err) {
      console.error('Error fetching student details:', err);
      showToast('Gagal memuat detail tugas.', 'error');
    } finally {
      setLoadingDetails(false);
    }
  };

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
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
            <input 
              className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-2xl py-3 pl-12 pr-4 font-bold text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary transition-all shadow-sm" 
              placeholder="Search by name or email..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Students List */}
        <div className="flex flex-col gap-4">
          {/* Column Headers (Desktop Only) */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-4 bg-surface-container-low rounded-2xl border-2 border-outline-variant font-black text-xs uppercase tracking-widest text-on-surface-variant">
            <div className="col-span-4">Student</div>
            <div className="col-span-3">Active Courses</div>
            <div className="col-span-3">Overall Progress</div>
            <div className="col-span-2 text-right">Action</div>
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

                {/* Action */}
                <div className="col-span-2 w-full flex items-center justify-between md:justify-end gap-6">
                  <button 
                    onClick={() => handleOpenStudentDetail(student)}
                    className="w-full md:w-auto px-4 py-2.5 bg-primary text-on-primary border-2 border-on-surface font-black text-xs rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    Detail & Tugas
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
      </main>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[32px] border-4 border-on-surface p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-on-surface relative">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary-container text-on-primary-container border-2 border-on-surface flex items-center justify-center font-black text-xl shadow-[2px_2px_0px_0px_#000]">
                  {getInitials(selectedStudent.name)}
                </div>
                <div>
                  <h3 className="text-2xl font-black">{selectedStudent.name}</h3>
                  <p className="text-sm font-medium text-on-surface-variant">{selectedStudent.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStudent(null)}
                className="w-10 h-10 rounded-full border-2 border-on-surface hover:bg-surface-variant flex items-center justify-center font-bold text-on-surface hover:text-red-500 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {loadingDetails ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-4 border-on-surface border-t-primary rounded-full animate-spin"></div>
                <p className="text-sm font-bold text-on-surface-variant">Memuat data progres & tugas...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Course Enrollments & Progress */}
                <div>
                  <h4 className="text-lg font-black mb-4 border-b-2 border-on-surface pb-1 uppercase tracking-wider text-primary">Progres Kursus</h4>
                  <div className="space-y-4">
                    {studentDetails.enrollments.map((enroll) => (
                      <div key={enroll.id} className="p-4 border-2 border-on-surface rounded-2xl bg-surface-container-low shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-black text-base">{enroll.courses?.title}</span>
                          <span className="text-sm font-black text-primary">{enroll.progress || 0}%</span>
                        </div>
                        <div className="w-full h-3 bg-white border-2 border-on-surface rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${enroll.progress || 0}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-on-surface-variant mt-2">
                          <span>Mulai: {new Date(enroll.enrolled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span>{enroll.progress >= 100 ? 'Selesai' : 'Sedang Berjalan'}</span>
                        </div>
                      </div>
                    ))}
                    {studentDetails.enrollments.length === 0 && (
                      <p className="text-sm font-medium text-on-surface-variant italic">Belum ada kursus aktif.</p>
                    )}
                  </div>
                </div>

                {/* Submissions / Assignments */}
                <div>
                  <h4 className="text-lg font-black mb-4 border-b-2 border-on-surface pb-1 uppercase tracking-wider text-secondary">Tugas yang Dikirim</h4>
                  <div className="space-y-4">
                    {studentDetails.submissions.map((sub) => {
                      const syl = studentDetails.syllabus?.find(s => String(s.id) === String(sub.syllabus_id));
                      const courseTitle = studentDetails.enrollments.find(e => String(e.courses?.id) === String(sub.course_id))?.courses?.title || 'Kursus';
                      return (
                        <div key={sub.id} className="p-4 border-2 border-on-surface rounded-2xl bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          <div>
                            <p className="text-[10px] font-black uppercase text-on-surface-variant mb-0.5">{courseTitle}</p>
                            <h5 className="font-black text-base">{syl?.title || 'Materi/Tugas'}</h5>
                            <p className="text-xs text-on-surface-variant font-bold">Dikirim pada: {new Date(sub.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          {sub.file_url ? (
                            <button
                              onClick={() => window.open(sub.file_url, '_blank')}
                              className="px-4 py-2.5 bg-secondary text-on-secondary border-2 border-on-surface font-black text-xs rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-1 shrink-0"
                            >
                              <span className="material-symbols-outlined text-sm">open_in_new</span>
                              Lihat Tugas
                            </button>
                          ) : (
                            <span className="text-xs font-bold text-on-surface-variant italic">Tidak ada file</span>
                          )}
                        </div>
                      );
                    })}
                    {studentDetails.submissions.length === 0 && (
                      <p className="text-sm font-medium text-on-surface-variant italic">Belum ada tugas yang dikirim oleh siswa.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherStudents;

