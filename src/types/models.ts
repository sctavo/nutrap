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
}
