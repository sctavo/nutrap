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
  increment,
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
  EstadoAdherencia,
  DietaSemanal,
} from '../types/models';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Fecha local de Santiago en formato yyyy-MM-dd, hace `dias` días (0 = hoy) */
export function fechaHace(dias: number): string {
  return new Date(Date.now() - dias * 86_400_000)
    .toLocaleDateString('sv-SE', { timeZone: 'America/Santiago' });
}

/** Fecha local de Santiago en formato yyyy-MM-dd */
export function hoy(): string {
  return fechaHace(0);
}

/** Calorías registradas hoy según el expediente (0 si el último registro es de otro día) */
export function kcalDeHoy(e: ExpedientePaciente): number {
  return e.fechaUltimoRegistro === hoy() ? (e.kcalHoy ?? 0) : 0;
}

// ─── Adherencia ───────────────────────────────────────────────────────────────
/**
 * Adherencia de un día = qué tan cerca estuvo el paciente de su meta calórica.
 *   100% si comió exactamente la meta; baja 1 punto por cada 1% de desvío
 *   (por exceso o por defecto); mínimo 0.
 */
function puntajeDia(kcal: number, objetivo: number): number {
  if (objetivo <= 0) return 0;
  return Math.max(0, Math.round(100 - (Math.abs(kcal - objetivo) / objetivo) * 100));
}

function estadoPorAdherencia(a: number): EstadoAdherencia {
  if (a >= 80) return 'Óptimo';
  if (a >= 60) return 'Riesgo';
  return 'Crítico';
}

const DIAS_ADHERENCIA = 7;

/** Meta de agua diaria por defecto (8 vasos de 250 ml) */
export const META_AGUA_ML = 2000;
export const VASO_ML = 250;

/** ConsumoDiario vacío para cuando no hay doc en Firestore */
function consumoVacio(fecha: string = hoy()): ConsumoDiario {
  return {
    fecha,
    registros:          [],
    totalCalorias:      0,
    totalProteina:      0,
    totalCarbohidratos: 0,
    totalGrasas:        0,
  };
}

/**
 * Completa los campos que faltan: un día puede existir solo con agua o peso
 * registrados (sin alimentos), y entonces no trae registros ni totales.
 */
