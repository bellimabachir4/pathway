import React, { useState, useEffect } from "react";
import Navigation from "./components/Navigation";
import LessonsSection from "./components/LessonsSection";
import VocabularySection from "./components/VocabularySection";
import LiveClassesSection from "./components/LiveClassesSection";
import ProfileSection from "./components/ProfileSection";
import TeacherDashboard from "./components/TeacherDashboard";
import AuthModal from "./components/AuthModal";
import LoginPage from "./components/LoginPage";
import SidebarMenu from "./components/SidebarMenu";
import DailyTasksSection from "./components/DailyTasksSection";
import WeeklyTasksSection from "./components/WeeklyTasksSection";
import AboutUsSection from "./components/AboutUsSection";
import ResourcesSection from "./components/ResourcesSection";
import TipsSection from "./components/TipsSection";
import TrainingSection from "./components/TrainingSection";
import RecordedLessonsSection from "./components/RecordedLessonsSection";

import { Student, Teacher, Lesson, Vocabulary, DynamicVocabCategory, LiveSession, Announcement, ResourceOrTip } from "./types";
import { 
  getLessons, 
  getVocabulary, 
  getLiveSessions, 
  getStudentProfile, 
  saveStudentProfile,
  clearAllTeachers,
  getAnnouncements,
  subscribeToStudentProfile,
  subscribeToResourcesAndTips,
  subscribeToLessons,
  subscribeToVocabulary,
  subscribeToVocabCategories,
  subscribeToLiveSessions,
  subscribeToAnnouncements
} from "./lib/dbService";

