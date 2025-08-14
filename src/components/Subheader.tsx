//---------------------------------------------------------------------------------------------------------------------------

import type { Location } from 'react-router-dom';

import React from 'react';
import { DatePickerInput } from '@mantine/dates';
import { useDateRangeContext } from '../contexts/DateRangeContext';
import { useLocalDateRangeContext } from '../contexts/LocalDateRangeContext';
import { getDatePresets } from '../utils/dateHelpers';
import { useLocation } from 'react-router-dom';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import { FiltroFecha } from './FiltroFecha';

//---------------------------------------------------------------------------------------------------------------------------

const Subheader = (): React.JSX.Element => {

    const location: Location = useLocation();
    const isTableDashboard: boolean = location.pathname === '/tableros/tabla';

    const { dateRange, handleDateRangeChange } = useDateRangeContext();
    const { localDateRange, handleLocalDateRangeChange } = useLocalDateRangeContext();

    return (
        <div
            style={{
                display: "flex",
                alignItems: 'center',
                justifyContent: 'flex-end',
                position: 'relative',
                zIndex: 1000,
            }}>


            {
                isTableDashboard ? (
                    <FiltroFecha
                        value={localDateRange}
                        onChange={handleLocalDateRangeChange}
                        placeholder="Filtrar por periodo"
                    />
                ) : (
                    <DatePickerInput
                        type="range"
                        placeholder="Selecciona un periodo"
                        clearable
                        valueFormat="DD/MM/YYYY"
                        style={{ width: 450 }}
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
                        }}
                        locale="es"
                        value={dateRange}
                        labelSeparator="-"
                        onChange={handleDateRangeChange}
                        presets={getDatePresets()}
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
                )}
        </div>
    );
};

export { Subheader };