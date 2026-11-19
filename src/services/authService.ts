import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { UserProfile, Rol, MetaNutricional } from '../types/models';

// ─── Datos extra que vienen del formulario de registro ───────────────────────
export interface DatosRegistroPaciente {
  nombre: string;
  rol: 'PACIENTE';
}

export interface DatosRegistroProfesional {
  nombre: string;
  rol: 'PROFESIONAL';
  rut: string;
  codigoIdentificador: string; // 6 dígitos
}

export type DatosRegistro = DatosRegistroPaciente | DatosRegistroProfesional;

// ─── Servicio ─────────────────────────────────────────────────────────────────
export const AuthService = {

  /** Inicia sesión y devuelve el perfil completo desde Firestore */
  async login(email: string, password: string): Promise<UserProfile> {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    return AuthService.getProfile(user.uid);
  },

  /** Registra un usuario nuevo en Auth + Firestore */
  async register(
    email: string,
    password: string,
    datos: DatosRegistro,
  ): Promise<UserProfile> {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);

    const baseDoc: Record<string, unknown> = {
      uid:       user.uid,
      nombre:    datos.nombre,
      email:     email.trim().toLowerCase(),
      rol:       datos.rol,
      creadoEn:  serverTimestamp(),
    };

    if (datos.rol === 'PACIENTE') {
      baseDoc.estado        = 'pendiente';
      baseDoc.profesionalUid = null;
    } else {
      baseDoc.rut                 = datos.rut.trim();
      baseDoc.codigoIdentificador = datos.codigoIdentificador.trim();
    }

    await setDoc(doc(db, 'users', user.uid), baseDoc);

    return AuthService.getProfile(user.uid);
  },

  /** Lee el perfil de Firestore */
  async getProfile(uid: string): Promise<UserProfile> {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) {
      throw new Error('Perfil no encontrado en Firestore para uid: ' + uid);
    }
    return { uid, ...snap.data() } as UserProfile;
  },

  /** Cierra sesión */
  async logout(): Promise<void> {
    await signOut(auth);
  },

  /** Escucha cambios de sesión */
  onAuthChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  },

  get currentUser(): User | null {
    return auth.currentUser;
  },
};
