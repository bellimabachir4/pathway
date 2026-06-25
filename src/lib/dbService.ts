import { 
  db, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  orderBy,
  limit 
} from "./firebase";
import { Student, Teacher, Lesson, Vocabulary, LiveSession, ChatMessage, Announcement, DailyTask, WeeklyTask } from "../types";
import { defaultLessons, defaultVocabulary, defaultLiveSessions } from "./defaultData";

// Local storage keys as backup/cache
const KEYS = {
  STUDENT: "ep_student_profile",
  TEACHERS: "ep_teachers_list",
  LESSONS: "ep_lessons_list",
  VOCAB: "ep_vocab_list",
  LIVES: "ep_live_sessions",
  CHATS: "ep_chats_history",
  CURRENT_TEACHER: "ep_current_teacher"
};

// HELPER: Get local or default
function getLocal<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocal<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Local storage set failed", e);
  }
}

// ================= RESOLVE TEACHER HELPERS =================
export async function resolveTeacherId(providedId?: string): Promise<string> {
  const tid = providedId || "teacher-thomas";
  if (tid !== "teacher-thomas") {
    return tid;
  }
  const teachers = await getTeachers();
  if (teachers.length > 0) {
    return teachers[0].uid;
  }
  return "teacher-thomas";
}

// ================= STUDENTS SERVICE =================
export async function saveStudentProfile(student: Student, teacherId?: string): Promise<void> {
  const tid = await resolveTeacherId(teacherId);
  setLocal(KEYS.STUDENT, student);
  setLocal(`ep_student_profile_${student.uid}`, student);
  
  if (db) {
    try {
      // 1. Save globally
      const studentRef = doc(db, "students", student.uid);
      await setDoc(studentRef, {
        ...student,
        lastActive: new Date().toISOString()
      }, { merge: true });

      // 2. Save under teacher
      const teacherStudentRef = doc(db, "teachers", tid, "students", student.uid);
      await setDoc(teacherStudentRef, {
        ...student,
        lastActive: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn("Firestore saveStudentProfile failed, using cache:", e);
    }
  }
}

export async function getStudentProfile(uid: string, defaultName?: string, defaultEmail?: string, teacherId?: string): Promise<Student> {
  const tid = await resolveTeacherId(teacherId);
  const cached = getLocal<Student | null>(`ep_student_profile_${uid}`, null) || getLocal<Student | null>(KEYS.STUDENT, null);
  if (cached && cached.uid === uid) {
    return cached;
  }

  const defaultProfile: Student = {
    uid,
    name: defaultName || "Student",
    email: defaultEmail || "student@example.com",
    level: "A1",
    progress: 0,
    completedLessons: [],
    savedWords: [],
    dailyStreak: 1,
    lastActive: new Date().toISOString(),
    points: 0,
    registrationDate: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };

  if (db) {
    try {
      // Try teacher student first, fallback to global student
      const teacherStudentRef = doc(db, "teachers", tid, "students", uid);
      let snap = await getDoc(teacherStudentRef);
      if (!snap.exists()) {
        const studentRef = doc(db, "students", uid);
        snap = await getDoc(studentRef);
      }
      
      if (snap.exists()) {
        const data = {
          ...snap.data() as Student,
          lastLogin: new Date().toISOString(),
          lastActive: new Date().toISOString()
        };
        // Keep the level consistent or fallback to default
        if (data.level === "Beginner" as any) {
          data.level = "A1";
        }
        try {
          await setDoc(doc(db, "students", uid), data, { merge: true });
          await setDoc(teacherStudentRef, data, { merge: true });
        } catch {}
        setLocal(`ep_student_profile_${uid}`, data);
        setLocal(KEYS.STUDENT, data);
        return data;
      } else {
        await setDoc(doc(db, "students", uid), defaultProfile);
        await setDoc(teacherStudentRef, defaultProfile);
        setLocal(`ep_student_profile_${uid}`, defaultProfile);
        setLocal(KEYS.STUDENT, defaultProfile);
        return defaultProfile;
      }
    } catch (e) {
      console.warn("Firestore getStudentProfile failed, using default/cached:", e);
    }
  }

  setLocal(KEYS.STUDENT, defaultProfile);
  return defaultProfile;
}

export async function getAllStudents(teacherId?: string): Promise<Student[]> {
  const tid = await resolveTeacherId(teacherId);
  const localKey = `ep_students_list_${tid}`;
  const cached = getLocal<Student[]>(localKey, []);

  if (db) {
    try {
      const q = query(collection(db, "teachers", tid, "students"));
      const snap = await getDocs(q);
      const list: Student[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as Student);
      });
      if (list.length > 0) {
        setLocal(localKey, list);
        return list;
      }
    } catch (e) {
      console.warn("Firestore getAllStudents failed, fallback to global or mock:", e);
      // Fallback: try global students list
      try {
        const qGlobal = query(collection(db, "students"));
        const snapGlobal = await getDocs(qGlobal);
        const listGlobal: Student[] = [];
        snapGlobal.forEach((docSnap) => {
          listGlobal.push(docSnap.data() as Student);
        });
        if (listGlobal.length > 0) {
          setLocal(localKey, listGlobal);
          return listGlobal;
        }
      } catch {}
    }
  }

  if (cached && cached.length > 0) {
    return cached;
  }

  // Return dummy student list for preview if offline/empty
  const dummyList: Student[] = [
    {
      uid: "dummy-1",
      name: "أحمد العتيبي (Ahmed)",
      email: "ahmed@example.com",
      level: "B1",
      progress: 65,
      completedLessons: ["grammar-1"],
      savedWords: ["vocab-1", "vocab-2"],
      dailyStreak: 5,
      lastActive: new Date().toISOString(),
      points: 120
    },
    {
      uid: "dummy-2",
      name: "سارة خالد (Sarah)",
      email: "sarah@example.com",
      level: "A1",
      progress: 33,
      completedLessons: [],
      savedWords: ["vocab-3"],
      dailyStreak: 2,
      lastActive: new Date(Date.now() - 3600000).toISOString(),
      points: 40
    }
  ];
  setLocal(localKey, dummyList);
  return dummyList;
}

