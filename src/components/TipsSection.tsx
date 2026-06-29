import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ResourceOrTip } from "../types";
import { 
  Lightbulb, 
  Search, 
  Info, 
  HelpCircle, 
  Clock, 
  BookOpen, 
  Layers, 
  Award, 
  GraduationCap 
} from "lucide-react";

interface TipsSectionProps {
  tips: ResourceOrTip[];
  isArabic: boolean;
  studentLevel?: string;
}

const LEVEL_GUIDES = [
  {
    level: "A1",
    nameEn: "Beginner",
    nameAr: "مبتدئ",
    objectiveEn: "Understand and use familiar everyday expressions and very basic phrases for concrete needs.",
    objectiveAr: "فهم واستخدام التعبيرات اليومية المألوفة والعبارات الأساسية للغاية لتلبية الاحتياجات الملموسة.",
    wordsEn: "500 - 1,000 words",
    wordsAr: "500 - 1,000 كلمة",
    durationEn: "60 - 100 hours",
    durationAr: "60 - 100 ساعة",
    pointsEn: [
      "Basic greetings and introducing yourself or others.",
      "Asking and answering personal questions (where you live, people you know).",
      "Using present simple tense, basic pronouns, and singular/plural nouns.",
      "Spelling basic words and pronouncing alphabet correctly."
    ],
    pointsAr: [
      "التحيات الأساسية والتعريف بنفسك وبالآخرين.",
      "طرح الأسئلة الشخصية والإجابة عنها (أين تعيش، الأشخاص الذين تعرفهم).",
      "استخدام زمن المضارع البسيط، الضمائر الأساسية، والأسماء المفرد والجمع.",
      "هجاء الكلمات الأساسية ونطق الحروف الهجائية بشكل صحيح."
    ],
    tipsEn: [
      "Practice speaking out loud for at least 10 minutes every day.",
      "Use picture-based flashcards to build your basic vocabulary bank.",
      "Don't worry about grammar mistakes; focus on being understood."
    ],
    tipsAr: [
      "تدرب على التحدث بصوت عالٍ لمدة 10 دقائق على الأقل يومياً.",
      "استخدم البطاقات التعليمية القائمة على الصور لبناء بنك المفردات الأساسي.",
      "لا تقلق بشأن الأخطاء النحوية؛ ركز على جعل كلامك مفهوماً."
    ]
  },
  {
    level: "A2",
    nameEn: "Elementary",
    nameAr: "تأسيسي",
    objectiveEn: "Understand sentences and frequently used expressions related to areas of immediate relevance.",
    objectiveAr: "فهم الجمل والتعبيرات الشائعة المتعلقة بالمجالات ذات الأهمية المباشرة.",
    wordsEn: "1,000 - 2,000 words",
    wordsAr: "1,000 - 2,000 كلمة",
    durationEn: "100 - 150 hours",
    durationAr: "100 - 150 ساعة",
    pointsEn: [
      "Communicating in simple and routine tasks requiring a direct exchange of information.",
      "Describing in simple terms aspects of background, immediate environment and matters in areas of immediate need.",
      "Using simple past, present continuous, and future tenses (going to).",
      "Making basic comparisons and asking for directions."
    ],
    pointsAr: [
      "التواصل في المهام البسيطة والروتينية التي تتطلب تبادلاً مباشراً للمعلومات.",
      "وصف جوانب من خلفيتك وبيئتك المباشرة والمسائل ذات الاحتياجات المباشرة بعبارات بسيطة.",
      "استخدام الماضي البسيط، المضارع المستمر، وأزمنة المستقبل (going to).",
      "إجراء المقارنات الأساسية والسؤال عن الاتجاهات."
    ],
    tipsEn: [
      "Start reading children's short stories and graded readers.",
      "Write a daily diary of 3 to 5 simple sentences about your day.",
      "Listen to basic English conversations and repeat them shadow-style."
    ],
    tipsAr: [
      "ابدأ بقراءة القصص القصيرة للأطفال والكتب المخصصة للمبتدئين.",
      "اكتب مذكرات يومية من 3 إلى 5 جمل بسيطة تصف يومك.",
      "استمع إلى المحادثات الإنجليزية البسيطة وكررها بأسلوب التظليل اللغوي."
    ]
  },
  {
    level: "B1",
    nameEn: "Intermediate",
    nameAr: "متوسط",
    objectiveEn: "Understand main points of clear standard input on familiar matters regularly encountered in work, school, leisure, etc.",
    objectiveAr: "فهم النقاط الرئيسية للمدخلات القياسية الواضحة حول الأمور المألوفة التي تواجهها بانتظام في العمل أو المدرسة أو الترفيه.",
    wordsEn: "2,000 - 4,000 words",
    wordsAr: "2,000 - 4,000 كلمة",
    durationEn: "150 - 250 hours",
    durationAr: "150 - 250 ساعة",
    pointsEn: [
      "Dealing with most situations likely to arise while travelling in an area where the language is spoken.",
      "Producing simple connected text on topics which are familiar or of personal interest.",
      "Describing experiences, events, dreams, hopes, and briefly giving reasons and explanations.",
      "Using present perfect, passive voice, and first conditional structures."
    ],
    pointsAr: [
      "التعامل مع معظم المواقف التي قد تنشأ أثناء السفر في منطقة يتم التحدث باللغة فيها.",
      "إنتاج نصوص متصلة بسيطة حول موضوعات مألوفة أو ذات اهتمام شخصي.",
      "وصف التجارب والأحداث والأحلام والآمال، وتقديم أسباب وتفسيرات موجزة.",
      "استخدام المضارع التام، المبني للمجهول، وصيغ الشرط الأولى."
    ],
    tipsEn: [
      "Watch English videos and movies with English subtitles instead of translation.",
      "Try to think directly in English without translating from your native language.",
      "Join conversation clubs or practice speaking with study partners."
    ],
    tipsAr: [
      "شاهد مقاطع الفيديو والأفلام باللغة الإنجليزية مع ترجمة إنجليزية بدلاً من الترجمة العربية.",
      "حاول التفكير باللغة الإنجليزية مباشرة دون ترجمة من لغتك الأم.",
      "انضم إلى نوادي المحادثة أو تدرب على التحدث مع شركاء الدراسة."
    ]
  },
  {
    level: "B2",
    nameEn: "Upper-Intermediate",
    nameAr: "فوق متوسط",
    objectiveEn: "Understand main ideas of complex text on both concrete and abstract topics, including technical discussions in their field.",
    objectiveAr: "فهم الأفكار الرئيسية للنصوص المعقدة حول الموضوعات الملموسة والمجردة، بما في ذلك المناقشات الفنية في مجال تخصصهم.",
    wordsEn: "4,000 - 8,000 words",
    wordsAr: "4,000 - 8,000 كلمة",
    durationEn: "250 - 400 hours",
    durationAr: "250 - 400 ساعة",
    pointsEn: [
      "Interacting with a degree of fluency and spontaneity that makes regular interaction with native speakers quite possible.",
      "Producing clear, detailed text on a wide range of subjects and explaining a viewpoint on a topical issue.",
      "Using complex conditionals, subjunctive mood, and advanced phrasal verbs.",
      "Synthesizing information from different sources to build an argument."
    ],
    pointsAr: [
      "التفاعل بدرجة من الطلاقة والعفوية تجعل التواصل المنتظم مع المتحدثين الأصليين ممكناً تماماً.",
      "إنتاج نصوص واضحة ومفصلة حول مجموعة واسعة من الموضوعات وشرح وجهة نظر حول قضية معينة.",
      "استخدام صيغ الشرط المعقدة، صيغة التمني، والأفعال العبارية المتقدمة.",
      "توليف المعلومات من مصادر مختلفة لبناء حجة منطقية متماسكة."
    ],
    tipsEn: [
      "Read English news articles (e.g., BBC, CNN) and write summaries of them.",
      "Record yourself speaking on IELTS topics and analyze your mistakes.",
      "Learn and use transition words to make your speech and writing flow naturally."
    ],
    tipsAr: [
      "اقرأ المقالات الإخبارية بالإنجليزية (مثل BBC، CNN) واكتب ملخصات لها.",
      "سجل لنفسك أثناء التحدث عن مواضيع آيلتس وحلل أخطاءك النطقية والتعبيرية.",
      "تعلم واستخدم كلمات الربط والعبارات الانتقالية لجعل حديثك وكتابتك تتدفق بشكل طبيعي."
    ]
  },
  {
    level: "C1",
    nameEn: "Advanced",
    nameAr: "متقدم",
    objectiveEn: "Express ideas fluently and spontaneously without much obvious searching for expressions. Use language flexibly for social, academic and professional purposes.",
    objectiveAr: "التعبير عن الأفكار بطلاقة وعفوية دون بحث واضح عن التعبيرات. استخدام اللغة بمرونة للأغراض الاجتماعية والأكاديمية والمهنية.",
    wordsEn: "8,000 - 16,000 words",
    wordsAr: "8,000 - 16,000 كلمة",
    durationEn: "400 - 600 hours",
    durationAr: "400 - 600 ساعة",
    pointsEn: [
      "Understanding a wide range of demanding, longer texts, and recognizing implicit meaning.",
      "Producing clear, well-structured, detailed text on complex subjects, showing controlled use of organizational patterns.",
      "Using advanced academic vocabulary, idioms, and subtle stylistic nuances.",
      "Expressing precise arguments and responding to complex counter-arguments."
    ],
    pointsAr: [
      "فهم مجموعة واسعة من النصوص الطويلة والصعبة، وإدراك المعاني الضمنية والمجازية.",
      "إنتاج نصوص واضحة وجيدة التنظيم ومفصلة حول مواضيع معقدة، تظهر تحكماً ممتازاً في هيكلية النص.",
      "استخدام المفردات الأكاديمية المتقدمة، التعابير الاصطلاحية، والفروق الدقيقة والأسلوبية الدقيقة.",
      "صياغة حجج دقيقة والاستجابة بمرونة للحجج المعقدة المضادة."
    ],
    tipsEn: [
      "Listen to educational English podcasts at 1.25x or 1.5x speed to stretch your listening limits.",
      "Practice IELTS Speaking Part 3 high-level argumentative structures.",
      "Read academic papers, essays, or literary fiction to absorb advanced syntax."
    ],
    tipsAr: [
      "استمع إلى البودكاست التعليمي باللغة الإنجليزية بسرعة 1.25x أو 1.5x لتوسيع قدرات الاستماع لديك.",
      "تدرب على هياكل المحاججة الرفيعة المخصصة للجزء الثالث من اختبار المحادثة في آيلتس.",
      "اقرأ الأوراق الأكاديمية، المقالات، أو الروايات الأدبية لامتصاص تراكيب الجمل المتقدمة."
    ]
  },
  {
    level: "C2",
    nameEn: "Proficient / Mastery",
    nameAr: "إتقان تام / طلاقة كاملة",
    objectiveEn: "Understand with ease virtually everything heard or read. Summarize information from different spoken and written sources, reconstructing arguments.",
    objectiveAr: "فهم كل شيء تسمعه أو تقرأه بسهولة تامة. تلخيص المعلومات من مصادر منطوقة ومكتوبة مختلفة، وإعادة بناء الحجج والتفسيرات.",
    wordsEn: "16,000+ words",
    wordsAr: "أكثر من 16,000 كلمة",
    durationEn: "600+ hours",
    durationAr: "أكثر من 600 ساعة",
    pointsEn: [
      "Expressing themselves spontaneously, very fluently and precisely, differentiating finer shades of meaning.",
      "Writing complex research papers, creative literature, and professional critical analyses.",
      "Commanding diverse cultural idioms, metaphors, and humor at a native-equivalent level.",
      "Effortlessly switching between different registers and speaking styles depending on the situation."
    ],
    pointsAr: [
      "التعبير عن أنفسهم بعفوية وبطلاقة ودقة تامة، مع تمييز الفروق الدقيقة في المعنى حتى في المواقف الأكثر تعقيداً.",
      "كتابة أوراق بحثية معقدة، وأعمال أدبية إبداعية، وتحليلات نقدية مهنية رفيعة المستوى.",
      "إتقان مختلف المصطلحات الثقافية، الاستعارات، والفكاهة بمستوى يعادل المتحدث الأصلي.",
      "التبديل بسهولة تامة بين مستويات اللغة وأنماط التحدث المختلفة حسب مقتضى الموقف."
    ],
    tipsEn: [
      "Immerse yourself entirely in professional academic journals and high-register publications.",
      "Start coaching or helping lower-level English learners (teaching is the highest form of learning).",
      "Write analytical reviews or engaging essays on complex, niche topics regularly."
    ],
    tipsAr: [
      "اغمر نفسك بالكامل في الدوريات الأكاديمية والمنشورات العلمية ذات الصياغة الرفيعة والمتقدمة.",
      "ابدأ بتدريب ومساعدة متعلمي اللغة الإنجليزية ذوي المستويات الأقل (التدريس هو أعلى أشكال التعلم).",
      "اكتب مراجعات تحليلية أو مقالات شيقة حول مواضيع دقيقة ومعقدة بانتظام."
    ]
  }
];

