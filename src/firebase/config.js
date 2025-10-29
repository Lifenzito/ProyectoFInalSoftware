import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// 👇 Pega EXACTAMENTE esto con tus claves
const firebaseConfig = {
  apiKey: "AIzaSyDF1KRKIjjyNcYz-6YhkweT-NM51slmQZ8",
  authDomain: "antojosupb.firebaseapp.com",
  projectId: "antojosupb",
  storageBucket: "antojosupb.firebasestorage.app",
  messagingSenderId: "114300203623",
  appId: "1:114300203623:web:edb2ca6316fb4017c15ac2"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);