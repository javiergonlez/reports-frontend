//---------------------------------------------------------------------------------------------------------------------------

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiService } from '../services/api.service';
import type { S3Response, S3DataState } from '../types';

//---------------------------------------------------------------------------------------------------------------------------

const useS3DataStore = create<S3DataState>()(
  persist(
    (set) => ({
      data: null,
      isLoading: false,
      error: null,
      lastFetched: null,

      fetchS3Data: async (): Promise<void> => {
        set({ isLoading: true, error: null });
        
        try {
          const data: S3Response = await apiService.getS3DataJson();
          set({ 
            data, 
            isLoading: false, 
            lastFetched: new Date(),
            error: null 
          });
        } catch (error) {
          const errorMessage: string = error instanceof Error ? error.message : 'Error desconocido';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
        }
      },

      setData: (data: S3Response): void => {
        set({ data, lastFetched: new Date() });
      },

      setLoading: (loading: boolean): void => {
        set({ isLoading: loading });
      },

      setError: (error: string | null): void => {
        set({ error });
      },

      clearData: (): void => {
        set({ data: null, error: null, lastFetched: null });
      },
    }),
    {
      name: 's3-data-storage',
      partialize: (state: S3DataState) => ({
        data: state.data,
        lastFetched: state.lastFetched,
      }), // solo estos campos
    }
  )
); 

export { useS3DataStore };