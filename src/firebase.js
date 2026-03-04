import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCPZZjrH9JYkfaa1iaeCTS9SJMnye6EUEo",
  authDomain: "shivdhara-medical-4ff49.firebaseapp.com",
  projectId: "shivdhara-medical-4ff49",
  storageBucket: "shivdhara-medical-4ff49.firebasestorage.app",
  messagingSenderId: "291577626176",
  appId: "1:291577626176:web:87a7aa3bab5873484769a5"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Save data to Firestore (replaces localStorage.setItem)
export const saveData = async (key, data) => {
  try {
    await setDoc(doc(db, "store", key), { value: JSON.stringify(data) });
  } catch (e) {
    // fallback to localStorage
    try { localStorage.setItem(key, JSON.stringify(data)); } catch(_) {}
  }
};

// Load data from Firestore (replaces localStorage.getItem)
export const loadData = async (key) => {
  try {
    const snap = await getDoc(doc(db, "store", key));
    if (snap.exists()) return JSON.parse(snap.data().value);
  } catch (e) {
    // fallback to localStorage
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch(_) {}
  }
  return null;
};

// Delete data from Firestore
export const deleteData = async (key) => {
  try {
    await deleteDoc(doc(db, "store", key));
    localStorage.removeItem(key);
  } catch (e) {}
};
