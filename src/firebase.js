import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "FAPI",
  authDomain: "inventory-predictor-2c4a3.firebaseapp.com",
  projectId: "inventory-predictor-2c4a3",
  storageBucket: "inventory-predictor-2c4a3.firebasestorage.app",
  messagingSenderId: "1007685266706",
  appId: "1:1007685266706:web:79e9de1dcec38d70c317cb",
  measurementId: "G-KGNKVBQSBC"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, firebaseConfig };