export async function updateStudent(student: Student, teacherId?: string): Promise<void> {
  const tid = await resolveTeacherId(teacherId);
  const localKey = `ep_students_list_${tid}`;
  const current = getLocal<Student[]>(localKey, []);
  const index = current.findIndex(s => s.uid === student.uid);
  if (index > -1) {
    current[index] = student;
  } else {
    current.push(student);
  }
  setLocal(localKey, current);
  
  // Also update individual cached student
  setLocal(`ep_student_profile_${student.uid}`, student);
  setLocal(KEYS.STUDENT, student);

  if (db) {
    try {
      const studentRef = doc(db, "students", student.uid);
      await setDoc(studentRef, student, { merge: true });

      const teacherStudentRef = doc(db, "teachers", tid, "students", student.uid);
      await setDoc(teacherStudentRef, student, { merge: true });
    } catch (e) {
      console.warn("Firestore updateStudent failed:", e);
    }
  }
}

export async function deleteStudent(uid: string, teacherId?: string): Promise<void> {
  const tid = await resolveTeacherId(teacherId);
  const localKey = `ep_students_list_${tid}`;
  const current = getLocal<Student[]>(localKey, []);
  const filtered = current.filter(s => s.uid !== uid);
  setLocal(localKey, filtered);
  
  // Clear local storage profiles for this student
  localStorage.removeItem(`ep_student_profile_${uid}`);
  const cachedStudent = getLocal<Student | null>(KEYS.STUDENT, null);
  if (cachedStudent && cachedStudent.uid === uid) {
    localStorage.removeItem(KEYS.STUDENT);
  }

  if (db) {
    try {
      await deleteDoc(doc(db, "students", uid));
      await deleteDoc(doc(db, "teachers", tid, "students", uid));
    } catch (e) {
      console.warn("Firestore deleteStudent failed:", e);
    }
  }
}

