import React, { useState } from "react";
import { Student, Lesson, Vocabulary } from "../types";
import { Award, BookOpen, Star, Flame, Calendar, Clock, Smile, Trash2, ArrowRight, Play, Square, Activity, Percent } from "lucide-react";

interface ProfileSectionProps {
  student: Student | null;
  onUpdateStudent: (updated: Student) => void;
  lessons: Lesson[];
  vocabulary: Vocabulary[];
  isArabic: boolean;
  onOpenAuth: () => void;
  isStudying?: boolean;
  setIsStudying?: (val: boolean) => void;
  studyElapsedSeconds?: number;
  setStudyElapsedSeconds?: (val: number) => void;
  formatDuration?: (secs: number) => string;
}

export default function ProfileSection({
  student,
  onUpdateStudent,
  lessons,
  vocabulary,
  isArabic,
  onOpenAuth,
  isStudying,
  setIsStudying,
  studyElapsedSeconds,
  setStudyElapsedSeconds,
  formatDuration,
}: ProfileSectionProps) {
  
  if (!student) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-6 shadow-xl animate-fade-in" id="profile-guest-view">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-md">
          <Smile className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold font-display text-slate-850 text-slate-800">
            {isArabic ? "سجل كطالب لمتابعة إنجازك" : "Create a Student Account"}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {isArabic
              ? "انضم إلينا اليوم لحفظ كلماتك المفضلة، وحل اختبارات القواعد، ومراقبة مستوى تقدمك، والتحدث مع المعلم الذكي لحفظ جلساتك."
              : "Register or log in to track your English proficiency progress, save customized vocabulary lists, study lessons, and chat with teachers."}
          </p>
        </div>

        <button
          onClick={onOpenAuth}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md shadow-indigo-100"
        >
          {isArabic ? "تسجيل الدخول / إنشاء حساب" : "Sign In / Join Now"}
        </button>
      </div>
    );
  }

  // Local fallback states in case they are not passed from parent
  const [localIsStudying, setLocalIsStudying] = useState(false);
  const [localStudySeconds, setLocalStudySeconds] = useState(0);
  
  const activeIsStudying = isStudying !== undefined ? isStudying : localIsStudying;
  const activeStudySeconds = studyElapsedSeconds !== undefined ? studyElapsedSeconds : localStudySeconds;
  
  // Local timer effect in case parent doesn't provide it
  React.useEffect(() => {
    let interval: any = null;
    if (isStudying === undefined && localIsStudying) {
      interval = setInterval(() => {
        setLocalStudySeconds(p => p + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [localIsStudying, isStudying]);

  const handleToggleStudy = async () => {
    if (student) {
      if (activeIsStudying) {
        if (setIsStudying) setIsStudying(false);
        else setLocalIsStudying(false);
        
        const added = activeStudySeconds;
        if (setStudyElapsedSeconds) setStudyElapsedSeconds(0);
        else setLocalStudySeconds(0);
        
        const updated = {
          ...student,
          studySecondsToday: (student.studySecondsToday || 0) + added,
          studySecondsThisWeek: (student.studySecondsThisWeek || 0) + added,
          studySecondsTotal: (student.studySecondsTotal || 0) + added,
        };
        await onUpdateStudent(updated);
      } else {
        if (setIsStudying) setIsStudying(true);
        else {
          setLocalStudySeconds(0);
          setLocalIsStudying(true);
        }
        if (setStudyElapsedSeconds) setStudyElapsedSeconds(0);
      }
    }
  };

  const formatTimeLocal = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = (v: number) => String(v).padStart(2, "0");
    if (h > 0) {
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(m)}:${pad(s)}`;
  };

  // Get list of saved words objects
  const savedWordsList = vocabulary.filter(v => student.savedWords.includes(v.id));
  
  // Get list of completed lessons objects
  const completedLessonsList = lessons.filter(l => student.completedLessons.includes(l.id));

  const handleLevelChange = (newLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2") => {
    onUpdateStudent({
      ...student,
      level: newLevel,
      selectedLevelCode: newLevel
    });
  };

  const handleRemoveSavedWord = (wordId: string) => {
    onUpdateStudent({
      ...student,
      savedWords: student.savedWords.filter(id => id !== wordId)
    });
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="profile-student-view">
      {/* Student Profile Card Header */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left rtl:md:text-right">
            {/* Student Photo */}
            <div className="w-18 h-18 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-2xl uppercase shadow-inner shrink-0">
              {student.name.charAt(0)}
            </div>
            
            <div className="space-y-1.5">
              <h2 className="text-xl font-extrabold font-display text-slate-800">
                {student.name}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {student.email}
              </p>

              {/* Level Display */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 justify-center md:justify-start">
                <div className="flex items-center gap-1.5 justify-center md:justify-start">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {isArabic ? "مستوى اللغة الحالي:" : "Current Level:"}
                  </span>
                  <span className="bg-indigo-50 text-indigo-700 text-xs font-extrabold px-2.5 py-1 rounded-lg border border-indigo-100 font-mono">
                    {student.level}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 justify-center md:justify-start">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {isArabic ? "الأستاذ الحالي:" : "Current Teacher:"}
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-extrabold px-2.5 py-1 rounded-lg border border-emerald-100">
                    {student.selectedTeacherName || "Sarah / سارة"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Level Progress bar */}
          <div className="w-full md:w-64 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-500">
              <span>{isArabic ? "مستوى تقدم المنصة" : "Platform Progress"}</span>
              <span className="font-mono">{student.progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${student.progress}%` }}
              />
            </div>
            <span className="block text-[10px] text-slate-400 text-center md:text-right rtl:md:text-left font-mono">
              {student.completedLessons.length} / {lessons.length} {isArabic ? "دروس مكتملة" : "Lessons finished"}
            </span>
          </div>
        </div>
      </div>

      {/* Statistics Block Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* 1. Daily Streak */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm relative overflow-hidden group flex flex-col justify-between min-h-[140px]">
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-2">
            <Flame className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="block text-xl font-black font-display text-slate-800 font-mono">
              {student.dailyStreak} {isArabic ? "أيام" : "Days"}
            </span>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
              {isArabic ? "الأيام المتتالية" : "Daily Streak"}
            </p>
          </div>
        </div>

        {/* 2. Saved Vocabulary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm relative overflow-hidden group flex flex-col justify-between min-h-[140px]">
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-2">
            <Star className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="block text-xl font-black font-display text-slate-800 font-mono">
              {student.savedWords.length}
            </span>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
              {isArabic ? "الكلمات المحفوظة" : "Saved Vocabulary"}
            </p>
          </div>
        </div>

        {/* 3. Completed Lessons */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm relative overflow-hidden group flex flex-col justify-between min-h-[140px]">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
            <BookOpen className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="block text-xl font-black font-display text-slate-800 font-mono">
              {student.completedLessons.length}
            </span>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
              {isArabic ? "الدروس المكتملة" : "Completed Lessons"}
            </p>
          </div>
        </div>

        {/* 4. Total Progress */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm relative overflow-hidden group flex flex-col justify-between min-h-[140px]">
          <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center mx-auto mb-2">
            <Percent className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="block text-xl font-black font-display text-slate-800 font-mono">
              {student.progress}%
            </span>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
              {isArabic ? "نسبة التقدم الكلي" : "Total Progress"}
            </p>
          </div>
        </div>
      </div>

      {/* Two Columns List Area (Saved Vocabs & Completed Lessons) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Saved Vocabulary List */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm font-display flex items-center gap-2">
              <Star className="w-4 h-4 text-teal-600" />
              <span>{isArabic ? "بنك مفرداتي المحفوظة" : "My Saved Dictionary"}</span>
            </h3>

            <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-2.5 py-0.5 rounded-full">
              {savedWordsList.length} {isArabic ? "كلمة" : "words"}
            </span>
          </div>

          {savedWordsList.length > 0 ? (
            <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
              {savedWordsList.map((word) => (
                <div
                  key={word.id}
                  className="flex justify-between items-center p-3 bg-slate-50 hover:bg-teal-50/20 border border-slate-200 rounded-xl transition-all"
                >
                  <div className="text-left rtl:text-right space-y-0.5">
                    <span className="font-extrabold text-slate-800 text-sm">{word.word}</span>
                    <p className="text-xs text-teal-600 font-medium">{word.translation}</p>
                    {word.example && <p className="text-[10px] text-slate-400 italic">"{word.example}"</p>}
                  </div>

                  <button
                    onClick={() => handleRemoveSavedWord(word.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 transition-colors"
                    title={isArabic ? "إزالة الحفظ" : "Remove bookmark"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl">
              <Smile className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400">
                {isArabic
                  ? "لم تقم بحفظ أي كلمات حتى الآن. اضغط على علامة الحفظ في صفحة المفردات."
                  : "No bookmark saved. Hit bookmark button on the Vocabulary tab to practice later."}
              </p>
            </div>
          )}
        </div>

        {/* Finished Lessons List */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm font-display flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>{isArabic ? "الشهادات والدروس المكتملة" : "Finished Certificates & Lessons"}</span>
            </h3>

            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full">
              {completedLessonsList.length} {isArabic ? "درس" : "lessons"}
            </span>
          </div>

          {completedLessonsList.length > 0 ? (
            <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
              {completedLessonsList.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex justify-between items-center p-3 bg-slate-50 hover:bg-indigo-50/20 border border-slate-200 rounded-xl transition-all"
                >
                  <div className="text-left rtl:text-right space-y-0.5">
                    <span className="font-extrabold text-slate-800 text-xs font-display">
                      {isArabic ? lesson.titleAr : lesson.title}
                    </span>
                    <p className="text-[10px] text-slate-400">
                      {isArabic ? lesson.category : lesson.category.toUpperCase()} • {lesson.level}
                    </p>
                  </div>

                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-100">
                    {isArabic ? "درجة كاملة" : "100% Score"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl">
              <Smile className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400">
                {isArabic
                  ? "لم تكتمل أي دروس حتى الآن. انطلق لحل اختبارات الدروس وكسب نقاط الطريق!"
                  : "No lessons completed. Take some quizzes on the Lessons tab and gain awesome awards!"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
