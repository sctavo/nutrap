/**
 * scripts/seed.ts  –  Usuarios y datos de prueba para Nutrap
 * ───────────────────────────────────────────────────────────
 * Ejecutar desde la carpeta del proyecto:
 *
 *     npx tsx scripts/seed.ts
 *
 * Crea (o reutiliza, si ya existen) cuentas en Firebase Auth + Firestore,
 * usando los mismos servicios que la app. Se puede correr varias veces:
 * cada vez deja los datos de prueba como nuevos.
 *
 * CONTRASEÑA DE TODAS LAS CUENTAS DE PRUEBA:  Prueba2026!
 *
 * Carlos, Sofía y Valentina tienen dieta semanal armada; Diego y Benjamín no
 * (para ver el aviso de "aún no tienes una dieta").
 *
 * Nutricionistas
 *   luis.silvestre@nutrap.test   → 4 pacientes
 *   camila.rojas@nutrap.test     → 1 paciente
 *
 * Pacientes
 *   carlos.mendez@nutrap.test     Luis   · adherencia alta  (Óptimo)
 *   sofia.perez@nutrap.test       Luis   · adherencia media (Riesgo)
 *   diego.fuentes@nutrap.test     Luis   · adherencia baja  (Crítico)
 *   benjamin.torres@nutrap.test   Luis   · plan asignado, sin registros (Onboarding)
 *   valentina.munoz@nutrap.test   Camila · adherencia alta  (Óptimo)
 *   tomas.araya@nutrap.test       PENDIENTE (para probar la asociación)
 *   javiera.soto@nutrap.test      PENDIENTE (para probar la asociación)
 */
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../src/config/firebase';
import { ExpedienteService, PlanService, fechaHace } from '../src/services/firestoreService';
import type { UserProfile, RegistroAlimento, DietaSemanal, TipoComida } from '../src/types/models';

const PASSWORD = 'Prueba2026!';

// ─── Datos ────────────────────────────────────────────────────────────────────

const NUTRIS = [
  { nombre: 'Luis Silvestre', email: 'luis.silvestre@nutrap.test', rut: '12.345.678-5', codigo: '482913' },
  { nombre: 'Camila Rojas',   email: 'camila.rojas@nutrap.test',   rut: '15.678.234-1', codigo: '731055' },
];

type PlanSeed = { nombre: string; calorias: number; p: number; c: number; g: number };

/**
 * dias: cuánto comió cada uno de los últimos 7 días, como fracción de su meta
 *       (del más antiguo a ayer). null = ese día no registró nada.
 * hoy:  fracción de la meta registrada hasta ahora hoy.
 */
const PACIENTES: {
  nombre: string; email: string; nutri: number | null;
  plan?: PlanSeed; dias?: (number | null)[]; hoy?: number; dieta?: boolean;
}[] = [
  { nombre: 'Carlos Méndez',   email: 'carlos.mendez@nutrap.test',   nutri: 0,
    plan: { nombre: 'PROTOCOLO HIPERTROFIA V2', calorias: 2800, p: 30, c: 50, g: 20 },
    dias: [0.97, 1.02, 0.95, 1.0, 1.05, 0.98, 0.99], hoy: 0.6, dieta: true },
  { nombre: 'Sofía Pérez',     email: 'sofia.perez@nutrap.test',     nutri: 0,
    plan: { nombre: 'DEFINICIÓN FASE 2', calorias: 1800, p: 35, c: 40, g: 25 },
    dias: [0.8, 1.25, 0.7, null, 1.3, 0.75, 0.85], hoy: 0.4, dieta: true },
  { nombre: 'Diego Fuentes',   email: 'diego.fuentes@nutrap.test',   nutri: 0,
    plan: { nombre: 'MANTENIMIENTO GENERAL', calorias: 2200, p: 25, c: 50, g: 25 },
    dias: [1.5, 0.4, null, 1.6, 0.3, 1.45, null], hoy: 0.2 },
  { nombre: 'Benjamín Torres', email: 'benjamin.torres@nutrap.test', nutri: 0,
    plan: { nombre: 'PLAN INICIAL', calorias: 2400, p: 25, c: 50, g: 25 } },
  { nombre: 'Valentina Muñoz', email: 'valentina.munoz@nutrap.test', nutri: 1,
    plan: { nombre: 'ALIMENTACIÓN BALANCEADA', calorias: 2000, p: 25, c: 50, g: 25 },
    dias: [1.0, 0.95, 1.03, 0.98, null, 1.0, 0.97], hoy: 0.5, dieta: true },
  { nombre: 'Tomás Araya',     email: 'tomas.araya@nutrap.test',     nutri: null },
  { nombre: 'Javiera Soto',    email: 'javiera.soto@nutrap.test',    nutri: null },
];