// ================= TEACHERS SERVICE =================
export async function getTeachers(): Promise<Teacher[]> {
  const localList = getLocal<Teacher[]>(KEYS.TEACHERS, []);
  if (db) {
    try {
      const snap = await getDocs(collection(db, "teachers"));
      const list: Teacher[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as Teacher);
      });
      
      if (list.length === 0) {
        const defaults: Teacher[] = [
          {
            uid: "teacher-thomas",
            name: "Professor Thomas",
            email: "thomas@pathwayacademy.com",
            photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
            loginCode: "123456",
            createdAt: new Date().toISOString()
          },
          {
            uid: "teacher-sarah",
            name: "Professor Sarah",
            email: "sarah@pathwayacademy.com",
            photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
            loginCode: "123456",
            createdAt: new Date().toISOString()
          },
          {
            uid: "teacher-james",
            name: "Professor James",
            email: "james@pathwayacademy.com",
            photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
            loginCode: "123456",
            createdAt: new Date().toISOString()
          }
        ];
        for (const t of defaults) {
          await setDoc(doc(db, "teachers", t.uid), t);
          // Seed initial collections
          for (const l of defaultLessons) {
            await setDoc(doc(db, "teachers", t.uid, "lessons", l.id), l);
          }
          for (const v of defaultVocabulary) {
            await setDoc(doc(db, "teachers", t.uid, "vocabulary", v.id), v);
          }
          for (const s of defaultLiveSessions) {
            await setDoc(doc(db, "teachers", t.uid, "liveSessions", s.id), s);
          }
        }
        setLocal(KEYS.TEACHERS, defaults);
        return defaults;
      }
      
      setLocal(KEYS.TEACHERS, list);
      return list;
    } catch (e) {
      console.warn("Firestore getTeachers failed, using local list:", e);
    }
  }
  return localList;
}

export async function addTeacher(teacher: Teacher): Promise<void> {
  const current = await getTeachers();
  const updated = [...current, teacher];
  setLocal(KEYS.TEACHERS, updated);

  if (db) {
    try {
      await setDoc(doc(db, "teachers", teacher.uid), teacher);
      // Automatically copy default curriculum data to the new teacher's subcollections so they start with full content!
      for (const l of defaultLessons) {
        await setDoc(doc(db, "teachers", teacher.uid, "lessons", l.id), l);
      }
      for (const v of defaultVocabulary) {
        await setDoc(doc(db, "teachers", teacher.uid, "vocabulary", v.id), v);
      }
      for (const s of defaultLiveSessions) {
        await setDoc(doc(db, "teachers", teacher.uid, "liveSessions", s.id), s);
      }
    } catch (e) {
      console.warn("Firestore addTeacher failed:", e);
    }
  }
}

export async function updateTeacher(teacher: Teacher): Promise<void> {
  const current = await getTeachers();
  const updated = current.map(t => t.uid === teacher.uid ? teacher : t);
  setLocal(KEYS.TEACHERS, updated);

  if (db) {
    try {
      await setDoc(doc(db, "teachers", teacher.uid), teacher, { merge: true });
    } catch (e) {
      console.warn("Firestore updateTeacher failed:", e);
    }
  }
}

export async function deleteTeacher(uid: string): Promise<void> {
  const current = await getTeachers();
  const updated = current.filter(t => t.uid !== uid);
  setLocal(KEYS.TEACHERS, updated);

  if (db) {
    try {
      await deleteDoc(doc(db, "teachers", uid));
    } catch (e) {
      console.warn("Firestore deleteTeacher failed:", e);
    }
  }
}

export async function clearAllTeachers(): Promise<void> {
  setLocal(KEYS.TEACHERS, []);
  localStorage.removeItem(KEYS.CURRENT_TEACHER);
  if (db) {
    try {
      const snap = await getDocs(collection(db, "teachers"));
      for (const d of snap.docs) {
        // Clear subcollections
        try {
          const lessonsSnap = await getDocs(collection(db, "teachers", d.id, "lessons"));
          for (const lDoc of lessonsSnap.docs) {
            await deleteDoc(doc(db, "teachers", d.id, "lessons", lDoc.id));
          }
          const vocabSnap = await getDocs(collection(db, "teachers", d.id, "vocabulary"));
          for (const vDoc of vocabSnap.docs) {
            await deleteDoc(doc(db, "teachers", d.id, "vocabulary", vDoc.id));
          }
          const liveSnap = await getDocs(collection(db, "teachers", d.id, "liveSessions"));
          for (const sDoc of liveSnap.docs) {
            await deleteDoc(doc(db, "teachers", d.id, "liveSessions", sDoc.id));
          }
          const studentsSnap = await getDocs(collection(db, "teachers", d.id, "students"));
          for (const sDoc of studentsSnap.docs) {
            await deleteDoc(doc(db, "teachers", d.id, "students", sDoc.id));
          }
        } catch {}
        await deleteDoc(doc(db, "teachers", d.id));
      }
    } catch (e) {
      console.error("Failed to clear teachers in Firestore", e);
    }
  }
}

