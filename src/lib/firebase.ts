import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyCZFiSLAGIfvWMs0gLHtcdGAA9KNWVKGCU",
  authDomain: "decaapp-83e57.firebaseapp.com",
  projectId: "decaapp-83e57",
  storageBucket: "decaapp-83e57.firebasestorage.app",
  messagingSenderId: "431924386721",
  appId: "1:431924386721:web:0e128b51f1c927fde949e0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); 