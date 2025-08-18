//---------------------------------------------------------------------------------------------------------------------------

import { useEffect } from 'react';
import { useS3DataStore } from '../stores/s3DataStore';

//---------------------------------------------------------------------------------------------------------------------------

const useS3Data = (autoFetch = true) => {
  const {
    data,
    isLoading,
    error,
    lastFetched,
    fetchS3Data,
    setData,
    setError,
    clearData
  } = useS3DataStore();

  // Auto-fetch al montar el componente si autoFetch es true
  useEffect(() => {
    if (autoFetch) {
      fetchS3Data();
    }
  }, [autoFetch, fetchS3Data]);

  // Función para verificar si los datos están desactualizados (más de 5 minutos)
  const isDataStale = (): boolean => {
    if (!lastFetched) return true;
    const fiveMinutesAgo: Date = new Date(Date.now() - 5 * 60 * 1000);
    return lastFetched < fiveMinutesAgo;
  };

  // Función para refrescar datos si están desactualizados
  const refreshIfStale = () => {
    if (isDataStale()) {
      fetchS3Data();
    }
  };

  return {
    data,
    isLoading,
    error,
    lastFetched,
    isDataStale: isDataStale(),
    fetchS3Data,
    setData,
    setError,
    clearData,
    refreshIfStale,
  };
}; 
export { useS3Data }; 
