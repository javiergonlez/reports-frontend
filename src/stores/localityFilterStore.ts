import { create } from 'zustand';
import type { CsvRow, FilterItem } from '../types';

interface LocalityFilterState {
  selectedLocalities: string[];
  localityData: FilterItem[];
  setSelectedLocalities: (localities: string[]) => void;
  updateLocalityData: (geoBillingData: CsvRow[]) => void;
  clearFilter: () => void;
}

const useLocalityFilterStore = create<LocalityFilterState>((set) => ({
  selectedLocalities: [],
  localityData: [],
  
  setSelectedLocalities: (localities: string[]) => {
    
    
    // Si se están aplicando localidades, limpiar el filtro de DNI
    if (localities.length > 0) {
      // Importar dinámicamente para evitar dependencias circulares
      import('./dniFilterStore').then(({ useDNIFilterStore }) => {
        useDNIFilterStore.getState().clearFilter();
      });
    }
    
    set({ selectedLocalities: localities });
    
  },
  
  updateLocalityData: (geoBillingData: CsvRow[]) => {
    // Agrupar por department y calcular gasto total por localidad
    const localityMap = new Map<string, number>();
    
    geoBillingData.forEach((row: CsvRow) => {
      const locality = row.department || '';
      const discountedPrice = parseFloat(row.total_discounted_price || '0');
      
      if (locality && !isNaN(discountedPrice)) {
        const currentTotal = localityMap.get(locality) || 0;
        localityMap.set(locality, currentTotal + discountedPrice);
      }
    });
    
    // Convertir a array y ordenar por gasto descendente
    const localityData = Array.from(localityMap.entries())
      .map(([locality, gasto]) => ({
        value: locality,
        label: formatLocalityName(locality),
        gasto: formatCurrency(gasto),
        gastoOriginal: gasto
      }))
      .sort((a, b) => {
        // Ordenar por el valor numérico original, no por el valor formateado
        return b.gastoOriginal - a.gastoOriginal;
      });
    
    set({ localityData });
  },
  
  clearFilter: () => {
    set({ selectedLocalities: [] });
  }
}));

// Función auxiliar para formatear moneda
function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$ ${(amount / 1000000).toFixed(2)} M`;
  } else if (amount >= 1000) {
    return `$ ${(amount / 1000).toFixed(2)} mil`;
  } else {
    return `$ ${amount.toFixed(2)}`;
  }
}

// Función auxiliar para formatear nombre de localidad
function formatLocalityName(name: string): string {
  if (!name) return '';
  
  // Capitalizar primera letra de cada palabra
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export { useLocalityFilterStore }; 