export type Rol = 'PACIENTE' | 'PROFESIONAL';

export type EstadoPaciente = 'pendiente' | 'activo';

export type EstadoAdherencia =
  | 'Onboarding'
  | 'Óptimo'
  | 'Riesgo'
  | 'Crítico'
  | 'Intervención Requerida';

export interface MetaNutricional {
  caloriasObjetivo:      number;
  proteinaObjetivo:      number;
  carbohidratosObjetivo: number;
  grasasObjetivo:        number;
}

export interface UserProfile {
  uid:    string;
  nombre: string;
  email:  string;
  rol:    Rol;

  // Solo PACIENTE
  estado?:        EstadoPaciente;
  profesionalUid?: string;
  meta?:          MetaNutricional;

  dieta?:         DietaSemanal; // copia de la dieta del plan activo (la app la escucha en vivo)
  pesoActual?:    number;   // último peso registrado (kg)
  pesoFecha?:     string;   // yyyy-MM-dd del último peso

  // Solo PROFESIONAL
  rut?:                  string;
  codigoIdentificador?:  string;
}

export interface RegistroAlimento {
  id:            string;
  nombre:        string;
  calorias:      number;
  proteina:      number;
  carbohidratos: number;
  grasas:        number;
  fuente:        'OpenFoodFacts' | 'Manual';
  timestamp:     number;
}

export interface ConsumoDiario {
  fecha:              string;
  registros:          RegistroAlimento[];
  totalCalorias:      number;
  totalProteina:      number;
  totalCarbohidratos: number;
  totalGrasas:        number;
  aguaMl?:            number;   // agua tomada ese día
  pesoKg?:            number;   // peso registrado ese día (opcional)
}

export interface ExpedientePaciente {
  uid:             string;
  nombre:          string;
  email:           string;
  peso:            number;
  altura:          number;
  adherencia:      number;
  estado:          EstadoAdherencia;
  caloriasObjetivo: number;
  profesionalUid:  string;
  fechaIngreso:    string;
  planActivoId?:   string;

  // Seguimiento — lo actualiza la app del paciente cada vez que registra un alimento
  kcalHoy?:             number;   // total del día indicado en fechaUltimoRegistro
  fechaUltimoRegistro?: string;   // yyyy-MM-dd
  ultimoAlimento?:      string;
  ultimoRegistroTs?:    number;   // Date.now()
}

/**
 * Plan nutricional asignado por un profesional a un paciente.
 * Colección: planes/{id}
 * Los porcentajes suman 100. Los gramos se calculan con:
 *   proteína y carbohidratos = 4 kcal/g, grasas = 9 kcal/g
 */
export interface PlanNutricional {
  id:              string;
  nombre:          string;
  pacienteUid:     string;
  pacienteNombre:  string;
  profesionalUid:  string;
  calorias:        number;
  proteinaPct:      number;
  carbohidratosPct: number;
  grasasPct:        number;
  proteinaG:        number;
  carbohidratosG:   number;
  grasasG:          number;
  activo:          boolean;
  creadoEn:        number;   // Date.now()
  dieta?:          DietaSemanal;
}

// ─── Dieta (constructor del nutricionista) ────────────────────────────────────
export type TipoComida = 'DESAYUNO' | 'COLACIÓN' | 'ALMUERZO' | 'ONCE' | 'CENA';

export interface ComidaPlanificada {
  id:          string;
  tipo:        TipoComida;
  hora?:       string;   // "08:30" (opcional)
  descripcion: string;
  kcal:        number;
}

/**
 * Semana tipo: se repite todas las semanas.
 * Claves '0'..'6' → 0 = lunes, 6 = domingo.
 */
export type DietaSemanal = Partial<Record<'0' | '1' | '2' | '3' | '4' | '5' | '6', ComidaPlanificada[]>>;