// ================= LESSONS SERVICE =================
export async function getLessons(teacherId?: string): Promise<Lesson[]> {
  const tid = await resolveTeacherId(teacherId);
  const localKey = `ep_lessons_list_${tid}`;
  const localList = getLocal<Lesson[]>(localKey, []);
  
  if (db) {
    try {
      const snap = await getDocs(collection(db, "teachers", tid, "lessons"));
      const list: Lesson[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as Lesson);
      });
      if (list.length > 0) {
        setLocal(localKey, list);
        return list;
      }
    } catch (e) {
      console.warn("Firestore getLessons failed, using local:", e);
    }
  }

  if (localList.length === 0) {
    setLocal(localKey, defaultLessons);
    return defaultLessons;
  }
  return localList;
}

export async function saveLesson(lesson: Lesson, teacherId?: string): Promise<void> {
  const tid = await resolveTeacherId(teacherId);
  const localKey = `ep_lessons_list_${tid}`;
  const current = await getLessons(tid);
  const index = current.findIndex(l => l.id === lesson.id);
  if (index > -1) {
    current[index] = lesson;
  } else {
    current.push(lesson);
  }
  setLocal(localKey, current);

  if (db) {
    try {
      await setDoc(doc(db, "teachers", tid, "lessons", lesson.id), lesson);
    } catch (e) {
      console.warn("Firestore saveLesson failed:", e);
    }
  }
}

export async function deleteLesson(id: string, teacherId?: string): Promise<void> {
  const tid = await resolveTeacherId(teacherId);
  const localKey = `ep_lessons_list_${tid}`;
  const current = await getLessons(tid);
  const filtered = current.filter(l => l.id !== id);
  setLocal(localKey, filtered);

  if (db) {
    try {
      await deleteDoc(doc(db, "teachers", tid, "lessons", id));
    } catch (e) {
      console.warn("Firestore deleteLesson failed:", e);
    }
  }
}


// ================= VOCABULARY SERVICE =================
export async function getVocabulary(teacherId?: string): Promise<Vocabulary[]> {
  const tid = teacherId || "teacher-thomas";
  const localKey = `ep_vocab_list_${tid}`;
  const localList = getLocal<Vocabulary[]>(localKey, []);
  
  if (db) {
    try {
      const snap = await getDocs(collection(db, "teachers", tid, "vocabulary"));
      const list: Vocabulary[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as Vocabulary);
      });
      if (list.length > 0) {
        setLocal(localKey, list);
        return list;
      }
    } catch (e) {
      console.warn("Firestore getVocabulary failed, using local:", e);
    }
  }

  if (localList.length === 0) {
    setLocal(localKey, defaultVocabulary);
    return defaultVocabulary;
  }
  return localList;
}

export async function saveVocabulary(word: Vocabulary, teacherId?: string): Promise<void> {
  const tid = teacherId || "teacher-thomas";
  const localKey = `ep_vocab_list_${tid}`;
  const current = await getVocabulary(tid);
  const index = current.findIndex(w => w.id === word.id);
  if (index > -1) {
    current[index] = word;
  } else {
    current.push(word);
  }
  setLocal(localKey, current);

  if (db) {
    try {
      await setDoc(doc(db, "teachers", tid, "vocabulary", word.id), word);
    } catch (e) {
      console.warn("Firestore saveVocabulary failed:", e);
    }
  }
}

