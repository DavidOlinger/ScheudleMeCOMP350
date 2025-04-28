import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD3KhyIytYz1McR0bRzqbViwJ7TwMgQVJ4",
  authDomain: "scheudleme.firebaseapp.com",
  projectId: "scheudleme",
  storageBucket: "scheudleme.firebasestorage.app",
  messagingSenderId: "970637457230",
  appId: "1:970637457230:web:a408ae9f85e61512c5101f",
  measurementId: "G-T5C4EPYD6H"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);