// Comidas del día: nombre, hora y fracción de las calorías diarias
const COMIDAS: [string, number, number][] = [
  ['Avena con leche y plátano',        8, 0.25],
  ['Pechuga de pollo con arroz',      13, 0.35],
  ['Yogur con frutos secos',          17, 0.10],
  ['Salmón con papas y ensalada',     20, 0.30],
];

// Menú de la semana tipo: [tipo, hora, fracción de kcal, opciones que rotan por día]
const MENU: [TipoComida, string, number, string[]][] = [
  ['DESAYUNO', '08:00', 0.25, ['Avena con leche descremada y plátano', 'Pan integral con huevo revuelto y palta', 'Yogur griego con granola y berries']],
  ['COLACIÓN', '11:00', 0.10, ['Manzana y un puñado de almendras', 'Barra de proteína', 'Yogur natural con nueces']],
  ['ALMUERZO', '13:30', 0.35, ['Pechuga de pollo, arroz integral y brócoli', 'Salmón al horno con quinoa y ensalada', 'Lentejas con arroz y ensalada chilena', 'Carne magra con puré de papas y zapallo italiano']],
  ['ONCE',     '17:30', 0.10, ['Pan pita con quesillo y tomate', 'Batido de plátano con leche']],
  ['CENA',     '20:30', 0.20, ['Tortilla de verduras con ensalada', 'Pescado a la plancha con verduras salteadas', 'Wrap integral de pavo y vegetales']],
];