export async function deleteVocabulary(id: string, teacherId?: string): Promise<void> {
  const tid = teacherId || "teacher-thomas";
  const localKey = `ep_vocab_list_${tid}`;
  const current = await getVocabulary(tid);
  const filtered = current.filter(w => w.id !== id);
  setLocal(localKey, filtered);

  if (db) {
    try {
      await deleteDoc(doc(db, "teachers", tid, "vocabulary", id));
    } catch (e) {
      console.warn("Firestore deleteVocabulary failed:", e);
    }
  }
}


// ================= LIVE SESSIONS SERVICE =================
export async function getLiveSessions(teacherId?: string): Promise<LiveSession[]> {
  const tid = teacherId || "teacher-thomas";
  const localKey = `ep_live_sessions_${tid}`;
  const localList = getLocal<LiveSession[]>(localKey, []);
  
  if (db) {
    try {
      const snap = await getDocs(collection(db, "teachers", tid, "liveSessions"));
      const list: LiveSession[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as LiveSession);
      });
      if (list.length > 0) {
        setLocal(localKey, list);
        return list;
      }
    } catch (e) {
      console.warn("Firestore getLiveSessions failed, using local:", e);
    }
  }

  if (localList.length === 0) {
    setLocal(localKey, defaultLiveSessions);
    return defaultLiveSessions;
  }
  return localList;
}

export async function saveLiveSession(session: LiveSession, teacherId?: string): Promise<void> {
  const tid = teacherId || "teacher-thomas";
  const localKey = `ep_live_sessions_${tid}`;
  const current = await getLiveSessions(tid);
  const index = current.findIndex(s => s.id === session.id);
  if (index > -1) {
    current[index] = session;
  } else {
    current.push(session);
  }
  setLocal(localKey, current);

  if (db) {
    try {
      await setDoc(doc(db, "teachers", tid, "liveSessions", session.id), session);
    } catch (e) {
      console.warn("Firestore saveLiveSession failed:", e);
    }
  }
}

export async function deleteLiveSession(id: string, teacherId?: string): Promise<void> {
  const tid = teacherId || "teacher-thomas";
  const localKey = `ep_live_sessions_${tid}`;
  const current = await getLiveSessions(tid);
  const filtered = current.filter(s => s.id !== id);
  setLocal(localKey, filtered);

  if (db) {
    try {
      await deleteDoc(doc(db, "teachers", tid, "liveSessions", id));
    } catch (e) {
      console.warn("Firestore deleteLiveSession failed:", e);
    }
  }
}


// ================= CHAT MESSAGES SERVICE =================
export async function getChatHistory(chatId: string): Promise<ChatMessage[]> {
  const localKey = `${KEYS.CHATS}_${chatId}`;
  const localList = getLocal<ChatMessage[]>(localKey, []);

  if (db) {
    try {
      const q = query(
        collection(db, "chats", chatId, "messages"),
        orderBy("timestamp", "asc")
      );
      const snap = await getDocs(q);
      const list: ChatMessage[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as ChatMessage);
      });
      if (list.length > 0) {
        setLocal(localKey, list);
        return list;
      }
    } catch (e) {
      console.warn("Firestore getChatHistory failed, using local:", e);
    }
  }

  return localList;
}

export async function addChatMessage(chatId: string, msg: ChatMessage): Promise<void> {
  const localKey = `${KEYS.CHATS}_${chatId}`;
  const current = getLocal<ChatMessage[]>(localKey, []);
  current.push(msg);
  setLocal(localKey, current);

  if (db) {
    try {
      const msgRef = doc(db, "chats", chatId, "messages", msg.id);
      await setDoc(msgRef, msg);
    } catch (e) {
      console.warn("Firestore addChatMessage failed:", e);
    }
  }
}

export function subscribeToChat(chatId: string, callback: (msgs: ChatMessage[]) => void) {
  const localKey = `${KEYS.CHATS}_${chatId}`;
  if (db) {
    try {
      const q = query(
        collection(db, "chats", chatId, "messages"),
        orderBy("timestamp", "asc")
      );
      return onSnapshot(q, (snap) => {
        const list: ChatMessage[] = [];
        snap.forEach((docSnap) => {
          list.push(docSnap.data() as ChatMessage);
        });
        if (list.length > 0) {
          setLocal(localKey, list);
          callback(list);
        }
      }, (err) => {
        console.warn("Firestore subscription error, using local polling:", err);
        callback(getLocal<ChatMessage[]>(localKey, []));
      });
    } catch (e) {
      console.warn("Firestore subscribeToChat failed:", e);
    }
  }
  
  // Fallback direct execution
  callback(getLocal<ChatMessage[]>(localKey, []));
  return () => {};
}

