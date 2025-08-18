//---------------------------------------------------------------------------------------------------------------------------

import type {
    MedicationRow,
    SumsByLocality,
    MinMaxValues,
    CsvRow
} from '../types';

//---------------------------------------------------------------------------------------------------------------------------

const CHOROPLETH_COLORS: readonly string[] = [
    '#fff7de',
    '#ffd59e',
    '#fc9272',
    '#de2d26',
    '#8f0101',
    '#4d0000'
] as const;

const cleanNumber = (str: string): number | null => {
    if (!str) {
        return null;
    }
    const cleaned: string = str.replace(/\./g, '').replace(/,/g, '.');
    return parseFloat(cleaned);
}

// Comentario: El mapeo manual se eliminó en favor de la normalización automática

// Comentario: Función eliminada - ahora solo pintamos localidades que están en los datos

// Función de normalización robusta que transforma nombres de manera consistente
const normalizeName = (name: string): string => {
    if (!name) return '';

    return name
        .toLowerCase() // Convertir a minúsculas
        .normalize('NFD') // Normalizar caracteres Unicode
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos y diacríticos
        .replace(/[.,;:!?()[\]{}]/g, '') // Remover puntuación
        .replace(/['"`]/g, '') // Remover comillas
        .replace(/[-_]/g, ' ') // Convertir guiones y guiones bajos a espacios
        .replace(/\s+/g, '') // Remover todos los espacios
        .trim();
}

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

// Función para encontrar la mejor coincidencia entre un nombre y una lista de nombres disponibles
const findBestMatch = (targetName: string, availableNames: string[]): string | null => {
    const normalizedTarget: string = normalizeName(targetName);

    // Buscar coincidencia exacta primero
    const exactMatch: string | undefined = availableNames.find((name: string) => normalizeName(name) === normalizedTarget);
    if (exactMatch) {
        return exactMatch;
    }

    // Si no hay coincidencia exacta, buscar en el mapeo
    for (const [filterName, mapNames] of Object.entries(localityNameMapping)) {
        if (mapNames.includes(normalizedTarget)) {
            // Verificar si el nombre del filtro está en las localidades seleccionadas
            const filterNameNormalized: string = normalizeName(filterName);
            const match: string | undefined = availableNames.find((name: string) => normalizeName(name) === filterNameNormalized);
            if (match) {
                return match;
            }
        }
    }

    // Si no hay coincidencia, retornar null
    return null;
}

const formatTotal = (num: number): string => {
    return num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const getColorIntervals = (min: number, max: number): readonly number[] => {
    // Si min <= 0, lo subimos a 1 para evitar log(0)
    const safeMin: number = min > 0 ? min : 1;
    const safeMax: number = max > 0 ? max : 1;
    const logMin: number = Math.log(safeMin);
    const logMax: number = Math.log(safeMax);
    const step: number = (logMax - logMin) / 5;
    return [
        Math.exp(logMin + step),
        Math.exp(logMin + 2 * step),
        Math.exp(logMin + 3 * step),
        Math.exp(logMin + 4 * step)
    ] as const;
}

const getColor = (value: number, min: number, max: number): string => {
    if (value == null || isNaN(value)) {
        return '#ccc';
    }
    if (max === min) {
        return CHOROPLETH_COLORS[CHOROPLETH_COLORS.length - 1];
    }

    const intervals: readonly number[] = getColorIntervals(min, max);

    if (value <= intervals[0]) {
        return CHOROPLETH_COLORS[0];
    }
    if (value <= intervals[1]) {
        return CHOROPLETH_COLORS[1];
    }
    if (value <= intervals[2]) {
        return CHOROPLETH_COLORS[2];
    }
    if (value <= intervals[3]) {
        return CHOROPLETH_COLORS[3];
    }
    if (value <= intervals[4]) {
        return CHOROPLETH_COLORS[4];
    }
    return CHOROPLETH_COLORS[5];
}

const processMedicationData = (data: MedicationRow[]): {
    sums: SumsByLocality;
    minMax: MinMaxValues;
} => {
    if (data.length === 0) {
        return { sums: {}, minMax: { min: 0, max: 0 } };
    }

    const grouped: Record<string, number[]> = {};

    data.forEach((row: MedicationRow): void => {
        const municipio: string = normalizeName((row.departamento || row.localidad || ''));
        const val: number | null = cleanNumber(row["Precio c/ Env"]);
        if (!municipio || val === null || isNaN(val)) return;
        if (!grouped[municipio]) grouped[municipio] = [];
        grouped[municipio].push(val);
    });

    const sums: SumsByLocality = {};
    let min: number = Infinity;
    let max: number = -Infinity;

    Object.entries(grouped).forEach(([municipio, arr]: [string, number[]]): void => {
        const suma: number = arr.reduce((a: number, b: number): number => a + b, 0);
        sums[municipio] = suma;
        if (suma < min) min = suma;
        if (suma > max) max = suma;
    });

    return { sums, minMax: { min, max } };
}

const processBillingData = (data: CsvRow[]): {
    sums: SumsByLocality;
    minMax: MinMaxValues;
} => {
    if (data.length === 0) {
        return { sums: {}, minMax: { min: 0, max: 0 } };
    }

    const grouped: Record<string, number[]> = {};
    const debugInfo: string[] = [];
    const uniqueLocalities: Set<string> = new Set();

    // Obtener todas las localidades RAW del store
    const rawLocalitiesFromStore: Set<string> = new Set<string>();
    data.forEach((row: CsvRow): void => {
        const rawMunicipio: string = row.patient_department || '';
        if (rawMunicipio) {
            rawLocalitiesFromStore.add(rawMunicipio);
        }
    });

    data.forEach((row: CsvRow): void => {
        const rawMunicipio: string = row.patient_department || '';
        // Extraer el nombre principal de la localidad antes de normalizar
        const mainLocalityName: string = extractMainLocalityName(rawMunicipio);
        const municipio: string = normalizeName(mainLocalityName);
        const val: number | null = cleanNumber(row.total_discounted_price || '0');

        uniqueLocalities.add(rawMunicipio);

        if (!municipio || val === null || isNaN(val)) {
            debugInfo.push(`Skipped: ${rawMunicipio} -> ${mainLocalityName} -> ${municipio}, value: ${val}`);
            return;
        }

        if (!grouped[municipio]) grouped[municipio] = [];
        grouped[municipio].push(val);
        debugInfo.push(`Added: ${rawMunicipio} -> ${mainLocalityName} -> ${municipio}, value: ${val}`);
    });

    const sums: SumsByLocality = {};
    let min: number = Infinity;
    let max: number = -Infinity;

    Object.entries(grouped).forEach(([municipio, arr]: [string, number[]]): void => {
        const suma: number = arr.reduce((a: number, b: number): number => a + b, 0);
        sums[municipio] = suma;
        if (suma < min) min = suma;
        if (suma > max) max = suma;
    });

    return { sums, minMax: { min, max } };
}

// Función para extraer el nombre principal de la localidad
export const extractMainLocalityName = (fullName: string): string => {
    if (!fullName) return '';

    // Si contiene comas, tomar solo la primera parte
    if (fullName.includes(',')) {
        return fullName.split(',')[0].trim();
    }

    return fullName;
};

// Función para determinar si es una entidad administrativa pura
const isPureAdministrativeEntity = (name: string): boolean => {
    const pureAdministrativeEntities: string[] = [
        'Buenos Aires', 'Provincia de Buenos Aires', 'Ciudad Autónoma de Buenos Aires',
        'Provincia', 'Province', 'State', 'Departamento', 'Department'
    ];

    // Verificar si el nombre es exactamente una entidad administrativa pura
    return pureAdministrativeEntities.some((entity: string): boolean =>
        name.toLowerCase().trim() === entity.toLowerCase()
    );
};

// Set estático para rastrear localidades ya pintadas
const paintedLocalities = new Set<string>();

const getFeatureStyle = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    feature: any,
    sums: SumsByLocality,
    minMax: MinMaxValues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> => {
    if (!feature) return {};

    const rawDepartamento: string = String(feature.properties?.departamento || feature.properties?.name || feature.properties?.nam || '');

    // Extraer el nombre principal de la localidad
    const mainLocalityName: string = extractMainLocalityName(rawDepartamento);
    const normalizedName: string = normalizeName(mainLocalityName);



    // Si ya pintamos esta localidad, retornar transparente
    if (paintedLocalities.has(normalizedName)) {
        return {
            fillColor: 'transparent',
            weight: 1,
            opacity: 0.3,
            color: '#cccccc',
            dashArray: '3',
            fillOpacity: 0,
        };
    }

    // Si es una entidad administrativa pura, excluirla
    if (isPureAdministrativeEntity(mainLocalityName)) {
        return {
            fillColor: 'transparent',
            weight: 1,
            opacity: 0.3,
            color: '#cccccc',
            dashArray: '3',
            fillOpacity: 0,
        };
    }

    // También filtrar nombres que son muy genéricos o parecen ser provincias
    const isGenericName: boolean = mainLocalityName.length < 3 ||
        mainLocalityName.toLowerCase().includes('provincia') ||
        mainLocalityName.toLowerCase().includes('province') ||
        mainLocalityName.toLowerCase().includes('state');

    // Filtrar provincias argentinas específicas
    const argentineProvinces: string[] = [
        'La Rioja', 'San Luis', 'San Juan', 'Mendoza', 'La Pampa', 'Santa Fe',
        'Santiago del Estero', 'Catamarca', 'Río Negro', 'Chubut', 'Santa Cruz',
        'Tierra del Fuego', 'Entre Ríos', 'Corrientes', 'Misiones', 'Chaco',
        'Jujuy', 'Tucumán', 'Neuquén', 'Salta', 'Formosa'
    ];

    const isArgentineProvince = argentineProvinces.some((province: string): boolean =>
        mainLocalityName.toLowerCase().includes(province.toLowerCase())
    );

    if (isGenericName || isArgentineProvince) {
        return {
            fillColor: 'transparent',
            weight: 1,
            opacity: 0.3,
            color: '#cccccc',
            dashArray: '3',
            fillOpacity: 0,
        };
    }

    // Si no hay datos disponibles, todas las localidades deben ser transparentes
    if (Object.keys(sums).length === 0) {
        return {
            fillColor: 'transparent',
            weight: 1,
            opacity: 0.3,
            color: '#cccccc',
            dashArray: '3',
            fillOpacity: 0,
        };
    }
    
    // Lógica de filtrado:
    // - Si NO hay localidades seleccionadas: mostrar TODAS las localidades (comportamiento por defecto)
    // - Si HAY localidades seleccionadas: mostrar TODAS las localidades también (no despintar)
    let bestMatch: string | null = null;
    
    // Siempre buscar coincidencia en todos los datos disponibles para mantener el mapa pintado
    bestMatch = findBestMatch(mainLocalityName, Object.keys(sums));
    
    // Si no hay coincidencia, la localidad debe ser transparente
    if (!bestMatch) {
        return {
            fillColor: 'transparent',
            weight: 1,
            opacity: 0.3,
            color: '#cccccc',
            dashArray: '3',
            fillOpacity: 0,
        };
    }

    // Obtener el valor para la localidad encontrada
    const value: number = sums[bestMatch];

    // Si el valor es inválido o cero, la localidad debe ser transparente
    if (value === undefined || value === null || isNaN(value) || value <= 0) {
        return {
            fillColor: 'transparent',
            weight: 1,
            opacity: 0.3,
            color: '#cccccc',
            dashArray: '3',
            fillOpacity: 0,
        };
    }

    // Si hay datos, pintar según el valor
    const color: string = getColor(value, minMax.min, minMax.max);

    // Marcar esta localidad como pintada
    paintedLocalities.add(normalizedName);

    return {
        fillColor: color,
        weight: 1,
        opacity: 1,
        color: '#060606ff',
        dashArray: '3',
        fillOpacity: 0.3,
    };
};

// Función para resetear el estado de pintado (llamar antes de procesar nuevos datos)
export const resetPaintingState = (): void => {
    paintedLocalities.clear();
};





export { cleanNumber, normalizeName, formatTotal, processMedicationData, processBillingData, getFeatureStyle, findBestMatch };