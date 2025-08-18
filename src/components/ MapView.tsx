

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
import { getActiveMapConfig } from "../config/mapConfig";
import type {
    SumsByLocality,
    GeoJsonProperties,
    MinMaxValues,
    LabelData,
    MapProps,
    PolygonLabelsProps,
    CsvRow
} from "../types";



const PolygonLabels = ({ geojson, sums, hoveredMunicipality }: PolygonLabelsProps): React.JSX.Element => {
    const [labels, setLabels] = useState<LabelData[]>([]);

    useEffect((): void => {
        if (!geojson) return;

        const newLabels: LabelData[] = [];
        const processedNames: Set<string> = new Set<string>(); 

        const filteredFeatures = geojson.features.filter(
            (f: any): boolean =>
                f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'
        );

        const isPureAdministrativeEntity = (name: string): boolean => {
            const pureAdministrativeEntities: string[] = [
                'Buenos Aires', 'Provincia de Buenos Aires', 'Ciudad Autónoma de Buenos Aires',
                'Provincia', 'Province', 'State', 'Departamento', 'Department'
            ];

            return pureAdministrativeEntities.some((entity: string): boolean =>
                name.toLowerCase().trim() === entity.toLowerCase()
            );
        };

        
        const isArgentineProvince = (name: string): boolean => {
            const argentineProvinces: string[] = [
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
                
                if (isPureAdministrativeEntity(name)) {
                    return false;
                }
                
                if (isArgentineProvince(name)) {
                    return false;
                }

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

                
                const mainLocalityName: string = extractMainLocalityName(rawNombre);
                const normalizedName: string = normalizeName(mainLocalityName);

                if (processedNames.has(normalizedName)) {
                    return;
                }
                processedNames.add(normalizedName);
                
                const availableNames: string[] = Object.keys(sums);
                const bestMatch: string | null = findBestMatch(mainLocalityName, availableNames);
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
                    if (!hoveredMunicipality || hoveredMunicipality === null) {
                        return false;
                    }

                    
                    const normalizedLabelName: string = normalizeName(label.nombre);
                    const isMatch: boolean = normalizedLabelName === hoveredMunicipality;

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
    const mapConfig = getActiveMapConfig();
    const center: LatLngExpression = [-34.5896, -58.6276];

    const { data, error, fetchS3Data } = useS3DataStore();
    const [geojson, setGeojson] = useState<FeatureCollection<Geometry, GeoJsonProperties> | null>(null);
    const [sums, setSums] = useState<SumsByLocality>({});
    const [minMax, setMinMax] = useState<MinMaxValues>({ min: 0, max: 0 });
    const [hoveredMunicipality, setHoveredMunicipality] = useState<string | null>(null);
    
    useEffect((): void => {
        if (!data) {
            fetchS3Data();
        }
    }, [data, fetchS3Data]);
    
    useEffect((): void => {
        fetch('/argentina.json')
            .then((res: Response) => res.json())
            .then((data: FeatureCollection<Geometry, GeoJsonProperties>): void => {
                setGeojson(data);
            })
            .catch((): void => {
                
            });
    }, []);
    
    useEffect((): void => {
        if (!data?.data) return;

        
        if (!billingData || billingData.length === 0) {
            setSums({});
            setMinMax({ min: 0, max: 0 });
            return;
        }
        
        if (selectedLocalities && selectedLocalities.length > 0) {
            
            const filteredData: CsvRow[] = billingData.filter((row: CsvRow) => {
                
                if (!row.patient_department) return false;
                return selectedLocalities.some(selected =>
                    normalizeName(selected) === normalizeName(row.patient_department || '')
                );
            });

            const { sums: newSums, minMax: newMinMax } = processBillingData(filteredData);

            setSums(newSums);
            setMinMax(newMinMax);
        } else {
            
            const { sums: newSums, minMax: newMinMax } = processBillingData(billingData);

            setSums(newSums);
            setMinMax(newMinMax);
        }

        
        if (geojson && data?.data) {
            
            resetPaintingState();
        }
    }, [data, billingData, geojson, selectedLocalities]);

    
    useEffect((): void => {
        resetPaintingState();
    }, [selectedLocalities]);

    
    const extractMainLocalityName = (fullName: string): string => {
        if (!fullName) return '';

        
        if (fullName.includes(',')) {
            return fullName.split(',')[0].trim();
        }

        return fullName;
    };
    
    const handleEachFeature = useCallback((
        feature: Feature<Geometry, GeoJsonProperties>,
        layer: Layer
    ): void => {
        const rawDepartamento: string = String(
            feature.properties?.departamento ||
            feature.properties?.name ||
            feature.properties?.nam || ''
        );
        
        const mainLocalityName: string = extractMainLocalityName(rawDepartamento);
        const nombre: string = normalizeName(mainLocalityName);

        layer.on({
            mouseover: (): void => setHoveredMunicipality(nombre),
            mouseout: (): void => setHoveredMunicipality(null),
            click: (): void => {
                if (onLocalityClick) {
                    
                    const availableNames: string[] = Object.keys(sums);
                    const bestMatch: string | null = findBestMatch(mainLocalityName, availableNames);

                    if (bestMatch) {
                        
                        onLocalityClick(mainLocalityName);
                    } else {
                        
                        onLocalityClick(mainLocalityName);
                    }
                }
            }
        });
    }, [onLocalityClick, sums]);

    const styleFeature = useCallback((feature: Feature<Geometry, GeoJsonProperties> | undefined): Record<string, any> => {
        return getFeatureStyle(feature, sums, minMax);
    }, [sums, minMax]);

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
            style={{ height: "100%", width: "100%", borderRadius: '1.5rem' }}
        >
            <TileLayer
                url={mapConfig.url}
                attribution={mapConfig.attribution}
            />


            {geojson && (() => {
                const filteredFeatures = geojson.features.filter(
                    (f: Feature<Geometry, GeoJsonProperties>): boolean =>
                        f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'
                );
                
                const isPureAdministrativeEntity = (name: string): boolean => {
                    const pureAdministrativeEntities: string[] = [
                        'Buenos Aires', 'Provincia de Buenos Aires', 'Ciudad Autónoma de Buenos Aires',
                        'Provincia', 'Province', 'State', 'Departamento', 'Department'
                    ];

                    return pureAdministrativeEntities.some((entity: string): boolean =>
                        name.toLowerCase().trim() === entity.toLowerCase()
                    );
                };
                
                const isArgentineProvince = (name: string): boolean => {
                    const argentineProvinces: string[] = [
                        'La Rioja', 'San Luis', 'San Juan', 'Mendoza', 'La Pampa', 'Santa Fe',
                        'Santiago del Estero', 'Catamarca', 'Río Negro', 'Chubut', 'Santa Cruz',
                        'Tierra del Fuego', 'Entre Ríos', 'Corrientes', 'Misiones', 'Chaco',
                        'Jujuy', 'Tucumán', 'Neuquén', 'Salta', 'Formosa'
                    ];

                    return argentineProvinces.some((province: string): boolean =>
                        name.toLowerCase().includes(province.toLowerCase())
                    );
                };
                
                const processedLocalities = new Set<string>(); 

                const localFeatures = filteredFeatures.filter((f: Feature<Geometry, GeoJsonProperties>): boolean => {
                    const name: string = String(f.properties?.departamento || f.properties?.name || f.properties?.nam || '');
                    
                    if (isPureAdministrativeEntity(name)) {
                        return false;
                    }
                    
                    if (isArgentineProvince(name)) {
                        return false;
                    }

                    if (name.includes(',')) {
                        const firstPart: string = name.split(',')[0].trim();
                        if (isPureAdministrativeEntity(firstPart)) {
                            return false;
                        }
                    }
                    
                    const mainLocalityName: string = extractMainLocalityName(name);
                    const normalizedName: string = normalizeName(mainLocalityName);

                    if (processedLocalities.has(normalizedName)) {
                        return false;
                    }
                    
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