function normalizar(data: any, fecha: string): ConsumoDiario {
  return { ...consumoVacio(fecha), ...data, registros: data?.registros ?? [] };
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
    return normalizar(snap.exists() ? snap.data() : null, fecha);
  },

  /** Consumo de un día (yyyy-MM-dd) en tiempo real */
  escucharDia(uid: string, fecha: string, callback: (c: ConsumoDiario) => void): Unsubscribe {
    return onSnapshot(doc(db, 'consumo', uid, 'diario', fecha), snap => {
      callback(normalizar(snap.exists() ? snap.data() : null, fecha));
    });
  },

  /** Consumo de hoy en tiempo real (dashboard y escaneos recientes) */
  escucharHoy(uid: string, callback: (c: ConsumoDiario) => void): Unsubscribe {
    return ConsumoService.escucharDia(uid, hoy(), callback);
  },

  /** Suma (o resta, con ml negativo) agua al día de hoy. Nunca baja de 0. */
  async agregarAgua(uid: string, ml: number): Promise<void> {
    const fecha = hoy();
    const ref   = doc(db, 'consumo', uid, 'diario', fecha);
    if (ml < 0) {
      const actual = (await getDoc(ref)).data()?.aguaMl ?? 0;
      ml = Math.max(-actual, ml);
      if (ml === 0) return;
    }
    await setDoc(ref, { fecha, aguaMl: increment(ml) }, { merge: true });
  },

  /**
   * Registra el peso de hoy (opcional para el paciente):
   *  - consumo/{uid}/diario/{hoy}.pesoKg  → historial
   *  - users/{uid}.pesoActual             → su app lo ve al instante
   *  - expedientes/{uid}.peso             → su nutricionista lo ve en el portal
   */
  async registrarPeso(uid: string, kg: number): Promise<void> {
    const fecha = hoy();
    await setDoc(doc(db, 'consumo', uid, 'diario', fecha), { fecha, pesoKg: kg }, { merge: true });
    await updateDoc(doc(db, 'users', uid), { pesoActual: kg, pesoFecha: fecha });
    const exp = doc(db, 'expedientes', uid);
    if ((await getDoc(exp)).exists()) await updateDoc(exp, { peso: kg });
  },

  /** Todos los días con registros desde `fecha` (yyyy-MM-dd) hasta hoy */
  async getDesde(uid: string, fecha: string): Promise<ConsumoDiario[]> {
    const q = query(collection(db, 'consumo', uid, 'diario'), where('fecha', '>=', fecha));
    return (await getDocs(q)).docs.map(d => normalizar(d.data(), d.id));
  },

  async agregarAlimento(uid: string, alimento: RegistroAlimento): Promise<void> {
    const fecha = hoy();
    const ref   = doc(db, 'consumo', uid, 'diario', fecha);
    const snap  = await getDoc(ref);

    if (snap.exists() && snap.data().registros) {
      const actual = normalizar(snap.data(), fecha);
      await updateDoc(ref, {
        registros:          arrayUnion(alimento),
        totalCalorias:      actual.totalCalorias      + alimento.calorias,
        totalProteina:      actual.totalProteina      + alimento.proteina,
        totalCarbohidratos: actual.totalCarbohidratos + alimento.carbohidratos,
        totalGrasas:        actual.totalGrasas        + alimento.grasas,
        actualizadoEn:      serverTimestamp(),
      });
    } else {
      // merge: conserva agua/peso si el día ya existía sin alimentos
      await setDoc(ref, {
        fecha,
        registros:          [alimento],
        totalCalorias:      alimento.calorias,
        totalProteina:      alimento.proteina,
        totalCarbohidratos: alimento.carbohidratos,
        totalGrasas:        alimento.grasas,
        creadoEn:           serverTimestamp(),
      }, { merge: true });
    }

    // Avisar al nutricionista (su portal escucha el expediente en tiempo real)
    await ExpedienteService.actualizarSeguimiento(uid, alimento.nombre);
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

  /** Igual que getPorProfesional, pero en tiempo real */
  escucharPorProfesional(profesionalUid: string, callback: (e: ExpedientePaciente[]) => void): Unsubscribe {
    const q = query(collection(db, 'expedientes'), where('profesionalUid', '==', profesionalUid));
    return onSnapshot(q, snap => callback(snap.docs.map(d => d.data() as ExpedientePaciente)));
  },

  /**
   * Recalcula el seguimiento del paciente y lo guarda en su expediente:
   *  - kcal de hoy y último alimento registrado
   *  - adherencia = promedio de los últimos 7 días COMPLETOS con registros
   *    (hoy no cuenta porque el día aún está en curso)
   *  - estado según la adherencia (Óptimo ≥80, Riesgo ≥60, Crítico <60)
   */
  async actualizarSeguimiento(uid: string, ultimoAlimento?: string): Promise<void> {
    const ref  = doc(db, 'expedientes', uid);
    const exp  = await getDoc(ref);
    if (!exp.exists()) return; // paciente aún no asociado

    const objetivo = (exp.data() as ExpedientePaciente).caloriasObjetivo;
    const q    = query(collection(db, 'consumo', uid, 'diario'), where('fecha', '>=', fechaHace(DIAS_ADHERENCIA)));
    const dias = (await getDocs(q)).docs.map(d => normalizar(d.data(), d.id));

    const hoyStr    = hoy();
    const delDia    = dias.find(d => d.fecha === hoyStr);
    const completos = dias.filter(d => d.fecha < hoyStr && d.registros.length > 0);

    const cambios: Partial<ExpedientePaciente> = {
      kcalHoy:             delDia?.totalCalorias ?? 0,
      fechaUltimoRegistro: hoyStr,
      ultimoRegistroTs:    Date.now(),
    };
    if (ultimoAlimento) cambios.ultimoAlimento = ultimoAlimento;

    if (completos.length > 0) {
      const adherencia = Math.round(
        completos.reduce((s, d) => s + puntajeDia(d.totalCalorias, objetivo), 0) / completos.length,
      );
      cambios.adherencia = adherencia;
      cambios.estado     = estadoPorAdherencia(adherencia);
    }

    await updateDoc(ref, cambios);
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

  /** Planes de un profesional en tiempo real (más recientes primero) */
  escucharPorProfesional(profesionalUid: string, callback: (p: PlanNutricional[]) => void): Unsubscribe {
    const q = query(collection(db, 'planes'), where('profesionalUid', '==', profesionalUid));
    return onSnapshot(q, snap => callback(
      snap.docs.map(d => d.data() as PlanNutricional).sort((a, b) => b.creadoEn - a.creadoEn),
    ));
  },

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

    const activosPrevios = anteriores.filter(p => p.pacienteUid === plan.pacienteUid && p.activo);
    activosPrevios.forEach(p => batch.update(doc(db, 'planes', p.id), { activo: false }));

    const ref = doc(collection(db, 'planes'));
    const nuevo: PlanNutricional = { ...plan, id: ref.id, activo: true, creadoEn: Date.now() };
    // Si solo se ajustan calorías/macros, la dieta armada se conserva en el plan nuevo
    const dietaPrevia = activosPrevios.find(p => p.dieta)?.dieta;
    if (dietaPrevia) nuevo.dieta = dietaPrevia;
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

  /**
   * Guarda la dieta semanal del plan:
   *  - planes/{id}.dieta     → para el portal
   *  - users/{paciente}.dieta → la app del paciente la recibe en vivo
   */
  async guardarDieta(plan: PlanNutricional, dieta: DietaSemanal): Promise<void> {
    const batch = writeBatch(db);
    batch.update(doc(db, 'planes', plan.id), { dieta });
    batch.update(doc(db, 'users', plan.pacienteUid), { dieta });
    await batch.commit();
  },
};
