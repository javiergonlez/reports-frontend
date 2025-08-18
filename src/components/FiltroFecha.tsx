//---------------------------------------------------------------------------------------------------------------------------

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import React from 'react';
import { DatePickerInput } from '@mantine/dates';
import { getDateRangePresets } from '../utils/dateHelpers';
import type { StringOrDateOrNull } from '../types';

//---------------------------------------------------------------------------------------------------------------------------

interface FiltroFechaProps {
  value: [StringOrDateOrNull, StringOrDateOrNull];
  onChange: (value: [StringOrDateOrNull, StringOrDateOrNull]) => void;
  placeholder?: string;
  width?: number | string;
}

const FiltroFecha: React.FC<FiltroFechaProps> = ({ 
  value, 
  onChange, 
  placeholder = "Filtrar por periodo",
  width = 450 
}) => {
  return (
    <DatePickerInput
      type="range"
      placeholder={placeholder}
      defaultValue={[null, null]}
      clearable
      valueFormat="DD/MM/YYYY"
      style={{ width }}
      styles={{
        input: {
          fontSize: '1.45rem',
          height: '2.5rem',
          backgroundColor: '#ffffff',
          color: '#141414',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
          borderRadius: '0.8rem',
          border: '2px solid #31fff5'
        },
        root: {
          height: '2.5rem',
        },
        placeholder: {
          color: '#141414',
          fontSize: '1.45rem',
        },
      }}
      locale="es"
      value={value}
      labelSeparator="-"
      onChange={onChange}
      presets={getDateRangePresets()}
      popoverProps={{
        zIndex: 9999,
        styles: {
          dropdown: {
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
            zIndex: 9999,
          },
        },
      }}
    />
  );
};

export { FiltroFecha }; 