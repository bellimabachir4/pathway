import React, { useState, useEffect } from "react";
import { 
  Teacher, 
  Student, 
  Lesson, 
  Vocabulary, 
  DynamicVocabCategory,
  LiveSession,
  ChatMessage,
  ResourceOrTip,
  RecordedLesson
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
  saveVocabCategory,
  deleteVocabCategory,
  saveLiveSession,
  deleteLiveSession,
  subscribeToStudents,
  subscribeToTeachers,
  subscribeToAllStudents,
  updateStudent,
  deleteStudent,
  getAnnouncements,
  saveAnnouncement,
  deleteAnnouncement,
  saveResourceOrTip,
  deleteResourceOrTip,
  subscribeToResourcesAndTips,
  purgeEntireSystem,
  saveRecordedLesson,
  deleteRecordedLesson,
  subscribeToRecordedLessons
} from "../lib/dbService";
import { Announcement } from "../types";
import TrainingAdmin from "./TrainingAdmin";
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
  Megaphone,
  Globe,
  Lightbulb,
  ExternalLink,
  Search,
  Gamepad2,
  PlayCircle,
  Eye,
  EyeOff
} from "lucide-react";

interface TeacherDashboardProps {
  currentTeacher: Teacher | null;
  onSelectTeacher: (teacher: Teacher | null) => void;
  lessons: Lesson[];
  vocabulary: Vocabulary[];
  vocabCategories: DynamicVocabCategory[];
  liveSessions: LiveSession[];
  onRefreshData: () => void;
  isArabic: boolean;
}

