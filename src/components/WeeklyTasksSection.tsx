import React, { useState, useEffect } from "react";
import { WeeklyTask, Student } from "../types";
import { subscribeToWeeklyTasks, saveWeeklyTask, deleteWeeklyTask } from "../lib/dbService";
import { 
  CalendarDays, 
  CheckCircle, 
  Circle, 
  AlertCircle, 
  RefreshCw,
  Trophy,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Clock,
  Calendar,
  Settings,
  Plus,
  Edit,
  Trash2,
  X,
  Save
} from "lucide-react";
import confetti from "canvas-confetti";

interface WeeklyTasksSectionProps {
  student: Student | null;
  isArabic: boolean;
  onOpenAuth: () => void;
  onUpdateStudent?: (s: Student) => void;
}

const DAYS_OF_WEEK = [
  { key: "saturday", labelEn: "Saturday", labelAr: "السبت" },
  { key: "sunday", labelEn: "Sunday", labelAr: "الأحد" },
  { key: "monday", labelEn: "Monday", labelAr: "الإثنين" },
  { key: "tuesday", labelEn: "Tuesday", labelAr: "الثلاثاء" },
  { key: "wednesday", labelEn: "Wednesday", labelAr: "الأربعاء" },
  { key: "thursday", labelEn: "Thursday", labelAr: "الخميس" },
  { key: "friday", labelEn: "Friday", labelAr: "الجمعة" },
] as const;

