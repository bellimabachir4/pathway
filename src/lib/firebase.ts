import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User
} from "firebase/auth";
import { 
  getFirestore, 
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
  limit,
  initializeFirestore
} from "firebase/firestore";

// Config from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyCnJ5ix-YDiphk6cU0Q2lsCgqV5UOA5GOE",
  authDomain: "impressive-sorter-wmjvc.firebaseapp.com",
  projectId: "impressive-sorter-wmjvc",
  storageBucket: "impressive-sorter-wmjvc.firebasestorage.app",
  messagingSenderId: "148093045031",
  appId: "1:148093045031:web:df510a7167854887064102"
};

// Initialize Firebase App
let app;
let auth: any;
let db: any;

try {
  app = initializeApp(firebaseConfig);
  // Specify custom firestoreDatabaseId as the third argument of initializeFirestore
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true, // helpful in sandboxed iframe environments to bypass gRPC blocks
  }, "ai-studio-e20516c0-5491-4cbc-b1f8-9e2afb1a097e");
  auth = getAuth(app);
} catch (error) {
  console.error("Firebase initialization failed, using fallback:", error);
}

export { auth, db, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged };
export { 
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
};
