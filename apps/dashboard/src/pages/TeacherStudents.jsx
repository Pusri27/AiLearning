import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherSidebar from '../components/TeacherSidebar';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabaseClient';
import { showToast } from '../lib/toast';

// Inline style colors (avoids Tailwind purge issue)
const getProgressStyle = (p) => ({
  width: `${p}%`,
  backgroundColor: p === 100 ? '#4ade80' : p >= 60 ? '#6750A4' : p >= 30 ? '#FFB800' : '#ef4444',
  transition: 'width 0.7s ease',
});

const getViewerUrl = (url) => {
  if (!url) return '';
  const cleanUrl = url.trim();
  let extension = '';
  try {
    const pathname = new URL(cleanUrl).pathname;
    const parts = pathname.split('.');
    if (parts.length > 1) {
      extension = parts.pop().toLowerCase();
    }
  } catch (e) {
    const parts = cleanUrl.split('?')[0].split('.');
    if (parts.length > 1) {
      extension = parts.pop().toLowerCase();
    }
  }
  const officeExtensions = ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt'];
  if (officeExtensions.includes(extension)) {
    return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(cleanUrl)}`;
  }
  if (extension === 'pdf') {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(cleanUrl)}`;
  }
  return cleanUrl;
};

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      setTeacherUserId(session.user.id);

      const { data: profile } = await supabase
        .from('profiles').select('role, full_name, signature_url').eq('id', session.user.id).single();
      if (profile?.role !== 'teacher') { navigate('/'); return; }
      setUser({ ...session.user, full_name: profile.full_name, signature_url: profile.signature_url });

      // Step 1: Teacher courses
      const { data: teacherCourses } = await supabase
        .from('courses').select('id, title, course_syllabus(id)').eq('instructor_id', session.user.id);

      const courseIds = teacherCourses?.map(c => c.id) || [];
      const syllabusCountMap = {};
      teacherCourses?.forEach(c => { syllabusCountMap[c.id] = c.course_syllabus?.length || 0; });
      setAllCourses(teacherCourses || []);

      if (courseIds.length === 0) { setLoading(false); return; }

      // Step 2: Enrollments
      const { data: enrollments } = await supabase
        .from('enrollments').select('id, user_id, course_id, enrolled_at')
        .in('course_id', courseIds).order('enrolled_at', { ascending: false });

      if (!enrollments || enrollments.length === 0) { setLoading(false); return; }

      // Step 3: Profiles
      const studentIds = [...new Set(enrollments.map(e => e.user_id))];
      const { data: profiles } = await supabase
        .from('profiles').select('id, full_name, username, role').in('id', studentIds);

      // Step 4: Progress
      const { data: allProgress } = await supabase
        .from('user_progress').select('user_id, course_id, syllabus_id')
        .in('user_id', studentIds).in('course_id', courseIds);

      // Step 5: Certificates
      const { data: certificates } = await supabase
        .from('certificates').select('user_id, course_id').in('course_id', courseIds);

      // Build student map
      const studentMap = {};
      enrollments.forEach(e => {
        const key = e.user_id;
        const prof = profiles?.find(p => String(p.id) === String(e.user_id));
        const courseTitle = teacherCourses?.find(tc => String(tc.id) === String(e.course_id))?.title || 'Unknown';
        if (!studentMap[key]) {
          studentMap[key] = {
            id: e.user_id,
            name: prof?.full_name || prof?.username || `ID:${e.user_id.slice(0, 8)}`,
            email: prof?.username || '',
            courses: [{ id: e.course_id, title: courseTitle }],
            courseTitles: [courseTitle],
            lastActivity: e.enrolled_at,
            progress: 0,
          };
        } else {
          studentMap[key].courses.push({ id: e.course_id, title: courseTitle });
          studentMap[key].courseTitles.push(courseTitle);
        }
      });

      // Calculate progress
      Object.keys(studentMap).forEach(sId => {
        const s = studentMap[sId];
        let totalSyl = 0, doneSyl = 0;
        s.courses.forEach(c => {
          totalSyl += syllabusCountMap[c.id] || 0;
          doneSyl += allProgress?.filter(p => String(p.user_id) === String(sId) && String(p.course_id) === String(c.id)).length || 0;
        });
        s.progress = totalSyl > 0 ? Math.round((doneSyl / totalSyl) * 100) : 0;
        // Add certificate info per course
        s.certifiedCourses = (certificates || [])
          .filter(cert => String(cert.user_id) === String(sId))
          .map(cert => String(cert.course_id));
      });

      setStudents(Object.values(studentMap));
      setLoading(false);
    };
    fetchData();
  }, [navigate]);

  const openDetail = async (student) => {
    setSelectedStudent(student);
    setLoadingDetail(true);
    setDetailData(null);

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
  };

  const handleIssueSignedCertificate = async () => {
    if (!certModal) return;
    setUploadingCert(true);
    try {
      // Check if cert already exists → update, else insert
      const { data: existing } = await supabase
        .from('certificates')
        .select('id')
        .eq('user_id', selectedStudent.id)
        .eq('course_id', certModal.courseId)
        .maybeSingle();

      let certError;
      if (existing) {
        // Update existing certificate to ensure it is marked as officially issued
        const { error } = await supabase
          .from('certificates')
          .update({ certificate_url: null, issued_at: new Date().toISOString() })
          .eq('id', existing.id);
        certError = error;
      } else {
        // Insert new certificate
        const { error } = await supabase
          .from('certificates')
          .insert({
            user_id: selectedStudent.id,
            course_id: certModal.courseId,
            certificate_url: null,
            issued_at: new Date().toISOString()
          });
        certError = error;
      }
      if (certError) throw certError;

      // Send a notification to the student
      try {
        await supabase.from('notifications').insert({
          user_id: selectedStudent.id,
          title: 'Sertifikat Kelulusan Diterbitkan! 🎓',
          content: `Selamat! Guru Anda telah menandatangani dan menerbitkan sertifikat kelulusan Anda untuk kelas "${certModal.courseName}".`,
          type: 'course',
          link_to: `/courses/${certModal.courseId}`
        });
      } catch (notifErr) {
        console.warn('Gagal mengirim notifikasi sertifikat:', notifErr);
      }

      showToast('Sertifikat berhasil ditandatangani dan dikirim! 🎓', 'success');
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

      {/* ─── Certificate Template Preview Modal ─── */}
      {certModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] border-4 border-on-surface shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] w-full max-w-3xl p-6 md:p-8 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div>
                <h3 className="text-2xl font-black">Pratinjau Sertifikat Kelulusan</h3>
                <p className="text-sm text-on-surface-variant font-bold mt-1">
                  Harap periksa informasi sertifikat sebelum mengirimkannya ke siswa.
                </p>
              </div>
              <button onClick={() => setCertModal(null)} className="p-2 hover:bg-surface-container rounded-xl">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Certificate Template Preview */}
            <div className="flex-1 overflow-y-auto pr-2 mb-6">
              <div className="w-full border-[8px] border-double border-on-background p-6 md:p-8 bg-[#fffcf5] text-center relative rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {/* Decorative Corners */}
                <div className="absolute top-3 left-3 w-8 h-8 border-t-4 border-l-4 border-on-background"></div>
                <div className="absolute top-3 right-3 w-8 h-8 border-t-4 border-r-4 border-on-background"></div>
                <div className="absolute bottom-3 left-3 w-8 h-8 border-b-4 border-l-4 border-on-background"></div>
                <div className="absolute bottom-3 right-3 w-8 h-8 border-b-4 border-r-4 border-on-background"></div>

                <div className="text-base md:text-lg font-black tracking-[4px] uppercase mb-2">AiLearning Academy</div>
                <div className="text-xl md:text-2xl font-black text-on-background uppercase mb-6 border-b-4 border-on-background inline-block pb-2 tracking-wide">
                  SERTIFIKAT KELULUSAN
                </div>

                <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                  Diberikan Kepada
                </div>
                <div className="text-lg md:text-xl font-black text-on-background underline capitalize mb-4 font-serif italic">
                  {selectedStudent?.name}
                </div>

                <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                  Atas Keberhasilannya Menyelesaikan Kelas
                </div>
                <div className="text-sm md:text-base font-black text-primary mb-6 leading-tight">
                  {certModal.courseName}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end gap-6 mt-8 px-4">
                  <div className="text-center sm:text-left">
                    <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Tanggal Kelulusan</div>
                    <div className="text-xs md:text-sm font-black text-on-background mt-1">
                      {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                  
                  <div className="text-center flex flex-col items-center">
                    {user?.signature_url ? (
                      <img 
                        src={user.signature_url} 
                        alt="Tanda Tangan" 
                        className="h-10 md:h-14 object-contain -mb-2 bg-transparent"
                      />
                    ) : (
                      <div className="h-10 md:h-14 flex items-center justify-center text-error font-bold text-[10px] max-w-[180px] border border-dashed border-error/50 p-2 rounded bg-error/5">
                        Tanda Tangan Belum Diatur
                      </div>
                    )}
                    <div className="w-24 md:w-32 h-0.5 bg-on-background mb-1"></div>
                    <div className="text-[10px] font-black uppercase text-on-background">
                      {user?.full_name || 'Instruktur Utama'}
                    </div>
                    <div className="text-[8px] font-bold text-on-surface-variant">Lead Instructor</div>
                  </div>
                </div>

                <div className="mt-6 text-[8px] font-bold text-on-surface-variant/50 tracking-wider">
                  ID Verifikasi: CERT-AUTO-{(selectedStudent?.id || 'STUDENT').slice(0, 8).toUpperCase()}
                </div>
              </div>

              {!user?.signature_url && (
                <div className="mt-4 p-4 bg-error/10 border-2 border-error text-error rounded-2xl flex items-center gap-3">
                  <span className="material-symbols-outlined text-2xl">warning</span>
                  <div>
                    <p className="font-black text-sm">Tanda Tangan Digital Belum Diatur</p>
                    <p className="text-xs font-bold mt-0.5">
                      Silakan masuk ke halaman <strong>Pengaturan Guru</strong> untuk menggambar atau mengunggah tanda tangan Anda terlebih dahulu agar dapat menerbitkan sertifikat.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 shrink-0">
              <button
                onClick={() => setCertModal(null)}
                className="flex-1 py-3 rounded-2xl border-2 border-on-surface font-black hover:bg-surface-container transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleIssueSignedCertificate}
                disabled={!user?.signature_url || uploadingCert}
                className="flex-1 py-3 rounded-2xl bg-primary text-on-primary border-2 border-on-surface font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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

      {/* Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setSelectedStudent(null); }}>
          <div className="bg-white rounded-[40px] border-4 border-on-surface shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-8 border-b-2 border-on-surface flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary-container border-2 border-on-surface flex items-center justify-center font-black text-2xl text-primary">
                  {selectedStudent.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-2xl font-black">{selectedStudent.name}</h3>
                  <p className="text-sm text-on-surface-variant font-bold">Progress keseluruhan: {selectedStudent.progress}%</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-surface-container rounded-xl transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : detailData && (
                <>
                  {/* Per-course breakdown */}
                  {selectedStudent.courses.map(course => {
                    const courseSyls = detailData.syllabuses.filter(s => String(s.course_id) === String(course.id));
                    const completedCount = courseSyls.filter(s => detailData.completedSylIds.includes(s.id)).length;
                    const isComplete = courseSyls.length > 0 && completedCount === courseSyls.length;
                    const hasCert = detailData.certificates.some(c => String(c.course_id) === String(course.id));
                    // Deduplicate: keep only the latest submission per syllabus_id
                    const rawCourseSubs = detailData.submissions.filter(s => String(s.course_id) === String(course.id));
                    const seenSylIds = new Set();
                    const courseSubs = rawCourseSubs.filter(s => {
                      if (seenSylIds.has(s.syllabus_id)) return false;
                      seenSylIds.add(s.syllabus_id);
                      return true;
                    });

                    return (
                      <div key={course.id} className="border-2 border-on-surface rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        {/* Course Header */}
                        <div className="bg-surface-container-low px-6 py-4 flex items-center justify-between">
                          <div>
                            <h4 className="font-black text-base">{course.title}</h4>
                            <p className="text-xs text-on-surface-variant font-bold">{completedCount}/{courseSyls.length} materi selesai</p>
                          </div>
                          {hasCert ? (
                            <span className="flex items-center gap-2 px-4 py-2 bg-success/20 text-success border-2 border-success rounded-xl font-black text-xs">
                              🎓 Bersertifikat
                            </span>
                          ) : isComplete ? (
                            <button
                              onClick={() => openCertModal(course.id, course.title)}
                              className="px-4 py-2 bg-primary text-on-primary border-2 border-on-surface rounded-xl font-black text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 transition-all"
                            >
                              ✍️ Tandatangani Sertifikat
                            </button>
                          ) : (
                            <span className="px-4 py-2 bg-surface-variant text-on-surface-variant rounded-xl font-bold text-xs">
                              {Math.round((completedCount / Math.max(courseSyls.length, 1)) * 100)}% selesai
                            </span>
                          )}
                        </div>

                        {/* Syllabus Checklist */}
                        <div className="p-4 space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-3">Progress Materi</p>
                          {courseSyls.map(syl => {
                            const done = detailData.completedSylIds.includes(syl.id);
                            const submission = detailData.submissions.find(s => s.syllabus_id === syl.id);
                            return (
                              <div key={syl.id} className={`flex items-center justify-between p-3 rounded-xl border ${done ? 'bg-success/10 border-success/30' : 'bg-surface-container-low border-outline-variant'}`}>
                                <div className="flex items-center gap-3">
                                  <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border-2 ${done ? 'bg-success border-success text-white' : 'border-on-surface-variant'}`}>
                                    {done ? <span className="text-xs font-black">✓</span> : <span className="text-[10px] font-black">{syl.sort_order + 1}</span>}
                                  </div>
                                  <span className="text-sm font-bold">{syl.title}</span>
                                  {syl.assignment_text && (
                                    <span className="text-[10px] px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded-full font-black">Tugas</span>
                                  )}
                                </div>
                                {submission && (
                                  submission.file_url ? (
                                    <a href={getViewerUrl(submission.file_url)} target="_blank" rel="noopener noreferrer" className="text-xs font-black text-primary underline flex items-center gap-1 flex-shrink-0">
                                      <span className="material-symbols-outlined text-sm">attach_file</span>
                                      Lihat Tugas
                                    </a>
                                  ) : submission.assignment_text ? (
                                    <button onClick={() => { setCodeModal({ title: syl.title, code: submission.assignment_text }); setCodeOutput(""); }} className="text-xs font-black text-primary underline flex items-center gap-1 flex-shrink-0 hover:text-primary-container-variant transition-colors cursor-pointer">
                                      <span className="material-symbols-outlined text-sm">code</span>
                                      Lihat Tugas
                                    </button>
                                  ) : null
                                )}
                              </div>
                            );
                          })}

                          {/* Submissions summary */}
                          {courseSubs.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-outline-variant">
                              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Tugas Dikumpulkan ({courseSubs.length})</p>
                              {courseSubs.map((sub, i) => (
                                <div key={i} className="flex items-center justify-between text-xs font-bold text-on-surface-variant py-1">
                                  <span>{sub.file_url ? `📎 ${sub.file_url.split('/').pop().slice(0, 30)}` : '💻 Code Submission'}</span>
                                  <span>{new Date(sub.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 lg:ml-[280px] pt-20 lg:pt-10 pb-24 lg:pb-8 px-margin-mobile lg:px-margin-desktop w-full max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-on-surface mb-2">Students</h1>
          <p className="text-lg text-on-surface-variant">Manage your enrolled learners, track their progress, and ensure everyone is staying on course.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
            <input type="text" placeholder="Search by name or email..." className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-on-surface outline-none focus:ring-4 focus:ring-primary/20 transition-all font-bold bg-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="relative">
            <select className="appearance-none bg-white pl-5 pr-12 py-4 rounded-2xl border-2 border-on-surface font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-all cursor-pointer" value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}>
              <option value="All">All Courses</option>
              {allCourses.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-lg text-on-surface-variant">expand_more</span>
          </div>
        </div>

        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-3 mb-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
          <div className="col-span-3">Student</div>
          <div className="col-span-3">Active Courses</div>
          <div className="col-span-3">Overall Progress</div>
          <div className="col-span-2 text-right">Last Activity</div>
          <div className="col-span-1 text-right">Detail</div>
        </div>

        <div className="space-y-4">
          {loading ? (
            [1, 2, 3].map(i => <div key={i} className="h-24 bg-surface-container animate-pulse rounded-[32px] border-2 border-on-surface"></div>)
          ) : filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <div key={student.id} className="bg-white rounded-[32px] p-6 md:p-8 border-2 border-on-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Name */}
                  <div className="col-span-1 md:col-span-3 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-container border-2 border-on-surface flex items-center justify-center text-primary font-black text-lg flex-shrink-0">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-lg text-on-surface leading-tight truncate">{student.name}</h4>
                      <div className="flex items-center gap-1">
                        {student.certifiedCourses?.length > 0 && (
                          <span className="text-xs font-black text-success">🎓 Certified</span>
                        )}
                        {student.progress === 100 && student.certifiedCourses?.length === 0 && (
                          <span className="text-xs font-black text-[#FFB800]">✓ Selesai</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Courses */}
                  <div className="col-span-1 md:col-span-3 flex flex-wrap gap-2">
                    {student.courseTitles?.map((c, i) => (
                      <span key={i} className="px-3 py-1 rounded-full border-2 border-on-surface bg-surface text-[10px] font-black uppercase tracking-tight">{c}</span>
                    ))}
                  </div>

                  {/* Progress */}
                  <div className="col-span-1 md:col-span-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-black text-on-surface-variant">{student.progress}% Completed</span>
                    </div>
                    <div className="h-3 bg-surface-container-low rounded-full border border-outline-variant overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={getProgressStyle(student.progress)}
                      />
                    </div>
                  </div>

                  {/* Last Activity */}
                  <div className="col-span-1 md:col-span-2 text-right">
                    <span className="font-black text-sm text-on-surface-variant">
                      {new Date(student.lastActivity).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  {/* Detail Button */}
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => openDetail(student)}
                      className="px-4 py-2 rounded-xl border-2 border-on-surface font-black text-xs bg-surface-container-low hover:bg-primary-container transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5"
                    >
                      Detail
                    </button>
                  </div>
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
    </div>
  );
};

export default TeacherStudents;
