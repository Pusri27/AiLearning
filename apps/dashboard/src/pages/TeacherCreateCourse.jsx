import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TeacherSidebar from '../components/TeacherSidebar';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabaseClient';
import { showToast, friendlyError } from '../lib/toast';
import { BulbIcon } from '../components/Icons';
import { courseService } from '../lib/courseService';

const TeacherCreateCourse = () => {
  const { id: editId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: Info, 2: Syllabus
  const [categories, setCategories] = useState([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Collaboration States
  const [collaborators, setCollaborators] = useState([]);
  const [searchTeacherQuery, setSearchTeacherQuery] = useState('');
  const [foundTeachers, setFoundTeachers] = useState([]);
  const [isOwner, setIsOwner] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    price: '',
    description: '',
    level: 'beginner',
    language: 'id',
    image_url: ''
  });

  // Syllabus State
  const [sections, setSections] = useState([]);
  const [courseId, setCourseId] = useState(null);

  const fetchCollaborators = async (cId) => {
    try {
      const { data, error } = await supabase
        .from('course_collaborators')
        .select('id, teacher_id, status, role')
        .eq('course_id', cId);

      if (error) throw error;
      
      let finalData = data || [];
      if (finalData.length > 0) {
        const teacherIds = finalData.map(c => c.teacher_id);
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', teacherIds);
          
        if (profileData) {
          finalData = finalData.map(c => ({
            ...c,
            profiles: profileData.find(p => p.id === c.teacher_id)
          }));
        }
      }
      
      setCollaborators(finalData);
    } catch (err) {
      console.error('Error fetching collaborators:', err);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
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
      
      // Fetch Categories
      try {
        const cats = await courseService.getCategories();
        setCategories(cats);
      } catch (err) {
        console.error(err);
      }

      // If Editing, Fetch Existing Data
      if (editId) {
        setLoading(true);
        try {
          const { data: courseData, error: cErr } = await supabase.from('courses').select('*').eq('id', editId).single();
          if (cErr) throw cErr;
          
          setFormData({
            title: courseData.title,
            category: courseData.category,
            price: courseData.price,
            description: courseData.description,
            level: courseData.level || 'beginner',
            language: courseData.language || 'id',
            image_url: courseData.image_url
          });
          setCourseId(editId);
          setIsOwner(courseData.instructor_id === session.user.id);
          
          const content = await courseService.getCourseContent(editId);
          setSections(content);
          
          // Also fetch collaborators
          await fetchCollaborators(editId);
          
          setCurrentStep(2); // Jump to syllabus by default when editing
        } catch (err) {
          showToast('Gagal memuat data kursus.', 'error');
        } finally {
          setLoading(false);
        }
      }
    };
    checkUser();
  }, [navigate, editId]);

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const newCat = await courseService.addCategory(newCatName);
      setCategories(prev => [...prev, newCat]);
      setFormData(prev => ({ ...prev, category: newCat.name }));
      setNewCatName('');
      setShowAddCategory(false);
      showToast('Kategori baru berhasil ditambahkan!');
    } catch (err) {
      showToast('Gagal menambahkan kategori.', 'error');
    }
  };

  const handleSearchTeachers = async (query) => {
    setSearchTeacherQuery(query);
    if (!query.trim()) {
      setFoundTeachers([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .eq('role', 'teacher')
        .neq('id', user.id)
        .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(5);

      if (error) throw error;
      setFoundTeachers(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInviteCollaborator = async (targetTeacherId) => {
    try {
      const exists = collaborators.some(c => c.teacher_id === targetTeacherId);
      if (exists) {
        showToast('Guru tersebut sudah diundang atau sedang berkolaborasi.', 'error');
        return;
      }

      const { error } = await supabase
        .from('course_collaborators')
        .insert([{
          course_id: courseId,
          teacher_id: targetTeacherId,
          invited_by: user.id,
          role: 'editor',
          status: 'pending'
        }]);

      if (error) throw error;
      showToast('Undangan kolaborasi berhasil dikirim!');
      setSearchTeacherQuery('');
      setFoundTeachers([]);
      fetchCollaborators(courseId);
    } catch (err) {
      console.error(err);
      showToast('Gagal mengirim undangan kolaborasi.', 'error');
    }
  };

  const handleRemoveCollaborator = async (collabId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kolaborator ini dari course?')) return;
    try {
      const { error } = await supabase
        .from('course_collaborators')
        .delete()
        .eq('id', collabId);

      if (error) throw error;
      showToast('Kolaborator berhasil dihapus.');
      fetchCollaborators(courseId);
    } catch (err) {
      showToast('Gagal menghapus kolaborator.', 'error');
    }
  };

  const handleCreateCourseShell = async () => {
    if (!formData.title || !formData.category || !formData.price) {
      showToast('Mohon isi Judul, Kategori, dan Harga terlebih dahulu.', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        category: formData.category,
        price: parseFloat(formData.price),
        description: formData.description,
        instructor: user.full_name || 'Instructor',
        instructor_id: user.id,
        level: formData.level,
        language: formData.language,
        image_url: formData.image_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop'
      };

      if (courseId) {
        // Update existing course
        const { error } = await supabase
          .from('courses')
          .update(payload)
          .eq('id', courseId);
        
        if (error) throw error;
        showToast('Detail kursus berhasil diperbarui!');
        
        // Refresh collaborators if we go back to step 1
        await fetchCollaborators(courseId);
        
        setCurrentStep(2);
      } else {
        // Insert new course shell
        const { data, error } = await supabase
          .from('courses')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        setCourseId(data.id);
        setCurrentStep(2);
        showToast('Kursus dibuat! Sekarang tambahkan materi pembelajaran.');
      }
    } catch (error) {
      showToast(friendlyError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const key = id.replace('course-', '');
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handlePublish = async (e) => {
    if (e) e.preventDefault();
    showToast('Kursus berhasil diterbitkan dengan seluruh materi!');
    navigate('/teacher/courses');
  };

  // --- Section Management ---
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');

  const handleOpenSectionModal = () => {
    setNewSectionTitle('');
    setSectionModalOpen(true);
  };

  const addSection = async () => {
    if (!newSectionTitle.trim()) return;

    try {
      const { data, error } = await supabase
        .from('course_sections')
        .insert([{ course_id: courseId, title: newSectionTitle, sort_order: sections.length }])
        .select()
        .single();
      if (error) throw error;
      setSections([...sections, { ...data, course_syllabus: [] }]);
      setSectionModalOpen(false);
      showToast('Section baru ditambahkan!');
    } catch (err) {
      showToast('Gagal menambahkan section.', 'error');
    }
  };

  // --- Syllabus Management ---
  const [editingSyllabus, setEditingSyllabus] = useState({
    section_id: null,
    title: '',
    content: '',
    video_url: '',
    assignment_text: '',
    file_url: '',
    type: 'material',
    deadline: '',
    allowed_file_types: 'pdf, docx, pptx'
  });
  const [syllabusModalOpen, setSyllabusModalOpen] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [aiDraft, setAiDraft] = useState('');

  const openSyllabusModal = (sectionId, type = 'material', syllabus = null) => {
    setAiDraft('');
    if (syllabus) {
      setEditingSyllabus({
        ...syllabus,
        type: syllabus.type || 'material',
        deadline: syllabus.deadline ? new Date(syllabus.deadline).toISOString().split('T')[0] : '',
        allowed_file_types: syllabus.allowed_file_types || 'pdf, docx, pptx'
      });
    } else {
      setEditingSyllabus({
        id: null,
        section_id: sectionId,
        title: '',
        content: '',
        file_url: '',
        video_url: '',
        assignment_text: '',
        type: type,
        deadline: '',
        allowed_file_types: 'pdf, docx, pptx'
      });
    }
    setSyllabusModalOpen(true);
  };

  const extractTextFromFile = async (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      if (extension === 'pdf') {
        reader.onload = async (e) => {
          try {
            const typedarray = new Uint8Array(e.target.result);
            const pdf = await window.pdfjsLib.getDocument(typedarray).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map(item => item.str).join(' ');
              fullText += pageText + '\n';
            }
            resolve(fullText);
          } catch (err) {
            console.error('PDF parsing error:', err);
            resolve('');
          }
        };
        reader.readAsArrayBuffer(file);
      } 
      else if (extension === 'docx' || extension === 'doc') {
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target.result;
            const result = await window.mammoth.extractRawText({ arrayBuffer });
            resolve(result.value);
          } catch (err) {
            console.error('Word parsing error:', err);
            resolve('');
          }
        };
        reader.readAsArrayBuffer(file);
      }
      else if (['txt', 'md', 'csv'].includes(extension)) {
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsText(file);
      }
      else {
        resolve(''); // Format lain belum didukung ekstraksi teksnya
      }
    });
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setLoading(true);
    try {
      // 1. Ekstrak teks untuk konteks AI
      const extractedText = await extractTextFromFile(file);
      
      // 2. Upload file ke storage
      const url = await courseService.uploadSyllabusFile(file, courseId);
      
      setEditingSyllabus(prev => ({ 
        ...prev, 
        file_url: url,
        content: extractedText || prev.content // Isi content dengan teks dari file jika berhasil diekstrak
      }));
      
      showToast(extractedText ? 'File dibaca & diunggah!' : 'File diunggah!');
    } catch (err) {
      showToast('Gagal mengunggah file.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAIOptimize = async () => {
    if (!editingSyllabus.content && !editingSyllabus.title) {
      showToast('Isi judul atau pastikan file telah terbaca untuk dioptimasi AI.', 'error');
      return;
    }

    setOptimizing(true);
    try {
      // Prioritaskan teks yang diekstrak dari file (yang ada di editingSyllabus.content)
      const sourceContext = editingSyllabus.content || editingSyllabus.title;
      const fileName = editingSyllabus.file_url ? editingSyllabus.file_url.split('/').pop() : '';
      
      const optimized = await courseService.optimizeMaterial(
        sourceContext,
        `TOPIK: ${editingSyllabus.title}. FILE: ${fileName}. INSTRUKSI: Rangkum teks ini agar padat dan mudah dipelajari.`,
        formData.language || 'id'
      );
      
      setAiDraft(optimized);
      showToast('AI telah membaca isi file Anda!');
    } catch (err) {
      showToast('AI gagal merangkum isi file.', 'error');
    } finally {
      setOptimizing(false);
    }
  };

  const applyAIDraft = () => {
    setEditingSyllabus(prev => ({ ...prev, content: aiDraft }));
    setAiDraft('');
    showToast('Rangkuman AI diterapkan.');
  };

  const handleDeleteSyllabus = async () => {
    if (!editingSyllabus?.id) return;
    
    if (!window.confirm('Apakah Anda yakin ingin menghapus materi ini?')) return;

    try {
      const { error } = await supabase
        .from('course_syllabus')
        .delete()
        .eq('id', editingSyllabus.id);

      if (error) throw error;

      showToast('Materi berhasil dihapus');
      setSyllabusModalOpen(false);
      fetchCourseData();
    } catch (err) {
      console.error(err);
      showToast('Gagal menghapus materi', 'error');
    }
  };

  const saveSyllabus = async () => {
    if (!editingSyllabus.title) {
      showToast('Judul syllabus wajib diisi.', 'error');
      return;
    }

    setLoading(true);
    try {
      // Pisahkan ID agar tidak ikut terkirim sebagai null saat insert
      const { id, ...syllabusData } = editingSyllabus;
      
      const payload = {
        ...syllabusData,
        course_id: courseId,
        is_published: true,
        deadline: editingSyllabus.deadline || null
      };

      let error;
      if (editingSyllabus.id) {
        ({ error } = await supabase.from('course_syllabus').update(payload).eq('id', editingSyllabus.id));
      } else {
        ({ error } = await supabase.from('course_syllabus').insert([payload]));
      }

      if (error) throw error;
      
      // Refresh sections
      const updatedSections = await courseService.getCourseContent(courseId);
      setSections(updatedSections);
      setSyllabusModalOpen(false);
      showToast('Syllabus berhasil disimpan!');
    } catch (err) {
      console.error('Save error:', err);
      showToast(`Gagal menyimpan: ${err.message || 'Error tidak diketahui'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface font-sans antialiased min-h-screen flex">
      <TeacherSidebar user={user} />

      {/* Main Content */}
      <main className="flex-1 lg:ml-[280px] pt-20 lg:pt-10 pb-24 lg:pb-8 px-margin-mobile lg:px-margin-desktop w-full max-w-[1440px] mx-auto min-h-screen">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-on-surface mb-2">{currentStep === 1 ? 'Create Course' : 'Manage Syllabus'}</h1>
            <p className="text-lg text-on-surface-variant font-bold">
              {currentStep === 1 ? 'Rancang kursus berkualitas tinggi untuk siswa Anda.' : 'Tambahkan materi, video, dan tugas untuk kursus Anda.'}
            </p>
          </div>
          <div className="flex gap-3">
             <button 
              onClick={() => navigate('/teacher/courses')}
              className="px-8 py-3 rounded-2xl border-4 border-on-surface font-black text-on-surface hover:bg-surface-variant transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
            >
              Cancel
            </button>
            {currentStep === 2 && courseId && (
              <button 
                type="button"
                onClick={async () => {
                  await fetchCollaborators(courseId);
                  setCurrentStep(1);
                }}
                className="px-8 py-3 rounded-2xl border-4 border-on-surface font-black text-on-surface hover:bg-surface-variant transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none cursor-pointer"
              >
                Edit Info & Collab
              </button>
            )}
            {currentStep === 1 ? (
              <button 
                onClick={handleCreateCourseShell}
                disabled={loading}
                className="px-8 py-3 rounded-2xl bg-primary text-on-primary font-black border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Next: Syllabus'}
              </button>
            ) : (
              <button 
                onClick={handlePublish}
                disabled={loading}
                className="px-8 py-3 rounded-2xl bg-primary text-on-primary font-black border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50 animate-bounce"
              >
                Publish Course
              </button>
            )}
          </div>
        </div>

        {currentStep === 1 ? (
          <form onSubmit={(e) => { e.preventDefault(); handleCreateCourseShell(); }} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Column: Primary Details */}
            <div className="col-span-1 lg:col-span-8 flex flex-col gap-10">
              
              {/* Basic Information Card */}
              <section className="bg-white rounded-[40px] p-8 md:p-10 border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 bg-primary-container rounded-xl border-2 border-on-surface flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
                    <Icon name="info" className="w-6 h-6 text-on-primary-container" />
                  </div>
                  <h2 className="text-2xl font-black text-on-surface">Detail Kursus</h2>
                </div>

                <div className="space-y-8">
                  <div>
                    <label className="block mb-3 font-black text-sm text-on-surface-variant uppercase tracking-widest" htmlFor="course-title">Judul Kursus</label>
                    <input 
                      className="w-full rounded-2xl border-4 border-on-surface bg-surface px-6 py-4 font-black text-on-surface placeholder:text-outline-variant focus:bg-primary-container/10 outline-none transition-all" 
                      id="course-title" 
                      placeholder="Contoh: Belajar UI/UX dari Nol" 
                      type="text"
                      value={formData.title}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block mb-3 font-black text-sm text-on-surface-variant uppercase tracking-widest" htmlFor="course-category">Kategori</label>
                      <div className="relative">
                        <select 
                          className="w-full appearance-none rounded-2xl border-4 border-on-surface bg-surface px-6 py-4 font-black text-on-surface focus:bg-primary-container/10 outline-none transition-all cursor-pointer pr-12" 
                          id="course-category"
                          value={formData.category}
                          onChange={handleInputChange}
                        >
                          <option value="">Pilih Kategori</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none font-black">keyboard_arrow_down</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setShowAddCategory(true)}
                        className="mt-2 text-xs font-black text-primary hover:underline flex items-center gap-1"
                      >
                        <Icon name="add" className="w-3 h-3" /> Tambah Kategori Baru
                      </button>

                      {showAddCategory && (
                        <div className="mt-3 p-4 bg-surface-variant/20 border-2 border-on-surface rounded-xl flex gap-2">
                          <input 
                            type="text" 
                            className="flex-1 bg-white border-2 border-on-surface px-3 py-1 text-xs font-bold rounded-lg outline-none"
                            placeholder="Nama Kategori..."
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                          />
                          <button 
                            type="button" 
                            onClick={handleAddCategory}
                            className="bg-primary text-white px-3 py-1 rounded-lg font-black text-xs border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all"
                          >
                            Add
                          </button>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block mb-3 font-black text-sm text-on-surface-variant uppercase tracking-widest" htmlFor="course-price">Harga (IDR)</label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface font-black">Rp</span>
                        <input 
                          className="w-full rounded-2xl border-4 border-on-surface bg-surface pl-14 pr-6 py-4 font-black text-on-surface placeholder:text-outline-variant focus:bg-primary-container/10 outline-none transition-all" 
                          id="course-price" 
                          placeholder="499000" 
                          type="number"
                          value={formData.price}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-3 font-black text-sm text-on-surface-variant uppercase tracking-widest" htmlFor="course-description">Deskripsi Kursus</label>
                    <textarea 
                      className="w-full rounded-2xl border-4 border-on-surface bg-surface px-6 py-4 font-black text-on-surface placeholder:text-outline-variant focus:bg-primary-container/10 outline-none transition-all h-40 resize-none" 
                      id="course-description" 
                      placeholder="Apa yang akan dipelajari siswa?"
                      value={formData.description}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                </div>
              </section>

              {/* Course Settings Card */}
              <section className="bg-white rounded-[40px] p-8 md:p-10 border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 bg-secondary-container rounded-xl border-2 border-on-surface flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
                    <span className="material-symbols-outlined text-on-secondary-container font-black">tune</span>
                  </div>
                  <h2 className="text-2xl font-black text-on-surface">Pengaturan Lanjutan</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block mb-3 font-black text-sm text-on-surface-variant uppercase tracking-widest" htmlFor="course-level">Tingkat Kesulitan</label>
                    <div className="relative">
                      <select 
                        className="w-full appearance-none rounded-2xl border-4 border-on-surface bg-surface px-6 py-4 font-black text-on-surface outline-none cursor-pointer" 
                        id="course-level"
                        value={formData.level}
                        onChange={handleInputChange}
                      >
                        <option value="beginner">Pemula</option>
                        <option value="intermediate">Menengah</option>
                        <option value="advanced">Mahir</option>
                        <option value="all">Semua Level</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none font-black">keyboard_arrow_down</span>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-3 font-black text-sm text-on-surface-variant uppercase tracking-widest" htmlFor="course-language">Bahasa</label>
                    <div className="relative">
                      <select 
                        className="w-full appearance-none rounded-2xl border-4 border-on-surface bg-surface px-6 py-4 font-black text-on-surface outline-none cursor-pointer" 
                        id="course-language"
                        value={formData.language}
                        onChange={handleInputChange}
                      >
                        <option value="id">Bahasa Indonesia</option>
                        <option value="en">English (US)</option>
                        <option value="ja">日本語</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none font-black">keyboard_arrow_down</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Collaboration Card */}
              {courseId && (
                <section className="bg-white rounded-[40px] p-8 md:p-10 border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-primary-container rounded-xl border-2 border-on-surface flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
                      <span className="material-symbols-outlined text-on-primary-container font-black">group_add</span>
                    </div>
                    <h2 className="text-2xl font-black text-on-surface">Kolaborasi Guru</h2>
                  </div>

                  <div className="space-y-8">
                    {/* Invite Section (Owner Only) */}
                    {isOwner ? (
                      <div>
                        <label className="block mb-3 font-black text-sm text-on-surface-variant uppercase tracking-widest">Undang Guru Lain</label>
                        <div className="relative">
                          <input 
                            className="w-full rounded-2xl border-4 border-on-surface bg-surface px-6 py-4 font-black text-on-surface placeholder:text-outline-variant outline-none" 
                            placeholder="Cari berdasarkan nama atau username..." 
                            type="text"
                            value={searchTeacherQuery}
                            onChange={(e) => handleSearchTeachers(e.target.value)}
                          />
                          {searchTeacherQuery && <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant">search</span>}
                        </div>

                        {/* Search Results Dropdown */}
                        {foundTeachers.length > 0 && (
                          <div className="mt-3 bg-white border-4 border-on-surface rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-h-60 overflow-y-auto space-y-2">
                            {foundTeachers.map(t => (
                              <div key={t.id} className="flex justify-between items-center p-3 bg-surface hover:bg-primary-container/10 border-2 border-transparent hover:border-on-surface rounded-xl transition-all">
                                <div>
                                  <p className="font-black text-sm text-on-surface">{t.full_name}</p>
                                  <p className="text-xs text-on-surface-variant font-bold">@{t.username}</p>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => handleInviteCollaborator(t.id)}
                                  className="bg-primary text-on-primary px-4 py-2 rounded-xl font-black text-xs border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                                >
                                  Undang
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {searchTeacherQuery && foundTeachers.length === 0 && (
                          <p className="mt-2 text-xs text-on-surface-variant italic font-bold">Guru tidak ditemukan.</p>
                        )}
                      </div>
                    ) : (
                      <div className="p-6 bg-secondary-container/20 border-2 border-on-surface rounded-2xl">
                        <p className="text-xs font-bold text-on-surface leading-relaxed">
                          <span className="font-black flex items-center gap-1 mb-1"><BulbIcon className="w-4 h-4 text-primary" /> Mode Kolaborator:</span> Anda dapat mengedit materi pembelajaran, namun hanya Pemilik Course yang dapat mengundang atau menghapus kolaborator lain.
                        </p>
                      </div>
                    )}

                    {/* Collaborator List */}
                    <div>
                      <h3 className="font-black text-sm text-on-surface-variant uppercase tracking-widest mb-4">Daftar Kolaborator</h3>
                      {collaborators.length === 0 ? (
                        <p className="text-sm text-on-surface-variant font-bold italic">Belum ada kolaborator di course ini.</p>
                      ) : (
                        <div className="space-y-4">
                          {collaborators.map(c => (
                            <div key={c.id} className="flex items-center justify-between p-4 bg-surface border-2 border-on-surface rounded-2xl">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-container border border-on-surface rounded-full flex items-center justify-center font-black text-sm text-on-primary-container">
                                  {(c.profiles?.full_name || 'G').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-black text-sm text-on-surface">{c.profiles?.full_name || 'Guru'}</p>
                                  <p className="text-xs text-on-surface-variant font-bold">@{c.profiles?.username || 'username'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase ${
                                  c.status === 'accepted' 
                                    ? 'bg-success-container text-on-success-container border-success' 
                                    : 'bg-warning-container text-on-warning-container border-warning'
                                }`}>
                                  {c.status === 'accepted' ? 'Diterima' : 'Tertunda'}
                                </span>
                                {isOwner && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCollaborator(c.id)}
                                    className="p-2 hover:bg-error-container text-error rounded-xl border border-transparent hover:border-on-surface transition-all cursor-pointer flex items-center justify-center"
                                    title="Hapus Kolaborator"
                                  >
                                    <span className="material-symbols-outlined text-sm font-black">delete</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* Right Column: Media */}
            <div className="col-span-1 lg:col-span-4 flex flex-col gap-10">
              <section className="bg-white rounded-[40px] p-8 border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] lg:sticky lg:top-28">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-tertiary-container rounded-xl border-2 border-on-surface flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
                    <span className="material-symbols-outlined text-on-tertiary-container font-black">perm_media</span>
                  </div>
                  <h2 className="text-xl font-black text-on-surface">Media Kursus</h2>
                </div>

                {/* Thumbnail Upload */}
                <div className="mb-10">
                  <label className="block mb-3 font-black text-sm text-on-surface-variant uppercase tracking-widest">Thumbnail URL</label>
                  <input 
                    className="w-full rounded-xl border-2 border-on-surface bg-surface px-4 py-3 font-black text-xs outline-none mb-6" 
                    id="course-image_url"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.image_url}
                    onChange={handleInputChange}
                  />
                  <div className="w-full aspect-[4/3] rounded-[32px] border-4 border-dashed border-on-surface bg-surface flex flex-col items-center justify-center gap-4 hover:bg-surface-variant cursor-pointer transition-all overflow-hidden group">
                    {formData.image_url ? (
                      <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <div className="p-4 bg-primary-container text-on-primary-container rounded-full border-2 border-on-surface shadow-[2px_2px_0px_0px_#000]">
                          <span className="material-symbols-outlined text-3xl font-black">add_photo_alternate</span>
                        </div>
                        <div className="text-center px-4">
                          <p className="font-black text-sm">Preview Thumbnail</p>
                          <p className="text-[10px] text-on-surface-variant mt-1 font-black uppercase">Rekomendasi: 1920x1080</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-secondary-container/20 rounded-2xl border-2 border-on-surface">
                   <p className="text-xs font-bold text-on-surface leading-relaxed">
                     <span className="font-black flex items-center gap-1 mb-1"><BulbIcon className="w-4 h-4 text-primary" /> Tips:</span> Gunakan gambar yang menarik untuk meningkatkan minat calon siswa hingga 40%.
                   </p>
                </div>
              </section>
            </div>
          </form>
        ) : (
          /* Step 2: Syllabus Management */
          <div className="space-y-10 pb-20">
            {sections.length === 0 && (
              <div className="text-center py-20 bg-white rounded-[40px] border-4 border-dashed border-on-surface">
                <Icon name="library_add" className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="font-black text-xl mb-6">Belum ada materi pembelajaran.</p>
                <button 
                  onClick={handleOpenSectionModal}
                  className="bg-primary text-on-primary px-8 py-3 rounded-2xl border-4 border-on-surface font-black shadow-[4px_4px_0px_0px_#000] hover:translate-y-1 transition-all"
                >
                  Buat Section Pertama
                </button>
              </div>
            )}

            {sections.map((section, sIdx) => (
              <div key={section.id} className="bg-white rounded-[40px] border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="bg-surface-variant/30 p-8 border-b-4 border-on-surface flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-on-surface text-white rounded-lg flex items-center justify-center font-black">{sIdx + 1}</div>
                    <h3 className="text-2xl font-black">{section.title}</h3>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => openSyllabusModal(section.id, 'material')}
                      className="flex items-center gap-2 bg-secondary-container text-on-secondary-container px-6 py-2 rounded-xl border-2 border-on-surface font-black shadow-[2px_2px_0px_0px_#000] hover:translate-y-0.5 active:shadow-none transition-all"
                    >
                      <Icon name="add" className="w-5 h-5" /> Tambah Materi
                    </button>
                    <button 
                      onClick={() => openSyllabusModal(section.id, 'assignment')}
                      className="flex items-center gap-2 bg-primary-container text-primary px-6 py-2 rounded-xl border-2 border-on-surface font-black shadow-[2px_2px_0px_0px_#000] hover:translate-y-0.5 active:shadow-none transition-all"
                    >
                      <Icon name="assignment" className="w-5 h-5" /> Tambah Tugas
                    </button>
                  </div>
                </div>

                <div className="p-8 space-y-4">
                  {section.course_syllabus?.length === 0 && <p className="text-on-surface-variant font-bold italic">Belum ada materi di section ini.</p>}
                  {section.course_syllabus?.map((syl, sylIdx) => (
                    <div key={syl.id} className="flex items-center justify-between p-4 bg-surface border-2 border-on-surface rounded-2xl hover:bg-surface-variant/10 transition-colors">
                      <div className="flex items-center gap-4">
                        <Icon name="article" className="w-6 h-6 text-primary" />
                        <div>
                          <p className="font-black">{syl.title}</p>
                          <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
                            {syl.file_url ? 'FILE ' : ''}{syl.video_url ? '• VIDEO ' : ''}{syl.assignment_text ? '• ASSIGNMENT' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => openSyllabusModal(section.id, syl.type || 'material', syl)} 
                          className="p-2 hover:bg-primary-container rounded-lg border border-on-surface transition-colors"
                        >
                          <Icon name="edit" className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {sections.length > 0 && (
              <button 
                onClick={handleOpenSectionModal}
                className="w-full py-6 rounded-[40px] border-4 border-dashed border-on-surface hover:bg-surface-variant/10 font-black text-xl flex items-center justify-center gap-3 transition-all"
              >
                <Icon name="add_circle" className="w-8 h-8" /> Tambah Section Baru
              </button>
            )}
          </div>
        )}

        {/* New Section Modal */}
        {sectionModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-sm">
            <div className="bg-white border-4 border-on-surface rounded-[40px] shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] w-full max-w-md p-10 flex flex-col gap-8 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black">New Section</h2>
                <button onClick={() => setSectionModalOpen(false)} className="p-2 hover:rotate-90 transition-transform"><Icon name="close" className="w-8 h-8" /></button>
              </div>
              
              <div className="space-y-4">
                <label className="block font-black text-xs uppercase tracking-widest text-on-surface-variant">Nama Section / Bab</label>
                <input 
                  autoFocus
                  className="w-full rounded-2xl border-4 border-on-surface bg-surface px-6 py-4 font-black text-on-surface outline-none" 
                  placeholder="Contoh: Pengenalan Dasar UI" 
                  value={newSectionTitle}
                  onChange={e => setNewSectionTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSection()}
                />
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setSectionModalOpen(false)}
                  className="flex-1 py-4 rounded-2xl border-4 border-on-surface font-black hover:bg-surface-variant transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={addSection}
                  className="flex-1 bg-primary text-on-primary py-4 rounded-2xl border-4 border-on-surface font-black shadow-[4px_4px_0px_0px_#000] hover:translate-y-1 transition-all"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Syllabus Modal */}
        {syllabusModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-sm">
            <div className="bg-white border-4 border-on-surface rounded-[40px] shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b-4 border-on-surface flex justify-between items-center bg-surface">
                <div>
                  <h2 className="text-3xl font-black">{editingSyllabus.id ? 'Edit' : 'Add New'} {editingSyllabus.type === 'assignment' ? 'Assignment' : 'Syllabus'}</h2>
                  <p className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest">{editingSyllabus.type === 'assignment' ? 'Penugasan & Latihan' : 'Materi Pembelajaran'}</p>
                </div>
                <button onClick={() => setSyllabusModalOpen(false)} className="p-2 hover:rotate-90 transition-transform"><Icon name="close" className="w-8 h-8" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Left Column: Form Inputs */}
                  <div className="space-y-8">
                    <div>
                      <label className="block mb-2 font-black text-xs uppercase tracking-widest text-on-surface-variant">Judul {editingSyllabus.type === 'assignment' ? 'Tugas' : 'Materi'}</label>
                      <input 
                        className="w-full rounded-2xl border-4 border-on-surface bg-surface px-6 py-4 font-black text-on-surface outline-none" 
                        placeholder={editingSyllabus.type === 'assignment' ? "Contoh: Latihan Fundamental UI/UX" : "Contoh: Pengenalan Dasar UI"} 
                        value={editingSyllabus.title}
                        onChange={e => setEditingSyllabus({...editingSyllabus, title: e.target.value})}
                      />
                    </div>

                    {editingSyllabus.type === 'assignment' ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block mb-2 font-black text-xs uppercase tracking-widest text-on-surface-variant">Deadline Pengumpulan</label>
                            <input 
                              type="date"
                              className="w-full rounded-2xl border-4 border-on-surface bg-surface px-6 py-4 font-black text-on-surface outline-none" 
                              value={editingSyllabus.deadline}
                              onChange={e => setEditingSyllabus({...editingSyllabus, deadline: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block mb-2 font-black text-xs uppercase tracking-widest text-on-surface-variant">Format File (Pisah Koma)</label>
                            <input 
                              className="w-full rounded-2xl border-4 border-on-surface bg-surface px-6 py-4 font-black text-on-surface outline-none" 
                              placeholder="pdf, zip, png, jpg" 
                              value={editingSyllabus.allowed_file_types}
                              onChange={e => setEditingSyllabus({...editingSyllabus, allowed_file_types: e.target.value})}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block mb-2 font-black text-xs uppercase tracking-widest text-on-surface-variant">Instruksi Tugas</label>
                          <textarea 
                            className="w-full rounded-2xl border-4 border-on-surface bg-surface px-6 py-4 font-bold text-on-surface outline-none min-h-[150px]" 
                            placeholder="Jelaskan detail tugas yang harus dikerjakan siswa..." 
                            value={editingSyllabus.assignment_text}
                            onChange={e => setEditingSyllabus({...editingSyllabus, assignment_text: e.target.value})}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block mb-2 font-black text-xs uppercase tracking-widest text-on-surface-variant">Upload File Materi (Semua Format)</label>
                          <label className="group cursor-pointer">
                            <input 
                              type="file"
                              className="hidden"
                              onChange={e => handleFileUpload(e.target.files[0])}
                            />
                            <div className={`w-full p-6 rounded-2xl border-4 border-dashed transition-all flex flex-col items-center gap-2 relative ${editingSyllabus.file_url ? 'bg-success/10 border-success' : 'bg-secondary-container/30 border-secondary hover:bg-secondary-container/50'}`}>
                              {editingSyllabus.file_url && (
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setEditingSyllabus({...editingSyllabus, file_url: ''});
                                  }}
                                  className="absolute top-2 right-2 p-1 bg-white border-2 border-on-surface rounded-full hover:bg-error hover:text-white transition-all z-10"
                                  title="Hapus File"
                                >
                                  <Icon name="close" className="w-4 h-4" />
                                </button>
                              )}
                              <Icon name={editingSyllabus.file_url ? 'check_circle' : 'cloud_upload'} className={`w-8 h-8 ${editingSyllabus.file_url ? 'text-success' : 'text-secondary'}`} />
                              <p className="font-black text-xs text-center">
                                {editingSyllabus.file_url ? 'File Berhasil Diunggah' : 'Klik atau Drag File ke Sini'}
                              </p>
                            </div>
                          </label>
                        </div>
                        <div>
                          <label className="block mb-2 font-black text-xs uppercase tracking-widest text-on-surface-variant">YouTube Video Link</label>
                          <input 
                            className="w-full rounded-2xl border-4 border-on-surface bg-surface px-6 py-4 font-black text-on-surface outline-none" 
                            placeholder="https://youtube.com/..." 
                            value={editingSyllabus.video_url}
                            onChange={e => setEditingSyllabus({...editingSyllabus, video_url: e.target.value})}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Right Column: AI Section or Additional Info */}
                  <div className="flex flex-col gap-6">
                    {editingSyllabus.type === 'material' ? (
                      <>
                        <div className="flex justify-between items-center">
                          <label className="block font-black text-xs uppercase tracking-widest text-on-surface-variant">Review Materi (Optimasi AI)</label>
                          <button 
                            onClick={handleAIOptimize}
                            disabled={optimizing}
                            className="bg-primary-container text-primary px-3 py-1 rounded-lg border-2 border-on-surface font-black text-[10px] flex items-center gap-1 hover:translate-y-0.5 active:shadow-none shadow-[2px_2px_0px_0px_#000] transition-all disabled:opacity-50"
                          >
                            <Icon name="psychology" className="w-3 h-3" /> {optimizing ? 'Analyzing...' : 'AI Optimize & Compact'}
                          </button>
                        </div>
                        
                        <div className="flex-1 flex flex-col relative min-h-[400px]">
                          <textarea 
                            className={`flex-1 w-full rounded-2xl border-4 border-on-surface bg-surface px-8 py-8 font-medium text-sm leading-relaxed outline-none transition-all ${aiDraft ? 'opacity-20 blur-[1px]' : 'opacity-100'}`} 
                            placeholder="Materi pembelajaran akan muncul di sini. Anda bisa mengeditnya secara manual jika perlu." 
                            value={editingSyllabus.content}
                            onChange={e => setEditingSyllabus({...editingSyllabus, content: e.target.value})}
                          />
                          
                          {aiDraft && (
                            <div className="absolute inset-0 z-10 flex flex-col p-2 animate-in fade-in zoom-in-95 duration-300">
                              <div className="flex-1 bg-white border-4 border-primary rounded-3xl shadow-[12px_12px_0px_0px_rgba(var(--primary-rgb),0.2)] flex flex-col overflow-hidden">
                                <div className="p-4 bg-primary text-on-primary flex justify-between items-center">
                                  <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <Icon name="psychology" className="w-4 h-4" /> AI Suggestion (Draft)
                                  </p>
                                  <button onClick={() => setAiDraft('')} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                                    <Icon name="close" className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="flex-1 p-6 overflow-y-auto text-xs font-bold text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                                  {aiDraft}
                                </div>
                                <div className="p-4 border-t-2 border-primary/20 bg-primary/5 flex gap-3">
                                  <button 
                                    onClick={applyAIDraft}
                                    className="flex-1 bg-primary text-on-primary py-3 rounded-xl border-2 border-on-surface font-black text-xs shadow-[4px_4px_0px_0px_#000] hover:translate-y-1 hover:shadow-none transition-all"
                                  >
                                    Terapkan Rangkuman AI
                                  </button>
                                  <button 
                                    onClick={() => setAiDraft('')}
                                    className="px-6 py-3 bg-white text-on-surface-variant rounded-xl border-2 border-on-surface font-black text-xs hover:bg-surface-variant/10 transition-all"
                                  >
                                    Abaikan
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex flex-col justify-center items-center text-center p-10 bg-surface-variant/10 rounded-[40px] border-4 border-on-surface border-dashed">
                        <Icon name="assignment_turned_in" className="w-20 h-20 text-secondary mb-6" />
                        <h3 className="text-2xl font-black mb-2">Penugasan Terstruktur</h3>
                        <p className="text-sm font-bold text-on-surface-variant">Tugas ini akan muncul sebagai item terpisah bagi siswa. Siswa dapat mengunggah file hasil pekerjaannya sebelum deadline.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8 border-t-4 border-on-surface flex justify-end gap-4 bg-surface">
                <div className="flex gap-4 w-full">
                  {editingSyllabus.id && (
                    <button 
                      onClick={handleDeleteSyllabus}
                      className="px-8 py-4 rounded-2xl border-4 border-on-surface bg-error text-white font-black shadow-[4px_4px_0px_0px_#000] hover:translate-y-1 transition-all"
                    >
                      Delete
                    </button>
                  )}
                  <div className="flex-1"></div>
                  <button 
                    onClick={() => setSyllabusModalOpen(false)}
                    className="px-8 py-4 rounded-2xl border-4 border-on-surface font-black hover:bg-surface-variant transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={saveSyllabus}
                    disabled={loading}
                    className="px-10 py-4 bg-primary text-on-primary rounded-2xl border-4 border-on-surface font-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all"
                  >
                    {loading ? 'Saving...' : `Save ${editingSyllabus.type === 'assignment' ? 'Assignment' : 'Syllabus'}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherCreateCourse;
