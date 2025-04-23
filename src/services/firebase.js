import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCUrL0_IufK3wVv5hvByGgbFNlTwfqr5wk",
    authDomain: "mit-app-login-app.firebaseapp.com",
    databaseURL: "https://mit-app-login-app-default-rtdb.firebaseio.com",
    projectId: "mit-app-login-app",
    storageBucket: "mit-app-login-app.firebasestorage.app",
    messagingSenderId: "245251993675",
    appId: "1:245251993675:web:9f08ae0f077e97901c1dce",
    measurementId: "G-KD8JZ89MR3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
const db = getFirestore(app);

export { db };  // <-- This is the Firestore instance