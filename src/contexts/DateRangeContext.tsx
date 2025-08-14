/* eslint-disable react-refresh/only-export-components */
//---------------------------------------------------------------------------------------------------------------------------

import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { StringOrDateOrNull } from '../types';

//---------------------------------------------------------------------------------------------------------------------------

interface DateRangeContextType {
  dateRange: [StringOrDateOrNull, StringOrDateOrNull];
  handleDateRangeChange: (value: [StringOrDateOrNull, StringOrDateOrNull]) => void;
  clearDateRange: () => void;
}

interface DateRangeProviderProps {
  children: ReactNode;
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

export const useDateRangeContext: () => DateRangeContextType = (): DateRangeContextType => {
  const context: DateRangeContextType | undefined = useContext(DateRangeContext);
  if (context === undefined) {
    throw new Error('useDateRangeContext must be used within a DateRangeProvider');
  }
  return context;
};

const DateRangeProvider: React.FC<DateRangeProviderProps> = ({ children }) => {
  const [dateRange, setDateRange] = useState<[StringOrDateOrNull, StringOrDateOrNull]>([null, null]);

  const handleDateRangeChange = (value: [StringOrDateOrNull, StringOrDateOrNull]): void => {
    setDateRange(value);
  };

  const clearDateRange = (): void => {
    setDateRange([null, null]);
  };

  return (
    <DateRangeContext.Provider value={{ dateRange, handleDateRangeChange, clearDateRange }}>
      {children}
    </DateRangeContext.Provider>
  );
}; 

export { DateRangeProvider };