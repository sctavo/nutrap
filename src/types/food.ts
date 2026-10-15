// Entidad de Dominio (utilizada por tus componentes de React Native)
export interface Alimento {
  id: string;
  nombre: string;
  calorias: number;
  proteina: number;
  carbohidratos: number;
  grasas: number;
  fuente: 'OpenFoodFacts' | 'Manual';
}

// Data Transfer Object (DTO): Contrato JSON exacto de Open Food Facts
export interface OpenFoodFactsDTO {
  code: string;
  status: number; // 1 = encontrado, 0 = no encontrado
  status_verbose: string;
  product?: {
    product_name?: string;
    product_name_es?: string;
    nutriments?: {
      'energy-kcal_100g'?: number;
      'energy-kcal'?: number;
      proteins_100g?: number;
      carbohydrates_100g?: number;
      fat_100g?: number;
    };
  };
}