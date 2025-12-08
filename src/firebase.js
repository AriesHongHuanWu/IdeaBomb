import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDt22yhbuJzEfRTjOyCp1IlCM8K61ILLLc",
    authDomain: "ideaboard-b88c0.firebaseapp.com",
    projectId: "ideaboard-b88c0",
    storageBucket: "ideaboard-b88c0.firebasestorage.app",
    messagingSenderId: "932999439710",
    appId: "1:932999439710:web:73195a4e4615334c001bcf",
    measurementId: "G-LCG5P2V8Q6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
