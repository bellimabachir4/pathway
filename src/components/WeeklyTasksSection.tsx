import React, { useState, useEffect } from "react";
import { WeeklyTask, Student } from "../types";
import { getWeeklyTasks, saveWeeklyTask } from "../lib/dbService";
import { 
  CalendarDays, 
  CheckCircle, 
  Circle, 
  AlertCircle, 
  RefreshCw,
  Trophy,
  CheckCircle2,
  ChevronRight,
  TrendingUp
} from "lucide-react";
import confetti from "canvas-confetti";

interface WeeklyTasksSectionProps {
  student: Student | null;
  isArabic: boolean;
  onOpenAuth: () => void;
}

export default function WeeklyTasksSection({
  student,
  isArabic,
  onOpenAuth,
}: WeeklyTasksSectionProps) {
  const [tasks, setTasks] = useState<WeeklyTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!student) return;
    loadTasks();
  }, [student]);

  const loadTasks = async () => {
    if (!student) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getWeeklyTasks(student.uid);
      setTasks(data);
    } catch (err) {
      console.error(err);
      setError(isArabic ? "فشل تحميل الخطة والمهام الأسبوعية." : "Failed to load weekly plans & tasks.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (task: WeeklyTask) => {
    if (!student) return;
    const updated: WeeklyTask = {
      ...task,
      completed: !task.completed
    };

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));

    try {
      await saveWeeklyTask(student.uid, updated);
      
      if (updated.completed) {
        const afterUpdate = tasks.map(t => t.id === task.id ? updated : t);
        const allCompleted = afterUpdate.every(t => t.completed);
        if (allCompleted) {
          // Epic weekly success confetti!
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.65 }
          });
        }
      }
    } catch (err) {
      console.error(err);
      // Revert optimism
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Group tasks by week tag or show as one comprehensive week plan
  // Since we have week labels "Week 1: grammar" etc, let's group them or display them in chapters
  const weekLabelDisplay = isArabic ? "خطة الأسبوع الأول: أساسيات القواعد والمفردات" : "Week 1 Plan: Grammar Basics & Vocabulary Bank";

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 bg-white border border-slate-200 rounded-3xl shadow-sm min-h-[400px]">
        <CalendarDays className="w-12 h-12 text-slate-350 mb-4 stroke-[1.5]" />
        <h3 className="text-base font-bold text-slate-700">
          {isArabic ? "الخطة التعليمية الأسبوعية" : "Weekly Education Plans"}
        </h3>
        <p className="text-xs text-slate-450 mt-1 max-w-sm leading-relaxed mb-6">
          {isArabic 
            ? "سجّل الدخول لعرض خطة هذا الأسبوع كاملة، وتتبع مستويات الإنجاز والدروس والمهام المطلوب الانتهاء منها للنجاح." 
            : "Sign in to view your complete week's schedule, track curriculum accomplishments, and review mandatory tasks."}
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
        >
          {isArabic ? "سجّل الدخول الآن" : "Log In Now"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="weekly-tasks-view">
      {/* Page Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="text-left rtl:text-right">
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block mb-1">
            {isArabic ? "منهج وخطة الأسبوع" : "WEEKLY SYLLABUS & CURRICULUM"}
          </span>
          <h2 className="text-xl font-black text-slate-800 font-display">
            {isArabic ? "المهام والخطط الأسبوعية" : "Weekly Progress & Schedule"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {weekLabelDisplay}
          </p>
        </div>

        <button
          onClick={loadTasks}
          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 border border-slate-200/50 bg-white rounded-xl transition-all cursor-pointer"
          title={isArabic ? "تحديث" : "Refresh"}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-4 bg-rose-50 border border-rose-150 rounded-2xl text-rose-800 text-xs text-left rtl:text-right">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Progress Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric Cards */}
        <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
          <div className="flex items-start justify-between">
            <div className="text-left rtl:text-right space-y-1">
              <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase">
                {isArabic ? "مستوى التزامك" : "Syllabus Compliance"}
              </span>
              <h3 className="text-base font-black text-slate-800">
                {isArabic ? "مؤشر تقدم الأسبوع الحالي" : "Current Week Progress Tracker"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isArabic 
                  ? "أكمل الأهداف الدراسية بنجاح لإتمام الأسبوع بنسبة 100% والانتقال للمستوى التالي." 
                  : "Complete these milestone tasks to clear the current week and unlock subsequent chapters."}
              </p>
            </div>
            
            {percent === 100 && (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl text-amber-600 animate-bounce">
                <Trophy className="w-6 h-6 fill-amber-100" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-baseline text-xs font-extrabold text-slate-500">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                {percent}% {isArabic ? "مكتمل" : "Completed"}
              </span>
              <span>{completedCount} / {totalCount} {isArabic ? "مهام" : "Objectives"}</span>
            </div>

            <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-1 border border-slate-200/50">
              <div 
                className="h-full bg-indigo-600 rounded-full transition-all duration-700 relative"
                style={{ width: `${percent}%` }}
              >
                <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full animate-ping" />
              </div>
            </div>
          </div>
        </div>

        {/* Informational Box */}
        <div className="bg-indigo-950 text-white p-6 rounded-3xl shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
          
          <div className="space-y-2 text-left rtl:text-right relative">
            <h4 className="text-xs font-black text-indigo-300 uppercase tracking-widest">
              {isArabic ? "مفتاح الأسبوع" : "WEEKLY GOALS"}
            </h4>
            <p className="text-sm font-extrabold leading-snug">
              {isArabic 
                ? "تتأسس خطة هذا الأسبوع حول ربط المبتدئين بتركيبات الجمل البسيطة وبناء أول 50 مفردة أساسية." 
                : "This week centers on fundamental sentence modeling and establishing your first core vocabulary."}
            </p>
          </div>

          <div className="pt-4 border-t border-indigo-900 flex items-center gap-2 text-[10px] text-indigo-200 font-bold justify-between">
            <span>{isArabic ? "المستوى الحالي: مبتدئ" : "Current Rank: Novice"}</span>
            <ChevronRight className="w-3 h-3 rtl:rotate-180" />
          </div>
        </div>
      </div>

      {/* Task Checklist Items */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            {isArabic ? "📋 قائمة الأهداف الأسبوعية" : "📋 WEEK OBJECTIVES LIST"}
          </h3>
          <span className="text-[10px] text-slate-450 font-bold">
            {isArabic ? "اضغط على الدائرة للمناوبة" : "Click node to toggle state"}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <p className="text-xs font-bold italic">{isArabic ? "لا توجد خطة أسبوعية نشطة." : "No active weekly tasks."}</p>
            </div>
          ) : (
            tasks.map((task) => (
              <button
                key={task.id}
                onClick={() => handleToggleTask(task)}
                className="w-full p-5 text-left rtl:text-right hover:bg-slate-50/50 transition-colors flex items-start gap-4 cursor-pointer focus:outline-none"
                id={`weekly-task-item-${task.id}`}
              >
                {/* Check Circle indicator */}
                <div className="shrink-0 pt-0.5">
                  {task.completed ? (
                    <CheckCircle2 className="w-5.5 h-5.5 text-indigo-600 fill-indigo-50" />
                  ) : (
                    <Circle className="w-5.5 h-5.5 text-slate-300 hover:text-indigo-500 transition-colors" />
                  )}
                </div>

                {/* Text Context */}
                <div className="flex-grow space-y-0.5 min-w-0">
                  <h4 className={`text-xs font-bold leading-relaxed ${
                    task.completed ? "text-slate-400 line-through font-normal" : "text-slate-700"
                  }`}>
                    {isArabic ? task.titleAr : task.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    {isArabic ? task.title : task.titleAr}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
