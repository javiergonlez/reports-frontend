//------------------------------------------------------------------------------------------------------------------------------

import type { RecetaSospechosa, RecetaAuditada, ThirdDashboardProps } from '../../../types';
import type { CsvRow } from '../../../types';

import React, { useEffect, useState } from 'react';
import { useS3DataStore } from '../../../stores/s3DataStore';
import { useDNIFilterStore } from '../../../stores/dniFilterStore';
import { useLocalityFilterStore } from '../../../stores/localityFilterStore';
import { useTokenExpiration } from '../../../hooks/useTokenExpiration';
import { Subheader } from '../../Subheader';
import { IconSpreadsheet } from '../../../Icons/IconSpreadsheet';
import { MapView } from '../../ MapView';
import styles from './third-dashboard.module.css';
import '../../../App.css';
import { IconPeople } from '../../../Icons/IconPeople';
import { IconMoney } from '../../../Icons/IconMoney';
import { parseDate } from '../../../utils/dateUtils';
import { IconDanger } from '../../../Icons/IconDanger';
import { IconRecipeMoney } from '../../../Icons/IconRecipeMoney';
import { IconRecipe } from '../../../Icons/IconRecipe';
import { LocalityFilter } from '../../../filters/LocalityFilter';
import { DNIFilter } from '../../../filters/DNIFilter';
import { IconMoneyCoins } from '../../../Icons/IconMoneyCoins';
import { IconDrug } from '../../../Icons/IconDrug';

//------------------------------------------------------------------------------------------------------------------------------

