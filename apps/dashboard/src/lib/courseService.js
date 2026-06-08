import { supabase } from './supabaseClient';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const AI_MODEL = import.meta.env.VITE_AI_MODEL || "nvidia/nemotron-3-super-120b-a12b:free";

export const courseService = {
  // --- AI Translation ---
  translateContent: async (title, content, targetLanguage) => {
    const langName = targetLanguage === 'en' ? 'English (US)' : targetLanguage === 'ja' ? 'Japanese (日本語)' : targetLanguage === 'zh' ? 'Chinese (中文)' : 'Bahasa Indonesia';
    const prompt = `
      You are a professional translator for "Harin Learning".
      Translate the following course lesson title and lesson content into ${langName}.
      
      Maintain original markdown structure and meaning. Keep formatting clean.
      Do not add extra conversational replies like "Here is your translation:".
      
      Output format:
      [TITLE]
      (Translated Title)
      [CONTENT]
      (Translated Content)
      
      ---
      TITLE: ${title}
      CONTENT: ${content}
    `;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": AI_MODEL,
          "messages": [
            { "role": "system", "content": "You are a professional educational translator." },
            { "role": "user", "content": prompt }
          ]
        })
      });

      const data = await response.json();
      const rawText = data.choices[0].message.content;
      
      // Parse [TITLE] and [CONTENT]
      const titleMatch = rawText.match(/\\[TITLE\\]\\n([\\s\\S]*?)\\n\\[CONTENT\\]/i) || rawText.match(/\\[TITLE\\]([\\s\\S]*?)\\[CONTENT\\]/i);
      const contentMatch = rawText.match(/\\[CONTENT\\]\\n([\\s\\S]*)/i) || rawText.match(/\\[CONTENT\\]([\\s\\S]*)/i);
      
      return {
        title: titleMatch ? titleMatch[1].trim() : title,
        content: contentMatch ? contentMatch[1].trim() : rawText
      };
    } catch (error) {
      console.error("Translation Error:", error);
      throw new Error("Gagal menerjemahkan konten dengan AI.");
    }
  },

  // --- AI Optimization ---
  optimizeMaterial: async (content, userContext = '', language = 'id') => {
    const langName = language === 'en' ? 'English (US)' : language === 'ja' ? 'Japanese (日本語)' : language === 'zh' ? 'Chinese (简体中文)' : 'Bahasa Indonesia';
    const prompt = `
      Kamu adalah AI Pengembang Kurikulum di platform "Harin Learning". 
      Tugasmu adalah membuat materi pembelajaran yang sangat compact dan bersih.
      
      INPUT UTAMA:
      ${content || 'Materi berdasarkan judul'}
      
      ATURAN KERJA (SANGAT PENTING):
      1. BEDAH TOPIK: Gunakan Judul dan Nama File sebagai sumber topik utama. Jika file tentang "Zodiak Cancer", buatlah materi KHUSUS tentang Zodiak Cancer (karakteristik, simbol, elemen, dll).
      2. JANGAN gunakan template umum seperti "Materi ini menyajikan rangkuman...". Langsung masuk ke isi materi yang relevan.
      3. JANGAN gunakan simbol Markdown (#, **, -). Gunakan HURUF KAPITAL untuk Judul/Sub-judul.
      4. STRUKTUR: Gunakan spasi dan paragraf yang jelas. Buatlah materi yang "siap baca" bagi siswa.
      5. BAHASA MATERI: Materi HARUS ditulis dalam ${langName}.
      6. Jika konteksnya tentang hobi, sains, atau astrologi, sesuaikan bahasanya agar menarik namun tetap edukatif.
      
      HASIL MATERI (Berikan isi spesifik sesuai topik dalam ${langName}):
    `;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": AI_MODEL,
          "messages": [
            { "role": "system", "content": "Kamu adalah asisten pengembang materi pembelajaran profesional." },
            { "role": "user", "content": prompt }
          ]
        })
      });

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("Optimization Error:", error);
      throw new Error("Gagal mengoptimalkan materi dengan AI.");
    }
  },

  // --- File Upload ---
  uploadSyllabusFile: async (file, courseId) => {
    const ext = file.name.split('.').pop();
    const fileName = `${courseId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    
    const { data, error } = await supabase.storage
      .from('course-content')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('course-content')
      .getPublicUrl(fileName);

    return publicUrl;
  },

  // --- Category Management ---
  getCategories: async () => {
    const { data, error } = await supabase
      .from('course_categories')
      .select('*')
      .order('name');
    if (error) throw error;
    return data;
  },

  addCategory: async (name) => {
    const { data, error } = await supabase
      .from('course_categories')
      .insert([{ name }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --- Syllabus & Progress ---
  getCourseContent: async (courseId) => {
    const { data: sections, error: secError } = await supabase
      .from('course_sections')
      .select(`
        *,
        course_syllabus (*)
      `)
      .eq('course_id', courseId)
      .order('sort_order');

    if (secError) throw secError;
    return sections;
  },

  markSyllabusCompleted: async (userId, courseId, syllabusId) => {
    const { error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        course_id: courseId,
        syllabus_id: syllabusId,
        completed_at: new Date().toISOString()
      });
    if (error) throw error;
  },

  getUserProgress: async (userId, courseId) => {
    const { data, error } = await supabase
      .from('user_progress')
      .select('syllabus_id')
      .eq('user_id', userId)
      .eq('course_id', courseId);
    if (error) throw error;
    return data.map(p => p.syllabus_id);
  },

  checkCertificateEligibility: async (userId, courseId) => {
    // 1. Get all published syllabus for course
    const { data: syllabus, error: sylError } = await supabase
      .from('course_syllabus')
      .select('id')
      .eq('course_id', courseId)
      .eq('is_published', true);

    if (sylError) throw sylError;

    // 2. Get user progress
    const { data: progress, error: progError } = await supabase
      .from('user_progress')
      .select('syllabus_id')
      .eq('user_id', userId)
      .eq('course_id', courseId);

    if (progError) throw progError;

    const completedIds = progress.map(p => p.syllabus_id);
    const allCompleted = syllabus.every(s => completedIds.includes(s.id));

    return {
      isEligible: allCompleted && syllabus.length > 0,
      completedCount: completedIds.length,
      totalCount: syllabus.length
    };
  },

  // --- Submissions ---
  submitAssignment: async (studentId, courseId, syllabusId, file) => {
    // 1. Upload File
    const ext = file.name.split('.').pop();
    const fileName = `submissions/${courseId}/${studentId}_${syllabusId}_${Date.now()}.${ext}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('course-content')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('course-content')
      .getPublicUrl(fileName);

    // 2. Save to Database
    const { data, error } = await supabase
      .from('submissions')
      .upsert({
        student_id: studentId,
        course_id: courseId,
        syllabus_id: syllabusId,
        file_url: publicUrl,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getUserSubmission: async (studentId, syllabusId) => {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('student_id', studentId)
      .eq('syllabus_id', syllabusId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
};
