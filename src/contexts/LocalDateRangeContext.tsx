//---------------------------------------------------------------------------------------------------------------------------

import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { StringOrDateOrNull } from '../types';

//---------------------------------------------------------------------------------------------------------------------------

type LocalDateRangeContextType = {
    localDateRange: [StringOrDateOrNull, StringOrDateOrNull];
    handleLocalDateRangeChange: (value: [StringOrDateOrNull, StringOrDateOrNull]) => void;
}

const LocalDateRangeContext: React.Context<LocalDateRangeContextType | undefined>
    = createContext<LocalDateRangeContextType | undefined>(undefined);

type LocalDateRangeProviderProps = {
    children: ReactNode;
}

const LocalDateRangeProvider: React.FC<LocalDateRangeProviderProps> = ({ children }) => {
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

const useLocalDateRangeContext = (): LocalDateRangeContextType => {
    const context: LocalDateRangeContextType | undefined = useContext(LocalDateRangeContext);
    if (context === undefined) {
        throw new Error('useLocalDateRangeContext must be used within a LocalDateRangeProvider');
    }
    return context;
}; 

export { LocalDateRangeProvider, useLocalDateRangeContext };
