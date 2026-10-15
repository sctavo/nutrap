import { Alimento } from '../types/food';
import { fetchProductByBarcode } from './openFoodFactsService';

// Caché en memoria para evitar peticiones repetidas a la red
const foodCache = new Map<string, Alimento>();

export const FoodRepository = {
  /**
   * Estrategia Cache-Aside:
   * 1. Consulta la memoria/caché.
   * 2. Si falla (Cache Miss), va a la API remota.
   * 3. Si existe, guarda en caché y entrega el resultado a la UI.
   */
  async getByBarcode(barcode: string): Promise<Alimento | null> {
    const cleanCode = barcode.trim();

    // 1. Verificar si ya está en caché
    if (foodCache.has(cleanCode)) {
      return foodCache.get(cleanCode)!;
    }

    // 2. Cache Miss: Acudir a la red
    const alimento = await fetchProductByBarcode(cleanCode);

    // 3. Persistir en caché local
    if (alimento) {
      foodCache.set(cleanCode, alimento);
    }

    return alimento;
  },

  /**
   * Registro manual creado por el paciente
   */
  saveManual(alimento: Alimento): void {
    foodCache.set(alimento.id, alimento);
  }
};