function generarDieta(kcal: number): DietaSemanal {
  const dieta: DietaSemanal = {};
  for (let d = 0; d < 7; d++) {
    dieta[String(d) as keyof DietaSemanal] = MENU.map(([tipo, hora, frac, opciones], i) => ({
      id: `seed_${d}_${i}`, tipo, hora, descripcion: opciones[d % opciones.length], kcal: Math.round(kcal * frac),
    }));
  }
  return dieta;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function entrarComo(email: string): Promise<string> {
  await signOut(auth).catch(() => {});
  try {
    return (await createUserWithEmailAndPassword(auth, email, PASSWORD)).user.uid;
  } catch (e: any) {
    if (e.code !== 'auth/email-already-in-use') throw e;
    return (await signInWithEmailAndPassword(auth, email, PASSWORD)).user.uid;
  }
}

/** Escribe un día de consumo con las comidas cuya fracción acumulada cabe en `fraccion` */
async function escribirDia(uid: string, fecha: string, fraccion: number, plan: PlanSeed, esHoy: boolean) {
  const kcalDia = plan.calorias * fraccion;
  // Hoy solo se registran las primeras comidas; los días completos, todas (escaladas)
  const comidas = esHoy ? COMIDAS.slice(0, fraccion >= 0.5 ? 2 : 1) : COMIDAS;
  const totalFrac = comidas.reduce((s, c) => s + c[2], 0);

  const registros: RegistroAlimento[] = comidas.map(([nombre, hora, frac], i) => {
    const kcal = Math.round((kcalDia * frac) / totalFrac);
    return {
      id: `seed_${fecha}_${i}`,
      nombre,
      calorias:      kcal,
      proteina:      Math.round((kcal * plan.p) / 100 / 4),
      carbohidratos: Math.round((kcal * plan.c) / 100 / 4),
      grasas:        Math.round((kcal * plan.g) / 100 / 9),
      fuente:        'Manual',
      timestamp:     new Date(`${fecha}T${String(hora).padStart(2, '0')}:00:00-03:00`).getTime(),
    };
  });

  const suma = (k: keyof RegistroAlimento) => registros.reduce((s, r) => s + (r[k] as number), 0);
  await setDoc(doc(db, 'consumo', uid, 'diario', fecha), {
    fecha,
    registros,
    totalCalorias:      suma('calorias'),
    totalProteina:      suma('proteina'),
    totalCarbohidratos: suma('carbohidratos'),
    totalGrasas:        suma('grasas'),
    creadoEn:           serverTimestamp(),
  });
  return registros[registros.length - 1].nombre;
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 Creando datos de prueba en Firebase...\n');

  // 1. Nutricionistas
  const nutriUids: string[] = [];
  for (const n of NUTRIS) {
    const uid = await entrarComo(n.email);
    await setDoc(doc(db, 'users', uid), {
      uid, nombre: n.nombre, email: n.email, rol: 'PROFESIONAL',
      rut: n.rut, codigoIdentificador: n.codigo, creadoEn: serverTimestamp(),
    });
    nutriUids.push(uid);
    console.log(`  ✓ Nutricionista  ${n.nombre.padEnd(16)} ${n.email}`);
  }

  // 2. Pacientes: cuenta + perfil pendiente + historial de consumo (escrito por el propio paciente)
  const perfiles: UserProfile[] = [];
  for (const p of PACIENTES) {
    const uid = await entrarComo(p.email);
    const perfil: UserProfile = { uid, nombre: p.nombre, email: p.email, rol: 'PACIENTE', estado: 'pendiente' };
    await setDoc(doc(db, 'users', uid), { ...perfil, profesionalUid: null, creadoEn: serverTimestamp() });

    if (p.plan && p.dias) {
      for (let i = 0; i < p.dias.length; i++) {
        const frac = p.dias[i];
        if (frac !== null) await escribirDia(uid, fechaHace(p.dias.length - i), frac, p.plan, false);
      }
    }
    perfiles.push(perfil);
  }

  // 3. Cada nutricionista asocia a sus pacientes y les asigna su plan
  for (let n = 0; n < NUTRIS.length; n++) {
    await signOut(auth);
    await signInWithEmailAndPassword(auth, NUTRIS[n].email, PASSWORD);
    for (let i = 0; i < PACIENTES.length; i++) {
      const p = PACIENTES[i];
      if (p.nutri !== n || !p.plan) continue;
      await ExpedienteService.asociarPaciente(nutriUids[n], perfiles[i]);
      const { plan } = p;
      const g = (pct: number, kcalG: number) => Math.round((plan.calorias * pct) / 100 / kcalG);
      const nuevo = await PlanService.asignar({
        nombre: plan.nombre, pacienteUid: perfiles[i].uid, pacienteNombre: p.nombre,
        profesionalUid: nutriUids[n], calorias: plan.calorias,
        proteinaPct: plan.p, carbohidratosPct: plan.c, grasasPct: plan.g,
        proteinaG: g(plan.p, 4), carbohidratosG: g(plan.c, 4), grasasG: g(plan.g, 9),
      });
      // Re-ejecutar el seed debe dejar a Diego y Benjamín sin dieta
      await PlanService.guardarDieta(nuevo, p.dieta ? generarDieta(plan.calorias) : {});
    }
  }

  // 4. Los pacientes registran lo de hoy → se calcula su adherencia y estado
  for (let i = 0; i < PACIENTES.length; i++) {
    const p = PACIENTES[i];
    if (p.nutri === null) {
      console.log(`  ✓ Paciente       ${p.nombre.padEnd(16)} ${p.email}  (PENDIENTE)`);
      continue;
    }
    await signOut(auth);
    await signInWithEmailAndPassword(auth, p.email, PASSWORD);
    let ultimo: string | undefined;
    if (p.plan && p.hoy) ultimo = await escribirDia(perfiles[i].uid, fechaHace(0), p.hoy, p.plan, true);
    if (p.dias) await ExpedienteService.actualizarSeguimiento(perfiles[i].uid, ultimo);
    console.log(`  ✓ Paciente       ${p.nombre.padEnd(16)} ${p.email}  → ${NUTRIS[p.nutri].nombre}`);
  }

  await signOut(auth);
  console.log(`\n✅ Listo. Contraseña de todas las cuentas: la que está al inicio de scripts/seed.ts\n`);
}

main()
  .then(() => process.exit(0))
  .catch((e: any) => {
    console.error('\n❌ Error:', e.code ?? '', e.message ?? e);
    if (String(e.code).includes('permission-denied')) {
      console.error('   Tus reglas de Firestore bloquearon la escritura. Revisa que permitan lo que hace la app');
      console.error('   (users, consumo, expedientes y planes).');
    }
    if (e.code === 'auth/operation-not-allowed') {
      console.error('   Activa el proveedor "Correo electrónico/contraseña" en Firebase Console → Authentication.');
    }
    process.exit(1);
  });
