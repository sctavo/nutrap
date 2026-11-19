/**
 * src/config/firebase.ts
 * ──────────────────────
 * Inicialización de Firebase para Nutrap.
 *
 * ⚠️  ANTES DE USAR: reemplaza los valores de firebaseConfig con los de
 *     tu proyecto en Firebase Console → Configuración del proyecto → "Tu aplicación".
 */
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDyrLzv0jBgQSwIJY-s-YBEfhis7QDWzhc",
  authDomain: "nutrap-9440b.firebaseapp.com",
  projectId: "nutrap-9440b",
  storageBucket: "nutrap-9440b.firebasestorage.app",
  messagingSenderId: "1001040633606",
  appId: "1:1001040633606:web:607f08e709d42aa3e8c887",
  measurementId: "G-DK3QLTJYS5"
};

const app = initializeApp(firebaseConfig);

/** Firebase Authentication */
export const auth = getAuth(app);

/** Cloud Firestore */
export const db = getFirestore(app);
