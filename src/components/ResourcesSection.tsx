import React, { useState } from "react";
import { motion } from "motion/react";
import { ResourceOrTip } from "../types";
import { Globe, Search, ExternalLink, ArrowRight, BookOpen } from "lucide-react";

interface ResourcesSectionProps {
  resources: ResourceOrTip[];
  isArabic: boolean;
  studentLevel?: string;
}

export default function ResourcesSection({ resources, isArabic, studentLevel }: ResourcesSectionProps) {
  const [selectedLevel, setSelectedLevel] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>(" ");

  const resourceItems = resources.filter(x => x.type === "resource");

  const levels = ["All", "A1", "A2", "B1", "B2", "C1"];

  const filtered = resourceItems.filter(item => {
    const matchesLevel = selectedLevel === "All" || item.level === "All" || item.level === selectedLevel;
    const matchesSearch = searchQuery.trim() === "" || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-5xl mx-auto"
      id="resources-view-wrapper"
    >
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
          <Globe className="w-4 h-4" />
          <span>{isArabic ? "المصادر والمواقع الخارجية" : "Resources and Websites"}</span>
        </div>
        <h2 className="text-3xl font-black font-display text-slate-900">
          {isArabic ? "أفضل المراجع والقواميس لتعلم الإنجليزية" : "Top Educational Links & Platforms"}
        </h2>
        <p className="text-slate-550 text-sm max-w-xl mx-auto leading-relaxed">
          {isArabic
            ? "مجموعة منتقاة بعناية من القواميس التفاعلية، منصات التدريب اللغوي، ومصادر الاستماع المجانية لتطوير مستواك."
            : "Handpicked dictionaries, interactive tools, and audio resources designed to accelerate your fluency."}
        </p>
      </div>

      {/* Level Filters & Search bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Level tabs */}
          <div className="flex flex-wrap gap-2">
            {levels.map(level => {
              const isSelected = selectedLevel === level;
              const isStudentRecommend = studentLevel === level;
              return (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer relative ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100"
                  }`}
                >
                  <span>{level === "All" ? (isArabic ? "الكل" : "All") : level}</span>
                  {isStudentRecommend && (
                    <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                      {isArabic ? "موصى" : "Rec"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery === " " ? "" : searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isArabic ? "ابحث عن موقع أو قاموس..." : "Search resources..."}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Grid of items */}
      {filtered.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-12 text-center text-slate-400 text-sm font-semibold">
          {isArabic ? "لا توجد مصادر مطابقة لخيارات البحث حالياً." : "No resources found matching your filters."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                    {item.level === "All" ? (isArabic ? "جميع المستويات" : "All Levels") : `${isArabic ? "مستوى" : "Level"} ${item.level}`}
                  </span>
                  <BookOpen className="w-5 h-5 text-indigo-400 shrink-0" />
                </div>

                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  {item.title}
                </h3>

                <p className="text-slate-650 text-xs sm:text-sm leading-relaxed">
                  {item.content}
                </p>
              </div>

              {item.url && (
                <div className="border-t border-slate-100 mt-5 pt-4">
                  <a
                    href={item.url}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-indigo-600 hover:text-indigo-700"
                  >
                    <span>{isArabic ? "زيارة الموقع الإلكتروني" : "Visit Website"}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
