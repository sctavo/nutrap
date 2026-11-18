import { Alimento, OpenFoodFactsDTO } from '../types/food';

const API_BASE_URL = 'https://world.openfoodfacts.org/api/v2/product';
const TIMEOUT_MS = 6000; // Timeout de conexión y lectura (6 segundos)

/**
 * Patrón Adapter (Mapper): Transforma el DTO volátil de la API externa
 * a la entidad limpia de dominio de Nutrap.
 */
function mapDtoToAlimento(dto: OpenFoodFactsDTO): Alimento | null {
  if (dto.status !== 1 || !dto.product) {
    return null;
  }

  const p = dto.product;
  const n = p.nutriments || {};

  return {
    id: dto.code,
    nombre: p.product_name_es || p.product_name || 'Alimento sin nombre',
    calorias: Math.round(n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0),
    proteina: Math.round(n.proteins_100g ?? 0),
    carbohidratos: Math.round(n.carbohydrates_100g ?? 0),
    grasas: Math.round(n.fat_100g ?? 0),
    fuente: 'OpenFoodFacts',
  };
}

/**
 * Cliente de Red: Ejecuta la llamada REST con control de abort y timeout.
 */
export async function fetchProductByBarcode(barcode: string): Promise<Alimento | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/${barcode.trim()}.json`, {
      method: 'GET',
      headers: {
        'User-Agent': 'NutrapApp - Mobile/Web - Version 1.0 (contacto: soporte@nutrap.app)',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Error en servidor externo: HTTP ${response.status}`);
    }

    const data: OpenFoodFactsDTO = await response.json();
    return mapDtoToAlimento(data);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn('Timeout: Open Food Facts tardó demasiado en responder.');
    } else {
      console.error('Error de red al consultar Open Food Facts:', error.message);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}