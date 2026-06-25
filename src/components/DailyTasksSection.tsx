import React, { useState, useEffect } from "react";
import { DailyTask, Student } from "../types";
import { getDailyTasks, saveDailyTask, deleteDailyTask } from "../lib/dbService";
import { 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Plus, 
  Edit3, 
  X, 
  Check, 
  ClipboardList, 
  AlertCircle, 
  RefreshCw 
} from "lucide-react";
import confetti from "canvas-confetti";

interface DailyTasksSectionProps {
  student: Student | null;
  isArabic: boolean;
  onOpenAuth: () => void;
}

export default function DailyTasksSection({
  student,
  isArabic,
  onOpenAuth,
}: DailyTasksSectionProps) {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  
  // New task form state
  const [newTitleEn, setNewTitleEn] = useState("");
  const [newTitleAr, setNewTitleAr] = useState("");
  const [addingTask, setAddingTask] = useState(false);

  // Inline editing task state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitleEn, setEditTitleEn] = useState("");
  const [editTitleAr, setEditTitleAr] = useState("");

  useEffect(() => {
    if (!student) return;
    loadTasks();
  }, [student]);

  const loadTasks = async () => {
    if (!student) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getDailyTasks(student.uid);
      setTasks(data);
    } catch (err) {
      console.error(err);
      setError(isArabic ? "فشل تحميل المهام اليومية." : "Failed to load daily tasks.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (task: DailyTask) => {
    if (!student) return;
    const updated: DailyTask = {
      ...task,
      completed: !task.completed
    };

    // Optimistic state update
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));

    try {
      await saveDailyTask(student.uid, updated);
      
      // If completed and all are completed, trigger a mini confetti!
      if (updated.completed) {
        const afterUpdate = tasks.map(t => t.id === task.id ? updated : t);
        const allDone = afterUpdate.every(t => t.completed);
        if (allDone) {
          confetti({
            particleCount: 100,
            spread: 60,
            origin: { y: 0.8 }
          });
        }
      }
    } catch (err) {
      console.error(err);
      // Revert optimism
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    
    const en = newTitleEn.trim();
    const ar = newTitleAr.trim();
    if (!en || !ar) return;

    const newTask: DailyTask = {
      id: `task_${Date.now()}`,
      studentId: student.uid,
      title: en,
      titleAr: ar,
      completed: false,
      date: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString()
    };

    // Optimistic update
    setTasks(prev => [...prev, newTask]);
    setNewTitleEn("");
    setNewTitleAr("");
    setAddingTask(false);

    try {
      await saveDailyTask(student.uid, newTask);
    } catch (err) {
      console.error(err);
      setError(isArabic ? "فشل إضافة المهمة اليومية." : "Failed to add daily task.");
      setTasks(prev => prev.filter(t => t.id !== newTask.id));
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!student) return;
    
    const originalTasks = [...tasks];
    // Optimistic update
    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      await deleteDailyTask(student.uid, taskId);
    } catch (err) {
      console.error(err);
      setError(isArabic ? "فشل حذف المهمة." : "Failed to delete task.");
      setTasks(originalTasks);
    }
  };

  const startInlineEdit = (task: DailyTask) => {
    setEditingTaskId(task.id);
    setEditTitleEn(task.title);
    setEditTitleAr(task.titleAr);
  };

  const handleSaveInlineEdit = async (task: DailyTask) => {
    if (!student) return;
    const en = editTitleEn.trim();
    const ar = editTitleAr.trim();
    if (!en || !ar) return;

    const updated: DailyTask = {
      ...task,
      title: en,
      titleAr: ar
    };

    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    setEditingTaskId(null);

    try {
      await saveDailyTask(student.uid, updated);
    } catch (err) {
      console.error(err);
      setError(isArabic ? "فشل تعديل المهمة." : "Failed to update task.");
      loadTasks(); // reload to sync back
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const completionRatio = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 bg-white border border-slate-200 rounded-3xl shadow-sm min-h-[400px]">
        <ClipboardList className="w-12 h-12 text-slate-350 mb-4 stroke-[1.5]" />
        <h3 className="text-base font-bold text-slate-700">
          {isArabic ? "المهام اليومية الشخصية" : "Personal Daily Tasks"}
        </h3>
        <p className="text-xs text-slate-450 mt-1 max-w-sm leading-relaxed mb-6">
          {isArabic 
            ? "سجّل الدخول لتتمكن من إنشاء ومتابعة وتعديل مهامك التعليمية اليومية المصممة لزيادة نقاطك ومستواك." 
            : "Sign in to create, monitor, and customize your personalized learning tasks to level up your language score."}
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
    <div className="space-y-6" id="daily-tasks-view">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="text-left rtl:text-right">
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block mb-1">
            {isArabic ? "قائمة الإنجاز والمهام اليومية" : "DAILY ACCOMPLISHMENTS & GOALS"}
          </span>
          <h2 className="text-xl font-black text-slate-800 font-display">
            {isArabic ? "المهام والخطوات اليومية" : "Daily Checklist & Portals"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isArabic 
              ? `تابع مهام اليوم (${new Date().toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric' })})`
              : `Track today's targets (${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })})`}
          </p>
        </div>

        {/* Edit mode toggle & Refresh */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadTasks}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 border border-slate-200/50 bg-white rounded-xl transition-all cursor-pointer"
            title={isArabic ? "إعادة تحميل" : "Reload"}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          
          <button
            onClick={() => {
              setEditMode(!editMode);
              setAddingTask(false);
              setEditingTaskId(null);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              editMode
                ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                : "bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>
              {editMode
                ? (isArabic ? "إنهاء التعديل" : "Exit Editing")
                : (isArabic ? "تعديل وإضافة مهام" : "Edit & Manage Tasks")}
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-4 bg-rose-50 border border-rose-150 rounded-2xl text-rose-800 text-xs text-left rtl:text-right">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Progress & Metric card */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl" />

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1.5 text-left rtl:text-right">
            <h3 className="text-sm font-extrabold text-slate-350">
              {isArabic ? "معدل الإنجاز اليومي" : "Daily Progress Meter"}
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-white">{completionRatio}%</span>
              <span className="text-xs text-slate-400 font-bold">
                ({completedCount} / {totalCount} {isArabic ? "مكتملة" : "Completed"})
              </span>
            </div>
            <p className="text-xs text-slate-350">
              {completionRatio === 100
                ? (isArabic ? "عمل رائع! لقد أكملت جميع مهام اليوم بنجاح ✨" : "Awesome work! You completed all daily goals successfully ✨")
                : (isArabic ? "أكمل مهامك اليومية لترفع مستواك وتحافظ على شعلة تقدمك!" : "Complete your targets to increase points and maintain your daily streak!")}
            </p>
          </div>

          {/* Large dynamic circle meter or linear bar */}
          <div className="w-full md:w-64 space-y-1">
            <div className="h-3 bg-white/10 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${completionRatio}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-black">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form (Only visible in Edit Mode) */}
      {editMode && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-800">
              {isArabic ? "➕ إضافة مهمة مخصصة جديدة" : "➕ Create Custom Task"}
            </h3>
            {!addingTask ? (
              <button
                onClick={() => setAddingTask(true)}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 text-indigo-700 text-[10px] font-black rounded-lg transition-all cursor-pointer"
              >
                {isArabic ? "+ إضافة مهمة" : "+ Add Task"}
              </button>
            ) : (
              <button
                onClick={() => setAddingTask(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {addingTask && (
            <form onSubmit={handleAddTask} className="space-y-3.5 animate-fade-in text-left rtl:text-right">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    {isArabic ? "اسم المهمة (بالإنجليزي):" : "Task Name (English):"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitleEn}
                    onChange={(e) => setNewTitleEn(e.target.value)}
                    placeholder="e.g. Read 5 pages of vocabulary bank"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    {isArabic ? "اسم المهمة (بالعربي):" : "Task Name (Arabic):"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitleAr}
                    onChange={(e) => setNewTitleAr(e.target.value)}
                    placeholder="مثال: اقرأ 5 صفحات من بنك الكلمات"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setAddingTask(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 text-xs rounded-xl font-bold hover:bg-slate-50 transition-all cursor-pointer"
                >
                  {isArabic ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {isArabic ? "حفظ وإضافة" : "Save & Create"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Tasks List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/80 p-6">
            <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-xs text-slate-400 font-bold italic">
              {isArabic ? "لا توجد مهام نشطة لليوم." : "No active tasks for today."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {tasks.map((task) => {
              const isEditing = editingTaskId === task.id;

              return (
                <div 
                  key={task.id} 
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    task.completed 
                      ? "bg-slate-50/80 border-slate-100 opacity-80" 
                      : "bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm"
                  }`}
                  id={`daily-task-card-${task.id}`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Completion Checkbox (Disabled in editMode unless not editing) */}
                    {!editMode && (
                      <button
                        onClick={() => handleToggleTask(task)}
                        className="text-slate-400 hover:text-indigo-600 transition-all cursor-pointer shrink-0"
                        title={task.completed ? "Mark incomplete" : "Mark complete"}
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5.5 h-5.5 text-emerald-500 fill-emerald-50" />
                        ) : (
                          <Circle className="w-5.5 h-5.5 text-slate-300 hover:text-indigo-500 hover:scale-105 transition-all" />
                        )}
                      </button>
                    )}

                    {/* Task Title / Text */}
                    <div className="flex-grow text-left rtl:text-right min-w-0">
                      {isEditing ? (
                        <div className="space-y-2 py-1 w-full max-w-xl">
                          <input
                            type="text"
                            value={editTitleEn}
                            onChange={(e) => setEditTitleEn(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="English title"
                          />
                          <input
                            type="text"
                            value={editTitleAr}
                            onChange={(e) => setEditTitleAr(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="العنوان بالعربية"
                          />
                        </div>
                      ) : (
                        <>
                          <h4 className={`text-xs font-bold leading-relaxed truncate ${
                            task.completed ? "text-slate-400 line-through font-normal" : "text-slate-700"
                          }`}>
                            {isArabic ? task.titleAr : task.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            {isArabic ? task.title : task.titleAr}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions (Only in Edit Mode) */}
                  {editMode && (
                    <div className="flex items-center gap-2 shrink-0">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveInlineEdit(task)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer border border-emerald-100"
                            title={isArabic ? "حفظ التعديل" : "Save Changes"}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingTaskId(null)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all cursor-pointer border border-slate-200"
                            title={isArabic ? "إلغاء" : "Cancel"}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startInlineEdit(task)}
                            className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer border border-indigo-100"
                            title={isArabic ? "تعديل المهمة" : "Edit Task"}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all cursor-pointer border border-red-100"
                            title={isArabic ? "حذف المهمة" : "Delete Task"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
