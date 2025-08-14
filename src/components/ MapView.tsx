//---------------------------------------------------------------------------------------------------------------------------

import React, { useEffect, useState, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { Layer, LatLngExpression } from "leaflet";
import { MapContainer, TileLayer, GeoJSON, Marker } from "react-leaflet";
import type { Feature, FeatureCollection, Geometry, Position } from 'geojson';
import {
    processBillingData,
    getFeatureStyle,
    normalizeName,
    formatTotal,
    findBestMatch,
    extractMainLocalityName,
    resetPaintingState
} from "../utils/mapUtils";
import { useS3DataStore } from "../stores/s3DataStore";
import type {
    SumsByLocality,
    GeoJsonProperties,
    MinMaxValues,
    LabelData,
    MapProps,
    PolygonLabelsProps
} from "../types";

//---------------------------------------------------------------------------------------------------------------------------

const PolygonLabels = ({ geojson, sums, hoveredMunicipality }: PolygonLabelsProps): React.JSX.Element => {
    // TODO: HACER TYPE-SAFE, AJUSTAR DETALLES

    const [labels, setLabels] = useState<LabelData[]>([]);

    useEffect((): void => {
        if (!geojson) return;

        const newLabels: LabelData[] = [];
        const processedNames = new Set<string>(); // Para evitar duplicados

        // Aplicar los mismos filtros que en el mapa principal
        const filteredFeatures = geojson.features.filter(
            (f: any): boolean =>
                f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'
        );

        // Función para determinar si es una entidad administrativa pura
        const isPureAdministrativeEntity = (name: string): boolean => {
            const pureAdministrativeEntities = [
                'Buenos Aires', 'Provincia de Buenos Aires', 'Ciudad Autónoma de Buenos Aires',
                'Provincia', 'Province', 'State', 'Departamento', 'Department'
            ];

            return pureAdministrativeEntities.some((entity: string): boolean =>
                name.toLowerCase().trim() === entity.toLowerCase()
            );
        };

        // Función para determinar si es una provincia argentina específica
        const isArgentineProvince = (name: string): boolean => {
            const argentineProvinces = [
                'La Rioja', 'San Luis', 'San Juan', 'Mendoza', 'La Pampa', 'Santa Fe',
                'Santiago del Estero', 'Catamarca', 'Río Negro', 'Chubut', 'Santa Cruz',
                'Tierra del Fuego', 'Entre Ríos', 'Corrientes', 'Misiones', 'Chaco',
                'Jujuy', 'Tucumán', 'Neuquén', 'Salta', 'Formosa'
            ];

            return argentineProvinces.some((province: string): boolean =>
                name.toLowerCase().includes(province.toLowerCase())
            );
        };

        filteredFeatures
            .filter((feature): feature is Feature<Geometry, GeoJsonProperties> => feature.properties !== null)
            .filter((feature: Feature<Geometry, GeoJsonProperties>): boolean => {
                const name: string = (feature.properties?.departamento || feature.properties?.name || feature.properties?.nam || '').toString();

                // Si es una entidad administrativa pura, excluirla
                if (isPureAdministrativeEntity(name)) {
                    return false;
                }

                // Si es una provincia argentina específica, excluirla
                if (isArgentineProvince(name)) {
                    return false;
                }

                // Si el nombre contiene comas, verificar que la primera parte no sea una entidad administrativa
                if (name.includes(',')) {
                    const firstPart = name.split(',')[0].trim();
                    if (isPureAdministrativeEntity(firstPart)) {
                        return false;
                    }
                }

                return true;
            })
            .forEach((feature: Feature<Geometry, GeoJsonProperties>): void => {
                const props: GeoJsonProperties = feature.properties || {};
                const rawNombre: string = String(props.departamento || props.name || props.nam || '');

                // Extraer el nombre principal de la localidad
                const mainLocalityName = extractMainLocalityName(rawNombre);
                const normalizedName = normalizeName(mainLocalityName);

                // Evitar duplicados basándose en el nombre normalizado
                if (processedNames.has(normalizedName)) {
                    return;
                }
                processedNames.add(normalizedName);

                // Usar la misma lógica de búsqueda que en getFeatureStyle
                const availableNames = Object.keys(sums);
                const bestMatch = findBestMatch(mainLocalityName, availableNames);
                let value: number | undefined = undefined;

                if (bestMatch && sums[bestMatch] !== undefined) {
                    value = sums[bestMatch];
                }

                let center: [number, number] | null = null;

                if (feature.geometry.type === 'Polygon') {
                    const coords: Position[] = feature.geometry.coordinates[0];
                    if (coords && coords.length > 0) {
                        const lats: number[] = coords.map((c: Position): number => c[1]);
                        const lngs: number[] = coords.map((c: Position): number => c[0]);
                        const lat: number = lats.reduce((a: number, b: number): number => a + b, 0) / lats.length;
                        const lng: number = lngs.reduce((a: number, b: number): number => a + b, 0) / lngs.length;
                        center = [lat, lng];
                    }
                } else if (feature.geometry.type === 'MultiPolygon') {
                    const coords: Position[] = feature.geometry.coordinates[0][0];
                    if (coords && coords.length > 0) {
                        const lats: number[] = coords.map((c: Position): number => c[1]);
                        const lngs: number[] = coords.map((c: Position): number => c[0]);
                        const lat: number = lats.reduce((a: number, b: number): number => a + b, 0) / lats.length;
                        const lng: number = lngs.reduce((a: number, b: number): number => a + b, 0) / lngs.length;
                        center = [lat, lng];
                    }
                }

                if (center && mainLocalityName) {
                    newLabels.push({ position: center, nombre: mainLocalityName, value });
                }
            });

        setLabels(newLabels);
    }, [geojson, sums]);

    return (
        <>
            {labels
                .filter((label: LabelData): boolean => {
                    if (!Boolean(hoveredMunicipality) || hoveredMunicipality === null) {
                        return false;
                    }

                    // Normalizar el nombre del label para comparar con hoveredMunicipality
                    const normalizedLabelName = normalizeName(label.nombre);
                    const isMatch = normalizedLabelName === hoveredMunicipality;

                    return isMatch && label.value !== undefined && label.value > 0;
                })
                .map((label: LabelData, i: number): React.JSX.Element => (
                    <Marker
                        key={i}
                        position={label.position}
                        icon={L.divIcon({
                            className: 'label-marker',
                            html: `
                                <div class='label-marker-content' style="
                                    display: inline-block;
                                    background: rgba(255,255,255,0.85);
                                    border-radius: 6px;
                                    padding: 2px 12px;
                                    font-weight: bold;
                                    font-size: 13px;
                                    color: #222;
                                    box-shadow: 0 1px 4px rgba(0,0,0,0.15);
                                    white-space: nowrap;
                                    overflow: visible;
                                    text-align: center;
                                    box-sizing: border-box;
                                    max-width: none;
                                    min-width: 50px;
                                ">
                                    ${label.nombre} &nbsp; &nbsp;
                                    <span style='font-size: 13px; font-weight: normal;'>
                                        Gasto Total: ${label.value !== undefined ? ('$ ' + formatTotal(label.value)) : ''}
                                    </span>
                                </div>
                            `
                        })}
                        interactive={false}
                    />
                ))
            }
        </>
    );
}

const MapView = ({ onLocalityClick, billingData, selectedLocalities }: MapProps): React.JSX.Element => {
    const center: LatLngExpression = [-34.5896, -58.6276];

    const { data, error, fetchS3Data } = useS3DataStore();
    const [geojson, setGeojson] = useState<FeatureCollection<Geometry, GeoJsonProperties> | null>(null);
    const [sums, setSums] = useState<SumsByLocality>({});
    const [minMax, setMinMax] = useState<MinMaxValues>({ min: 0, max: 0 });
    const [hoveredMunicipality, setHoveredMunicipality] = useState<string | null>(null);

    // Cargar datos del store al montar el componente
    useEffect((): void => {
        if (!data) {
            fetchS3Data();
        }
    }, [data, fetchS3Data]);

    // Cargar GeoJSON
    useEffect((): void => {
        fetch('/argentina.json')
            .then((res: Response) => res.json())
            .then((data: FeatureCollection<Geometry, GeoJsonProperties>): void => {
                setGeojson(data);
            })
            .catch((error: Error): void => {
                console.error('Error cargando GeoJSON:', error);
            });
    }, []);

    // Procesar datos cuando cambien
    useEffect((): void => {
        if (!data?.data) return;

        // Si no hay billingData, no mostrar nada en el mapa
        if (!billingData || billingData.length === 0) {
            setSums({});
            setMinMax({ min: 0, max: 0 });
            return;
        }

        console.log('🔍 MapView - Procesando datos:', {
            billingDataLength: billingData.length,
            selectedLocalities,
            sampleBillingData: billingData.slice(0, 3).map(row => ({
                patient_department: row.patient_department,
                localidad: row.localidad
            }))
        });

        // Lógica de procesamiento:
        // - Si NO hay localidades seleccionadas: procesar TODOS los datos (comportamiento por defecto)
        // - Si HAY localidades seleccionadas: procesar solo esos datos filtrados
        if (selectedLocalities && selectedLocalities.length > 0) {
            // Modo filtrado: procesar solo datos de las localidades seleccionadas
            const filteredData = billingData.filter(row => {
                // CORREGIDO: usar patient_department en lugar de localidad para ser consistente con processBillingData
                if (!row.patient_department) return false;
                return selectedLocalities.some(selected => 
                    normalizeName(selected) === normalizeName(row.patient_department || '')
                );
            });
            
            console.log('🔍 MapView - Datos filtrados:', {
                selectedLocalities,
                filteredDataLength: filteredData.length,
                filteredDataSample: filteredData.slice(0, 3).map(row => ({
                    patient_department: row.patient_department,
                    total_discounted_price: row.total_discounted_price
                }))
            });
            
            const { sums: newSums, minMax: newMinMax } = processBillingData(filteredData);
            console.log('🔍 MapView - Sums generados:', newSums);
            setSums(newSums);
            setMinMax(newMinMax);
        } else {
            // Modo por defecto: procesar todos los datos para mostrar todas las localidades
            const { sums: newSums, minMax: newMinMax } = processBillingData(billingData);
            console.log('🔍 MapView - Sums por defecto:', newSums);
            setSums(newSums);
            setMinMax(newMinMax);
        }

        // Debug: mostrar nombres del GeoJSON y generar reporte de mapeo
        if (geojson && data?.data) {
            // Resetear el estado de pintado antes de procesar nuevos datos
            resetPaintingState();
        }
    }, [data, billingData, geojson, selectedLocalities]);

    // Resetear estado de pintado cuando cambien las localidades seleccionadas
    useEffect((): void => {
        resetPaintingState();
    }, [selectedLocalities]);

    // Función para extraer el nombre principal de la localidad
    const extractMainLocalityName = (fullName: string): string => {
        if (!fullName) return '';

        // Si contiene comas, tomar solo la primera parte
        if (fullName.includes(',')) {
            return fullName.split(',')[0].trim();
        }

        return fullName;
    };

    // Función para manejar eventos de features
    const handleEachFeature = useCallback((
        feature: Feature<Geometry, GeoJsonProperties>,
        layer: Layer
    ): void => {
        const rawDepartamento: string = String(
            feature.properties?.departamento ||
            feature.properties?.name ||
            feature.properties?.nam || ''
        );

        // Extraer el nombre principal de la localidad
        const mainLocalityName = extractMainLocalityName(rawDepartamento);
        const nombre: string = normalizeName(mainLocalityName);

        layer.on({
            mouseover: (): void => setHoveredMunicipality(nombre),
            mouseout: (): void => setHoveredMunicipality(null),
            click: (): void => {
                if (onLocalityClick) {
                    // Buscar el mejor match en los datos disponibles
                    const availableNames = Object.keys(sums);
                    const bestMatch = findBestMatch(mainLocalityName, availableNames);

                    if (bestMatch) {
                        // Pasar el nombre de los datos (no el del GeoJSON)
                        onLocalityClick(bestMatch);
                    } else {
                        // Si no hay match, pasar el nombre normalizado del GeoJSON como fallback
                        onLocalityClick(nombre);
                    }
                }
            }
        });
    }, [onLocalityClick, sums]);

    // Función para estilizar features
    const styleFeature = useCallback((feature: Feature<Geometry, GeoJsonProperties> | undefined): Record<string, any> => {
        return getFeatureStyle(feature, sums, minMax, selectedLocalities);
    }, [sums, minMax, selectedLocalities]);



    if (error) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                fontSize: '1.2rem',
                color: '#dc3545'
            }}>
                Error al cargar datos: {error}
            </div>
        );
    }

    return (
        <MapContainer
            center={center}
            zoom={11}
            style={{ height: "88%", width: "100%", borderRadius: '1.5rem' }}
        >
            <TileLayer
                url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png"
                attribution="&copy; <a href='https://stadiamaps.com/'>Stadia Maps</a>"
            />

            {geojson && (() => {
                const filteredFeatures = geojson.features.filter(
                    (f: Feature<Geometry, GeoJsonProperties>): boolean =>
                        f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'
                );

                // Función para determinar si es una entidad administrativa pura
                const isPureAdministrativeEntity = (name: string): boolean => {
                    const pureAdministrativeEntities = [
                        'Buenos Aires', 'Provincia de Buenos Aires', 'Ciudad Autónoma de Buenos Aires',
                        'Provincia', 'Province', 'State', 'Departamento', 'Department'
                    ];

                    // Verificar si el nombre es exactamente una entidad administrativa pura
                    return pureAdministrativeEntities.some(entity =>
                        name.toLowerCase().trim() === entity.toLowerCase()
                    );
                };

                // Función para determinar si es una provincia argentina específica
                const isArgentineProvince = (name: string): boolean => {
                    const argentineProvinces = [
                        'La Rioja', 'San Luis', 'San Juan', 'Mendoza', 'La Pampa', 'Santa Fe',
                        'Santiago del Estero', 'Catamarca', 'Río Negro', 'Chubut', 'Santa Cruz',
                        'Tierra del Fuego', 'Entre Ríos', 'Corrientes', 'Misiones', 'Chaco',
                        'Jujuy', 'Tucumán', 'Neuquén', 'Salta', 'Formosa'
                    ];

                    return argentineProvinces.some(province =>
                        name.toLowerCase().includes(province.toLowerCase())
                    );
                };

                // Filtrar features que no deberían mostrarse (entidades administrativas grandes)
                const processedLocalities = new Set<string>(); // Para evitar duplicados

                const localFeatures = filteredFeatures.filter((f: Feature<Geometry, GeoJsonProperties>): boolean => {
                    const name = String(f.properties?.departamento || f.properties?.name || f.properties?.nam || '');

                    // Si es una entidad administrativa pura, excluirla
                    if (isPureAdministrativeEntity(name)) {
                        return false;
                    }

                    // Si es una provincia argentina específica, excluirla
                    if (isArgentineProvince(name)) {
                        return false;
                    }

                    // Si el nombre contiene comas (como "Moreno, Buenos Aires, Argentina"),
                    // verificar que la primera parte no sea una entidad administrativa
                    if (name.includes(',')) {
                        const firstPart = name.split(',')[0].trim();
                        if (isPureAdministrativeEntity(firstPart)) {
                            return false;
                        }
                    }

                    // Extraer el nombre principal de la localidad
                    const mainLocalityName = extractMainLocalityName(name);
                    const normalizedName = normalizeName(mainLocalityName);

                    // Si ya procesamos esta localidad, excluirla (evitar duplicados)
                    if (processedLocalities.has(normalizedName)) {
                        return false;
                    }

                    // Marcar esta localidad como procesada
                    processedLocalities.add(normalizedName);

                    return true;
                });
                
                return (
                    <GeoJSON
                        data={{
                            ...geojson,
                            features: localFeatures,
                        } as FeatureCollection<Geometry, GeoJsonProperties>}
                        style={styleFeature}
                        onEachFeature={handleEachFeature}
                    />
                );
            })()}

            {geojson && (
                <PolygonLabels
                    geojson={geojson}
                    sums={sums}
                    hoveredMunicipality={hoveredMunicipality}
                />
            )}
        </MapContainer>
    );
}

export { MapView };
