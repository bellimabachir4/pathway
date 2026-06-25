import React, { useState, useEffect, useRef } from "react";
import { ChatMessage, Student, Teacher } from "../types";
import { getChatHistory, addChatMessage, subscribeToChat, getAllStudents } from "../lib/dbService";
import { Send, MessageSquare, User, AlertCircle, Volume2, ArrowLeft, Users, ShieldAlert } from "lucide-react";

interface ContactTeacherSectionProps {
  student: Student | null;
  teacher?: Teacher | null;
  isArabic: boolean;
  onOpenAuth: () => void;
}

export default function ContactTeacherSection({
  student,
  teacher,
  isArabic,
  onOpenAuth,
}: ContactTeacherSectionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Teacher states
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Students for the Teacher
  useEffect(() => {
    if (teacher) {
      getAllStudents(teacher.uid).then((list) => {
        setStudentsList(list);
      });
    }
  }, [teacher]);

  // 2. Subscribe to Chat history
  useEffect(() => {
    // Determine which chat ID to open
    // If student, the chat ID is student's own UID
    // If teacher, the chat ID is the selected student's UID
    const activeChatId = student ? student.uid : (selectedStudent ? selectedStudent.uid : null);

    if (!activeChatId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);

    // Fetch initial chat history
    getChatHistory(activeChatId).then((history) => {
      if (history.length === 0 && student) {
        // Seed welcoming message if empty (only for student view)
        const welcomeMsg: ChatMessage = {
          id: "welcome-system",
          senderId: "thomas-teacher",
          senderName: "Professor Thomas",
          senderRole: "teacher",
          text: isArabic
            ? `أهلاً بك يا ${student.name}! أنا سعيد برؤيتك ومستعد لمساعدتك في تعلم الإنجليزية والتحضير لاختبار IELTS. كيف يمكنني مساعدتك اليوم؟`
            : `Welcome, ${student.name}! I am delighted to tutor you and help you master English and prepare for the IELTS exam. How can I assist you today?`,
          timestamp: new Date().toISOString()
        };
        addChatMessage(activeChatId, welcomeMsg).then(() => {
          setMessages([welcomeMsg]);
          setLoading(false);
        });
      } else {
        setMessages(history);
        setLoading(false);
      }
    }).catch((err) => {
      console.error(err);
      setError(isArabic ? "فشل تحميل الرسائل." : "Failed to load chat history.");
      setLoading(false);
    });

    // Real-time listener for replies
    const unsubscribe = subscribeToChat(activeChatId, (updatedMsgs) => {
      if (updatedMsgs.length > 0) {
        setMessages(updatedMsgs);
      }
    });

    return () => unsubscribe();
  }, [student, selectedStudent, isArabic]);

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    // Check auth
    if (!student && !teacher) {
      onOpenAuth();
      return;
    }

    setError(null);
    setInput("");

    // Identify active chat id & sender info
    const activeChatId = student ? student.uid : (selectedStudent ? selectedStudent.uid : null);
    if (!activeChatId) return;

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: student ? student.uid : (teacher ? teacher.uid : "unknown"),
      senderName: student ? student.name : (teacher ? teacher.name : "Teacher"),
      senderRole: student ? "student" : "teacher",
      text: trimmed,
      timestamp: new Date().toISOString()
    };

    // Optimistically update UI
    setMessages(prev => [...prev, newMessage]);

    try {
      await addChatMessage(activeChatId, newMessage);
    } catch (err: any) {
      console.error(err);
      setError(
        isArabic
          ? "فشل إرسال الرسالة. يرجى التحقق من اتصالك بالإنترنت."
          : "Could not send your message. Please check your internet connection."
      );
    }
  };

  const handleSpeakText = (text: string) => {
    if ("speechSynthesis" in window) {
      const cleanText = text.replace(/[*_#`\-]/g, "");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "en-US";
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const formatMessageTime = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      const timeStr = date.toLocaleTimeString(isArabic ? "ar-EG" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      const dateStr = date.toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
        month: "short",
        day: "numeric",
      });
      return `${timeStr} - ${dateStr}`;
    } catch (e) {
      return "";
    }
  };

  // RENDER VISITORS (GUESTS)
  if (!student && !teacher) {
    return (
      <div className="bg-white border border-slate-200 p-8 sm:p-12 rounded-3xl text-center max-w-md mx-auto my-12 shadow-sm space-y-6" id="chat-guest-placeholder">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100">
          <MessageSquare className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="font-extrabold text-slate-850 text-lg">
            {isArabic ? "تواصل مباشر مع الأستاذ" : "Direct Chat with Teacher"}
          </h3>
          <p className="text-xs text-slate-450 leading-relaxed">
            {isArabic
              ? "يرجى تسجيل الدخول لحساب الطالب أو الأستاذ لتتمكن من التراسل وطرح الأسئلة ومتابعة المحادثات."
              : "Please log in to your student or teacher account to exchange direct messages and view active logs."}
          </p>
        </div>
        <button
          onClick={onOpenAuth}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer"
        >
          {isArabic ? "تسجيل الدخول الآن" : "Log In Now"}
        </button>
      </div>
    );
  }

  // RENDER TEACHER CHATS MANAGEMENT INTERFACE
  if (teacher) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[72vh] min-h-[500px]" id="teacher-chats-view">
        
        {/* Left Side: Registered Students List (hidden on mobile when chat is active) */}
        <div className={`md:col-span-1 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col ${
          showChatOnMobile ? "hidden md:flex" : "flex"
        }`}>
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100 shrink-0">
            <Users className="w-4 h-4 text-indigo-600" />
            <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider font-display">
              {isArabic ? "المحادثات المتاحة" : "Student Conversations"}
            </h4>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {studentsList.length === 0 ? (
              <p className="text-[11px] text-slate-400 text-center py-6">
                {isArabic ? "لا يوجد طلاب مسجلين حالياً." : "No registered students found."}
              </p>
            ) : (
              studentsList.map((stud) => {
                const isSelected = selectedStudent?.uid === stud.uid;
                return (
                  <button
                    key={stud.uid}
                    onClick={() => {
                      setSelectedStudent(stud);
                      setShowChatOnMobile(true);
                    }}
                    className={`w-full text-left rtl:text-right p-3 rounded-xl border transition-all text-xs flex flex-col gap-1 cursor-pointer ${
                      isSelected
                        ? "border-indigo-400 bg-indigo-50/30"
                        : "border-slate-150 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-bold text-slate-800 truncate block">
                        {stud.name}
                      </span>
                      <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                        {stud.level}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono truncate block">
                      {stud.email}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Active Messaging Area */}
        <div className={`md:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden h-full ${
          !showChatOnMobile ? "hidden md:flex" : "flex"
        }`}>
          {selectedStudent ? (
            <>
              {/* Chat Header */}
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setShowChatOnMobile(false)}
                    className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 md:hidden transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="text-left rtl:text-right">
                    <h4 className="font-extrabold text-neutral-900 text-sm font-display">
                      {selectedStudent.name}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {selectedStudent.email}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-bold">
                  {selectedStudent.level}
                </span>
              </div>

              {/* Messages Board */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-slate-50/30">
                {messages.length === 0 && !loading && (
                  <div className="text-center py-12 text-slate-400">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">{isArabic ? "اكتب رسالة لبدء المحادثة." : "Type a message to start conversation."}</p>
                  </div>
                )}

                {messages.map((m) => {
                  const isMe = m.senderRole === "teacher";
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-3 max-w-[85%] ${
                        isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                      } animate-fade-in`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs shrink-0 shadow-sm ${
                        isMe ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700"
                      }`}>
                        {isMe ? "T" : "S"}
                      </div>

                      <div className="space-y-1">
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed text-left rtl:text-right shadow-sm ${
                          isMe
                            ? "bg-indigo-600 text-white rounded-tr-none"
                            : "bg-white text-slate-800 rounded-tl-none border border-slate-200"
                        }`}>
                          {m.text.split("\n").map((line, idx) => (
                            <p key={idx} className="mb-1 last:mb-0">
                              {line}
                            </p>
                          ))}
                        </div>
                        
                        {/* Message Sender & DateTime */}
                        <div className="flex items-center gap-1.5 px-1 justify-start">
                          <span className="text-[9px] text-slate-400 font-bold">
                            {isMe ? teacher.name : m.senderName}
                          </span>
                          <span className="text-[8px] text-slate-400 font-mono">
                            • {formatMessageTime(m.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex gap-3 max-w-[85%] mr-auto animate-fade-in">
                    <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                      ...
                    </div>
                    <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-1 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-slate-100 bg-white shrink-0 flex gap-3 items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage(input);
                  }}
                  placeholder={isArabic ? "اكتب ردك هنا..." : "Type your response here..."}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  id="teacher-chat-input"
                />

                <button
                  onClick={() => handleSendMessage(input)}
                  disabled={!input.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                  id="teacher-send-msg-btn"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-24 text-slate-400 flex flex-col justify-center items-center h-full space-y-4">
              <div className="w-16 h-16 bg-slate-50 text-slate-350 rounded-2xl flex items-center justify-center border border-slate-100">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-700">
                  {isArabic ? "محادثات الطلاب" : "Student Messaging Center"}
                </h4>
                <p className="text-xs text-slate-400 max-w-xs leading-normal">
                  {isArabic
                    ? "الرجاء تحديد أحد الطلاب من القائمة الجانبية لبدء المراسلة الفورية وحل مشكلاته."
                    : "Select a student from the sidebar to review logs and engage in real-time communication."}
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    );
  }

  // RENDER STUDENT CHAT (DIRECT CHAT WITH TEACHER, FULL WIDTH)
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden h-[72vh] min-h-[500px]" id="student-chat-view">
      {/* Chat Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="text-left rtl:text-right">
            <h4 className="font-extrabold text-neutral-900 text-sm font-display">
              {isArabic ? "محادثة الأستاذ توماس" : "Chat with Professor Thomas"}
            </h4>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              {isArabic ? "متصل ومستعد للمساعدة" : "Online & ready to tutor"}
            </span>
          </div>
        </div>

        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-bold uppercase">
          {student.level}
        </span>
      </div>

      {/* Messages List */}
      <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-slate-50/30">
        {messages.map((m) => {
          const isMe = m.senderRole === "student";
          return (
            <div
              key={m.id}
              className={`flex gap-3 max-w-[85%] ${
                isMe ? "ml-auto flex-row-reverse" : "mr-auto"
              } animate-fade-in`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${
                isMe ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                {isMe ? <User className="w-4 h-4" /> : "PT"}
              </div>

              {/* Bubble */}
              <div className="space-y-1">
                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed text-left rtl:text-right shadow-sm ${
                  isMe
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-white text-slate-800 rounded-tl-none border border-slate-200"
                }`}>
                  {m.text.split("\n").map((line, idx) => (
                    <p key={idx} className="mb-1 last:mb-0">
                      {line}
                    </p>
                  ))}
                </div>
                
                {/* Meta block containing name, date and time */}
                <div className="flex items-center gap-1.5 px-1 justify-start">
                  <span className="text-[9px] text-slate-400 font-bold">
                    {isMe ? student.name : m.senderName}
                  </span>
                  <span className="text-[8px] text-slate-400 font-mono">
                    • {formatMessageTime(m.timestamp)}
                  </span>
                  
                  {/* TTS Voice for Teacher */}
                  {!isMe && (
                    <button
                      onClick={() => handleSpeakText(m.text)}
                      className="text-[9px] text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 ml-2 cursor-pointer font-bold"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>{isArabic ? "استمع" : "Listen"}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 max-w-[85%] mr-auto animate-fade-in">
            <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
              PT
            </div>
            <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 p-3 rounded-xl text-xs text-red-800 max-w-sm mx-auto shadow-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="p-4 border-t border-slate-100 bg-white shrink-0 flex gap-3 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendMessage(input);
          }}
          placeholder={isArabic ? "اكتب سؤالك للأستاذ هنا..." : "Type your English question here..."}
          disabled={loading}
          className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:bg-slate-50"
          id="chat-input-field"
        />

        <button
          onClick={() => handleSendMessage(input)}
          disabled={loading || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
          id="send-chat-msg-btn"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
