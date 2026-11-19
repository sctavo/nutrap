import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  serverTimestamp,
  writeBatch,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type {
  UserProfile,
  MetaNutricional,
  ConsumoDiario,
  RegistroAlimento,
  ExpedientePaciente,
  PlanNutricional,
} from '../types/models';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Fecha local de Santiago en formato yyyy-MM-dd */
function hoy(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Santiago' });
}

/** ConsumoDiario vacío para cuando no hay doc en Firestore */
function consumoVacio(uid: string): ConsumoDiario {
  return {
    fecha:              hoy(),
    registros:          [],
    totalCalorias:      0,
    totalProteina:      0,
    totalCarbohidratos: 0,
    totalGrasas:        0,
  };
}

// ─── PerfilService ────────────────────────────────────────────────────────────
export const PerfilService = {

  async get(uid: string): Promise<UserProfile> {
    const snap = await getDoc(doc(db, 'users', uid));
    return { uid, ...snap.data() } as UserProfile;
  },

  /**
   * Escucha users/{uid} en tiempo real. Cada vez que el nutricionista cambia
   * algo (asociación, plan, metas) el callback recibe el perfil actualizado.
   */
  escuchar(uid: string, callback: (perfil: UserProfile) => void): Unsubscribe {
    return onSnapshot(doc(db, 'users', uid), snap => {
      if (snap.exists()) callback({ uid, ...snap.data() } as UserProfile);
    });
  },

  async actualizarMeta(uid: string, meta: MetaNutricional): Promise<void> {
    await updateDoc(doc(db, 'users', uid), { meta });
  },
};

// ─── ConsumoService ───────────────────────────────────────────────────────────
export const ConsumoService = {

  async getHoy(uid: string): Promise<ConsumoDiario> {
    const fecha = hoy();
    const ref   = doc(db, 'consumo', uid, 'diario', fecha);
    const snap  = await getDoc(ref);
    return snap.exists() ? (snap.data() as ConsumoDiario) : consumoVacio(uid);
  },

  async agregarAlimento(uid: string, alimento: RegistroAlimento): Promise<void> {
    const fecha = hoy();
    const ref   = doc(db, 'consumo', uid, 'diario', fecha);
    const snap  = await getDoc(ref);

    if (snap.exists()) {
      const actual = snap.data() as ConsumoDiario;
      await updateDoc(ref, {
        registros:          arrayUnion(alimento),
        totalCalorias:      actual.totalCalorias      + alimento.calorias,
        totalProteina:      actual.totalProteina      + alimento.proteina,
        totalCarbohidratos: actual.totalCarbohidratos + alimento.carbohidratos,
        totalGrasas:        actual.totalGrasas        + alimento.grasas,
        actualizadoEn:      serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        fecha,
        registros:          [alimento],
        totalCalorias:      alimento.calorias,
        totalProteina:      alimento.proteina,
        totalCarbohidratos: alimento.carbohidratos,
        totalGrasas:        alimento.grasas,
        creadoEn:           serverTimestamp(),
      });
    }
  },
};

// ─── ExpedienteService ────────────────────────────────────────────────────────
export const ExpedienteService = {

  /** Todos los pacientes asociados a un profesional */
  async getPorProfesional(profesionalUid: string): Promise<ExpedientePaciente[]> {
    const q    = query(
      collection(db, 'expedientes'),
      where('profesionalUid', '==', profesionalUid),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as ExpedientePaciente);
  },

  /** Busca un usuario (paciente pendiente) por email */
  async buscarPacientePorEmail(email: string): Promise<UserProfile | null> {
    const q    = query(
      collection(db, 'users'),
      where('email', '==', email.trim().toLowerCase()),
      where('rol', '==', 'PACIENTE'),
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { uid: d.id, ...d.data() } as UserProfile;
  },

  /**
   * Asocia un paciente al profesional:
   *  1. Actualiza users/{pacienteUid} → estado: 'activo', profesionalUid
   *  2. Crea/actualiza expedientes/{pacienteUid}
   */
  async asociarPaciente(
    profesionalUid: string,
    paciente: UserProfile,
  ): Promise<void> {
    // 1. Activar al paciente y vincularlo
    await updateDoc(doc(db, 'users', paciente.uid), {
      estado:        'activo',
      profesionalUid,
      activadoEn:    serverTimestamp(),
    });

    // 2. Crear expediente
    const expediente: ExpedientePaciente = {
      uid:             paciente.uid,
      nombre:          paciente.nombre,
      email:           paciente.email,
      peso:            0,
      altura:          0,
      adherencia:      0,
      estado:          'Onboarding',
      caloriasObjetivo: paciente.meta?.caloriasObjetivo ?? 2000,
      profesionalUid,
      fechaIngreso:    hoy(),
    };

    await setDoc(doc(db, 'expedientes', paciente.uid), expediente, { merge: true });
  },

  async guardar(expediente: ExpedientePaciente): Promise<void> {
    await setDoc(doc(db, 'expedientes', expediente.uid), expediente, { merge: true });
  },
};

// ─── PlanService ──────────────────────────────────────────────────────────────
export type NuevoPlan = Omit<PlanNutricional, 'id' | 'activo' | 'creadoEn'>;

export const PlanService = {

  /** Planes de un profesional (más recientes primero) */
  async getPorProfesional(profesionalUid: string): Promise<PlanNutricional[]> {
    const q    = query(collection(db, 'planes'), where('profesionalUid', '==', profesionalUid));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => d.data() as PlanNutricional)
      .sort((a, b) => b.creadoEn - a.creadoEn);
  },

  /**
   * Asigna un plan a un paciente, en una sola escritura atómica:
   *  1. Desactiva el plan activo anterior del paciente (si existe)
   *  2. Crea planes/{id} como activo
   *  3. Actualiza users/{pacienteUid}.meta → el dashboard del paciente usa estas metas
   *  4. Actualiza expedientes/{pacienteUid} con las calorías y el plan activo
   */
  async asignar(plan: NuevoPlan): Promise<PlanNutricional> {
    const anteriores = await PlanService.getPorProfesional(plan.profesionalUid);
    const batch = writeBatch(db);

    anteriores
      .filter(p => p.pacienteUid === plan.pacienteUid && p.activo)
      .forEach(p => batch.update(doc(db, 'planes', p.id), { activo: false }));

    const ref = doc(collection(db, 'planes'));
    const nuevo: PlanNutricional = { ...plan, id: ref.id, activo: true, creadoEn: Date.now() };
    batch.set(ref, nuevo);

    const meta: MetaNutricional = {
      caloriasObjetivo:      plan.calorias,
      proteinaObjetivo:      plan.proteinaG,
      carbohidratosObjetivo: plan.carbohidratosG,
      grasasObjetivo:        plan.grasasG,
    };
    batch.update(doc(db, 'users', plan.pacienteUid), { meta });
    batch.update(doc(db, 'expedientes', plan.pacienteUid), {
      caloriasObjetivo: plan.calorias,
      planActivoId:     ref.id,
    });

    await batch.commit();
    return nuevo;
  },
};
