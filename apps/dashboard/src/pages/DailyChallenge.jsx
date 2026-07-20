import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabaseClient';
import { useUserProfile } from '../context/UserProfileContext';

const DailyChallenge = () => {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const isGuest = profile?.isGuest;

  const [loading, setLoading] = useState(true);
  const [studiedMaterials, setStudiedMaterials] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [streak, setStreak] = useState(0);
  const [alreadyDone, setAlreadyDone] = useState(false);

  useEffect(() => {
    if (isGuest) {
      setLoading(false);
      return;
    }
    loadStreakAndProgress();
  }, [isGuest]);

  const loadStreakAndProgress = async () => {
    try {
      setLoading(true);
      
      // Load streak from localStorage
      const savedStreak = localStorage.getItem('daily_challenge_streak');
      const lastCompletedDate = localStorage.getItem('daily_challenge_completed_date');
      const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
      
      const currentStreak = savedStreak ? parseInt(savedStreak, 10) : 0;
      setStreak(currentStreak);

      if (lastCompletedDate === todayStr) {
        setAlreadyDone(true);
        // Do not block early! They are allowed to play the quiz again.
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      // Fetch user progress
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('syllabus_id')
        .eq('user_id', session.user.id);

      if (!progressData || progressData.length === 0) {
        setStudiedMaterials([]);
        setLoading(false);
        return;
      }

      // Fetch syllabus details
      const syllabusIds = progressData.map(p => p.syllabus_id);
      const { data: syllabusItems } = await supabase
        .from('course_syllabus')
        .select('id, title, content, course_id')
        .in('id', syllabusIds);

      if (!syllabusItems || syllabusItems.length === 0) {
        setStudiedMaterials([]);
        setLoading(false);
        return;
      }

      // Fetch courses details to display categories & course names
      const courseIds = [...new Set(syllabusItems.map(s => s.course_id))];
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title, category')
        .in('id', courseIds);

      // Map course data into syllabus items
      const mappedMaterials = syllabusItems.map(item => {
        const c = coursesData?.find(course => course.id === item.course_id);
        return {
          ...item,
          course_title: c ? c.title : 'Kelas Harin',
          category: c ? c.category : 'Umum'
        };
      });

      setStudiedMaterials(mappedMaterials);
      
      // Generate questions
      await generateQuiz(mappedMaterials);
    } catch (err) {
      console.error('Error loading Daily Challenge data:', err);
    } finally {
      setLoading(false);
    }
  };

  const shuffleQuestionOptions = (qList) => {
    return qList.map(q => {
      if (!q || !Array.isArray(q.options)) return q;

      // Normalize options to always have { id, label } format
      const normalizedOptions = q.options.map((opt, idx) => {
        if (typeof opt === 'string') {
          return { id: ['A', 'B', 'C', 'D'][idx] || String(idx), label: opt };
        }
        return {
          id: String(opt.id || opt.key || '').toUpperCase(),
          label: String(opt.label || opt.text || opt.value || '')
        };
      });

      // Find the correct label resiliently
      let correctLabel = '';
      const ansStr = String(q.correct_answer || '').toUpperCase().trim();

      // Check if correct_answer matches option ID
      const foundOptionById = normalizedOptions.find(opt => opt.id === ansStr);
      if (foundOptionById) {
        correctLabel = foundOptionById.label;
      } else {
        // Maybe correct_answer is an index (0, 1, 2, 3)
        const idx = parseInt(ansStr, 10);
        if (!isNaN(idx) && normalizedOptions[idx]) {
          correctLabel = normalizedOptions[idx].label;
        } else {
          // Maybe correct_answer is the text label itself
          correctLabel = String(q.correct_answer || '');
        }
      }

      // Shuffle options list
      const shuffledOptions = [...normalizedOptions];
      for (let i = shuffledOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
      }

      // Re-map IDs to 'A', 'B', 'C', 'D'
      const ids = ['A', 'B', 'C', 'D'];
      const mappedOptions = shuffledOptions.map((opt, idx) => ({
        id: ids[idx] || String(idx),
        label: opt.label
      }));

      // Find the new correct option ID based on matching label
      const newCorrectOption = mappedOptions.find(opt => 
        opt.label.trim().toLowerCase() === correctLabel.trim().toLowerCase()
      );
      
      const randomIds = ['A', 'B', 'C', 'D'];
      const fallbackCorrectId = randomIds[Math.floor(Math.random() * randomIds.length)];
      const newCorrectId = newCorrectOption ? newCorrectOption.id : fallbackCorrectId;

      return {
        ...q,
        options: mappedOptions,
        correct_answer: newCorrectId
      };
    });
  };

  const generateFallbackQuestions = (materialsList) => {
    const fallbacks = [];
    const totalQuestions = 10;
    for (let i = 0; i < totalQuestions; i++) {
      const material = materialsList[i % materialsList.length];
      const courseTitle = material.course_title || "Kelas Pilihan";
      const syllabusTitle = material.title || "Materi Pilihan";
      
      if (i % 3 === 0) {
        fallbacks.push({
          question: `Manakah dari pilihan berikut yang merupakan fokus bahasan utama dari materi "${syllabusTitle}" pada kelas "${courseTitle}"?`,
          options: [
            { id: 'A', label: `Konsep dasar dan implementasi dari materi ${syllabusTitle}` },
            { id: 'B', label: `Sejarah perkembangan teknologi industri abad ke-18` },
            { id: 'C', label: `Penggunaan database server tanpa konfigurasi` },
            { id: 'D', label: `Metodologi penelitian sosial secara kuantitatif` }
          ],
          correct_answer: 'A',
          explanation: `Materi "${syllabusTitle}" berfokus pada konsep dasar dan bagaimana penerapannya secara praktis dalam kelas "${courseTitle}".`,
          course_title: courseTitle,
          syllabus_title: syllabusTitle
        });
      } else if (i % 3 === 1) {
        fallbacks.push({
          question: `Mengapa pemahaman tentang "${syllabusTitle}" sangat penting dalam mempelajari "${courseTitle}"?`,
          options: [
            { id: 'A', label: 'Karena topik ini tidak relevan dengan kebutuhan dunia kerja' },
            { id: 'B', label: 'Karena materi ini menjelaskan rahasia database internal' },
            { id: 'C', label: `Karena topik ini merupakan pilar penting untuk menguasai ${courseTitle}` },
            { id: 'D', label: 'Hanya sebagai materi opsional tanpa nilai tambah pembelajaran' }
          ],
          correct_answer: 'C',
          explanation: `Memahami "${syllabusTitle}" memberikan dasar yang kuat untuk menguasai kompetensi di kelas "${courseTitle}".`,
          course_title: courseTitle,
          syllabus_title: syllabusTitle
        });
      } else {
        fallbacks.push({
          question: `Materi "${syllabusTitle}" mendidik kita untuk dapat...`,
          options: [
            { id: 'A', label: `Mengabaikan standar industri terbaru dalam pengerjaan tugas` },
            { id: 'B', label: `Berpikir kritis dan mengimplementasikan materi secara praktis` },
            { id: 'C', label: `Menghafal teori tanpa melakukan praktik atau latihan` },
            { id: 'D', label: `Menghindari kolaborasi dengan pengembang atau pelajar lain` }
          ],
          correct_answer: 'B',
          explanation: `Melalui "${syllabusTitle}", siswa didorong untuk menguasai materi secara kritis dan aplikatif di kelas "${courseTitle}".`,
          course_title: courseTitle,
          syllabus_title: syllabusTitle
        });
      }
    }
    return fallbacks;
  };

  const generateQuiz = async (materialsList) => {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    const model = import.meta.env.VITE_AI_MODEL || "nvidia/nemotron-3-super-120b-a12b:free";

    if (!apiKey) {
      const fallback = generateFallbackQuestions(materialsList);
      const shuffledFallback = shuffleQuestionOptions(fallback);
      setQuestions(shuffledFallback);
      return;
    }

    try {
      const systemPrompt = `You are a helpful quiz generator for Harin Learning.
Given a list of learning materials (titles and contents) studied by the student, generate exactly 10 multiple choice questions.
The questions MUST be directly related to the topics covered in these materials.
Format the output as a valid JSON array of objects. Do not wrap the JSON in markdown blocks like \`\`\`json. Return only the raw JSON string.
Each object must have the following keys:
- "question": string, the question text
- "options": array of 4 objects, each having "id" (one of "A", "B", "C", "D") and "label" (string, the option text)
- "correct_answer": string, the correct option id (one of "A", "B", "C", "D")
- "explanation": string, a brief explanation of why the answer is correct
- "course_title": string, the title of the course
- "syllabus_title": string, the title of the material
`;

      const userPrompt = `Studied materials:
${materialsList.map((m, i) => `${i+1}. Course: "${m.course_title}", Material: "${m.title}", Content: "${m.content || ''}"`).join('\n\n')}

Generate 10 high-quality quiz questions in Indonesian language based on the studied materials.`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": model,
          "messages": [
            { "role": "system", "content": systemPrompt },
            { "role": "user", "content": userPrompt }
          ]
        })
      });

      const data = await response.json();
      const contentText = data.choices[0].message.content.trim();
      
      const cleaned = contentText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      const generatedQuestions = JSON.parse(cleaned);

      if (Array.isArray(generatedQuestions) && generatedQuestions.length > 0) {
        const shuffled = shuffleQuestionOptions(generatedQuestions.slice(0, 10));
        setQuestions(shuffled);
      } else {
        throw new Error("Invalid output format from AI model");
      }
    } catch (e) {
      console.error("AI quiz generation failed, using fallback:", e);
      const fallback = generateFallbackQuestions(materialsList);
      const shuffledFallback = shuffleQuestionOptions(fallback);
      setQuestions(shuffledFallback);
    }
  };

  const handleAnswerSubmit = () => {
    if (!selectedOption || isSubmitted) return;

    const currentQuestion = questions[currentQuestionIdx];
    const isCorrect = selectedOption === currentQuestion.correct_answer;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    
    setIsSubmitted(true);
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsSubmitted(false);
    
    if (currentQuestionIdx + 1 < questions.length) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      setChallengeCompleted(true);
      
      const todayStr = new Date().toLocaleDateString('en-CA');
      const savedStreak = localStorage.getItem('daily_challenge_streak');
      const lastCompletedDate = localStorage.getItem('daily_challenge_completed_date');
      const yesterdayStr = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');

      // Only increment streak if they haven't completed a challenge today yet
      if (lastCompletedDate !== todayStr) {
        let newStreak = 1;
        if (lastCompletedDate === yesterdayStr) {
          newStreak = savedStreak ? parseInt(savedStreak, 10) + 1 : 1;
        }
        localStorage.setItem('daily_challenge_streak', String(newStreak));
        localStorage.setItem('daily_challenge_completed_date', todayStr);
        setStreak(newStreak);
        setAlreadyDone(true);
      }
    }
  };

  // ── GUEST MODE VIEW ──────────────────────────────────────────────────
  if (isGuest) {
    return (
      <div className="bg-surface text-on-surface font-body-md flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="bg-primary-container p-10 rounded-3xl border-4 border-on-surface shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-center space-y-6 max-w-md">
            <div className="w-20 h-20 bg-primary text-white rounded-2xl flex items-center justify-center mx-auto border-4 border-on-surface rotate-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Icon name="lock" className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="font-headline-xl text-3xl font-black text-on-primary-container">Login Diperlukan</h2>
              <p className="font-bold text-on-primary-container/70 leading-relaxed">
                Tantangan harian tersedia khusus untuk pengguna terdaftar agar kami bisa melacak progress dan streak kamu!
              </p>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => navigate('/signup')}
                className="w-full bg-primary text-white py-4 text-lg font-black rounded-xl border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                Daftar Gratis
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-white text-on-surface py-3 text-sm font-bold rounded-xl border-2 border-on-surface hover:bg-surface-container transition-all"
              >
                Masuk ke Akun
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── LOADING STATE ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-surface text-on-surface font-body-md flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface-container-lowest">
          <div className="w-16 h-16 border-4 border-on-surface border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="font-black text-lg text-on-surface tracking-wide">Mempersiapkan Tantangan Harian...</p>
          <p className="text-sm text-on-surface-variant font-bold mt-1">Mengambil data materi yang sudah kamu pelajari</p>
        </div>
      </div>
    );
  }

  // ── EMPTY STATE (No studied materials yet) ───────────────────────────
  if (studiedMaterials.length === 0) {
    return (
      <div className="bg-surface text-on-surface font-body-md flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface-container-lowest">
          <div className="bg-primary-container p-8 rounded-3xl border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center space-y-6 max-w-lg">
            <div className="w-16 h-16 bg-[#FFB800] text-on-background rounded-2xl flex items-center justify-center mx-auto border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Icon name="menu_book" className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="font-headline-xl text-2xl font-black text-on-primary-container">Belum Ada Materi Pelajaran</h2>
              <p className="font-bold text-on-primary-container/70 leading-relaxed text-sm">
                Daily Quiz dirancang khusus untuk menguji materi yang **sudah kamu pelajari**. Yuk, selesaikan minimal 1 materi atau pelajaran di katalog kursus terlebih dahulu agar Harin AI dapat meramu kuis khusus untukmu!
              </p>
            </div>
            <button
              onClick={() => navigate('/catalog')}
              className="w-full bg-primary text-white py-4 text-base font-black rounded-xl border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
            >
              Jelajahi Katalog Kursus
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── CHALLENGE COMPLETED RESULT VIEW ──────────────────────────────────
  if (challengeCompleted) {
    return (
      <div className="bg-surface text-on-surface font-body-md flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-8 bg-surface-container-lowest">
          <div className="bg-primary-container p-8 rounded-3xl border-4 border-on-surface shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-center space-y-6 max-w-lg w-full">
            <div className="w-20 h-20 bg-primary text-white rounded-2xl flex items-center justify-center mx-auto border-4 border-on-surface rotate-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Icon name="emoji_events" className="w-10 h-10 fill-current" />
            </div>
            
            <div className="space-y-2">
              <h2 className="font-headline-xl text-3xl font-black text-on-primary-container">Hasil Tantangan Harian</h2>
              <p className="font-bold text-on-primary-container/80 text-sm leading-relaxed">
                Kerja bagus! Kamu telah menyelesaikan tantangan kuis hari ini.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 my-6">
              <div className="bg-white border-2 border-on-surface p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-xs font-bold text-on-surface-variant uppercase">Skor Kuis</p>
                <p className="text-3xl font-black text-primary mt-1">{score} / {questions.length}</p>
              </div>
              <div className="bg-white border-2 border-on-surface p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center">
                <p className="text-xs font-bold text-on-surface-variant uppercase">Streak Kamu</p>
                <div className="flex items-center gap-1 mt-1">
                  <Icon name="local_fire_department" className="w-6 h-6 text-[#FF6B4A] fill-current" />
                  <p className="text-2xl font-black text-on-surface">{streak} Hari</p>
                </div>
              </div>
            </div>

            {alreadyDone && (
              <div className="bg-[#E5F3FF] border-2 border-on-surface p-4 rounded-xl text-[#003B73] font-bold text-xs leading-relaxed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-left flex gap-2 items-start">
                <Icon name="info" className="w-5 h-5 text-[#00529B] shrink-0" />
                <p>Kamu sudah mengklaim streak hari ini. Kuis kali ini berfungsi sebagai latihan tambahan dan tidak menambah streak belajarmu lagi.</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  setChallengeCompleted(false);
                  setCurrentQuestionIdx(0);
                  setScore(0);
                  setSelectedOption(null);
                  setIsSubmitted(false);
                  generateQuiz(studiedMaterials);
                }}
                className="flex-1 bg-white text-on-surface py-4 text-base font-black rounded-xl border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
              >
                Mulai Kuis Lagi
              </button>
              <button
                onClick={() => navigate('/study')}
                className="flex-1 bg-[#FF6B4A] text-white py-4 text-base font-black rounded-xl border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
              >
                Kembali ke Study Space
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── GAME IN-PROGRESS VIEW ────────────────────────────────────────────
  const currentQuestion = questions[currentQuestionIdx];
  if (!currentQuestion) return null;

  return (
    <div className="bg-surface text-on-surface font-body-md flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto flex flex-col min-w-0">
        <header className="bg-surface border-b-2 border-on-surface shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center w-full px-4 md:px-10 h-14 md:h-16 shrink-0 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/study')}
              className="p-2 hover:bg-secondary-fixed-dim/20 rounded-full transition-all duration-200 text-on-surface-variant flex items-center justify-center border-2 border-transparent hover:border-on-surface cursor-pointer"
            >
              <Icon name="close" className="w-6 h-6" />
            </button>
            <h1 className="font-headline-md text-headline-md font-extrabold text-primary tracking-tight">Challenge Mode</h1>
          </div>
        </header>

        <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-6 lg:p-8 w-full max-w-3xl mx-auto pb-24 md:pb-8">
          {/* Header & Progress */}
          <div className="w-full mb-6 shrink-0">
            <div className="flex justify-between items-end mb-3">
              <div>
                <span className="inline-block px-3 py-1 bg-secondary-container text-on-secondary-container font-label-sm text-label-sm rounded-full border-2 border-on-surface mb-2 font-black uppercase text-xs">
                  {currentQuestion.course_title || 'Kelas Pilihan'}
                </span>
                <h2 className="font-headline-lg text-2xl md:text-3xl font-black text-on-surface">Tantangan Harian</h2>
              </div>
              <div className="flex items-center gap-1 px-3 py-1 bg-white border-2 border-on-surface rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Icon name="local_fire_department" className="w-5 h-5 text-[#FFB800] fill-current" />
                <span className="font-black text-xs text-on-surface">{streak} Hari</span>
              </div>
            </div>
            {/* Progress Tracker */}
            <div className="w-full h-3 bg-surface-variant rounded-full overflow-hidden border-2 border-on-surface">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500" 
                style={{width: `${((currentQuestionIdx + 1) / questions.length) * 100}%`}}
              ></div>
            </div>
            <p className="text-right font-label-sm text-xs text-on-surface-variant mt-2 font-bold uppercase tracking-wider">
              Soal {currentQuestionIdx + 1} dari {questions.length}
            </p>
          </div>

          {/* Question Card */}
          <div className="w-full bg-surface-container-lowest border-2 border-on-surface rounded-xl p-6 md:p-8 mb-6 shadow-[4px_4px_0px_0px_rgba(28,27,27,1)] relative shrink-0">
            <div className="absolute -top-4 -right-2 bg-primary text-on-primary p-2 rounded-lg border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(28,27,27,1)] rotate-12">
              <Icon name="star" className="w-5 h-5 fill-current" />
            </div>
            <h3 className="font-headline-md text-lg md:text-xl font-black text-on-surface leading-relaxed">
              {currentQuestion.question}
            </h3>
            {currentQuestion.syllabus_title && (
              <p className="text-xs font-bold text-on-surface-variant/70 mt-2 uppercase tracking-wide">
                Berdasarkan Materi: {currentQuestion.syllabus_title}
              </p>
            )}
          </div>

          {/* Options Grid */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 shrink-0">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOption === option.id;
              const isCorrect = option.id === currentQuestion.correct_answer;
              
              let buttonBgClass = "bg-surface-container hover:bg-surface-variant/50";
              let numberBgClass = "bg-surface";

              if (isSubmitted) {
                if (isCorrect) {
                  // Correct answer gets green highlight
                  buttonBgClass = "bg-[#4ade80] border-2 border-on-surface text-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
                  numberBgClass = "bg-white text-on-surface";
                } else if (isSelected) {
                  // Wrong selected answer gets red highlight
                  buttonBgClass = "bg-[#f87171] border-2 border-on-surface text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
                  numberBgClass = "bg-white text-[#f87171]";
                } else {
                  buttonBgClass = "bg-surface-container opacity-50 cursor-not-allowed";
                }
              } else if (isSelected) {
                // Currently selected before submission
                buttonBgClass = "bg-primary-container translate-x-[-2px] translate-y-[-2px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] border-2 border-on-surface";
                numberBgClass = "bg-primary text-white";
              }

              return (
                <button 
                  key={option.id}
                  disabled={isSubmitted}
                  onClick={() => setSelectedOption(option.id)}
                  className={`w-full group text-on-surface border-2 border-on-surface rounded-xl p-4 flex items-center gap-4 transition-all ${
                    !isSubmitted ? "hover:translate-x-[-2px] hover:translate-y-[-2px] shadow-[4px_4px_0px_0px_rgba(28,27,27,1)] active:translate-x-0 active:translate-y-0 active:shadow-none cursor-pointer" : ""
                  } ${buttonBgClass}`}
                >
                  <span className={`w-10 h-10 shrink-0 rounded-lg border-2 border-on-surface flex items-center justify-center font-label-md text-label-md transition-colors font-black ${numberBgClass}`}>
                    {option.id}
                  </span>
                  <span className="font-body-lg text-body-md md:text-lg text-left font-extrabold">{option.label}</span>
                </button>
              );
            })}
          </div>

          {/* Explanation Box */}
          {isSubmitted && currentQuestion.explanation && (
            <div className="w-full bg-[#E5F3FF] border-2 border-on-surface rounded-xl p-5 mb-6 text-sm text-[#003B73] font-bold leading-relaxed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-in fade-in duration-200 shrink-0">
              <div className="flex items-center gap-2 mb-1 text-[#00529B]">
                <Icon name="info" className="w-5 h-5" />
                <span className="font-black uppercase tracking-wider text-xs">Penjelasan:</span>
              </div>
              {currentQuestion.explanation}
            </div>
          )}

          {/* Action Area */}
          <div className="w-full flex justify-end border-t-2 border-outline-variant pt-4 shrink-0">
            {!isSubmitted ? (
              <button 
                onClick={handleAnswerSubmit}
                disabled={!selectedOption}
                className={`bg-[#FFB800] text-on-background border-2 border-on-surface px-8 py-3 rounded-xl font-black text-sm flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0 active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed ${selectedOption ? 'cursor-pointer' : ''}`}
              >
                Kirim Jawaban
                <Icon name="done" className="w-5 h-5" />
              </button>
            ) : (
              <button 
                onClick={handleNextQuestion}
                className="bg-[#FF6B4A] text-white border-2 border-on-surface px-8 py-3 rounded-xl font-black text-sm flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0 active:translate-y-0 active:shadow-none cursor-pointer"
              >
                {currentQuestionIdx + 1 === questions.length ? 'Lihat Hasil' : 'Soal Selanjutnya'}
                <Icon name="arrow_forward" className="w-5 h-5" />
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DailyChallenge;
