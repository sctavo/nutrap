// Hooks: consumo de un día del paciente, en tiempo real
import { useState, useEffect } from 'react';
import { ConsumoService, hoy } from '../../services/firestoreService';
import type { ConsumoDiario, MetaNutricional } from '../../types/models';

/** Metas de referencia mientras el nutricionista no asigna un plan */
export const META_REFERENCIA: MetaNutricional = {
  caloriasObjetivo: 2000, proteinaObjetivo: 150, carbohidratosObjetivo: 200, grasasObjetivo: 67,
};

/** Consumo de un día (yyyy-MM-dd); se actualiza solo y vuelve a null mientras carga otro día */
export function useConsumoDia(uid: string, fecha: string) {
  const [consumo, setConsumo] = useState<ConsumoDiario | null>(null);
  useEffect(() => {
    setConsumo(null);
    return ConsumoService.escucharDia(uid, fecha, setConsumo);
  }, [uid, fecha]);
  return consumo;
}

export const useConsumoHoy = (uid: string) => useConsumoDia(uid, hoy());
