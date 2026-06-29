import React, { useState, useMemo, useEffect } from "react";
import { Vocabulary, Student } from "../types";
import { 
  Sparkles, 
  Bookmark, 
  BookmarkCheck, 
  Play, 
  HelpCircle, 
  Volume2, 
  Search, 
  ArrowLeft, 
  Book, 
  ChevronRight, 
  Award, 
  CheckCircle, 
  Loader2, 
  Brain,
  AlertCircle
} from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "motion/react";
import { saveVocabulary } from "../lib/dbService";
import { SEED_VOCABULARY, VocabCategory, getCategoriesForLevel } from "../data/vocabularyData";

interface VocabularySectionProps {
  vocabulary: Vocabulary[];
  student: Student | null;
  onUpdateStudent: (updated: Student) => void;
  onOpenAuth: () => void;
  isArabic: boolean;
}

export default function VocabularySection({
  vocabulary,
  student,
  onUpdateStudent,
  onOpenAuth,
  isArabic,
}: VocabularySectionProps) {
  // Navigation & Filtering States
  const [activeLevel, setActiveLevel] = useState<string>("A1");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Synchronize with student level if logged in
  useEffect(() => {
    if (student?.level) {
      setActiveLevel(student.level);
    }
  }, [student?.level]);
  
  // Local cache for guest user's saved words and extra generated words
  const [guestSavedWords, setGuestSavedWords] = useState<string[]>(() => {
    const cached = localStorage.getItem("guest_saved_words");
    return cached ? JSON.parse(cached) : [];
  });
  
  const [localExtraWords, setLocalExtraWords] = useState<Vocabulary[]>(() => {
    const cached = localStorage.getItem("local_extra_words");
    return cached ? JSON.parse(cached) : [];
  });

  // AI Generation States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Quiz States
  const [quizActive, setQuizActive] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<Array<{
    wordObj: Vocabulary;
    options: string[];
    correctIndex: number;
  }>>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Synchronize guest favorites cache
  useEffect(() => {
    localStorage.setItem("guest_saved_words", JSON.stringify(guestSavedWords));
  }, [guestSavedWords]);

  // Synchronize extra generated words cache
  useEffect(() => {
    localStorage.setItem("local_extra_words", JSON.stringify(localExtraWords));
  }, [localExtraWords]);

  // Merge database vocabulary, seed vocabulary, and local generated extra words
  const allWords = useMemo(() => {
    // 1. Compile seed words with IDs
    const seedWithIds = SEED_VOCABULARY.map((w, index) => ({
      ...w,
      id: `seed-vocab-${index}`
    })) as Vocabulary[];

    // 2. Combine all sources
    const combined = [...vocabulary, ...seedWithIds, ...localExtraWords];

    // 3. Remove duplicates by lowercase word & level & category combination
    const uniqueMap = new Map<string, Vocabulary>();
    combined.forEach((item) => {
      const key = `${item.word.toLowerCase()}_${item.level}_${item.category}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    });

    return Array.from(uniqueMap.values());
  }, [vocabulary, localExtraWords]);

  // Category counts based on the compiled allWords list
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allWords.forEach((w) => {
      const catKey = w.category;
      counts[catKey] = (counts[catKey] || 0) + 1;
    });
    return counts;
  }, [allWords]);

  // Get current categories list based on level
  const currentCategoriesList = getCategoriesForLevel(activeLevel);

  // Filtered vocabulary list
  const filteredVocab = useMemo(() => {
    return allWords.filter((v) => {
      const levelMatch = v.level === activeLevel;
      const catMatch = !selectedCategory || v.category === selectedCategory;
      const searchMatch = !searchQuery ? true : (
        v.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.translation.includes(searchQuery) ||
        (v.example && v.example.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (v.partOfSpeech && v.partOfSpeech.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      return levelMatch && catMatch && searchMatch;
    });
  }, [allWords, activeLevel, selectedCategory, searchQuery]);

  // Handle TTS pronunciation speak
  const handleSpeak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // cancel current playing voice
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = (wordId: string) => {
    if (student) {
      const isSaved = student.savedWords.includes(wordId);
      const updatedSaved = isSaved
        ? student.savedWords.filter(id => id !== wordId)
        : [...student.savedWords, wordId];

      onUpdateStudent({
        ...student,
        savedWords: updatedSaved
      });
    } else {
      // Toggle local guest favorites
      setGuestSavedWords(prev => 
        prev.includes(wordId) 
          ? prev.filter(id => id !== wordId) 
          : [...prev, wordId]
      );
    }
  };

  const isWordSaved = (wordId: string) => {
    if (student) {
      return student.savedWords.includes(wordId);
    }
    return guestSavedWords.includes(wordId);
  };

  // Generate Vocabulary words with Gemini on-demand
  const handleGenerateAIWords = async () => {
    if (!selectedCategory) return;
    setIsGenerating(true);
    setGenerationError(null);
    setGenerationSuccess(false);

    const teacherId = student?.selectedTeacherId || "teacher-sarah";
    const existingWordsInCat = filteredVocab.length;

    try {
      const response = await fetch("/api/generate-vocab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCategory,
          level: activeLevel,
          existingWordsCount: existingWordsInCat
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate vocabulary words.");
      }

      const generatedList: Vocabulary[] = data.words.map((item: any, idx: number) => ({
        id: `ai-vocab-${Date.now()}-${idx}`,
        word: item.word,
        translation: item.translation,
        definition: item.definition || "",
        definitionAr: item.definitionAr || "",
        example: item.example,
        exampleAr: item.exampleAr || "",
        category: selectedCategory,
        level: activeLevel,
        partOfSpeech: item.partOfSpeech || "Noun",
        pronunciation: item.pronunciation || "",
        createdAt: new Date().toISOString()
      }));

      // 1. Save locally to immediate view state
      setLocalExtraWords(prev => [...prev, ...generatedList]);

      // 2. Save each to Firestore under active teacher's collection
      for (const item of generatedList) {
        await saveVocabulary(item, teacherId);
      }

      setGenerationSuccess(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });
      
      // Clear success badge after a few seconds
      setTimeout(() => setGenerationSuccess(false), 5000);
    } catch (err: any) {
      console.error("AI Generation Failed:", err);
      setGenerationError(err.message || "An error occurred while generating words.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate and Start Vocabulary Quiz
  const startVocabQuiz = () => {
    // Collect words matching current level and selected category (if any)
    const pool = filteredVocab.length >= 4 ? filteredVocab : allWords.filter(w => w.level === activeLevel);
    
    if (pool.length < 4) {
      alert(
        isArabic 
          ? "يجب توفر 4 كلمات على الأقل في هذا القسم لتوليد اختبار." 
          : "At least 4 words in this section are required to start a quiz."
      );
      return;
    }

    const shuffledPool = [...pool].sort(() => 0.5 - Math.random());
    const questionsCount = Math.min(5, shuffledPool.length);
    const questions = [];

    for (let i = 0; i < questionsCount; i++) {
      const correctWord = shuffledPool[i];
      // Generate incorrect options
      const incorrects = pool
        .filter(v => v.word !== correctWord.word)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      
      const options = [correctWord.translation, ...incorrects.map(v => v.translation)];
      // Shuffle options
      const shuffledOptions = [...options].sort(() => 0.5 - Math.random());
      const correctIndex = shuffledOptions.indexOf(correctWord.translation);

      questions.push({
        wordObj: correctWord,
        options: shuffledOptions,
        correctIndex,
      });
    }

    setQuizQuestions(questions);
    setCurrentQuestionIndex(0);
    setSelectedOptionIndex(null);
    setScore(0);
    setQuizFinished(false);
    setQuizActive(true);
  };

  const handleSelectQuizOption = (oIdx: number) => {
    if (selectedOptionIndex !== null) return;
    setSelectedOptionIndex(oIdx);
    
    const correct = oIdx === quizQuestions[currentQuestionIndex].correctIndex;
    if (correct) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOptionIndex(null);
    if (currentQuestionIndex + 1 < quizQuestions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setQuizFinished(true);
      if (score + (selectedOptionIndex === quizQuestions[currentQuestionIndex].correctIndex ? 1 : 0) === quizQuestions.length) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
      
      if (student) {
        const pointsGained = score * 5;
        onUpdateStudent({
          ...student,
          points: student.points + pointsGained
        });
      }
    }
  };

  // Beautiful Cover gradient helper
  const getCoverGradient = (catId: string) => {
    const gradients = [
      "from-indigo-600 to-indigo-850",
      "from-teal-600 to-teal-850",
      "from-emerald-600 to-emerald-850",
      "from-rose-600 to-rose-850",
      "from-amber-600 to-amber-850",
      "from-purple-600 to-purple-850",
      "from-cyan-600 to-cyan-850",
      "from-blue-600 to-blue-850"
    ];
    // Deterministic hash based on category id
    let hash = 0;
    for (let i = 0; i < catId.length; i++) {
      hash = catId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-800" id="vocab-view-container">
      {!quizActive ? (
        <div className="space-y-6">
          {/* Header & Stats Banner */}
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl border border-indigo-500/10">
            <div className="relative z-10 max-w-2xl text-left rtl:text-right space-y-4">
              <span className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-400/20 text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
                {isArabic ? "مكتبة المفردات الشاملة" : "Comprehensive Vocabulary Library"}
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-display leading-tight tracking-tight">
                {isArabic ? "مفردات مستويات A1 & A2 اللغوية" : "CEFR Levels A1 & A2 Vocabulary"}
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
                {isArabic
                  ? "مكتبة تفاعلية شاملة مخصصة لطلاب مستويي A1 و A2. تصفح الفئات والمواضيع التعليمية، استمع إلى النطق الصحيح، أضف الكلمات لمفضلتك، وقم بتوليد كلمات إضافية لا حصر لها بذكاء اصطناعي فائق."
                  : "Explore curated lists of essential words for A1 & A2 levels. Listen to native speech guides, favorite words to build your custom dictionary, and generate endless premium vocab words on-demand using AI."}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-bold text-slate-300">
                <div className="bg-slate-800/60 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700/50 flex items-center gap-1.5 shadow-sm">
                  <Book className="w-4 h-4 text-teal-400" />
                  <span>
                    {isArabic ? `إجمالي الكلمات المتوفرة: ${allWords.length}` : `Available Words: ${allWords.length}`}
                  </span>
                </div>
                <div className="bg-slate-800/60 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700/50 flex items-center gap-1.5 shadow-sm">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>
                    {isArabic ? "المجموع الكلي المتاح: +3000 كلمة" : "Covering over 3,000+ words"}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={startVocabQuiz}
                  className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-extrabold px-6 py-3 rounded-xl text-xs shadow-lg shadow-teal-900/40 transition-all transform active:scale-95 cursor-pointer"
                >
                  <Brain className="w-4 h-4 animate-bounce" />
                  <span>{isArabic ? "بدء اختبار مفاجئ" : "Start Pop Quiz"}</span>
                </button>
              </div>
            </div>
            
            {/* Background design accents */}
            <div className="absolute right-0 bottom-0 opacity-15 rtl:left-0 rtl:right-auto pointer-events-none">
              <Book className="w-72 h-72 -mr-12 -mb-12 text-teal-500" />
            </div>
          </div>

          {/* Level Filter Switcher */}
          {!student && (
            <div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-200/60 shadow-xs flex gap-2">
              <button
                onClick={() => {
                  setActiveLevel("A1");
                  setSelectedCategory(null);
                }}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeLevel === "A1"
                    ? "bg-white text-indigo-700 shadow-sm border border-indigo-100/50"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${activeLevel === "A1" ? "bg-indigo-600 animate-pulse" : "bg-slate-400"}`} />
                <span>{isArabic ? "مستوى A1 (مبتدئ)" : "Level A1 (Beginner)"}</span>
              </button>

              <button
                onClick={() => {
                  setActiveLevel("A2");
                  setSelectedCategory(null);
                }}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeLevel === "A2"
                    ? "bg-white text-indigo-700 shadow-sm border border-indigo-100/50"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${activeLevel === "A2" ? "bg-indigo-600 animate-pulse" : "bg-slate-400"}`} />
                <span>{isArabic ? "مستوى A2 (دون المتوسط)" : "Level A2 (Elementary)"}</span>
              </button>
            </div>
          )}

          {/* Dynamic Interactive Panel */}
          <AnimatePresence mode="wait">
            {!selectedCategory ? (
              // ================= BOOKSHELF VIEW =================
              <motion.div
                key="bookshelf"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b border-slate-150 pb-3">
                  <div className="space-y-1 text-left rtl:text-right">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                      {isArabic ? "رف كتب المفردات" : "Vocabulary Bookshelf"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isArabic 
                        ? `اختر أحد الكتب الملونة لاستعراض ودراسة كلماته (${currentCategoriesList.length} مواضيع لغوية متكاملة)` 
                        : `Tap on a book cover to browse and study its vocabulary list (${currentCategoriesList.length} total topics)`}
                    </p>
                  </div>
                  
                  {/* Quick Search across everything */}
                  <div className="relative w-full sm:w-64 shrink-0">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={isArabic ? "بحث في القاموس..." : "Quick search dictionary..."}
                      className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold shadow-xs"
                    />
                  </div>
                </div>

                {/* Books list grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {currentCategoriesList
                    .filter(cat => {
                      if (!searchQuery) return true;
                      // Show books containing searched words, or books matching the category name
                      const countInCat = allWords.filter(w => w.level === activeLevel && w.category === cat.id && (
                        w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        w.translation.includes(searchQuery)
                      )).length;
                      return countInCat > 0 || cat.en.toLowerCase().includes(searchQuery.toLowerCase()) || cat.ar.includes(searchQuery);
                    })
                    .map((cat) => {
                      const count = categoryCounts[cat.id] || 0;
                      return (
                        <motion.button
                          whileHover={{ scale: 1.025, y: -4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedCategory(cat.id)}
                          key={cat.id}
                          className="group relative flex flex-col justify-between p-4 bg-white border border-slate-200 rounded-2xl text-left rtl:text-right shadow-sm hover:shadow-md cursor-pointer transition-all overflow-hidden h-44"
                        >
                          {/* Aesthetic Book Spine Accent */}
                          <div className={`absolute top-0 bottom-0 left-0 w-2.5 bg-gradient-to-b ${getCoverGradient(cat.id)} rounded-l-2xl`} />
                          
                          <div className="pl-2 space-y-2">
                            <span className="text-[10px] font-black text-slate-400 font-mono tracking-widest uppercase block">
                              {activeLevel} • BOOK
                            </span>
                            <h4 className="font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors text-sm sm:text-base leading-snug">
                              {cat.en}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium">
                              {cat.ar}
                            </p>
                          </div>

                          {/* Words Counter Badge inside Book */}
                          <div className="pl-2 pt-2 border-t border-slate-100 flex justify-between items-center w-full">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                              count > 0 ? "bg-indigo-50 text-indigo-700 border border-indigo-100/30" : "bg-amber-50 text-amber-700 border border-amber-100/30"
                            }`}>
                              {count > 0 ? `${count} ${isArabic ? "كلمة" : "Words"}` : (isArabic ? "جديد / AI" : "AI Ready")}
                            </span>
                            
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transform group-hover:translate-x-1 transition-all" />
                          </div>
                        </motion.button>
                      );
                    })}
                </div>
              </motion.div>
            ) : (
              // ================= CATEGORY DETAIL VIEW =================
              <motion.div
                key="category-words"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Book header */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-slate-50 border border-slate-200 rounded-3xl p-5 shadow-xs">
                  <div className="flex items-center gap-4 text-left rtl:text-right">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="p-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-500 hover:text-slate-900 transition-all cursor-pointer shadow-xs"
                      title={isArabic ? "الرجوع للرف" : "Back to Shelf"}
                    >
                      <ArrowLeft className="w-4 h-4 transform rtl:rotate-180" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black tracking-widest uppercase bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md font-mono">
                          {activeLevel}
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          {isArabic ? "مفردات كتاب:" : "Book:"}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                        {currentCategoriesList.find(c => c.id === selectedCategory)?.en} - {currentCategoriesList.find(c => c.id === selectedCategory)?.ar}
                      </h3>
                    </div>
                  </div>

                  {/* Right hand search and quiz */}
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={isArabic ? "تصفية الكلمات..." : "Filter words..."}
                      className="w-full sm:w-48 text-xs p-2.5 border border-slate-200 bg-white rounded-xl outline-none"
                    />
                    <button
                      onClick={startVocabQuiz}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs shadow-md shadow-indigo-100 cursor-pointer"
                    >
                      <Brain className="w-3.5 h-3.5" />
                      <span>{isArabic ? "بدء اختبار الفئة" : "Practice Category"}</span>
                    </button>
                  </div>
                </div>

                {/* AI vocabulary extension builder */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/80 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1 text-left rtl:text-right">
                    <span className="inline-flex items-center gap-1 bg-amber-100/80 border border-amber-200 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      {isArabic ? "موسع المفردات بالذكاء الاصطناعي" : "AI Vocab Expander"}
                    </span>
                    <h4 className="text-sm font-black text-slate-800">
                      {isArabic ? "هل تحتاج إلى المزيد من الكلمات في هذه الفئة؟" : "Want to learn even more words in this topic?"}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      {isArabic 
                        ? "اضغط لتوليد قائمة من 15 كلمة ومصطلح لغوي جديد ومكمل مع النطق والأمثلة المترجمة باستخدام الذكاء الاصطناعي." 
                        : "Click to dynamically generate 15 fresh, high-quality, complementary CEFR vocabulary words with audio, details, and translations."}
                    </p>
                  </div>

                  <div className="w-full md:w-auto shrink-0 space-y-2">
                    <button
                      disabled={isGenerating}
                      onClick={handleGenerateAIWords}
                      className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black px-5 py-3 rounded-xl text-xs shadow-md shadow-amber-200 border border-amber-600/10 cursor-pointer transition-all disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{isArabic ? "جاري التوليد بالذكاء الاصطناعي..." : "Generating words..."}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-white" />
                          <span>{isArabic ? "توليد 15 كلمة إضافية" : "Generate 15 More Words"}</span>
                        </>
                      )}
                    </button>

                    {generationSuccess && (
                      <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 justify-center md:justify-end animate-fade-in">
                        <CheckCircle className="w-3 h-3" />
                        <span>{isArabic ? "تم حفظ وإضافة الكلمات بنجاح!" : "Words generated and added!"}</span>
                      </div>
                    )}
                  </div>
                </div>

                {generationError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs flex items-center gap-2 animate-fade-in font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{generationError}</span>
                  </div>
                )}

                {/* Words Grid list */}
                {filteredVocab.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVocab.map((v) => {
                      const isSaved = isWordSaved(v.id);
                      return (
                        <div
                          key={v.id}
                          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between group relative"
                        >
                          <div className="space-y-4">
                            {/* Word Card Top bar */}
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black bg-indigo-50 border border-indigo-100/30 text-indigo-700 px-2.5 py-0.5 rounded-full uppercase font-mono tracking-widest">
                                {v.partOfSpeech || "Noun"}
                              </span>

                              <button
                                onClick={() => handleToggleFavorite(v.id)}
                                className="text-slate-400 hover:text-indigo-600 transition-colors p-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100"
                                title={isArabic ? "حفظ للمفضلة" : "Save to Favorites"}
                              >
                                {isSaved ? (
                                  <BookmarkCheck className="w-4 h-4 text-emerald-600 fill-current" />
                                ) : (
                                  <Bookmark className="w-4 h-4" />
                                )}
                              </button>
                            </div>

                            {/* Main Word Body */}
                            <div className="space-y-1.5 text-left rtl:text-right">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg font-black font-display text-slate-800 group-hover:text-indigo-700 transition-colors">
                                  {v.word}
                                </h3>
                                
                                {v.pronunciation && (
                                  <span className="text-slate-400 text-xs font-mono font-bold">
                                    {v.pronunciation}
                                  </span>
                                )}

                                <button
                                  onClick={() => handleSpeak(v.word)}
                                  className="p-1.5 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100/35 transition-all shrink-0 cursor-pointer"
                                  title={isArabic ? "استمع للنطق" : "Listen Pronunciation"}
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              
                              <p className="text-sm font-extrabold text-indigo-600 font-sans">
                                {v.translation}
                              </p>
                            </div>

                            {/* Word definition (if available) */}
                            {(v.definition || v.definitionAr) && (
                              <div className="space-y-1 text-xs text-slate-500 leading-relaxed text-left rtl:text-right border-l-2 border-slate-100 pl-2.5">
                                {v.definition && <p className="font-semibold text-neutral-600">{v.definition}</p>}
                                {v.definitionAr && <p className="text-slate-400 font-medium italic">{v.definitionAr}</p>}
                              </div>
                            )}
                          </div>

                          {/* Example sentence block */}
                          {v.example && (
                            <div className="mt-4 pt-3.5 border-t border-slate-100 bg-slate-50/70 p-3.5 rounded-xl text-left rtl:text-right space-y-1.5">
                              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                                Example Sentence:
                              </span>
                              <p className="text-xs font-bold text-slate-700 leading-relaxed font-sans">
                                "{v.example}"
                              </p>
                              {v.exampleAr && (
                                <p className="text-[11px] text-slate-500 font-medium">
                                  {v.exampleAr}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white text-center py-12 rounded-2xl border border-slate-200">
                    <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm font-bold">
                      {isArabic
                        ? "المكتبة لا تحتوي على كلمات كافية لهذه الفئة بعد. اضغط على الزر بالأعلى لتوليد كلمات بالذكاء الاصطناعي!"
                        : "No words in this bookshelf yet. Click the button above to seed words using AI!"}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* ================= VOCAB QUIZ MODE ================= */
        <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl animate-fade-in space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-150">
            <button
              onClick={() => setQuizActive(false)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors font-extrabold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isArabic ? "خروج من الاختبار" : "Exit Quiz"}</span>
            </button>

            <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full font-mono border border-indigo-100/30">
              Question {currentQuestionIndex + 1} / {quizQuestions.length}
            </span>
          </div>

          {!quizFinished ? (
            <div className="space-y-6">
              {/* Question card */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/30 rounded-2xl p-6 text-center border border-indigo-100 space-y-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-indigo-600 font-mono">
                  {isArabic ? "ما معنى هذه الكلمة؟" : "What is the meaning of?"}
                </span>
                <h3 className="text-2xl font-black font-display text-slate-900 flex items-center justify-center gap-2">
                  <span>{quizQuestions[currentQuestionIndex]?.wordObj.word}</span>
                  <button
                    onClick={() => handleSpeak(quizQuestions[currentQuestionIndex]?.wordObj.word)}
                    className="p-1 rounded-full hover:bg-white text-slate-400 hover:text-indigo-600 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </h3>
                {quizQuestions[currentQuestionIndex]?.wordObj.pronunciation && (
                  <p className="text-xs text-slate-400 font-mono">
                    {quizQuestions[currentQuestionIndex]?.wordObj.pronunciation}
                  </p>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3">
                {quizQuestions[currentQuestionIndex]?.options.map((option, oIdx) => {
                  const isSelected = selectedOptionIndex === oIdx;
                  const isCorrect = oIdx === quizQuestions[currentQuestionIndex].correctIndex;
                  const isIncorrectAndSelected = isSelected && !isCorrect;

                  let buttonStyle = "bg-white hover:bg-slate-50 border-slate-200 text-slate-700";
                  if (selectedOptionIndex !== null) {
                    if (isCorrect) {
                      buttonStyle = "bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold";
                    } else if (isIncorrectAndSelected) {
                      buttonStyle = "bg-red-50 border-red-300 text-red-800";
                    } else {
                      buttonStyle = "bg-slate-50 border-slate-200 opacity-60 text-slate-400";
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      disabled={selectedOptionIndex !== null}
                      onClick={() => handleSelectQuizOption(oIdx)}
                      className={`w-full text-right rtl:text-right px-5 py-3.5 rounded-xl border text-xs font-bold transition-all flex justify-between items-center cursor-pointer ${buttonStyle}`}
                    >
                      <span>{option}</span>
                      {selectedOptionIndex !== null && isCorrect && (
                        <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded">
                          {isArabic ? "إجابة صحيحة" : "Correct"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Action */}
              {selectedOptionIndex !== null && (
                <button
                  onClick={handleNextQuestion}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-xl text-xs transition-all shadow-md shadow-indigo-100 cursor-pointer"
                >
                  {currentQuestionIndex + 1 < quizQuestions.length 
                    ? (isArabic ? "السؤال التالي" : "Next Question")
                    : (isArabic ? "عرض النتائج" : "Finish Quiz")}
                </button>
              )}
            </div>
          ) : (
            /* Quiz finished view */
            <div className="text-center space-y-6 py-6 animate-fade-in">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-md border border-indigo-100">
                <HelpCircle className="w-8 h-8 animate-bounce" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800 font-display">
                  {isArabic ? "اكتمل الاختبار بنجاح!" : "Quiz Completed Successfully!"}
                </h3>
                <p className="text-xs text-slate-400 font-semibold">
                  {isArabic 
                    ? "لقد قمت باختبار مفرداتك الإنجليزية بنجاح." 
                    : "You have verified your English vocabulary knowledge successfully."}
                </p>
              </div>

              {/* Score Display */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 max-w-xs mx-auto shadow-xs">
                <span className="block text-3xl font-black font-display text-slate-800 mb-1">
                  {score} / {quizQuestions.length}
                </span>
                <p className="text-xs text-slate-500 font-bold leading-normal">
                  {score === quizQuestions.length
                    ? (isArabic ? "أحسنت! إجابة كاملة صحيحة 🎉" : "Excellent work! Perfect score 🎉")
                    : (isArabic ? "مجهود رائع! واصل التعلم يومياً." : "Good attempt! Keep reviewing daily.")}
                </p>
                {student && (
                  <span className="inline-block mt-3 text-[10px] bg-indigo-50 border border-indigo-150 text-indigo-700 font-black px-2.5 py-0.5 rounded-full">
                    +{score * 5} Pathway Points Added
                  </span>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={startVocabQuiz}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
                >
                  {isArabic ? "إعادة محاولة" : "Try Again"}
                </button>
                <button
                  onClick={() => setQuizActive(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold py-3.5 rounded-xl text-xs transition-all cursor-pointer"
                >
                  {isArabic ? "خروج لقائمة المفردات" : "Back to Vocab"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
