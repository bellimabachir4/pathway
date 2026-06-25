import React, { useState, useEffect } from "react";
import { 
  Teacher, 
  Student, 
  Lesson, 
  Vocabulary, 
  LiveSession,
  ChatMessage
} from "../types";
import { 
  getTeachers, 
  addTeacher, 
  updateTeacher,
  deleteTeacher,
  getAllStudents, 
  saveLesson, 
  deleteLesson, 
  saveVocabulary, 
  deleteVocabulary,
  saveLiveSession,
  deleteLiveSession,
  addChatMessage,
  getChatHistory,
  updateStudent,
  deleteStudent,
  getAnnouncements,
  saveAnnouncement,
  deleteAnnouncement
} from "../lib/dbService";
import { Announcement } from "../types";
import { 
  ShieldAlert, 
  ShieldCheck,
  Lock,
  Unlock,
  Plus, 
  Trash2, 
  Edit, 
  Users, 
  BookOpen, 
  FileText, 
  Video, 
  UserPlus, 
  Check, 
  Send,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  LogOut,
  Megaphone
} from "lucide-react";

interface TeacherDashboardProps {
  currentTeacher: Teacher | null;
  onSelectTeacher: (teacher: Teacher | null) => void;
  lessons: Lesson[];
  vocabulary: Vocabulary[];
  liveSessions: LiveSession[];
  onRefreshData: () => void;
  isArabic: boolean;
}

