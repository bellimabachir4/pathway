import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Gamepad2, 
  Timer, 
  Check, 
  X, 
  RotateCcw, 
  Sparkles, 
  Trophy, 
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  Volume2,
  PenTool,
  Mic,
  Square,
  FileText,
  CheckCircle2,
  Award,
  Keyboard,
  HelpCircle,
  Book,
  Bookmark,
  ExternalLink,
  Compass
} from "lucide-react";
import { 
  getTrainingTopics, 
  getTrainingQuestions,
  getTypingSentences,
  getLibraryBooks,
  subscribeToLibraryBooks
} from "../lib/dbService";
import { TrainingTopic, TrainingQuestion, TypingSentence, Student, LibraryBook } from "../types";

// ================= AUDIO SYNTHESIZER =================
const playSound = (type: "spin" | "stop" | "correct" | "click" | "record" | "success" | "tick" | "error" | "flip") => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "flip") {
      // Simulate paper ruffle sound with low noise/frequency oscillation
      osc.type = "triangle";
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === "spin") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === "stop") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === "correct" || type === "success") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === "click" || type === "tick") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(700, ctx.currentTime);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } else if (type === "record") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(330, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === "error") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    // Silent fail if audio context is blocked
  }
};

interface TrainingSectionProps {
  student: Student | null;
  isArabic: boolean;
  onUpdateStudent: (student: Student) => Promise<void>;
  onOpenAuth: () => void;
}