// ================= ANNOUNCEMENTS SERVICE =================
export async function getAnnouncements(): Promise<Announcement[]> {
  const localKey = "ep_announcements_list";
  const localList = getLocal<Announcement[]>(localKey, []);
  if (db) {
    try {
      const snap = await getDocs(collection(db, "announcements"));
      const list: Announcement[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as Announcement);
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLocal(localKey, list);
      return list;
    } catch (e) {
      console.warn("Firestore getAnnouncements failed, using local list:", e);
    }
  }
  return localList;
}

export async function saveAnnouncement(announcement: Announcement): Promise<void> {
  const localKey = "ep_announcements_list";
  const current = getLocal<Announcement[]>(localKey, []);
  const updated = [announcement, ...current.filter(a => a.id !== announcement.id)];
  setLocal(localKey, updated);

  if (db) {
    try {
      await setDoc(doc(db, "announcements", announcement.id), announcement);
    } catch (e) {
      console.warn("Firestore saveAnnouncement failed:", e);
    }
  }
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const localKey = "ep_announcements_list";
  const current = getLocal<Announcement[]>(localKey, []);
  const updated = current.filter(a => a.id !== id);
  setLocal(localKey, updated);

  if (db) {
    try {
      await deleteDoc(doc(db, "announcements", id));
    } catch (e) {
      console.warn("Firestore deleteAnnouncement failed:", e);
    }
  }
}

// ================= SEED DEFAULTS FOR TASKS =================
const defaultDailyTasks = (studentId: string): DailyTask[] => [
  {
    id: `dt_vocab_${studentId}`,
    studentId,
    title: "Complete today's vocabulary quiz",
    titleAr: "أكمل اختبار المفردات اليومي",
    completed: false,
    date: new Date().toISOString().split("T")[0],
    createdAt: new Date().toISOString()
  },
  {
    id: `dt_lesson_${studentId}`,
    studentId,
    title: "Read a lesson explanation",
    titleAr: "اقرأ شرح أحد الدروس للتأسيس",
    completed: false,
    date: new Date().toISOString().split("T")[0],
    createdAt: new Date().toISOString()
  },
  {
    id: `dt_chat_${studentId}`,
    studentId,
    title: "Practice writing with Professor Thomas",
    titleAr: "تدرب على الكتابة بالتحدث مع الأستاذ توماس",
    completed: false,
    date: new Date().toISOString().split("T")[0],
    createdAt: new Date().toISOString()
  }
];

const defaultWeeklyTasks = (studentId: string): WeeklyTask[] => [
  {
    id: `wt_1_${studentId}`,
    studentId,
    title: "Complete at least 3 grammar lessons",
    titleAr: "أكمل 3 دروس قواعد على الأقل",
    completed: false,
    weekLabel: "Week 1: grammar" ,
    createdAt: new Date().toISOString()
  },
  {
    id: `wt_2_${studentId}`,
    studentId,
    title: "Save 10 new vocabulary words",
    titleAr: "احفظ 10 كلمات ومصطلحات جديدة",
    completed: false,
    weekLabel: "Week 1: grammar",
    createdAt: new Date().toISOString()
  },
  {
    id: `wt_3_${studentId}`,
    studentId,
    title: "Attend the interactive live seminar",
    titleAr: "احضر الندوة الأسبوعية المباشرة",
    completed: false,
    weekLabel: "Week 1: grammar",
    createdAt: new Date().toISOString()
  },
  {
    id: `wt_4_${studentId}`,
    studentId,
    title: "Have a chat session of 5+ messages with the AI Teacher",
    titleAr: "أجرِ محادثة من 5 رسائل أو أكثر مع المعلم الذكي",
    completed: false,
    weekLabel: "Week 1: grammar",
    createdAt: new Date().toISOString()
  }
];