export default function TeacherDashboard({
  currentTeacher,
  onSelectTeacher,
  lessons,
  vocabulary,
  liveSessions,
  onRefreshData,
  isArabic,
}: TeacherDashboardProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [activeTab, setActiveTab] = useState<"lessons" | "vocab" | "live" | "students" | "announcements">("lessons");

  // Announcements tab state
  const [announcementsList, setAnnouncementsList] = useState<Announcement[]>([]);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    targetAll: true,
    selectedStudentIds: [] as string[]
  });

  // Account creation state
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ name: "", email: "", loginCode: "" });

  // Verification state for entering teacher-specific portal
  const [verifyingTeacher, setVerifyingTeacher] = useState<Teacher | null>(null);
  const [teacherLoginCodeInput, setTeacherLoginCodeInput] = useState("");
  const [teacherLoginError, setTeacherLoginError] = useState(false);
  const [teacherLoginErrorText, setTeacherLoginErrorText] = useState("");

  // Admin access state
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [adminCodeInput, setAdminCodeInput] = useState("");
  const [adminLoginError, setAdminLoginError] = useState(false);

  // Add content forms toggles & details
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editLessonId, setEditLessonId] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState({
    title: "",
    titleAr: "",
    category: "grammar" as any,
    level: "A1" as any,
    content: "",
    contentAr: "",
    quiz: [] as any[],
    videoUrl: "",
    imageUrl: "",
    order: 0,
    attachedLinks: [] as { title: string; url: string; }[]
  });

  const [showVocabForm, setShowVocabForm] = useState(false);
  const [editVocabId, setEditVocabId] = useState<string | null>(null);
  const [vocabForm, setVocabForm] = useState({
    word: "",
    translation: "",
    definition: "",
    definitionAr: "",
    example: "",
    category: "daily" as any
  });

  const [showLiveForm, setShowLiveForm] = useState(false);
  const [liveForm, setLiveForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    link: ""
  });

  // Student messaging chat state
  const [selectedStudentForChat, setSelectedStudentForChat] = useState<Student | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [teacherReplyInput, setTeacherReplyInput] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    getTeachers().then(setTeachers);
    if (currentTeacher) {
      getAllStudents(currentTeacher.uid).then(setStudents);
    }
  }, [currentTeacher]);

  useEffect(() => {
    if (selectedStudentForChat) {
      getChatHistory(selectedStudentForChat.uid).then(setChatHistory);
    }
  }, [selectedStudentForChat]);

  // Admin managers
  const handleVerifyAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminCodeInput === "200420042004") {
      setIsAdminMode(true);
      setShowAdminLoginModal(false);
      setAdminCodeInput("");
      setAdminLoginError(false);
    } else {
      setAdminLoginError(true);
    }
  };

  const handleToggleTeacherDisabled = async (teacher: Teacher) => {
    try {
      const updated = { ...teacher, isDisabled: !teacher.isDisabled };
      await updateTeacher(updated);
      setTeachers(prev => prev.map(t => t.uid === teacher.uid ? updated : t));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTeacherAccount = async (teacherUid: string) => {
    const confirmDelete = window.confirm(
      isArabic 
        ? "هل أنت متأكد من حذف حساب هذا الأستاذ نهائياً وبشكل كامل؟ لا يمكن التراجع عن هذا الإجراء." 
        : "Are you sure you want to delete this teacher account permanently? This action cannot be undone."
    );
    if (!confirmDelete) return;

    try {
      await deleteTeacher(teacherUid);
      setTeachers(prev => prev.filter(t => t.uid !== teacherUid));
    } catch (e) {
      console.error(e);
    }
  };

  // Create Teacher
  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacher.name || !newTeacher.email || !newTeacher.loginCode) return;

    const teacherUid = `teacher_${Date.now()}`;
    // Auto-generate high-quality profile avatars using UI Avatars based on their name
    const initials = encodeURIComponent(newTeacher.name);
    const autoPhotoUrl = `https://ui-avatars.com/api/?name=${initials}&background=4f46e5&color=fff&bold=true&size=250`;
    
    const created: Teacher = {
      uid: teacherUid,
      name: newTeacher.name,
      email: newTeacher.email,
      loginCode: newTeacher.loginCode,
      photoUrl: autoPhotoUrl,
      createdAt: new Date().toISOString()
    };

    await addTeacher(created);
    setNewTeacher({ name: "", email: "", loginCode: "" });
    setShowRegisterForm(false);
    
    // Refresh teacher cards
    const list = await getTeachers();
    setTeachers(list);

    // Select the newly created teacher automatically
    onSelectTeacher(created);
  };

  // Add or Edit Lesson
  const handleSaveLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeacher) return;
    const lId = editLessonId || `lesson_${Date.now()}`;
    
    const lessonToSave: Lesson = {
      id: lId,
      title: lessonForm.title,
      titleAr: lessonForm.titleAr,
      category: lessonForm.category,
      level: lessonForm.level,
      content: lessonForm.content,
      contentAr: lessonForm.contentAr,
      quiz: lessonForm.quiz.length > 0 ? lessonForm.quiz : [
        {
          question: `Is ${lessonForm.title} helpful?`,
          options: ["Yes", "No", "Maybe", "Absolutely"],
          correctAnswer: 3
        }
      ],
      videoUrl: lessonForm.videoUrl || undefined,
      imageUrl: lessonForm.imageUrl || undefined,
      order: Number(lessonForm.order) || 0,
      createdAt: new Date().toISOString(),
      attachedLinks: lessonForm.attachedLinks || []
    };

    await saveLesson(lessonToSave, currentTeacher.uid);
    setShowLessonForm(false);
    setEditLessonId(null);
    setLessonForm({
      title: "",
      titleAr: "",
      category: "grammar",
      level: "A1",
      content: "",
      contentAr: "",
      quiz: [],
      videoUrl: "",
      imageUrl: "",
      order: 0,
      attachedLinks: []
    });
    onRefreshData();
  };

  const handleEditLessonTrigger = (l: Lesson) => {
    setEditLessonId(l.id);
    setLessonForm({
      title: l.title,
      titleAr: l.titleAr,
      category: l.category,
      level: l.level,
      content: l.content,
      contentAr: l.contentAr,
      quiz: l.quiz || [],
      videoUrl: l.videoUrl || "",
      imageUrl: l.imageUrl || "",
      order: l.order || 0,
      attachedLinks: l.attachedLinks || []
    });
    setShowLessonForm(true);
  };

  const handleDeleteLessonTrigger = async (id: string) => {
    if (!currentTeacher) return;
    if (confirm(isArabic ? "هل أنت متأكد من حذف هذا الدرس؟" : "Are you sure you want to delete this lesson?")) {
      await deleteLesson(id, currentTeacher.uid);
      onRefreshData();
    }
  };

  // Add or Edit Vocabulary
  const handleSaveVocabSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeacher) return;
    const vId = editVocabId || `vocab_${Date.now()}`;

    const vocabToSave: Vocabulary = {
      id: vId,
      word: vocabForm.word,
      translation: vocabForm.translation,
      definition: vocabForm.definition,
      definitionAr: vocabForm.definitionAr,
      example: vocabForm.example,
      category: vocabForm.category,
      createdAt: new Date().toISOString()
    };

    await saveVocabulary(vocabToSave, currentTeacher.uid);
    setShowVocabForm(false);
    setEditVocabId(null);
    setVocabForm({
      word: "",
      translation: "",
      definition: "",
      definitionAr: "",
      example: "",
      category: "daily"
    });
    onRefreshData();
  };

  const handleEditVocabTrigger = (v: Vocabulary) => {
    setEditVocabId(v.id);
    setVocabForm({
      word: v.word,
      translation: v.translation,
      definition: v.definition || "",
      definitionAr: v.definitionAr || "",
      example: v.example || "",
      category: v.category
    });
    setShowVocabForm(true);
  };

  const handleDeleteVocabTrigger = async (id: string) => {
    if (!currentTeacher) return;
    if (confirm(isArabic ? "هل أنت متأكد من حذف هذه المفردة؟" : "Are you sure you want to delete this word?")) {
      await deleteVocabulary(id, currentTeacher.uid);
      onRefreshData();
    }
  };

  // Add Live Session
  const handleSaveLiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeacher) return;
    const sId = `live_${Date.now()}`;

    const liveToSave: LiveSession = {
      id: sId,
      title: liveForm.title,
      description: liveForm.description,
      date: liveForm.date,
      time: liveForm.time,
      link: liveForm.link,
      status: "upcoming",
      teacherName: currentTeacher.name || "Professor Thomas",
      createdAt: new Date().toISOString()
    };

    await saveLiveSession(liveToSave, currentTeacher.uid);
    setShowLiveForm(false);
    setLiveForm({ title: "", description: "", date: "", time: "", link: "" });
    onRefreshData();
  };

  const handleDeleteLiveTrigger = async (id: string) => {
    if (!currentTeacher) return;
    if (confirm(isArabic ? "هل أنت متأكد من حذف هذه الحصة المباشرة؟" : "Are you sure you want to delete this live session?")) {
      await deleteLiveSession(id, currentTeacher.uid);
      onRefreshData();
    }
  };

  const handleChangeStudentLevel = async (studentItem: Student, newLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2") => {
    if (!currentTeacher) return;
    const updated = { ...studentItem, level: newLevel };
    await updateStudent(updated, currentTeacher.uid);
    const updatedList = await getAllStudents(currentTeacher.uid);
    setStudents(updatedList);
  };

  const handleToggleStudentDisabled = async (studentItem: Student) => {
    if (!currentTeacher) return;
    const updated = { ...studentItem, isDisabled: !studentItem.isDisabled };
    await updateStudent(updated, currentTeacher.uid);
    const updatedList = await getAllStudents(currentTeacher.uid);
    setStudents(updatedList);
  };

  const handleDeleteStudent = async (studentUid: string) => {
    if (!currentTeacher) return;
    if (confirm(isArabic ? "هل أنت متأكد من حذف حساب هذا الطالب نهائياً؟" : "Are you sure you want to delete this student account permanently?")) {
      await deleteStudent(studentUid, currentTeacher.uid);
      const updatedList = await getAllStudents(currentTeacher.uid);
      setStudents(updatedList);
      if (selectedStudentForChat?.uid === studentUid) {
        setSelectedStudentForChat(null);
      }
    }
  };

  // Send Message reply to Student
  const handleSendTeacherReply = async () => {
    if (!selectedStudentForChat || !teacherReplyInput.trim() || !currentTeacher) return;
    setSendingReply(true);

    const chatId = selectedStudentForChat.uid;
    const replyMsg: ChatMessage = {
      id: `teacher_reply_${Date.now()}`,
      senderId: currentTeacher.uid,
      senderName: currentTeacher.name,
      senderRole: "teacher",
      text: teacherReplyInput.trim(),
      timestamp: new Date().toISOString()
    };

    try {
      await addChatMessage(chatId, replyMsg);
      setChatHistory(prev => [...prev, replyMsg]);
      setTeacherReplyInput("");
    } catch (e) {
      console.error(e);
    } finally {
      setSendingReply(false);
    }
  };

  const handleTeacherCardClick = (teacher: Teacher) => {
    if (teacher.loginCode) {
      setVerifyingTeacher(teacher);
      setTeacherLoginCodeInput("");
      setTeacherLoginError(false);
    } else {
      onSelectTeacher(teacher);
    }
  };

  const handleVerifyTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingTeacher) return;
    
    if (verifyingTeacher.isDisabled) {
      setTeacherLoginError(true);
      setTeacherLoginErrorText(
        isArabic 
          ? "هذا الحساب معطل حالياً من قبل الإدارة" 
          : "This account is currently disabled by the administration"
      );
      return;
    }

    if (teacherLoginCodeInput === verifyingTeacher.loginCode) {
      onSelectTeacher(verifyingTeacher);
      setVerifyingTeacher(null);
      setTeacherLoginCodeInput("");
      setTeacherLoginError(false);
      setTeacherLoginErrorText("");
    } else {
      setTeacherLoginError(true);
      setTeacherLoginErrorText(isArabic ? "الكود غير صحيح!" : "Invalid access code!");
    }
  };

  if (!currentTeacher) {
    return (
      <div className="space-y-8 animate-fade-in text-left rtl:text-right" id="teacher-dashboard-entry">
        {/* Top Welcome Title */}
        <div className="bg-neutral-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl shadow-neutral-900/10">
          <div className="relative z-10 max-w-xl space-y-3">
            <span className="inline-block bg-indigo-500/30 text-indigo-300 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider font-mono">
              🛡️ Administrative Core
            </span>
            <h2 className="text-2xl sm:text-3.5xl font-extrabold font-display leading-tight">
              {isArabic ? "لوحة الأستاذ - PATHWAY ACADEMY" : "Professor Board - PATHWAY ACADEMY"}
            </h2>
            <p className="text-neutral-400 text-xs leading-relaxed">
              {isArabic
                ? "أهلاً بك في البوابة الأكاديمية لمنصة PATHWAY ACADEMY. اختر حسابك للدخول إلى صفحتك الخاصة لإدارة وتعديل مناهجك، فصولك، والدردشة مع طلابك بشكل فوري ودائم."
                : "Welcome to the PATHWAY ACADEMY Academic Portal. Choose your account below to access your custom space to manage curriculum, virtual classes, and chat with your assigned students."}
            </p>
          </div>
        </div>

        {/* Teachers Grid & Form Section */}
        <div className="space-y-6">
          {isAdminMode && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 flex items-center justify-between gap-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0" />
                <div>
                  <span className="block text-xs font-black uppercase tracking-wider text-amber-800">
                    {isArabic ? "صلاحيات المدير نشطة" : "ADMIN PRIVILEGES ACTIVE"}
                  </span>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    {isArabic 
                      ? "يمكنك الآن تعطيل حسابات الأساتذة، تفعيلها، أو حذفها مباشرة من البطاقات أدناه." 
                      : "You can now disable, enable, or permanently delete teacher accounts directly from the cards below."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAdminMode(false)}
                className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
              >
                {isArabic ? "إنهاء الجلسة" : "Exit Session"}
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 pb-4">
            <div>
              <h3 className="font-extrabold font-display text-neutral-900 text-lg">
                {isArabic ? "اختر حساب الأستاذ للدخول" : "Choose Teacher Account to Login"}
              </h3>
              <p className="text-xs text-neutral-400">
                {isArabic
                  ? "انقر على أي بطاقة لعرض وإدارة الدروس، المفردات، والمحادثات المرتبطة به."
                  : "Click any registered card below to manage curriculum, statistics, and messaging."}
              </p>
            </div>

            {!showRegisterForm && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowRegisterForm(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-3 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-indigo-100 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isArabic ? "إضافة حساب جديد" : "Add New Account"}</span>
                </button>
                <button
                  onClick={() => {
                    if (isAdminMode) {
                      setIsAdminMode(false);
                    } else {
                      setShowAdminLoginModal(true);
                    }
                  }}
                  className={`flex items-center gap-2 font-extrabold px-5 py-3 rounded-xl text-xs sm:text-sm transition-all shadow-md cursor-pointer ${
                    isAdminMode
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "bg-slate-800 hover:bg-slate-900 text-white"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isAdminMode 
                      ? (isArabic ? "إغلاق وضع المدير" : "Exit Admin Mode") 
                      : (isArabic ? "حساب المدير" : "Admin Account")}
                  </span>
                </button>
              </div>
            )}
          </div>

          {showRegisterForm && (
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm max-w-lg mx-auto animate-fade-in">
              <h4 className="text-sm font-extrabold text-neutral-900 mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <span>{isArabic ? "إنشاء حساب أستاذ جديد تلقائياً" : "Generate New Teacher Account"}</span>
              </h4>

              <form onSubmit={handleCreateTeacher} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
                    {isArabic ? "الاسم كامل:" : "Full Name:"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newTeacher.name}
                    onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                    placeholder="Prof. Thomas"
                    className="w-full px-4 py-3 border border-neutral-250 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-neutral-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
                    {isArabic ? "البريد الإلكتروني:" : "Email Address:"}
                  </label>
                  <input
                    type="email"
                    required
                    value={newTeacher.email}
                    onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                    placeholder="thomas@englishpathway.com"
                    className="w-full px-4 py-3 border border-neutral-250 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-neutral-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
                    {isArabic ? "كود خاص بالدخول للحساب:" : "Custom Access Code:"}
                  </label>
                  <input
                    type="password"
                    required
                    value={newTeacher.loginCode}
                    onChange={(e) => setNewTeacher({ ...newTeacher, loginCode: e.target.value })}
                    placeholder="••••••"
                    className="w-full px-4 py-3 border border-neutral-250 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-neutral-50/50 font-mono"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl text-xs transition-all shadow-md shadow-indigo-100 cursor-pointer"
                  >
                    {isArabic ? "إنشاء الحساب" : "Create Account"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRegisterForm(false);
                      setNewTeacher({ name: "", email: "", loginCode: "" });
                    }}
                    className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold px-4 py-3 rounded-2xl text-xs transition-all cursor-pointer"
                  >
                    {isArabic ? "إلغاء" : "Cancel"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {teachers.map((teacher) => (
              <div
                key={teacher.uid}
                onClick={() => handleTeacherCardClick(teacher)}
                className={`relative bg-white border border-neutral-200 hover:border-indigo-300 rounded-3xl p-6 text-center transition-all hover:shadow-lg hover:shadow-indigo-50/50 flex flex-col items-center justify-between gap-4 h-full group transform active:scale-[0.98] cursor-pointer ${
                  teacher.isDisabled ? "opacity-75 grayscale-[30%] border-amber-200" : ""
                }`}
              >
                {/* Admin controls panel overlay inside card */}
                {isAdminMode && (
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10 gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {/* Status Toggle Button */}
                    <button
                      onClick={() => handleToggleTeacherDisabled(teacher)}
                      className={`p-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                        teacher.isDisabled
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                      }`}
                      title={teacher.isDisabled ? (isArabic ? "تفعيل" : "Enable") : (isArabic ? "تعطيل" : "Disable")}
                    >
                      {teacher.isDisabled ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      <span>{teacher.isDisabled ? (isArabic ? "تفعيل" : "Enable") : (isArabic ? "تعطيل" : "Disable")}</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteTeacherAccount(teacher.uid)}
                      className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-all cursor-pointer"
                      title={isArabic ? "حذف الحساب نهائياً" : "Delete Account"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="relative mt-2">
                  <img
                    src={teacher.photoUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150"}
                    alt={teacher.name}
                    className="w-20 h-20 rounded-full object-cover bg-neutral-50 border-2 border-indigo-100 p-0.5 group-hover:border-indigo-500 transition-colors"
                  />
                  <span className={`absolute bottom-0 right-0 w-4 h-4 border-2 border-white rounded-full ${teacher.isDisabled ? "bg-amber-500" : "bg-emerald-500"}`} />
                </div>

                <div className="space-y-1">
                  <h4 className="font-extrabold text-neutral-950 text-sm group-hover:text-indigo-600 transition-colors">
                    {teacher.name}
                  </h4>
                  <p className="text-[11px] text-neutral-400 font-mono">
                    {teacher.email}
                  </p>
                  {teacher.isDisabled && (
                    <span className="inline-block bg-amber-50 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-md mt-1">
                      {isArabic ? "الحساب معطل" : "ACCOUNT DISABLED"}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Inline clickable trigger card if form is not showing */}
            {!showRegisterForm && (
              <button
                onClick={() => setShowRegisterForm(true)}
                className="bg-dashed border-2 border-dashed border-neutral-300 hover:border-indigo-500 rounded-3xl p-6 text-center transition-all flex flex-col items-center justify-center gap-3 min-h-[180px] group cursor-pointer w-full"
              >
                <div className="w-12 h-12 rounded-full bg-neutral-50 text-neutral-500 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-700 text-sm group-hover:text-indigo-600 transition-colors">
                    {isArabic ? "إضافة حساب جديد" : "Add New Account"}
                  </h4>
                  <p className="text-[10px] text-slate-400 max-w-[150px] mx-auto mt-0.5">
                    {isArabic ? "إنشاء حساب أستاذ إضافي فوراً بدون تعقيد" : "Generate an additional professor account instantly"}
                  </p>
                </div>
              </button>
            )}
          </div>
        </div>

        {verifyingTeacher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-xl max-w-sm w-full mx-4 relative">
              <button
                type="button"
                onClick={() => setVerifyingTeacher(null)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
              
              <div className="text-center space-y-4 pt-2">
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={verifyingTeacher.photoUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100"}
                    alt={verifyingTeacher.name}
                    className="w-16 h-16 rounded-full object-cover border border-neutral-200 p-0.5"
                  />
                  <h3 className="font-extrabold text-neutral-900 text-sm">
                    {isArabic ? `دخول حساب: ${verifyingTeacher.name}` : `Login: ${verifyingTeacher.name}`}
                  </h3>
                </div>

                <form onSubmit={handleVerifyTeacherSubmit} className="space-y-3">
                  <input
                    type="password"
                    required
                    value={teacherLoginCodeInput}
                    onChange={(e) => setTeacherLoginCodeInput(e.target.value)}
                    placeholder={isArabic ? "أدخل كود الدخول الخاص بالحساب" : "Enter account access code"}
                    className="w-full px-4 py-3 border border-neutral-250 rounded-2xl text-center text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-neutral-50/50 font-mono"
                    autoFocus
                  />

                  {teacherLoginError && (
                    <p className="text-center text-xs text-rose-600 font-bold">
                      {teacherLoginErrorText || (isArabic ? "الكود غير صحيح!" : "Invalid access code!")}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl text-xs transition-all shadow-md shadow-indigo-100 cursor-pointer"
                    >
                      {isArabic ? "تحقق ودخول" : "Verify & Enter"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setVerifyingTeacher(null)}
                      className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold px-4 py-3 rounded-2xl text-xs transition-all cursor-pointer"
                    >
                      {isArabic ? "إلغاء" : "Cancel"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Admin Login Modal */}
        {showAdminLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-xl max-w-sm w-full mx-4 relative">
              <button
                type="button"
                onClick={() => {
                  setShowAdminLoginModal(false);
                  setAdminCodeInput("");
                  setAdminLoginError(false);
                }}
                className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
              
              <div className="text-center space-y-4 pt-2">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-neutral-900 text-sm">
                    {isArabic ? "تفعيل صلاحيات المدير" : "Activate Admin Privileges"}
                  </h3>
                  <p className="text-[10px] text-neutral-400 max-w-[200px] mx-auto">
                    {isArabic 
                      ? "الرجاء إدخال كود الإدارة السري المكون من 12 رقماً لتفعيل صلاحيات التحكم بالأساتذة." 
                      : "Please enter the 12-digit administration code to unlock full teacher account control."}
                  </p>
                </div>

                <form onSubmit={handleVerifyAdminSubmit} className="space-y-3">
                  <input
                    type="password"
                    required
                    value={adminCodeInput}
                    onChange={(e) => setAdminCodeInput(e.target.value)}
                    placeholder={isArabic ? "كود الإدارة السري" : "Administration Code"}
                    className="w-full px-4 py-3 border border-neutral-250 rounded-2xl text-center text-sm outline-none focus:ring-2 focus:ring-amber-500 bg-neutral-50/50 font-mono tracking-widest"
                    autoFocus
                  />

                  {adminLoginError && (
                    <p className="text-center text-xs text-rose-600 font-bold">
                      {isArabic ? "كود الإدارة غير صحيح!" : "Invalid administration code!"}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-2xl text-xs transition-all shadow-md shadow-amber-100 cursor-pointer"
                    >
                      {isArabic ? "تفعيل الصلاحية" : "Verify & Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAdminLoginModal(false);
                        setAdminCodeInput("");
                        setAdminLoginError(false);
                      }}
                      className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold px-4 py-3 rounded-2xl text-xs transition-all cursor-pointer"
                    >
                      {isArabic ? "إلغاء" : "Cancel"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }



  return (
    <div className="space-y-8 animate-fade-in text-left rtl:text-right" id="teacher-dashboard-view">
      {/* Active Teacher Badge / Top Workspace Bar */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <img
            src={currentTeacher.photoUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100"}
            alt={currentTeacher.name}
            className="w-12 h-12 rounded-2xl object-cover border border-neutral-200 p-0.5"
          />
          <div className="text-left rtl:text-right">
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
              {isArabic ? "جلسة الأستاذ النشطة" : "Active Teacher Session"}
            </span>
            <h3 className="font-extrabold text-neutral-950 text-base leading-tight mt-1">
              {currentTeacher.name}
            </h3>
          </div>
        </div>

        <button
          onClick={() => onSelectTeacher(null)}
          className="w-full sm:w-auto bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>{isArabic ? "تسجيل خروج المعلم" : "Teacher Logout"}</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* Tabs for dashboard */}
        <div className="flex border-b border-neutral-200">
          <button
            onClick={() => setActiveTab("lessons")}
            className={`flex-1 py-3 text-center text-xs font-bold border-b-2 transition-all ${
              activeTab === "lessons"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-neutral-400 hover:text-neutral-700"
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span>{isArabic ? "الدروس" : "Lessons"}</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("vocab")}
            className={`flex-1 py-3 text-center text-xs font-bold border-b-2 transition-all ${
              activeTab === "vocab"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-neutral-400 hover:text-neutral-700"
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <FileText className="w-4 h-4" />
              <span>{isArabic ? "المفردات" : "Vocabulary"}</span>
            </div>
          </button>

                <button
                  onClick={() => setActiveTab("live")}
                  className={`flex-1 py-3 text-center text-xs font-bold border-b-2 transition-all ${
                    activeTab === "live"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-neutral-400 hover:text-neutral-700"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <Video className="w-4 h-4" />
                    <span>{isArabic ? "الحصص المباشرة" : "Live Class"}</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("students")}
                  className={`flex-1 py-3 text-center text-xs font-bold border-b-2 transition-all ${
                    activeTab === "students"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-neutral-400 hover:text-neutral-700"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{isArabic ? "إدارة الطلاب" : "Students"}</span>
                  </div>
                </button>
              </div>

              {/* TAB 1: LESSONS MANAGEMENT */}
              {activeTab === "lessons" && (
                <div className="space-y-6">
                  {/* Lesson Form */}
                  {showLessonForm ? (
                    <form onSubmit={handleSaveLessonSubmit} className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4">
                      <h4 className="font-extrabold text-xs text-indigo-600 uppercase tracking-wider">
                        {editLessonId ? (isArabic ? "تعديل الدرس" : "Edit Lesson") : (isArabic ? "إضافة درس جديد" : "Create Lesson")}
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "عنوان الدرس (English):" : "Lesson Title (English):"}
                          </label>
                          <input
                            type="text"
                            required
                            value={lessonForm.title}
                            onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                            placeholder="Present Simple vs. Continuous"
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "عنوان الدرس (العربية):" : "Lesson Title (Arabic):"}
                          </label>
                          <input
                            type="text"
                            required
                            value={lessonForm.titleAr}
                            onChange={(e) => setLessonForm({ ...lessonForm, titleAr: e.target.value })}
                            placeholder="المضارع البسيط مقابل المستمر"
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "المهارة / القسم:" : "Skill / Category:"}
                          </label>
                          <select
                            value={lessonForm.category}
                            onChange={(e) => setLessonForm({ ...lessonForm, category: e.target.value as any })}
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="grammar">Grammar</option>
                            <option value="vocabulary">Vocabulary</option>
                            <option value="reading">Reading</option>
                            <option value="writing">Writing</option>
                            <option value="listening">Listening</option>
                            <option value="speaking">Speaking</option>
                            <option value="pronunciation">Pronunciation</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "المستوى اللغوي:" : "Language Level:"}
                          </label>
                          <select
                            value={lessonForm.level}
                            onChange={(e) => setLessonForm({ ...lessonForm, level: e.target.value as any })}
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="A1">A1</option>
                            <option value="A2">A2</option>
                            <option value="B1">B1</option>
                            <option value="B2">B2</option>
                            <option value="C1">C1</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "صورة توضيحية (رابط أو رفع):" : "Illustrative Image (URL or Upload):"}
                          </label>
                          <input
                            type="text"
                            value={lessonForm.imageUrl}
                            onChange={(e) => setLessonForm({ ...lessonForm, imageUrl: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-[10px] outline-none focus:ring-2 focus:ring-indigo-500 mb-1"
                          />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const r = new FileReader();
                                r.onload = () => setLessonForm({ ...lessonForm, imageUrl: r.result as string });
                                r.readAsDataURL(file);
                              }
                            }}
                            className="block w-full text-[10px] text-slate-500 file:mr-4 file:py-1 file:px-2 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "فيديو تعليمي (يوتيوب أو رفع):" : "Tutorial Video (YouTube or Upload):"}
                          </label>
                          <input
                            type="text"
                            value={lessonForm.videoUrl}
                            onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                            placeholder="https://youtube.com/watch?v=..."
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-[10px] outline-none focus:ring-2 focus:ring-indigo-500 mb-1"
                          />
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const r = new FileReader();
                                r.onload = () => setLessonForm({ ...lessonForm, videoUrl: r.result as string });
                                r.readAsDataURL(file);
                              }
                            }}
                            className="block w-full text-[10px] text-slate-500 file:mr-4 file:py-1 file:px-2 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "ترتيب عرض الدرس (رقم):" : "Lesson Order (Number):"}
                          </label>
                          <input
                            type="number"
                            value={lessonForm.order}
                            onChange={(e) => setLessonForm({ ...lessonForm, order: Number(e.target.value) || 0 })}
                            placeholder="1"
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1">
                          {isArabic ? "الشرح باللغة الإنجليزية:" : "Explanation Content (English):"}
                        </label>
                        <textarea
                          required
                          rows={5}
                          value={lessonForm.content}
                          onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                          placeholder="Type explanation markdown content here..."
                          className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1">
                          {isArabic ? "الشرح باللغة العربية:" : "Explanation Content (Arabic):"}
                        </label>
                        <textarea
                          required
                          rows={5}
                          value={lessonForm.contentAr}
                          onChange={(e) => setLessonForm({ ...lessonForm, contentAr: e.target.value })}
                          placeholder="اكتب الشرح المفصل باللغة العربية هنا لمساعدة الطلاب..."
                          className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Interactive Lesson Quiz & Exercises Editor */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3.5">
                        <div className="flex justify-between items-center">
                          <label className="block text-xs font-bold text-slate-700">
                            {isArabic ? "📝 تمارين واختبارات الدرس التفاعلية:" : "📝 Lesson Quiz & Exercises:"}
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setLessonForm({
                                ...lessonForm,
                                quiz: [
                                  ...(lessonForm.quiz || []),
                                  {
                                    question: "",
                                    type: "multiple",
                                    options: ["", "", "", ""],
                                    correctAnswer: 0
                                  }
                                ]
                              });
                            }}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-indigo-200 transition-all cursor-pointer"
                          >
                            {isArabic ? "+ إضافة سؤال جديد" : "+ Add Question"}
                          </button>
                        </div>

                        {lessonForm.quiz && lessonForm.quiz.length > 0 ? (
                          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                            {lessonForm.quiz.map((q, idx) => {
                              const qType = q.type || "multiple";
                              return (
                                <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3 relative shadow-sm">
                                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                    <span className="text-[10px] font-black text-indigo-600 uppercase">
                                      {isArabic ? `السؤال ${idx + 1}` : `Question ${idx + 1}`}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = lessonForm.quiz.filter((_, i) => i !== idx);
                                        setLessonForm({ ...lessonForm, quiz: updated });
                                      }}
                                      className="text-red-500 hover:text-red-700 text-xs hover:bg-red-50 p-1 rounded transition-all cursor-pointer"
                                      title={isArabic ? "حذف السؤال" : "Delete Question"}
                                    >
                                      ❌
                                    </button>
                                  </div>

                                  {/* Question Text */}
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                      {isArabic ? "نص السؤال:" : "Question Text:"}
                                    </label>
                                    <input
                                      type="text"
                                      required
                                      value={q.question}
                                      onChange={(e) => {
                                        const updated = [...lessonForm.quiz];
                                        updated[idx].question = e.target.value;
                                        setLessonForm({ ...lessonForm, quiz: updated });
                                      }}
                                      placeholder={isArabic ? "مثال: اختر صيغة الفعل الصحيحة..." : "e.g. Choose the correct form..."}
                                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                  </div>

                                  {/* Question Type */}
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                        {isArabic ? "نوع السؤال:" : "Question Type:"}
                                      </label>
                                      <select
                                        value={qType}
                                        onChange={(e) => {
                                          const newType = e.target.value as any;
                                          const updated = [...lessonForm.quiz];
                                          updated[idx].type = newType;
                                          
                                          if (newType === "multiple") {
                                            updated[idx].options = ["", "", "", ""];
                                            updated[idx].correctAnswer = 0;
                                          } else if (newType === "true_false") {
                                            updated[idx].options = [isArabic ? "صح" : "True", isArabic ? "خطأ" : "False"];
                                            updated[idx].correctAnswer = 0;
                                          } else if (newType === "fill_blank") {
                                            updated[idx].options = [];
                                            updated[idx].correctAnswer = "";
                                          }
                                          setLessonForm({ ...lessonForm, quiz: updated });
                                        }}
                                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                                      >
                                        <option value="multiple">{isArabic ? "اختيار من متعدد" : "Multiple Choice"}</option>
                                        <option value="true_false">{isArabic ? "صح / خطأ" : "True / False"}</option>
                                        <option value="fill_blank">{isArabic ? "ملء الفراغات" : "Fill in the Blanks"}</option>
                                      </select>
                                    </div>

                                    {/* Correct Answer / Answer Index selection */}
                                    <div>
                                      {qType === "fill_blank" ? (
                                        <>
                                          <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                            {isArabic ? "الكلمة الصحيحة للفراغ:" : "Correct Word/Blank Answer:"}
                                          </label>
                                          <input
                                            type="text"
                                            required
                                            value={q.correctAnswer}
                                            onChange={(e) => {
                                              const updated = [...lessonForm.quiz];
                                              updated[idx].correctAnswer = e.target.value;
                                              setLessonForm({ ...lessonForm, quiz: updated });
                                            }}
                                            placeholder={isArabic ? "الإجابة (مثال: is)" : "Answer word (e.g. is)"}
                                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                                          />
                                        </>
                                      ) : (
                                        <>
                                          <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                            {isArabic ? "الخيار الصحيح:" : "Correct Option:"}
                                          </label>
                                          <select
                                            value={q.correctAnswer}
                                            onChange={(e) => {
                                              const updated = [...lessonForm.quiz];
                                              updated[idx].correctAnswer = Number(e.target.value);
                                              setLessonForm({ ...lessonForm, quiz: updated });
                                            }}
                                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                                          >
                                            {qType === "true_false" ? (
                                              <>
                                                <option value={0}>{isArabic ? "صح (الأول)" : "True (1st)"}</option>
                                                <option value={1}>{isArabic ? "خطأ (الثاني)" : "False (2nd)"}</option>
                                              </>
                                            ) : (
                                              <>
                                                <option value={0}>{isArabic ? "الخيار 1" : "Option 1"}</option>
                                                <option value={1}>{isArabic ? "الخيار 2" : "Option 2"}</option>
                                                <option value={2}>{isArabic ? "الخيار 3" : "Option 3"}</option>
                                                <option value={3}>{isArabic ? "الخيار 4" : "Option 4"}</option>
                                              </>
                                            )}
                                          </select>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {/* Option Inputs for Multiple Choice */}
                                  {qType === "multiple" && (
                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                      {[0, 1, 2, 3].map((optIdx) => (
                                        <div key={optIdx}>
                                          <label className="block text-[9px] text-slate-400 mb-0.5">
                                            {isArabic ? `الخيار ${optIdx + 1}:` : `Option ${optIdx + 1}:`}
                                          </label>
                                          <input
                                            type="text"
                                            required
                                            value={q.options?.[optIdx] || ""}
                                            onChange={(e) => {
                                              const updated = [...lessonForm.quiz];
                                              if (!updated[idx].options) updated[idx].options = ["", "", "", ""];
                                              updated[idx].options[optIdx] = e.target.value;
                                              setLessonForm({ ...lessonForm, quiz: updated });
                                            }}
                                            placeholder={`${isArabic ? "الخيار" : "Option"} ${optIdx + 1}`}
                                            className="w-full px-2 py-1 border border-slate-200 rounded-lg text-[11px] outline-none focus:ring-1 focus:ring-indigo-500"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 font-semibold italic text-center">
                            {isArabic ? "لا توجد أسئلة أو اختبارات مضافة حالياً. سيتم استخدام سؤال تلقائي." : "No custom quiz questions added yet. A default question will be used."}
                          </p>
                        )}
                      </div>

                      {/* Attached Links Editor */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3.5">
                        <div className="flex justify-between items-center">
                          <label className="block text-xs font-bold text-slate-700">
                            {isArabic ? "🔗 الروابط والمصادر المرفقة بالدرس:" : "🔗 Attached Resources & Links:"}
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setLessonForm({
                                ...lessonForm,
                                attachedLinks: [...(lessonForm.attachedLinks || []), { title: "", url: "" }]
                              });
                            }}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-indigo-200 transition-all cursor-pointer animate-pulse"
                          >
                            {isArabic ? "+ إضافة رابط جديد" : "+ Add New Link"}
                          </button>
                        </div>

                        {lessonForm.attachedLinks && lessonForm.attachedLinks.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {lessonForm.attachedLinks.map((link, idx) => (
                              <div key={idx} className="flex gap-2 items-center bg-white p-2.5 rounded-lg border border-slate-200">
                                <div className="grid grid-cols-2 gap-2 flex-1">
                                  <input
                                    type="text"
                                    placeholder={isArabic ? "عنوان الرابط (مثال: ملف PDF الشرح)" : "Link Title (e.g. Worksheet PDF)"}
                                    value={link.title}
                                    onChange={(e) => {
                                      const updated = [...lessonForm.attachedLinks];
                                      updated[idx].title = e.target.value;
                                      setLessonForm({ ...lessonForm, attachedLinks: updated });
                                    }}
                                    className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                  <input
                                    type="url"
                                    placeholder={isArabic ? "رابط URL المرفق" : "Link URL"}
                                    value={link.url}
                                    onChange={(e) => {
                                      const updated = [...lessonForm.attachedLinks];
                                      updated[idx].url = e.target.value;
                                      setLessonForm({ ...lessonForm, attachedLinks: updated });
                                    }}
                                    className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = lessonForm.attachedLinks.filter((_, i) => i !== idx);
                                    setLessonForm({ ...lessonForm, attachedLinks: updated });
                                  }}
                                  className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-all text-xs cursor-pointer"
                                  title={isArabic ? "حذف الرابط" : "Delete Link"}
                                >
                                  ❌
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 font-semibold italic text-center">
                            {isArabic ? "لا توجد روابط مرفقة بهذا الدرس حالياً." : "No attached links for this lesson yet."}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs transition-all shadow-md"
                        >
                          {isArabic ? "حفظ وتثبيت الدرس" : "Save Lesson"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowLessonForm(false);
                            setEditLessonId(null);
                          }}
                          className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold px-4 py-2 rounded-xl text-xs transition-all"
                        >
                          {isArabic ? "إلغاء" : "Cancel"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowLessonForm(true)}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold py-3 rounded-2xl text-xs transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isArabic ? "إضافة درس تعليمي جديد" : "Add New Course Lesson"}</span>
                    </button>
                  )}

                  {/* Lessons list */}
                  <div className="space-y-4">
                    {lessons.map((l) => (
                      <div key={l.id} className="flex justify-between items-center p-4 bg-white border border-neutral-200/80 rounded-2xl shadow-sm">
                        <div className="text-left rtl:text-right">
                          <span className="text-[9px] bg-neutral-100 text-neutral-600 font-bold px-2 py-0.5 rounded font-mono uppercase">
                            {l.category} • {l.level}
                          </span>
                          <h5 className="font-extrabold text-neutral-800 text-sm mt-1">{l.title}</h5>
                          <p className="text-xs text-neutral-400 font-medium">{l.titleAr}</p>
                        </div>

                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleEditLessonTrigger(l)}
                            className="p-1.5 text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLessonTrigger(l.id)}
                            className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: VOCABULARY MANAGEMENT */}
              {activeTab === "vocab" && (
                <div className="space-y-6">
                  {/* Vocab Form */}
                  {showVocabForm ? (
                    <form onSubmit={handleSaveVocabSubmit} className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4">
                      <h4 className="font-extrabold text-xs text-teal-600 uppercase tracking-wider">
                        {editVocabId ? (isArabic ? "تعديل المفردة" : "Edit Vocab") : (isArabic ? "إضافة مفردة جديدة" : "Create Vocab Word")}
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "الكلمة بالإنجليزية (Word):" : "Word (English):"}
                          </label>
                          <input
                            type="text"
                            required
                            value={vocabForm.word}
                            onChange={(e) => setVocabForm({ ...vocabForm, word: e.target.value })}
                            placeholder="e.g. Meticulous"
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "الترجمة العربية:" : "Arabic Translation:"}
                          </label>
                          <input
                            type="text"
                            required
                            value={vocabForm.translation}
                            onChange={(e) => setVocabForm({ ...vocabForm, translation: e.target.value })}
                            placeholder="دقيق جداً / شديد التفاصيل"
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "التصنيف:" : "Category:"}
                          </label>
                          <select
                            value={vocabForm.category}
                            onChange={(e) => setVocabForm({ ...vocabForm, category: e.target.value as any })}
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="daily">Daily Words</option>
                            <option value="academic">Academic Words</option>
                            <option value="common">Common Phrases</option>
                            <option value="phrasal">Phrasal Verbs</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "جملة كـ مثال توضيحي:" : "Example Sentence:"}
                          </label>
                          <input
                            type="text"
                            value={vocabForm.example}
                            onChange={(e) => setVocabForm({ ...vocabForm, example: e.target.value })}
                            placeholder="She kept meticulous records of the lesson..."
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1">
                          {isArabic ? "التعريف بالإنجليزية:" : "Definition (English):"}
                        </label>
                        <input
                          type="text"
                          required
                          value={vocabForm.definition}
                          onChange={(e) => setVocabForm({ ...vocabForm, definition: e.target.value })}
                          placeholder="Very careful and precise; showing great attention..."
                          className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1">
                          {isArabic ? "الشرح والتعريف بالعربية:" : "Definition (Arabic):"}
                        </label>
                        <input
                          type="text"
                          value={vocabForm.definitionAr}
                          onChange={(e) => setVocabForm({ ...vocabForm, definitionAr: e.target.value })}
                          placeholder="وصف للشخص الدقيق جداً الذي يراعي جميع التفاصيل الصغيرة..."
                          className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-xl text-xs transition-all shadow-md"
                        >
                          {isArabic ? "حفظ الكلمة في القاموس" : "Save Vocabulary"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowVocabForm(false);
                            setEditVocabId(null);
                          }}
                          className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold px-4 py-2 rounded-xl text-xs transition-all"
                        >
                          {isArabic ? "إلغاء" : "Cancel"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowVocabForm(true)}
                      className="w-full flex items-center justify-center gap-2 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 font-bold py-3 rounded-2xl text-xs transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isArabic ? "إضافة مفردة لغوية جديدة" : "Add New Dictionary Vocab Word"}</span>
                    </button>
                  )}

                  {/* Vocab list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vocabulary.map((v) => (
                      <div key={v.id} className="p-4 bg-white border border-neutral-200/80 rounded-2xl shadow-sm flex justify-between items-center">
                        <div>
                          <span className="text-[8px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded uppercase font-bold font-mono">
                            {v.category}
                          </span>
                          <h6 className="font-extrabold text-neutral-800 text-sm mt-1">{v.word}</h6>
                          <p className="text-xs text-neutral-500 font-medium">{v.translation}</p>
                        </div>

                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditVocabTrigger(v)}
                            className="p-1 text-neutral-500 hover:text-indigo-600 hover:bg-neutral-100 rounded"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteVocabTrigger(v.id)}
                            className="p-1 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: LIVE SESSIONS MANAGEMENT */}
              {activeTab === "live" && (
                <div className="space-y-6">
                  {/* Live Form */}
                  {showLiveForm ? (
                    <form onSubmit={handleSaveLiveSubmit} className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4">
                      <h4 className="font-extrabold text-xs text-purple-600 uppercase tracking-wider">
                        {isArabic ? "جدولة بث مباشر جديد" : "Schedule Live Class broadcast"}
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "عنوان الحصة:" : "Class Title:"}
                          </label>
                          <input
                            type="text"
                            required
                            value={liveForm.title}
                            onChange={(e) => setLiveForm({ ...liveForm, title: e.target.value })}
                            placeholder="Speaking & Accent clinic"
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "الرابط المباشر (Google Meet/Zoom):" : "Direct Class URL:"}
                          </label>
                          <input
                            type="url"
                            required
                            value={liveForm.link}
                            onChange={(e) => setLiveForm({ ...liveForm, link: e.target.value })}
                            placeholder="https://meet.google.com/..."
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "التاريخ:" : "Date:"}
                          </label>
                          <input
                            type="date"
                            required
                            value={liveForm.date}
                            onChange={(e) => setLiveForm({ ...liveForm, date: e.target.value })}
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "الوقت:" : "Time:"}
                          </label>
                          <input
                            type="text"
                            required
                            value={liveForm.time}
                            onChange={(e) => setLiveForm({ ...liveForm, time: e.target.value })}
                            placeholder="18:00 UTC"
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1">
                          {isArabic ? "الوصف القصير:" : "Short Description:"}
                        </label>
                        <input
                          type="text"
                          required
                          value={liveForm.description}
                          onChange={(e) => setLiveForm({ ...liveForm, description: e.target.value })}
                          placeholder="Practice reduction & sound connections in real time..."
                          className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-xl text-xs transition-all shadow-md"
                        >
                          {isArabic ? "جدولة وبدء النشر" : "Schedule & Publish Live Class"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowLiveForm(false);
                          }}
                          className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold px-4 py-2 rounded-xl text-xs transition-all"
                        >
                          {isArabic ? "إلغاء" : "Cancel"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowLiveForm(true)}
                      className="w-full flex items-center justify-center gap-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold py-3 rounded-2xl text-xs transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isArabic ? "جدولة حصة بسب مباشر جديدة" : "Schedule New Live Broadcast"}</span>
                    </button>
                  )}

                  {/* Live list */}
                  <div className="space-y-4">
                    {liveSessions.map((s) => (
                      <div key={s.id} className="p-4 bg-white border border-neutral-200/80 rounded-2xl shadow-sm flex justify-between items-center">
                        <div>
                          <span className="text-[8px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold uppercase">
                            {s.status} • {s.date}
                          </span>
                          <h6 className="font-extrabold text-neutral-800 text-sm mt-1">{s.title}</h6>
                          <p className="text-xs text-neutral-400 font-mono truncate max-w-sm">{s.link}</p>
                        </div>

                        <button
                          onClick={() => handleDeleteLiveTrigger(s.id)}
                          className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: STUDENTS LIST & INTERACTIVE MESSAGING */}
              {activeTab === "students" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* List of registered students */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-neutral-800 text-xs font-display pb-1 border-b border-neutral-100">
                        {isArabic ? "جميع الطلاب المسجلين" : "Registered Students Database"}
                      </h4>

                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                        {students.map((studentItem) => {
                          const isSelected = selectedStudentForChat?.uid === studentItem.uid;
                          return (
                            <div
                              key={studentItem.uid}
                              className={`w-full text-left rtl:text-right p-4 rounded-xl border transition-all flex flex-col gap-3 ${
                                isSelected
                                  ? "border-indigo-400 bg-indigo-50/20"
                                  : "border-neutral-200/70 bg-white hover:border-neutral-300"
                              }`}
                            >
                              <div className="flex justify-between items-start w-full">
                                <div 
                                  className="text-left rtl:text-right cursor-pointer flex-1"
                                  onClick={() => setSelectedStudentForChat(studentItem)}
                                >
                                  <span className="block font-extrabold text-neutral-900 text-xs hover:text-indigo-600 transition-colors">
                                    {studentItem.name} {studentItem.isDisabled && (
                                      <span className="text-[10px] text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded ml-1 rtl:mr-1">
                                        {isArabic ? "معطل" : "Disabled"}
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-[10px] text-neutral-400 font-mono leading-none block mt-0.5">
                                    {studentItem.email}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded uppercase">
                                    {studentItem.level}
                                  </span>
                                </div>
                              </div>

                              {/* Student management actions */}
                              <div className="flex flex-col gap-2 border-t border-neutral-100 pt-2 w-full mt-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-neutral-500">
                                      {isArabic ? "المستوى الحالي:" : "Current Level:"}
                                    </span>
                                    <select
                                      value={studentItem.level}
                                      onChange={(e) => handleChangeStudentLevel(studentItem, e.target.value as any)}
                                      className="px-2 py-1 border border-neutral-200 rounded-lg text-[10px] outline-none focus:ring-1 focus:ring-indigo-500 bg-neutral-50"
                                    >
                                      <option value="A1">A1</option>
                                      <option value="A2">A2</option>
                                      <option value="B1">B1</option>
                                      <option value="B2">B2</option>
                                      <option value="C1">C1</option>
                                      <option value="C2">C2</option>
                                    </select>
                                  </div>

                                  <div className="flex gap-1.5">
                                    {/* Chat button */}
                                    <button
                                      onClick={() => setSelectedStudentForChat(studentItem)}
                                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                        isSelected 
                                          ? "bg-indigo-600 text-white" 
                                          : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                                      }`}
                                    >
                                      {isArabic ? "مراسلة" : "Chat"}
                                    </button>

                                    {/* Toggle Disable button */}
                                    <button
                                      onClick={() => handleToggleStudentDisabled(studentItem)}
                                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                        studentItem.isDisabled
                                          ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                                          : "bg-amber-50 hover:bg-amber-100 text-amber-700"
                                      }`}
                                    >
                                      {studentItem.isDisabled 
                                        ? (isArabic ? "تفعيل الحساب" : "Enable")
                                        : (isArabic ? "تعطيل الحساب" : "Disable")
                                      }
                                    </button>

                                    {/* Delete student button */}
                                    <button
                                      onClick={() => handleDeleteStudent(studentItem.uid)}
                                      className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                      title={isArabic ? "حذف الحساب" : "Delete Account"}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Dynamic Level Unlock Control */}
                                <div className="bg-neutral-50 p-2 rounded-xl space-y-1.5">
                                  <span className="text-[10px] font-bold text-neutral-500 block">
                                    {isArabic ? "التحكم بالمستويات المفتوحة للطالب:" : "Control Student's Unlocked Levels:"}
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {(["A1", "A2", "B1", "B2", "C1", "C2"] as const).map(lvl => {
                                      const isUnlocked = studentItem.unlockedLevels?.includes(lvl) ?? (lvl === "A1" || lvl === studentItem.level);
                                      return (
                                        <button
                                          key={lvl}
                                          type="button"
                                          onClick={async () => {
                                            if (!currentTeacher) return;
                                            let nextUnlocked = studentItem.unlockedLevels ? [...studentItem.unlockedLevels] : ["A1", studentItem.level];
                                            if (isUnlocked) {
                                              // Prevent locking A1 to avoid empty states
                                              if (lvl === "A1") return;
                                              nextUnlocked = nextUnlocked.filter(l => l !== lvl);
                                            } else {
                                              nextUnlocked = [...nextUnlocked, lvl];
                                            }
                                            nextUnlocked = Array.from(new Set(nextUnlocked));
                                            const updated = { ...studentItem, unlockedLevels: nextUnlocked };
                                            await updateStudent(updated, currentTeacher.uid);
                                            const updatedList = await getAllStudents(currentTeacher.uid);
                                            setStudents(updatedList);
                                          }}
                                          className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                                            isUnlocked 
                                              ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                                              : "bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300"
                                          }`}
                                        >
                                          {lvl} {isUnlocked ? "✓" : "✗"}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Chat messaging panel to write to the selected student */}
                    <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between h-[500px]">
                      {selectedStudentForChat ? (
                        <div className="flex flex-col justify-between h-full overflow-hidden">
                          {/* Chat header */}
                          <div className="pb-3 border-b border-neutral-150 shrink-0">
                            <span className="text-[10px] uppercase font-bold text-indigo-500">
                              {isArabic ? "محادثة الطالب" : "Messaging with Student:"}
                            </span>
                            <h5 className="font-extrabold text-neutral-800 text-sm">
                              {selectedStudentForChat.name}
                            </h5>
                          </div>

                          {/* Message List */}
                          <div className="flex-1 overflow-y-auto py-3 space-y-3 my-2 bg-neutral-50/50 rounded-xl p-3">
                            {chatHistory.length > 0 ? (
                              chatHistory.map((msg) => {
                                const isTeacherMsg = msg.senderRole === "teacher";
                                return (
                                  <div
                                    key={msg.id}
                                    className={`flex flex-col max-w-[80%] ${
                                      isTeacherMsg ? "ml-auto" : "mr-auto text-left"
                                    }`}
                                  >
                                    <span className="text-[8px] text-neutral-400 px-1 font-mono">
                                      {msg.senderName}
                                    </span>
                                    <div className={`p-2.5 rounded-xl text-xs mt-0.5 ${
                                      isTeacherMsg
                                        ? "bg-indigo-600 text-white rounded-tr-none"
                                        : "bg-white border border-neutral-200 text-neutral-800 rounded-tl-none"
                                    }`}>
                                      {msg.text}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-center text-neutral-400 text-xs py-8">
                                <MessageSquare className="w-8 h-8 text-neutral-200 mx-auto mb-2" />
                                <p>{isArabic ? "لا توجد رسائل سابقة مع هذا الطالب." : "No messages found with this student."}</p>
                              </div>
                            )}
                          </div>

                          {/* Chat input footer */}
                          <div className="pt-2 border-t border-neutral-100 flex gap-2 shrink-0">
                            <input
                              type="text"
                              value={teacherReplyInput}
                              onChange={(e) => setTeacherReplyInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSendTeacherReply();
                              }}
                              placeholder={isArabic ? "اكتب رد الأستاذ هنا..." : "Type teacher response here..."}
                              className="flex-1 px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                              onClick={handleSendTeacherReply}
                              disabled={sendingReply || !teacherReplyInput.trim()}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition-all disabled:opacity-50"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-20 text-neutral-400 flex flex-col justify-center items-center h-full">
                          <MessageSquare className="w-10 h-10 text-neutral-200 mb-2" />
                          <p className="text-xs max-w-[200px]">
                            {isArabic
                              ? "الرجاء تحديد طالب من القائمة لعرض تاريخ المحادثات ومراسلته."
                              : "Select a student from the list to synchronize direct messaging logs."}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
      </div>
    </div>
  );
}
