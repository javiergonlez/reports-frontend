//---------------------------------------------------------------------------------------------------------------------------

import type { DateRange } from '../types';

//---------------------------------------------------------------------------------------------------------------------------


const formatNumberNormalized = (numero: number): string => {
  const isInteger: boolean = Number.isInteger(numero);
  
  if (isInteger) {
    return numero.toLocaleString('es-ES', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    });
  } else {
    return numero.toLocaleString('es-ES', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }
}

const formatCurrencyNormalized = (amount: number): string => {
  const formatted: string = formatNumberNormalized(amount);
  return `$${formatted}`;
}

const parseDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  
  // If it's ISO format (2025-03-01)
  if (dateString.includes('-')) {
    const date: Date = new Date(dateString);
    return date;
  }
  
  // If it's DD/MM/YYYY format
  const parts: string[] = dateString.split('/');
  if (parts.length === 3) {
    const day: number = parseInt(parts[0], 10);
    const month: number = parseInt(parts[1], 10) - 1;
    const year: number = parseInt(parts[2], 10);
    
    // Validate that the values are valid
    if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900) {
      const date: Date = new Date(year, month, day);
      return date;
    }
  }
  
  return null;
};

const filterDataByDateRange = <T extends { Fecha?: string }>(
  data: T[],
  dateRange: DateRange
): T[] => {
  if (!dateRange[0] || !dateRange[1]) {
    return data;
  }
  
  // Convert dateRange strings to Date objects
  const start: Date = typeof dateRange[0] === 'string' ? new Date(dateRange[0]) : dateRange[0];
  const end: Date = typeof dateRange[1] === 'string' ? new Date(dateRange[1]) : dateRange[1];
  
  const filtered: T[] = data.filter((row: T): boolean => {
    if (!row.Fecha) return false;
    
    // Parse CSV date to Date object
    const rowDate: Date | null = parseDate(row.Fecha);
    if (!rowDate) {
      return false;
    }
    
    // Compare Date objects directly
    const isInRange: boolean = rowDate >= start && rowDate <= end;
    return isInRange;
  });
  
  return filtered;
}; 

export { formatNumberNormalized, formatCurrencyNormalized, parseDate, filterDataByDateRange };