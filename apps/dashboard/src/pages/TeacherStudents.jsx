import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [filterCourse, setFilterCourse] = useState('All');
  const [allCourses, setAllCourses] = useState([]);

  // Detail modal state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [issuingCert, setIssuingCert] = useState(false);
  const [teacherUserId, setTeacherUserId] = useState(null);
  // Certificate upload modal
  const [certModal, setCertModal] = useState(null); // {courseId, courseName}
  const [certFile, setCertFile] = useState(null);
  const [certPreview, setCertPreview] = useState(null);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [codeModal, setCodeModal] = useState(null); // {title: string, code: string}
  const [codeOutput, setCodeOutput] = useState("");

  const handleRunCodeTeacher = (code) => {
    setCodeOutput("🚀 Menjalankan kode...\n");
    let logs = [];
    const customConsole = {
      log: (...args) => {
        logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
      },
      error: (...args) => {
        logs.push("❌ Error: " + args.join(' '));
      }
    };

    setTimeout(() => {
      try {
        if (code.includes("eval") || code.includes("Function")) { 
          throw new Error("Penggunaan eval atau Function tidak diizinkan."); 
        }
        
        const runContext = new Function("console", code);
        logs = [];
        runContext(customConsole);
        setCodeOutput(logs.length > 0 ? logs.join('\n') : "Berhasil dijalankan (tidak ada output console).");
      } catch (err) { 
        setCodeOutput(`❌ SYNTAX/RUNTIME ERROR:\n${err.message}`); 
      }
    }, 500);
  };

  // Student Detail Modal States
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState({ enrollments: [], submissions: [], syllabus: [] });
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      setTeacherUserId(session.user.id);

      const { data: profile } = await supabase
        .from('profiles').select('role, full_name').eq('id', session.user.id).single();
      if (profile?.role !== 'teacher') { navigate('/'); return; }
      setUser({ ...session.user, full_name: profile.full_name });

      // Step 1: Teacher courses
      const { data: teacherCourses } = await supabase
        .from('courses').select('id, title, course_syllabus(id)').eq('instructor_id', session.user.id);

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
        s.progress = totalSyl > 0 ? Math.round((doneSyl / totalSyl) * 100) : 0;
        // Add certificate info per course
        s.certifiedCourses = (certificates || [])
          .filter(cert => String(cert.user_id) === String(sId))
          .map(cert => String(cert.course_id));
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

    try {
      const courseIds = student.courses.map(c => c.id);
      console.log('[openDetail] courseIds:', courseIds, 'studentId:', student.id);

      // Fetch full syllabus list for each course
      const { data: syllabuses, error: sylErr } = await supabase
        .from('course_syllabus')
        .select('id, title, sort_order, assignment_text, course_id')
        .in('course_id', courseIds)
        .order('sort_order', { ascending: true });
      if (sylErr) console.warn('[openDetail] syllabus error:', sylErr.message);

      // Fetch completed syllabus IDs for this student
      const { data: progress, error: progErr } = await supabase
        .from('user_progress')
        .select('syllabus_id, course_id')
        .eq('user_id', student.id)
        .in('course_id', courseIds);
      if (progErr) console.warn('[openDetail] progress error:', progErr.message);

      const completedSylIds = progress?.map(p => p.syllabus_id) || [];

      // Fetch submissions — try user_id first, fallback to student_id column name
      let submissions = [];
      const { data: subData, error: subErr } = await supabase
        .from('submissions')
        .select('syllabus_id, course_id, file_url, assignment_text, submitted_at')
        .eq('user_id', student.id)
        .in('course_id', courseIds)
        .order('submitted_at', { ascending: false });
      if (subErr) {
        console.warn('[openDetail] submissions (user_id) error:', subErr.message, '— trying student_id...');
        const { data: subData2 } = await supabase
          .from('submissions')
          .select('syllabus_id, course_id, file_url, assignment_text, submitted_at')
          .eq('student_id', student.id)
          .in('course_id', courseIds)
          .order('submitted_at', { ascending: false });
        submissions = subData2 || [];
      } else {
        submissions = subData || [];
      }
      console.log('[openDetail] submissions:', submissions.length, '| completedSylIds:', completedSylIds.length);

      // Check existing certificates
      const { data: certs, error: certErr } = await supabase
        .from('certificates')
        .select('course_id, issued_at, certificate_url')
        .eq('user_id', student.id)
        .in('course_id', courseIds);
      if (certErr) console.warn('[openDetail] certs error:', certErr.message);

      setDetailData({
        syllabuses: syllabuses || [],
        completedSylIds,
        submissions,
        certificates: certs || [],
      });
    } catch (err) {
      console.error('[openDetail] unexpected error:', err);
      showToast('Gagal memuat detail siswa.', 'error');
      setSelectedStudent(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const openCertModal = (courseId, courseName) => {
    setCertModal({ courseId, courseName });
    setCertFile(null);
    setCertPreview(null);
  };

  const handleCertFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCertFile(file);
    setCertPreview(URL.createObjectURL(file));
  };

  const handleIssueCertificate = async () => {
    if (!certFile || !certModal) return;
    setUploadingCert(true);
    try {
      // Upload to storage
      const ext = certFile.name.split('.').pop();
      const path = `certificates/${selectedStudent.id}_${certModal.courseId}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('certificates')
        .upload(path, certFile, { upsert: true });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from('certificates').getPublicUrl(path);
      const certUrl = urlData?.publicUrl;

      // Check if cert already exists → update, else insert
      const { data: existing } = await supabase
        .from('certificates')
        .select('id')
        .eq('user_id', selectedStudent.id)
        .eq('course_id', certModal.courseId)
        .maybeSingle();

      let certError;
      if (existing) {
        // Update existing certificate with new image
        const { error } = await supabase
          .from('certificates')
          .update({ certificate_url: certUrl })
          .eq('id', existing.id);
        certError = error;
      } else {
        // Insert new certificate
        const { error } = await supabase
          .from('certificates')
          .insert({
            user_id: selectedStudent.id,
            course_id: certModal.courseId,
            certificate_url: certUrl,
          });
        certError = error;
      }
      if (certError) throw certError;

      showToast('Sertifikat berhasil diberikan! 🎓', 'success');
      setCertModal(null);
      await openDetail(selectedStudent);
    } catch (err) {
      showToast('Gagal: ' + err.message, 'error');
    } finally {
      setUploadingCert(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = filterCourse === 'All' || s.courseTitles.includes(filterCourse);
    return matchesSearch && matchesCourse;
  });

  return (
    <div className="bg-surface font-sans text-on-surface min-h-screen antialiased flex">
      <TeacherSidebar user={user} />

      {/* ─── Certificate Upload Modal ─── */}
      {certModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] border-4 border-on-surface shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-black">Upload Sertifikat</h3>
                <p className="text-sm text-on-surface-variant font-bold mt-1">Untuk: <span className="text-primary">{selectedStudent?.name}</span></p>
                <p className="text-xs text-on-surface-variant font-bold">Kursus: {certModal.courseName}</p>
              </div>
              <button onClick={() => setCertModal(null)} className="p-2 hover:bg-surface-container rounded-xl">
                <span className="material-symbols-outlined">close</span>
              </button>
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
                Batal
              </button>
              <button
                onClick={handleIssueCertificate}
                disabled={!certFile || uploadingCert}
                className="flex-1 py-4 rounded-2xl bg-primary text-on-primary border-2 border-on-surface font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploadingCert ? (
                  <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Mengirim...</>
                ) : '🎓 Kirim Sertifikat'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Code Modal */}
      {codeModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) { setCodeModal(null); setCodeOutput(""); } }}>
          <div className="bg-[#181818] rounded-[32px] border-4 border-on-surface shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] w-full max-w-3xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-6 border-b-2 border-white/10">
              <div>
                <h3 className="text-xl font-black text-white">Jawaban Coding</h3>
                <p className="text-sm text-gray-400 font-bold mt-1">{codeModal.title}</p>
              </div>
              <button onClick={() => { setCodeModal(null); setCodeOutput(""); }} className="p-2 hover:bg-white/10 rounded-xl text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
              <pre className="font-mono text-sm text-green-400 whitespace-pre-wrap flex-1">{codeModal.code}</pre>
              
              <div className="pt-4 border-t border-white/10">
                <button 
                  onClick={() => handleRunCodeTeacher(codeModal.code)}
                  className="px-6 py-2 bg-green-500 text-black font-black uppercase text-xs rounded border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-y-0.5 active:shadow-none transition-all mb-4"
                >
                  Run Code
                </button>
                {codeOutput && (
                  <div className="p-4 bg-black rounded-lg border-2 border-white/10 font-mono text-xs text-white max-h-48 overflow-y-auto">
                    <div className="flex items-center gap-2 mb-2 text-gray-500 border-b border-white/5 pb-1 uppercase text-[9px] font-black">
                      <span className="material-symbols-outlined text-xs">terminal</span> Terminal Output
                    </div>
                    <pre className="whitespace-pre-wrap leading-relaxed">{codeOutput}</pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
            <div className="text-center py-24 border-4 border-dashed border-outline-variant rounded-[40px]">
              <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4 block">group</span>
              <p className="text-on-surface-variant font-black text-xl">Belum ada siswa yang terdaftar.</p>
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