import { 
  GraduationCap, 
  Star, 
  Flame, 
  Award, 
  BookOpen, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  CheckCircle,
  HelpCircle,
  Megaphone,
  Calendar,
  MessageSquare,
  Play,
  Pause,
  Save,
  FileText,
  ExternalLink,
  Info,
  Plus,
  Edit,
  Trash2,
  PlayCircle
} from "lucide-react";
import { motion } from "motion/react";

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>("home");
  const [isArabic, setIsArabic] = useState<boolean>(true); // Default to Arabic as requested in detailed spec
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showAccessCodeModal, setShowAccessCodeModal] = useState<boolean>(false);
  const [accessCodeInput, setAccessCodeInput] = useState<string>("");
  const [accessCodeError, setAccessCodeError] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Hidden 10 logo clicks helper states
  const [logoClicks, setLogoClicks] = useState<number>(0);
  const [logoClickTimer, setLogoClickTimer] = useState<NodeJS.Timeout | null>(null);

  // Active authenticated user states
  const [student, setStudent] = useState<Student | null>(null);
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);

  // Core curriculum lists (Lessons, vocabulary words, live video links)
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([]);
  const [vocabCategories, setVocabCategories] = useState<DynamicVocabCategory[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [resourcesAndTips, setResourcesAndTips] = useState<ResourceOrTip[]>([]);

  // Scroll to top on tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as any });
  }, [currentTab]);

  // Subscriptions for student and resources
  useEffect(() => {
    if (student?.uid) {
      const unsubscribe = subscribeToStudentProfile(student.uid, (updatedProfile) => {
        if (updatedProfile.isDisabled) {
          setStudent(null);
          localStorage.removeItem("ep_student_profile");
          alert(isArabic ? "هذا الحساب معطل حالياً من قبل الأستاذ." : "This account is currently disabled by the teacher.");
        } else {
          setStudent(updatedProfile);
        }
      });
      return unsubscribe;
    }
  }, [student?.uid]);

  useEffect(() => {
    const activeTeacherId = currentTeacher ? currentTeacher.uid : (student?.selectedTeacherId || "teacher-sarah");

    const unsubResources = subscribeToResourcesAndTips((items) => {
      setResourcesAndTips(items);
    }, activeTeacherId);

    const unsubLessons = subscribeToLessons((list) => {
      setLessons(list);
    }, activeTeacherId);

    const unsubVocab = subscribeToVocabulary((list) => {
      setVocabulary(list);
    }, activeTeacherId);

    const unsubVocabCategories = subscribeToVocabCategories((list) => {
      setVocabCategories(list);
    }, activeTeacherId);

    const unsubLives = subscribeToLiveSessions((list) => {
      setLiveSessions(list);
    }, activeTeacherId);

    const unsubAnnouncements = subscribeToAnnouncements((list) => {
      setAnnouncements(list);
    }, activeTeacherId);

    return () => {
      unsubResources();
      unsubLessons();
      unsubVocab();
      unsubVocabCategories();
      unsubLives();
      unsubAnnouncements();
    };
  }, [student?.selectedTeacherId, currentTeacher?.uid]);

  // ================= STUDY SESSION & TIME REMAINING STATES =================
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const diff = midnight.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeRemaining("00:00:00");
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      const pad = (v: number) => String(v).padStart(2, "0");
      setTimeRemaining(`${pad(h)}:${pad(m)}:${pad(s)}`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, []);

  const [isStudying, setIsStudying] = useState<boolean>(false);
  const [studyElapsedSeconds, setStudyElapsedSeconds] = useState<number>(0);
  const [saveNotesSuccess, setSaveNotesSuccess] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isStudying) {
      interval = setInterval(() => {
        setStudyElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStudying]);

  const formatDuration = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = (v: number) => String(v).padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const handleStartStudy = () => {
    setIsStudying(true);
    setStudyElapsedSeconds(0);
  };

  const handleStopStudy = async () => {
    if (!isStudying || !student) return;
    setIsStudying(false);
    const addedSeconds = studyElapsedSeconds;
    setStudyElapsedSeconds(0);

    const updatedStudent: Student = {
      ...student,
      studySecondsToday: (student.studySecondsToday || 0) + addedSeconds,
      studySecondsThisWeek: (student.studySecondsThisWeek || 0) + addedSeconds,
      studySecondsTotal: (student.studySecondsTotal || 0) + addedSeconds,
    };
    await handleUpdateStudent(updatedStudent);
  };

  const handleSaveStudySession = async () => {
    if (!student || studyElapsedSeconds === 0) return;
    setIsStudying(false);
    const addedSeconds = studyElapsedSeconds;
    setStudyElapsedSeconds(0);

    const updatedStudent: Student = {
      ...student,
      studySecondsToday: (student.studySecondsToday || 0) + addedSeconds,
      studySecondsThisWeek: (student.studySecondsThisWeek || 0) + addedSeconds,
      studySecondsTotal: (student.studySecondsTotal || 0) + addedSeconds,
    };
    await handleUpdateStudent(updatedStudent);
  };

  const [studentNotes, setStudentNotes] = useState<string>("");

  useEffect(() => {
    if (student) {
      setStudentNotes(student.notes || "");
    }
  }, [student?.uid]);

  const handleSaveNotes = async (customNotes?: string) => {
    if (!student) return;
    const finalNotes = customNotes !== undefined ? customNotes : studentNotes;
    const updatedStudent: Student = {
      ...student,
      notes: finalNotes
    };
    await handleUpdateStudent(updatedStudent);
    setSaveNotesSuccess(true);
    setTimeout(() => setSaveNotesSuccess(false), 2000);
  };

  // States for Errors & Obstacles
  const [showErrorObstacleForm, setShowErrorObstacleForm] = useState<boolean>(false);
  const [editingErrorObstacleId, setEditingErrorObstacleId] = useState<string | null>(null);
  const [formErrorCommitted, setFormErrorCommitted] = useState<string>("");
  const [formDifficultyFaced, setFormDifficultyFaced] = useState<string>("");
  const [formHowResolved, setFormHowResolved] = useState<string>("");

  const handleSaveErrorObstacle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    const currentList = student.errorObstacles || [];
    let updatedList: any[] = [];

    if (editingErrorObstacleId) {
      // Edit mode
      updatedList = currentList.map(item => {
        if (item.id === editingErrorObstacleId) {
          return {
            ...item,
            errorCommitted: formErrorCommitted,
            difficultyFaced: formDifficultyFaced,
            howResolved: formHowResolved,
          };
        }
        return item;
      });
    } else {
      // Create mode
      const newItem = {
        id: "err-obs-" + Date.now().toString(36),
        errorCommitted: formErrorCommitted,
        difficultyFaced: formDifficultyFaced,
        howResolved: formHowResolved,
        createdAt: new Date().toISOString()
      };
      updatedList = [newItem, ...currentList];
    }

    const updatedStudent: Student = {
      ...student,
      errorObstacles: updatedList
    };

    await handleUpdateStudent(updatedStudent);
    
    // Reset form
    setShowErrorObstacleForm(false);
    setEditingErrorObstacleId(null);
    setFormErrorCommitted("");
    setFormDifficultyFaced("");
    setFormHowResolved("");
  };

  const handleStartEditErrorObstacle = (item: any) => {
    setEditingErrorObstacleId(item.id);
    setFormErrorCommitted(item.errorCommitted);
    setFormDifficultyFaced(item.difficultyFaced);
    setFormHowResolved(item.howResolved);
    setShowErrorObstacleForm(true);
  };

  const handleDeleteErrorObstacle = async (id: string) => {
    if (!student) return;
    const currentList = student.errorObstacles || [];
    const updatedList = currentList.filter(item => item.id !== id);

    const updatedStudent: Student = {
      ...student,
      errorObstacles: updatedList
    };

    await handleUpdateStudent(updatedStudent);
  };

  // Load curriculum from database on start
  const fetchCurriculumData = async (teacherId?: string) => {
    const targetId = teacherId || currentTeacher?.uid || "teacher-sarah";
    const lList = await getLessons(targetId);
    const vList = await getVocabulary(targetId);
    const sList = await getLiveSessions(targetId);
    const aList = await getAnnouncements(targetId);
    setLessons(lList);
    setVocabulary(vList);
    setLiveSessions(sList);
    setAnnouncements(aList);
  };

  useEffect(() => {
    // One-time teacher database reset check to empty states as requested
    const hasResetTeachers = localStorage.getItem("ep_teachers_reset_v5");
    if (!hasResetTeachers) {
      clearAllTeachers().then(() => {
        localStorage.setItem("ep_teachers_reset_v5", "true");
        window.location.reload();
      });
      return;
    }

    let activeTeacherId = "teacher-sarah";
    const cachedTeacher = localStorage.getItem("ep_current_teacher");
    if (cachedTeacher) {
      try {
        const parsed = JSON.parse(cachedTeacher);
        if (parsed && parsed.uid) {
          setCurrentTeacher(parsed);
          activeTeacherId = parsed.uid;
        }
      } catch {}
    }

    fetchCurriculumData(activeTeacherId);
    
    // Check if there's a cached student logged in
    const cachedUser = localStorage.getItem("ep_student_profile");
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser);
        if (parsed && parsed.uid) {
          // Re-sync with database under their assigned teacher
          const studentTeacherId = parsed.selectedTeacherId || activeTeacherId;
          getStudentProfile(parsed.uid, parsed.name, parsed.email, studentTeacherId).then((profile) => {
            if (profile.isDisabled) {
              setStudent(null);
              localStorage.removeItem("ep_student_profile");
              alert(isArabic ? "هذا الحساب معطل حالياً من قبل الأستاذ." : "This account is currently disabled by the teacher.");
            } else {
              setStudent(profile);
            }
          });
        }
      } catch (e) {
        console.error("Failed to parse cached student profile", e);
      }
    }
  }, []);

  // Update Student state and sync to database
  const handleUpdateStudent = async (updatedStudent: Student) => {
    setStudent(updatedStudent);
    const targetId = updatedStudent.selectedTeacherId || currentTeacher?.uid || "teacher-sarah";
    await saveStudentProfile(updatedStudent, targetId);
  };

  // Google/Sandbox Auth success
  const handleAuthSuccess = async (uid: string, name: string, email: string) => {
    const targetId = currentTeacher?.uid || "teacher-sarah";
    const profile = await getStudentProfile(uid, name, email, targetId);
    if (profile.isDisabled) {
      alert(isArabic ? "هذا الحساب معطل حالياً من قبل الأستاذ." : "This account is currently disabled by the teacher.");
      return;
    }
    setStudent(profile);
    localStorage.setItem("ep_student_profile", JSON.stringify(profile));
  };

  // Logout both Student and Teacher
  const handleLogout = () => {
    setStudent(null);
    setCurrentTeacher(null);
    localStorage.removeItem("ep_student_profile");
    localStorage.removeItem("ep_current_teacher");
    setCurrentTab("home");
  };

  // Handle Logo Clicks: 10 consecutive silent clicks bypass directly to teacher dashboard
  const handleLogoClick = () => {
    if (logoClickTimer) {
      clearTimeout(logoClickTimer);
    }

    const nextClicks = logoClicks + 1;
    setLogoClicks(nextClicks);

    if (nextClicks >= 10) {
      setLogoClicks(0);
      setCurrentTab("teacher");
      setShowAccessCodeModal(false);
    } else {
      const timer = setTimeout(() => {
        setLogoClicks(0);
      }, 1500);
      setLogoClickTimer(timer);
    }
  };

  const handleAccessCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCodeInput === "0908070605") {
      setCurrentTab("teacher");
      setShowAccessCodeModal(false);
      setAccessCodeInput("");
      setAccessCodeError(false);
    } else {
      setAccessCodeError(true);
    }
  };

  const handleSelectTeacher = (teacher: Teacher | null) => {
    setCurrentTeacher(teacher);
    if (teacher) {
      localStorage.setItem("ep_current_teacher", JSON.stringify(teacher));
      fetchCurriculumData(teacher.uid);
      // Auto redirect to administrative dashboard
      setCurrentTab("teacher");
    } else {
      localStorage.removeItem("ep_current_teacher");
      fetchCurriculumData("teacher-sarah");
    }
  };

  const showLoginAndOnboarding = currentTab !== "teacher" && (
    !student || 
    !student.selectedLanguage || 
    !student.selectedLevelCode || 
    !student.selectedTeacherId
  );

  if (showLoginAndOnboarding) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between" id="applet-root">
        <LoginPage
          isArabic={isArabic}
          onAuthSuccess={handleAuthSuccess}
          student={student}
          onUpdateStudent={handleUpdateStudent}
          onLogoClick={handleLogoClick}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between" id="applet-root">
      
      {/* Top Navigation Panel */}
      <Navigation
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isArabic={isArabic}
        setIsArabic={setIsArabic}
        student={student}
        teacher={currentTeacher}
        onLogout={handleLogout}
        onLogoClick={handleLogoClick}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenMenu={() => setIsSidebarOpen(true)}
      />

      {/* Modern Slide-out Sidebar Drawer Menu */}
      <SidebarMenu
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isArabic={isArabic}
        onOpenAuth={() => setShowAuthModal(true)}
        isLoggedIn={!!student || !!currentTeacher}
      />

      {/* Main Page Layout Wrapper */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 md:pb-8">
        
        {/* TAB 1: THE GENERAL HERO & PROGRESS DASHBOARD (HOME) */}
        {currentTab === "home" && (
          <motion.div
            initial={{ opacity: 0, x: isArabic ? -35 : 35 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="space-y-12"
            id="home-view-container"
          >
            
            {/* Quick Student Dashboard (Synced Stats Panel) */}
            {student && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-4 border-b border-slate-100">
                  <div className="text-center sm:text-left rtl:sm:text-right">
                    <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-widest font-mono">
                      {isArabic ? "الملف التعلمي النشط" : "Personal Learning Dashboard"}
                    </span>
                    <h3 className="text-xl font-extrabold font-display text-slate-900">
                      {isArabic ? `أهلاً بك مجدداً، ${student.name} 👋` : `Welcome Back, ${student.name} 👋`}
                    </h3>
                  </div>

                  <span className="text-xs bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold px-3 py-1.5 rounded-xl">
                    {isArabic ? "المستوى اللغوي:" : "Active level:"} {student.level}
                  </span>
                </div>

                {/* Progressive stats bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                  {/* unified study session & time remaining box */}
                  <div className="bg-gradient-to-br from-indigo-50/80 to-slate-50 border border-indigo-100 rounded-2xl p-4 flex flex-col justify-center text-left rtl:text-right shadow-xs relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-lg pointer-events-none" />
                    
                    <div className="space-y-3">
                      {/* Section 1: Study Session */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                            {isArabic ? "جلسة المذاكرة الحالية" : "Current Session"}
                          </p>
                          <span className={`text-sm font-extrabold font-mono transition-all ${isStudying ? "text-indigo-600 animate-pulse" : "text-slate-500"}`}>
                            {isStudying ? formatDuration(studyElapsedSeconds) : (isArabic ? "غير نشطة" : "Inactive")}
                          </span>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${isStudying ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                      </div>

                      {/* Section 2: Time Remaining */}
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                          {isArabic ? "الوقت المتبقي لليوم" : "Time Remaining Today"}
                        </p>
                        <span className="text-sm font-extrabold font-mono text-slate-700">
                          {timeRemaining}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* completed */}
                  <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                    <span className="text-2xl font-black font-display text-slate-800 font-mono">
                      {student.completedLessons.length}
                    </span>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                      {isArabic ? "عدد الدروس المكتملة" : "Completed Lessons"}
                    </p>
                  </div>

                  {/* saved vocabs */}
                  <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                    <span className="text-2xl font-black font-display text-slate-800 font-mono">
                      {student.savedWords.length}
                    </span>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                      {isArabic ? "الكلمات المحفوظة" : "Collected Words"}
                    </p>
                  </div>

                  {/* streak days */}
                  <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                    <div className="flex items-center justify-center gap-1">
                      <Flame className="w-5 h-5 text-orange-500 fill-current" />
                      <span className="text-2xl font-black font-display text-orange-600 font-mono">
                        {student.dailyStreak}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                      {isArabic ? "الأيام المتتالية" : "Consecutive Days"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* DAILY TASKS EMBEDDED DIRECTLY BELOW WELCOME STATS BANNER */}
            {student && (
              <DailyTasksSection
                student={student}
                isArabic={isArabic}
                onOpenAuth={() => setShowAuthModal(true)}
                onUpdateStudent={handleUpdateStudent}
              />
            )}

            {/* STUDY TIMER & STATISTICS SECTION */}
            {student && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* CARD 1: TIME REMAINING TODAY (SHRUNK) */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-center">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-rose-50 p-2 rounded-xl border border-rose-100 text-rose-600">
                      <Clock className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 font-display">
                        {isArabic ? "الوقت المتبقي لليوم" : "Remaining Time Today"}
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {isArabic ? "ساعات، دقائق، ثوانٍ حتى منتصف الليل" : "Until midnight"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-2.5xl sm:text-3.5xl font-black font-mono text-rose-600 bg-rose-50/50 rounded-2xl py-4 text-center tracking-wider border border-rose-100/40">
                    {timeRemaining || "00:00:00"}
                  </div>
                </div>

                {/* CARD 2: CURRENT STUDY SESSION (CLICKABLE CARD TO TOGGLE TIMER) */}
                <div 
                  onClick={() => setIsStudying(prev => !prev)}
                  className={`bg-white border rounded-3xl p-5 shadow-sm flex flex-col justify-between cursor-pointer transition-all duration-300 hover:shadow-md select-none group relative overflow-hidden ${
                    isStudying 
                      ? "border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/20" 
                      : "border-slate-200 hover:border-slate-350"
                  }`}
                >
                  <div className="flex justify-between items-center pb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl border ${isStudying ? "bg-emerald-100 border-emerald-200 text-emerald-600" : "bg-slate-100 border-slate-200 text-slate-600"}`}>
                        <PlayCircle className={`w-5 h-5 ${isStudying ? "animate-spin" : ""}`} style={{ animationDuration: isStudying ? '4s' : '0s' }} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 font-display">
                          {isArabic ? "جلسة المذاكرة الحالية" : "Current Study Session"}
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {isStudying 
                            ? (isArabic ? "اضغط لإيقاف مؤقت الجلسة" : "Click anywhere to pause")
                            : (isArabic ? "اضغط لبدء المؤقت مباشرة" : "Click anywhere to start")
                          }
                        </p>
                      </div>
                    </div>

                    {isStudying && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 animate-pulse">
                        <span className="w-1 h-1 rounded-full bg-emerald-500" />
                        {isArabic ? "قيد الاحتساب" : "Recording"}
                      </span>
                    )}
                  </div>

                  {/* Elapsed timer duration */}
                  <div className="text-3xl sm:text-4.5xl font-black font-mono text-center text-slate-800 py-3">
                    {formatDuration(studyElapsedSeconds)}
                  </div>

                  {/* Save only button */}
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // VERY IMPORTANT: stop event bubbling so we don't toggle study back on/off!
                        handleSaveStudySession();
                      }}
                      disabled={studyElapsedSeconds === 0}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        studyElapsedSeconds === 0
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 hover:shadow-indigo-200"
                      }`}
                    >
                      <Save className="w-4 h-4" />
                      <span>{isArabic ? "حفظ فقط" : "Save Only"}</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* ERRORS & OBSTACLES REGISTER CARD */}
            {student && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6" id="errors-obstacles-card">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="bg-rose-50 p-2.5 rounded-2xl border border-rose-100 text-rose-600">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-800 font-display">
                        {isArabic ? "تسجيل الأخطاء والمعيقات" : "Errors & Obstacles Log"}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {isArabic 
                          ? "سجّل أخطاءك، الصعوبات التي واجهتك، وكيفية معالجتها لترسيخ التعلم." 
                          : "Record your errors, difficulties faced, and how you resolved them to solidify learning."}
                      </p>
                    </div>
                  </div>

                  {!showErrorObstacleForm && (
                    <button
                      onClick={() => {
                        setEditingErrorObstacleId(null);
                        setFormErrorCommitted("");
                        setFormDifficultyFaced("");
                        setFormHowResolved("");
                        setShowErrorObstacleForm(true);
                      }}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-2.5 rounded-2xl text-xs transition-all shadow-md shadow-indigo-100 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isArabic ? "تسجيل سجل جديد" : "Record New Entry"}</span>
                    </button>
                  )}
                </div>

                {/* Dynamic Inline Form */}
                {showErrorObstacleForm && (
                  <form onSubmit={handleSaveErrorObstacle} className="bg-slate-50/50 border border-slate-100 p-5 sm:p-6 rounded-2xl space-y-4 animate-fade-in" id="error-obstacle-form">
                    <h4 className="text-xs font-black text-indigo-700 uppercase tracking-wider mb-2">
                      {editingErrorObstacleId 
                        ? (isArabic ? "تعديل سجل الأخطاء والمعيقات" : "Edit Log Entry") 
                        : (isArabic ? "إضافة سجل أخطاء ومعيقات جديد" : "New Log Entry")}
                    </h4>

                    <div className="space-y-4">
                      {/* 1. Errors committed */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          {isArabic ? "الأخطاء التي ارتكبتها:" : "Errors committed:"}
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={formErrorCommitted}
                          onChange={(e) => setFormErrorCommitted(e.target.value)}
                          placeholder={isArabic ? "مثال: كتابة 'He go' بدلاً من 'He goes' أو خلط الحاضر بالماضي..." : "Example: Writing 'He go' instead of 'He goes'..."}
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs leading-relaxed"
                        />
                      </div>

                      {/* 2. Difficulties faced */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          {isArabic ? "الصعوبات التي واجهتني:" : "Difficulties faced:"}
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={formDifficultyFaced}
                          onChange={(e) => setFormDifficultyFaced(e.target.value)}
                          placeholder={isArabic ? "مثال: تذكر قاعدة الفاعل المفرد والجمع أثناء المحادثة السريعة..." : "Example: Remembering the singular subject-verb rule during rapid speech..."}
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs leading-relaxed"
                        />
                      </div>

                      {/* 3. How resolved */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          {isArabic ? "كيفية معالجتها وحلها:" : "How resolved / treated:"}
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={formHowResolved}
                          onChange={(e) => setFormHowResolved(e.target.value)}
                          placeholder={isArabic ? "مثال: القيام بـ 10 تمارين قواعد يومية، وتكرار الجمل بصوت عالٍ..." : "Example: Doing 10 grammar drills daily, repeating sentences out loud..."}
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs leading-relaxed"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowErrorObstacleForm(false);
                          setEditingErrorObstacleId(null);
                        }}
                        className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer"
                      >
                        {isArabic ? "إلغاء" : "Cancel"}
                      </button>
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                      >
                        {isArabic ? "حفظ السجل" : "Save Entry"}
                      </button>
                    </div>
                  </form>
                )}

                {/* Entries List */}
                <div className="space-y-4">
                  {(!student.errorObstacles || student.errorObstacles.length === 0) ? (
                    <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-xs text-slate-400">
                        {isArabic 
                          ? "لم تقم بتسجيل أي أخطاء أو معيقات بعد. ابدأ الآن لمتابعة إنجازاتك ومعالجتها!" 
                          : "No errors or obstacles logged yet. Start now to track your fixes!"}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {student.errorObstacles.map((item) => (
                        <div key={item.id} className="bg-white border border-slate-100 hover:border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between space-y-4 relative">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-[9px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                {new Date(item.createdAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                              
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleStartEditErrorObstacle(item)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                  title={isArabic ? "تعديل" : "Edit"}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteErrorObstacle(item.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                  title={isArabic ? "حذف" : "Delete"}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Error committed */}
                            <div className="space-y-1">
                              <span className="text-[10px] font-extrabold text-rose-500 bg-rose-50/50 px-2 py-0.5 rounded-md inline-block">
                                {isArabic ? "الخطأ المرتكب" : "Error Committed"}
                              </span>
                              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                                {item.errorCommitted}
                              </p>
                            </div>

                            {/* Difficulty faced */}
                            <div className="space-y-1">
                              <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50/50 px-2 py-0.5 rounded-md inline-block">
                                {isArabic ? "الصعوبة والمشكلة" : "Difficulty / Obstacle"}
                              </span>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                {item.difficultyFaced}
                              </p>
                            </div>

                            {/* How resolved */}
                            <div className="space-y-1 border-t border-slate-50 pt-2">
                              <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50/50 px-2 py-0.5 rounded-md inline-block">
                                {isArabic ? "كيف تم الحل والمعالجة" : "Solution / Treated"}
                              </span>
                              <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                                {item.howResolved}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Announcements Feed */}
            {student && (
              <div className="space-y-4">
                <div className="text-left rtl:text-right flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-indigo-600 shrink-0" />
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-800 font-display">
                      {isArabic ? "منشورات وإعلانات الأساتذة" : "Announcements & Posts"}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isArabic 
                        ? "آخر الإرشادات والتوجيهات المنشورة لك من قبل الأستاذ." 
                        : "Latest instructions and updates published directly to you."}
                    </p>
                  </div>
                </div>

                {announcements.filter(ann => {
                  const targets = ann.targetStudentIds || [];
                  return targets.length === 0 || targets.includes("all") || targets.includes(student.uid);
                }).length === 0 ? (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center text-slate-400 text-xs font-semibold">
                    {isArabic ? "لا توجد إعلانات نشطة حالياً." : "No announcements published for you at this time."}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {announcements.filter(ann => {
                      const targets = ann.targetStudentIds || [];
                      return targets.length === 0 || targets.includes("all") || targets.includes(student.uid);
                    }).map((ann) => (
                      <div key={ann.id} className="bg-gradient-to-br from-indigo-50/40 to-slate-50/10 border border-indigo-100 rounded-2xl p-5 space-y-3 transition-all relative overflow-hidden shadow-sm">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                              {ann.teacherName || (isArabic ? "الأستاذ" : "Professor")}
                            </span>
                            <h4 className="text-sm font-extrabold text-slate-900 mt-2">{ann.title}</h4>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">
                            {new Date(ann.createdAt).toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-650 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Interactive Learning Channels Bento Grid */}
            <div className="space-y-4">
              <div className="text-left rtl:text-right">
                <h3 className="text-lg font-extrabold text-slate-800 font-display">
                  {isArabic ? "قنوات التعلم التفاعلية" : "Interactive Learning Channels"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isArabic 
                    ? "احضر الحصص التعليمية المباشرة وتفاعل مع زملائك." 
                    : "Attend real-time classes and interact with peers."}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Live Classes Card */}
                <button
                  onClick={() => setCurrentTab("live")}
                  className="flex items-start gap-4 p-5 bg-white border border-slate-200 rounded-3xl hover:border-indigo-400 hover:shadow-md transition-all text-left rtl:text-right cursor-pointer w-full"
                >
                  <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-slate-800">
                      {isArabic ? "الحصص المباشرة والندوات" : "Live Classes & Seminars"}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {isArabic
                        ? "احضر الحصص الأسبوعية المباشرة وتفاعل مع الأستاذ وزملائك."
                        : "Join our interactive live streaming sessions with native-like professors."}
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Core Curriculum Feature Categories List */}
            <div className="space-y-6">
              <div className="text-left rtl:text-right">
                <h3 className="text-lg font-extrabold text-slate-800 font-display">
                  {isArabic ? "تصفح المناهج والمهارات المشمولة" : "Core English Learning Curriculums"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isArabic 
                    ? "تغطي منصتنا كافة جوانب اللغة والمهارات الأربعة الأساسية لضمان الطلاقة الكاملة." 
                    : "Our professional board covers 7 separate language sections to guarantee natural communication."}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { id: "grammar", labelAr: "القواعد", labelEn: "Grammar", descAr: "تراكيب وأزمنة", descEn: "Tenses & Structures", color: "bg-indigo-50 border-indigo-100 text-indigo-700" },
                  { id: "reading", labelAr: "القراءة", labelEn: "Reading", descAr: "فهم واستيعاب نصوص", descEn: "Text comprehension", color: "bg-amber-50 border-amber-100 text-amber-700" },
                  { id: "writing", labelAr: "الكتابة", labelEn: "Writing", descAr: "صياغة جمل وفقرات", descEn: "Drafting essays", color: "bg-pink-50 border-pink-100 text-pink-700" },
                  { id: "listening", labelAr: "الاستماع", labelEn: "Listening", descAr: "فهم اللهجات واللكنات", descEn: "Accents training", color: "bg-purple-50 border-purple-100 text-purple-700" },
                  { id: "speaking", labelAr: "المحادثة", labelEn: "Speaking", descAr: "طلاقة وممارسة يومية", descEn: "Fluent talk", color: "bg-sky-50 border-sky-100 text-sky-700" },
                  { id: "shadowing", labelAr: "Shadowing", labelEn: "Shadowing", descAr: "محاكاة النطق الطبيعي", descEn: "Speech shadowing", color: "bg-emerald-50 border-emerald-100 text-emerald-700" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentTab("lessons");
                    }}
                    className={`p-4 border rounded-2xl text-left rtl:text-right transition-all hover:shadow-lg hover:border-indigo-400 transform hover:-translate-y-0.5 space-y-1.5 ${item.color}`}
                  >
                    <BookOpen className="w-4 h-4 shrink-0" />
                    <div>
                      <span className="block font-extrabold text-slate-800 text-xs">
                        {isArabic ? item.labelAr : item.labelEn}
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold">
                        {isArabic ? item.descAr : item.descEn}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: LESSONS & QUIZZES */}
        {currentTab === "lessons" && (
          <motion.div
            initial={{ opacity: 0, x: isArabic ? -35 : 35 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <LessonsSection
              lessons={lessons}
              student={student}
              onUpdateStudent={handleUpdateStudent}
              onOpenAuth={() => setShowAuthModal(true)}
              isArabic={isArabic}
            />
          </motion.div>
        )}

        {/* TAB 3: VOCABULARY BANK & WORD QUIZ */}
        {currentTab === "vocab" && (
          <motion.div
            initial={{ opacity: 0, x: isArabic ? -35 : 35 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <VocabularySection
              vocabulary={vocabulary}
              vocabCategories={vocabCategories}
              student={student}
              onUpdateStudent={handleUpdateStudent}
              onOpenAuth={() => setShowAuthModal(true)}
              isArabic={isArabic}
            />
          </motion.div>
        )}

        {/* TAB 4: LIVE CLASSROOM SCHEDULER */}
        {currentTab === "live" && (
          <motion.div
            initial={{ opacity: 0, x: isArabic ? -35 : 35 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <LiveClassesSection
              sessions={liveSessions}
              isArabic={isArabic}
            />
          </motion.div>
        )}

        {/* TAB 6: STUDENT PROFILE */}
        {currentTab === "profile" && (
          <motion.div
            initial={{ opacity: 0, x: isArabic ? -35 : 35 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <ProfileSection
              student={student}
              onUpdateStudent={handleUpdateStudent}
              lessons={lessons}
              vocabulary={vocabulary}
              isArabic={isArabic}
              onOpenAuth={() => setShowAuthModal(true)}
              isStudying={isStudying}
              setIsStudying={setIsStudying}
              studyElapsedSeconds={studyElapsedSeconds}
              setStudyElapsedSeconds={setStudyElapsedSeconds}
              formatDuration={formatDuration}
            />
          </motion.div>
        )}

        {/* TAB 7: HIDDEN TEACHER & PORTAL PANEL */}
        {currentTab === "teacher" && (
          <motion.div
            initial={{ opacity: 0, x: isArabic ? -35 : 35 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <TeacherDashboard
              currentTeacher={currentTeacher}
              onSelectTeacher={handleSelectTeacher}
              lessons={lessons}
              vocabulary={vocabulary}
              vocabCategories={vocabCategories}
              liveSessions={liveSessions}
              onRefreshData={fetchCurriculumData}
              isArabic={isArabic}
            />
          </motion.div>
        )}

        {/* TAB 9: WEEKLY TASKS */}
        {currentTab === "tasks_weekly" && (
          <motion.div
            initial={{ opacity: 0, x: isArabic ? -35 : 35 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <WeeklyTasksSection
              student={student}
              isArabic={isArabic}
              onOpenAuth={() => setShowAuthModal(true)}
              onUpdateStudent={handleUpdateStudent}
            />
          </motion.div>
        )}

        {/* TAB: RESOURCES */}
        {currentTab === "resources" && (
          <motion.div
            initial={{ opacity: 0, x: isArabic ? -35 : 35 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <ResourcesSection
              resources={resourcesAndTips}
              isArabic={isArabic}
              studentLevel={student?.level}
            />
          </motion.div>
        )}

        {/* TAB: TIPS */}
        {currentTab === "tips" && (
          <motion.div
            initial={{ opacity: 0, x: isArabic ? -35 : 35 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <TipsSection
              tips={resourcesAndTips}
              isArabic={isArabic}
              studentLevel={student?.level}
            />
          </motion.div>
        )}

        {/* TAB: TRAINING */}
        {currentTab === "training" && (
          <motion.div
            initial={{ opacity: 0, x: isArabic ? -35 : 35 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <TrainingSection
              student={student}
              isArabic={isArabic}
              onUpdateStudent={handleUpdateStudent}
              onOpenAuth={() => setShowAuthModal(true)}
            />
          </motion.div>
        )}

        {/* TAB: RECORDED LESSONS */}
        {currentTab === "recorded_lessons" && (
          <motion.div
            initial={{ opacity: 0, x: isArabic ? -35 : 35 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <RecordedLessonsSection
              student={student}
              isArabic={isArabic}
            />
          </motion.div>
        )}

        {/* TAB 10: ABOUT US */}
        {currentTab === "about" && (
          <motion.div
            initial={{ opacity: 0, x: isArabic ? -35 : 35 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <AboutUsSection
              isArabic={isArabic}
            />
          </motion.div>
        )}

      </main>

      {/* Persistent Beautiful Footer (Creation Date & Copyright) */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-8 text-center text-xs shrink-0 select-none pb-28 md:pb-8" id="main-footer">
        <div className="max-w-7xl mx-auto px-4 space-y-1.5">
          <p className="font-semibold text-slate-200">
            {isArabic ? "منصة Pathway Languages لتعليم اللغات" : "Pathway Languages Learning Platform"}
          </p>
          <p className="text-[11px] text-slate-500 font-mono leading-normal">
            &copy; 2026 - {isArabic ? "جميع الحقوق محفوظة. تأسست المنصة في يونيو 2026 م." : "All Rights Reserved. Created in June 2026."}
          </p>
        </div>
      </footer>

      {/* Student Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        isArabic={isArabic}
        onSuccess={handleAuthSuccess}
      />

      {/* Hidden Teacher Access Code Modal */}
      {showAccessCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl max-w-sm w-full mx-4 relative">
            <button
              onClick={() => setShowAccessCodeModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors text-lg font-bold cursor-pointer"
            >
              &times;
            </button>
            <form onSubmit={handleAccessCodeSubmit} className="space-y-4 pt-2">
              <div>
                <input
                  type="password"
                  required
                  value={accessCodeInput}
                  onChange={(e) => setAccessCodeInput(e.target.value)}
                  placeholder={isArabic ? "أدخل كود الوصول" : "Enter access code"}
                  className="w-full px-4 py-3 border border-slate-250 rounded-2xl text-center text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 font-mono"
                  autoFocus
                />
              </div>

              {accessCodeError && (
                <p className="text-center text-xs text-rose-600 font-bold">
                  {isArabic ? "الرمز المدخل غير صحيح!" : "Invalid access code!"}
                </p>
              )}

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl text-xs transition-all shadow-md shadow-indigo-100 cursor-pointer"
              >
                {isArabic ? "دخول" : "Enter"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
