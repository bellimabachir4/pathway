import React, { useState, useEffect } from "react";
import { 
  TrainingTopic, 
  TrainingQuestion,
  TypingSentence,
  LibraryBook,
  WeeklyTask
} from "../types";
import { 
  getTrainingTopics, 
  saveTrainingTopic, 
  deleteTrainingTopic, 
  getTrainingQuestions, 
  saveTrainingQuestion, 
  deleteTrainingQuestion,
  getTypingSentences,
  saveTypingSentence,
  deleteTypingSentence,
  getLibraryBooks,
  saveLibraryBook,
  deleteLibraryBook,
  subscribeToWeeklyTasks,
  saveWeeklyTask as saveWeeklyTaskDb,
  deleteWeeklyTask as deleteWeeklyTaskDb
} from "../lib/dbService";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Gamepad2, 
  Volume2, 
  PenTool, 
  Save, 
  Check, 
  AlertCircle, 
  Search,
  BookOpen,
  Keyboard,
  HelpCircle,
  Book,
  ChevronUp,
  ChevronDown,
  Palette,
  Calendar,
  Clock
} from "lucide-react";

interface TrainingAdminProps {
  isArabic: boolean;
  currentTeacher?: any;
}

const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function TrainingAdmin({ isArabic, currentTeacher }: TrainingAdminProps) {
  // Sub tabs: "speaking" | "writing" | "question" | "typing" | "library" | "weekly_tasks"
  const [subTab, setSubTab] = useState<"speaking" | "writing" | "question" | "typing" | "library" | "weekly_tasks">("speaking");

  // Loaded database state
  const [topics, setTopics] = useState<TrainingTopic[]>([]);
  const [questions, setQuestions] = useState<TrainingQuestion[]>([]);
  const [typingSentences, setTypingSentences] = useState<TypingSentence[]>([]);
  const [libraryBooks, setLibraryBooks] = useState<LibraryBook[]>([]);
  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTask[]>([]);
  const [loading, setLoading] = useState(true);

  // WEEKLY TASK FORM STATES
  const [showWeeklyTaskForm, setShowWeeklyTaskForm] = useState(false);
  const [editWeeklyTaskId, setEditWeeklyTaskId] = useState<string | null>(null);
  const [weeklyTaskForm, setWeeklyTaskForm] = useState({
    title: "",
    titleAr: "",
    day: "saturday" as any,
    level: "All" as any,
    order: 1
  });

  // LIBRARY BOOK FORM STATES
  const [showBookForm, setShowBookForm] = useState(false);
  const [editBookId, setEditBookId] = useState<string | null>(null);
  const [bookForm, setBookForm] = useState({
    bookNumber: 1,
    coverColor: "from-indigo-600 to-indigo-700",
    questionText: "",
    option0: "",
    option1: "",
    option2: "",
    option3: "",
    correctAnswerIndex: 0
  });

  // Filter & Search states
  const [levelFilter, setLevelFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // TOPIC FORM STATES (for speaking, writing, question wheels)
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [editTopicId, setEditTopicId] = useState<string | null>(null);
  const [topicForm, setTopicForm] = useState({
    name: "",
    level: "A1" as any,
    order: 1
  });

  // QUESTION/PROMPT FORM STATES
  const [selectedTopic, setSelectedTopic] = useState<TrainingTopic | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editQuestionId, setEditQuestionId] = useState<string | null>(null);
  const [questionForm, setQuestionForm] = useState({
    questionText: "",
    option0: "",
    option1: "",
    option2: "",
    option3: "",
    correctAnswerIndex: 0
  });

  // TYPING SENTENCE FORM STATES
  const [showTypingForm, setShowTypingForm] = useState(false);
  const [editTypingId, setEditTypingId] = useState<string | null>(null);
  const [typingForm, setTypingForm] = useState({
    sentence: "",
    level: "A1" as any,
    language: "en" as "en" | "ar"
  });

  useEffect(() => {
    loadData();
  }, []);

  // Real-time weekly tasks subscription for the active teacher
  useEffect(() => {
    const tId = currentTeacher?.uid || "teacher-sarah";
    const unsubscribe = subscribeToWeeklyTasks((fetchedTasks) => {
      setWeeklyTasks(fetchedTasks);
    }, tId);

    return () => {
      unsubscribe();
    };
  }, [currentTeacher]);

  // Whenever the subTab changes, clear the selections and forms
  useEffect(() => {
    setSelectedTopic(null);
    setShowTopicForm(false);
    setShowQuestionForm(false);
    setShowTypingForm(false);
    setShowBookForm(false);
    setEditBookId(null);
    setShowWeeklyTaskForm(false);
    setEditWeeklyTaskId(null);
  }, [subTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const allTopics = await getTrainingTopics();
      const allQuestions = await getTrainingQuestions();
      const allTyping = await getTypingSentences();
      const allBooks = await getLibraryBooks();
      setTopics(allTopics);
      setQuestions(allQuestions);
      setTypingSentences(allTyping);
      setLibraryBooks(allBooks);
    } catch (err) {
      console.error("Error loading training admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Save/Edit Topic
  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicForm.name.trim()) return;

    const newTopic: TrainingTopic = {
      id: editTopicId || `topic-${Date.now()}`,
      name: topicForm.name,
      level: topicForm.level,
      language: "en", // English topics default
      order: Number(topicForm.order) || 1,
      type: subTab === "question" ? "question" : subTab === "writing" ? "writing" : "speaking",
      createdAt: new Date().toISOString()
    };

    await saveTrainingTopic(newTopic);
    setShowTopicForm(false);
    setEditTopicId(null);
    setTopicForm({ name: "", level: "A1", order: 1 });
    loadData();
  };

  const handleEditTopic = (topic: TrainingTopic) => {
    setEditTopicId(topic.id);
    setTopicForm({
      name: topic.name,
      level: topic.level,
      order: topic.order || 1
    });
    setShowTopicForm(true);
  };

  const handleDeleteTopic = async (id: string) => {
    const confirmMsg = isArabic
      ? "هل أنت متأكد من حذف هذا الموضوع؟ سيتم حذف جميع الأسئلة والمطالبات المرتبطة به."
      : "Are you sure you want to delete this topic? All questions and prompts associated with it will be deleted.";
    
    if (window.confirm(confirmMsg)) {
      await deleteTrainingTopic(id);
      if (selectedTopic?.id === id) {
        setSelectedTopic(null);
      }
      loadData();
    }
  };

  // Save/Edit Question/Prompt
  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic) return;
    if (!questionForm.questionText.trim()) return;

    const isQuestionWheel = selectedTopic.type === "question";

    const newQuestion: TrainingQuestion = {
      id: editQuestionId || `q-${Date.now()}`,
      topicId: selectedTopic.id,
      questionText: questionForm.questionText,
      answerOptions: isQuestionWheel 
        ? [questionForm.option0, questionForm.option1, questionForm.option2, questionForm.option3].filter(Boolean)
        : [],
      correctAnswerIndex: isQuestionWheel ? Number(questionForm.correctAnswerIndex) : 0,
      createdAt: new Date().toISOString()
    };

    await saveTrainingQuestion(newQuestion);
    setShowQuestionForm(false);
    setEditQuestionId(null);
    setQuestionForm({ questionText: "", option0: "", option1: "", option2: "", option3: "", correctAnswerIndex: 0 });
    loadData();
  };

  const handleEditQuestion = (q: TrainingQuestion) => {
    setEditQuestionId(q.id);
    setQuestionForm({
      questionText: q.questionText,
      option0: q.answerOptions[0] || "",
      option1: q.answerOptions[1] || "",
      option2: q.answerOptions[2] || "",
      option3: q.answerOptions[3] || "",
      correctAnswerIndex: q.correctAnswerIndex || 0
    });
    setShowQuestionForm(true);
  };

  const handleDeleteQuestion = async (id: string) => {
    const confirmMsg = isArabic
      ? "هل أنت متأكد من حذف هذا السؤال/الموضوع؟"
      : "Are you sure you want to delete this prompt/question?";
    if (window.confirm(confirmMsg)) {
      await deleteTrainingQuestion(id);
      loadData();
    }
  };

  // Save/Edit Typing Sentence
  const handleTypingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typingForm.sentence.trim()) return;

    const newSentence: TypingSentence = {
      id: editTypingId || `typing-${Date.now()}`,
      sentence: typingForm.sentence.trim(),
      level: typingForm.level,
      language: typingForm.language,
      createdAt: new Date().toISOString()
    };

    await saveTypingSentence(newSentence);
    setShowTypingForm(false);
    setEditTypingId(null);
    setTypingForm({ sentence: "", level: "A1", language: "en" });
    loadData();
  };

  const handleEditTyping = (item: TypingSentence) => {
    setEditTypingId(item.id);
    setTypingForm({
      sentence: item.sentence,
      level: item.level,
      language: item.language || "en"
    });
    setShowTypingForm(true);
  };

  const handleDeleteTyping = async (id: string) => {
    const confirmMsg = isArabic
      ? "هل أنت متأكد من حذف جملة التدريب هذه؟"
      : "Are you sure you want to delete this typing sentence?";
    if (window.confirm(confirmMsg)) {
      await deleteTypingSentence(id);
      loadData();
    }
  };

  // Save/Edit Library Book
  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.questionText.trim()) return;

    const newBook: LibraryBook = {
      id: editBookId || `book-${Date.now()}`,
      bookNumber: Number(bookForm.bookNumber) || 1,
      coverColor: bookForm.coverColor,
      questionText: bookForm.questionText.trim(),
      options: [
        bookForm.option0.trim() || "Option A",
        bookForm.option1.trim() || "Option B",
        bookForm.option2.trim() || "Option C",
        bookForm.option3.trim() || "Option D"
      ],
      correctOptionIndex: Number(bookForm.correctAnswerIndex) || 0,
      createdAt: new Date().toISOString()
    };

    await saveLibraryBook(newBook);
    setShowBookForm(false);
    setEditBookId(null);
    setBookForm({
      bookNumber: libraryBooks.length + 2,
      coverColor: "from-indigo-600 to-indigo-700",
      questionText: "",
      option0: "",
      option1: "",
      option2: "",
      option3: "",
      correctAnswerIndex: 0
    });
    loadData();
  };

  const handleEditBook = (item: LibraryBook) => {
    setEditBookId(item.id);
    setBookForm({
      bookNumber: item.bookNumber,
      coverColor: item.coverColor || "from-indigo-600 to-indigo-700",
      questionText: item.questionText,
      option0: item.options[0] || "",
      option1: item.options[1] || "",
      option2: item.options[2] || "",
      option3: item.options[3] || "",
      correctAnswerIndex: item.correctOptionIndex
    });
    setShowBookForm(true);
  };

  const handleDeleteBook = async (id: string) => {
    const confirmMsg = isArabic
      ? "هل أنت متأكد من حذف هذا الكتاب من المكتبة؟"
      : "Are you sure you want to delete this book from the library?";
    if (window.confirm(confirmMsg)) {
      await deleteLibraryBook(id);
      loadData();
    }
  };

  const handleBookMoveUp = async (index: number) => {
    if (index === 0) return;
    const sorted = [...libraryBooks].sort((a, b) => a.bookNumber - b.bookNumber);
    const itemA = sorted[index];
    const itemB = sorted[index - 1];

    // Swap bookNumber
    const tempNum = itemA.bookNumber;
    itemA.bookNumber = itemB.bookNumber;
    itemB.bookNumber = tempNum;

    await saveLibraryBook(itemA);
    await saveLibraryBook(itemB);
    loadData();
  };

  const handleBookMoveDown = async (index: number) => {
    const sorted = [...libraryBooks].sort((a, b) => a.bookNumber - b.bookNumber);
    if (index >= sorted.length - 1) return;
    const itemA = sorted[index];
    const itemB = sorted[index + 1];

    // Swap bookNumber
    const tempNum = itemA.bookNumber;
    itemA.bookNumber = itemB.bookNumber;
    itemB.bookNumber = tempNum;

    await saveLibraryBook(itemA);
    await saveLibraryBook(itemB);
    loadData();
  };

  // Save/Edit Weekly Task
  const handleWeeklyTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weeklyTaskForm.title.trim() || !weeklyTaskForm.titleAr.trim()) return;

    const tId = currentTeacher?.uid || "teacher-sarah";
    const newTask: WeeklyTask = {
      id: editWeeklyTaskId || `wt-${Date.now()}`,
      teacherId: tId,
      title: weeklyTaskForm.title.trim(),
      titleAr: weeklyTaskForm.titleAr.trim(),
      day: weeklyTaskForm.day,
      level: weeklyTaskForm.level,
      order: Number(weeklyTaskForm.order) || 1,
      createdAt: new Date().toISOString()
    };

    await saveWeeklyTaskDb(tId, newTask);
    setShowWeeklyTaskForm(false);
    setEditWeeklyTaskId(null);
    setWeeklyTaskForm({ title: "", titleAr: "", day: "saturday", level: "All", order: 1 });
  };

  const handleEditWeeklyTask = (task: WeeklyTask) => {
    setEditWeeklyTaskId(task.id);
    setWeeklyTaskForm({
      title: task.title,
      titleAr: task.titleAr,
      day: task.day,
      level: task.level || "All",
      order: task.order || 1
    });
    setShowWeeklyTaskForm(true);
  };

  const handleDeleteWeeklyTask = async (id: string) => {
    const confirmMsg = isArabic
      ? "هل أنت متأكد من حذف هذه المهمة الأسبوعية؟"
      : "Are you sure you want to delete this weekly task?";
    if (window.confirm(confirmMsg)) {
      const tId = currentTeacher?.uid || "teacher-sarah";
      await deleteWeeklyTaskDb(tId, id);
    }
  };

  const handleWeeklyTaskMoveUp = async (index: number) => {
    if (index === 0) return;
    const sorted = [...weeklyTasks].sort((a, b) => (a.order || 0) - (b.order || 0));
    const itemA = sorted[index];
    const itemB = sorted[index - 1];

    // Swap order
    const tempOrder = itemA.order;
    itemA.order = itemB.order;
    itemB.order = tempOrder;

    const tId = currentTeacher?.uid || "teacher-sarah";
    await saveWeeklyTaskDb(tId, itemA);
    await saveWeeklyTaskDb(tId, itemB);
  };

  const handleWeeklyTaskMoveDown = async (index: number) => {
    const sorted = [...weeklyTasks].sort((a, b) => (a.order || 0) - (b.order || 0));
    if (index >= sorted.length - 1) return;
    const itemA = sorted[index];
    const itemB = sorted[index + 1];

    // Swap order
    const tempOrder = itemA.order;
    itemA.order = itemB.order;
    itemB.order = tempOrder;

    const tId = currentTeacher?.uid || "teacher-sarah";
    await saveWeeklyTaskDb(tId, itemA);
    await saveWeeklyTaskDb(tId, itemB);
  };

  // Filter topics based on active wheel mode
  const filteredTopics = topics.filter(t => {
    const activeType = subTab === "question" ? "question" : subTab === "writing" ? "writing" : "speaking";
    const matchesTab = t.type === activeType || (activeType === "speaking" && !t.type);
    const matchesLevel = levelFilter === "All" || t.level === levelFilter;
    const matchesSearch = searchQuery === "" || t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesLevel && matchesSearch;
  });

  // Current topic questions
  const currentTopicQuestions = selectedTopic
    ? questions.filter(q => q.topicId === selectedTopic.id)
    : [];

  // Filter typing sentences directly (typing sentences do not have topics)
  const filteredTypingSentences = typingSentences.filter(s => {
    const matchesLevel = levelFilter === "All" || s.level === levelFilter;
    const matchesSearch = searchQuery === "" || s.sentence.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm select-none" id="training-admin-root">
      
      {/* Header section with Icons */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between border-b border-slate-100 pb-5 mb-6 gap-4">
        <div className="flex items-center gap-3 text-left rtl:text-right">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100">
            <Gamepad2 className="w-6 h-6 stroke-[2.2px]" />
          </div>
          <div>
            <h2 className="text-lg font-black font-display text-slate-800">
              {isArabic ? "إدارة ألعاب وبوابة التدريب" : "Academic Training Portal Admin"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">
              {isArabic 
                ? "إدارة عجلة أسئلة التحدث، الكتابة، أسئلة القواعد، ومستودع جمل مدرب الكتابة السريعة." 
                : "Manage Speaking and Writing Wheel prompts, Grammar questions, and Typing Trainer content."}
            </p>
          </div>
        </div>

        {/* Tab switch buttons */}
        <div className="inline-flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50 flex-wrap gap-1">
          <button
            onClick={() => setSubTab("speaking")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
              subTab === "speaking" 
                ? "bg-white text-indigo-700 shadow-sm border border-indigo-100/55" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{isArabic ? "عجلة التحدث" : "Speaking Wheel"}</span>
          </button>
          
          <button
            onClick={() => setSubTab("writing")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
              subTab === "writing" 
                ? "bg-white text-indigo-700 shadow-sm border border-indigo-100/55" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>{isArabic ? "عجلة الكتابة" : "Writing Wheel"}</span>
          </button>

          <button
            onClick={() => setSubTab("question")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
              subTab === "question" 
                ? "bg-white text-indigo-700 shadow-sm border border-indigo-100/55" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{isArabic ? "عجلة القواعد" : "Grammar Wheel"}</span>
          </button>

          <button
            onClick={() => setSubTab("typing")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
              subTab === "typing" 
                ? "bg-white text-indigo-700 shadow-sm border border-indigo-100/55" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>{isArabic ? "جمل الكتابة" : "Typing Sentences"}</span>
          </button>

          <button
            onClick={() => setSubTab("library")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
              subTab === "library" 
                ? "bg-white text-indigo-700 shadow-sm border border-indigo-100/55" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Book className="w-3.5 h-3.5 text-amber-600" />
            <span>{isArabic ? "مكتبة الأسئلة" : "Question Library"}</span>
          </button>

          <button
            onClick={() => setSubTab("weekly_tasks")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
              subTab === "weekly_tasks" 
                ? "bg-white text-indigo-700 shadow-sm border border-indigo-100/55" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isArabic ? "المهام الأسبوعية" : "Weekly Tasks"}</span>
          </button>
        </div>
      </div>

      {/* FILTER BOX */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/50 border border-slate-200/50 rounded-2xl p-4 mb-6">
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">
            {isArabic ? "تصفية حسب المستوى" : "Filter by Level"}
          </label>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-700 font-bold outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">{isArabic ? "جميع المستويات" : "All Levels"}</option>
            {levels.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">
            {isArabic ? "البحث عن جملة أو موضوع" : "Search query"}
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 rtl:right-3 rtl:left-auto" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isArabic ? "أدخل كلمة للبحث..." : "Enter keyword to search..."}
              className="w-full text-xs pl-9 pr-4 rtl:pr-9 rtl:pl-4 py-2 border border-slate-200 rounded-xl bg-white text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 font-medium font-sans"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 font-bold text-xs animate-pulse">
          {isArabic ? "جاري تحميل سجلات التدريب..." : "Loading database logs..."}
        </div>
      ) : subTab === "typing" ? (
        // ==================== TYPING TRAINER DIRECT CRUD ====================
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5" />
              {isArabic ? "مستودع جمل سرعة الكتابة" : "Typing Sentences Core"} ({filteredTypingSentences.length})
            </span>
            <button
              onClick={() => {
                setEditTypingId(null);
                setTypingForm({ sentence: "", level: "A1", language: "en" });
                setShowTypingForm(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-black bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isArabic ? "إضافة جملة جديدة" : "Add Sentence"}</span>
            </button>
          </div>

          {showTypingForm && (
            <form onSubmit={handleTypingSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 max-w-xl mx-auto animate-fade-in">
              <h4 className="text-xs font-black text-slate-800 border-b border-slate-150 pb-2">
                {editTypingId ? (isArabic ? "تعديل جملة التدريب" : "Edit Typing Sentence") : (isArabic ? "إضافة جملة تدريب جديدة" : "Add New Typing Sentence")}
              </h4>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 mb-1">{isArabic ? "مضمون السلسلة النصية (بالانجليزية)" : "Target Sentence (English)"}</label>
                <input
                  type="text"
                  required
                  value={typingForm.sentence}
                  onChange={(e) => setTypingForm({ ...typingForm, sentence: e.target.value })}
                  placeholder="e.g., The quick brown fox jumps over the lazy dog."
                  className="w-full text-xs font-mono p-3 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-rose-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 mb-1">{isArabic ? "المستوى اللغوي" : "Level Code"}</label>
                  <select
                    value={typingForm.level}
                    onChange={(e) => setTypingForm({ ...typingForm, level: e.target.value as any })}
                    className="w-full text-xs px-2 py-2 border border-slate-200 bg-white rounded-lg font-bold"
                  >
                    {levels.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 mb-1">{isArabic ? "اللغة" : "Language"}</label>
                  <select
                    value={typingForm.language}
                    onChange={(e) => setTypingForm({ ...typingForm, language: e.target.value as any })}
                    className="w-full text-xs px-2 py-2 border border-slate-200 bg-white rounded-lg font-bold"
                  >
                    <option value="en">English</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setShowTypingForm(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-700"
                >
                  {isArabic ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-black bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isArabic ? "حفظ" : "Save"}</span>
                </button>
              </div>
            </form>
          )}

          {/* Typing sentences table list */}
          <div className="border border-slate-150 rounded-2xl overflow-hidden bg-white">
            <table className="w-full border-collapse text-left rtl:text-right text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-extrabold select-none">
                  <th className="p-4 w-20">{isArabic ? "المستوى" : "Level"}</th>
                  <th className="p-4">{isArabic ? "جملة التدريب" : "Target Sentence"}</th>
                  <th className="p-4 w-24 text-center">{isArabic ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredTypingSentences.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-400">
                      {isArabic ? "لا توجد جمل مضافة للمستوى المختار حالياً." : "No typing sentences found."}
                    </td>
                  </tr>
                ) : (
                  filteredTypingSentences.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded text-[10px] font-black font-mono">
                          {item.level}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-700 max-w-md truncate">
                        {item.sentence}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEditTyping(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                            title={isArabic ? "تعديل" : "Edit"}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTyping(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                            title={isArabic ? "حذف" : "Delete"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : subTab === "weekly_tasks" ? (
        // ==================== WEEKLY TASKS SCHEDULE CRUD ====================
        <div className="space-y-6" id="weekly-tasks-admin-container">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              {isArabic ? "إدارة خطة المهام الأسبوعية" : "Weekly Tasks Schedule Manager"} ({weeklyTasks.length})
            </span>
            <button
              onClick={() => {
                setEditWeeklyTaskId(null);
                setWeeklyTaskForm({
                  title: "",
                  titleAr: "",
                  day: "saturday",
                  level: "All",
                  order: weeklyTasks.length > 0 ? Math.max(...weeklyTasks.map(t => t.order || 1)) + 1 : 1
                });
                setShowWeeklyTaskForm(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isArabic ? "إضافة مهمة جديدة" : "Add Task"}</span>
            </button>
          </div>

          {showWeeklyTaskForm && (
            <form onSubmit={handleWeeklyTaskSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 max-w-xl mx-auto animate-fade-in">
              <h4 className="text-xs font-black text-slate-800 border-b border-slate-150 pb-2">
                {editWeeklyTaskId ? (isArabic ? "تعديل المهمة الأسبوعية" : "Edit Weekly Task") : (isArabic ? "إضافة مهمة أسبوعية جديدة" : "Add New Weekly Task")}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 mb-1">{isArabic ? "المهمة (بالانجليزية)" : "Task Title (English)"}</label>
                  <input
                    type="text"
                    required
                    value={weeklyTaskForm.title}
                    onChange={(e) => setWeeklyTaskForm({ ...weeklyTaskForm, title: e.target.value })}
                    placeholder="e.g., Read the grammar guide about past simple"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 mb-1">{isArabic ? "المهمة (بالعربية)" : "Task Title (Arabic)"}</label>
                  <input
                    type="text"
                    required
                    value={weeklyTaskForm.titleAr}
                    onChange={(e) => setWeeklyTaskForm({ ...weeklyTaskForm, titleAr: e.target.value })}
                    placeholder="مثال: اقرأ دليل القواعد حول الماضي البسيط"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 mb-1">{isArabic ? "اليوم" : "Day"}</label>
                  <select
                    value={weeklyTaskForm.day}
                    onChange={(e) => setWeeklyTaskForm({ ...weeklyTaskForm, day: e.target.value as any })}
                    className="w-full text-xs p-2 border border-slate-200 bg-white rounded-xl font-bold font-sans"
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
                  <label className="block text-[9px] font-bold text-slate-400 mb-1">{isArabic ? "المستوى" : "Level"}</label>
                  <select
                    value={weeklyTaskForm.level}
                    onChange={(e) => setWeeklyTaskForm({ ...weeklyTaskForm, level: e.target.value as any })}
                    className="w-full text-xs p-2 border border-slate-200 bg-white rounded-xl font-bold font-sans"
                  >
                    <option value="All">{isArabic ? "جميع المستويات" : "All Levels"}</option>
                    {levels.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 mb-1">{isArabic ? "الترتيب" : "Order Weight"}</label>
                  <input
                    type="number"
                    required
                    value={weeklyTaskForm.order}
                    onChange={(e) => setWeeklyTaskForm({ ...weeklyTaskForm, order: Number(e.target.value) })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-xl font-bold bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200/50 pt-3">
                <button
                  type="button"
                  onClick={() => setShowWeeklyTaskForm(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  {isArabic ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md cursor-pointer"
                >
                  {isArabic ? "حفظ" : "Save"}
                </button>
              </div>
            </form>
          )}

          {/* Day grouped Accordion/List for Teacher */}
          <div className="space-y-4">
            {[
              { key: "saturday", labelEn: "Saturday", labelAr: "السبت" },
              { key: "sunday", labelEn: "Sunday", labelAr: "الأحد" },
              { key: "monday", labelEn: "Monday", labelAr: "الإثنين" },
              { key: "tuesday", labelEn: "Tuesday", labelAr: "الثلاثاء" },
              { key: "wednesday", labelEn: "Wednesday", labelAr: "الأربعاء" },
              { key: "thursday", labelEn: "Thursday", labelAr: "الخميس" },
              { key: "friday", labelEn: "Friday", labelAr: "الجمعة" },
            ].map((dayItem) => {
              const dayTasks = weeklyTasks
                .filter(t => t.day === dayItem.key)
                .filter(t => levelFilter === "All" || t.level === levelFilter || t.level === "All")
                .sort((a, b) => (a.order || 0) - (b.order || 0));

              return (
                <div key={dayItem.key} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <div className="bg-slate-50/70 p-3.5 px-4 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                      <h3 className="text-xs font-black text-slate-800">
                        {isArabic ? dayItem.labelAr : dayItem.labelEn}
                      </h3>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold bg-white border border-slate-200 px-2 py-0.5 rounded-full font-sans">
                      {dayTasks.length} {isArabic ? "مهام" : "tasks"}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {dayTasks.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 italic font-sans">
                        {isArabic ? "لا توجد مهام مجدولة لهذا اليوم." : "No tasks scheduled for this day."}
                      </div>
                    ) : (
                      dayTasks.map((task, idx) => (
                        <div key={task.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/30 transition-colors">
                          <div className="text-left rtl:text-right space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded uppercase font-sans">
                                {task.level || "All"}
                              </span>
                              <h4 className="text-xs font-extrabold text-slate-700">
                                {task.title}
                              </h4>
                            </div>
                            <p className="text-[10px] text-slate-400 font-semibold">
                              {task.titleAr}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 justify-end">
                            {/* Reordering buttons */}
                            <button
                              type="button"
                              onClick={() => handleWeeklyTaskMoveUp(idx)}
                              disabled={idx === 0}
                              className={`p-1 rounded border border-slate-200/50 hover:bg-white text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent ${idx === 0 ? "" : "cursor-pointer"}`}
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleWeeklyTaskMoveDown(idx)}
                              disabled={idx === dayTasks.length - 1}
                              className={`p-1 rounded border border-slate-200/50 hover:bg-white text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent ${idx === dayTasks.length - 1 ? "" : "cursor-pointer"}`}
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleEditWeeklyTask(task)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-slate-200 rounded-lg transition-all cursor-pointer ml-1"
                              title={isArabic ? "تعديل" : "Edit"}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteWeeklyTask(task.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-slate-200 rounded-lg transition-all cursor-pointer"
                              title={isArabic ? "حذف" : "Delete"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : subTab === "library" ? (
        // ==================== QUESTION LIBRARY (LIBRARY BOOK) CRUD ====================
        <div className="space-y-4" id="library-admin-container">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Book className="w-3.5 h-3.5 text-amber-600" />
              {isArabic ? "إدارة كتب مكتبة الأسئلة" : "Question Library Bookshelf Manager"} ({libraryBooks.length})
            </span>
            <button
              onClick={() => {
                setEditBookId(null);
                setBookForm({
                  bookNumber: libraryBooks.length > 0 ? Math.max(...libraryBooks.map(b => b.bookNumber)) + 1 : 1,
                  coverColor: "from-indigo-600 to-indigo-700",
                  questionText: "",
                  option0: "",
                  option1: "",
                  option2: "",
                  option3: "",
                  correctAnswerIndex: 0
                });
                setShowBookForm(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-black bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isArabic ? "إنشاء كتاب جديد" : "Create New Book"}</span>
            </button>
          </div>

          {showBookForm && (
            <form onSubmit={handleBookSubmit} className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4 max-w-2xl mx-auto animate-fade-in shadow-sm">
              <h4 className="text-xs font-black text-slate-800 border-b border-slate-150 pb-2.5 flex items-center gap-2">
                <Book className="w-4 h-4 text-amber-600" />
                <span>
                  {editBookId ? (isArabic ? "تعديل بيانات الكتاب" : "Edit Book Details") : (isArabic ? "إضافة كتاب جديد للمكتبة" : "Create New Library Book")}
                </span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">{isArabic ? "رقم الكتاب" : "Book Number"}</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={bookForm.bookNumber}
                    onChange={(e) => setBookForm({ ...bookForm, bookNumber: Number(e.target.value) })}
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-amber-500 bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">{isArabic ? "لون غلاف الكتاب" : "Book Cover Style"}</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      { name: "Indigo", value: "from-indigo-600 to-indigo-700" },
                      { name: "Emerald", value: "from-emerald-600 to-emerald-700" },
                      { name: "Rose", value: "from-rose-600 to-rose-700" },
                      { name: "Amber", value: "from-amber-500 to-amber-600" },
                      { name: "Purple", value: "from-purple-600 to-purple-700" },
                      { name: "Cyan", value: "from-cyan-600 to-cyan-700" },
                      { name: "Slate", value: "from-slate-600 to-slate-700" }
                    ].map((col) => (
                      <button
                        key={col.value}
                        type="button"
                        onClick={() => setBookForm({ ...bookForm, coverColor: col.value })}
                        className={`w-6 h-6 rounded-full bg-gradient-to-br ${col.value} border-2 ${
                          bookForm.coverColor === col.value ? "border-slate-800 scale-110 shadow-md" : "border-transparent opacity-80 hover:opacity-100"
                        } transition-all`}
                        title={col.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">
                  {isArabic ? "السؤال اللغوي أو الأكاديمي (سؤال واحد فقط داخل الكتاب)" : "Academic Challenge Question (Only 1 per book)"}
                </label>
                <textarea
                  required
                  rows={2}
                  value={bookForm.questionText}
                  onChange={(e) => setBookForm({ ...bookForm, questionText: e.target.value })}
                  placeholder={isArabic ? "اكتب السؤال هنا بالتفصيل..." : "Write the question prompt here..."}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-amber-500 bg-white leading-relaxed font-sans font-semibold text-slate-700"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">
                  {isArabic ? "خيارات الإجابة الأربعة" : "Four Answer Options"}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block mb-1">Option A</span>
                    <input
                      type="text"
                      required
                      value={bookForm.option0}
                      onChange={(e) => setBookForm({ ...bookForm, option0: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl outline-none bg-white font-medium"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block mb-1">Option B</span>
                    <input
                      type="text"
                      required
                      value={bookForm.option1}
                      onChange={(e) => setBookForm({ ...bookForm, option1: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl outline-none bg-white font-medium"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block mb-1">Option C</span>
                    <input
                      type="text"
                      required
                      value={bookForm.option2}
                      onChange={(e) => setBookForm({ ...bookForm, option2: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl outline-none bg-white font-medium"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block mb-1">Option D</span>
                    <input
                      type="text"
                      required
                      value={bookForm.option3}
                      onChange={(e) => setBookForm({ ...bookForm, option3: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl outline-none bg-white font-medium"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">{isArabic ? "تحديد الخيار الصحيح" : "Correct Answer Choice"}</label>
                <select
                  value={bookForm.correctAnswerIndex}
                  onChange={(e) => setBookForm({ ...bookForm, correctAnswerIndex: Number(e.target.value) })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-xl font-bold outline-none focus:ring-1 focus:ring-amber-500 text-slate-700"
                >
                  <option value={0}>Option A (Index 0)</option>
                  <option value={1}>Option B (Index 1)</option>
                  <option value={2}>Option C (Index 2)</option>
                  <option value={3}>Option D (Index 3)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setShowBookForm(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-700"
                >
                  {isArabic ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black bg-amber-600 hover:bg-amber-700 text-white rounded-xl cursor-pointer flex items-center gap-1 shadow-md shadow-amber-100"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isArabic ? "حفظ الكتاب" : "Save Book"}</span>
                </button>
              </div>
            </form>
          )}

          {/* Library Books List */}
          <div className="border border-slate-150 rounded-2xl overflow-hidden bg-white">
            <table className="w-full border-collapse text-left rtl:text-right text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-extrabold select-none">
                  <th className="p-4 w-28 text-center">{isArabic ? "شكل الغلاف" : "Cover Style"}</th>
                  <th className="p-4 w-24">{isArabic ? "رقم الكتاب" : "Book No."}</th>
                  <th className="p-4">{isArabic ? "السؤال" : "Academic Question"}</th>
                  <th className="p-4 w-28 text-center">{isArabic ? "ترتيب الرف" : "Reorder"}</th>
                  <th className="p-4 w-24 text-center">{isArabic ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {libraryBooks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 font-bold">
                      {isArabic ? "المكتبة فارغة حالياً. قم بإضافة أول كتاب!" : "No books in the library bookshelf. Add your first book!"}
                    </td>
                  </tr>
                ) : (
                  [...libraryBooks]
                    .sort((a, b) => a.bookNumber - b.bookNumber)
                    .map((item, index) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 text-center">
                          <span className={`inline-block w-8 h-10 rounded shadow-xs border-l-2 border-black/25 bg-gradient-to-r ${item.coverColor || 'from-indigo-600 to-indigo-700'}`} />
                        </td>
                        <td className="p-4 font-black font-mono text-slate-700">
                          {item.bookNumber}
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <span className="font-extrabold text-slate-800 block text-xs font-sans leading-relaxed">{item.questionText}</span>
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {item.options.map((opt, i) => (
                                <span
                                  key={i}
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${
                                    i === item.correctOptionIndex
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-150 font-black"
                                      : "bg-slate-50 text-slate-400 border-slate-100"
                                  }`}
                                >
                                  {String.fromCharCode(65 + i)}. {opt}
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleBookMoveUp(index)}
                              className="p-1 text-slate-400 hover:text-amber-600 disabled:opacity-30 rounded-md border border-transparent hover:border-slate-150 transition-all cursor-pointer"
                              title={isArabic ? "تحريك لأعلى" : "Move Up"}
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={index === libraryBooks.length - 1}
                              onClick={() => handleBookMoveDown(index)}
                              className="p-1 text-slate-400 hover:text-amber-600 disabled:opacity-30 rounded-md border border-transparent hover:border-slate-150 transition-all cursor-pointer"
                              title={isArabic ? "تحريك لأسفل" : "Move Down"}
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEditBook(item)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                              title={isArabic ? "تعديل" : "Edit"}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBook(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                              title={isArabic ? "حذف" : "Delete"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // ==================== WHEELS MANAGEMENT (SPEAKING, WRITING, QUESTION) ====================
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT PANEL: TOPICS LIST */}
          <div className="lg:col-span-5 border border-slate-200 rounded-2xl p-4 flex flex-col h-[550px]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-150">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                {isArabic ? "المواضيع الدراسية للعجلة" : "Spin Wheel Topics"} ({filteredTopics.length})
              </span>
              <button
                onClick={() => {
                  setEditTopicId(null);
                  setTopicForm({ name: "", level: "A1", order: topics.length + 1 });
                  setShowTopicForm(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-150 hover:bg-indigo-100 rounded-xl cursor-pointer"
              >
                <Plus className="w-3 h-3 stroke-[2.5px]" />
                <span>{isArabic ? "موضوع جديد" : "New Topic"}</span>
              </button>
            </div>

            {/* TOPIC FORM OVERLAY */}
            {showTopicForm && (
              <form onSubmit={handleTopicSubmit} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 mb-3 animate-fade-in shrink-0">
                <h4 className="text-[11px] font-black text-slate-700 border-b border-slate-150 pb-1">
                  {editTopicId ? (isArabic ? "تعديل الموضوع" : "Edit Topic Details") : (isArabic ? "إضافة موضوع جديد" : "Create New Topic")}
                </h4>
                
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 mb-1">{isArabic ? "اسم فئة العجلة (بالانجليزية)" : "Category Name (English)"}</label>
                  <input
                    type="text"
                    required
                    value={topicForm.name}
                    onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })}
                    placeholder="e.g., Simple Present or Travel Habits"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 mb-1">{isArabic ? "المستوى" : "Level"}</label>
                    <select
                      value={topicForm.level}
                      onChange={(e) => setTopicForm({ ...topicForm, level: e.target.value as any })}
                      className="w-full text-xs px-2 py-1.5 border border-slate-200 bg-white rounded-lg font-bold animate-fade-in"
                    >
                      {levels.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 mb-1">{isArabic ? "ترتيب الظهور" : "Order Sequence"}</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={topicForm.order}
                      onChange={(e) => setTopicForm({ ...topicForm, order: Number(e.target.value) })}
                      className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-1.5 border-t border-slate-200/50 pt-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowTopicForm(false)}
                    className="px-2.5 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-700"
                  >
                    {isArabic ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1 px-3 py-1 text-[10px] font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm cursor-pointer"
                  >
                    <Save className="w-3 h-3" />
                    <span>{isArabic ? "حفظ" : "Save"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TOPICS SCROLL LIST */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredTopics.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  {isArabic ? "لا توجد مواضيع مضافة للمستوى المختار حالياً." : "No categories found for this filter."}
                </div>
              ) : (
                filteredTopics.map((topic) => {
                  const isSelected = selectedTopic?.id === topic.id;
                  const topicQuestionsCount = questions.filter(q => q.topicId === topic.id).length;
                  return (
                    <div
                      key={topic.id}
                      onClick={() => {
                        setSelectedTopic(topic);
                        setShowQuestionForm(false);
                      }}
                      className={`p-3 border rounded-xl transition-all cursor-pointer text-left rtl:text-right flex items-center justify-between gap-3 ${
                        isSelected 
                          ? "bg-indigo-50/50 border-indigo-200 ring-1 ring-indigo-200" 
                          : "bg-slate-50/30 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="text-[9px] font-black font-mono bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                            {topic.level}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">
                            {isArabic ? "ترتيب:" : "order:"} {topic.order || 1}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-slate-800 truncate leading-relaxed font-sans">
                          {topic.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {isArabic ? `الأسئلة: ${topicQuestionsCount}` : `Questions/Prompts: ${topicQuestionsCount}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTopic(topic);
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                          title={isArabic ? "تعديل" : "Edit"}
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTopic(topic.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                          title={isArabic ? "حذف" : "Delete"}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT PANEL: QUESTIONS LIST */}
          <div className="lg:col-span-7 border border-slate-200 rounded-2xl p-4 flex flex-col h-[550px]">
            {selectedTopic ? (
              <div className="flex flex-col h-full">
                
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-150 shrink-0">
                  <div className="text-left rtl:text-right min-w-0">
                    <span className="text-[8.5px] font-black uppercase text-indigo-600 block mb-0.5 font-sans">
                      {isArabic ? `الأسئلة المدرجة للموضوع (${selectedTopic.level})` : `Included Prompts (${selectedTopic.level})`}
                    </span>
                    <h3 className="font-extrabold text-xs text-slate-800 truncate max-w-sm font-sans">
                      {selectedTopic.name}
                    </h3>
                  </div>

                  <button
                    onClick={() => {
                      setEditQuestionId(null);
                      setQuestionForm({ questionText: "", option0: "", option1: "", option2: "", option3: "", correctAnswerIndex: 0 });
                      setShowQuestionForm(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isArabic ? "سؤال جديد" : "New Prompt"}</span>
                  </button>
                </div>

                {/* Question form with custom options if subTab is "question" */}
                {showQuestionForm && (
                  <form onSubmit={handleQuestionSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 mb-3 overflow-y-auto shrink-0 animate-fade-in max-h-[380px]">
                    <h4 className="text-[11px] font-black text-slate-800 border-b border-slate-150 pb-1.5">
                      {editQuestionId ? (isArabic ? "تعديل السؤال" : "Edit Question Details") : (isArabic ? "إضافة سؤال للموضوع" : "Create New Question")}
                    </h4>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 mb-1">{isArabic ? "مضمون السؤال (بالانجليزية)" : "Question/Prompt Text"}</label>
                      <textarea
                        required
                        rows={2}
                        value={questionForm.questionText}
                        onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                        placeholder="e.g., Which word has a similar meaning to 'Vast'?"
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-700 leading-relaxed font-sans"
                      />
                    </div>

                    {/* Show Multiple Choice inputs if subTab === "question" */}
                    {subTab === "question" && (
                      <div className="space-y-2 border-t border-slate-150 pt-2">
                        <span className="block text-[9px] font-black text-indigo-600 uppercase tracking-wider mb-1">{isArabic ? "خيارات الإجابة المتعددة" : "Multiple Choice Options"}</span>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[8px] font-bold text-slate-400 mb-0.5">Option A (Index 0)</label>
                            <input
                              type="text"
                              required
                              value={questionForm.option0}
                              onChange={(e) => setQuestionForm({ ...questionForm, option0: e.target.value })}
                              className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-white font-semibold text-slate-700"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-bold text-slate-400 mb-0.5">Option B (Index 1)</label>
                            <input
                              type="text"
                              required
                              value={questionForm.option1}
                              onChange={(e) => setQuestionForm({ ...questionForm, option1: e.target.value })}
                              className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-white font-semibold text-slate-700"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-bold text-slate-400 mb-0.5">Option C (Index 2)</label>
                            <input
                              type="text"
                              required
                              value={questionForm.option2}
                              onChange={(e) => setQuestionForm({ ...questionForm, option2: e.target.value })}
                              className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-white font-semibold text-slate-700"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-bold text-slate-400 mb-0.5">Option D (Index 3)</label>
                            <input
                              type="text"
                              required
                              value={questionForm.option3}
                              onChange={(e) => setQuestionForm({ ...questionForm, option3: e.target.value })}
                              className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-white font-semibold text-slate-700"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 mb-1">{isArabic ? "خيار الإجابة الصحيحة:" : "Index of Correct Option:"}</label>
                          <select
                            value={questionForm.correctAnswerIndex}
                            onChange={(e) => setQuestionForm({ ...questionForm, correctAnswerIndex: Number(e.target.value) })}
                            className="text-xs px-2 py-1.5 border border-slate-200 bg-white rounded-lg font-bold w-full"
                          >
                            <option value={0}>Option A (Index 0)</option>
                            <option value={1}>Option B (Index 1)</option>
                            <option value={2}>Option C (Index 2)</option>
                            <option value={3}>Option D (Index 3)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-1.5 border-t border-slate-200/50 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowQuestionForm(false)}
                        className="px-2.5 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-700"
                      >
                        {isArabic ? "إلغاء" : "Cancel"}
                      </button>
                      <button
                        type="submit"
                        className="flex items-center gap-1 px-3 py-1 text-[10px] font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isArabic ? "حفظ" : "Save"}</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Questions Scroll List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {currentTopicQuestions.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                      {isArabic ? "لا توجد أسئلة مضافة في هذا الموضوع حالياً." : "No questions or prompts added under this category yet."}
                    </div>
                  ) : (
                    currentTopicQuestions.map((q, index) => (
                      <div key={q.id} className="p-3.5 bg-slate-50 border border-slate-200/70 hover:border-slate-350 rounded-xl flex justify-between items-start gap-3 animate-fade-in">
                        <div className="space-y-1.5 text-left rtl:text-right flex-1 min-w-0">
                          <span className="text-[9.5px] font-black font-mono text-indigo-600 block">Prompt #{index + 1}</span>
                          <h5 className="font-extrabold text-xs text-slate-800 leading-relaxed font-sans">{q.questionText}</h5>
                          {q.answerOptions.length > 0 && (
                            <div className="grid grid-cols-2 gap-1 pt-1.5">
                              {q.answerOptions.map((opt, i) => (
                                <span 
                                  key={i} 
                                  className={`px-2 py-1 rounded text-[10px] font-mono leading-none border ${
                                    i === q.correctAnswerIndex 
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold" 
                                      : "bg-white text-slate-500 border-slate-100"
                                  }`}
                                >
                                  {i === 0 ? "A" : i === 1 ? "B" : i === 2 ? "C" : "D"}. {opt}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-0.5 mt-0.5 shrink-0">
                          <button
                            onClick={() => handleEditQuestion(q)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all cursor-pointer"
                            title={isArabic ? "تعديل" : "Edit"}
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-slate-200 rounded-lg transition-all cursor-pointer"
                            title={isArabic ? "حذف" : "Delete"}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-slate-50/30 rounded-2xl text-slate-400 border border-dashed border-slate-200">
                {subTab === "speaking" ? (
                  <>
                    <Volume2 className="w-12 h-12 stroke-[1.5px] text-slate-300 animate-pulse mb-3" />
                    <p className="text-xs font-extrabold leading-relaxed max-w-xs font-sans">
                      {isArabic 
                        ? "اختر موضوع تصفح من القائمة الجانبية لعرض أو إدارة أسئلة عجلة التحدث." 
                        : "Select a speaking topic from the sidebar to view, manage, or add speaking wheel questions."}
                    </p>
                  </>
                ) : subTab === "writing" ? (
                  <>
                    <PenTool className="w-12 h-12 stroke-[1.5px] text-slate-300 animate-pulse mb-3" />
                    <p className="text-xs font-extrabold leading-relaxed max-w-xs font-sans">
                      {isArabic 
                        ? "اختر موضوع كتابة من القائمة الجانبية لعرض أو إدارة مواضيع وعناوين عجلة الكتابة." 
                        : "Select a writing topic from the sidebar to view, manage, or add writing prompts."}
                    </p>
                  </>
                ) : (
                  <>
                    <HelpCircle className="w-12 h-12 stroke-[1.5px] text-slate-300 animate-pulse mb-3" />
                    <p className="text-xs font-extrabold leading-relaxed max-w-xs font-sans">
                      {isArabic 
                        ? "اختر فئة قواعد من القائمة الجانبية لعرض أو إدارة أسئلة الخيارات المتعددة لعجلة القواعد." 
                        : "Select a grammar category from the sidebar to view, manage, or add multiple choice quiz questions."}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
