//---------------------------------------------------------------------------------------------------------------------------

import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { StringOrDateOrNull } from '../types';

//---------------------------------------------------------------------------------------------------------------------------

interface LocalDateRangeContextType {
    localDateRange: [StringOrDateOrNull, StringOrDateOrNull];
    handleLocalDateRangeChange: (value: [StringOrDateOrNull, StringOrDateOrNull]) => void;
}

const LocalDateRangeContext = createContext<LocalDateRangeContextType | undefined>(undefined);

interface LocalDateRangeProviderProps {
    children: ReactNode;
}

export const LocalDateRangeProvider: React.FC<LocalDateRangeProviderProps> = ({ children }) => {
    const [localDateRange, setLocalDateRange] = useState<[StringOrDateOrNull, StringOrDateOrNull]>([null, null]);

    const handleLocalDateRangeChange = (value: [StringOrDateOrNull, StringOrDateOrNull]) => {
        setLocalDateRange(value);
    };

    return (
        <LocalDateRangeContext.Provider value={{ localDateRange, handleLocalDateRangeChange }}>
            {children}
        </LocalDateRangeContext.Provider>
    );
};

export const useLocalDateRangeContext = (): LocalDateRangeContextType => {
    const context = useContext(LocalDateRangeContext);
    if (context === undefined) {
        throw new Error('useLocalDateRangeContext must be used within a LocalDateRangeProvider');
    }
    return context;
}; 