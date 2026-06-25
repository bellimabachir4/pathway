import React, { useState, useEffect } from "react";
import Navigation from "./components/Navigation";
import LessonsSection from "./components/LessonsSection";
import VocabularySection from "./components/VocabularySection";
import LiveClassesSection from "./components/LiveClassesSection";
import ContactTeacherSection from "./components/ContactTeacherSection";
import ProfileSection from "./components/ProfileSection";
import TeacherDashboard from "./components/TeacherDashboard";
import AuthModal from "./components/AuthModal";
import LoginPage from "./components/LoginPage";
import SidebarMenu from "./components/SidebarMenu";
import DailyTasksSection from "./components/DailyTasksSection";
import WeeklyTasksSection from "./components/WeeklyTasksSection";
import AboutUsSection from "./components/AboutUsSection";

import { Student, Teacher, Lesson, Vocabulary, LiveSession, Announcement } from "./types";
import { 
  getLessons, 
  getVocabulary, 
  getLiveSessions, 
  getStudentProfile, 
  saveStudentProfile,
  clearAllTeachers,
  getAnnouncements
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
  MessageSquare
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
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Load curriculum from database on start
  const fetchCurriculumData = async (teacherId?: string) => {
    const targetId = teacherId || currentTeacher?.uid || "teacher-thomas";
    const lList = await getLessons(targetId);
    const vList = await getVocabulary(targetId);
    const sList = await getLiveSessions(targetId);
    const aList = await getAnnouncements();
    setLessons(lList);
    setVocabulary(vList);
    setLiveSessions(sList);
    setAnnouncements(aList);
  };

  useEffect(() => {
    // One-time teacher database reset check to empty states as requested
    const hasResetTeachers = localStorage.getItem("ep_teachers_reset_v4");
    if (!hasResetTeachers) {
      clearAllTeachers().then(() => {
        localStorage.setItem("ep_teachers_reset_v4", "true");
        window.location.reload();
      });
      return;
    }

    let activeTeacherId = "teacher-thomas";
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
          // Re-sync with database under the active teacher
          getStudentProfile(parsed.uid, parsed.name, parsed.email, activeTeacherId).then((profile) => {
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
    const targetId = currentTeacher?.uid || "teacher-thomas";
    await saveStudentProfile(updatedStudent, targetId);
  };

  // Google/Sandbox Auth success
  const handleAuthSuccess = async (uid: string, name: string, email: string) => {
    const targetId = currentTeacher?.uid || "teacher-thomas";
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
      fetchCurriculumData("teacher-thomas");
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
            
            {/* Hero Section */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-lg shadow-slate-100 relative overflow-hidden">
              <div className="lg:col-span-3 space-y-6 text-left rtl:text-right relative z-10">
                <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold border border-indigo-100">
                  <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" style={{ animationDuration: '3s' }} />
                  <span>{isArabic ? "تعليم مبتكر ومبسط لجميع المستويات" : "Smart Pathway to English Fluency"}</span>
                </div>

                <div className="space-y-3">
                  <h1 className="text-3.5xl sm:text-5xl font-black font-display tracking-tight text-slate-900 leading-tight">
                    {isArabic ? "طريقك الأسهل لإتقان" : "Your Ultimate Pathway to"}{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-700">
                      {isArabic ? "اللغة الإنجليزية" : "Mastering English"}
                    </span>
                  </h1>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg">
                    {isArabic
                      ? "منصة English Pathway متخصصة في تدريس اللغة الإنجليزية لجميع المستويات من المبتدئ إلى المتقدم. مع واجهات مريحة، اختبارات لغوية متكاملة، ونظام حواري ذكي لمرافقية إنجازك الدراسي يوماً بيوم."
                      : "English Pathway is an interactive hub engineered to teach writing, speaking, pronunciation, and reading for levels from Beginner to Advanced. Explore structured lessons and speak with native tutors."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 pt-2 justify-start">
                  <button
                    onClick={() => setCurrentTab("lessons")}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-6 py-3.5 rounded-2xl text-xs sm:text-sm transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300"
                    id="start-learning-hero-btn"
                  >
                    <span>{isArabic ? "ابدأ رحلة التعلم الآن" : "Start Learning Now"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setCurrentTab("vocab")}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold px-6 py-3.5 rounded-2xl text-xs sm:text-sm transition-all"
                  >
                    <span>{isArabic ? "تصفح بنك المفردات" : "Explore Vocab Bank"}</span>
                  </button>
                </div>
              </div>

              {/* Decorative graphic / stats overview */}
              <div className="lg:col-span-2 flex justify-center items-center relative min-h-[220px]">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50 to-indigo-100/40 rounded-3xl -rotate-2 transform scale-95" />
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-lg rotate-1 transform hover:rotate-0 transition-transform relative z-10 w-full max-w-sm space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                      {isArabic ? "إحصائيات المنصة الكلية" : "Platform Live Stats"}
                    </span>
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-left rtl:text-right space-y-0.5">
                      <span className="block text-2xl font-black font-display text-slate-900 font-mono">
                        {lessons.length || 3}
                      </span>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        {isArabic ? "دروس حية" : "Active Lessons"}
                      </p>
                    </div>

                    <div className="text-left rtl:text-right space-y-0.5">
                      <span className="block text-2xl font-black font-display text-slate-900 font-mono">
                        {vocabulary.length || 4}
                      </span>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        {isArabic ? "كلمات وجمل" : "Vocabulary"}
                      </p>
                    </div>

                    <div className="text-left rtl:text-right space-y-0.5">
                      <span className="block text-2xl font-black font-display text-slate-900 font-mono">
                        {liveSessions.length || 2}
                      </span>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        {isArabic ? "حصص قادمة" : "Live Classes"}
                      </p>
                    </div>

                    <div className="text-left rtl:text-right space-y-0.5">
                      <span className="block text-2xl font-black font-display text-slate-900 font-mono">
                        3
                      </span>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        {isArabic ? "مستويات" : "Levels"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

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
                  {/* progres */}
                  <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                    <span className="text-2xl font-black font-display text-indigo-600 font-mono">
                      {student.progress}%
                    </span>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                      {isArabic ? "نسبة التقدم الكلي" : "Completion Ratio"}
                    </p>
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
                    ? "تواصل مباشرة مع أساتذتك واحضر الحصص التعليمية المباشرة." 
                    : "Connect directly with your instructors and attend real-time classes."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Live Classes Card */}
                <button
                  onClick={() => setCurrentTab("live")}
                  className="flex items-start gap-4 p-5 bg-white border border-slate-200 rounded-3xl hover:border-indigo-400 hover:shadow-md transition-all text-left rtl:text-right cursor-pointer"
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

                {/* Contact Teacher Card */}
                <button
                  onClick={() => {
                    if (student) {
                      setCurrentTab("chat");
                    } else {
                      setShowAuthModal(true);
                    }
                  }}
                  className="flex items-start gap-4 p-5 bg-white border border-slate-200 rounded-3xl hover:border-indigo-400 hover:shadow-md transition-all text-left rtl:text-right cursor-pointer"
                >
                  <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-slate-800">
                      {isArabic ? "تواصل مباشر مع الأستاذ" : "Direct Contact with Instructor"}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {isArabic
                        ? "اطرح أسئلتك على الأستاذ وتلقى التوجيه والدعم الفردي الفوري."
                        : "Ask questions, submit your essays, and receive direct personalized feedback."}
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

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                {[
                  { id: "grammar", labelAr: "القواعد", labelEn: "Grammar", descAr: "تراكيب وأزمنة", descEn: "Tenses & Structures", color: "bg-indigo-50 border-indigo-100 text-indigo-700" },
                  { id: "vocabulary", labelAr: "المفردات", labelEn: "Vocabulary", descAr: "ثروة لغوية متكاملة", descEn: "Rich expressions", color: "bg-teal-50 border-teal-100 text-teal-700" },
                  { id: "reading", labelAr: "القراءة", labelEn: "Reading", descAr: "فهم واستيعاب نصوص", descEn: "Text comprehension", color: "bg-amber-50 border-amber-100 text-amber-700" },
                  { id: "writing", labelAr: "الكتابة", labelEn: "Writing", descAr: "صياغة جمل وفقرات", descEn: "Drafting essays", color: "bg-pink-50 border-pink-100 text-pink-700" },
                  { id: "listening", labelAr: "الاستماع", labelEn: "Listening", descAr: "فهم اللهجات واللكنات", descEn: "Accents training", color: "bg-purple-50 border-purple-100 text-purple-700" },
                  { id: "speaking", labelAr: "المحادثة", labelEn: "Speaking", descAr: "طلاقة وممارسة يومية", descEn: "Fluent talk", color: "bg-sky-50 border-sky-100 text-sky-700" },
                  { id: "pronunciation", labelAr: "النطق السليم", labelEn: "Pronunciation", descAr: "مخارج الحروف الصحيحة", descEn: "Phonetic sounds", color: "bg-emerald-50 border-emerald-100 text-emerald-700" },
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

        {/* TAB 5: CONTACT SMART AI TEACHER */}
        {currentTab === "chat" && (
          <motion.div
            initial={{ opacity: 0, x: isArabic ? -35 : 35 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <ContactTeacherSection
              student={student}
              teacher={currentTeacher}
              isArabic={isArabic}
              onOpenAuth={() => setShowAuthModal(true)}
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
              liveSessions={liveSessions}
              onRefreshData={fetchCurriculumData}
              isArabic={isArabic}
            />
          </motion.div>
        )}

        {/* TAB 8: DAILY TASKS */}
        {currentTab === "tasks_daily" && (
          <motion.div
            initial={{ opacity: 0, x: isArabic ? -35 : 35 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <DailyTasksSection
              student={student}
              isArabic={isArabic}
              onOpenAuth={() => setShowAuthModal(true)}
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
            {isArabic ? "منصة English Pathway لتعليم اللغة الإنجليزية" : "English Pathway Learning Platform"}
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
