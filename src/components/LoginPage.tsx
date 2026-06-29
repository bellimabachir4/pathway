import React, { useState, useEffect } from "react";
import { Chrome, Sparkles, CheckCircle2, ChevronRight, BookOpen, User, Languages, AlertCircle, HelpCircle } from "lucide-react";
import { auth, GoogleAuthProvider, signInWithPopup, db, doc, setDoc } from "../lib/firebase";
import { getStudentProfile, saveStudentProfile, getTeachers, subscribeToTeachers } from "../lib/dbService";
import { Student, Teacher } from "../types";


interface LoginPageProps {
  isArabic: boolean;
  onAuthSuccess: (uid: string, name: string, email: string) => void;
  student: Student | null;
  onUpdateStudent: (updated: Student) => void;
  onLogoClick: () => void;
}

export default function LoginPage({
  isArabic,
  onAuthSuccess,
  student,
  onUpdateStudent,
  onLogoClick,
}: LoginPageProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Onboarding wizard states
  const [step, setStep] = useState<"login" | "level" | "teacher" | "complete">("login");
  const [selectedLevel, setSelectedLevel] = useState<"A1" | "A2" | "B1" | "B2" | "C1" | "C2" | null>(null);
  const [teachersList, setTeachersList] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  // Fallback sandbox state in case Google popup gets blocked (iframe environment issue)
  const [showSandbox, setShowSandbox] = useState(false);
  const [sandboxName, setSandboxName] = useState("");
  const [sandboxEmail, setSandboxEmail] = useState("");

  // Load teachers on mount to display in step 3
  useEffect(() => {
    const unsubscribe = subscribeToTeachers((list) => {
      // Filter out disabled teachers for student registration
      const activeTeachers = list.filter(t => !t.isDisabled);
      setTeachersList(activeTeachers);
    });
    return unsubscribe;
  }, []);

  // Determine starting step based on student object
  useEffect(() => {
    if (student) {
      if (!student.selectedLevelCode) {
        setStep("level");
      } else if (!student.selectedTeacherId) {
        setStep("teacher");
      } else {
        setStep("complete");
      }
    } else {
      setStep("login");
    }
  }, [student]);

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      if (!auth) {
        throw new Error("Firebase auth not initialized");
      }
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      onAuthSuccess(user.uid, user.displayName || "Student User", user.email || "student@gmail.com");
    } catch (e: any) {
      console.warn("Google Sign-In failed, fallback enabled:", e);
      setError(
        isArabic
          ? "تنبيه: تم تفعيل تسجيل الدخول التجريبي لتسهيل الدخول داخل الإطار."
          : "Notice: Enabled sandbox entry to support the iframe environment."
      );
      setShowSandbox(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSandboxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sandboxName.trim() || !sandboxEmail.trim()) return;
    const cleanEmail = sandboxEmail.trim().toLowerCase();
    const sandboxUid = `user_${btoa(cleanEmail).replace(/=/g, "").slice(0, 10)}`;
    onAuthSuccess(sandboxUid, sandboxName.trim(), cleanEmail);
  };

  // Step 2: Level selection helper
  const levels: ("A1" | "A2" | "B1" | "B2" | "C1" | "C2")[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
  
  const levelNamesEn: Record<string, string> = {
    A1: "Beginner / Breakthrough",
    A2: "Elementary / Waystage",
    B1: "Intermediate / Threshold",
    B2: "Upper Intermediate / Vantage",
    C1: "Advanced / Effective Operational Proficiency",
    C2: "Mastery / Highly Proficient",
  };

  const levelNamesAr: Record<string, string> = {
    A1: "مبتدئ / أساسي",
    A2: "مبتدئ متقدم",
    B1: "متوسط / متوسط أساسي",
    B2: "فوق المتوسط",
    C1: "متقدم / احترافي",
    C2: "مستوى الإتقان التام",
  };

  const handleSelectLevel = async (lvl: "A1" | "A2" | "B1" | "B2" | "C1" | "C2") => {
    setSelectedLevel(lvl);
    if (student) {
      const updated: Student = {
        ...student,
        level: lvl,
        selectedLevelCode: lvl,
        selectedLanguage: "English",
      };
      await saveStudentProfile(updated, student.selectedTeacherId || "teacher-sarah");
      onUpdateStudent(updated);
    }
    setStep("teacher");
  };

  // Step 3: Teacher selection helper
  const handleSelectTeacher = async (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    if (student) {
      const updated: Student = {
        ...student,
        selectedTeacherId: teacher.uid,
        selectedTeacherName: teacher.name,
        level: selectedLevel || student.level || "A1",
        selectedLevelCode: selectedLevel || student.selectedLevelCode || "A1",
        selectedLanguage: "English",
      };
      
      // Save to Firebase
      await saveStudentProfile(updated, teacher.uid);
      onUpdateStudent(updated);
    }
    setStep("complete");
  };

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 font-sans" id="login-onboarding-container">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-100 shadow-2xl relative overflow-hidden transition-all duration-500">
        
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />
        
        {/* LOGO REMOVED */}
        <div className="text-center flex flex-col items-center">
          
          <h2 className="mt-4 text-3xl font-extrabold text-slate-800 font-display tracking-tight">
            Pathway <span className="text-indigo-600">Languages</span>
          </h2>
          
          <p className="mt-2 text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            {isArabic 
              ? "منصة تعليمية متطورة لتطوير مهاراتك اللغوية مع معلمين متخصصين ودروس تفاعلية ومتابعة ذكية."
              : "An interactive, world-class language platform with specialized tutors and rich step-by-step curricula."}
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100">
          
          {/* STEP 1: LOGIN */}
          {step === "login" && (
            <div className="space-y-6 animate-fade-in" id="step-login-box">
              <div className="text-center">
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {isArabic ? "تسجيل دخول آمن" : "Secure Login"}
                </span>
                <h3 className="text-lg font-bold text-slate-800 mt-2">
                  {isArabic ? "ابدأ رحلتك التعليمية اليوم" : "Start your learning journey today"}
                </h3>
              </div>

              {error && (
                <div className="flex gap-2.5 bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-[11px] text-amber-800 leading-relaxed">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* ONLY ONE BUTTON: Google Sign In */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-lg shadow-neutral-200 hover:shadow-neutral-300 disabled:opacity-50 cursor-pointer text-sm"
                id="main-google-login-btn"
              >
                <Chrome className="w-5 h-5 text-white stroke-[2.5]" />
                <span>
                  {loading 
                    ? (isArabic ? "جاري الاتصال..." : "Connecting...") 
                    : (isArabic ? "تسجيل الدخول بواسطة Google" : "Sign in with Google")}
                </span>
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>{isArabic ? "تسجيل دخول فوري مشفر بنقرة واحدة" : "Instant secured one-click authentication"}</span>
              </div>

              {/* Invisible fallback input fields in case iframe stops popups */}
              {showSandbox && (
                <form onSubmit={handleSandboxSubmit} className="pt-4 border-t border-dashed border-slate-200 mt-4 space-y-3 animate-fade-in">
                  <div className="text-center pb-1">
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
                      {isArabic ? "تسجيل سريع بديل" : "Sandbox Fast Sign-in"}
                    </span>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder={isArabic ? "اسم الطالب" : "Student Name"}
                      required
                      value={sandboxName}
                      onChange={(e) => setSandboxName(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="student@gmail.com"
                      required
                      value={sandboxEmail}
                      onChange={(e) => setSandboxEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-slate-100 hover:bg-indigo-50 text-indigo-700 border border-slate-200 font-bold py-2 rounded-xl text-xs transition-all"
                  >
                    {isArabic ? "تسجيل الدخول التجريبي" : "Proceed with Sandbox User"}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* STEP 2: LEVEL SELECTION */}
          {step === "level" && (
            <div className="space-y-6 animate-fade-in" id="step-level-box">
              <div className="text-center">
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 w-max mx-auto">
                  <BookOpen className="w-3.5 h-3.5" />
                  {isArabic ? "الخطوة 1 من 3" : "Step 1 of 3"}
                </span>
                <h3 className="text-lg font-bold text-slate-800 mt-2">
                  {isArabic ? "حدد مستواك الدراسي الحالي" : "Select Your Current English Level"}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isArabic 
                    ? "اختر المستوى المناسب لعرض الدروس المخصصة لك:" 
                    : "Select the level that fits you to load the appropriate material:"}
                </p>
              </div>

              <div className="space-y-3">
                {levels.map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => handleSelectLevel(lvl)}
                    className="w-full text-left rtl:text-right p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-500 hover:shadow-md transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-black text-sm flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        {lvl}
                      </div>
                      <div>
                        <span className="block font-bold text-slate-800 text-xs">
                          {isArabic ? levelNamesAr[lvl] : levelNamesEn[lvl]}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                          {isArabic ? "منهاج معتمد بالكامل" : "Verified Pathway Curriculum"}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: TEACHER SELECTION */}
          {step === "teacher" && (
            <div className="space-y-6 animate-fade-in" id="step-teacher-box">
              <div className="text-center">
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 w-max mx-auto">
                  <User className="w-3.5 h-3.5" />
                  {isArabic ? "الخطوة 2 من 3" : "Step 2 of 3"}
                </span>
                <h3 className="text-lg font-bold text-slate-800 mt-2">
                  {isArabic ? "اختر الأستاذ المفضل لديك" : "Choose Your Preferred Tutor"}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isArabic 
                    ? "اختر معلماً لمساعدتك في تصحيح الأخطاء والإجابة عن تساؤلاتك:" 
                    : "Select a teacher who will explain grammar, correct vocabulary, and chat with you:"}
                </p>
              </div>

              <div className="space-y-3.5">
                {teachersList.map((teacherItem) => (
                  <button
                    key={teacherItem.uid}
                    onClick={() => handleSelectTeacher(teacherItem)}
                    className="w-full text-left rtl:text-right p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-500 hover:shadow-md transition-all flex items-center gap-3.5 group cursor-pointer"
                  >
                    {teacherItem.photoUrl ? (
                      <img
                        src={teacherItem.photoUrl}
                        alt={teacherItem.name}
                        className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-slate-100 shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-100 to-indigo-50 text-indigo-700 font-extrabold text-base flex items-center justify-center shrink-0 border border-indigo-100 shadow-sm group-hover:from-indigo-600 group-hover:to-indigo-500 group-hover:text-white transition-all">
                        {teacherItem.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <span className="block font-extrabold text-slate-800 text-xs group-hover:text-indigo-600 transition-all truncate">
                        {teacherItem.name}
                      </span>
                      <span className="text-[10px] text-indigo-600 font-medium block mt-0.5 truncate">
                        {isArabic ? (teacherItem.specialtyAr || "أستاذ متخصص") : (teacherItem.specialty || "Specialized Tutor")}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        {isArabic ? "نشط حالياً • متاح للرد الفوري" : "Currently active • Ready to assist"}
                      </span>
                    </div>

                    <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                      {isArabic ? "اختيار" : "Select"}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: SETUP COMPLETED */}
          {step === "complete" && (
            <div className="space-y-6 text-center animate-fade-in" id="step-complete-box">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm border border-emerald-100 scale-110 animate-bounce">
                <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-slate-800">
                  {isArabic ? "تم إكمال الإعداد بنجاح!" : "Account Setup Complete!"}
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  {isArabic 
                    ? "تم إنشاء ملفك الشخصي بالكامل وربط معلمك ومنهاجك تلقائياً داخل الخوادم."
                    : "Your personalized learning profile and curriculum have been synchronized in Firebase!"}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left rtl:text-right space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">{isArabic ? "اللغة:" : "Language:"}</span>
                  <span className="font-bold text-slate-800">🇬🇧 English</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isArabic ? "المستوى الدراسي:" : "Study Level:"}</span>
                  <span className="font-bold text-indigo-600 font-mono text-[11px] bg-indigo-50 px-2 py-0.5 rounded">
                    {student?.level || selectedLevel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isArabic ? "المعلم المرافق:" : "Your Tutor:"}</span>
                  <span className="font-bold text-slate-800 truncate max-w-[150px]">
                    {student?.selectedTeacherName || selectedTeacher?.name || "Sarah"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  window.location.reload();
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-2xl transition-all shadow-lg shadow-indigo-100 cursor-pointer text-xs"
              >
                {isArabic ? "دخول لوحة التحكم المباشرة" : "Enter Interactive Learning Board"}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}