// ================= DAILY TASKS SERVICE =================
export async function getDailyTasks(studentId: string): Promise<DailyTask[]> {
  const localKey = `ep_daily_tasks_${studentId}`;
  const todayStr = new Date().toISOString().split("T")[0];
  let localList = getLocal<DailyTask[]>(localKey, []);

  // Filter or initialize for today
  if (localList.length === 0 || localList[0].date !== todayStr) {
    localList = defaultDailyTasks(studentId);
    setLocal(localKey, localList);
  }

  if (db) {
    try {
      const q = query(
        collection(db, "students", studentId, "daily_tasks")
      );
      const snap = await getDocs(q);
      const list: DailyTask[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as DailyTask);
      });
      
      if (list.length > 0) {
        setLocal(localKey, list);
        return list;
      } else {
        // Seed to firestore if empty
        for (const t of localList) {
          await setDoc(doc(db, "students", studentId, "daily_tasks", t.id), t);
        }
      }
    } catch (e) {
      console.warn("Firestore getDailyTasks failed, using local:", e);
    }
  }
  return localList;
}

export async function saveDailyTask(studentId: string, task: DailyTask): Promise<void> {
  const localKey = `ep_daily_tasks_${studentId}`;
  const current = getLocal<DailyTask[]>(localKey, []);
  const updated = current.some(t => t.id === task.id) 
    ? current.map(t => t.id === task.id ? task : t)
    : [...current, task];
  setLocal(localKey, updated);

  if (db) {
    try {
      await setDoc(doc(db, "students", studentId, "daily_tasks", task.id), task);
    } catch (e) {
      console.warn("Firestore saveDailyTask failed:", e);
    }
  }
}

export async function deleteDailyTask(studentId: string, taskId: string): Promise<void> {
  const localKey = `ep_daily_tasks_${studentId}`;
  const current = getLocal<DailyTask[]>(localKey, []);
  const updated = current.filter(t => t.id !== taskId);
  setLocal(localKey, updated);

  if (db) {
    try {
      await deleteDoc(doc(db, "students", studentId, "daily_tasks", taskId));
    } catch (e) {
      console.warn("Firestore deleteDailyTask failed:", e);
    }
  }
}

// ================= WEEKLY TASKS SERVICE =================
export async function getWeeklyTasks(studentId: string): Promise<WeeklyTask[]> {
  const localKey = `ep_weekly_tasks_${studentId}`;
  let localList = getLocal<WeeklyTask[]>(localKey, []);

  if (localList.length === 0) {
    localList = defaultWeeklyTasks(studentId);
    setLocal(localKey, localList);
  }

  if (db) {
    try {
      const q = query(
        collection(db, "students", studentId, "weekly_tasks")
      );
      const snap = await getDocs(q);
      const list: WeeklyTask[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as WeeklyTask);
      });
      
      if (list.length > 0) {
        setLocal(localKey, list);
        return list;
      } else {
        // Seed
        for (const t of localList) {
          await setDoc(doc(db, "students", studentId, "weekly_tasks", t.id), t);
        }
      }
    } catch (e) {
      console.warn("Firestore getWeeklyTasks failed, using local:", e);
    }
  }
  return localList;
}

export async function saveWeeklyTask(studentId: string, task: WeeklyTask): Promise<void> {
  const localKey = `ep_weekly_tasks_${studentId}`;
  const current = getLocal<WeeklyTask[]>(localKey, []);
  const updated = current.some(t => t.id === task.id)
    ? current.map(t => t.id === task.id ? task : t)
    : [...current, task];
  setLocal(localKey, updated);

  if (db) {
    try {
      await setDoc(doc(db, "students", studentId, "weekly_tasks", task.id), task);
    } catch (e) {
      console.warn("Firestore saveWeeklyTask failed:", e);
    }
  }
}

export async function deleteWeeklyTask(studentId: string, taskId: string): Promise<void> {
  const localKey = `ep_weekly_tasks_${studentId}`;
  const current = getLocal<WeeklyTask[]>(localKey, []);
  const updated = current.filter(t => t.id !== taskId);
  setLocal(localKey, updated);

  if (db) {
    try {
      await deleteDoc(doc(db, "students", studentId, "weekly_tasks", taskId));
    } catch (e) {
      console.warn("Firestore deleteWeeklyTask failed:", e);
    }
  }
}
