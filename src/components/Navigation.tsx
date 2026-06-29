import React from "react";
import { Globe, LogOut, User as UserIcon, Home, BookOpen, FileText, Shield, Menu } from "lucide-react";
import { motion } from "motion/react";
import { Student, Teacher } from "../types";

interface NavigationProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isArabic: boolean;
  setIsArabic: (val: boolean) => void;
  student: Student | null;
  teacher: Teacher | null;
  onLogout: () => void;
  onLogoClick: () => void;
  onOpenAuth: () => void;
  onOpenMenu: () => void;
}

export default function Navigation({
  currentTab,
  setCurrentTab,
  isArabic,
  setIsArabic,
  student,
  teacher,
  onLogout,
  onLogoClick,
  onOpenAuth,
  onOpenMenu,
}: NavigationProps) {

  const tabs = [
    { id: "home", labelEn: "Home", labelAr: "الرئيسية", Icon: Home },
    { id: "lessons", labelEn: "Lessons", labelAr: "الدروس", Icon: BookOpen },
    { id: "vocab", labelEn: "Vocabulary", labelAr: "المفردات", Icon: FileText },
    { id: "profile", labelEn: "Profile", labelAr: "الملف الشخصي", Icon: UserIcon },
  ];

  return (
    <>
      {/* 
        Sleek, minimalist non-sticky top header.
        This provides a beautiful entrance, lets users switch language or sign out,
        but doesn't stay stuck to the top to maximize screen height and feel ultra clean.
      */}
      <header className="relative w-full py-4 px-4 sm:px-6 lg:px-8 bg-slate-50 border-b border-slate-100 select-none z-30" id="top-branding-header">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo / Branding */}
          <button
            onClick={onLogoClick}
            className="focus:outline-none active:scale-95 transition-transform cursor-pointer text-left rtl:text-right"
            id="logo-brand-btn"
          >
            <span className="block text-lg sm:text-xl font-black font-display tracking-wider text-slate-800 hover:text-indigo-650 transition-colors uppercase">
              Pathway <span className="text-indigo-600">Languages</span>
            </span>
          </button>

          {/* Top Bar Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Teacher Dashboard Trigger */}
            {teacher && (
              <button
                onClick={() => setCurrentTab("teacher")}
                className={`flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-150 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  currentTab === "teacher" ? "ring-2 ring-emerald-500" : ""
                }`}
                id="top-teacher-dashboard-btn"
              >
                <Shield className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
                <span className="hidden sm:inline">
                  {isArabic ? "لوحة الأستاذ" : "Teacher Panel"}
                </span>
              </button>
            )}

            {/* Language Toggle */}
            <button
              onClick={() => setIsArabic(!isArabic)}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100/60 border border-slate-200/50 rounded-xl transition-all cursor-pointer flex items-center justify-center bg-white"
              id="lang-toggle-btn"
              title={isArabic ? "English" : "العربية"}
            >
              <Globe className="w-4.5 h-4.5" />
            </button>

            {/* Side Menu Drawer Button */}
            <button
              onClick={onOpenMenu}
              className="p-2 text-slate-500 hover:text-indigo-650 hover:bg-slate-100/60 border border-slate-200/50 rounded-xl transition-all cursor-pointer flex items-center justify-center bg-white"
              id="top-sidebar-menu-btn"
              title={isArabic ? "القائمة" : "Menu"}
            >
              <Menu className="w-4.5 h-4.5" />
            </button>

            {/* Authentication / Logout Button */}
            {student || teacher ? (
              <button
                onClick={onLogout}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/50 rounded-xl transition-all cursor-pointer flex items-center justify-center bg-white"
                id="signout-btn"
                title={isArabic ? "تسجيل الخروج" : "Sign Out"}
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200/50 rounded-xl transition-all cursor-pointer bg-white text-xs font-bold"
                id="login-trigger-btn"
              >
                <UserIcon className="w-4 h-4" />
                <span>{isArabic ? "دخول" : "Login"}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 
        Beautiful iPhone-Style Floating Bottom Navigation Bar
        Centered horizontally, floating above content, with glassmorphism,
        prominent active circle animation, and iOS decorative dot patterns.
      */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] sm:w-[85%] md:w-[70%] max-w-[430px] h-16 bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-white/45 dark:border-slate-800/50 rounded-[28px] shadow-[0_12px_40px_rgba(0,0,0,0.12)] flex items-center justify-between px-3.5 z-50 select-none hover:shadow-[0_16px_48px_rgba(0,0,0,0.16)] transition-all duration-300" id="iphone-floating-dock">
        
        {/* Left iOS Speaker Dots */}
        <div className="flex items-center gap-1 pl-1 shrink-0">
          <div className="w-1 h-1 rounded-full bg-slate-400/40" />
          <div className="w-1 h-1 rounded-full bg-slate-400/30" />
        </div>

        {/* Tab Items Container */}
        <div className="flex items-center justify-around flex-grow px-2 relative h-full">
          {tabs.map((tab) => {
            const isSelected = currentTab === tab.id;
            const Icon = tab.Icon;
            
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "profile" && !student && !teacher) {
                    onOpenAuth();
                  } else {
                    setCurrentTab(tab.id);
                  }
                }}
                className="relative flex flex-col items-center justify-center w-12 h-12 rounded-full cursor-pointer group focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                id={`floating-tab-${tab.id}`}
              >
                {/* Active Outstanding Circle with spring motion */}
                {isSelected ? (
                  <div className="relative flex items-center justify-center w-full h-full">
                    {/* The prominent pop-up circle background with shadow */}
                    <motion.div
                      layoutId="activeDockCircle"
                      className="absolute -top-5 w-12 h-12 bg-indigo-600 rounded-full shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 flex items-center justify-center border-2 border-white/95"
                      transition={{ type: "spring", stiffness: 380, damping: 26 }}
                    >
                      <Icon className="w-5 h-5 text-white stroke-[2.5px]" />
                    </motion.div>
                    
                    {/* Active short label under the dock */}
                    <span className="absolute bottom-1 text-[8.5px] font-black text-indigo-700 select-none tracking-tight">
                      {isArabic ? tab.labelAr : tab.labelEn}
                    </span>
                  </div>
                ) : (
                  // Regular inactive tab
                  <div className="flex flex-col items-center justify-center text-slate-450 hover:text-slate-700 transition-colors duration-200 opacity-70 group-hover:opacity-100">
                    <Icon className="w-4.5 h-4.5 stroke-[1.8px] group-hover:scale-105 transition-transform" />
                    <span className="text-[8.5px] mt-0.5 font-bold tracking-tight">
                      {isArabic ? tab.labelAr : tab.labelEn}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Right iOS Speaker Dots */}
        <div className="flex items-center gap-1 pr-1 shrink-0">
          <div className="w-1 h-1 rounded-full bg-slate-400/30" />
          <div className="w-1 h-1 rounded-full bg-slate-400/40" />
        </div>
      </div>
    </>
  );
}
