import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Create Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: AI Teacher Chat
  app.post("/api/chat-teacher", async (req, res) => {
    try {
      const { messages, studentName, studentLevel, isArabic } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required." });
      }

      // We will take up to the last 15 messages for context
      const chatContext = messages.slice(-15).map((m: any) => {
        const role = m.senderRole === "student" ? "user" : "model";
        return {
          role,
          parts: [{ text: m.text }],
        };
      });

      const systemInstruction = `You are "Professor Thomas", a friendly, warm, and highly professional native English teacher on "English Pathway" platform.
Your student is named ${studentName || "Student"} and is at the ${studentLevel || "Beginner"} level.
Your goals:
1. Reply in a friendly, encouraging, and supportive tone.
2. ALWAYS adapt your vocabulary and complexity of language to the student's level (${studentLevel || "Beginner"}).
   - If they are Beginner, use very simple, short sentences.
   - If they are Intermediate, use natural but clear sentences, introducing occasional idioms or phrasal verbs.
   - If they are Advanced, engage in mature, expressive discussions, using natural phrasing and advanced vocabulary.
3. If the student makes any grammatical, spelling, or structural mistakes in English, GENTLY correct them at the end of your message in a constructive "Grammar Tip / نصيحة قواعدية" section.
4. Keep your response brief and interactive. End with an engaging question to keep the conversation going.
5. If the user asks in Arabic or needs Arabic explanations, you can provide bilingual support (Arabic and English) to help them understand better, but encourage them to practice English!
6. Make sure your response is formatted beautifully with paragraphs or bullet points for readability.`;

      // Call Gemini API
      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: chatContext.length > 0 ? chatContext : [{ role: "user", parts: [{ text: "Hello, Professor! Let's start learning." }] }],
        config: {
          systemInstruction,
          temperature: 0.7,
          maxOutputTokens: 800,
        },
      });

      const responseText = result.text || "I'm sorry, I couldn't process that. Let's try again!";
      res.json({ text: responseText });
    } catch (error: any) {
      console.error("Gemini Chat API Error:", error);
      res.status(500).json({ error: "Failed to communicate with AI Teacher. " + (error.message || "") });
    }
  });

  // Serve static files / Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