export default function TipsSection({ tips, isArabic, studentLevel }: TipsSectionProps) {
  const [activeTab, setActiveTab] = useState<"tips" | "levels">("tips");
  const [selectedLevel, setSelectedLevel] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeGuideLevel, setActiveGuideLevel] = useState<string>(studentLevel || "B1");

  const tipItems = tips.filter(x => x.type === "tip");
  const levels = ["All", "A1", "A2", "B1", "B2", "C1"];

  const filtered = tipItems.filter(item => {
    const matchesLevel = selectedLevel === "All" || item.level === "All" || item.level === selectedLevel;
    const matchesSearch = searchQuery.trim() === "" || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const selectedGuide = LEVEL_GUIDES.find(g => g.level === activeGuideLevel) || LEVEL_GUIDES[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-5xl mx-auto"
      id="tips-view-wrapper"
    >
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>{isArabic ? "النصائح والإرشادات الهامة" : "Tips and Instructions"}</span>
        </div>
        <h2 className="text-3xl font-black font-display text-slate-900">
          {isArabic ? "إرشادات واستراتيجيات ذهبية للتفوق" : "Strategic Study Advice & Tips"}
        </h2>
        <p className="text-slate-550 text-sm max-w-xl mx-auto leading-relaxed">
          {isArabic
            ? "نصائح وإرشادات علمية مقدمة من أساتذة المنصة لمساعدتك في التغلب على عوائق التحدث والاستماع والتعلم بكفاءة."
            : "Direct insights and advice compiled by professional tutors to supercharge your writing, listening, and speaking skills."}
        </p>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex justify-center border-b border-slate-200">
        <div className="flex gap-4 -mb-px">
          <button
            onClick={() => setActiveTab("tips")}
            className={`pb-3.5 px-2 text-sm font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "tips"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>{isArabic ? "الاستراتيجيات الذهبية للتفوق" : "Golden Strategies"}</span>
          </button>
          <button
            onClick={() => setActiveTab("levels")}
            className={`pb-3.5 px-2 text-sm font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "levels"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>{isArabic ? "دليل مستويات اللغة الإنجليزية" : "English Levels Guide"}</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "tips" ? (
          <motion.div
            key="tips-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
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
                            ? "bg-amber-600 text-white shadow-md shadow-amber-100"
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isArabic ? "ابحث عن نصيحة..." : "Search tips..."}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-slate-850"
                  />
                </div>
              </div>
            </div>

            {/* Grid of items */}
            {filtered.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-12 text-center text-slate-400 text-sm font-semibold">
                {isArabic ? "لا توجد نصائح مطابقة لخيارات البحث حالياً." : "No study tips found matching your filters."}
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
                        <span className="text-[10px] bg-amber-50 text-amber-700 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                          {item.level === "All" ? (isArabic ? "جميع المستويات" : "All Levels") : `${isArabic ? "مستوى" : "Level"} ${item.level}`}
                        </span>
                        <Info className="w-5 h-5 text-amber-500 shrink-0" />
                      </div>

                      <h3 className="text-lg font-black text-slate-900 leading-tight">
                        {item.title}
                      </h3>

                      <p className="text-slate-650 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                        {item.content}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="levels-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Level Selection Tabs */}
            <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex flex-wrap gap-2 justify-center">
              {LEVEL_GUIDES.map(g => {
                const isSelected = activeGuideLevel === g.level;
                const isCurrentLevel = studentLevel === g.level;
                return (
                  <button
                    key={g.level}
                    onClick={() => setActiveGuideLevel(g.level)}
                    className={`px-5 py-3 rounded-2xl text-sm font-black transition-all cursor-pointer relative flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-amber-600 text-white shadow-lg shadow-amber-100"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                    }`}
                  >
                    <span className="text-base font-mono">{g.level}</span>
                    <span className="text-xs opacity-90">({isArabic ? g.nameAr : g.nameEn})</span>
                    {isCurrentLevel && (
                      <span className="absolute -top-1.5 -right-1 bg-indigo-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">
                        {isArabic ? "مستواك" : "You"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Level Detailed View */}
            <motion.div
              key={activeGuideLevel}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="bg-white border border-slate-200 rounded-[32px] p-6 sm:p-8 shadow-sm space-y-6"
            >
              {/* Objective & Banner */}
              <div className="flex flex-col md:flex-row gap-6 justify-between items-start pb-6 border-b border-slate-100">
                <div className="space-y-2 text-left rtl:text-right">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-mono font-black text-amber-600 bg-amber-50 border border-amber-100 px-4 py-1.5 rounded-2xl">
                      {selectedGuide.level}
                    </span>
                    <div>
                      <h3 className="text-xl font-black text-slate-800">
                        {isArabic ? selectedGuide.nameAr : selectedGuide.nameEn}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {isArabic ? "المرجع الموحد للمستويات (CEFR)" : "CEFR LEVEL STANDARD"}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <p className="text-xs font-black text-slate-450 uppercase tracking-wider mb-1">
                      {isArabic ? "الهدف العام من المستوى:" : "Overall Level Objective:"}
                    </p>
                    <p className="text-slate-700 text-sm leading-relaxed font-medium">
                      {isArabic ? selectedGuide.objectiveAr : selectedGuide.objectiveEn}
                    </p>
                  </div>
                </div>

                {/* Level Stat Cards */}
                <div className="grid grid-cols-2 gap-4 w-full md:w-auto shrink-0">
                  <div className="bg-amber-50/50 border border-amber-100/60 p-4 rounded-2xl text-center flex flex-col justify-center items-center space-y-1">
                    <BookOpen className="w-5 h-5 text-amber-600" />
                    <span className="text-[9px] font-black text-slate-400 uppercase">{isArabic ? "الكلمات المستهدفة" : "Target Vocabulary"}</span>
                    <span className="text-xs font-black text-slate-800">{isArabic ? selectedGuide.wordsAr : selectedGuide.wordsEn}</span>
                  </div>

                  <div className="bg-indigo-50/50 border border-indigo-100/60 p-4 rounded-2xl text-center flex flex-col justify-center items-center space-y-1">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    <span className="text-[9px] font-black text-slate-400 uppercase">{isArabic ? "المدة المتوقعة" : "Expected Duration"}</span>
                    <span className="text-xs font-black text-slate-800">{isArabic ? selectedGuide.durationAr : selectedGuide.durationEn}</span>
                  </div>
                </div>
              </div>

              {/* Learning Points and Tips Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                {/* Learning Points */}
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Layers className="w-4.5 h-4.5 text-indigo-500" />
                    <span>{isArabic ? "النقاط التعليمية الرئيسية والمهارات" : "Key Learning & Competencies"}</span>
                  </h4>
                  <ul className="space-y-3 text-left rtl:text-right">
                    {(isArabic ? selectedGuide.pointsAr : selectedGuide.pointsEn).map((pt, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Success Tips */}
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Lightbulb className="w-4.5 h-4.5 text-amber-500" />
                    <span>{isArabic ? "استراتيجيات ونقاط تفوق للنجاح" : "Success Tips & Golden Rules"}</span>
                  </h4>
                  <ul className="space-y-3 text-left rtl:text-right">
                    {(isArabic ? selectedGuide.tipsAr : selectedGuide.tipsEn).map((tp, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-amber-50 border border-amber-150 text-amber-600 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                          ⭐
                        </span>
                        <span>{tp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