export default function WeeklyTasksSection({
  student,
  isArabic,
  onOpenAuth,
  onUpdateStudent,
}: WeeklyTasksSectionProps) {
  const [tasks, setTasks] = useState<WeeklyTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Management states
  const [isManageMode, setIsManageMode] = useState(false);
  const [editingTask, setEditingTask] = useState<WeeklyTask | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formTitleAr, setFormTitleAr] = useState("");
  const [formDay, setFormDay] = useState<"saturday" | "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday">("saturday");
  const [formLevel, setFormLevel] = useState<"A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "All">("All");

  const openAddForm = (defaultDay?: typeof formDay) => {
    setEditingTask(null);
    setFormTitle("");
    setFormTitleAr("");
    setFormDay(defaultDay || "saturday");
    setFormLevel(student?.level || "All");
    setShowForm(true);
  };

  const openEditForm = (task: WeeklyTask) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormTitleAr(task.titleAr);
    setFormDay(task.day);
    setFormLevel(task.level || "All");
    setShowForm(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    const teacherId = student.selectedTeacherId || "teacher-sarah";

    const taskToSave: WeeklyTask = {
      id: editingTask?.id || "task-" + Date.now(),
      teacherId,
      title: formTitle.trim(),
      titleAr: formTitleAr.trim(),
      day: formDay,
      level: formLevel,
      order: editingTask?.order || (tasks.length > 0 ? Math.max(...tasks.map(t => t.order || 0)) + 1 : 1),
      createdAt: editingTask?.createdAt || new Date().toISOString()
    };

    try {
      await saveWeeklyTask(teacherId, taskToSave);
      setShowForm(false);
      setEditingTask(null);
      setFormTitle("");
      setFormTitleAr("");
    } catch (err) {
      console.error(err);
      setError(isArabic ? "فشل في حفظ المهمة." : "Failed to save the task.");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!student) return;
    if (!window.confirm(isArabic ? "هل أنت متأكد من حذف هذه المهمة؟" : "Are you sure you want to delete this task?")) return;
    const teacherId = student.selectedTeacherId || "teacher-sarah";

    try {
      await deleteWeeklyTask(teacherId, taskId);
    } catch (err) {
      console.error(err);
      setError(isArabic ? "فشل في حذف المهمة." : "Failed to delete the task.");
    }
  };

  useEffect(() => {
    if (!student) return;

    setLoading(true);
    const teacherId = student.selectedTeacherId || "teacher-sarah";
    
    // Real-time synchronization subscription
    const unsubscribe = subscribeToWeeklyTasks((fetchedTasks) => {
      setTasks(fetchedTasks);
      setLoading(false);
    }, teacherId);

    return () => {
      unsubscribe();
    };
  }, [student]);

  const handleToggleTask = async (task: WeeklyTask) => {
    if (!student || !onUpdateStudent) return;
    
    const completedIds = student.completedWeeklyTasks || [];
    const isCompleted = completedIds.includes(task.id);
    let updatedCompletedIds: string[];

    if (isCompleted) {
      updatedCompletedIds = completedIds.filter(id => id !== task.id);
    } else {
      updatedCompletedIds = [...completedIds, task.id];
    }

    const updatedStudent: Student = {
      ...student,
      completedWeeklyTasks: updatedCompletedIds
    };

    try {
      // Save student progress using the passed callback which updates Firestore & local state
      onUpdateStudent(updatedStudent);

      // Confetti effect if all tasks are completed
      if (!isCompleted) {
        const afterUpdateIds = updatedCompletedIds;
        const allCompleted = tasks.length > 0 && tasks.every(t => afterUpdateIds.includes(t.id));
        if (allCompleted) {
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.65 }
          });
        }
      }
    } catch (err) {
      console.error(err);
      setError(isArabic ? "فشل حفظ حالة المهمة." : "Failed to save task completion.");
    }
  };

  const levelFilteredTasks = tasks.filter(t => t.level === "All" || !t.level || t.level === student?.level);
  const completedCount = levelFilteredTasks.filter(t => (student?.completedWeeklyTasks || []).includes(t.id)).length;
  const totalCount = levelFilteredTasks.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

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
            {isArabic 
              ? `أهلاً بك! تصفح مهام كل يوم المحددة لك من قبل الأستاذ.` 
              : `Welcome! Browse daily tasks set by your teacher for your active level.`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsManageMode(!isManageMode)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-black rounded-xl border transition-all cursor-pointer ${
              isManageMode 
                ? "bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700 shadow-sm" 
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Settings className="w-4 h-4 animate-spin-slow" />
            <span>{isManageMode ? (isArabic ? "إنهاء الإدارة" : "Exit Manager") : (isArabic ? "إدارة المهام" : "Manage Tasks")}</span>
          </button>

          <div className="p-2 text-indigo-600 bg-indigo-50 border border-indigo-150 rounded-xl">
            <Calendar className="w-4.5 h-4.5" />
          </div>
        </div>
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
                  ? "أكمل الأهداف الدراسية بنجاح لإتمام الأسبوع بنسبة 100% والانتقال للدرس التالي." 
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
              {isArabic ? "خطة الأسبوع" : "WEEKLY GOALS"}
            </h4>
            <p className="text-sm font-extrabold leading-snug">
              {isArabic 
                ? "تتأسس خطة هذا الأسبوع حول ترسيخ مهارات المحادثة، الاستماع، وحفظ الكلمات المحددة لمستواك الحالي." 
                : "This week centers on conversational fluency, comprehension listening, and core vocabulary assimilation."}
            </p>
          </div>

          <div className="pt-4 border-t border-indigo-900 flex items-center gap-2 text-[10px] text-indigo-200 font-bold justify-between">
            <span>{isArabic ? `المستوى الحالي: ${student.level}` : `Current Level: ${student.level}`}</span>
            <ChevronRight className="w-3 h-3 rtl:rotate-180" />
          </div>
        </div>
      </div>

      {/* Dynamic Task Editor Form */}
      {showForm && (
        <form onSubmit={handleSaveTask} className="bg-slate-50 border-2 border-indigo-150 rounded-3xl p-6 space-y-4 max-w-2xl mx-auto shadow-md relative animate-fade-in" id="weekly-task-editor-form">
          <button 
            type="button" 
            onClick={() => { setShowForm(false); setEditingTask(null); }}
            className="absolute top-4 right-4 p-1.5 text-slate-450 hover:text-slate-700 bg-white border border-slate-200 rounded-full transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <h3 className="text-sm font-black text-slate-800 border-b border-slate-150 pb-2 flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-indigo-600 animate-spin-slow" />
            {editingTask ? (isArabic ? "تعديل المهمة الأسبوعية" : "Edit Weekly Task") : (isArabic ? "إضافة مهمة أسبوعية جديدة" : "Add New Weekly Task")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wider mb-1.5">{isArabic ? "المهمة (بالإنجليزية)" : "Task Title (English)"}</label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g., Read the grammar guide about past simple"
                className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-850"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wider mb-1.5">{isArabic ? "المهمة (بالعربية)" : "Task Title (Arabic)"}</label>
              <input
                type="text"
                required
                value={formTitleAr}
                onChange={(e) => setFormTitleAr(e.target.value)}
                placeholder="مثال: اقرأ دليل القواعد حول الماضي البسيط"
                className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-850"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wider mb-1.5">{isArabic ? "اليوم" : "Day"}</label>
              <select
                value={formDay}
                onChange={(e) => setFormDay(e.target.value as any)}
                className="w-full text-xs p-2.5 border border-slate-200 bg-white rounded-xl font-bold font-sans outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850"
              >
                <option value="saturday">{isArabic ? "السبت" : "Saturday"}</option>
                <option value="sunday">{isArabic ? "الأحد" : "Sunday"}</option>
                <option value="monday">{isArabic ? "الإثنين" : "Monday"}</option>
                <option value="tuesday">{isArabic ? "الثلاثاء" : "Tuesday"}</option>
                <option value="wednesday">{isArabic ? "الأربعاء" : "Wednesday"}</option>
                <option value="thursday">{isArabic ? "الخميس" : "Thursday"}</option>
                <option value="friday">{isArabic ? "الجمعة" : "Friday"}</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wider mb-1.5">{isArabic ? "المستوى المستهدف" : "Target Level"}</label>
              <select
                value={formLevel}
                onChange={(e) => setFormLevel(e.target.value as any)}
                className="w-full text-xs p-2.5 border border-slate-200 bg-white rounded-xl font-bold font-sans outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850"
              >
                <option value="All">{isArabic ? "جميع المستويات" : "All Levels"}</option>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
                <option value="C2">C2</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-150">
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingTask(null); }}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl cursor-pointer"
            >
              {isArabic ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isArabic ? "حفظ المهمة" : "Save Task"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Days of the Week Layout */}
      <div className="space-y-6">
        {DAYS_OF_WEEK.map((day) => {
          const dayTasks = levelFilteredTasks.filter(t => t.day === day.key);
          
          return (
            <div key={day.key} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden" id={`day-card-${day.key}`}>
              {/* Day Header */}
              <div className="p-4 px-5 border-b border-slate-100 bg-slate-50/60 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  <h3 className="text-sm font-extrabold text-slate-800">
                    {isArabic ? day.labelAr : day.labelEn}
                  </h3>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 font-bold">
                    {dayTasks.length} {isArabic ? "مهام" : "tasks"}
                  </span>
                  {isManageMode && (
                    <button
                      onClick={() => openAddForm(day.key)}
                      className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isArabic ? "إضافة" : "Add"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Day Tasks List */}
              <div className="divide-y divide-slate-100">
                {loading ? (
                  <div className="flex justify-center items-center py-6">
                    <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
                  </div>
                ) : dayTasks.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    <p className="text-xs italic font-semibold">
                      {isArabic ? "لا توجد مهام محددة لهذا اليوم." : "No tasks assigned for today."}
                    </p>
                  </div>
                ) : (
                  dayTasks.map((task) => {
                    const isCompleted = (student?.completedWeeklyTasks || []).includes(task.id);
                    return (
                      <div
                        key={task.id}
                        className="w-full p-4.5 px-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors gap-3.5"
                        id={`weekly-task-item-${task.id}`}
                      >
                        <button
                          disabled={isManageMode}
                          onClick={() => handleToggleTask(task)}
                          className={`flex-grow flex items-start gap-3.5 text-left rtl:text-right focus:outline-none ${isManageMode ? "cursor-default" : "cursor-pointer"}`}
                        >
                          {/* Checkbox Node */}
                          <div className="shrink-0 pt-0.5">
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-indigo-600 fill-indigo-50" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-500 transition-colors" />
                            )}
                          </div>

                          {/* Title and translation */}
                          <div className="flex-grow space-y-0.5 min-w-0">
                            <h4 className={`text-xs font-extrabold leading-relaxed ${
                              isCompleted ? "text-slate-400 line-through font-normal" : "text-slate-700"
                            }`}>
                              {isArabic ? task.titleAr : task.title}
                            </h4>
                            <p className="text-[9px] text-slate-400 font-bold">
                              {isArabic ? task.title : task.titleAr}
                            </p>
                            {task.level && task.level !== "All" && (
                              <span className="inline-block text-[8px] font-black bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded uppercase mt-1">
                                {task.level}
                              </span>
                            )}
                          </div>
                        </button>

                        {isManageMode && (
                          <div className="flex items-center gap-1.5 shrink-0 ml-4 rtl:mr-4">
                            <button
                              onClick={() => openEditForm(task)}
                              className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all cursor-pointer"
                              title={isArabic ? "تعديل" : "Edit"}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all cursor-pointer"
                              title={isArabic ? "حذف" : "Delete"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