export default function TeacherDashboard({
  currentTeacher,
  onSelectTeacher,
  lessons,
  vocabulary,
  vocabCategories,
  liveSessions,
  onRefreshData,
  isArabic,
}: TeacherDashboardProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [activeTab, setActiveTab] = useState<"lessons" | "vocab" | "live" | "recorded_lessons" | "students" | "announcements" | "resources" | "tips" | "training">("lessons");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  // Scroll to top on activeTab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as any });
  }, [activeTab]);

  // Recorded Lessons states
  const [recordedLessonsList, setRecordedLessonsList] = useState<RecordedLesson[]>([]);
  const [showRecordedForm, setShowRecordedForm] = useState(false);
  const [editRecordedLessonId, setEditRecordedLessonId] = useState<string | null>(null);
  const [recordedForm, setRecordedForm] = useState({
    title: "",
    topic: "",
    level: "A1" as any,
    order: 1,
    videoUrl: ""
  });

  useEffect(() => {
    const unsubscribe = subscribeToRecordedLessons((items) => {
      setRecordedLessonsList(items);
    });
    return unsubscribe;
  }, []);

  // Resources and Tips states
  const [resourcesTipsList, setResourcesTipsList] = useState<ResourceOrTip[]>([]);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [editResourceId, setEditResourceId] = useState<string | null>(null);
  const [resourceForm, setResourceForm] = useState({
    title: "",
    url: "",
    content: "",
    level: "All" as any
  });

  const [showTipForm, setShowTipForm] = useState(false);
  const [editTipId, setEditTipId] = useState<string | null>(null);
  const [tipForm, setTipForm] = useState({
    title: "",
    content: "",
    level: "All" as any
  });

  useEffect(() => {
    const unsubscribe = subscribeToResourcesAndTips((items) => {
      setResourcesTipsList(items);
    });
    return unsubscribe;
  }, []);

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

  // Student Management states for Admin
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [adminStudentSearchQuery, setAdminStudentSearchQuery] = useState("");
  const [studentLevelFilter, setStudentLevelFilter] = useState("All");
  const [studentTeacherFilter, setStudentTeacherFilter] = useState("All");
  const [studentEditLoading, setStudentEditLoading] = useState<string | null>(null);

  // Teacher Management states for Admin
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [showEditTeacherModal, setShowEditTeacherModal] = useState(false);
  const [editTeacherForm, setEditTeacherForm] = useState({
    name: "",
    email: "",
    loginCode: "",
    specialty: "",
    specialtyAr: ""
  });

  useEffect(() => {
    if (!isAdminMode) return;
    
    // Subscribe to all students for real-time updates
    const unsubscribe = subscribeToAllStudents((studentsList) => {
      setAllStudents(studentsList);
    });
    
    return () => {
      unsubscribe();
    };
  }, [isAdminMode]);

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
    exampleAr: "",
    pronunciation: "",
    partOfSpeech: "",
    category: "",
    level: "B1" as "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
  });

  const [selectedVocabLevel, setSelectedVocabLevel] = useState<"A1" | "A2" | "B1" | "B2" | "C1" | "C2">("B1");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    en: "",
    ar: "",
    order: 1,
    imageUrl: ""
  });

  const [showLiveForm, setShowLiveForm] = useState(false);
  const [liveForm, setLiveForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    link: ""
  });

  // Student details panel state
  const [selectedStudentForChat, setSelectedStudentForChat] = useState<Student | null>(null);

  useEffect(() => {
    const unsubTeachers = subscribeToTeachers(setTeachers);
    let unsubStudents = () => {};
    if (currentTeacher) {
      unsubStudents = subscribeToStudents(currentTeacher.uid, setStudents);
    }
    return () => {
      unsubTeachers();
      unsubStudents();
    };
  }, [currentTeacher]);

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

  const handleStartEditTeacher = (t: Teacher) => {
    setEditingTeacher(t);
    setEditTeacherForm({
      name: t.name,
      email: t.email,
      loginCode: t.loginCode || "",
      specialty: t.specialty || "",
      specialtyAr: t.specialtyAr || ""
    });
    setShowEditTeacherModal(true);
  };

  const handleSaveEditTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    try {
      const updated: Teacher = {
        ...editingTeacher,
        name: editTeacherForm.name,
        email: editTeacherForm.email,
        loginCode: editTeacherForm.loginCode,
        specialty: editTeacherForm.specialty,
        specialtyAr: editTeacherForm.specialtyAr
      };
      await updateTeacher(updated);
      setTeachers(prev => prev.map(t => t.uid === updated.uid ? updated : t));
      setShowEditTeacherModal(false);
      setEditingTeacher(null);
    } catch (err) {
      console.error("Failed to update teacher:", err);
    }
  };

  const handleResetAllData = async () => {
    const confirmReset = window.confirm(
      isArabic
        ? "تنبيه هام جداً: هل أنت متأكد بنسبة 100% من حذف كافة الحسابات والبيانات من قاعدة البيانات نهائياً؟ سيتم تصفير النظام بالكامل ولن تكون قادراً على استرجاع أي بيانات."
        : "CRITICAL WARNING: Are you 100% sure you want to purge all accounts, students, and custom teacher records from the database permanently? This action cannot be undone."
    );
    if (!confirmReset) return;

    try {
      await purgeEntireSystem();
      alert(
        isArabic
          ? "تم تصفير قاعدة البيانات بنجاح وحذف كافة الحسابات. سيتم إعادة تحميل الصفحة الآن لتهيئة النظام الجديد."
          : "System database purged and all accounts successfully cleared. Reloading page now to initialize pristine setup."
      );
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Error: " + e);
    }
  };

  const handleUpdateStudentField = async (
    targetStudent: Student, 
    fields: Partial<Student>
  ) => {
    setStudentEditLoading(targetStudent.uid);
    try {
      const updated: Student = {
        ...targetStudent,
        ...fields
      };
      
      const newTeacherId = fields.selectedTeacherId !== undefined 
        ? fields.selectedTeacherId 
        : (targetStudent.selectedTeacherId || "teacher-sarah");
        
      await updateStudent(updated, newTeacherId);
    } catch (err) {
      console.error("Failed to update student field:", err);
    } finally {
      setStudentEditLoading(null);
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

  // ================= RECORDED LESSONS MANAGEMENT ACTIONS =================
  const handleSaveRecordedLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rId = editRecordedLessonId || `rec_${Date.now()}`;
    const lessonToSave: RecordedLesson = {
      id: rId,
      title: recordedForm.title,
      topic: recordedForm.topic,
      level: recordedForm.level,
      order: Number(recordedForm.order),
      videoUrl: recordedForm.videoUrl,
      createdAt: new Date().toISOString()
    };
    await saveRecordedLesson(lessonToSave, currentTeacher?.uid);
    setShowRecordedForm(false);
    setEditRecordedLessonId(null);
    setRecordedForm({ title: "", topic: "", level: "A1", order: 1, videoUrl: "" });
  };

  const handleDeleteRecordedLesson = async (id: string) => {
    if (confirm(isArabic ? "هل أنت متأكد من حذف هذه الحصة المسجلة؟" : "Are you sure you want to delete this recorded lesson?")) {
      await deleteRecordedLesson(id, currentTeacher?.uid);
    }
  };

  const handleStartEditRecordedLesson = (lesson: RecordedLesson) => {
    setEditRecordedLessonId(lesson.id);
    setRecordedForm({
      title: lesson.title,
      topic: lesson.topic,
      level: lesson.level,
      order: lesson.order,
      videoUrl: lesson.videoUrl
    });
    setShowRecordedForm(true);
  };

  // ================= RESOURCES & TIPS MANAGEMENT ACTIONS =================
  const handleSaveResourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rId = editResourceId || `resource_${Date.now()}`;
    const resourceToSave: ResourceOrTip = {
      id: rId,
      type: "resource",
      title: resourceForm.title,
      url: resourceForm.url,
      content: resourceForm.content,
      level: resourceForm.level,
      createdAt: new Date().toISOString()
    };
    await saveResourceOrTip(resourceToSave, currentTeacher?.uid);
    setShowResourceForm(false);
    setEditResourceId(null);
    setResourceForm({ title: "", url: "", content: "", level: "All" });
  };

  const handleDeleteResource = async (id: string) => {
    if (confirm(isArabic ? "هل أنت متأكد من حذف هذا المصدر؟" : "Are you sure you want to delete this resource?")) {
      await deleteResourceOrTip(id, currentTeacher?.uid);
    }
  };

  const handleSaveTipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tId = editTipId || `tip_${Date.now()}`;
    const tipToSave: ResourceOrTip = {
      id: tId,
      type: "tip",
      title: tipForm.title,
      content: tipForm.content,
      level: tipForm.level,
      createdAt: new Date().toISOString()
    };
    await saveResourceOrTip(tipToSave, currentTeacher?.uid);
    setShowTipForm(false);
    setEditTipId(null);
    setTipForm({ title: "", content: "", level: "All" });
  };

  const handleDeleteTip = async (id: string) => {
    if (confirm(isArabic ? "هل أنت متأكد من حذف هذه النصيحة؟" : "Are you sure you want to delete this tip?")) {
      await deleteResourceOrTip(id, currentTeacher?.uid);
    }
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
      exampleAr: vocabForm.exampleAr,
      pronunciation: vocabForm.pronunciation,
      partOfSpeech: vocabForm.partOfSpeech,
      category: vocabForm.category || selectedSectionId,
      level: vocabForm.level || selectedVocabLevel,
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
      exampleAr: "",
      pronunciation: "",
      partOfSpeech: "",
      category: "",
      level: selectedVocabLevel
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
      exampleAr: v.exampleAr || "",
      pronunciation: v.pronunciation || "",
      partOfSpeech: v.partOfSpeech || "",
      category: v.category,
      level: v.level || selectedVocabLevel
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

  const handleSaveCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeacher) return;
    const catId = editCategoryId || `${selectedVocabLevel}_${Date.now()}`;
    const categoryToSave: DynamicVocabCategory = {
      id: catId,
      en: categoryForm.en,
      ar: categoryForm.ar,
      level: selectedVocabLevel,
      order: Number(categoryForm.order),
      imageUrl: categoryForm.imageUrl
    };
    await saveVocabCategory(categoryToSave, currentTeacher.uid);
    setShowCategoryForm(false);
    setEditCategoryId(null);
    setCategoryForm({
      en: "",
      ar: "",
      order: 1,
      imageUrl: ""
    });
  };

  const handleEditCategoryTrigger = (cat: DynamicVocabCategory) => {
    setEditCategoryId(cat.id);
    setCategoryForm({
      en: cat.en,
      ar: cat.ar,
      order: cat.order,
      imageUrl: cat.imageUrl || ""
    });
    setShowCategoryForm(true);
  };

  const handleDeleteCategoryTrigger = async (id: string) => {
    if (!currentTeacher) return;
    if (confirm(isArabic ? "هل أنت متأكد من حذف هذا القسم؟ سيتم حذف هذا القسم وتصنيفه للمفردات." : "Are you sure you want to delete this section? This section will be removed from vocabulary categories.")) {
      await deleteVocabCategory(id, currentTeacher.uid);
    }
  };

  const handleCategoryCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCategoryForm(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
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
      teacherName: currentTeacher.name || "Professor Sarah",
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
              {isArabic ? "لوحة الأستاذ - Pathway Languages" : "Professor Board - Pathway Languages"}
            </h2>
            <p className="text-neutral-400 text-xs leading-relaxed">
              {isArabic
                ? "أهلاً بك في البوابة الأكاديمية لمنصة Pathway Languages. اختر حسابك للدخول إلى صفحتك الخاصة لإدارة وتعديل مناهجك، فصولك، والدردشة مع طلابك بشكل فوري ودائم."
                : "Welcome to the Pathway Languages Academic Portal. Choose your account below to access your custom space to manage curriculum, virtual classes, and chat with your assigned students."}
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
                {isAdminMode && (
                  <button
                    onClick={() => setShowRegisterForm(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-3 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-indigo-100 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isArabic ? "إضافة حساب جديد" : "Add New Account"}</span>
                  </button>
                )}
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

          {isAdminMode && showRegisterForm && (
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
                    placeholder="Prof. Sarah"
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
                    placeholder="sarah@englishpathway.com"
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
 
          {/* STUDENT MANAGEMENT PAGE FOR ADMIN */}
          {isAdminMode && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in my-6" id="admin-student-management-section">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="text-left rtl:text-right">
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-black px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 font-mono mb-1.5 border border-indigo-100">
                    <Users className="w-3.5 h-3.5" />
                    {isArabic ? "لوحة التحكم الخاصة بالمدير" : "ADMIN CENTRAL CONTROL"}
                  </span>
                  <h3 className="text-lg font-black text-slate-800 font-display">
                    {isArabic ? "إدارة شؤون الطلاب" : "Student Enrollment & Accounts"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isArabic 
                      ? "تابع سجل الطلاب، غير المستويات والأساتذة، وقم بتنشيط أو إيقاف الحسابات مباشرة لحظياً." 
                      : "Manage students, update learning levels, assign tutees, and toggle active status in real-time."}
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2 text-xs font-bold font-mono text-slate-500 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                  <span>{isArabic ? "إجمالي الطلاب:" : "Total Students:"} <span className="text-indigo-600">{allStudents.length}</span></span>
                  <span className="text-slate-200">|</span>
                  <span>{isArabic ? "النشطون:" : "Active:"} <span className="text-emerald-600">{allStudents.filter(s => !s.isDisabled).length}</span></span>
                </div>
              </div>

              {/* Filters & Search Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search Box */}
                <div className="relative">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                    {isArabic ? "البحث بالاسم أو البريد الإلكتروني" : "Search Student / Email"}
                  </label>
                  <input
                    type="text"
                    value={adminStudentSearchQuery}
                    onChange={(e) => setAdminStudentSearchQuery(e.target.value)}
                    placeholder={isArabic ? "ابحث عن طالب..." : "Search by name or email..."}
                    className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
                  />
                </div>

                {/* Level Filter */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                    {isArabic ? "تصفية بالمستوى" : "Filter by Level"}
                  </label>
                  <select
                    value={studentLevelFilter}
                    onChange={(e) => setStudentLevelFilter(e.target.value)}
                    className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-white text-slate-700 font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
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

                {/* Teacher Filter */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                    {isArabic ? "تصفية بالأستاذ المختار" : "Filter by Teacher"}
                  </label>
                  <select
                    value={studentTeacherFilter}
                    onChange={(e) => setStudentTeacherFilter(e.target.value)}
                    className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-white text-slate-700 font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="All">{isArabic ? "جميع الأساتذة" : "All Teachers"}</option>
                    {teachers.map(t => (
                      <option key={t.uid} value={t.uid}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Students Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left rtl:text-right text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-black uppercase tracking-wider font-mono">
                        <th className="p-4 w-12 text-center">#</th>
                        <th className="p-4">{isArabic ? "الطالب" : "Student"}</th>
                        <th className="p-4">{isArabic ? "المستوى الحالي" : "Current Level"}</th>
                        <th className="p-4">{isArabic ? "الأستاذ المختار" : "Assigned Tutor"}</th>
                        <th className="p-4">{isArabic ? "تاريخ التسجيل" : "Enrolled At"}</th>
                        <th className="p-4 text-center">{isArabic ? "حالة الحساب" : "Account Status"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {allStudents
                        .filter(s => {
                          const query = adminStudentSearchQuery.toLowerCase().trim();
                          const matchesSearch = !query || 
                            s.name.toLowerCase().includes(query) || 
                            s.email.toLowerCase().includes(query);
                            
                          const matchesLevel = studentLevelFilter === "All" || s.level === studentLevelFilter;
                          const matchesTeacher = studentTeacherFilter === "All" || s.selectedTeacherId === studentTeacherFilter;
                          
                          return matchesSearch && matchesLevel && matchesTeacher;
                        })
                        .map((stud, sIndex) => {
                          const isEditing = studentEditLoading === stud.uid;
                          return (
                            <tr key={stud.uid} className={`hover:bg-slate-50/50 transition-colors ${stud.isDisabled ? "bg-red-50/20" : ""}`}>
                              {/* Serial Number */}
                              <td className="p-4 text-center font-bold text-slate-400 font-mono">
                                {sIndex + 1}
                              </td>
                              {/* Student Info */}
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 font-extrabold flex items-center justify-center border border-indigo-100 uppercase shrink-0">
                                    {stud.name.charAt(0)}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="block font-extrabold text-slate-800 text-xs truncate">{stud.name}</span>
                                    <span className="text-[10px] text-slate-450 block font-mono truncate">{stud.email}</span>
                                  </div>
                                </div>
                              </td>

                              {/* Student Level */}
                              <td className="p-4">
                                <select
                                  value={stud.level || "A1"}
                                  disabled={isEditing}
                                  onChange={(e) => handleUpdateStudentField(stud, { level: e.target.value as any, selectedLevelCode: e.target.value as any })}
                                  className="text-xs font-bold font-mono text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg border border-indigo-150 transition-all cursor-pointer focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                  <option value="A1">A1</option>
                                  <option value="A2">A2</option>
                                  <option value="B1">B1</option>
                                  <option value="B2">B2</option>
                                  <option value="C1">C1</option>
                                  <option value="C2">C2</option>
                                </select>
                              </td>

                              {/* Student Teacher */}
                              <td className="p-4">
                                <select
                                  value={stud.selectedTeacherId || ""}
                                  disabled={isEditing}
                                  onChange={(e) => handleUpdateStudentField(stud, { selectedTeacherId: e.target.value })}
                                  className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg border border-slate-200 transition-all cursor-pointer focus:ring-1 focus:ring-slate-400 disabled:opacity-50"
                                >
                                  <option value="">{isArabic ? "لم يتم الاختيار" : "Not Assigned"}</option>
                                  {teachers.map(t => (
                                    <option key={t.uid} value={t.uid}>{t.name}</option>
                                  ))}
                                </select>
                              </td>

                              {/* Enrolled At Date */}
                              <td className="p-4 text-slate-450 font-semibold font-mono">
                                {stud.registrationDate ? new Date(stud.registrationDate).toLocaleDateString(isArabic ? "ar-EG" : "en-US", { year: 'numeric', month: 'short', day: 'numeric' }) : "-"}
                              </td>

                              {/* Account status toggle */}
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => handleUpdateStudentField(stud, { isDisabled: !stud.isDisabled })}
                                  disabled={isEditing}
                                  className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 ${
                                    stud.isDisabled 
                                      ? "bg-rose-50 border border-rose-150 text-rose-600 hover:bg-rose-100/70"
                                      : "bg-emerald-50 border border-emerald-150 text-emerald-600 hover:bg-emerald-100/70"
                                  }`}
                                >
                                  {stud.isDisabled 
                                    ? (isArabic ? "موقوف" : "Deactivated") 
                                    : (isArabic ? "نشط" : "Active")}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PROFESSOR MANAGEMENT PAGE FOR ADMIN */}
          {isAdminMode && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in my-6" id="admin-professor-management-section">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="text-left rtl:text-right">
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-black px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 font-mono mb-1.5 border border-indigo-100">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {isArabic ? "لوحة الإشراف على الطاقم الأكاديمي" : "ACADEMIC STAFF CONTROL"}
                  </span>
                  <h3 className="text-lg font-black text-slate-800 font-display">
                    {isArabic ? "إدارة شؤون الأساتذة" : "Professor & Teacher Management"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isArabic 
                      ? "تابع حسابات المعلمين المسجلين في المنصة، عدّل بياناتهم، تفعّل/أوقف صلاحيات دخولهم، أو احذف حساباتهم." 
                      : "View and manage teacher registration accounts, edit login credentials, activate or suspend staff access."}
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex gap-2 text-xs font-bold font-mono text-slate-500 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                    <span>{isArabic ? "إجمالي الأساتذة:" : "Total Professors:"} <span className="text-indigo-600">{teachers.length}</span></span>
                    <span className="text-slate-200">|</span>
                    <span>{isArabic ? "النشطون:" : "Active:"} <span className="text-emerald-600">{teachers.filter(t => !t.isDisabled).length}</span></span>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowRegisterForm(true);
                      document.getElementById("teacher-dashboard-container")?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-indigo-100 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isArabic ? "إضافة أستاذ جديد" : "Add Professor"}</span>
                  </button>
                </div>
              </div>

              {/* Professors Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left rtl:text-right text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-black uppercase tracking-wider font-mono">
                        <th className="p-4 w-12 text-center">#</th>
                        <th className="p-4">{isArabic ? "الأستاذ" : "Professor"}</th>
                        <th className="p-4">{isArabic ? "البريد الإلكتروني" : "Email (Gmail)"}</th>
                        <th className="p-4">{isArabic ? "كود الدخول" : "Access Code"}</th>
                        <th className="p-4 text-center">{isArabic ? "حالة الحساب" : "Status"}</th>
                        <th className="p-4 text-center">{isArabic ? "العمليات" : "Actions"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {teachers.map((prof, tIndex) => {
                        return (
                          <tr key={prof.uid} className={`hover:bg-slate-50/50 transition-colors ${prof.isDisabled ? "bg-amber-50/10" : ""}`}>
                            {/* Serial Number */}
                            <td className="p-4 text-center font-bold text-slate-450 font-mono">
                              {tIndex + 1}
                            </td>

                            {/* Prof Info */}
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={prof.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(prof.name)}&background=4f46e5&color=fff&bold=true`}
                                  alt=""
                                  className="w-9 h-9 rounded-xl object-cover border border-slate-100 shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="min-w-0">
                                  <span className="block font-extrabold text-slate-800 text-xs truncate">{prof.name}</span>
                                  <span className="text-[10px] text-indigo-500 block font-semibold truncate">
                                    {prof.specialtyAr || (isArabic ? "أستاذ لغة إنجليزية" : "English Professor")}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Email */}
                            <td className="p-4 font-semibold text-slate-600 font-mono">
                              {prof.email}
                            </td>

                            {/* Login Code */}
                            <td className="p-4 font-mono font-bold text-slate-500">
                              {prof.loginCode || "••••••"}
                            </td>

                            {/* Status */}
                            <td className="p-4 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black ${
                                prof.isDisabled
                                  ? "bg-amber-50 text-amber-700 border border-amber-100"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${prof.isDisabled ? "bg-amber-500 animate-pulse" : "bg-emerald-500 animate-pulse"}`} />
                                {prof.isDisabled ? (isArabic ? "موقوف مؤقتاً" : "Suspended") : (isArabic ? "نشط ومفعل" : "Active")}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleStartEditTeacher(prof)}
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-transparent hover:border-indigo-100/30 transition-all cursor-pointer"
                                  title={isArabic ? "تعديل البيانات" : "Edit Profile"}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                
                                <button
                                  onClick={() => handleToggleTeacherDisabled(prof)}
                                  className={`p-1.5 rounded-lg border border-transparent transition-all cursor-pointer ${
                                    prof.isDisabled
                                      ? "text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100"
                                      : "text-amber-600 hover:bg-amber-50 hover:border-amber-100"
                                  }`}
                                  title={prof.isDisabled ? (isArabic ? "تنشيط الحساب" : "Activate") : (isArabic ? "إيقاف الحساب" : "Suspend")}
                                >
                                  {prof.isDisabled ? <Check className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                </button>

                                <button
                                  onClick={() => handleDeleteTeacherAccount(prof.uid)}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                                  title={isArabic ? "حذف الحساب" : "Delete Account"}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* EDIT TEACHER MODAL */}
          {showEditTeacherModal && editingTeacher && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in" id="edit-teacher-modal">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-md w-full relative">
                <h4 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <UserPlus className="w-5 h-5 text-indigo-600" />
                  <span>{isArabic ? `تعديل بيانات الأستاذ: ${editingTeacher.name}` : `Edit Teacher: ${editingTeacher.name}`}</span>
                </h4>

                <form onSubmit={handleSaveEditTeacherSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      {isArabic ? "اسم الأستاذ:" : "Full Name:"}
                    </label>
                    <input
                      type="text"
                      required
                      value={editTeacherForm.name}
                      onChange={(e) => setEditTeacherForm({ ...editTeacherForm, name: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-250 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      {isArabic ? "البريد الإلكتروني (Gmail):" : "Email Address:"}
                    </label>
                    <input
                      type="email"
                      required
                      value={editTeacherForm.email}
                      onChange={(e) => setEditTeacherForm({ ...editTeacherForm, email: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-250 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      {isArabic ? "كود الدخول للحساب:" : "Custom Access Code:"}
                    </label>
                    <input
                      type="text"
                      required
                      value={editTeacherForm.loginCode}
                      onChange={(e) => setEditTeacherForm({ ...editTeacherForm, loginCode: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-250 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      {isArabic ? "التخصص (بالإنجليزي):" : "Specialty (EN):"}
                    </label>
                    <input
                      type="text"
                      value={editTeacherForm.specialty}
                      onChange={(e) => setEditTeacherForm({ ...editTeacherForm, specialty: e.target.value })}
                      placeholder="English & IELTS Instructor"
                      className="w-full px-4 py-3 border border-slate-250 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      {isArabic ? "التخصص (بالعربي):" : "Specialty (AR):"}
                    </label>
                    <input
                      type="text"
                      value={editTeacherForm.specialtyAr}
                      onChange={(e) => setEditTeacherForm({ ...editTeacherForm, specialtyAr: e.target.value })}
                      placeholder="أستاذ لغة إنجليزية وآيلتس"
                      className="w-full px-4 py-3 border border-slate-250 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl text-xs transition-all shadow-md shadow-indigo-100 cursor-pointer"
                    >
                      {isArabic ? "حفظ التعديلات" : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditTeacherModal(false);
                        setEditingTeacher(null);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-3 rounded-2xl text-xs transition-all cursor-pointer"
                    >
                      {isArabic ? "إلغاء" : "Cancel"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {isAdminMode && (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-left rtl:text-right space-y-4 animate-fade-in my-6">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-red-600 shrink-0" />
                <div>
                  <h4 className="font-extrabold text-neutral-850 text-sm font-display">
                    {isArabic ? "لوحة تحكم المدير: الحذف الكلي وتصفير النظام" : "Admin Panel: Global Reset & Data Purge"}
                  </h4>
                  <p className="text-[11px] text-red-700 mt-0.5">
                    {isArabic
                      ? "هذا الإجراء سيقوم بحذف جميع الطلاب، والأساتذة المسجلين (عدا الحسابات الافتراضية)، وكافة الدروس، والبيانات من قاعدة البيانات نهائياً لتهيئة النظام لاستقبال تسجيلات جديدة."
                      : "This will permanently purge all student accounts, registered teacher profiles, lessons, vocab, lives, and custom records from the database, resetting the platform to a pristine default state."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetAllData}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-6 py-3 rounded-2xl text-xs sm:text-sm transition-all shadow-md shadow-red-100 cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isArabic ? "حذف كافة الحسابات والبيانات والبدء من جديد" : "Purge All Accounts & Data"}</span>
              </button>
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
        <div className="flex flex-wrap border-b border-neutral-200">
          <button
            onClick={() => setActiveTab("training")}
            className={`flex-1 min-w-[120px] py-3 text-center text-xs font-bold border-b-2 transition-all ${
              activeTab === "training"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-neutral-400 hover:text-neutral-700"
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <Gamepad2 className="w-4 h-4" />
              <span>{isArabic ? "إدارة التدريب" : "Training Management"}</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("tips")}
            className={`flex-1 min-w-[120px] py-3 text-center text-xs font-bold border-b-2 transition-all ${
              activeTab === "tips"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-neutral-400 hover:text-neutral-700"
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <Lightbulb className="w-4 h-4" />
              <span>{isArabic ? "النصائح" : "Tips"}</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("resources")}
            className={`flex-1 min-w-[120px] py-3 text-center text-xs font-bold border-b-2 transition-all ${
              activeTab === "resources"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-neutral-400 hover:text-neutral-700"
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <Globe className="w-4 h-4" />
              <span>{isArabic ? "المصادر" : "Resources"}</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("students")}
            className={`flex-1 min-w-[120px] py-3 text-center text-xs font-bold border-b-2 transition-all ${
              activeTab === "students"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-neutral-400 hover:text-neutral-700"
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <Users className="w-4 h-4" />
              <span>{isArabic ? "الطلاب" : "Students"}</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("recorded_lessons")}
            className={`flex-1 min-w-[120px] py-3 text-center text-xs font-bold border-b-2 transition-all ${
              activeTab === "recorded_lessons"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-neutral-400 hover:text-neutral-700"
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <PlayCircle className="w-4 h-4" />
              <span>{isArabic ? "الحصص المسجلة" : "Recorded Sessions"}</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("live")}
            className={`flex-1 min-w-[120px] py-3 text-center text-xs font-bold border-b-2 transition-all ${
              activeTab === "live"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-neutral-400 hover:text-neutral-700"
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <Video className="w-4 h-4" />
              <span>{isArabic ? "الحصص المباشرة" : "Live Sessions"}</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("vocab")}
            className={`flex-1 min-w-[120px] py-3 text-center text-xs font-bold border-b-2 transition-all ${
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
            onClick={() => setActiveTab("lessons")}
            className={`flex-1 min-w-[120px] py-3 text-center text-xs font-bold border-b-2 transition-all ${
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
        </div>

              {/* TAB: RECORDED LESSONS MANAGEMENT */}
              {activeTab === "recorded_lessons" && (
                <div className="space-y-6">
                  {/* Recorded Lesson Form */}
                  {showRecordedForm ? (
                    <form onSubmit={handleSaveRecordedLessonSubmit} className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4">
                      <h4 className="font-extrabold text-xs text-rose-600 uppercase tracking-wider">
                        {editRecordedLessonId ? (isArabic ? "تعديل الحصة المسجلة" : "Edit Recorded Lesson") : (isArabic ? "إضافة حصة مسجلة جديدة" : "Create Recorded Lesson")}
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "عنوان الدرس أو الحصة:" : "Lesson/Session Title:"}
                          </label>
                          <input
                            type="text"
                            required
                            value={recordedForm.title}
                            onChange={(e) => setRecordedForm({ ...recordedForm, title: e.target.value })}
                            placeholder={isArabic ? "مثال: شرح أزمنة المستقبل البسيط" : "Example: Future Simple Explanations"}
                            className="w-full px-3 py-2 border border-neutral-250 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500 bg-neutral-50/50"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "موضوع الدرس (أو التصنيف):" : "Topic or Category:"}
                          </label>
                          <input
                            type="text"
                            required
                            value={recordedForm.topic}
                            onChange={(e) => setRecordedForm({ ...recordedForm, topic: e.target.value })}
                            placeholder={isArabic ? "مثال: القواعد التأسيسية" : "Example: English Grammar basics"}
                            className="w-full px-3 py-2 border border-neutral-250 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500 bg-neutral-50/50"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "المستوى الدراسي:" : "Pathway Level:"}
                          </label>
                          <select
                            value={recordedForm.level}
                            onChange={(e) => setRecordedForm({ ...recordedForm, level: e.target.value as any })}
                            className="w-full px-3 py-2 border border-neutral-250 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500 bg-neutral-50/50"
                          >
                            <option value="A1">A1</option>
                            <option value="A2">A2</option>
                            <option value="B1">B1</option>
                            <option value="B2">B2</option>
                            <option value="C1">C1</option>
                            <option value="C2">C2</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "ترتيب الظهور في القائمة:" : "Display Order index:"}
                          </label>
                          <input
                            type="number"
                            required
                            min={1}
                            value={recordedForm.order}
                            onChange={(e) => setRecordedForm({ ...recordedForm, order: Number(e.target.value) })}
                            className="w-full px-3 py-2 border border-neutral-250 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500 bg-neutral-50/50"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "رابط الفيديو (YouTube أو أي منصة أخرى):" : "Video URL (YouTube, Vimeo, etc.):"}
                          </label>
                          <input
                            type="url"
                            required
                            value={recordedForm.videoUrl}
                            onChange={(e) => setRecordedForm({ ...recordedForm, videoUrl: e.target.value })}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full px-3 py-2 border border-neutral-250 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500 bg-neutral-50/50 font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowRecordedForm(false);
                            setEditRecordedLessonId(null);
                            setRecordedForm({ title: "", topic: "", level: "A1", order: 1, videoUrl: "" });
                          }}
                          className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          {isArabic ? "إلغاء" : "Cancel"}
                        </button>
                        <button
                          type="submit"
                          className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
                        >
                          {isArabic ? "حفظ الحصة" : "Save Lesson"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex justify-between items-center bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs">
                      <div>
                        <h4 className="font-extrabold text-sm text-neutral-800">
                          {isArabic ? "إدارة أرشيف الحصص المسجلة للطلاب" : "Recorded Class Library Control"}
                        </h4>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {isArabic
                            ? "أضف، عدل أو احذف مقاطع الشرح المسجلة التي تظهر للطلاب حسب مستوياتهم."
                            : "Add, modify or delete recorded class videos available for students based on active levels."}
                        </p>
                      </div>

                      <button
                        onClick={() => setShowRecordedForm(true)}
                        className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-rose-100"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{isArabic ? "إضافة حصة مسجلة جديدة" : "Add Recorded Lesson"}</span>
                      </button>
                    </div>
                  )}

                  {/* Recorded Lessons Table / List */}
                  <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 bg-neutral-50 border-b border-neutral-200">
                      <span className="text-xs font-black text-neutral-700 uppercase tracking-wider font-mono">
                        {isArabic ? "قائمة الحصص المسجلة المتوفرة حالياً" : "Current Recorded Lessons List"}
                      </span>
                    </div>

                    {recordedLessonsList.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left rtl:text-right border-collapse text-xs">
                          <thead>
                            <tr className="bg-neutral-50/50 border-b border-neutral-200 text-neutral-500 uppercase font-black text-[10px] tracking-wider font-mono">
                              <th className="p-4">{isArabic ? "الترتيب" : "Order"}</th>
                              <th className="p-4">{isArabic ? "العنوان" : "Title"}</th>
                              <th className="p-4">{isArabic ? "الموضوع" : "Topic"}</th>
                              <th className="p-4">{isArabic ? "المستوى" : "Level"}</th>
                              <th className="p-4">{isArabic ? "رابط الفيديو" : "Video URL"}</th>
                              <th className="p-4 text-center">{isArabic ? "إجراءات" : "Actions"}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-150">
                            {recordedLessonsList.map((lesson) => (
                              <tr key={lesson.id} className="hover:bg-neutral-50/40 transition-colors">
                                <td className="p-4 font-mono font-bold text-neutral-600">#{lesson.order}</td>
                                <td className="p-4 font-extrabold text-neutral-800">{lesson.title}</td>
                                <td className="p-4 text-neutral-500 font-semibold">{lesson.topic}</td>
                                <td className="p-4 font-mono">
                                  <span className="bg-rose-50 text-rose-700 font-black px-2 py-0.5 rounded border border-rose-100">
                                    {lesson.level}
                                  </span>
                                </td>
                                <td className="p-4 font-mono text-neutral-450 truncate max-w-[180px]">
                                  <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                                    <span>{lesson.videoUrl}</span>
                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                  </a>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => handleStartEditRecordedLesson(lesson)}
                                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                      title={isArabic ? "تعديل" : "Edit"}
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRecordedLesson(lesson.id)}
                                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                      title={isArabic ? "حذف" : "Delete"}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-10 text-neutral-400 font-medium">
                        {isArabic
                          ? "لا توجد أي حصص مسجلة مضافة حالياً في قاعدة البيانات."
                          : "No pre-recorded videos exist in the database yet."}
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                            onClick={async () => {
                              const updated = { ...l, isHidden: !l.isHidden };
                              await saveLesson(updated, currentTeacher?.uid);
                            }}
                            className={`p-1.5 rounded-lg border border-transparent transition-all cursor-pointer ${
                              l.isHidden 
                                ? "text-amber-600 bg-amber-50 hover:bg-amber-100" 
                                : "text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50"
                            }`}
                            title={l.isHidden ? (isArabic ? "إظهار للطلاب" : "Show to Students") : (isArabic ? "إخفاء عن الطلاب" : "Hide from Students")}
                          >
                            {l.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
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
                  {/* Tab Title */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm">
                    <div>
                      <h3 className="font-extrabold text-neutral-800 text-lg">
                        {isArabic ? "مكتبة المفردات والـقواميس التفاعلية" : "Interactive Vocabulary & Sections"}
                      </h3>
                      <p className="text-xs text-neutral-500 font-medium mt-1">
                        {isArabic ? "قم بإنشاء وتعديل الأقسام وتصنيفات المفردات لكل مستوى لغوي، وإضافة كلمات وجمل تفاعلية لكل قسم." : "Manage custom dynamic vocabulary sections for each learning level, and organize vocabulary words in real-time."}
                      </p>
                    </div>
                  </div>

                  {/* Level Selector Tabs */}
                  <div className="flex flex-wrap gap-2 p-1 bg-neutral-100 rounded-xl max-w-fit">
                    {(["A1", "A2", "B1", "B2", "C1", "C2"] as const).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => {
                          setSelectedVocabLevel(lvl);
                          setSelectedSectionId("");
                        }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                          selectedVocabLevel === lvl
                            ? "bg-teal-600 text-white shadow-sm"
                            : "text-neutral-600 hover:text-neutral-800 hover:bg-neutral-200/50"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>

                  {/* Category Section Manager Form */}
                  {showCategoryForm ? (
                    <form onSubmit={handleSaveCategorySubmit} className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4 shadow-sm">
                      <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
                        <h4 className="font-extrabold text-xs text-teal-600 uppercase tracking-wider">
                          {editCategoryId ? (isArabic ? "تعديل قسم المفردات" : "Edit Vocab Section") : (isArabic ? "إضافة قسم مفردات جديد" : "Create New Vocab Section")}
                        </h4>
                        <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-bold uppercase font-mono">
                          {selectedVocabLevel}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "اسم القسم بالإنجليزي (مثال: Technology):" : "Section Title (English):"}
                          </label>
                          <input
                            type="text"
                            required
                            value={categoryForm.en}
                            onChange={(e) => setCategoryForm({ ...categoryForm, en: e.target.value })}
                            placeholder="e.g. Technology & Innovation"
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "اسم القسم بالعربي (مثال: التكنولوجيا والابتكار):" : "Section Title (Arabic):"}
                          </label>
                          <input
                            type="text"
                            required
                            value={categoryForm.ar}
                            onChange={(e) => setCategoryForm({ ...categoryForm, ar: e.target.value })}
                            placeholder="مثال: التكنولوجيا والابتكار"
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "الترتيب والظهور للطلاب (رقم أصغر يظهر أولاً):" : "Sorting Order (Smaller numbers appear first):"}
                          </label>
                          <input
                            type="number"
                            required
                            value={categoryForm.order}
                            onChange={(e) => setCategoryForm({ ...categoryForm, order: Number(e.target.value) })}
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "غلاف القسم (صورة من المعرض / الاستوديو):" : "Section Cover Image (Upload from Studio):"}
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCategoryCoverUpload}
                              className="hidden"
                              id="section-cover-upload-file"
                            />
                            <label
                              htmlFor="section-cover-upload-file"
                              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold cursor-pointer transition-all border border-neutral-200"
                            >
                              {isArabic ? "اختر صورة من الاستوديو 🖼️" : "Upload Image 🖼️"}
                            </label>
                            {categoryForm.imageUrl && (
                              <div className="relative group w-12 h-12 rounded-lg overflow-hidden border border-neutral-200 shadow-sm bg-neutral-50">
                                <img
                                  src={categoryForm.imageUrl}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <button
                                  type="button"
                                  onClick={() => setCategoryForm({ ...categoryForm, imageUrl: "" })}
                                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition-all"
                                >
                                  {isArabic ? "إزالة" : "Remove"}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-xl text-xs transition-all shadow-md"
                        >
                          {isArabic ? "حفظ وتحديث القسم" : "Save Section"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCategoryForm(false);
                            setEditCategoryId(null);
                            setCategoryForm({ en: "", ar: "", order: 1, imageUrl: "" });
                          }}
                          className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold px-4 py-2 rounded-xl text-xs transition-all"
                        >
                          {isArabic ? "إلغاء" : "Cancel"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => {
                        // Prepopulate order based on existing count
                        const count = vocabCategories.filter(c => c.level === selectedVocabLevel).length;
                        setCategoryForm({ en: "", ar: "", order: count + 1, imageUrl: "" });
                        setShowCategoryForm(true);
                      }}
                      className="flex items-center gap-2 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 font-bold py-2.5 px-4 rounded-xl text-xs transition-all w-fit"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isArabic ? `إضافة قسم جديد لمستوى ${selectedVocabLevel}` : `Add New Section for ${selectedVocabLevel}`}</span>
                    </button>
                  )}

                  {/* Vocabulary Word Form (inline/modal) */}
                  {showVocabForm && (
                    <form onSubmit={handleSaveVocabSubmit} className="bg-white border-2 border-indigo-200 rounded-2xl p-5 space-y-4 shadow-md">
                      <div className="flex justify-between items-center pb-2 border-b border-indigo-100">
                        <h4 className="font-extrabold text-xs text-indigo-600 uppercase tracking-wider">
                          {editVocabId ? (isArabic ? "تعديل الكلمة لغوية" : "Edit Vocab Word") : (isArabic ? "إضافة كلمة لغوية جديدة" : "Add New Vocab Word")}
                        </h4>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase font-mono">
                          {vocabForm.category || selectedSectionId} • {selectedVocabLevel}
                        </span>
                      </div>

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
                            placeholder="e.g. Conscientious"
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "الترجمة العربية للكلمة:" : "Arabic Translation:"}
                          </label>
                          <input
                            type="text"
                            required
                            value={vocabForm.translation}
                            onChange={(e) => setVocabForm({ ...vocabForm, translation: e.target.value })}
                            placeholder="مثال: منجز، حي الضمير"
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "نوع الكلمة (مثال: noun, verb, adj):" : "Part of Speech (optional):"}
                          </label>
                          <input
                            type="text"
                            value={vocabForm.partOfSpeech}
                            onChange={(e) => setVocabForm({ ...vocabForm, partOfSpeech: e.target.value })}
                            placeholder="e.g. Adjective"
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "اللفظ الصوتي / النطق:" : "Pronunciation Spelling (optional):"}
                          </label>
                          <input
                            type="text"
                            value={vocabForm.pronunciation}
                            onChange={(e) => setVocabForm({ ...vocabForm, pronunciation: e.target.value })}
                            placeholder="e.g. /ˌkɒn.ʃiˈen.ʃəs/"
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "القسم والموضوع الدراسي:" : "Study Section:"}
                          </label>
                          <select
                            value={vocabForm.category || selectedSectionId}
                            onChange={(e) => setVocabForm({ ...vocabForm, category: e.target.value })}
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-neutral-50"
                          >
                            <option value="">{isArabic ? "اختر القسم..." : "Select Section..."}</option>
                            {vocabCategories.filter(c => c.level === selectedVocabLevel).map(c => (
                              <option key={c.id} value={c.id}>{isArabic ? c.ar : c.en}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "جملة كـ مثال توضيحي (English):" : "Example Sentence (English):"}
                          </label>
                          <input
                            type="text"
                            value={vocabForm.example}
                            onChange={(e) => setVocabForm({ ...vocabForm, example: e.target.value })}
                            placeholder="She is a conscientious worker who always excels."
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "ترجمة الجملة التوضيحية (العربية):" : "Example Sentence Translation (Arabic):"}
                          </label>
                          <input
                            type="text"
                            value={vocabForm.exampleAr}
                            onChange={(e) => setVocabForm({ ...vocabForm, exampleAr: e.target.value })}
                            placeholder="إنها موظفة مخلصة وحريصة تنجز عملها على أكمل وجه وتتفوق دائماً."
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "تعريف الكلمة بالإنجليزي:" : "Definition (English):"}
                          </label>
                          <textarea
                            rows={2}
                            value={vocabForm.definition}
                            onChange={(e) => setVocabForm({ ...vocabForm, definition: e.target.value })}
                            placeholder="Putting a lot of effort into your work; careful and painstaking..."
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "تعريف الكلمة بالعربي:" : "Definition (Arabic):"}
                          </label>
                          <textarea
                            rows={2}
                            value={vocabForm.definitionAr}
                            onChange={(e) => setVocabForm({ ...vocabForm, definitionAr: e.target.value })}
                            placeholder="بذل جهد كبير واهتمام فائق بالعمل لإنجازه بدقة متناهية وإخلاص..."
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs transition-all shadow-md"
                        >
                          {isArabic ? "حفظ وتثبيت الكلمة" : "Save Word"}
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
                  )}

                  {/* Sections List */}
                  <div className="space-y-6">
                    {vocabCategories.filter(c => c.level === selectedVocabLevel).length === 0 ? (
                      <div className="bg-white border border-dashed border-neutral-200 rounded-2xl p-10 text-center">
                        <p className="text-sm text-neutral-400 font-semibold">
                          {isArabic ? `لا توجد أي أقسام لغوية مضافة لمستوى ${selectedVocabLevel} حالياً.` : `No vocabulary sections added for ${selectedVocabLevel} yet.`}
                        </p>
                      </div>
                    ) : (
                      vocabCategories
                        .filter(c => c.level === selectedVocabLevel)
                        .sort((a, b) => a.order - b.order)
                        .map((cat) => {
                          const catWords = vocabulary.filter(v => v.category === cat.id || (v.level === selectedVocabLevel && v.category === cat.en));
                          return (
                            <div key={cat.id} className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-sm">
                              {/* Section Header Banner */}
                              <div className="relative h-20 bg-gradient-to-r from-teal-600/90 to-emerald-600/90 flex items-center justify-between px-6 text-white overflow-hidden">
                                {cat.imageUrl && (
                                  <img
                                    src={cat.imageUrl}
                                    alt="Section Cover"
                                    className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30 pointer-events-none"
                                    referrerPolicy="no-referrer"
                                  />
                                )}
                                <div className="z-10 flex items-center gap-3">
                                  {cat.imageUrl ? (
                                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/20 shadow-inner shrink-0 bg-white/10">
                                      <img src={cat.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    </div>
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xs border border-white/20 shrink-0">
                                      📚
                                    </div>
                                  )}
                                  <div>
                                    <h4 className="font-extrabold text-sm">{cat.en}</h4>
                                    <p className="text-xs text-white/80 font-medium">{cat.ar}</p>
                                  </div>
                                </div>

                                <div className="z-10 flex items-center gap-2">
                                  <span className="text-[10px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded">
                                    {isArabic ? `ترتيب: ${cat.order}` : `Order: ${cat.order}`}
                                  </span>
                                  <button
                                    onClick={() => handleEditCategoryTrigger(cat)}
                                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white"
                                    title={isArabic ? "تعديل القسم" : "Edit Section"}
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCategoryTrigger(cat.id)}
                                    className="p-1.5 bg-white/10 hover:bg-red-500/30 rounded-lg transition-all text-white hover:text-red-100"
                                    title={isArabic ? "حذف القسم" : "Delete Section"}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedSectionId(cat.id);
                                      setVocabForm({
                                        word: "",
                                        translation: "",
                                        definition: "",
                                        definitionAr: "",
                                        example: "",
                                        exampleAr: "",
                                        pronunciation: "",
                                        partOfSpeech: "",
                                        category: cat.id,
                                        level: selectedVocabLevel
                                      });
                                      setShowVocabForm(true);
                                    }}
                                    className="px-3 py-1 bg-white text-teal-800 hover:bg-teal-50 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>{isArabic ? "إضافة مفردة" : "Add Word"}</span>
                                  </button>
                                </div>
                              </div>

                              {/* Section Words Table */}
                              <div className="p-4 bg-neutral-50/40">
                                {catWords.length === 0 ? (
                                  <p className="text-[10px] text-neutral-400 font-semibold italic text-center py-4">
                                    {isArabic ? "لا توجد مفردات لغوية مضافة في هذا القسم حالياً." : "No words added to this section yet."}
                                  </p>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {catWords.map((v) => (
                                      <div key={v.id} className="p-4 bg-white border border-neutral-200 rounded-xl shadow-sm hover:shadow-md transition-all flex justify-between items-start gap-3">
                                        <div className="space-y-1.5 flex-1 min-w-0">
                                          <div className="flex flex-wrap items-center gap-1.5">
                                            <h6 className="font-extrabold text-neutral-800 text-sm truncate">{v.word}</h6>
                                            {v.partOfSpeech && (
                                              <span className="text-[9px] bg-neutral-100 text-neutral-500 px-1.5 py-0.2 rounded font-mono font-bold lowercase">
                                                {v.partOfSpeech}
                                              </span>
                                            )}
                                            {v.pronunciation && (
                                              <span className="text-[9px] text-neutral-400 font-mono">
                                                {v.pronunciation}
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-xs text-teal-700 font-bold">{v.translation}</p>
                                          
                                          {v.definition && (
                                            <div className="text-[10px] text-neutral-600 bg-neutral-50 p-2 rounded-lg space-y-1 border border-neutral-100">
                                              <p className="font-medium font-mono leading-relaxed">{v.definition}</p>
                                              {v.definitionAr && <p className="text-neutral-500 font-sans leading-relaxed">{v.definitionAr}</p>}
                                            </div>
                                          )}

                                          {v.example && (
                                            <div className="text-[10px] bg-indigo-50/30 p-2 rounded-lg border border-indigo-100/30">
                                              <p className="font-semibold text-neutral-700 italic">“ {v.example} ”</p>
                                              {v.exampleAr && <p className="text-neutral-500 font-medium mt-0.5">({v.exampleAr})</p>}
                                            </div>
                                          )}
                                        </div>

                                        <div className="flex gap-1 shrink-0">
                                          <button
                                            onClick={async () => {
                                              const updated = { ...v, isHidden: !v.isHidden };
                                              await saveVocabulary(updated, currentTeacher?.uid);
                                            }}
                                            className={`p-1.5 rounded-lg border border-transparent transition-all cursor-pointer ${
                                              v.isHidden 
                                                ? "text-amber-600 bg-amber-50 hover:bg-amber-100" 
                                                : "text-neutral-450 hover:text-indigo-600 hover:bg-neutral-100"
                                            }`}
                                            title={v.isHidden ? (isArabic ? "إظهار للطلاب" : "Show to Students") : (isArabic ? "إخفاء عن الطلاب" : "Hide from Students")}
                                          >
                                            {v.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                          </button>
                                          <button
                                            onClick={() => handleEditVocabTrigger(v)}
                                            className="p-1.5 text-neutral-400 hover:text-indigo-600 hover:bg-neutral-100 rounded-lg transition-all"
                                            title="Edit Word"
                                          >
                                            <Edit className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteVocabTrigger(v.id)}
                                            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            title="Delete Word"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                    )}
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
                      <span>{isArabic ? "جدولة حصة بث مباشر جديدة" : "Schedule New Live Broadcast"}</span>
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
              {activeTab === "students" && (
                <div className="space-y-6" id="students-tab-panel">
                  {/* Student Management Header */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-neutral-800 text-xs font-display uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600" />
                        {isArabic ? "لوحة إدارة الطلاب" : "Student Management Board"}
                      </h4>
                      <p className="text-[11px] text-indigo-700">
                        {isArabic 
                          ? "عرض وإدارة جميع طلابك المسجلين، وتحديث مستوياتهم، أو تعطيل وحذف حساباتهم مباشرة."
                          : "View and manage all your assigned students, update their study levels, or temporarily disable and delete accounts."}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                      {/* Search Bar */}
                      <div className="relative flex-1 sm:w-64">
                        <input
                          type="text"
                          value={studentSearchQuery}
                          onChange={(e) => setStudentSearchQuery(e.target.value)}
                          placeholder={isArabic ? "ابحث بالاسم أو البريد الإلكتروني..." : "Search by name or email..."}
                          className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      </div>

                      <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl font-mono font-bold text-center shrink-0 border border-indigo-100">
                        {students.length} {isArabic ? "طلاب مسجلين" : "Registered Students"}
                      </span>
                    </div>
                  </div>

                  {/* Student Cards Grid */}
                  {(() => {
                    const filteredStudents = students.filter(s => {
                      const query = studentSearchQuery.toLowerCase().trim();
                      if (!query) return true;
                      return (
                        s.name?.toLowerCase().includes(query) ||
                        s.email?.toLowerCase().includes(query)
                      );
                    });

                    if (filteredStudents.length === 0) {
                      return (
                        <div className="bg-white border border-slate-150 rounded-3xl p-16 text-center text-slate-400 shadow-sm">
                          <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                          <h5 className="font-bold text-slate-700 text-sm mb-1">
                            {isArabic ? "لا يوجد نتائج مطابقة للبحث" : "No matching students found"}
                          </h5>
                          <p className="text-xs text-slate-400">
                            {isArabic ? "تأكد من كتابة الاسم أو البريد الإلكتروني بشكل صحيح." : "Double-check the spelling or try searching for another student."}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredStudents.map((studentItem) => (
                          <div
                            key={studentItem.uid}
                            className={`bg-white border rounded-3xl p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-5 relative ${
                              studentItem.isDisabled 
                                ? "border-red-100 bg-red-50/5" 
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            {/* Card Header (Name, Email, Status) */}
                            <div className="space-y-3">
                              <div className="flex justify-between items-start gap-3">
                                <div className="space-y-1 flex-1 min-w-0">
                                  <h5 className="font-extrabold text-slate-800 text-xs truncate">
                                    {studentItem.name}
                                  </h5>
                                  <p className="text-[10px] text-slate-400 font-mono truncate">
                                    {studentItem.email}
                                  </p>
                                </div>

                                <div className="shrink-0 flex items-center gap-1.5">
                                  {studentItem.isDisabled ? (
                                    <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-105 px-2 py-0.5 rounded-md">
                                      {isArabic ? "معطل" : "Disabled"}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                                      {isArabic ? "نشط" : "Active"}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Student Badges Info (Language, Level, Tutor) */}
                              <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                <div className="space-y-0.5">
                                  <span className="text-slate-400 block text-[9px]">{isArabic ? "اللغة:" : "Language:"}</span>
                                  <span className="font-bold text-slate-700 flex items-center gap-1">
                                    🇬🇧 {studentItem.selectedLanguage || "English"}
                                  </span>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-slate-400 block text-[9px]">{isArabic ? "الأستاذ:" : "Teacher:"}</span>
                                  <span className="font-bold text-slate-700 truncate block">
                                    {studentItem.selectedTeacherName || "Sarah"}
                                  </span>
                                </div>
                                <div className="space-y-0.5 col-span-2 border-t border-slate-200/60 pt-1.5 mt-1">
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-400 block text-[9px]">{isArabic ? "المستوى الدراسي الحالي:" : "Current level:"}</span>
                                    <span className="font-extrabold text-indigo-600 font-mono text-[11px] bg-indigo-50 px-2 py-0.5 rounded">
                                      {studentItem.level}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Card Controls & Actions (Level dropdown, Disable, Delete) */}
                            <div className="space-y-3.5 border-t border-slate-100 pt-4">
                              {/* Level Change Selector */}
                              <div className="flex items-center justify-between gap-3 w-full">
                                <span className="text-[11px] font-bold text-slate-500">
                                  {isArabic ? "تغيير المستوى الدراسي:" : "Update Study Level:"}
                                </span>
                                <select
                                  value={studentItem.level}
                                  onChange={(e) => handleChangeStudentLevel(studentItem, e.target.value as any)}
                                  className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-extrabold text-slate-700 cursor-pointer"
                                >
                                  <option value="A1">A1</option>
                                  <option value="A2">A2</option>
                                  <option value="B1">B1</option>
                                  <option value="B2">B2</option>
                                  <option value="C1">C1</option>
                                  <option value="C2">C2</option>
                                </select>
                              </div>

                              {/* Toggle & Delete buttons */}
                              <div className="flex gap-2.5">
                                <button
                                  onClick={() => handleToggleStudentDisabled(studentItem)}
                                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                                    studentItem.isDisabled
                                      ? "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700"
                                      : "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800"
                                  }`}
                                >
                                  {studentItem.isDisabled
                                    ? (isArabic ? "تفعيل الحساب" : "Enable Account")
                                    : (isArabic ? "تعطيل الحساب" : "Disable Account")
                                  }
                                </button>

                                <button
                                  onClick={() => handleDeleteStudent(studentItem.uid)}
                                  className="bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 p-2 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                                  title={isArabic ? "حذف الحساب نهائياً" : "Delete Account Permanently"}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>{isArabic ? "حذف" : "Delete"}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 5: RESOURCES MANAGEMENT */}
              {activeTab === "resources" && (
                <div className="space-y-6">
                  {/* Resource Form */}
                  {showResourceForm ? (
                    <form onSubmit={handleSaveResourceSubmit} className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4">
                      <h4 className="font-extrabold text-xs text-indigo-600 uppercase tracking-wider">
                        {editResourceId ? (isArabic ? "تعديل المصدر" : "Edit Resource") : (isArabic ? "إضافة مصدر جديد" : "Create Resource")}
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "عنوان المصدر" : "Resource Title"}
                          </label>
                          <input
                            type="text"
                            required
                            value={resourceForm.title}
                            onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder={isArabic ? "مثال: قاموس أكسفورد" : "e.g. Oxford Dictionary"}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "رابط المصدر (URL)" : "Resource Link (URL)"}
                          </label>
                          <input
                            type="url"
                            value={resourceForm.url}
                            onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="https://..."
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "وصف المصدر أو محتواه" : "Resource Description"}
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={resourceForm.content}
                            onChange={(e) => setResourceForm({ ...resourceForm, content: e.target.value })}
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder={isArabic ? "اكتب تفاصيل مختصرة عن فائدة هذا المصدر..." : "Describe how this resource helps students..."}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "المستوى المستهدف" : "Target Level"}
                          </label>
                          <select
                            value={resourceForm.level}
                            onChange={(e) => setResourceForm({ ...resourceForm, level: e.target.value as any })}
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="All">{isArabic ? "جميع المستويات (All)" : "All Levels"}</option>
                            <option value="A1">A1</option>
                            <option value="A2">A2</option>
                            <option value="B1">B1</option>
                            <option value="B2">B2</option>
                            <option value="C1">C1</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowResourceForm(false);
                            setEditResourceId(null);
                          }}
                          className="px-4 py-2 border border-neutral-200 rounded-xl text-xs text-neutral-500 hover:bg-neutral-50"
                        >
                          {isArabic ? "إلغاء" : "Cancel"}
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
                        >
                          {isArabic ? "حفظ" : "Save Resource"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex justify-between items-center bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm">
                      <div>
                        <h4 className="font-extrabold text-sm text-neutral-800">
                          {isArabic ? "المصادر والمواقع التعليمية" : "Educational Resources"}
                        </h4>
                        <p className="text-[10px] text-neutral-450 mt-0.5">
                          {isArabic ? "إضافة وتعديل المواقع التي تظهر للطلاب في قسم المصادر" : "Manage links and materials shown in student Services Portal"}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setEditResourceId(null);
                          setResourceForm({ title: "", url: "", content: "", level: "All" });
                          setShowResourceForm(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer animate-none"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{isArabic ? "إضافة مصدر" : "Add Resource"}</span>
                      </button>
                    </div>
                  )}

                  {/* Resources List Table */}
                  <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left rtl:text-right border-collapse">
                      <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-150 text-[10px] font-bold text-neutral-450 uppercase tracking-wider">
                          <th className="p-4">{isArabic ? "المصدر" : "Resource"}</th>
                          <th className="p-4">{isArabic ? "المستوى" : "Level"}</th>
                          <th className="p-4">{isArabic ? "الوصف" : "Description"}</th>
                          <th className="p-4 text-center">{isArabic ? "خيارات" : "Actions"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-150 text-xs text-neutral-700">
                        {resourcesTipsList.filter(x => x.type === "resource").length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-neutral-400">
                              {isArabic ? "لا توجد مصادر مضافة حالياً." : "No resources added yet."}
                            </td>
                          </tr>
                        ) : (
                          resourcesTipsList.filter(x => x.type === "resource").map((item) => (
                            <tr key={item.id} className="hover:bg-neutral-50/50">
                              <td className="p-4 font-bold text-neutral-900">
                                {item.url ? (
                                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline inline-flex items-center gap-1">
                                    {item.title}
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                ) : (
                                  item.title
                                )}
                              </td>
                              <td className="p-4">
                                <span className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded font-bold">
                                  {item.level}
                                </span>
                              </td>
                              <td className="p-4 max-w-xs truncate" title={item.content}>
                                {item.content}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => {
                                      setEditResourceId(item.id);
                                      setResourceForm({
                                        title: item.title,
                                        url: item.url || "",
                                        content: item.content,
                                        level: item.level as any
                                      });
                                      setShowResourceForm(true);
                                    }}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteResource(item.id)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
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
              )}

              {/* TAB 6: TIPS MANAGEMENT */}
              {activeTab === "tips" && (
                <div className="space-y-6">
                  {/* Tip Form */}
                  {showTipForm ? (
                    <form onSubmit={handleSaveTipSubmit} className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4">
                      <h4 className="font-extrabold text-xs text-indigo-600 uppercase tracking-wider">
                        {editTipId ? (isArabic ? "تعديل النصيحة" : "Edit Tip") : (isArabic ? "إضافة نصيحة جديدة" : "Create Tip")}
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "عنوان النصيحة" : "Tip Title"}
                          </label>
                          <input
                            type="text"
                            required
                            value={tipForm.title}
                            onChange={(e) => setTipForm({ ...tipForm, title: e.target.value })}
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder={isArabic ? "مثال: ممارسة التحدث اليومي" : "e.g. Daily Speaking Habit"}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "محتوى النصيحة بالتفصيل" : "Tip Content"}
                          </label>
                          <textarea
                            required
                            rows={5}
                            value={tipForm.content}
                            onChange={(e) => setTipForm({ ...tipForm, content: e.target.value })}
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder={isArabic ? "اكتب النصيحة والخطوات العملية للطلاب..." : "Write detailed steps or golden advice for students..."}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            {isArabic ? "المستوى المستهدف" : "Target Level"}
                          </label>
                          <select
                            value={tipForm.level}
                            onChange={(e) => setTipForm({ ...tipForm, level: e.target.value as any })}
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="All">{isArabic ? "جميع المستويات (All)" : "All Levels"}</option>
                            <option value="A1">A1</option>
                            <option value="A2">A2</option>
                            <option value="B1">B1</option>
                            <option value="B2">B2</option>
                            <option value="C1">C1</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowTipForm(false);
                            setEditTipId(null);
                          }}
                          className="px-4 py-2 border border-neutral-200 rounded-xl text-xs text-neutral-500 hover:bg-neutral-50"
                        >
                          {isArabic ? "إلغاء" : "Cancel"}
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
                        >
                          {isArabic ? "حفظ" : "Save Tip"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex justify-between items-center bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm">
                      <div>
                        <h4 className="font-extrabold text-sm text-neutral-800">
                          {isArabic ? "النصائح والإرشادات الاستراتيجية" : "Study Tips & Instructions"}
                        </h4>
                        <p className="text-[10px] text-neutral-450 mt-0.5">
                          {isArabic ? "إضافة وتحديث النصائح الموصى بها للطلاب لتعزيز الفهم والاستيعاب" : "Manage study recommendations shown in student Services Portal"}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setEditTipId(null);
                          setTipForm({ title: "", content: "", level: "All" });
                          setShowTipForm(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{isArabic ? "إضافة نصيحة" : "Add Tip"}</span>
                      </button>
                    </div>
                  )}

                  {/* Tips List Table */}
                  <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left rtl:text-right border-collapse">
                      <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-150 text-[10px] font-bold text-neutral-450 uppercase tracking-wider">
                          <th className="p-4">{isArabic ? "العنوان" : "Title"}</th>
                          <th className="p-4">{isArabic ? "المستوى" : "Level"}</th>
                          <th className="p-4">{isArabic ? "النصيحة" : "Tip Content"}</th>
                          <th className="p-4 text-center">{isArabic ? "خيارات" : "Actions"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-150 text-xs text-neutral-700">
                        {resourcesTipsList.filter(x => x.type === "tip").length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-neutral-400">
                              {isArabic ? "لا توجد نصائح مضافة حالياً." : "No study tips added yet."}
                            </td>
                          </tr>
                        ) : (
                          resourcesTipsList.filter(x => x.type === "tip").map((item) => (
                            <tr key={item.id} className="hover:bg-neutral-50/50">
                              <td className="p-4 font-bold text-neutral-900">
                                {item.title}
                              </td>
                              <td className="p-4">
                                <span className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded font-bold">
                                  {item.level}
                                </span>
                              </td>
                              <td className="p-4 max-w-sm truncate" title={item.content}>
                                {item.content}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => {
                                      setEditTipId(item.id);
                                      setTipForm({
                                        title: item.title,
                                        content: item.content,
                                        level: item.level as any
                                      });
                                      setShowTipForm(true);
                                    }}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTip(item.id)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
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
              )}

              {/* TAB: TRAINING GAME MANAGEMENT */}
              {activeTab === "training" && (
                <TrainingAdmin isArabic={isArabic} currentTeacher={currentTeacher} />
              )}
      </div>
    </div>
  );
}
