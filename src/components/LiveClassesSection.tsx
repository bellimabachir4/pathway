import React from "react";
import { LiveSession } from "../types";
import { Calendar, Clock, Video, VideoOff, ExternalLink, Award, Sparkles, UserCheck } from "lucide-react";

interface LiveClassesSectionProps {
  sessions: LiveSession[];
  isArabic: boolean;
}

export default function LiveClassesSection({ sessions, isArabic }: LiveClassesSectionProps) {
  
  const formatDate = (dateStr: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const dateObj = new Date(dateStr);
      return dateObj.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', options);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="live-classes-view">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-800 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl shadow-purple-100">
        <div className="relative z-10 max-w-xl text-left rtl:text-right space-y-4">
          <span className="inline-block bg-purple-500/30 text-purple-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {isArabic ? "الفصول الافتراضية المباشرة" : "Virtual Live Classrooms"}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display leading-tight">
            {isArabic ? "تفاعل مع الأساتذة مباشرةً" : "Interactive Live Broadcasts"}
          </h2>
          <p className="text-neutral-200 text-xs leading-relaxed">
            {isArabic
              ? "انضم إلى حصص البث المباشر التفاعلية الأسبوعية لممارسة التحدث ومناقشة القواعد اللغوية مباشرة مع معلمين بريطانيين وأمريكيين."
              : "Participate in real-time language workshops, ask direct questions, and receive feedback from certified native professors."}
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 rtl:left-0 rtl:right-auto">
          <Video className="w-72 h-72 -mr-12 -mb-12" />
        </div>
      </div>

      {/* Grid of Sessions */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <h3 className="font-bold text-slate-800 text-base font-display flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <span>{isArabic ? "جدول الحصص المباشرة" : "Scheduled Live Classes"}</span>
          </h3>

          <span className="text-xs text-slate-400 font-mono">
            {sessions.length} {isArabic ? "حصص متوفرة" : "Classes available"}
          </span>
        </div>

        {sessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sessions.map((session) => {
              const isLive = session.status === "live";
              const isCompleted = session.status === "completed";

              return (
                <div
                  key={session.id}
                  className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between ${
                    isLive 
                      ? "border-purple-300 ring-2 ring-purple-500/10" 
                      : isCompleted ? "border-slate-200 bg-slate-50 opacity-85" : "border-slate-200"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Status Badge */}
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1.5 ${
                        isLive 
                          ? "bg-red-50 text-red-600 border border-red-100 font-bold" 
                          : isCompleted ? "bg-slate-100 text-slate-500" : "bg-purple-50 text-purple-700 border border-purple-100"
                      }`}>
                        {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />}
                        <span>
                          {isLive 
                            ? (isArabic ? "بث مباشر الآن" : "Live Now") 
                            : isCompleted ? (isArabic ? "مكتملة" : "Completed") : (isArabic ? "قادمة قريباً" : "Upcoming")}
                        </span>
                      </span>

                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {session.time}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-1.5 text-left rtl:text-right">
                      <h4 className="font-extrabold text-slate-900 text-base font-display hover:text-purple-700 transition-colors">
                        {session.title}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {session.description}
                      </p>
                    </div>

                    {/* Teacher Card */}
                    <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {session.teacherName.charAt(session.teacherName.length - 1)}
                      </div>
                      <div className="text-left rtl:text-right">
                        <span className="block text-xs font-semibold text-slate-700 leading-none">
                          {session.teacherName}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">
                          {isArabic ? "مدرس اللغة الإنجليزية" : "English Pathway Instructor"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Date & Trigger Link */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {formatDate(session.date)}
                    </span>

                    {isCompleted ? (
                      <button
                        disabled
                        className="flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 cursor-not-allowed"
                      >
                        <VideoOff className="w-3.5 h-3.5" />
                        <span>{isArabic ? "انتهت الحصة" : "Session Ended"}</span>
                      </button>
                    ) : (
                      <a
                        href={session.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-1 text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                          isLive
                            ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100 animate-pulse"
                            : "bg-purple-600 text-white hover:bg-purple-700 shadow-md shadow-purple-100"
                        }`}
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>{isArabic ? "دخول الحصة" : "Join Session"}</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white text-center py-12 rounded-2xl border border-slate-200">
            <VideoOff className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">
              {isArabic
                ? "لا توجد حصص بث مباشر مجدولة حالياً."
                : "No live sessions scheduled at the moment."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
