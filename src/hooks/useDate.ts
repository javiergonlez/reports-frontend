//---------------------------------------------------------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import type { MostPrescribedMedications, StringOrDateOrNull } from '../types';

//---------------------------------------------------------------------------------------------------------------------------

const useDate = (): {
  selectedDate: StringOrDateOrNull;
  setSelectedDate: (date: StringOrDateOrNull) => void;
  filteredMedications: MostPrescribedMedications[];
  isLoading: boolean;
} => {
  const [selectedDate, setSelectedDate] = useState<StringOrDateOrNull>(null);
  const [filteredMedications, setFilteredMedications] = useState<MostPrescribedMedications[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadMedications = async (): Promise<void> => {
      if (!selectedDate) {
        setFilteredMedications([]);
        return;
      }

      setIsLoading(true);
      try {
        // TODO: Implement readCsvFile utility or use S3DataStore
        // const medicamentosMasRecetados: MostPrescribedMedications[] = await readCsvFile<MostPrescribedMedications>('/datos-tabla-abajo-medicamentos.csv');
        
        // const filteredMedicamentos: MostPrescribedMedications[] = medicamentosMasRecetados.filter((med: MostPrescribedMedications) => {
        //   if (!med.Fecha) return false;
          
        //   const medicationDate: Date = new Date(med.Fecha);
        //   const selectedDateObj: Date = new Date(selectedDate);
          
        //   return medicationDate.toDateString() === selectedDateObj.toDateString();
        // });

        // setFilteredMedications(filteredMedicamentos);
        setFilteredMedications([]);
      } catch (error) {
        console.error('Error loading medications:', error);
        setFilteredMedications([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMedications();
  }, [selectedDate]);

    return {
    selectedDate,
    setSelectedDate,
    filteredMedications,
    isLoading
  };
};

export { useDate };