const ThirdDashboard: React.FC<ThirdDashboardProps> = ({ dateRange }) => {

    const { data, error, fetchS3Data } = useS3DataStore();
    const { selectedDNIs, updateDNIData } = useDNIFilterStore();
    const { selectedLocalities, updateLocalityData } = useLocalityFilterStore();

    // Verificar expiración del token
    useTokenExpiration();

    const [recetasAuditadas, setRecetasAuditadas] = useState<number>(0);
    const [costoAcumulado, setCostoAcumulado] = useState<number>(0);
    const [recetasSospechosasFiltradas, setRecetasSospechosasFiltradas] = useState<RecetaSospechosa[]>([]);
    const [recetaActualIndex, setRecetaActualIndex] = useState<number>(0);
    const [recetasAuditadasFiltradas, setRecetasAuditadasFiltradas] = useState<number>(0);
    const [costoAcumuladoFiltrado, setCostoAcumuladoFiltrado] = useState<number>(0);
    const [ahorroEstimado, setAhorroEstimado] = useState<number>(0);
    const [ahorroTratamientoSugerido, setAhorroTratamientoSugerido] = useState<number>(0);
    const [costoPromedioReceta, setCostoPromedioReceta] = useState<number>(0);
    const [costoPromedioRecetaFiltrado, setCostoPromedioRecetaFiltrado] = useState<number>(0);
    const [cantidadPacientesRegistrados, setCantidadPacientesRegistrados] = useState<number>(0);
    const [cantidadPacientesRegistradosFiltrado, setCantidadPacientesRegistradosFiltrado] = useState<number>(0);
    const [costoPromedioPaciente, setCostoPromedioPaciente] = useState<number>(0);
    const [costoPromedioPacienteFiltrado, setCostoPromedioPacienteFiltrado] = useState<number>(0);
    const [ahorroEstimadoFiltrado, setAhorroEstimadoFiltrado] = useState<number>(0);
    const [ahorroTratamientoSugeridoFiltrado, setAhorroTratamientoSugeridoFiltrado] = useState<number>(0);
    const [envasesPromedioReceta, setEnvasesPromedioReceta] = useState<number>(0);
    const [envasesPromedioRecetaFiltrado, setEnvasesPromedioRecetaFiltrado] = useState<number>(0);
    const [recetasConDesvios, setRecetasConDesvios] = useState<number>(0);
    const [recetasConDesviosFiltrado, setRecetasConDesviosFiltrado] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [filteredBillingData, setFilteredBillingData] = useState<CsvRow[]>([]);
    const [localidadClickActiva, setLocalidadClickActiva] = useState<string | null>(null);

    // Mapeo de nombres de localidades entre filtro y mapa
    const localityNameMapping: Record<string, string[]> = {
        'Moreno, Buenos Aires, Argentina': ['moreno', 'muniz'],
        'Moron': ['moron', 'moron'],
        'Hurlingham': ['hurlingham', 'hurlingham'],
        'San Miguel': ['sanmiguel', 'sanmiguel'],
        'La Ferrere': ['laferrere', 'laferrere'],
        'Sin Localidad': ['sinlocalidad', 'sinlocalidad'],
        'G. De La Ferrere': ['gdelafarrere', 'gdelafarrere']
    };

    useEffect((): void => {
        if (!data) {
            fetchS3Data();
        }
    }, [data, fetchS3Data]);

    useEffect((): void => {
        if (data?.data) {
            setIsLoading(true);
            const billingData: CsvRow[] = (data.data['billing - Hoja 1.csv'] as CsvRow[]) || [];
            const geoBillingData: CsvRow[] = (data.data['GeoBilling - Hoja 1.csv'] as CsvRow[]) || [];

            // Actualizar los datos de localidad en el store usando GeoBilling
            updateLocalityData(geoBillingData);

            // Actualizar los datos de DNI en el store usando billing (considerando filtro de localidad)
            updateDNIData(billingData, selectedLocalities);

            // Filtrar por fecha usando el campo timestamp
            const filteredBillingData: CsvRow[] = (() => {
                if (!dateRange[0] || !dateRange[1]) {
                    return billingData;
                }

                // Convert dateRange strings to Date objects
                const start: Date = typeof dateRange[0] === 'string' ? new Date(dateRange[0]) : dateRange[0];
                const end: Date = typeof dateRange[1] === 'string' ? new Date(dateRange[1]) : dateRange[1];

                const filtered: CsvRow[] = billingData.filter((row: CsvRow): boolean => {
                    if (!row.timestamp) return false;

                    // Parse CSV date to Date object
                    const rowDate: Date | null = parseDate(row.timestamp);
                    if (!rowDate) {
                        return false;
                    }

                    // Compare Date objects directly
                    const isInRange: boolean = rowDate >= start && rowDate <= end;
                    return isInRange;
                });

                return filtered;
            })();

            // Filtrar por DNI si hay DNIs seleccionados
            const filteredByDNI: CsvRow[] = selectedDNIs.length > 0
                ? filteredBillingData.filter((row: CsvRow): boolean => {
                    const patientId: string = row.patient_id || '';
                    return selectedDNIs.includes(patientId);
                })
                : filteredBillingData;

            // Establecer filteredBillingData para el MapView
            setFilteredBillingData(filteredByDNI);

            // Mostrar el total de registros del archivo billing - Hoja 1.csv (filtrados por fecha y DNI)
            setRecetasAuditadas(filteredByDNI.length);

            const filteredRecipes: CsvRow[] = filteredByDNI.filter((row: CsvRow): boolean => {
                const suspicionPercentage: string = row.suspicion_percentage || '0';
                const percentage: number = parseFloat(suspicionPercentage);
                return percentage >= 80;
            });

            // Calcular costo acumulado con TODAS las recetas (sin filtro de suspicion_percentage)
            const costoTotal: number = filteredByDNI.reduce((total: number, row: CsvRow): number => {
                const discountedPrice: string = row.total_discounted_price || '0';
                const price: number = parseFloat(discountedPrice);
                return total + price;
            }, 0);

            setCostoAcumulado(costoTotal);


            if (filteredRecipes.length > 0) {
                // Hay recetas sospechosas
            } else {
                // No hay recetas sospechosas
            }


            const todasLasRecetasSospechosas: RecetaSospechosa[] = filteredRecipes
                .map((row: CsvRow): RecetaSospechosa => ({
                    link: row.link || '',
                    id: row.patient_id || '',
                    patient_department: row.patient_department || '',
                    motivoSospecha1: row.motivo_sospecha_1 || '',
                    motivoSospecha2: row.motivo_sospecha_2 || '',
                    patient_id: row.patient_id || '',
                    suspicion_percentage: row.suspicion_percentage || '',
                    total_discounted_price: row.total_discounted_price || '',
                    timestamp: row.timestamp || '',
                }));

            setRecetasSospechosasFiltradas(todasLasRecetasSospechosas);
            setRecetaActualIndex(0);

            setRecetasAuditadasFiltradas(filteredRecipes.length);
            setCostoAcumuladoFiltrado(costoTotal);

            // Calcular ahorro estimado (suma de total_discounted_price de registros con suspicion_percentage >= 80)
            const costoRecetasSospechosas: number = filteredRecipes.reduce((total: number, row: CsvRow): number => {
                const discountedPrice: string = row.total_discounted_price || '0';
                const price: number = parseFloat(discountedPrice);
                return total + price;
            }, 0);
            setAhorroEstimado(costoRecetasSospechosas);

            // Calcular ahorro de tratamiento sugerido (suma de total_discounted_savings)
            const ahorroTratamiento: number = filteredByDNI.reduce((total: number, row: CsvRow): number => {
                const discountedSavings: string = row.total_discounted_savings || '0';
                const savings: number = parseFloat(discountedSavings);
                return total + savings;
            }, 0);

            setAhorroTratamientoSugerido(ahorroTratamiento);

            // Calcular costo promedio por receta (total_discounted_price / total de registros)
            const costoPromedio: number = filteredByDNI.length > 0 ? costoTotal / filteredByDNI.length : 0;
            setCostoPromedioReceta(costoPromedio);

            // Calcular cantidad de pacientes registrados únicos
            const patientIdsUnicos: Set<string> = new Set();
            filteredByDNI.forEach((row: CsvRow): void => {
                const patientId: string = row.patient_id || '';
                if (patientId.trim() !== '') {
                    patientIdsUnicos.add(patientId);
                }
            });
            setCantidadPacientesRegistrados(patientIdsUnicos.size);

            // Calcular medicamentos promedio por receta (suma de total_meds / total de registros)
            const totalMedicamentos: number = filteredByDNI.reduce((total: number, row: CsvRow): number => {
                const medsCount: string = row.total_meds || row.medication_count || row['Cantidad Med Rx'] || '0';
                const count: number = parseFloat(medsCount);
                return total + count;
            }, 0);

            const medicamentosPromedio: number = filteredByDNI.length > 0 ? totalMedicamentos / filteredByDNI.length : 0;
            setCostoPromedioPaciente(medicamentosPromedio);

            // Calcular envases promedio por receta (suma de total_units / total de registros)
            const totalEnvases: number = filteredByDNI.reduce((total: number, row: CsvRow): number => {
                const unitsCount: string = row.total_units || row.units || row['Cantidad Envases'] || '0';
                const count: number = parseFloat(unitsCount);
                return total + count;
            }, 0);

            const envasesPromedio: number = filteredByDNI.length > 0 ? totalEnvases / filteredByDNI.length : 0;
            setEnvasesPromedioReceta(envasesPromedio);

            // Calcular recetas con desvios (conteo de registros con suspicion_percentage >= 80)
            const recetasConDesviosCount: number = filteredByDNI.filter((row: CsvRow): boolean => {
                const suspicionPercentage: string = row.suspicion_percentage || '0';
                const percentage: number = parseFloat(suspicionPercentage);
                return percentage >= 80;
            }).length;

            setRecetasConDesvios(recetasConDesviosCount);
            setIsLoading(false);

            // Si hay una localidad seleccionada, recalcular los datos filtrados
            if (selectedLocalities.length > 0) {
                // Si hay localidades seleccionadas, filtrar por esas localidades
                // Los datos filtrados se manejan en otro useEffect
            } else {
                // Si no hay localidades seleccionadas, mantener los datos globales
                // Las recetas sospechosas globales ya están establecidas arriba
            }
        }
    }, [data, dateRange, selectedDNIs, selectedLocalities, updateDNIData, updateLocalityData]);

    // Efecto adicional para limpiar el filtro de DNI cuando cambie el filtro de localidad
    useEffect((): void => {
        if (data?.data) {
            const billingData: CsvRow[] = (data.data['billing - Hoja 1.csv'] as CsvRow[]) || [];
            updateDNIData(billingData, selectedLocalities);
        }
    }, [selectedLocalities, data, updateDNIData]);

    // Efecto para filtrar datos por localidades seleccionadas
    useEffect((): void => {
        if (!data?.data || selectedLocalities.length === 0) return;

        console.log('🏠 ThirdDashboard - Filtrando por localidades:', selectedLocalities);

        const billingData: CsvRow[] = (data.data['billing - Hoja 1.csv'] as CsvRow[]) || [];
        
        // Filtrar por fecha y DNI primero
        const filteredByDateAndDNI = billingData.filter((row: CsvRow): boolean => {
            const fecha: string = row.timestamp || '';
            const dni: string = row.patient_id || '';
            
            if (!fecha || !dni) return false;
            
            const parsedDate: Date | null = parseDate(fecha);
            if (!parsedDate) return false;
            
            // dateRange es un array [start, end]
            if (!dateRange[0] || !dateRange[1]) return true; // Si no hay rango de fechas, incluir todos
            
            const start: Date = typeof dateRange[0] === 'string' ? new Date(dateRange[0]) : dateRange[0];
            const end: Date = typeof dateRange[1] === 'string' ? new Date(dateRange[1]) : dateRange[1];
            
            const isInDateRange: boolean = parsedDate >= start && parsedDate <= end;
            const isInDNIFilter: boolean = selectedDNIs.length === 0 || selectedDNIs.includes(dni);
            
            return isInDateRange && isInDNIFilter;
        });

        console.log('🏠 ThirdDashboard - Datos filtrados por fecha y DNI:', {
            originalLength: billingData.length,
            filteredByDateAndDNILength: filteredByDateAndDNI.length
        });

        // Filtrar por localidades seleccionadas
        const filteredByLocalities = filteredByDateAndDNI.filter((row: CsvRow): boolean => {
            const localidad: string = row.patient_department || '';
            if (!localidad) return false;
            
            const match = selectedLocalities.some(selected => 
                normalizeName(selected) === normalizeName(localidad)
            );
            
            if (match) {
                console.log('🏠 ThirdDashboard - Coincidencia encontrada:', { selected: selectedLocalities, localidad, normalizedSelected: normalizeName(selectedLocalities[0]), normalizedLocalidad: normalizeName(localidad) });
            }
            
            return match;
        });

        console.log('🏠 ThirdDashboard - Datos filtrados por localidades:', {
            filteredByLocalitiesLength: filteredByLocalities.length,
            sampleData: filteredByLocalities.slice(0, 3).map(row => ({
                patient_department: row.patient_department,
                total_discounted_price: row.total_discounted_price
            }))
        });

        // Actualizar estados filtrados
        setRecetasAuditadasFiltradas(filteredByLocalities.length);
        
        const costoAcumuladoFiltrado: number = filteredByLocalities.reduce((total: number, row: CsvRow): number => {
            const precio: number = parseFloat(row.total_discounted_price || '0');
            return total + precio;
        }, 0);
        setCostoAcumuladoFiltrado(costoAcumuladoFiltrado);
        
        // Calcular recetas sospechosas (usando suspicion_percentage)
        const recetasSospechosasFiltradas: RecetaSospechosa[] = filteredByLocalities
            .filter((row: CsvRow): boolean => {
                const suspicionPercentage: string = row.suspicion_percentage || '0';
                const percentage: number = parseFloat(suspicionPercentage);
                return percentage >= 80;
            })
            .map((row: CsvRow): RecetaSospechosa => ({
                link: row.link || '',
                id: row.patient_id || '',
                patient_department: row.patient_department || '',
                motivoSospecha1: row.motivo_sospecha_1 || '',
                motivoSospecha2: row.motivo_sospecha_2 || '',
                patient_id: row.patient_id || '',
                suspicion_percentage: row.suspicion_percentage || '',
                total_discounted_price: row.total_discounted_price || '',
                timestamp: row.timestamp || '',
            }));
        
        setRecetasSospechosasFiltradas(recetasSospechosasFiltradas);
        
        // Calcular costo promedio por receta
        const costoPromedioRecetaFiltrado: number = filteredByLocalities.length > 0 ? costoAcumuladoFiltrado / filteredByLocalities.length : 0;
        setCostoPromedioRecetaFiltrado(costoPromedioRecetaFiltrado);
        
        // Calcular cantidad de pacientes únicos
        const patientIdsUnicos: Set<string> = new Set();
        filteredByLocalities.forEach((row: CsvRow): void => {
            const patientId: string = row.patient_id || '';
            if (patientId.trim() !== '') {
                patientIdsUnicos.add(patientId);
            }
        });
        setCantidadPacientesRegistradosFiltrado(patientIdsUnicos.size);
        
        // Calcular medicamentos promedio por receta
        const totalMedicamentos: number = filteredByLocalities.reduce((total: number, row: CsvRow): number => {
            const medsCount: string = row.total_meds || row.medication_count || row['Cantidad Med Rx'] || '0';
            const count: number = parseFloat(medsCount);
            return total + count;
        }, 0);
        const medicamentosPromedio: number = filteredByLocalities.length > 0 ? totalMedicamentos / filteredByLocalities.length : 0;
        setCostoPromedioPacienteFiltrado(medicamentosPromedio);
        
        // Calcular envases promedio por receta
        const totalEnvases: number = filteredByLocalities.reduce((total: number, row: CsvRow): number => {
            const unitsCount: string = row.total_units || row.units || row['Cantidad Envases'] || '0';
            const count: number = parseFloat(unitsCount);
            return total + count;
        }, 0);
        const envasesPromedio: number = filteredByLocalities.length > 0 ? totalEnvases / filteredByLocalities.length : 0;
        setEnvasesPromedioRecetaFiltrado(envasesPromedio);
        
        // Calcular recetas con desvios
        const recetasConDesviosCount: number = filteredByLocalities.filter((row: CsvRow): boolean => {
            const suspicionPercentage: string = row.suspicion_percentage || '0';
            const percentage: number = parseFloat(suspicionPercentage);
            return percentage >= 80;
        }).length;
        setRecetasConDesviosFiltrado(recetasConDesviosCount);
        
        // Calcular ahorro estimado filtrado (suma de total_discounted_price de registros con suspicion_percentage >= 80)
        const ahorroEstimadoFiltrado: number = filteredByLocalities.reduce((total: number, row: CsvRow): number => {
            const suspicionPercentage: string = row.suspicion_percentage || '0';
            const percentage: number = parseFloat(suspicionPercentage);
            if (percentage >= 80) {
                const discountedPrice: string = row.total_discounted_price || '0';
                const price: number = parseFloat(discountedPrice);
                return total + price;
            }
            return total;
        }, 0);
        setAhorroEstimadoFiltrado(ahorroEstimadoFiltrado);
        
        // Actualizar datos filtrados para el mapa
        setFilteredBillingData(filteredByLocalities);
        
        console.log('🏠 ThirdDashboard - Estados filtrados actualizados:', {
            recetasAuditadasFiltradas: filteredByLocalities.length,
            costoAcumuladoFiltrado,
            recetasSospechosasFiltradas: recetasSospechosasFiltradas.length,
            costoPromedioRecetaFiltrado,
            cantidadPacientesRegistradosFiltrado: patientIdsUnicos.size,
            costoPromedioPacienteFiltrado: medicamentosPromedio,
            envasesPromedioRecetaFiltrado: envasesPromedio,
            recetasConDesviosFiltrado: recetasConDesviosCount,
            ahorroEstimadoFiltrado
        });
        
    }, [selectedLocalities, data, dateRange, selectedDNIs]);

    // Efecto para escuchar cambios en selectedLocalities
    useEffect((): void => {
        console.log('🏠 ThirdDashboard - selectedLocalities cambió:', selectedLocalities);
        console.log('🏠 ThirdDashboard - Longitud de selectedLocalities:', selectedLocalities.length);
        
        // Si cambian los filtros de localidad, limpiar el estado de localidad clickeada
        if (localidadClickActiva) {
            setLocalidadClickActiva(null);
        }
        
        // Debug: mostrar nombres normalizados para verificar que coincidan con mapUtils
        if (selectedLocalities.length > 0) {
            console.log('🏠 ThirdDashboard - Nombres normalizados:', selectedLocalities.map(name => ({
                original: name,
                normalized: normalizeName(name),
                mappedNames: localityNameMapping[name] || []
            })));
        }
    }, [selectedLocalities, localidadClickActiva]);

    // Efecto para restaurar datos globales cuando no hay localidades seleccionadas
    useEffect((): void => {
        if (data?.data && selectedLocalities.length === 0) {
            // Si no hay localidades seleccionadas, restaurar los datos globales
            const billingData: CsvRow[] = (data.data['billing - Hoja 1.csv'] as CsvRow[]) || [];
            
            // Filtrar por fecha
            const filteredByDate: CsvRow[] = (() => {
                if (!dateRange[0] || !dateRange[1]) {
                    return billingData;
                }

                const start: Date = typeof dateRange[0] === 'string' ? new Date(dateRange[0]) : dateRange[0];
                const end: Date = typeof dateRange[1] === 'string' ? new Date(dateRange[1]) : dateRange[1];

                return billingData.filter((row: CsvRow): boolean => {
                    if (!row.timestamp) return false;
                    const rowDate: Date | null = parseDate(row.timestamp);
                    if (!rowDate) return false;
                    return rowDate >= start && rowDate <= end;
                });
            })();

            // Filtrar por DNI si hay DNIs seleccionados
            const filteredByDNI: CsvRow[] = selectedDNIs.length > 0
                ? filteredByDate.filter((row: CsvRow): boolean => {
                    const patientId: string = row.patient_id || '';
                    return selectedDNIs.includes(patientId);
                })
                : filteredByDate;

            // Restaurar datos globales
            setFilteredBillingData(filteredByDNI);
            setRecetasAuditadasFiltradas(filteredByDNI.length);
            
            const costoTotal: number = filteredByDNI.reduce((total: number, row: CsvRow): number => {
                const discountedPrice: string = row.total_discounted_price || '0';
                const price: number = parseFloat(discountedPrice);
                return total + price;
            }, 0);
            setCostoAcumuladoFiltrado(costoTotal);

            // Restaurar recetas sospechosas globales
            const recetasSospechosasGlobales: RecetaSospechosa[] = filteredByDNI
                .filter((row: CsvRow): boolean => {
                    const suspicionPercentage: string = row.suspicion_percentage || '0';
                    const percentage: number = parseFloat(suspicionPercentage);
                    return percentage >= 80;
                })
                .map((row: CsvRow): RecetaSospechosa => ({
                    link: row.link || '',
                    id: row.patient_id || '',
                    patient_department: row.patient_department || '',
                    motivoSospecha1: row.motivo_sospecha_1 || '',
                    motivoSospecha2: row.motivo_sospecha_2 || '',
                    patient_id: row.patient_id || '',
                    suspicion_percentage: row.suspicion_percentage || '',
                    total_discounted_price: row.total_discounted_price || '',
                    timestamp: row.timestamp || '',
                }));

            setRecetasSospechosasFiltradas(recetasSospechosasGlobales);
            setRecetaActualIndex(0);

            // Restaurar otras métricas globales
            const costoRecetasSospechosas: number = recetasSospechosasGlobales.reduce((total: number, receta: RecetaSospechosa): number => {
                const discountedPrice: string = receta.total_discounted_price || '0';
                const price: number = parseFloat(discountedPrice);
                return total + price;
            }, 0);
            setAhorroEstimadoFiltrado(costoRecetasSospechosas);

            const ahorroTratamiento: number = filteredByDNI.reduce((total: number, row: CsvRow): number => {
                const discountedSavings: string = row.total_discounted_savings || '0';
                const savings: number = parseFloat(discountedSavings);
                return total + savings;
            }, 0);
            setAhorroTratamientoSugeridoFiltrado(ahorroTratamiento);

            const costoPromedio: number = filteredByDNI.length > 0 ? costoTotal / filteredByDNI.length : 0;
            setCostoPromedioRecetaFiltrado(costoPromedio);

            const patientIdsUnicos: Set<string> = new Set();
            filteredByDNI.forEach((row: CsvRow): void => {
                const patientId: string = row.patient_id || '';
                if (patientId.trim() !== '') {
                    patientIdsUnicos.add(patientId);
                }
            });
            setCantidadPacientesRegistradosFiltrado(patientIdsUnicos.size);

            const medicamentosPromedio: number = filteredByDNI.length > 0 ? 
                filteredByDNI.reduce((total: number, row: CsvRow): number => {
                    const medsCount: string = row.total_meds || row.medication_count || row['Cantidad Med Rx'] || '0';
                    const count: number = parseFloat(medsCount);
                    return total + count;
                }, 0) / filteredByDNI.length : 0;
            setCostoPromedioPacienteFiltrado(medicamentosPromedio);

            const envasesPromedio: number = filteredByDNI.length > 0 ? 
                filteredByDNI.reduce((total: number, row: CsvRow): number => {
                    const unitsCount: string = row.total_units || row.units || row['Cantidad Envases'] || '0';
                    const count: number = parseFloat(unitsCount);
                    return total + count;
                }, 0) / filteredByDNI.length : 0;
            setEnvasesPromedioRecetaFiltrado(envasesPromedio);

            const recetasConDesviosCount: number = filteredByDNI.filter((row: CsvRow): boolean => {
                const suspicionPercentage: string = row.suspicion_percentage || '0';
                const percentage: number = parseFloat(suspicionPercentage);
                return percentage >= 80;
            }).length;
            setRecetasConDesviosFiltrado(recetasConDesviosCount);
        }
    }, [selectedLocalities, data, dateRange, selectedDNIs]);

    function formatTotal(num: number): string {
        return num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    const recetasAuditadasDeLocalidad: RecetaAuditada[] = (() => {
        const geoBillingData: CsvRow[] = (data?.data ? (data.data['GeoBilling - Hoja 1.csv'] as CsvRow[]) || [] : []) || [];

        // Agrupar por department y product para contar las veces prescripto
        const medicamentosAgrupados: Map<string, {
            localidad: string;
            medicamento: string;
            montoTotal: number;
            vecesPrescripto: number;
        }> = new Map<string, { localidad: string; medicamento: string; montoTotal: number; vecesPrescripto: number }>();

        geoBillingData.forEach((row: CsvRow): void => {
            const localidad: string = row.department || '';
            const medicamento: string = row.product || '';
            const precio: number = parseFloat(row.total_discounted_price || '0');
            const cantidad: number = parseFloat(row.quantity || '0');

            // Crear clave única para localidad + medicamento
            const clave: string = `${localidad}-${medicamento}`;

            if (medicamentosAgrupados.has(clave)) {
                // Si ya existe, incrementar el contador y sumar el precio
                const existente: {
                    localidad: string;
                    medicamento: string;
                    montoTotal: number;
                    vecesPrescripto: number;
                } = medicamentosAgrupados.get(clave)!;
                existente.vecesPrescripto += cantidad;
                existente.montoTotal += precio;
            } else {
                // Si no existe, crear nueva entrada
                medicamentosAgrupados.set(clave, {
                    localidad,
                    medicamento,
                    montoTotal: precio,
                    vecesPrescripto: cantidad
                });
            }
        });

        // Convertir el Map a array de RecetaAuditada
        const resultado: RecetaAuditada[] = Array.from(medicamentosAgrupados.values()).map((item): RecetaAuditada => ({
            localidad: item.localidad,
            medicamento: item.medicamento,
            montoTotal: item.montoTotal,
            vecesPrescripto: item.vecesPrescripto,
            patient_id: '', // No aplica para este dataset
            suspicion_percentage: '0' // No aplica para este dataset
        }));

        // Filtrar por localidades seleccionadas si hay filtro aplicado
        if (selectedLocalities.length > 0) {
            return resultado.filter((receta: RecetaAuditada): boolean => {
                // Extraer el nombre principal de la localidad en los datos
                const mainLocalityName = extractMainLocalityName(receta.localidad);
                const localidadRecetaNormalizada: string = normalizeName(mainLocalityName);
                
                // Verificar si la localidad del row coincide con alguna de las seleccionadas
                return selectedLocalities.some((selectedLocality: string): boolean => {
                    const selectedNormalized: string = normalizeName(extractMainLocalityName(selectedLocality));
                    return localidadRecetaNormalizada === selectedNormalized;
                });
            });
        }

        return resultado;
    })();

    // Función para extraer el nombre principal de la localidad
    function extractMainLocalityName(fullName: string): string {
        if (!fullName) return '';

        // Si contiene comas, tomar solo la primera parte
        if (fullName.includes(',')) {
            return fullName.split(',')[0].trim();
        }

        return fullName;
    }

    function normalizeName(name: string): string {
        if (!name) return '';

        let nombrePrincipal: string = name;
        if (name.includes(',')) {
            nombrePrincipal = name.split(',')[0].trim();
        }

        // Usar la misma lógica que mapUtils para que coincidan los nombres normalizados
        return nombrePrincipal
            .toLowerCase() // Convertir a minúsculas (como mapUtils)
            .normalize('NFD') // Normalizar caracteres Unicode
            .replace(/[\u0300-\u036f]/g, '') // Remover acentos y diacríticos
            .replace(/[.,;:!?()[\]{}]/g, '') // Remover puntuación
            .replace(/['"`]/g, '') // Remover comillas
            .replace(/[-_]/g, ' ') // Convertir guiones y guiones bajos a espacios
            .replace(/\s+/g, '') // Remover todos los espacios
            .trim();
    }

    const handleLocalidadClick = (localidad: string): void => {
        console.log('🏠 ThirdDashboard - Click en localidad:', localidad);
        console.log('🏠 ThirdDashboard - Localidades actuales antes del click:', selectedLocalities);

        // Click en mapa: solo filtrar datos para mostrar en los divs, NO afectar el pintado del mapa
        // Buscar la localidad en el mapeo para encontrar el nombre del filtro correspondiente
        let localidadFiltro: string | null = null;
        for (const [filterName, mapNames] of Object.entries(localityNameMapping)) {
            if (mapNames.includes(normalizeName(localidad))) {
                localidadFiltro = filterName;
                break;
            }
        }
        
        if (localidadFiltro) {
            console.log('🏠 ThirdDashboard - Localidad encontrada en mapeo:', localidadFiltro);
            
            // Marcar esta localidad como activa por click
            setLocalidadClickActiva(localidadFiltro);
            
            // Filtrar datos para esta localidad específica
            if (data?.data) {
                const billingData: CsvRow[] = (data.data['billing - Hoja 1.csv'] as CsvRow[]) || [];
                
                // Filtrar por fecha y DNI primero
                const filteredByDateAndDNI = billingData.filter((row: CsvRow): boolean => {
                    const fecha: string = row.timestamp || '';
                    const dni: string = row.patient_id || '';
                    
                    if (!fecha || !dni) return false;
                    
                    const parsedDate: Date | null = parseDate(fecha);
                    if (!parsedDate) return false;
                    
                    if (!dateRange[0] || !dateRange[1]) return true;
                    
                    const start: Date = typeof dateRange[0] === 'string' ? new Date(dateRange[0]) : dateRange[0];
                    const end: Date = typeof dateRange[1] === 'string' ? new Date(dateRange[1]) : dateRange[1];
                    
                    const isInDateRange: boolean = parsedDate >= start && parsedDate <= end;
                    const isInDNIFilter: boolean = selectedDNIs.length === 0 || selectedDNIs.includes(dni);
                    
                    return isInDateRange && isInDNIFilter;
                });
                
                // Filtrar por la localidad específica del click
                const filteredByClickLocality = filteredByDateAndDNI.filter((row: CsvRow): boolean => {
                    const localidad: string = row.patient_department || '';
                    if (!localidad) return false;
                    
                    return normalizeName(localidad) === normalizeName(localidadFiltro);
                });
                
                console.log('🏠 ThirdDashboard - Datos filtrados por click en localidad:', {
                    localidadClick: localidad,
                    localidadFiltro,
                    datosFiltrados: filteredByClickLocality.length
                });
                
                // Actualizar los divs con los datos filtrados de esta localidad
                // Usar los estados globales para mostrar los datos filtrados
                setRecetasAuditadas(filteredByClickLocality.length);
                setCostoAcumulado(filteredByClickLocality.reduce((total: number, row: CsvRow): number => {
                    const precio: number = parseFloat(row.total_discounted_price || '0');
                    return total + precio;
                }, 0));
                
                // Calcular recetas sospechosas para esta localidad
                const recetasSospechosasClick: RecetaSospechosa[] = filteredByClickLocality
                    .filter((row: CsvRow): boolean => {
                        const suspicionPercentage: string = row.suspicion_percentage || '0';
                        const percentage: number = parseFloat(suspicionPercentage);
                        return percentage >= 80;
                    })
                    .map((row: CsvRow): RecetaSospechosa => ({
                        link: row.link || '',
                        id: row.patient_id || '',
                        patient_department: row.patient_department || '',
                        motivoSospecha1: row.motivo_sospecha_1 || '',
                        motivoSospecha2: row.motivo_sospecha_2 || '',
                        patient_id: row.patient_id || '',
                        suspicion_percentage: row.suspicion_percentage || '',
                        total_discounted_price: row.total_discounted_price || '',
                        timestamp: row.timestamp || '',
                    }));
                
                setRecetasSospechosasFiltradas(recetasSospechosasClick);
                setRecetaActualIndex(0);
                
                // Calcular ahorro estimado para esta localidad
                const ahorroEstimadoClick: number = filteredByClickLocality.reduce((total: number, row: CsvRow): number => {
                    const suspicionPercentage: string = row.suspicion_percentage || '0';
                    const percentage: number = parseFloat(suspicionPercentage);
                    if (percentage >= 80) {
                        const discountedPrice: string = row.total_discounted_price || '0';
                        const price: number = parseFloat(discountedPrice);
                        return total + price;
                    }
                    return total;
                }, 0);
                setAhorroEstimado(ahorroEstimadoClick);
                
                // Calcular ahorro de tratamiento sugerido para esta localidad
                const ahorroTratamientoClick: number = filteredByClickLocality.reduce((total: number, row: CsvRow): number => {
                    const discountedSavings: string = row.total_discounted_savings || '0';
                    const savings: number = parseFloat(discountedSavings);
                    return total + savings;
                }, 0);
                setAhorroTratamientoSugerido(ahorroTratamientoClick);
                
                // Calcular costo promedio por receta para esta localidad
                const costoTotalClick: number = filteredByClickLocality.reduce((total: number, row: CsvRow): number => {
                    const discountedPrice: string = row.total_discounted_price || '0';
                    const price: number = parseFloat(discountedPrice);
                    return total + price;
                }, 0);
                const costoPromedioClick: number = filteredByClickLocality.length > 0 ? costoTotalClick / filteredByClickLocality.length : 0;
                setCostoPromedioReceta(costoPromedioClick);
                
                // Calcular cantidad de pacientes únicos para esta localidad
                const patientIdsUnicosClick: Set<string> = new Set();
                filteredByClickLocality.forEach((row: CsvRow): void => {
                    const patientId: string = row.patient_id || '';
                    if (patientId.trim() !== '') {
                        patientIdsUnicosClick.add(patientId);
                    }
                });
                setCantidadPacientesRegistrados(patientIdsUnicosClick.size);
                
                // Calcular medicamentos promedio por receta para esta localidad
                const totalMedicamentosClick: number = filteredByClickLocality.reduce((total: number, row: CsvRow): number => {
                    const medsCount: string = row.total_meds || row.medication_count || row['Cantidad Med Rx'] || '0';
                    const count: number = parseFloat(medsCount);
                    return total + count;
                }, 0);
                const medicamentosPromedioClick: number = filteredByClickLocality.length > 0 ? totalMedicamentosClick / filteredByClickLocality.length : 0;
                setCostoPromedioPaciente(medicamentosPromedioClick);
                
                // Calcular envases promedio por receta para esta localidad
                const totalEnvasesClick: number = filteredByClickLocality.reduce((total: number, row: CsvRow): number => {
                    const unitsCount: string = row.total_units || row.units || row['Cantidad Envases'] || '0';
                    const count: number = parseFloat(unitsCount);
                    return total + count;
                }, 0);
                const envasesPromedioClick: number = filteredByClickLocality.length > 0 ? totalEnvasesClick / filteredByClickLocality.length : 0;
                setEnvasesPromedioReceta(envasesPromedioClick);
                
                // Calcular recetas con desvios para esta localidad
                const recetasConDesviosClick: number = filteredByClickLocality.filter((row: CsvRow): boolean => {
                    const suspicionPercentage: string = row.suspicion_percentage || '0';
                    const percentage: number = parseFloat(suspicionPercentage);
                    return percentage >= 80;
                }).length;
                setRecetasConDesvios(recetasConDesviosClick);
                
                // Actualizar datos filtrados para el mapa (pero NO afectar el pintado)
                setFilteredBillingData(filteredByClickLocality);
                
                console.log('🏠 ThirdDashboard - Divs actualizados con datos de localidad clickeada:', {
                    recetasAuditadas: filteredByClickLocality.length,
                    costoAcumulado: costoTotalClick,
                    recetasSospechosas: recetasSospechosasClick.length,
                    ahorroEstimado: ahorroEstimadoClick,
                    ahorroTratamiento: ahorroTratamientoClick,
                    costoPromedio: costoPromedioClick,
                    cantidadPacientes: patientIdsUnicosClick.size,
                    medicamentosPromedio: medicamentosPromedioClick,
                    envasesPromedio: envasesPromedioClick,
                    recetasConDesvios: recetasConDesviosClick
                });
            }
        } else {
            console.log('🏠 ThirdDashboard - Localidad no encontrada en mapeo:', localidad);
        }
    };

    const navegarReceta = (direction: 'anterior' | 'siguiente'): void => {
        const recetasActuales = localidadClickActiva ? recetasSospechosasFiltradas : recetasSospechosasFiltradas;
        
        if (recetasActuales.length === 0) return;

        if (direction === 'anterior') {
            setRecetaActualIndex((prev: number): number =>
                prev === 0 ? recetasActuales.length - 1 : prev - 1
            );
        } else {
            setRecetaActualIndex((prev: number): number =>
                prev === recetasActuales.length - 1 ? 0 : prev + 1
            );
        }
    };

    if (error) {
        return (
            <>
                <Subheader />

                <div className={styles.parent}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '50vh',
                        fontSize: '1.2rem',
                        color: '#dc3545'
                    }}>
                        Error al cargar datos: {error}
                    </div>
                </div>
            </>
        );
    }

    if (isLoading) {
        return (
            <>
                <Subheader />
                <div className={styles.parent}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '50vh',
                        fontSize: '1.2rem',
                        color: '#666'
                    }}>
                        Cargando datos...
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <div className={styles.parent}>
                <div className={`${styles["grid-item"]} ${styles.div1}`}>
                    <span className={styles["subtitle"]} style={{ textAlign: 'start' }}>Recetas Auditadas:</span>
                    <div className={styles["icon-quantity-div"]}>
                        <IconSpreadsheet />
                        <span className={styles["quantityXl"]}>
                            {localidadClickActiva ? recetasAuditadas : (selectedLocalities.length > 0 ? recetasAuditadasFiltradas : recetasAuditadas)}
                        </span>
                    </div>
                </div>
                <div className={`${styles["grid-item"]} ${styles.div2}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className={styles["subtitle"]}>Costo Acumulado:</span>
                        <IconMoneyCoins style={{ height: '2.3rem' }} />
                    </div>
                    <span className={styles["quantity"]}>
                        $ {formatTotal(localidadClickActiva ? costoAcumulado : (selectedLocalities.length > 0 ? costoAcumuladoFiltrado : costoAcumulado)).split(',')[0]}
                    </span>
                </div>
                <div className={`${styles["grid-item"]} ${styles.div3}`}>
                    <span className={styles["subtitle"]} style={{ textAlign: 'start' }}>Recetas con Desvios:</span>
                    <div className={styles["icon-quantity-div"]}>
                        <IconDanger style={{ marginRight: '0.5rem' }} />
                        <span className={styles["quantityXl"]}>
                            {localidadClickActiva ? recetasConDesvios : (selectedLocalities.length > 0 ? recetasConDesviosFiltrado : recetasConDesvios)}
                        </span>
                    </div>
                </div>
                <div className={`${styles["grid-item"]} ${styles.div4}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className={styles["subtitle"]} style={{ textAlign: 'start' }}>Costo Recetas con<br />  Desvios:</span>
                        <IconMoney style={{ height: '2.2rem' }} />
                    </div>
                    <span className={styles["quantity"]}>$ {formatTotal(localidadClickActiva ? ahorroEstimado : (selectedLocalities.length > 0 ? ahorroEstimadoFiltrado : ahorroEstimado)).split(',')[0]}</span>
                </div>
                <div className={`${styles["grid-item"]} ${styles.div5}`}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                        <div className={styles["container"]} style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', width: '100%' }}>
                                <span className={styles["subtitle"]} style={{ minWidth: '100px', paddingLeft: '2rem' }}>
                                    Ahorro tratamientos<br />sugeridos:
                                </span>
                                <IconRecipeMoney style={{ height: '2rem' }} />
                            </div>
                            <span className={styles["quantity"]}>
                                $ {formatTotal(localidadClickActiva ? ahorroTratamientoSugerido : (selectedLocalities.length > 0 ? ahorroTratamientoSugeridoFiltrado : ahorroTratamientoSugerido)).split(',')[0]}
                            </span>
                        </div>

                        <div className={styles["container"]} style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', width: '100%' }}>
                                <span className={styles["subtitle"]} style={{ minWidth: '100px', paddingLeft: '2rem' }}>
                                    Costo Promedio<br />por Receta:
                                </span>
                                <IconRecipe style={{ height: '2rem' }} />
                            </div>
                            <span className={styles["quantity"]} style={{ color: '#ff0000' }}>
                                $ {formatTotal(localidadClickActiva ? costoPromedioReceta : (selectedLocalities.length > 0 ? costoPromedioRecetaFiltrado : costoPromedioReceta)).split(',')[0]}
                            </span>
                        </div>
                    </div>
                </div>

                <div className={`${styles["grid-item"]} ${styles.div6}`}>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            gap: '1rem',
                            width: '100%',
                            height: '100%',
                            alignItems: 'center'
                        }}
                    >
                        <div className={styles["container"]}>
                            <span className={styles["tiny-subtitle"]}>
                                Cantidad de<br />Afiliados Registrados:
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <IconPeople style={{ height: '2rem' }} />
                                <span className={styles["users-registered-quantity"]}>
                                    {localidadClickActiva ? cantidadPacientesRegistrados : (selectedLocalities.length > 0 ? cantidadPacientesRegistradosFiltrado : cantidadPacientesRegistrados)}
                                </span>
                                <span></span>
                            </div>
                        </div>

                        <div className={styles["container"]}>
                            <span className={styles["tiny-subtitle"]}>
                                Medicamentos<br />Promedio por Receta:
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <IconDrug style={{ height: '2rem' }} />
                                <span className={styles["tiny-quantity"]} style={{ color: '#ff0000' }}>
                                    {parseFloat(formatTotal(localidadClickActiva ? costoPromedioPaciente : (selectedLocalities.length > 0 ? costoPromedioPacienteFiltrado : costoPromedioPaciente)).replace(',', '.')).toFixed(1)}
                                </span>
                            </div>
                        </div>

                        <div className={styles["container"]}>
                            <span className={styles["tiny-subtitle"]}>
                                Envases Promedio<br />por Receta:
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <IconDrug style={{ height: '2.2rem' }} />
                                <span className={styles["tiny-quantity"]} style={{ color: '#ff0000' }}>
                                    {parseFloat(formatTotal(localidadClickActiva ? envasesPromedioReceta : (selectedLocalities.length > 0 ? envasesPromedioRecetaFiltrado : envasesPromedioReceta)).replace(',', '.')).toFixed(1)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`${styles["grid-item"]} ${styles.div7}`} style={{ backgroundColor: '#b5cdf3ff', position: 'relative' }}>
                    <div>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', lineHeight: '1.2', marginBottom: '1rem', color: '#000F' }}>
                            Recetas Sospechosas:
                        </span>

                        {recetasSospechosasFiltradas.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', position: 'absolute', right: '0', bottom: '0', marginRight: '0.5rem' }}>
                                <a
                                    href="#"
                                    onClick={(e: React.MouseEvent<HTMLAnchorElement>): void => {
                                        e.preventDefault();
                                        navegarReceta('anterior');
                                    }}
                                    style={{
                                        color: '#007bff',
                                        textDecoration: 'none',
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        display: 'flex',
                                    }}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="30"
                                        height="30"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="icon icon-tabler icons-tabler-outline icon-tabler-chevron-left">
                                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                        <path d="M15 6l-6 6l6 6" />
                                    </svg>
                                </a>
                                <span style={{ fontSize: '1rem', color: '#666' }}>
                                    {recetaActualIndex + 1} de {recetasSospechosasFiltradas.length}
                                </span>
                                <a
                                    href="#"
                                    onClick={(e: React.MouseEvent<HTMLAnchorElement>): void => {
                                        e.preventDefault();
                                        navegarReceta('siguiente');
                                    }}
                                    style={{
                                        color: '#007bff',
                                        textDecoration: 'none',
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        display: 'flex'
                                    }}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="30"
                                        height="30"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="icon icon-tabler icons-tabler-outline icon-tabler-chevron-right">
                                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                        <path d="M9 6l6 6l-6 6" />
                                    </svg>
                                </a>
                            </div>
                        )}
                    </div>

                    {recetasSospechosasFiltradas.length > 0 ? (
                        <div style={{
                            display: 'flex',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            <div>
                                <ul style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '.6rem',
                                    backgroundColor: '#fafafa',
                                    padding: '.5rem',
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    borderRadius: '.5rem',
                                    marginRight: '.5rem',
                                }}>
                                    <li>Link Receta</li>
                                    <li>Num Beneficiario</li>
                                    <li>Localidad</li>
                                    <li>Sospecha 1</li>
                                    <li>Sospecha 2</li>
                                </ul>
                            </div>
                            <div>
                                <ul style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.65rem',
                                    padding: '0.3rem',
                                    fontSize: '1rem',
                                }}>
                                    <li>
                                        <a
                                            href={recetasSospechosasFiltradas[recetaActualIndex].link}
                                            target="_blank"
                                        >
                                            {recetasSospechosasFiltradas[recetaActualIndex].link}
                                        </a>
                                    </li>
                                    <li>{recetasSospechosasFiltradas[recetaActualIndex].id || 'No provee'}</li>
                                    <li>{recetasSospechosasFiltradas[recetaActualIndex].patient_department || 'No provee'}</li>
                                    <li>{recetasSospechosasFiltradas[recetaActualIndex].motivoSospecha1 || 'No provee'}</li>
                                    <li>{recetasSospechosasFiltradas[recetaActualIndex].motivoSospecha2 || 'No provee'}</li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '200px',
                            color: '#666',
                            fontSize: '1rem'
                        }}>
                            {localidadClickActiva 
                                ? `No hay recetas sospechosas en ${localidadClickActiva}`
                                : selectedLocalities.length > 0
                                    ? `No hay recetas sospechosas en las localidades seleccionadas`
                                    : 'No hay recetas sospechosas'
                            }
                        </div>
                    )}
                </div>
                <div className={styles.div8}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                        <LocalityFilter />
                        <DNIFilter />
                        {localidadClickActiva && (
                            <div style={{
                                backgroundColor: '#e3f2fd',
                                border: '1px solid #2196f3',
                                borderRadius: '4px',
                                padding: '8px 12px',
                                fontSize: '0.9rem',
                                color: '#1976d2',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span>📍 Mostrando datos de: {localidadClickActiva}</span>
                                <button
                                    onClick={() => {
                                        setLocalidadClickActiva(null);
                                        // Restaurar datos globales
                                        if (data?.data) {
                                            const billingData: CsvRow[] = (data.data['billing - Hoja 1.csv'] as CsvRow[]) || [];
                                            setFilteredBillingData(billingData);
                                        }
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#1976d2',
                                        cursor: 'pointer',
                                        fontSize: '1.2rem',
                                        padding: '0',
                                        margin: '0'
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>
                    <MapView
                        onLocalityClick={handleLocalidadClick}
                        billingData={filteredBillingData}
                        selectedLocalities={selectedLocalities}
                    />
                </div>
                <div className={`
                    ${styles["grid-item"]} ${styles.div9}
                `}>
                    <div style={{ maxHeight: '100%', textAlign: 'center', overflowY: 'auto', scrollbarColor: '#202020 #d6d4d4', background: 'rgba(244, 244, 244, 0.7)', borderRadius: '.3rem' }}>
                        <table className='striped-table' style={{ borderCollapse: 'collapse', borderSpacing: '0 0.2rem', width: '100%', textAlign: 'center' }}>
                            <thead>
                                <tr style={{ fontSize: '1.2rem', position: 'sticky', top: 0, zIndex: 2, backgroundColor: '#91b6f2ff', textAlign: 'center' }}>
                                    <th>Localidad</th>
                                    <th>Marca del Medicamento</th>
                                    <th>Cantidad</th>
                                    <th>Monto Total</th>
                                </tr>
                            </thead>
                            <tbody style={{ fontSize: '1.1rem' }}>
                                {recetasAuditadasDeLocalidad.map((receta: RecetaAuditada, index: number): React.JSX.Element => (
                                    <tr key={index}>
                                        <td>{receta.localidad.split(',')[0]}</td>
                                        <td style={{ textTransform: 'capitalize' }}>{receta.medicamento}</td>
                                        <td>{receta.vecesPrescripto}</td>
                                        <td>{`$ ${formatTotal(receta.montoTotal)}`}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export { ThirdDashboard };