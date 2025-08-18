import { create } from 'zustand';
import type { CsvRow, FilterItem } from '../types';

interface DNIFilterState {
  selectedDNIs: string[];
  dniData: FilterItem[];
  setSelectedDNIs: (dnis: string[]) => void;
  updateDNIData: (billingData: CsvRow[], selectedLocalities?: string[]) => void;
  clearFilter: () => void;
}

const useDNIFilterStore = create<DNIFilterState>((set) => ({
  selectedDNIs: [],
  dniData: [],
  
  setSelectedDNIs: (dnis: string[]) => {
    // Si se están aplicando DNIs, limpiar el filtro de localidad
    if (dnis.length > 0) {
      // Importar dinámicamente para evitar dependencias circulares
      import('./localityFilterStore').then(({ useLocalityFilterStore }) => {
        useLocalityFilterStore.getState().clearFilter();
      });
    }
    set({ selectedDNIs: dnis });
  },
  
  updateDNIData: (billingData: CsvRow[], selectedLocalities?: string[]) => {
    // Filtrar por localidad si hay localidades seleccionadas
    let filteredBillingData = billingData;
    
    if (selectedLocalities && selectedLocalities.length > 0) {
      filteredBillingData = billingData.filter((row: CsvRow) => {
        const locality = row.patient_department || '';
        return selectedLocalities.some(selectedLocality => {
          // Normalizar nombres para comparación
          const normalizedLocality = normalizeName(locality);
          const normalizedSelected = normalizeName(selectedLocality);
          
          if (selectedLocality.toLowerCase().includes('libertad')) {
            return normalizedLocality.includes(normalizedSelected);
          }
          
          return normalizedLocality === normalizedSelected;
        });
      });
    }
    
    // Agrupar por patient_id y calcular gasto total por DNI
    const dniMap = new Map<string, number>();
    
    filteredBillingData.forEach((row: CsvRow) => {
      const patientId = row.patient_id || '';
      const discountedPrice = parseFloat(row.total_discounted_price || '0');
      
      if (patientId && !isNaN(discountedPrice)) {
        const currentTotal = dniMap.get(patientId) || 0;
        dniMap.set(patientId, currentTotal + discountedPrice);
      }
    });
    
    // Convertir a array y ordenar por gasto descendente
    const dniData = Array.from(dniMap.entries())
      .map(([dni, gasto]) => ({
        value: dni,
        label: dni,
        gasto: formatCurrency(gasto),
        gastoOriginal: gasto
      }))
      .sort((a, b) => {
        // Ordenar por el valor numérico original, no por el valor formateado
        return b.gastoOriginal - a.gastoOriginal;
      });
    
    set({ dniData });
  },
  
  clearFilter: () => {
    set({ selectedDNIs: [] });
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

// Función auxiliar para normalizar nombres (igual que en ThirdDashboard)
function normalizeName(name: string): string {
  if (!name) return '';

  let nombrePrincipal: string = name;
  if (name.includes(',')) {
    nombrePrincipal = name.split(',')[0].trim();
  }

  // Luego normalizar
  return nombrePrincipal
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[  -]/g, '')
    .replace(/[.,]/g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export { useDNIFilterStore }; 