import React, { useState, useEffect } from "react";
import { WeeklyTask, Student } from "../types";
import { subscribeToWeeklyTasks } from "../lib/dbService";
import { 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  RefreshCw,
  Calendar
} from "lucide-react";
import confetti from "canvas-confetti";

interface DailyTasksSectionProps {
  student: Student | null;
  isArabic: boolean;
  onOpenAuth: () => void;
  onUpdateStudent?: (s: Student) => void;
}

export default function DailyTasksSection({
  student,
  isArabic,
  onOpenAuth,
  onUpdateStudent,
}: DailyTasksSectionProps) {
  const [tasks, setTasks] = useState<WeeklyTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current day of the week in English lowercase, e.g., "monday"
  const currentDayName = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

  useEffect(() => {
    if (!student) return;

    setLoading(true);
    const teacherId = student.selectedTeacherId || "teacher-sarah";
    
    // Subscribe to weekly tasks for real-time synchronization
    const unsubscribe = subscribeToWeeklyTasks((fetchedTasks) => {
      // Filter tasks for the current day and student's level
      const filtered = fetchedTasks.filter(
        (t) => t.day === currentDayName && (t.level === "All" || !t.level || t.level === student.level)
      );
      setTasks(filtered);
      setLoading(false);
    }, teacherId);

    return () => {
      unsubscribe();
    };
  }, [student, currentDayName]);

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
      onUpdateStudent(updatedStudent);

      if (!isCompleted) {
        // Confetti if all current day's tasks are completed
        const afterUpdateIds = updatedCompletedIds;
        const allCompleted = tasks.length > 0 && tasks.every(t => afterUpdateIds.includes(t.id));
        if (allCompleted) {
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.75 }
          });
        }
      }
    } catch (err) {
      console.error(err);
      setError(isArabic ? "فشل حفظ حالة المهمة." : "Failed to save task status.");
    }
  };

  const getDayLabel = () => {
    const dayLabelsAr: Record<string, string> = {
      saturday: "السبت",
      sunday: "الأحد",
      monday: "الإثنين",
      tuesday: "الثلاثاء",
      wednesday: "الأربعاء",
      thursday: "الخميس",
      friday: "الجمعة",
    };
    const dayLabelsEn: Record<string, string> = {
      saturday: "Saturday",
      sunday: "Sunday",
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
    };
    return isArabic ? dayLabelsAr[currentDayName] : dayLabelsEn[currentDayName];
  };

  if (!student) return null;

  const completedCount = tasks.filter(t => (student.completedWeeklyTasks || []).includes(t.id)).length;
  const percent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5" id="daily-current-tasks-container">
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
        <div className="text-left rtl:text-right">
          <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 uppercase tracking-wider inline-flex items-center gap-1.5 font-mono">
            <Calendar className="w-3.5 h-3.5 text-rose-500" />
            {getDayLabel()}
          </span>
          <h3 className="text-sm font-black text-slate-800 font-display mt-2">
            {isArabic ? "مهام اليوم المحددة لك" : "Your Assigned Tasks Today"}
          </h3>
        </div>
        <div className="text-right rtl:text-left font-mono">
          <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
            {completedCount} / {tasks.length}
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* List */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="flex justify-center items-center py-6">
            <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-6 text-slate-400 italic text-xs font-semibold">
            {isArabic 
              ? "لا توجد مهام محددة لك اليوم من قبل الأستاذ. ممتاز!" 
              : "No tasks assigned for today by your tutor. Enjoy your day!"}
          </div>
        ) : (
          tasks.map((task) => {
            const isCompleted = (student.completedWeeklyTasks || []).includes(task.id);
            return (
              <button
                key={task.id}
                onClick={() => handleToggleTask(task)}
                className="w-full p-4 text-left rtl:text-right hover:bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all flex items-start gap-3.5 cursor-pointer focus:outline-none"
                id={`daily-current-task-item-${task.id}`}
              >
                <div className="shrink-0 pt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-indigo-600 fill-indigo-50" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-500 transition-colors" />
                  )}
                </div>

                <div className="flex-grow space-y-0.5 min-w-0">
                  <h4 className={`text-xs font-extrabold leading-relaxed ${
                    isCompleted ? "text-slate-400 line-through font-normal" : "text-slate-700"
                  }`}>
                    {isArabic ? task.titleAr : task.title}
                  </h4>
                  <p className="text-[9px] text-slate-400 font-bold">
                    {isArabic ? task.title : task.titleAr}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Mini Progress Bar if there are tasks */}
      {tasks.length > 0 && (
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            <span>{isArabic ? "مستوى الإنجاز لليوم" : "Today's Completion Rate"}</span>
            <span>{percent}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
            <div 
              className="h-full bg-rose-500 rounded-full transition-all duration-700"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
