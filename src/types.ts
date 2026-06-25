export interface Student {
  uid: string;
  name: string;
  email: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  progress: number; // 0-100
  completedLessons: string[]; // array of lesson IDs
  savedWords: string[]; // array of word IDs
  dailyStreak: number;
  lastActive: string; // ISO date
  points: number;
  isDisabled?: boolean;
  selectedLanguage?: string;
  selectedLevelCode?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  selectedTeacherId?: string;
  selectedTeacherName?: string;
  registrationDate?: string;
  lastLogin?: string;
  unlockedLevels?: ("A1" | "A2" | "B1" | "B2" | "C1" | "C2")[];
}

export interface Teacher {
  uid: string;
  name: string;
  email: string;
  photoUrl: string;
  loginCode?: string;
  createdAt: string; // ISO string
  isDisabled?: boolean;
}

export interface QuizQuestion {
  question: string;
  type?: "multiple" | "true_false" | "fill_blank";
  options?: string[];
  correctAnswer: number | string; // index of correct option or string for fill-in-the-blanks
}

export interface Lesson {
  id: string;
  title: string;
  titleAr: string;
  category: "grammar" | "vocabulary" | "reading" | "writing" | "listening" | "speaking" | "pronunciation";
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  content: string; // Markdown English
  contentAr: string; // Markdown Arabic
  quiz: QuizQuestion[];
  createdAt: string;
  videoUrl?: string;
  imageUrl?: string;
  order?: number;
  attachedLinks?: { title: string; url: string; }[];
}

export interface Vocabulary {
  id: string;
  word: string;
  translation: string;
  definition: string;
  definitionAr: string;
  example: string;
  category: "daily" | "academic" | "common" | "phrasal";
  level?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  createdAt: string;
}

export interface LiveSession {
  id: string;
  title: string;
  description: string;
  date: string; // e.g. "2026-06-25"
  time: string; // e.g. "18:00"
  link: string;
  status: "upcoming" | "live" | "completed";
  teacherName: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "student" | "teacher" | "ai";
  text: string;
  timestamp: string; // ISO date
}

export interface Announcement {
  id: string;
  teacherId: string;
  teacherName: string;
  title: string;
  content: string;
  targetStudentIds: string[]; // empty or ["all"] means all students, otherwise specific student uids
  createdAt: string; // ISO date
}

export interface DailyTask {
  id: string;
  studentId: string;
  title: string;
  titleAr: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export interface WeeklyTask {
  id: string;
  studentId: string;
  title: string;
  titleAr: string;
  completed: boolean;
  weekLabel: string; // e.g., "Week 1: grammar" or "الأسبوع الأول"
  createdAt: string;
}
