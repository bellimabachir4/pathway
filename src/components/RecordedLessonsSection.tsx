import React, { useState, useEffect } from "react";
import { RecordedLesson, Student } from "../types";
import { getRecordedLessons, subscribeToRecordedLessons } from "../lib/dbService";
import { Play, PlayCircle, Eye, EyeOff, Calendar, Award, Sparkles, AlertCircle, Film, BookOpen, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RecordedLessonsSectionProps {
  student: Student | null;
  isArabic: boolean;
}

export default function RecordedLessonsSection({ student, isArabic }: RecordedLessonsSectionProps) {
  const [lessons, setLessons] = useState<RecordedLesson[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>(student?.level || "A1");
  const [activeVideo, setActiveVideo] = useState<RecordedLesson | null>(null);

  useEffect(() => {
    // Subscribe to recorded lessons in real-time
    const unsubscribe = subscribeToRecordedLessons((list) => {
      setLessons(list);
    }, student?.selectedTeacherId);
    return () => unsubscribe();
  }, [student?.selectedTeacherId]);

  // Sync selectedLevel with student profile level when profile changes
  useEffect(() => {
    if (student?.level) {
      setSelectedLevel(student.level);
    }
  }, [student?.level]);

  // Filter lessons by selected level
  const filteredLessons = lessons
    .filter((lesson) => lesson.level === selectedLevel)
    .sort((a, b) => a.order - b.order);

  // Helper to convert typical YouTube/Vimeo links into embed URLs
  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    let embedUrl = url;
    
    // YouTube Watch URL: https://www.youtube.com/watch?v=XXXX
    if (url.includes("youtube.com/watch")) {
      try {
        const urlObj = new URL(url);
        const v = urlObj.searchParams.get("v");
        if (v) {
          embedUrl = `https://www.youtube.com/embed/${v}?autoplay=1&rel=0`;
        }
      } catch {}
    } 
    // YouTube Short URL: https://youtu.be/XXXX
    else if (url.includes("youtu.be/")) {
      try {
        const parts = url.split("youtu.be/");
        if (parts[1]) {
          const id = parts[1].split(/[?#]/)[0];
          embedUrl = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
        }
      } catch {}
    } 
    // Already an embed URL
    else if (url.includes("youtube.com/embed/")) {
      if (!url.includes("autoplay=")) {
        embedUrl = url.includes("?") ? `${url}&autoplay=1` : `${url}?autoplay=1`;
      }
    }
    
    return embedUrl;
  };

  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];

  return (
    <div className="space-y-8 animate-fade-in" id="recorded-lessons-view">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-rose-950 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl shadow-rose-100">
        <div className="relative z-10 max-w-xl text-left rtl:text-right space-y-4">
          <span className="inline-block bg-rose-500/30 text-rose-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {isArabic ? "أرشيف الحصص المسجلة" : "Recorded Class Library"}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display leading-tight">
            {isArabic ? "شاهد وراجع الحصص في أي وقت" : "Watch & Review Classes Anytime"}
          </h2>
          <p className="text-neutral-200 text-xs leading-relaxed">
            {isArabic
              ? "مكتبة الحصص المسجلة تتيح لك العودة لأي درس فائت لمراجعته وتثبيت المفاهيم. رتب الحصص وشاهد الشرح مباشرةً بدقة عالية."
              : "Access the full archive of pre-recorded visual lectures structured for your language pathway. Catch up on grammar explanations, pronunciation tips, and study at your own pace."}
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 rtl:left-0 rtl:right-auto">
          <Film className="w-72 h-72 -mr-12 -mb-12" />
        </div>
      </div>

      {/* Level Selector Tabs */}
      {!student && (
        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex flex-wrap gap-2 items-center justify-between">
          <span className="text-xs font-extrabold text-slate-500 px-2">
            {isArabic ? "تصفية حسب المستوى الدراسي:" : "Filter by Proficiency Level:"}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {levels.map((lvl) => {
              const isStudentLvl = student?.level === lvl;
              const isSelected = selectedLevel === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => {
                    setSelectedLevel(lvl);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-rose-600 text-white shadow-md shadow-rose-100"
                      : "bg-slate-50 hover:bg-slate-150 text-slate-700 border border-slate-100"
                  }`}
                >
                  <span>{lvl}</span>
                  {isStudentLvl && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
                      isSelected ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-700"
                    }`}>
                      {isArabic ? "مستواك الحالي" : "Your Level"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid List of Cards */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <h3 className="font-bold text-slate-800 text-base font-display flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-rose-600" />
            <span>
              {isArabic 
                ? `الحصص المسجلة للمستوى (${selectedLevel})` 
                : `Recorded Lessons for Level (${selectedLevel})`}
            </span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {filteredLessons.length} {isArabic ? "حصص متوفرة" : "Available lessons"}
          </span>
        </div>

        {filteredLessons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLessons.map((lesson, idx) => {
              return (
                <div
                  key={lesson.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden group"
                  id={`recorded-lesson-card-${lesson.id}`}
                >
                  {/* Lesson Order Badge in top right/left */}
                  <div className="absolute top-0 right-0 bg-rose-50 text-rose-700 font-mono text-[10px] font-black px-3 py-1 rounded-bl-xl border-l border-b border-rose-100 uppercase">
                    {isArabic ? "الحصة" : "Lesson"} #{lesson.order}
                  </div>

                  <div className="space-y-4 pt-2">
                    {/* Level and Topic Metadata */}
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black bg-rose-50 text-rose-600 px-2 py-0.5 rounded uppercase font-mono">
                        {lesson.level}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[150px]">
                        {lesson.topic}
                      </span>
                    </div>

                    {/* Title */}
                    <div className="text-left rtl:text-right space-y-1">
                      <h4 className="font-extrabold text-slate-900 text-sm sm:text-base font-display group-hover:text-rose-700 transition-colors leading-snug">
                        {lesson.title}
                      </h4>
                    </div>
                  </div>

                  {/* Play Trigger Footer */}
                  <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between bg-white relative z-10">
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-350" />
                      <span>{new Date(lesson.createdAt || Date.now()).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}</span>
                    </span>

                    <button
                      onClick={() => {
                        window.open(lesson.videoUrl, "_blank");
                      }}
                      className="flex items-center gap-1.5 text-xs font-extrabold px-4 py-2 rounded-xl transition-all cursor-pointer bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-150 hover:scale-[1.02]"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>{isArabic ? "مشاهدة الحصة" : "Watch Session"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white text-center py-16 rounded-3xl border border-dashed border-slate-250">
            <PlayCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-extrabold text-slate-700 text-sm font-display">
              {isArabic ? "لا توجد حصص مسجلة متوفرة" : "No Recorded Lessons Found"}
            </h4>
            <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto leading-relaxed">
              {isArabic
                ? "لم يقم الأستاذ بإضافة أي حصص مسجلة لهذا المستوى التعليمي بعد."
                : "The teacher has not uploaded any video lessons for this language category yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
