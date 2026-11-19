// Hook: pacientes del profesional en tiempo real
import { useState, useEffect } from 'react';
import { ExpedienteService } from '../../services/firestoreService';
import type { ExpedientePaciente } from '../../types/models';

/** Pacientes del profesional en tiempo real (se actualiza cuando un paciente registra comida) */
export function usePacientesEnVivo(profesionalUid: string) {
  const [pacientes, setPacientes] = useState<ExpedientePaciente[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => ExpedienteService.escucharPorProfesional(profesionalUid, d => {
    setPacientes(d.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setLoading(false);
  }), [profesionalUid]);
  return { pacientes, loading };
}