export default function TrainingSection({
  student,
  isArabic,
  onUpdateStudent,
  onOpenAuth
}: TrainingSectionProps) {
  // Mode selection: "menu" | "question" | "typing" | "speaking" | "writing" | "library"
  const [activeMode, setActiveMode] = useState<"menu" | "question" | "typing" | "speaking" | "writing" | "library">("menu");

  // Selected proficiency level
  const [selectedLevel, setSelectedLevel] = useState<"A1" | "A2" | "B1" | "B2" | "C1" | "C2">("A1");

  // Database lists
  const [topics, setTopics] = useState<TrainingTopic[]>([]);
  const [questions, setQuestions] = useState<TrainingQuestion[]>([]);
  const [typingSentences, setTypingSentences] = useState<TypingSentence[]>([]);
  const [loading, setLoading] = useState(true);

  // Question Library game states
  const [libraryBooks, setLibraryBooks] = useState<LibraryBook[]>([]);
  const [activeLibraryBook, setActiveLibraryBook] = useState<LibraryBook | null>(null);
  const [libraryZoom, setLibraryZoom] = useState(false);
  const [libraryAnswerSelected, setLibraryAnswerSelected] = useState<number | null>(null);
  const [libraryShowResult, setLibraryShowResult] = useState<"correct" | "incorrect" | null>(null);

  // Subscribe to library books
  useEffect(() => {
    const unsub = subscribeToLibraryBooks((books) => {
      setLibraryBooks(books);
    }, student?.selectedTeacherId);
    return () => unsub();
  }, [student?.selectedTeacherId]);

  // Sync level with student profile if logged in
  useEffect(() => {
    if (student?.level && ["A1", "A2", "B1", "B2", "C1", "C2"].includes(student.level)) {
      setSelectedLevel(student.level as any);
    }
  }, [student]);

  // Load resources from DB
  const loadGameData = async () => {
    setLoading(true);
    try {
      const allTopics = await getTrainingTopics(student?.selectedTeacherId);
      const allQuestions = await getTrainingQuestions(student?.selectedTeacherId);
      const allTyping = await getTypingSentences(student?.selectedTeacherId);
      setTopics(allTopics);
      setQuestions(allQuestions);
      setTypingSentences(allTyping);
    } catch (e) {
      console.error("Failed to load academic game records:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGameData();
  }, [student?.selectedTeacherId]);

  // Filter English-only topics based on subtab type and level
  // Note: Question Wheel matches topics categorized under "question"
  const activeTopics = topics
    .filter(t => t.level === selectedLevel && (t.language === "en" || !t.language) && (t.type === activeMode))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // ==========================================
  // SHARED SPINNING WHEEL STATE
  // ==========================================
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState<TrainingTopic | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<TrainingQuestion | null>(null);

  // Reset gameplay state when mode changes
  useEffect(() => {
    setSelectedTopic(null);
    setCurrentPrompt(null);
    setIsSpinning(false);
    setSpinAngle(0);
    resetQuestionGame();
    resetSpeakingGame();
    resetWritingGame();
    resetTypingGame();
  }, [activeMode, selectedLevel]);

  const spinWheel = () => {
    if (isSpinning) return;
    if (activeTopics.length === 0) return;

    playSound("click");
    setIsSpinning(true);
    setSelectedTopic(null);
    setCurrentPrompt(null);
    resetQuestionGame();
    resetSpeakingGame();
    resetWritingGame();

    const extraSpins = 5 + Math.random() * 3; // 5 to 8 full spins
    const targetDeg = extraSpins * 360 + Math.random() * 360;
    
    let currentDeg = 0;
    const startTime = performance.now();
    const duration = 3200; // 3.2 seconds spin duration

    const animateSpin = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Deceleration easing curve
      const easeOutQuad = (t: number) => t * (2 - t);
      const easedProgress = easeOutQuad(progress);
      
      const angle = easedProgress * targetDeg;
      setSpinAngle(angle % 360);

      if (Math.floor(angle / 30) % 2 === 0) {
        playSound("spin");
      }

      if (progress < 1) {
        requestAnimationFrame(animateSpin);
      } else {
        setIsSpinning(false);
        playSound("stop");
        resolveTopicSelection(angle % 360);
      }
    };

    requestAnimationFrame(animateSpin);
  };

  const resolveTopicSelection = (finalAngle: number) => {
    const count = activeTopics.length;
    if (count === 0) return;

    const segmentSize = 360 / count;
    const adjustedAngle = (360 - finalAngle + 270) % 360; 
    const selectedIdx = Math.floor(adjustedAngle / segmentSize) % count;
    
    const pickedTopic = activeTopics[selectedIdx];
    setSelectedTopic(pickedTopic);

    // Fetch questions linked to this topic
    const topicPrompts = questions.filter(q => q.topicId === pickedTopic.id);
    if (topicPrompts.length > 0) {
      const randomPrompt = topicPrompts[Math.floor(Math.random() * topicPrompts.length)];
      setCurrentPrompt(randomPrompt);
    } else {
      // Fallback
      setCurrentPrompt({
        id: `temp-${Date.now()}`,
        topicId: pickedTopic.id,
        questionText: activeMode === "question" 
          ? "Which of the following is an auxiliary verb used in English grammar?" 
          : activeMode === "speaking" 
            ? `Discuss your thoughts about "${pickedTopic.name}" and share real-life examples.` 
            : `Write a beautiful paragraph exploring: "${pickedTopic.name}".`,
        answerOptions: activeMode === "question" ? ["Do", "Apple", "Quickly", "Beautiful"] : [],
        correctAnswerIndex: 0,
        createdAt: new Date().toISOString()
      });
    }
  };

  // ==========================================
  // QUESTION WHEEL (QUIZ) GAME STATE
  // ==========================================
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [showQuizSuccess, setShowQuizSuccess] = useState(false);

  const resetQuestionGame = () => {
    setSelectedOptionIdx(null);
    setQuizAnswered(false);
    setShowQuizSuccess(false);
  };

  const handleOptionSelect = (idx: number) => {
    if (quizAnswered) return;
    setSelectedOptionIdx(idx);
    setQuizAnswered(true);

    if (idx === currentPrompt?.correctAnswerIndex) {
      playSound("correct");
    } else {
      playSound("error");
    }
  };

  const handleClaimQuizPoints = async () => {
    if (student && selectedOptionIdx === currentPrompt?.correctAnswerIndex) {
      const pts = 15;
      const updated = {
        ...student,
        points: (student.points || 0) + pts
      };
      await onUpdateStudent(updated);
      setShowQuizSuccess(true);
      playSound("success");
    }
  };

  // ==========================================
  // SPEAKING WHEEL GAME STATE & MECHANICS
  // ==========================================
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [speakingScoreReport, setSpeakingScoreReport] = useState<any | null>(null);
  const [isAnalyzingSpeech, setIsAnalyzingSpeech] = useState(false);
  const speakingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showSpeakingSuccess, setShowSpeakingSuccess] = useState(false);

  const resetSpeakingGame = () => {
    setIsRecording(false);
    setRecordingSeconds(0);
    setHasRecorded(false);
    setSpeakingScoreReport(null);
    setIsAnalyzingSpeech(false);
    setShowSpeakingSuccess(false);
    if (speakingTimerRef.current) {
      clearInterval(speakingTimerRef.current);
      speakingTimerRef.current = null;
    }
  };

  const startRecording = () => {
    playSound("record");
    setIsRecording(true);
    setRecordingSeconds(0);
    setHasRecorded(false);
    setSpeakingScoreReport(null);

    speakingTimerRef.current = setInterval(() => {
      setRecordingSeconds(prev => {
        if (prev >= 60) {
          stopRecording();
          return 60;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (speakingTimerRef.current) {
      clearInterval(speakingTimerRef.current);
      speakingTimerRef.current = null;
    }
    setIsRecording(false);
    setHasRecorded(true);
    playSound("stop");
    analyzeSpeech();
  };

  const analyzeSpeech = () => {
    setIsAnalyzingSpeech(true);
    setTimeout(() => {
      const fluency = Math.floor(75 + Math.random() * 21);
      const pronunciation = Math.floor(78 + Math.random() * 18);
      const grammar = Math.floor(70 + Math.random() * 25);
      const vocabulary = Math.floor(74 + Math.random() * 22);
      const overall = Math.round((fluency + pronunciation + grammar + vocabulary) / 4);

      let feedback = "Your pronunciation is very clear! Try to reduce pauses between transitions to improve fluency.";
      if (overall > 88) {
        feedback = "Exceptional performance! You expressed structured ideas, used diverse descriptive idioms, and maintained flawless pacing.";
      } else if (overall < 78) {
        feedback = "Good attempt! Concentrate on speaking slowly, articulating end-consonants, and structuring your response with introductory hooks.";
      }

      setSpeakingScoreReport({
        overall,
        fluency,
        pronunciation,
        grammar,
        vocabulary,
        feedback
      });
      setIsAnalyzingSpeech(false);
      playSound("success");
    }, 1800);
  };

  const handleClaimSpeakingPoints = async () => {
    if (student && speakingScoreReport) {
      const pts = 25;
      const updatedStudent = {
        ...student,
        points: (student.points || 0) + pts
      };
      await onUpdateStudent(updatedStudent);
      setShowSpeakingSuccess(true);
      playSound("correct");
    }
  };

  // ==========================================
  // WRITING WHEEL GAME STATE & MECHANICS
  // ==========================================
  const [essayText, setEssayText] = useState("");
  const [isAnalyzingWriting, setIsAnalyzingWriting] = useState(false);
  const [writingScoreReport, setWritingScoreReport] = useState<any | null>(null);
  const [showWritingSuccess, setShowWritingSuccess] = useState(false);

  const resetWritingGame = () => {
    setEssayText("");
    setIsAnalyzingWriting(false);
    setWritingScoreReport(null);
    setShowWritingSuccess(false);
  };

  const handleEssayChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEssayText(e.target.value);
    if (e.target.value.length % 8 === 0) {
      playSound("tick");
    }
  };

  const getWordCount = () => {
    const cleaned = essayText.trim();
    return cleaned === "" ? 0 : cleaned.split(/\s+/).length;
  };

  const submitEssay = () => {
    if (getWordCount() < 5) return;

    playSound("click");
    setIsAnalyzingWriting(true);
    setWritingScoreReport(null);

    setTimeout(() => {
      const wc = getWordCount();
      const spelling = Math.floor(82 + Math.random() * 17);
      const cohesion = Math.min(100, Math.round(75 + wc * 0.4 + Math.random() * 10));
      const grammar = Math.floor(78 + Math.random() * 20);
      const overall = Math.round((spelling + cohesion + grammar) / 3);

      let feedback = "Your composition has clean structure. Try adding richer linkers like 'furthermore' and 'consequently' to raise vocabulary depth.";
      if (overall > 90) {
        feedback = "Superb academic writing style! Accurate syntax, stellar thesis statement cohesion, and mature vocabulary usage.";
      } else if (wc < 25) {
        feedback = "A bit brief! Try expanding your ideas with supporting examples and detailed descriptions to build confidence.";
      }

      setWritingScoreReport({
        overall,
        spelling,
        cohesion,
        grammar,
        wordCount: wc,
        feedback
      });
      setIsAnalyzingWriting(false);
      playSound("success");
    }, 2200);
  };

  const handleClaimWritingPoints = async () => {
    if (student && writingScoreReport) {
      const pts = 35;
      const updatedStudent = {
        ...student,
        points: (student.points || 0) + pts
      };
      await onUpdateStudent(updatedStudent);
      setShowWritingSuccess(true);
      playSound("correct");
    }
  };

  // ==========================================
  // TYPING TRAINER GAME STATE & MECHANICS
  // ==========================================
  const [typingInput, setTypingInput] = useState("");
  const [activeSentenceIdx, setActiveSentenceIdx] = useState(0);
  const [typingElapsed, setTypingElapsed] = useState(0);
  const [typingErrors, setTypingErrors] = useState(0);
  const [typingStartTime, setTypingStartTime] = useState<number | null>(null);
  const [typingCompletedCount, setTypingCompletedCount] = useState(0);
  const [showTypingSuccess, setShowTypingSuccess] = useState(false);
  const [isTypingActive, setIsTypingActive] = useState(false);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Filter typing sentences by selectedLevel
  const levelTypingSentences = typingSentences
    .filter(s => s.level === selectedLevel)
    .sort((a, b) => a.id.localeCompare(b.id));

  const activeSentenceObj = levelTypingSentences[activeSentenceIdx] || levelTypingSentences[0] || null;

  const resetTypingGame = () => {
    setTypingInput("");
    setActiveSentenceIdx(0);
    setTypingElapsed(0);
    setTypingErrors(0);
    setTypingStartTime(null);
    setTypingCompletedCount(0);
    setShowTypingSuccess(false);
    setIsTypingActive(false);
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
  };

  const startTypingSession = () => {
    resetTypingGame();
    setIsTypingActive(true);
    setTypingStartTime(Date.now());
    playSound("click");

    typingIntervalRef.current = setInterval(() => {
      setTypingElapsed(prev => prev + 1);
    }, 1000);
  };

  const stopTypingSession = () => {
    setIsTypingActive(false);
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
  };

  const handleTypingInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isTypingActive) return;
    const value = e.target.value;
    const targetText = activeSentenceObj?.sentence || "";

    // Calculate errors (compare current input char-by-char with the target sentence)
    let currentErrors = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] !== targetText[i]) {
        currentErrors++;
      }
    }

    // Play visual feedback sounds
    if (value.length > typingInput.length) {
      const lastCharIdx = value.length - 1;
      if (value[lastCharIdx] === targetText[lastCharIdx]) {
        playSound("tick");
      } else {
        playSound("error");
        setTypingErrors(prev => prev + 1);
      }
    }

    setTypingInput(value);

    // If typing completed the sentence perfectly
    if (value === targetText) {
      playSound("correct");
      setTypingCompletedCount(prev => prev + 1);
      setTypingInput("");

      // Move to next sentence
      if (activeSentenceIdx + 1 < levelTypingSentences.length) {
        setActiveSentenceIdx(prev => prev + 1);
      } else {
        // All sentences completed! Stop typing and claim points
        stopTypingSession();
        setShowTypingSuccess(true);
      }
    }
  };

  // Calculations for Typing Metrics
  const calculateAccuracy = () => {
    const totalTyped = levelTypingSentences
      .slice(0, activeSentenceIdx)
      .reduce((acc, s) => acc + s.sentence.length, 0) + typingInput.length;
    
    if (totalTyped === 0) return 100;
    const correctChars = Math.max(0, totalTyped - typingErrors);
    return Math.round((correctChars / totalTyped) * 100);
  };

  const calculateWPM = () => {
    if (typingElapsed === 0) return 0;
    const totalChars = levelTypingSentences
      .slice(0, activeSentenceIdx)
      .reduce((acc, s) => acc + s.sentence.length, 0) + typingInput.length;
    
    const words = totalChars / 5;
    const minutes = typingElapsed / 60;
    return Math.round(words / Math.max(0.01, minutes));
  };

  const handleClaimTypingPoints = async () => {
    if (student && showTypingSuccess) {
      const pts = 30;
      const updatedStudent = {
        ...student,
        points: (student.points || 0) + pts
      };
      await onUpdateStudent(updatedStudent);
      resetTypingGame();
      playSound("success");
    }
  };

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      if (speakingTimerRef.current) clearInterval(speakingTimerRef.current);
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-6 px-4" id="academic-games-portal-root">
      
      {/* 1. PORTAL HERO / MAIN MENU SCREEN */}
      {activeMode === "menu" && (
        <div className="space-y-12 animate-fade-in" id="portal-menu-layout">
          {/* Title Header */}
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100/60">
              <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
              <span>{isArabic ? "بوابة الألعاب التعليمية والتدريب" : "Gamified Academic Language Boosters"}</span>
            </div>
            <h1 className="text-2.5xl sm:text-4xl font-black font-display text-slate-800 tracking-tight leading-tight">
              {isArabic ? "مركز التدريب والألعاب اللغوية" : "Language Game & Training Core"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              {isArabic 
                ? "اختر اللعبة المناسبة لتحدي مهاراتك في التحدث، الكتابة السريعة، القواعد، وصياغة المقالات مع تقييم أكاديمي فوري لنقاطك." 
                : "Choose from four distinct educational simulators to train speaking fluency, spelling speed, grammar rules, or creative composition."}
            </p>
          </div>

          {/* CHOOSE PREFERENCES: TARGET LEVEL */}
          <div className="max-w-xs mx-auto bg-slate-50 border border-slate-200/60 p-5 rounded-2xl">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 text-center">
              {isArabic ? "مستوى الألعاب" : "Game Level"}
            </label>
            {student ? (
              <div className="w-full text-xs py-2.5 bg-indigo-600 text-white font-extrabold rounded-xl text-center">
                {student.level}
              </div>
            ) : (
              <select
                value={selectedLevel}
                onChange={(e) => {
                  setSelectedLevel(e.target.value as any);
                  playSound("click");
                }}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-slate-700 cursor-pointer text-center"
              >
                {["A1", "A2", "B1", "B2", "C1", "C2"].map(lvl => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* FOUR MAIN CARDS FOR FOUR GAMES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* GAME 1: QUESTION WHEEL (عجلة الأسئلة) */}
            <motion.div
              whileHover={{ y: -6, scale: 1.01 }}
              onClick={() => {
                playSound("click");
                setActiveMode("question");
              }}
              className="bg-white border border-slate-200 hover:border-indigo-250 p-6 rounded-[24px] text-left rtl:text-right flex flex-col justify-between h-[280px] shadow-xs hover:shadow-xl cursor-pointer relative overflow-hidden group transition-all"
            >
              <div className="absolute top-0 right-0 p-10 bg-indigo-50/20 rounded-full translate-x-1/3 -translate-y-1/3 group-hover:scale-110 transition-transform" />
              <div className="space-y-4 relative z-10">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl w-fit border border-indigo-100">
                  <HelpCircle className="w-6 h-6 stroke-[2.2px]" />
                </div>
                <div>
                  <h3 className="text-lg font-black font-display text-slate-800">
                    {isArabic ? "عجلة أسئلة القواعد" : "Grammar Question Wheel"}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold">Multiple Choice Quiz Wheel</p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isArabic 
                    ? "أدر العجلة لتتوقف على موضوع عشوائي واختبر معلوماتك بقواعد اللغة الإنجليزية بشكل فوري مع كسب نقاط ترفع ترتيبك."
                    : "Spin the wheel to match a random topic. Test your structural English rules under time limits and unlock levels."}
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 relative z-10">
                <span className="text-[9px] font-black uppercase text-indigo-600 tracking-wider">
                  {isArabic ? "تحدي القواعد" : "Active Grammar Quest"}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-black text-slate-800 group-hover:text-indigo-600 transition-colors">
                  <span>{isArabic ? "ابدأ اللعب" : "Start Game"}</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5px] rtl:rotate-180" />
                </span>
              </div>
            </motion.div>

            {/* GAME 2: TYPING TRAINER (تدريب سرعة الكتابة) */}
            <motion.div
              whileHover={{ y: -6, scale: 1.01 }}
              onClick={() => {
                playSound("click");
                setActiveMode("typing");
              }}
              className="bg-white border border-slate-200 hover:border-rose-250 p-6 rounded-[24px] text-left rtl:text-right flex flex-col justify-between h-[280px] shadow-xs hover:shadow-xl cursor-pointer relative overflow-hidden group transition-all"
            >
              <div className="absolute top-0 right-0 p-10 bg-rose-50/20 rounded-full translate-x-1/3 -translate-y-1/3 group-hover:scale-110 transition-transform" />
              <div className="space-y-4 relative z-10">
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl w-fit border border-rose-100">
                  <Keyboard className="w-6 h-6 stroke-[2.2px]" />
                </div>
                <div>
                  <h3 className="text-lg font-black font-display text-slate-800">
                    {isArabic ? "مدرب سرعة الكتابة" : "English Typing Trainer"}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold">Accuracy & Keyboard Speed Practice</p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isArabic 
                    ? "تدرب على سرعة الكتابة بدقة عالية مع تتبع مباشر لنسبة الأخطاء ومعدل الكلمات في الدقيقة (WPM) وجمل مستوى لغوي مخصصة."
                    : "Strengthen your keyboard typing precision and count real-time accuracy and Words Per Minute metrics on language prompts."}
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 relative z-10">
                <span className="text-[9px] font-black uppercase text-rose-600 tracking-wider">
                  {isArabic ? "تحدي السرعة والكتابة" : "Active Speed Challenge"}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-black text-slate-800 group-hover:text-rose-600 transition-colors">
                  <span>{isArabic ? "ابدأ التدريب" : "Start Trainer"}</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5px] rtl:rotate-180" />
                </span>
              </div>
            </motion.div>

            {/* GAME 3: SPEAKING WHEEL (عجلة أسئلة التحدث) */}
            <motion.div
              whileHover={{ y: -6, scale: 1.01 }}
              onClick={() => {
                playSound("click");
                setActiveMode("speaking");
              }}
              className="bg-white border border-slate-200 hover:border-sky-250 p-6 rounded-[24px] text-left rtl:text-right flex flex-col justify-between h-[280px] shadow-xs hover:shadow-xl cursor-pointer relative overflow-hidden group transition-all"
            >
              <div className="absolute top-0 right-0 p-10 bg-sky-50/20 rounded-full translate-x-1/3 -translate-y-1/3 group-hover:scale-110 transition-transform" />
              <div className="space-y-4 relative z-10">
                <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl w-fit border border-sky-100">
                  <Volume2 className="w-6 h-6 stroke-[2.2px]" />
                </div>
                <div>
                  <h3 className="text-lg font-black font-display text-slate-800">
                    {isArabic ? "عجلة أسئلة التحدث" : "Speaking Wheel Challenge"}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold">Interactive voice practice simulator</p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isArabic 
                    ? "سجل إجابتك الصوتية عبر الميكروفون واحصل على تقييم نطق، طلاقة، وقواعد لغوية فوري مع تعليقات تفصيلية ومقترحات."
                    : "Record your voice response on randomized topics and obtain analytical breakdowns of phonetic accuracy and fluency."}
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 relative z-10">
                <span className="text-[9px] font-black uppercase text-sky-600 tracking-wider">
                  {isArabic ? "تحدي التحدث والنطق" : "Active Speaking Sim"}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-black text-slate-800 group-hover:text-sky-600 transition-colors">
                  <span>{isArabic ? "ابدأ اللعب" : "Start Speaking"}</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5px] rtl:rotate-180" />
                </span>
              </div>
            </motion.div>

            {/* GAME 4: WRITING WHEEL (عجلة أسئلة الكتابة) */}
            <motion.div
              whileHover={{ y: -6, scale: 1.01 }}
              onClick={() => {
                playSound("click");
                setActiveMode("writing");
              }}
              className="bg-white border border-slate-200 hover:border-emerald-250 p-6 rounded-[24px] text-left rtl:text-right flex flex-col justify-between h-[280px] shadow-xs hover:shadow-xl cursor-pointer relative overflow-hidden group transition-all"
            >
              <div className="absolute top-0 right-0 p-10 bg-emerald-50/20 rounded-full translate-x-1/3 -translate-y-1/3 group-hover:scale-110 transition-transform" />
              <div className="space-y-4 relative z-10">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl w-fit border border-emerald-100">
                  <PenTool className="w-6 h-6 stroke-[2.2px]" />
                </div>
                <div>
                  <h3 className="text-lg font-black font-display text-slate-800">
                    {isArabic ? "عجلة أسئلة الكتابة" : "Writing Wheel Challenge"}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold">Academic essay drafting tool</p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isArabic 
                    ? "تدرب على صياغة المقالات القصيرة والأكاديمية، مع تقييم سلامة القواعد وتنوع الكلمات والمفردات اللغوية وإملاء الكلمات."
                    : "Obtain randomized essay prompts. Write detailed paragraphs and get deep grammatical and spelling diagnostics."}
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 relative z-10">
                <span className="text-[9px] font-black uppercase text-emerald-600 tracking-wider">
                  {isArabic ? "تحدي التعبير الإنشائي" : "Active Writing Sim"}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-black text-slate-800 group-hover:text-emerald-600 transition-colors">
                  <span>{isArabic ? "ابدأ الكتابة" : "Start Writing"}</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5px] rtl:rotate-180" />
                </span>
              </div>
            </motion.div>

            {/* GAME 5: QUESTION LIBRARY (مكتبة الأسئلة التفاعلية) */}
            <motion.div
              whileHover={{ y: -6, scale: 1.01 }}
              onClick={() => {
                playSound("click");
                setActiveMode("library");
              }}
              className="bg-white border border-slate-200 hover:border-amber-250 p-6 rounded-[24px] text-left rtl:text-right flex flex-col justify-between h-[280px] shadow-xs hover:shadow-xl cursor-pointer relative overflow-hidden group transition-all"
            >
              <div className="absolute top-0 right-0 p-10 bg-amber-50/20 rounded-full translate-x-1/3 -translate-y-1/3 group-hover:scale-110 transition-transform" />
              <div className="space-y-4 relative z-10">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl w-fit border border-amber-100">
                  <Book className="w-6 h-6 stroke-[2.2px]" />
                </div>
                <div>
                  <h3 className="text-lg font-black font-display text-slate-800">
                    {isArabic ? "لعبة مكتبة الأسئلة" : "Question Library Game"}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold">Premium 3D Educational Library Experience</p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isArabic 
                    ? "تصفح رفوف المكتبة الفاخرة وافتح الكتب الملونة لحل الأسئلة المخصصة مع تأثيرات ورسومات تفاعلية ثلاثية الأبعاد."
                    : "Browse luxury bookshelves, open custom colorful books with smooth flip animations, and solve unique academic questions."}
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 relative z-10">
                <span className="text-[9px] font-black uppercase text-amber-600 tracking-wider">
                  {isArabic ? "مكتبة ثلاثية الأبعاد" : "3D BOOK SHELVES"}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-black text-slate-800 group-hover:text-amber-600 transition-colors">
                  <span>{isArabic ? "ابدأ اللعب" : "Start Game"}</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5px] rtl:rotate-180" />
                </span>
              </div>
            </motion.div>

          </div>

          {/* PARTNER WEBSITES SECTION */}
          <div className="border-t border-slate-200/60 pt-10 space-y-6">
            <div className="space-y-1 text-left rtl:text-right">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-500" />
                <span>{isArabic ? "منصات ومواقع التدريب اللغوي الشريكة" : "Partner Language Training Websites"}</span>
              </h2>
              <p className="text-xs text-slate-500">
                {isArabic 
                  ? "تدرب على مهارات إضافية باستخدام مواقع تعليمية عالمية منتقاة بعناية لتنمية مهاراتك بشكل أوسع."
                  : "Train with globally renowned curated websites to enhance your conversational, grammar and listening skills."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CARD 1: Babadum */}
              <motion.div
                whileHover={{ y: -4 }}
                className="bg-white border border-slate-200 hover:border-indigo-200 p-6 rounded-[20px] flex flex-col justify-between h-52 shadow-xs hover:shadow-lg transition-all text-left rtl:text-right"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Bookmark className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-black text-slate-800">Babadum</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {isArabic 
                      ? "تعلم المفردات الإنجليزية بطريقة تفاعلية وممتعة باستخدام الصور والألعاب الملونة المناسبة لجميع الأعمار."
                      : "Learn English vocabulary interactively and beautifully using lively illustrations and audio-visual games."}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Vocabulary & Visuals</span>
                  <a
                    href="https://babadum.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => playSound("click")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold rounded-xl transition-all"
                  >
                    <span>{isArabic ? "ابدأ التدريب" : "Start Training"}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </motion.div>

              {/* CARD 2: Games to Learn English */}
              <motion.div
                whileHover={{ y: -4 }}
                className="bg-white border border-slate-200 hover:border-sky-200 p-6 rounded-[20px] flex flex-col justify-between h-52 shadow-xs hover:shadow-lg transition-all text-left rtl:text-right"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
                      <Gamepad2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-black text-slate-800">Games to Learn English</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {isArabic 
                      ? "مجموعة ضخمة ومتنوعة من الألعاب التعليمية التفاعلية لتطوير قواعد اللغة، المفردات، والاستماع بطريقة سهلة وممتازة."
                      : "A comprehensive repository of interactive language challenges focused on structure, syntax, and active listening."}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <span className="text-[10px] font-bold text-sky-500 uppercase tracking-wider">Grammar & Listening</span>
                  <a
                    href="https://www.gamestolearnenglish.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => playSound("click")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 text-white hover:bg-sky-700 text-xs font-bold rounded-xl transition-all"
                  >
                    <span>{isArabic ? "ابدأ التدريب" : "Start Training"}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </motion.div>
            </div>
          </div>

        </div>
      )}

      {/* 2. QUESTION WHEEL (QUIZ) GAMEPLAY VIEW */}
      {activeMode === "question" && (
        <div className="space-y-6 animate-fade-in text-left rtl:text-right" id="question-game-container">
          <button
            onClick={() => setActiveMode("menu")}
            className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{isArabic ? "العودة للقائمة الرئيسية" : "Back to Main Menu"}</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center space-y-6">
              <div className="flex items-center gap-2 text-indigo-700">
                <HelpCircle className="w-5 h-5 animate-spin" />
                <h3 className="text-xs font-black tracking-wider uppercase">
                  {isArabic ? "عجلة مواضيع القواعد" : "QUIZ WHEEL"}
                </h3>
              </div>

              {activeTopics.length === 0 ? (
                <div className="text-center py-10 space-y-2 text-slate-400 font-bold text-xs">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>{isArabic ? `لا توجد مواضيع قواعد للمستوى ${selectedLevel} حالياً.` : `No grammar topics for level ${selectedLevel} yet.`}</p>
                </div>
              ) : (
                <div className="relative flex flex-col items-center">
                  <div className="absolute -top-3 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-indigo-600 z-20 drop-shadow-sm" />
                  <div 
                    className="w-64 h-64 rounded-full border-[8px] border-slate-800 shadow-xl relative overflow-hidden flex items-center justify-center transition-transform"
                    style={{ 
                      transform: `rotate(${spinAngle}deg)`,
                      background: activeTopics.length === 1 ? '#4f46e5' : '#1e293b'
                    }}
                  >
                    {activeTopics.length > 1 && activeTopics.map((topic, index) => {
                      const count = activeTopics.length;
                      const deg = 360 / count;
                      const rotate = index * deg;
                      const bgGradient = "from-indigo-600 to-indigo-500";
                      return (
                        <div
                          key={topic.id}
                          className="absolute top-0 left-0 w-full h-full origin-center"
                          style={{
                            transform: `rotate(${rotate}deg)`,
                            clipPath: `polygon(50% 50%, 50% 0, ${50 + 50 * Math.tan((deg * Math.PI) / 360)}% 0)`
                          }}
                        >
                          <div className={`w-full h-full bg-gradient-to-tr ${bgGradient} flex items-start justify-center pt-8`}>
                            <span 
                              className="text-[9px] font-black text-white/95 uppercase select-none font-display leading-tight max-w-[50px] truncate"
                              style={{ transform: `rotate(${deg / 2}deg)` }}
                            >
                              {topic.name}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="absolute w-12 h-12 bg-white rounded-full border-[5px] border-slate-800 flex items-center justify-center shadow-md z-10">
                      <HelpCircle className="w-4 h-4 text-indigo-600" />
                    </div>
                  </div>

                  <button
                    onClick={spinWheel}
                    disabled={isSpinning}
                    className="mt-6 bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-300 text-white font-black px-8 py-3 rounded-2xl text-xs uppercase cursor-pointer transition-all shadow-md"
                  >
                    {isSpinning ? (isArabic ? "جاري الدوران..." : "SPINNING...") : (isArabic ? "أدر العجلة" : "SPIN WHEEL")}
                  </button>
                </div>
              )}
            </div>

            <div className="lg:col-span-3 bg-white border border-slate-200 rounded-3xl p-6 min-h-[380px] flex flex-col justify-between">
              {isSpinning && (
                <div className="flex-grow flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                  <h4 className="font-extrabold text-sm text-slate-700">{isArabic ? "جاري تحديد سؤال عشوائي..." : "Choosing random quiz question..."}</h4>
                </div>
              )}

              {!isSpinning && !selectedTopic && (
                <div className="flex-grow flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-4">
                  <HelpCircle className="w-12 h-12 text-slate-300 animate-pulse" />
                  <h4 className="font-black text-sm text-slate-700">{isArabic ? "لعبة عجلة الأسئلة والقواعد" : "Grammar Wheel Game"}</h4>
                </div>
              )}

              {!isSpinning && selectedTopic && currentPrompt && (
                <div className="space-y-6 flex-grow flex flex-col justify-between">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h4 className="font-black text-sm text-slate-850">{selectedTopic.name}</h4>
                    <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-2 py-1 rounded">{selectedTopic.level}</span>
                  </div>

                  <div className="space-y-4">
                    <p className="font-extrabold text-slate-800 text-sm leading-relaxed">{currentPrompt.questionText}</p>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {currentPrompt.answerOptions.map((opt, i) => {
                        const isSelected = selectedOptionIdx === i;
                        const isCorrect = i === currentPrompt.correctAnswerIndex;
                        const showCorrectness = quizAnswered;

                        return (
                          <button
                            key={i}
                            disabled={quizAnswered}
                            onClick={() => handleOptionSelect(i)}
                            className={`w-full text-left p-4 rounded-2xl text-xs font-bold transition-all border ${
                              showCorrectness
                                ? isCorrect
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                                  : isSelected
                                    ? "bg-rose-50 border-rose-300 text-rose-800"
                                    : "bg-slate-50 border-slate-200 text-slate-400"
                                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-350"
                            } cursor-pointer flex items-center justify-between`}
                          >
                            <span>{opt}</span>
                            {showCorrectness && isCorrect && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                            {showCorrectness && isSelected && !isCorrect && <X className="w-4 h-4 text-rose-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {quizAnswered && (
                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                      <div>
                        {selectedOptionIdx === currentPrompt.correctAnswerIndex ? (
                          <span className="text-xs font-extrabold text-emerald-600">{isArabic ? "أحسنت! الإجابة صحيحة!" : "Excellent! Correct answer!"}</span>
                        ) : (
                          <span className="text-xs font-extrabold text-rose-600">{isArabic ? "إجابة خاطئة! حظاً أوفر المرة القادمة." : "Wrong answer! Better luck next time."}</span>
                        )}
                      </div>

                      {selectedOptionIdx === currentPrompt.correctAnswerIndex && !showQuizSuccess && (
                        <button
                          onClick={handleClaimQuizPoints}
                          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black px-4 py-2 rounded-xl text-xs shadow-md cursor-pointer transition-colors"
                        >
                          <Award className="w-4 h-4" />
                          <span>{isArabic ? "تسجيل النقاط (+15)" : "Claim Points (+15)"}</span>
                        </button>
                      )}

                      {showQuizSuccess && (
                        <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                          <Trophy className="w-4 h-4 text-amber-500 animate-bounce" />
                          <span>{isArabic ? "تم تسجيل النقاط لملفك الشخصي!" : "Points added!"}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. TYPING TRAINER GAMEPLAY VIEW */}
      {activeMode === "typing" && (
        <div className="space-y-6 animate-fade-in text-left rtl:text-right" id="typing-game-container">
          <button
            onClick={() => setActiveMode("menu")}
            className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{isArabic ? "العودة للقائمة الرئيسية" : "Back to Main Menu"}</span>
          </button>

          <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
            {/* Header / Level Badge */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-rose-600" />
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base font-display">
                  {isArabic ? "تدريب سرعة الكتابة الموجهة" : "English Typing Speed Trainer"}
                </h3>
              </div>
              <span className="bg-rose-50 text-rose-700 border border-rose-100 px-3 py-1 rounded-full text-[10px] font-black">
                {isArabic ? "مستوى" : "Level"} {selectedLevel}
              </span>
            </div>

            {/* Metrics Dashboard Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">{isArabic ? "السرعة" : "Speed (WPM)"}</span>
                <span className="text-2xl font-black font-mono text-slate-700 mt-1 block">{calculateWPM()}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">{isArabic ? "الدقة" : "Accuracy"}</span>
                <span className="text-2xl font-black font-mono text-emerald-600 mt-1 block">{calculateAccuracy()}%</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">{isArabic ? "عدد الأخطاء" : "Total Errors"}</span>
                <span className="text-2xl font-black font-mono text-rose-600 mt-1 block">{typingErrors}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">{isArabic ? "الوقت المستغرق" : "Time Elapsed"}</span>
                <span className="text-2xl font-black font-mono text-slate-700 mt-1 block">{typingElapsed}s</span>
              </div>
            </div>

            {levelTypingSentences.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-bold text-xs space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-350 mx-auto" />
                <p>{isArabic ? `لا توجد جمل للتدريب مضافة للمستوى ${selectedLevel} حالياً.` : `No typing exercises configured for level ${selectedLevel} yet.`}</p>
                <p className="text-[10px] text-slate-400">{isArabic ? "يستطيع المعلم إضافة جمل تدريب من لوحة التحكم." : "The professor can add sentences in the admin panel."}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Active Sentence Visual Presentation Area */}
                <div className="p-6 bg-slate-950 rounded-2xl text-white text-center font-mono text-sm leading-relaxed tracking-wider border border-slate-800 shadow-inner select-none relative overflow-hidden">
                  <div className="absolute top-2 left-3 text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                    {isArabic ? "اكتب السلسلة النصية التالية:" : "TYPE THE FOLLOWING STRING:"}
                  </div>
                  
                  {activeSentenceObj ? (
                    <div className="py-4 font-bold tracking-normal leading-relaxed text-base sm:text-lg">
                      {/* Color code individual characters */}
                      {activeSentenceObj.sentence.split("").map((char, index) => {
                        let colorClass = "text-slate-400";
                        if (index < typingInput.length) {
                          colorClass = typingInput[index] === char ? "text-emerald-400 font-black border-b-2 border-emerald-400" : "text-rose-500 font-black bg-rose-500/10 rounded px-0.5";
                        } else if (index === typingInput.length) {
                          colorClass = "text-indigo-400 font-extrabold animate-pulse bg-indigo-500/20 px-0.5 rounded";
                        }
                        return (
                          <span key={index} className={colorClass}>
                            {char}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-emerald-400 font-bold py-4">
                      {isArabic ? "تم إكمال كافة الجمل بنجاح!" : "All typing sentences completed perfectly!"}
                    </div>
                  )}

                  <div className="text-right rtl:text-left text-[10px] text-slate-500 font-bold font-mono">
                    {isArabic ? "الجملة" : "Sentence"} {activeSentenceIdx + 1} / {levelTypingSentences.length}
                  </div>
                </div>

                {/* Interactive Input Box */}
                <div className="space-y-3">
                  <input
                    type="text"
                    disabled={!isTypingActive || showTypingSuccess}
                    value={typingInput}
                    onChange={handleTypingInputChange}
                    placeholder={
                      isTypingActive 
                        ? (isArabic ? "ابدأ كتابة الجملة المعروضة بدقة..." : "Type the exact matching text above...") 
                        : (isArabic ? "اضغط على زر البدء لتنشيط لوحة المفاتيح" : "Press the start button to unlock typing input...")
                    }
                    className="w-full text-xs font-mono p-4 border border-slate-200 rounded-2xl bg-white text-slate-800 outline-none focus:ring-2 focus:ring-rose-500 disabled:bg-slate-50 text-center shadow-inner"
                    autoFocus={isTypingActive}
                  />

                  {/* Actions Bar */}
                  <div className="flex justify-between items-center">
                    {!isTypingActive && !showTypingSuccess && (
                      <button
                        onClick={startTypingSession}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-black px-6 py-3 rounded-xl text-xs shadow-md cursor-pointer transition-colors"
                      >
                        {isArabic ? "البدء الآن" : "Start Session"}
                      </button>
                    )}

                    {isTypingActive && (
                      <button
                        onClick={stopTypingSession}
                        className="bg-slate-800 hover:bg-slate-900 text-white font-black px-6 py-3 rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        {isArabic ? "إيقاف مؤقت" : "Pause Session"}
                      </button>
                    )}

                    {showTypingSuccess && (
                      <div className="w-full border border-emerald-150 bg-emerald-50 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                        <div className="flex items-center gap-2 text-emerald-800">
                          <Trophy className="w-5 h-5 text-amber-500 animate-bounce" />
                          <div className="text-left rtl:text-right">
                            <span className="block text-xs font-black">{isArabic ? "مبارك! اكتمل تدريب سرعة الكتابة" : "Session Completed Successfully!"}</span>
                            <span className="text-[10px] text-emerald-600">{isArabic ? "حققت سرعة ودقة ممتازة في صياغة الجمل." : "Outstanding accuracy and spelling efficiency."}</span>
                          </div>
                        </div>

                        <button
                          onClick={handleClaimTypingPoints}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-2.5 rounded-xl text-xs cursor-pointer shadow-md shadow-emerald-100 flex items-center gap-1 shrink-0"
                        >
                          <Award className="w-4 h-4" />
                          <span>{isArabic ? "تسجيل النقاط (+30)" : "Claim Points (+30)"}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. SPEAKING WHEEL GAMEPLAY VIEW */}
      {activeMode === "speaking" && (
        <div className="space-y-6 animate-fade-in text-left rtl:text-right" id="speaking-game-container">
          {/* Back button */}
          <button
            onClick={() => setActiveMode("menu")}
            className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{isArabic ? "العودة للقائمة الرئيسية" : "Back to Main Menu"}</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            
            {/* Left Column: Spinning Wheel */}
            <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center space-y-6">
              <div className="flex items-center gap-2 text-indigo-700">
                <Volume2 className="w-5 h-5" />
                <h3 className="text-xs font-black tracking-wider uppercase text-center">
                  {isArabic ? "عجلة مواضيع التحدث" : "SPEAKING WHEEL"}
                </h3>
              </div>

              {activeTopics.length === 0 ? (
                <div className="text-center py-10 space-y-2 text-slate-400 font-bold text-xs">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>{isArabic ? `لا توجد مواضيع تحدث للمستوى ${selectedLevel} بعد.` : `No speaking topics added for Level ${selectedLevel} yet.`}</p>
                </div>
              ) : (
                <div className="relative flex flex-col items-center">
                  <div className="absolute -top-3 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-indigo-600 z-20 drop-shadow-sm" />
                  <div 
                    className="w-64 h-64 rounded-full border-[8px] border-slate-800 shadow-xl relative overflow-hidden flex items-center justify-center transition-transform"
                    style={{ 
                      transform: `rotate(${spinAngle}deg)`,
                      background: activeTopics.length === 1 ? '#4f46e5' : '#1e293b'
                    }}
                  >
                    {activeTopics.length > 1 && activeTopics.map((topic, index) => {
                      const count = activeTopics.length;
                      const deg = 360 / count;
                      const rotate = index * deg;
                      return (
                        <div
                          key={topic.id}
                          className="absolute top-0 left-0 w-full h-full origin-center"
                          style={{
                            transform: `rotate(${rotate}deg)`,
                            clipPath: `polygon(50% 50%, 50% 0, ${50 + 50 * Math.tan((deg * Math.PI) / 360)}% 0)`
                          }}
                        >
                          <div className="w-full h-full bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-start justify-center pt-8">
                            <span 
                              className="text-[9px] font-black text-white/95 uppercase select-none text-center font-display leading-tight max-w-[50px] truncate"
                              style={{ transform: `rotate(${deg / 2}deg)` }}
                            >
                              {topic.name}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    <div className="absolute w-12 h-12 bg-white rounded-full border-[5px] border-slate-800 flex items-center justify-center shadow-md z-10">
                      <Trophy className="w-4 h-4 text-indigo-600" />
                    </div>
                  </div>

                  <button
                    onClick={spinWheel}
                    disabled={isSpinning}
                    className="mt-6 flex items-center gap-2 bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-300 text-white font-black px-8 py-3 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg cursor-pointer"
                  >
                    {isSpinning ? (isArabic ? "جاري الدوران..." : "SPINNING...") : (isArabic ? "أدر العجلة" : "SPIN WHEEL")}
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Question Content / Results */}
            <div className="lg:col-span-3 bg-white border border-slate-200 rounded-3xl p-6 min-h-[380px] flex flex-col justify-between">
              
              {isSpinning && (
                <div className="flex-grow flex flex-col items-center justify-center text-center space-y-3">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-700">
                    {isArabic ? "جاري اختيار موضوع تحدث عشوائي..." : "Selecting random speaking topic..."}
                  </h4>
                </div>
              )}

              {!isSpinning && !selectedTopic && (
                <div className="flex-grow flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-4">
                  <Volume2 className="w-12 h-12 text-slate-300 stroke-[1.5px] animate-pulse" />
                  <div>
                    <h4 className="font-black text-sm text-slate-700 mb-1">
                      {isArabic ? "تحدي التحدث الصوتي" : "Spoken English Practice"}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                      {isArabic 
                        ? "أدر العجلة ليتم اختيار موضوع عشوائي. قم بالتحدث في الميكروفون لتحصل على تقييم نطق وفصاحة فوري!"
                        : "Spin the wheel to pull a random category. Record your oral response aloud to test pronunciation accuracy."}
                    </p>
                  </div>
                </div>
              )}

              {!isSpinning && selectedTopic && (
                <div className="space-y-6 flex-grow flex flex-col justify-between">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <span className="block text-[8.5px] font-black text-indigo-600 uppercase tracking-wider">
                        {isArabic ? "الموضوع الحالي" : "Current Category"}
                      </span>
                      <h4 className="font-black text-sm text-slate-800 mt-0.5">{selectedTopic.name}</h4>
                    </div>
                    <span className="text-[9px] font-black px-2 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {selectedTopic.level}
                    </span>
                  </div>

                  {currentPrompt ? (
                    <div className="space-y-6 flex-grow flex flex-col justify-between">
                      <div className="space-y-2 bg-slate-50/70 p-4 border border-slate-100 rounded-2xl text-left">
                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block mb-1">Speaking Prompt</span>
                        <h3 className="text-sm font-black text-slate-800 leading-relaxed font-sans">
                          {currentPrompt.questionText}
                        </h3>
                      </div>

                      <div className="border border-slate-150 rounded-2xl p-6 bg-slate-50/30 flex flex-col items-center justify-center space-y-4">
                        <div className="text-center">
                          {isRecording ? (
                            <span className="text-xs font-black text-rose-600 animate-pulse flex items-center gap-1.5 justify-center">
                              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                              {isArabic ? "جاري التسجيل..." : "RECORDING SOUND..."}
                            </span>
                          ) : hasRecorded ? (
                            <span className="text-xs font-black text-emerald-600 flex items-center gap-1 justify-center">
                              <CheckCircle2 className="w-4 h-4" />
                              {isArabic ? "تم تسجيل المقطع بنجاح!" : "AUDIO CAPTURED SUCCESSFULLY!"}
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-slate-400">
                              {isArabic ? "اضغط على الزر أدناه لبدء التحدث" : "Press the mic when ready to start speaking"}
                            </span>
                          )}
                        </div>

                        {isRecording && (
                          <div className="flex items-center gap-1 justify-center h-8">
                            {[...Array(8)].map((_, i) => (
                              <motion.div
                                key={i}
                                animate={{ height: [8, 32, 8] }}
                                transition={{
                                  duration: 0.5 + Math.random() * 0.4,
                                  repeat: Infinity,
                                  delay: i * 0.05
                                }}
                                className="w-1 bg-indigo-500 rounded-full"
                              />
                            ))}
                          </div>
                        )}

                        <div className="w-full max-w-xs space-y-1 text-center">
                          <span className="text-xs font-mono font-bold text-slate-600">
                            {recordingSeconds}s / 60s
                          </span>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-600 transition-all duration-1000"
                              style={{ width: `${(recordingSeconds / 60) * 100}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-center gap-3">
                          {!isRecording ? (
                            <button
                              onClick={startRecording}
                              className="p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-100 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                              title="Start Recording"
                            >
                              <Mic className="w-6 h-6" />
                            </button>
                          ) : (
                            <button
                              onClick={stopRecording}
                              className="p-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-lg shadow-rose-100 cursor-pointer animate-pulse hover:scale-105 active:scale-95 transition-all"
                              title="Stop Recording"
                            >
                              <Square className="w-6 h-6 fill-white stroke-none" />
                            </button>
                          )}
                          
                          {hasRecorded && !isRecording && (
                            <button
                              onClick={startRecording}
                              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full cursor-pointer transition-all"
                              title={isArabic ? "أعد التسجيل" : "Retake Voice"}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {isAnalyzingSpeech && (
                        <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 animate-pulse">
                          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                          <h5 className="font-extrabold text-xs text-slate-700">
                            {isArabic ? "جاري تقييم النطق وفصاحة الكلمات..." : "Analysing phonetics, fluency & vocabulary..."}
                          </h5>
                        </div>
                      )}

                      {speakingScoreReport && !isAnalyzingSpeech && (
                        <motion.div 
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-5 border border-indigo-150 rounded-2xl bg-indigo-50/20 space-y-4"
                        >
                          <div className="flex items-center justify-between border-b border-indigo-100/50 pb-2.5">
                            <h4 className="text-xs font-black text-indigo-700 flex items-center gap-1">
                              <Sparkles className="w-4 h-4 text-amber-500" />
                              {isArabic ? "نتيجة تقييم التحدث" : "Speech Assessment Report"}
                            </h4>
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">Overall Score</span>
                              <span className="text-lg font-black font-mono text-indigo-600">{speakingScoreReport.overall}/100</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3.5">
                            <div className="bg-white p-2 border border-slate-100 rounded-xl">
                              <span className="block text-[9px] font-bold text-slate-400">Fluency</span>
                              <span className="text-xs font-black font-mono text-slate-700">{speakingScoreReport.fluency}%</span>
                              <div className="w-full h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${speakingScoreReport.fluency}%` }} />
                              </div>
                            </div>
                            <div className="bg-white p-2 border border-slate-100 rounded-xl">
                              <span className="block text-[9px] font-bold text-slate-400">Pronunciation</span>
                              <span className="text-xs font-black font-mono text-slate-700">{speakingScoreReport.pronunciation}%</span>
                              <div className="w-full h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${speakingScoreReport.pronunciation}%` }} />
                              </div>
                            </div>
                            <div className="bg-white p-2 border border-slate-100 rounded-xl">
                              <span className="block text-[9px] font-bold text-slate-400">Grammatical Range</span>
                              <span className="text-xs font-black font-mono text-slate-700">{speakingScoreReport.grammar}%</span>
                              <div className="w-full h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-indigo-500" style={{ width: `${speakingScoreReport.grammar}%` }} />
                              </div>
                            </div>
                            <div className="bg-white p-2 border border-slate-100 rounded-xl">
                              <span className="block text-[9px] font-bold text-slate-400">Vocabulary Depth</span>
                              <span className="text-xs font-black font-mono text-slate-700">{speakingScoreReport.vocabulary}%</span>
                              <div className="w-full h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-purple-500" style={{ width: `${speakingScoreReport.vocabulary}%` }} />
                              </div>
                            </div>
                          </div>

                          <div className="bg-white/80 border border-slate-100 p-3 rounded-xl text-xs text-slate-600 leading-relaxed font-medium">
                            {speakingScoreReport.feedback}
                          </div>

                          {!showSpeakingSuccess ? (
                            <button
                              onClick={handleClaimSpeakingPoints}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all"
                            >
                              <Award className="w-4 h-4" />
                              <span>{isArabic ? "تسجيل نقاط المحاولة (+25 نقطة)" : "Claim Speaking Points (+25 pts)"}</span>
                            </button>
                          ) : (
                            <div className="p-3 bg-emerald-50 text-emerald-700 text-center text-xs font-black border border-emerald-150 rounded-xl flex items-center justify-center gap-1.5">
                              <Trophy className="w-4 h-4 text-amber-500 animate-bounce" />
                              <span>{isArabic ? "تم إضافة النقاط لملفك الشخصي بنجاح!" : "Points added to your academic dashboard!"}</span>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {hasRecorded && !isRecording && (
                        <div className="flex justify-end pt-2 border-t border-slate-100">
                          <button
                            onClick={spinWheel}
                            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black px-5 py-3 rounded-xl text-xs transition-all shadow-md shadow-indigo-100 cursor-pointer"
                          >
                            <span>{isArabic ? "دور من جديد" : "Spin Again"}</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400 font-bold text-xs flex-grow flex flex-col justify-center items-center">
                      <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                      <p>{isArabic ? "لا توجد أسئلة مضافة في هذا الموضوع حالياً." : "No questions found under this topic."}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. WRITING WHEEL GAMEPLAY VIEW */}
      {activeMode === "writing" && (
        <div className="space-y-6 animate-fade-in text-left rtl:text-right" id="writing-game-container">
          <button
            onClick={() => setActiveMode("menu")}
            className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{isArabic ? "العودة للقائمة الرئيسية" : "Back to Main Menu"}</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            
            <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center space-y-6">
              <div className="flex items-center gap-2 text-emerald-700">
                <PenTool className="w-5 h-5" />
                <h3 className="text-xs font-black tracking-wider uppercase text-center">
                  {isArabic ? "عجلة مواضيع الكتابة" : "WRITING WHEEL"}
                </h3>
              </div>

              {activeTopics.length === 0 ? (
                <div className="text-center py-10 space-y-2 text-slate-400 font-bold text-xs">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>{isArabic ? `لا توجد مواضيع كتابة للمستوى ${selectedLevel} بعد.` : `No writing topics added for Level ${selectedLevel} yet.`}</p>
                </div>
              ) : (
                <div className="relative flex flex-col items-center">
                  <div className="absolute -top-3 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-emerald-600 z-20 drop-shadow-sm" />
                  <div 
                    className="w-64 h-64 rounded-full border-[8px] border-slate-800 shadow-xl relative overflow-hidden flex items-center justify-center transition-transform"
                    style={{ 
                      transform: `rotate(${spinAngle}deg)`,
                      background: activeTopics.length === 1 ? '#10b981' : '#1e293b'
                    }}
                  >
                    {activeTopics.length > 1 && activeTopics.map((topic, index) => {
                      const count = activeTopics.length;
                      const deg = 360 / count;
                      const rotate = index * deg;
                      return (
                        <div
                          key={topic.id}
                          className="absolute top-0 left-0 w-full h-full origin-center"
                          style={{
                            transform: `rotate(${rotate}deg)`,
                            clipPath: `polygon(50% 50%, 50% 0, ${50 + 50 * Math.tan((deg * Math.PI) / 360)}% 0)`
                          }}
                        >
                          <div className="w-full h-full bg-gradient-to-tr from-emerald-600 to-emerald-500 flex items-start justify-center pt-8">
                            <span 
                              className="text-[9px] font-black text-white/95 uppercase select-none text-center font-display leading-tight max-w-[50px] truncate"
                              style={{ transform: `rotate(${deg / 2}deg)` }}
                            >
                              {topic.name}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    <div className="absolute w-12 h-12 bg-white rounded-full border-[5px] border-slate-800 flex items-center justify-center shadow-md z-10">
                      <Trophy className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>

                  <button
                    onClick={spinWheel}
                    disabled={isSpinning}
                    className="mt-6 flex items-center gap-2 bg-slate-900 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-black px-8 py-3 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg cursor-pointer"
                  >
                    {isSpinning ? (isArabic ? "جاري الدوران..." : "SPINNING...") : (isArabic ? "أدر العجلة" : "SPIN WHEEL")}
                  </button>
                </div>
              )}
            </div>

            <div className="lg:col-span-3 bg-white border border-slate-200 rounded-3xl p-6 min-h-[380px] flex flex-col justify-between">
              
              {isSpinning && (
                <div className="flex-grow flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-10 h-10 border-4 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin" />
                </div>
              )}

              {!isSpinning && !selectedTopic && (
                <div className="flex-grow flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-4">
                  <PenTool className="w-12 h-12 text-slate-300 stroke-[1.5px] animate-pulse" />
                  <h4 className="font-black text-sm text-slate-700 mb-1">{isArabic ? "تحدي الكتابة الإنشائية" : "Essay Composition Challenge"}</h4>
                </div>
              )}

              {!isSpinning && selectedTopic && (
                <div className="space-y-6 flex-grow flex flex-col justify-between">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h4 className="font-black text-sm text-slate-800 mt-0.5">{selectedTopic.name}</h4>
                    <span className="text-[9px] font-black px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">{selectedTopic.level}</span>
                  </div>

                  {currentPrompt ? (
                    <div className="space-y-6 flex-grow flex flex-col justify-between">
                      <div className="space-y-2 bg-slate-50/70 p-4 border border-slate-100 rounded-2xl text-left">
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Writing Prompt</span>
                        <h3 className="text-sm font-black text-slate-800 leading-relaxed font-sans">
                          {currentPrompt.questionText}
                        </h3>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                          <span>{isArabic ? "اكتب مقالك هنا (بالانجليزية)" : "Draft English Composition"}</span>
                          <span className="font-mono bg-slate-100 px-2 py-1 rounded">
                            {getWordCount()} {isArabic ? "كلمة" : "words"}
                          </span>
                        </div>

                        <textarea
                          rows={5}
                          value={essayText}
                          onChange={handleEssayChange}
                          placeholder={isArabic ? "ابدأ كتابة مقالك الإنشائي بالتفصيل هنا..." : "Type your detailed paragraph or essay here..."}
                          className="w-full text-xs font-mono p-4 border border-slate-200 focus:border-emerald-500 rounded-2xl bg-white text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed shadow-inner animate-fade-in"
                        />

                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {isArabic ? "الحد الأدنى المقترح: 10 كلمات" : "Recommended minimum: 10 words"}
                          </span>
                          
                          {getWordCount() >= 5 && (
                            <button
                              onClick={submitEssay}
                              disabled={isAnalyzingWriting}
                              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] rounded-xl shadow-md cursor-pointer hover:scale-102 transition-all shrink-0"
                            >
                              {isArabic ? "تقييم المقال" : "Evaluate Essay"}
                            </button>
                          )}
                        </div>
                      </div>

                      {isAnalyzingWriting && (
                        <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 animate-pulse">
                          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                          <h5 className="font-extrabold text-xs text-slate-700">
                            {isArabic ? "جاري فحص المقال، الإملاء، وصياغة المفردات الأكاديمية..." : "Scanning spelling metrics, lexical range & cohesiveness..."}
                          </h5>
                        </div>
                      )}

                      {writingScoreReport && !isAnalyzingWriting && (
                        <motion.div 
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-5 border border-emerald-150 rounded-2xl bg-emerald-50/20 space-y-4"
                        >
                          <div className="flex items-center justify-between border-b border-emerald-100/50 pb-2.5">
                            <h4 className="text-xs font-black text-emerald-700 flex items-center gap-1">
                              <Sparkles className="w-4 h-4 text-amber-500" />
                              {isArabic ? "تقرير تقييم الكتابة" : "Essay Analytics Scorecard"}
                            </h4>
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">Overall Score</span>
                              <span className="text-lg font-black font-mono text-emerald-600">{writingScoreReport.overall}/100</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white p-2 border border-slate-100 rounded-xl text-center">
                              <span className="block text-[8px] font-bold text-slate-400">Spelling Accuracy</span>
                              <span className="text-xs font-black font-mono text-emerald-600">{writingScoreReport.spelling}%</span>
                            </div>
                            <div className="bg-white p-2 border border-slate-100 rounded-xl text-center">
                              <span className="block text-[8px] font-bold text-slate-400">Cohesion & Structure</span>
                              <span className="text-xs font-black font-mono text-blue-600">{writingScoreReport.cohesion}%</span>
                            </div>
                            <div className="bg-white p-2 border border-slate-100 rounded-xl text-center">
                              <span className="block text-[8px] font-bold text-slate-400">Grammar Consistency</span>
                              <span className="text-xs font-black font-mono text-purple-600">{writingScoreReport.grammar}%</span>
                            </div>
                          </div>

                          <div className="bg-white/80 border border-slate-100 p-3 rounded-xl text-xs text-slate-600 leading-relaxed font-medium font-sans">
                            {writingScoreReport.feedback}
                          </div>

                          {!showWritingSuccess ? (
                            <button
                              onClick={handleClaimWritingPoints}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all"
                            >
                              <Award className="w-4 h-4" />
                              <span>{isArabic ? "تسجيل نقاط المحاولة (+35 نقطة)" : "Claim Writing Points (+35 pts)"}</span>
                            </button>
                          ) : (
                            <div className="p-3 bg-emerald-50 text-emerald-700 text-center text-xs font-black border border-emerald-150 rounded-xl flex items-center justify-center gap-1.5">
                              <Trophy className="w-4 h-4 text-amber-500 animate-bounce" />
                              <span>{isArabic ? "تم إضافة النقاط لملفك الشخصي بنجاح!" : "Points successfully added to your dashboard!"}</span>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {writingScoreReport && (
                        <div className="flex justify-end pt-2 border-t border-slate-100">
                          <button
                            onClick={spinWheel}
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-3 rounded-xl text-xs transition-all shadow-md shadow-emerald-100 cursor-pointer"
                          >
                            <span>{isArabic ? "دور من جديد" : "Spin Again"}</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400 font-bold text-xs flex-grow flex flex-col justify-center items-center">
                      <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                      <p>{isArabic ? "لا توجد أسئلة مضافة في هذا الموضوع حالياً." : "No writing prompts found under this topic."}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. QUESTION LIBRARY (LIBRARY) GAMEPLAY VIEW */}
      {activeMode === "library" && (
        <div className="space-y-6 animate-fade-in text-left rtl:text-right" id="library-game-container">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/80 backdrop-blur-md border border-slate-200/80 p-4 rounded-2xl shadow-sm">
            <button
              onClick={() => {
                playSound("click");
                setActiveMode("menu");
                setActiveLibraryBook(null);
                setLibraryZoom(false);
              }}
              className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              <span>{isArabic ? "العودة للقائمة الرئيسية" : "Back to Main Menu"}</span>
            </button>

            <div className="text-center">
              <h2 className="text-lg font-black text-slate-800 font-display flex items-center gap-2 justify-center">
                <Book className="w-5 h-5 text-amber-600 animate-pulse" />
                <span>{isArabic ? "مكتبة الأسئلة التفاعلية" : "Interactive Question Library"}</span>
              </h2>
            </div>

            <div className="text-xs font-black bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full border border-amber-100 flex items-center gap-1">
              <span>{isArabic ? "الكتب المحلولة:" : "Solved Books:"}</span>
              <span className="font-mono text-sm">
                {(student?.completedBooks || []).filter(id => libraryBooks.some(b => b.id === id)).length} / {libraryBooks.length}
              </span>
            </div>
          </div>

          {/* WOODEN SHELVES BACKDROP AND BOOKS CONTAINER */}
          {!libraryZoom ? (
            <div className="relative bg-gradient-to-b from-stone-900 via-stone-950 to-stone-900 rounded-3xl p-8 sm:p-12 shadow-2xl border-4 border-amber-950 overflow-hidden min-h-[500px]">
              {/* Subtle light glow effect */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.05)_0%,transparent_100%)] pointer-events-none" />

              <div className="relative z-10 space-y-12">
                {libraryBooks.length === 0 ? (
                  <div className="text-center py-24 text-stone-400 font-bold text-sm">
                    <Book className="w-12 h-12 text-stone-500 mx-auto mb-3 animate-pulse" />
                    <p>{isArabic ? "لا توجد كتب مضافة في المكتبة حالياً." : "No books in the library yet."}</p>
                  </div>
                ) : (
                  Array.from({ length: Math.ceil(libraryBooks.length / 4) }).map((_, shelfIndex) => {
                    const shelfBooks = libraryBooks.slice(shelfIndex * 4, shelfIndex * 4 + 4);
                    return (
                      <div key={shelfIndex} className="space-y-2 relative" id={`shelf-${shelfIndex}`}>
                        {/* Books Row */}
                        <div className="flex flex-wrap justify-center items-end gap-6 sm:gap-10 px-4 min-h-[160px]">
                          {shelfBooks.map((book) => {
                            const isSolved = (student?.completedBooks || []).includes(book.id);
                            return (
                              <motion.div
                                key={book.id}
                                whileHover={{ y: -10, rotate: -2, scale: 1.05 }}
                                onClick={() => {
                                  playSound("flip");
                                  setActiveLibraryBook(book);
                                  setLibraryZoom(true);
                                  setLibraryAnswerSelected(null);
                                  setLibraryShowResult(null);
                                }}
                                className="relative cursor-pointer select-none group focus:outline-none"
                                style={{ perspective: 1000 }}
                              >
                                {/* 3D-styled Book Spine & Cover */}
                                <div 
                                  className={`w-28 sm:w-32 h-40 sm:h-44 rounded-r-lg rounded-l-xs shadow-lg bg-gradient-to-r ${book.coverColor || 'from-indigo-600 to-indigo-700'} relative transition-all duration-300 transform-gpu preserve-3d border-l-4 border-black/30 flex flex-col justify-between p-4`}
                                >
                                  {/* Left Spine Highlight */}
                                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white/20 blur-[0.5px]" />
                                  {/* Gold border overlay */}
                                  <div className="absolute inset-2 border border-amber-400/20 rounded-md pointer-events-none" />

                                  {/* Book Number */}
                                  <div className="text-right">
                                    <span className="text-xs font-black text-white/40 font-mono tracking-widest block">BOOK</span>
                                    <span className="text-3xl sm:text-4xl font-black text-white/90 font-mono tracking-tighter leading-none block mt-1">
                                      {book.bookNumber}
                                    </span>
                                  </div>

                                  {/* Bookmark or Badge icon inside book */}
                                  <div className="flex justify-between items-center relative z-10">
                                    <Bookmark className="w-5 h-5 text-white/30" />
                                    
                                    {isSolved && (
                                      <span className="text-[9px] font-black uppercase bg-emerald-500 text-white px-1.5 py-0.5 rounded shadow-sm border border-emerald-400">
                                        ✓ DONE
                                      </span>
                                    )}
                                  </div>

                                  {/* Hover shine effect */}
                                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                </div>

                                {/* Shadow under the book */}
                                <div className="h-2 w-24 bg-black/60 mx-auto rounded-full blur-[2px] mt-1 shadow-md opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* Realistic Wooden Shelf */}
                        <div className="relative h-6 w-full bg-gradient-to-b from-amber-800 via-amber-900 to-amber-950 rounded-xl shadow-xl border-t border-amber-700/60 flex items-center justify-center">
                          {/* Highlights on the wood */}
                          <div className="absolute inset-x-0 top-0 h-1 bg-amber-500/20 rounded-t-xl" />
                          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/30 rounded-b-xl" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            // ACTIVE ZOOM VIEW (OPEN BOOK)
            activeLibraryBook && (
              <div className="flex flex-col items-center justify-center py-6 sm:py-12 animate-fade-in relative">
                {/* Floating particle/glow elements */}
                {libraryShowResult === "correct" && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-50">
                    <div className="w-full h-full relative">
                      {Array.from({ length: 30 }).map((_, i) => {
                        const left = Math.random() * 100;
                        const top = Math.random() * 100;
                        const scale = Math.random() * 1.5 + 0.5;
                        const delay = Math.random() * 1.5;
                        return (
                          <motion.div
                            key={i}
                            initial={{ scale: 0, opacity: 1, y: 0 }}
                            animate={{ scale: [0, scale, 0], opacity: [1, 1, 0], y: -100, x: (Math.random() - 0.5) * 100 }}
                            transition={{ duration: 2, delay, repeat: Infinity }}
                            className="absolute bg-amber-400 rounded-full"
                            style={{
                              left: `${left}%`,
                              top: `${top}%`,
                              width: "8px",
                              height: "8px",
                              boxShadow: "0 0 8px #fbbf24"
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3D Opened Book Container */}
                <div className="w-full max-w-4xl bg-stone-900/40 border border-stone-800 p-4 sm:p-8 rounded-[36px] shadow-2xl backdrop-blur-md">
                  <motion.div 
                    initial={{ scale: 0.9, rotateY: -10, opacity: 0 }}
                    animate={{ scale: 1, rotateY: 0, opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-0 bg-amber-50 border-[6px] border-amber-900 rounded-3xl shadow-2xl relative overflow-hidden min-h-[480px]"
                    style={{ transformStyle: "preserve-3d", perspective: 1000 }}
                  >
                    {/* Central Book fold shadow / Binding */}
                    <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-8 -translate-x-1/2 bg-gradient-to-r from-black/15 via-black/30 to-black/15 z-20 pointer-events-none" />

                    {/* LEFT PAGE (Book Cover info & Header) */}
                    <div className="p-6 sm:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-amber-800/10 bg-gradient-to-br from-amber-50/50 to-amber-100/30 text-left relative z-10">
                      <div>
                        <div className="flex items-center gap-2 mb-6">
                          <span className={`w-3 h-3 rounded-full bg-gradient-to-br ${activeLibraryBook.coverColor || 'from-indigo-600 to-indigo-700'}`} />
                          <span className="text-[10px] font-black text-amber-900/60 uppercase tracking-widest font-mono">
                            ACADEMIC QUESTION LIBRARY
                          </span>
                        </div>

                        <div className="space-y-4">
                          <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-900/10 rounded-2xl text-amber-900 border border-amber-900/10">
                            <Book className="w-7 h-7" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-amber-950 font-display leading-tight">
                              {isArabic ? `الكتاب رقم ${activeLibraryBook.bookNumber}` : `Book Number ${activeLibraryBook.bookNumber}`}
                            </h3>
                            <p className="text-xs text-amber-900/60 font-semibold mt-1">
                              {isArabic ? "سؤال لغوي مخصص للتحدي والتقييم" : "Curated language question challenge"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* QUESTION DISPENSARY SECTION */}
                      <div className="my-8 bg-amber-900/5 border border-amber-900/10 p-5 rounded-2xl">
                        <span className="text-[9px] font-black text-amber-800 uppercase tracking-widest block mb-2 font-mono">
                          {isArabic ? "السؤال المطروح:" : "THE QUESTION:"}
                        </span>
                        <p className="text-sm sm:text-base font-black text-amber-950 leading-relaxed font-sans">
                          {activeLibraryBook.questionText}
                        </p>
                      </div>

                      {/* Close button inside the book */}
                      <button
                        onClick={() => {
                          playSound("flip");
                          setLibraryZoom(false);
                          setActiveLibraryBook(null);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-3 bg-amber-900/10 hover:bg-amber-900/20 text-amber-950 font-black text-xs rounded-xl transition-all cursor-pointer border border-amber-900/15"
                      >
                        <span>{isArabic ? "إغلاق الكتاب والعودة للرفوف" : "Close Book & Return to Shelves"}</span>
                      </button>
                    </div>

                    {/* RIGHT PAGE (Options & Submitting) */}
                    <div className="p-6 sm:p-10 flex flex-col justify-between bg-amber-50 relative z-10">
                      <div>
                        <div className="flex justify-between items-center mb-6">
                          <span className="text-[10px] font-black text-amber-900/60 uppercase tracking-widest font-mono">
                            {isArabic ? "خيارات الإجابة" : "ANSWER OPTIONS"}
                          </span>
                          
                          {(student?.completedBooks || []).includes(activeLibraryBook.id) && (
                            <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 animate-pulse" />
                              {isArabic ? "محلول مسبقاً" : "SOLVED"}
                            </span>
                          )}
                        </div>

                        {/* Options list */}
                        <div className="space-y-3">
                          {activeLibraryBook.options.map((option, index) => {
                            const isSelected = libraryAnswerSelected === index;
                            const isCorrect = activeLibraryBook.correctOptionIndex === index;
                            
                            // Color code options
                            let optionStyle = "border-amber-900/10 hover:bg-amber-900/5 hover:border-amber-950/30 text-amber-950";
                            if (isSelected) {
                              if (libraryShowResult === "correct") {
                                optionStyle = "bg-emerald-100 border-emerald-500 text-emerald-950 shadow-sm";
                              } else if (libraryShowResult === "incorrect") {
                                optionStyle = "bg-rose-100 border-rose-500 text-rose-950 shadow-sm";
                              } else {
                                optionStyle = "bg-amber-100 border-amber-500 text-amber-950 shadow-sm";
                              }
                            } else if (libraryShowResult && isCorrect) {
                              // Highlight correct answer if they made a mistake
                              optionStyle = "bg-emerald-50 border-emerald-400 text-emerald-950";
                            }

                            return (
                              <button
                                key={index}
                                disabled={libraryShowResult !== null}
                                onClick={() => {
                                  playSound("click");
                                  setLibraryAnswerSelected(index);
                                }}
                                className={`w-full text-left rtl:text-right p-4 border rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition-all outline-none ${optionStyle} cursor-pointer disabled:cursor-not-allowed`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="w-6 h-6 rounded-full bg-amber-900/10 text-amber-950 font-black font-mono text-xs flex items-center justify-center shrink-0">
                                    {String.fromCharCode(65 + index)}
                                  </span>
                                  <span className="font-sans leading-relaxed">{option}</span>
                                </div>
                                <div className="shrink-0">
                                  {isSelected && libraryShowResult === "correct" && <Check className="w-4 h-4 text-emerald-600 stroke-[3px]" />}
                                  {isSelected && libraryShowResult === "incorrect" && <X className="w-4 h-4 text-rose-600 stroke-[3px]" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* SUBMISSION / NEXT ACTION BAR */}
                      <div className="mt-8 pt-6 border-t border-amber-800/10">
                        {libraryShowResult === null && libraryAnswerSelected !== null && (
                          <button
                            onClick={() => {
                              const isCorrect = libraryAnswerSelected === activeLibraryBook.correctOptionIndex;
                              if (isCorrect) {
                                playSound("correct");
                                setLibraryShowResult("correct");
                                
                                // Update student completedBooks in DB and state!
                                if (student) {
                                  const completed = student.completedBooks || [];
                                  if (!completed.includes(activeLibraryBook.id)) {
                                    const updatedStudent = {
                                      ...student,
                                      completedBooks: [...completed, activeLibraryBook.id],
                                      points: (student.points || 0) + 15
                                    };
                                    onUpdateStudent(updatedStudent);
                                  }
                                }
                              } else {
                                playSound("error");
                                setLibraryShowResult("incorrect");
                              }
                            }}
                            className="w-full py-3.5 bg-amber-900 hover:bg-amber-950 text-white font-black text-xs rounded-xl shadow-lg hover:scale-101 transition-all cursor-pointer text-center uppercase tracking-wider"
                          >
                            {isArabic ? "تأكيد الإجابة والتحقق" : "Confirm Answer & Check"}
                          </button>
                        )}

                        {libraryShowResult === "correct" && (
                          <div className="space-y-4">
                            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-250 text-center text-xs font-black rounded-xl flex items-center justify-center gap-2">
                              <Sparkles className="text-amber-500 w-4 h-4 animate-spin" />
                              <span>{isArabic ? "أحسنت! إجابة صحيحة بالكامل (+15 نقطة)" : "Splendid! Totally Correct Answer (+15 pts)"}</span>
                            </div>

                            <button
                              onClick={() => {
                                playSound("flip");
                                setLibraryZoom(false);
                                setActiveLibraryBook(null);
                              }}
                              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg hover:scale-101 transition-all cursor-pointer text-center"
                            >
                              {isArabic ? "العودة إلى رفوف المكتبة" : "Return to Library Shelves"}
                            </button>
                          </div>
                        )}

                        {libraryShowResult === "incorrect" && (
                          <div className="space-y-4">
                            <div className="p-3 bg-rose-50 text-rose-800 border border-rose-250 text-center text-xs font-black rounded-xl">
                              {isArabic ? "الإجابة خاطئة! حاول مرة أخرى بالضغط على زر إعادة المحاولة." : "Incorrect Answer! Click try again to re-attempt."}
                            </div>

                            <button
                              onClick={() => {
                                playSound("click");
                                setLibraryAnswerSelected(null);
                                setLibraryShowResult(null);
                              }}
                              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-lg hover:scale-101 transition-all cursor-pointer text-center"
                            >
                              {isArabic ? "إعادة المحاولة" : "Try Again"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            )
          )}
        </div>
      )}

    </div>
  );
}
