import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCjgfJnxaVl3Oi4xy7lpbhRkUbV-K1DWAA",
  authDomain: "student-dropout-system-67dc7.firebaseapp.com",
  projectId: "student-dropout-system-67dc7",
  storageBucket: "student-dropout-system-67dc7.firebasestorage.app",
  messagingSenderId: "536352987857",
  appId: "1:536352987857:web:226b218b4a1700a1bb83f0",
  measurementId: "G-T3Y34R8M48"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Optional: Initialize analytics safely (only in browser environment)
// const analytics = getAnalytics(app);

export { app, auth, db };
