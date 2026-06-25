import React, { useState } from "react";
import { Vocabulary, Student } from "../types";
import { Sparkles, Bookmark, BookmarkCheck, Play, HelpCircle, RefreshCw, Volume2, Search, ArrowLeft } from "lucide-react";
import confetti from "canvas-confetti";

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
  const [selectedLevel, setSelectedLevel] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Vocab Quiz state
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

  const levels = [
    { id: "All", en: "All Levels", ar: "جميع المستويات" },
    { id: "A1", en: "Level A1", ar: "المستوى A1" },
    { id: "A2", en: "Level A2", ar: "المستوى A2" },
    { id: "B1", en: "Level B1", ar: "المستوى B1" },
    { id: "B2", en: "Level B2", ar: "المستوى B2" },
    { id: "C1", en: "Level C1", ar: "المستوى C1" },
  ];

  const categories = [
    { id: "All", en: "All Vocabulary", ar: "كل المفردات" },
    { id: "daily", en: "Daily Words", ar: "كلمات يومية" },
    { id: "academic", en: "Academic Words", ar: "كلمات أكاديمية" },
    { id: "common", en: "Common Phrases", ar: "عبارات شائعة" },
    { id: "phrasal", en: "Phrasal Verbs", ar: "أفعال مركبة" },
  ];

  // Filters
  const filteredVocab = vocabulary.filter((v) => {
    // If student is logged in, show only vocabulary matching their selected level
    const levelMatch = student
      ? (v.level === student.level)
      : (selectedLevel === "All" || v.level === selectedLevel);

    const catMatch = selectedCategory === "All" || v.category === selectedCategory;
    const searchMatch = 
      v.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.translation.includes(searchQuery) ||
      (v.definition && v.definition.toLowerCase().includes(searchQuery.toLowerCase()));
    return levelMatch && catMatch && searchMatch;
  });

  const handleToggleSaveWord = (wordId: string) => {
    if (!student) {
      onOpenAuth();
      return;
    }

    const isSaved = student.savedWords.includes(wordId);
    let updatedSaved: string[];
    if (isSaved) {
      updatedSaved = student.savedWords.filter(id => id !== wordId);
    } else {
      updatedSaved = [...student.savedWords, wordId];
    }

    onUpdateStudent({
      ...student,
      savedWords: updatedSaved
    });
  };

  const handleSpeak = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Generate Vocabulary Quiz
  const startVocabQuiz = () => {
    const pool = filteredVocab.length >= 4 ? filteredVocab : vocabulary;
    if (pool.length < 4) {
      alert(
        isArabic 
          ? "يجب توفر 4 كلمات على الأقل لبدء الاختبار." 
          : "At least 4 words are required to generate a quiz."
      );
      return;
    }

    // Generate 5 random questions
    const shuffledPool = [...pool].sort(() => 0.5 - Math.random());
    const questionsCount = Math.min(5, shuffledPool.length);
    const questions = [];

    for (let i = 0; i < questionsCount; i++) {
      const correctWord = shuffledPool[i];
      // Generate options
      const incorrects = pool
        .filter(v => v.id !== correctWord.id)
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
        // Perfect score celebration!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      
      // Update points if logged in
      if (student) {
        const pointsGained = score * 5;
        onUpdateStudent({
          ...student,
          points: student.points + pointsGained
        });
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="vocab-view-container">
      {!quizActive ? (
        <div className="space-y-6">
          {/* Header & Quiz Trigger Banner */}
          <div className="bg-gradient-to-r from-teal-900 to-teal-800 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl shadow-teal-100">
            <div className="relative z-10 max-w-xl text-left rtl:text-right space-y-4">
              <span className="inline-block bg-teal-500/30 text-teal-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {isArabic ? "مفردات ومصطلحات يومية" : "Bilingual Vocabulary Bank"}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display leading-tight">
                {isArabic ? "بناء حصيلة لغوية قوية" : "Expand Your Vocabulary Instantly"}
              </h2>
              <p className="text-neutral-200 text-xs leading-relaxed">
                {isArabic
                  ? "تصفح مئات الكلمات والعبارات الشائعة والأفعال المركبة مع نطقها الصوتي الصحيح، واحفظها للمراجعة لاحقاً."
                  : "Browse real expressions, listen to natural pronunciation, save words to your dictionary, and practice interactive quizzes."}
              </p>

              <div className="pt-2">
                <button
                  onClick={startVocabQuiz}
                  className="flex items-center gap-2 bg-white text-teal-900 font-bold px-5 py-2.5 rounded-xl text-xs shadow-md hover:bg-neutral-50 transition-all transform active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{isArabic ? "بدء اختبار المفردات التفاعلي" : "Start Interactive Vocab Quiz"}</span>
                </button>
              </div>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10 rtl:left-0 rtl:right-auto">
              <Sparkles className="w-72 h-72 -mr-12 -mb-12" />
            </div>
          </div>

          {/* Level filter bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider mr-2 rtl:ml-2">
                {isArabic ? "المستوى الحالي:" : "Current Level:"}
              </span>
              
              {student ? (
                <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-700 font-extrabold px-4 py-1.5 rounded-full text-xs">
                  <span>{student.level}</span>
                </div>
              ) : (
                <>
                  {selectedLevel !== "All" ? (
                    <div className="flex items-center gap-2">
                      <span className="bg-teal-650 text-white font-extrabold px-4 py-1.5 rounded-full text-xs shadow-md shadow-teal-100">
                        {selectedLevel}
                      </span>
                      <button
                        onClick={() => setSelectedLevel("All")}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer"
                      >
                        {isArabic ? "إظهار باقي المستويات" : "Show All Levels"}
                      </button>
                    </div>
                  ) : (
                    levels.filter(l => l.id !== "All").map((lvl) => (
                      <button
                        key={lvl.id}
                        onClick={() => setSelectedLevel(lvl.id)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          selectedLevel === lvl.id
                            ? "bg-teal-650 text-white shadow-md shadow-teal-100"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {isArabic ? lvl.ar : lvl.en}
                      </button>
                    ))
                  )}
                </>
              )}
            </div>
          </div>

          {/* Filters & Search bar */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            {/* Category selection */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedCategory === cat.id
                      ? "bg-teal-50 text-teal-800 border border-teal-200"
                      : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                  }`}
                >
                  {isArabic ? cat.ar : cat.en}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isArabic ? "بحث في الكلمات والمعاني..." : "Search words, translations..."}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-slate-50"
              />
            </div>
          </div>

          {/* Vocabulary Cards Grid */}
          {filteredVocab.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVocab.map((v) => {
                const isSaved = student?.savedWords.includes(v.id);
                return (
                  <div
                    key={v.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-teal-300 transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-3.5">
                      {/* Top bar */}
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md uppercase font-mono">
                          {isArabic ? categories.find(c => c.id === v.category)?.ar : v.category}
                        </span>

                        <button
                          onClick={() => handleToggleSaveWord(v.id)}
                          className="text-slate-400 hover:text-teal-600 transition-colors p-1 rounded-lg"
                          title={isArabic ? "حفظ الكلمة" : "Save Word"}
                        >
                          {isSaved ? (
                            <BookmarkCheck className="w-4 h-4 text-teal-600" />
                          ) : (
                            <Bookmark className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Word & Pronunciation */}
                      <div className="space-y-1 text-left rtl:text-right">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-lg font-black font-display text-slate-800 group-hover:text-teal-700 transition-colors">
                            {v.word}
                          </h3>
                          <button
                            onClick={() => handleSpeak(v.word)}
                            className="p-1 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all shrink-0"
                            title={isArabic ? "استمع للنطق" : "Listen Pronunciation"}
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-sm font-bold text-teal-600">
                          {v.translation}
                        </p>
                      </div>

                      {/* Definitions */}
                      <div className="space-y-1.5 text-xs text-slate-600 leading-normal text-left rtl:text-right">
                        {v.definition && <p className="font-medium text-neutral-700">{v.definition}</p>}
                        {v.definitionAr && <p className="text-slate-400 italic">{v.definitionAr}</p>}
                      </div>
                    </div>

                    {/* Example sentence */}
                    {v.example && (
                      <div className="mt-4 pt-3.5 border-t border-slate-100 bg-slate-50 p-3 rounded-xl text-left rtl:text-right space-y-1">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                          Example:
                        </span>
                        <p className="text-xs italic text-neutral-700 leading-normal">
                          "{v.example}"
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white text-center py-12 rounded-2xl border border-slate-200">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">
                {isArabic
                  ? "لم يتم العثور على كلمات مطابقة لبحثك."
                  : "No vocabulary found matching your search."}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Vocab Quiz Mode */
        <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl animate-fade-in space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <button
              onClick={() => setQuizActive(false)}
              className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isArabic ? "خروج من الاختبار" : "Exit Quiz"}</span>
            </button>

            <span className="text-xs bg-teal-50 text-teal-700 font-bold px-3 py-1 rounded-full font-mono">
              Question {currentQuestionIndex + 1} / {quizQuestions.length}
            </span>
          </div>

          {!quizFinished ? (
            <div className="space-y-6">
              {/* Question card */}
              <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-2xl p-6 text-center border border-teal-100 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-teal-600 font-mono">
                  {isArabic ? "ما معنى هذه الكلمة؟" : "What is the meaning of?"}
                </span>
                <h3 className="text-2xl font-black font-display text-slate-900">
                  {quizQuestions[currentQuestionIndex]?.wordObj.word}
                </h3>
                {quizQuestions[currentQuestionIndex]?.wordObj.definition && (
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mt-2 italic">
                    "{quizQuestions[currentQuestionIndex]?.wordObj.definition}"
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
                      className={`w-full text-right rtl:text-right px-5 py-3 rounded-xl border text-xs transition-all flex justify-between items-center ${buttonStyle}`}
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
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md"
                >
                  {currentQuestionIndex + 1 < quizQuestions.length 
                    ? (isArabic ? "السؤال التالي" : "Next Question")
                    : (isArabic ? "عرض النتائج" : "Finish Quiz")}
                </button>
              )}
            </div>
          ) : (
            /* Quiz finished view */
            <div className="text-center space-y-6 py-6">
              <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                <HelpCircle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-800 font-display">
                  {isArabic ? "اكتمل الاختبار بنجاح!" : "Quiz Completed Successfully!"}
                </h3>
                <p className="text-xs text-slate-400">
                  {isArabic 
                    ? "لقد قمت باختبار مفرداتك الإنجليزية بامتياز." 
                    : "You have verified your English vocabulary knowledge successfully."}
                </p>
              </div>

              {/* Score Display */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 max-w-xs mx-auto">
                <span className="block text-3xl font-black font-display text-slate-800 mb-1">
                  {score} / {quizQuestions.length}
                </span>
                <p className="text-xs text-neutral-500">
                  {score === quizQuestions.length
                    ? (isArabic ? "أحسنت! إجابة كاملة صحيحة 🎉" : "Excellent work! Perfect score 🎉")
                    : (isArabic ? "مجهود رائع! واصل التعلم يومياً." : "Good attempt! Keep reviewing daily.")}
                </p>
                {student && (
                  <span className="inline-block mt-3 text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full">
                    +{score * 5} Pathway Points Added
                  </span>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={startVocabQuiz}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md"
                >
                  {isArabic ? "إعادة محاولة" : "Try Again"}
                </button>
                <button
                  onClick={() => setQuizActive(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition-all"
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
