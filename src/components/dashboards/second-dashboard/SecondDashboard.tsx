//------------------------------------------------------------------------------------------------------------------------------

import { useTokenExpiration } from "../../../hooks/useTokenExpiration";
import { useS3DataStore } from "../../../stores/s3DataStore";
import { useLocalDateRangeContext } from "../../../contexts/LocalDateRangeContext";
import type { CsvRow, Data3Item, InfoDataItem, SecondDashboardMetrics, SecondDashboardProps, StringOrDateOrNull } from "../../../types";
import "../../../App.css";
import styles from "./second-dashboard.module.css";
import { useEffect, useState, useMemo } from "react";
import { filterDataByDateRange, formatNumberNormalized, formatCurrencyNormalized, parseDate } from "../../../utils/dateUtils";
import { IconSpreadsheet } from "../../../Icons/IconSpreadsheet";
import { IconDanger } from "../../../Icons/IconDanger";

//------------------------------------------------------------------------------------------------------------------------------

// Función para calcular el período anterior equivalente
const getPreviousPeriod = (startDate: Date, endDate: Date): [Date, Date] => {
  const periodLength: number = endDate.getTime() - startDate.getTime();
  const previousEndDate: Date = new Date(startDate);
  previousEndDate.setDate(previousEndDate.getDate() - 1);
  const previousStartDate: Date = new Date(previousEndDate.getTime() - periodLength);

  return [previousStartDate, previousEndDate];
};

// Función para calcular el porcentaje de variación
const calculateVariationPercentage = (current: number, previous: number): number => {
  // Si no hay datos en ninguno de los períodos, no hay variación
  if (current === 0 && previous === 0) return 0;
  // Si no hay datos en el período anterior pero sí en el actual, es 100% de aumento
  if (previous === 0 && current > 0) return 100;
  // Si no hay datos en el período actual pero sí en el anterior, es 100% de disminución
  if (current === 0 && previous > 0) return -100;
  // Si hay datos en ambos periodos, calcular la variación normal
  return Math.round(((current - previous) / previous) * 100);
};

const parseMonto = (monto: string): number => {
  return parseFloat(monto.replace(/[$\s]/g, '').replace(/,/g, ''));
}

const hasValidData = (value: number): boolean => {
  return value > 0;
}

const formatNumberWithValidation = (value: number): string => {
  return hasValidData(value) ? formatNumberNormalized(value) : 'No hay datos';
}

const formatCurrencyWithValidation = (value: number): string => {
  return hasValidData(value) ? formatCurrencyNormalized(value) : 'No hay datos';
}

const formatNumberWithOneDecimal = (value: number): string => {
  if (!hasValidData(value)) return 'No hay datos';
  return value.toLocaleString('es-ES', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
}

const sumData3 = (...lists: Data3Item[][]): { monto: string; porcentaje: string; cantidad: string } => {
  const items: Data3Item[] = lists.flat();

  const totalAmount: number = items.reduce((acc: number, item: Data3Item): number => {
    const num: number = parseMonto(item.monto);
    return acc + (isNaN(num) ? 0 : num);
  }, 0);

  const totalPercentage: number = items.reduce((acc: number, item: Data3Item): number => {
    const num: number = parseFloat(item.porcentaje.replace(/[^\d,.-]/g, '').replace(',', '.'));
    return acc + (isNaN(num) ? 0 : num);
  }, 0);

  const totalQuantity: number = items.reduce((acc: number, item: Data3Item): number => {
    const num: number = parseFloat(item.cantidad.replace(/\./g, '').replace(',', '.'));
    return acc + (isNaN(num) ? 0 : num);
  }, 0);

  const formattedAmount: string = hasValidData(totalAmount) ? formatCurrencyNormalized(totalAmount) : 'No hay datos';
  const formattedPercentage: string = hasValidData(totalPercentage) ? `${formatNumberNormalized(totalPercentage)} %` : 'No hay datos';
  const formattedQuantity: string = hasValidData(totalQuantity) ? formatNumberNormalized(totalQuantity) : 'No hay datos';

  return { monto: formattedAmount, porcentaje: formattedPercentage, cantidad: formattedQuantity };
}

// Función para convertir StringOrDateOrNull a Date | null
const convertToDateRange = (dateRange: [StringOrDateOrNull, StringOrDateOrNull] | { [0]: Date | null;[1]: Date | null }): [Date | null, Date | null] => {
  const [start, end] = dateRange as [StringOrDateOrNull, StringOrDateOrNull];
  const startDate = start instanceof Date ? start : (typeof start === 'string' ? new Date(start) : null);
  const endDate = end instanceof Date ? end : (typeof end === 'string' ? new Date(end) : null);

  return [startDate, endDate];
};

//------------------------------------------------------------------------------------------------------------------------------

const SecondDashboard: React.FC<SecondDashboardProps> = ({ dateRange }) => {
  const { data, error, fetchS3Data } = useS3DataStore();
  const { localDateRange } = useLocalDateRangeContext();

  useTokenExpiration();

  const [metrics, setMetrics] = useState<SecondDashboardMetrics>({
    recetasAuditadas: 0,
    recetasConDesvio: 0,
    costoAcumulado: 0,
    ahorroAcumulado: 0,
    medicosRegistrados: 0,
    costoPromedioMedico: 0,
    afiliadosRegistrados: 0,
    costoPromedioAfiliado: 0,
    costoPromedioReceta: 0,
    cantidadPromedioMedicamentos: 0
  });

  const [medicamentos, setMedicamentos] = useState<Data3Item[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [infoData, setInfoData] = useState<InfoDataItem[]>([]);
  const [afiliadosData, setAfiliadosData] = useState<InfoDataItem[]>([]);
  const [previousRecetasAuditadas, setPreviousRecetasAuditadas] = useState<number>(0);
  const [previousRecetasConDesvio, setPreviousRecetasConDesvio] = useState<number>(0);
  const [variationRecetasAuditadas, setVariationRecetasAuditadas] = useState<number | null>(null);
  const [variationRecetasConDesvio, setVariationRecetasConDesvio] = useState<number | null>(null);

  // Usar useMemo para memoizar effectiveDateRange y evitar recálculos innecesarios
  const effectiveDateRange: [Date | null, Date | null] = useMemo(() => {
    return localDateRange[0] && localDateRange[1]
      ? convertToDateRange(localDateRange)
      : convertToDateRange(dateRange);
  }, [localDateRange, dateRange]);


  useEffect((): void => {
    if (!data) {
      setIsLoading(true);
      fetchS3Data();
    }
  }, [data, fetchS3Data]);

  useEffect((): void => {
    if (!data?.data) return;

    setIsLoading(true);


    try {
      const medicamentosData: CsvRow[] = (data.data['medicamentos-mas-recetados.csv'] as CsvRow[]) || [];

      const dateRangeForFilter: [Date | null, Date | null] = [
        effectiveDateRange[0],
        effectiveDateRange[1]
      ];

      const filteredData: CsvRow[] = filterDataByDateRange(medicamentosData, dateRangeForFilter);

      const validRows: CsvRow[] = filteredData.filter((row: CsvRow): boolean =>
        Boolean(row.Medicamentos && row['Monto Equivalente'] && row.Cantidad && row.Porcentaje && row.Fecha)
      );

      const grouped: Map<string, { cantidad: number, monto: number, porcentaje: number, fecha: string }> = new Map();

      for (const row of validRows) {
        const nombre: string = row.Medicamentos.trim();
        const cantidad: number = parseFloat((row.Cantidad || '0').replace(/,/g, ''));
        const monto: number = parseMonto(row['Monto Equivalente'] || '0');
        const porcentaje: number = parseFloat(row.Porcentaje || '0') * 100;
        const fecha: string = row.Fecha;

        if (!grouped.has(nombre)) {
          grouped.set(nombre, { cantidad: 0, monto: 0, porcentaje: 0, fecha });
        }

        const g = grouped.get(nombre)!;
        g.cantidad += isNaN(cantidad) ? 0 : cantidad;
        g.monto += isNaN(monto) ? 0 : monto;
        g.porcentaje += isNaN(porcentaje) ? 0 : porcentaje;
        // Mantener la fecha más reciente
        if (fecha > g.fecha) g.fecha = fecha;
      }

      const result: Data3Item[] = Array.from(grouped.entries()).map(([nombre, g]: [string, { cantidad: number, monto: number, porcentaje: number, fecha: string }]): Data3Item => ({
        nombre,
        monto: hasValidData(g.monto) ? formatCurrencyNormalized(g.monto) : 'No hay datos',
        porcentaje: hasValidData(g.porcentaje) ? `${formatNumberNormalized(g.porcentaje)} %` : 'No hay datos',
        cantidad: hasValidData(g.cantidad) ? formatNumberNormalized(g.cantidad) : 'No hay datos',
        fecha: g.fecha,
      }));

      setMedicamentos(result);
    } catch (error) {
      console.error('Error procesando medicamentos:', error);
      setMedicamentos([]);
    } finally {
      setIsLoading(false);
    }
  }, [data, effectiveDateRange]);

  useEffect((): void => {
    if (!data?.data) return;

    try {
      const metricasAbajoData: CsvRow[] = (data.data['metricas-abajo.csv'] as CsvRow[]) || [];

      const dateRangeForFilter: [Date | null, Date | null] = [
        effectiveDateRange[0],
        effectiveDateRange[1]
      ];

      const filteredMetricasAbajo: CsvRow[] = filterDataByDateRange(metricasAbajoData, dateRangeForFilter);

      let latestMedico: CsvRow | null = null;
      let latestMedicoDate: Date | null = null;
      let latestPaciente: CsvRow | null = null;
      let latestPacienteDate: Date | null = null;

      for (const row of filteredMetricasAbajo) {
        if (!row.Fecha || !row.Descripcion) continue;
        const rowDate: Date | null = parseDate(row.Fecha);
        if (!rowDate) continue;

        if (row.Descripcion === 'Medico') {
          if (!latestMedicoDate || rowDate > latestMedicoDate) {
            latestMedicoDate = rowDate;
            latestMedico = row;
          }
        }
        if (row.Descripcion === 'Paciente') {
          if (!latestPacienteDate || rowDate > latestPacienteDate) {
            latestPacienteDate = rowDate;
            latestPaciente = row;
          }
        }
      }

      const medicosRegistrados: number = latestMedico ? parseInt(latestMedico.Cantidad || '0') : 0;
      const costoPromedioMedico: number = latestMedico ? parseMonto(latestMedico.Costo || '0') : 0;

      const afiliadosRegistrados: number = latestPaciente ? parseInt(latestPaciente.Cantidad || '0') : 0;
      const costoPromedioAfiliado: number = latestPaciente ? parseMonto(latestPaciente.Costo || '0') : 0;

      setMetrics((prev: SecondDashboardMetrics): SecondDashboardMetrics => ({
        ...prev,
        medicosRegistrados,
        costoPromedioMedico,
        afiliadosRegistrados,
        costoPromedioAfiliado
      }));

      setInfoData([
        {
          label: 'Médicos Registrados',
          value: formatNumberWithValidation(medicosRegistrados),
        },
        {
          label: 'Costo Promedio por Médico',
          value: formatCurrencyWithValidation(costoPromedioMedico),
        },
      ]);

      setAfiliadosData([
        {
          label: 'Afiliados Registrados',
          value: formatNumberWithValidation(afiliadosRegistrados),
        },
        {
          label: 'Costo Promedio por Afiliado',
          value: formatCurrencyWithValidation(costoPromedioAfiliado),
        },
      ]);

    } catch (error) {
      console.error('Error procesando métricas abajo:', error);
      setMetrics((prev: SecondDashboardMetrics): SecondDashboardMetrics => ({
        ...prev,
        medicosRegistrados: 0,
        costoPromedioMedico: 0,
        afiliadosRegistrados: 0,
        costoPromedioAfiliado: 0
      }));
      setMetrics((prev: SecondDashboardMetrics): SecondDashboardMetrics => ({
        ...prev,
        medicosRegistrados: 0,
        costoPromedioMedico: 0,
        afiliadosRegistrados: 0,
        costoPromedioAfiliado: 0
      }));
      setInfoData([]);
      setAfiliadosData([]);
    }
  }, [data, effectiveDateRange]);

  useEffect((): void => {
    if (!data?.data) return;

    try {
      const metricasData: CsvRow[] = (data.data['metricas-arriba.csv'] as CsvRow[]) || [];

      const dateRangeForFilter: [Date | null, Date | null] = [
        effectiveDateRange[0],
        effectiveDateRange[1]
      ];

      const filteredMetricas: CsvRow[] = filterDataByDateRange(metricasData, dateRangeForFilter);

      let totalRecetasAuditadas: number = 0;
      let totalRecetasConDesvio: number = 0;
      let costoAcumulado: number = 0;
      let ahorroAcumulado: number = 0;

      for (const row of filteredMetricas) {
        if (row['Q R Real']) {
          totalRecetasAuditadas += parseInt(row['Q R Real'].replace(/,/g, '')) || 0;
        }
        if (row['Q R Sospe']) {
          totalRecetasConDesvio += parseInt(row['Q R Sospe'].replace(/,/g, '')) || 0;
        }
      }

      if (filteredMetricas.length > 0) {
        let latestRow: CsvRow | null = null;
        let latestDate: Date | null = null;

        for (const row of filteredMetricas) {
          if (!row.Fecha) continue;
          const rowDate: Date | null = parseDate(row.Fecha);
          if (!rowDate) continue;

          if (!latestDate || rowDate > latestDate) {
            latestDate = rowDate;
            latestRow = row;
          }
        }

        if (latestRow && filteredMetricas.length > 0) {
          costoAcumulado = parseMonto(latestRow['Costo Acum'] || '0');
          ahorroAcumulado = parseMonto(latestRow['Ahorro Acum'] || '0');
        }
      }

      // Calcular período anterior si tenemos fechas válidas
      let previousRecetasAuditadas: number = 0;
      let previousRecetasConDesvio: number = 0;

      if (effectiveDateRange[0] && effectiveDateRange[1]) {
        const startDate = effectiveDateRange[0] instanceof Date ? effectiveDateRange[0] : new Date(effectiveDateRange[0]);
        const endDate = effectiveDateRange[1] instanceof Date ? effectiveDateRange[1] : new Date(effectiveDateRange[1]);

        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          const [previousStartDate, previousEndDate] = getPreviousPeriod(startDate, endDate);

          const previousDateRangeForFilter: [Date | null, Date | null] = [previousStartDate, previousEndDate];
          const filteredPreviousMetricas: CsvRow[] = filterDataByDateRange(metricasData, previousDateRangeForFilter);

          for (const row of filteredPreviousMetricas) {
            if (row['Q R Real']) {
              previousRecetasAuditadas += parseInt(row['Q R Real'].replace(/,/g, '')) || 0;
            }
            if (row['Q R Sospe']) {
              previousRecetasConDesvio += parseInt(row['Q R Sospe'].replace(/,/g, '')) || 0;
            }
          }
        }
      }

      // Calcular porcentajes de variación solo si hay un período seleccionado
      let variationRecetasAuditadas: number | null = null;
      let variationRecetasConDesvio: number | null = null;

      if (effectiveDateRange[0] && effectiveDateRange[1]) {
        const startDate: Date = effectiveDateRange[0] instanceof Date ? effectiveDateRange[0] : new Date(effectiveDateRange[0]);
        const endDate: Date = effectiveDateRange[1] instanceof Date ? effectiveDateRange[1] : new Date(effectiveDateRange[1]);

        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          const [previousStartDate, previousEndDate]: [Date, Date] = getPreviousPeriod(startDate, endDate);

          const previousDateRangeForFilter: [Date | null, Date | null] = [previousStartDate, previousEndDate];
          const filteredPreviousMetricas: CsvRow[] = filterDataByDateRange(metricasData, previousDateRangeForFilter);

          // Resetear las variables del período anterior
          let previousRecetasAuditadas: number = 0;
          let previousRecetasConDesvio: number = 0;

          for (const row of filteredPreviousMetricas) {
            if (row['Q R Real']) {
              previousRecetasAuditadas += parseInt(row['Q R Real'].replace(/,/g, '')) || 0;
            }
            if (row['Q R Sospe']) {
              previousRecetasConDesvio += parseInt(row['Q R Sospe'].replace(/,/g, '')) || 0;
            }
          }

          // Solo calcular variación si hay datos en al menos uno de los períodos
          if (previousRecetasAuditadas > 0 || totalRecetasAuditadas > 0) {
            variationRecetasAuditadas = calculateVariationPercentage(totalRecetasAuditadas, previousRecetasAuditadas);
          }
          if (previousRecetasConDesvio > 0 || totalRecetasConDesvio > 0) {
            variationRecetasConDesvio = calculateVariationPercentage(totalRecetasConDesvio, previousRecetasConDesvio);
          }
        }
      }

      setMetrics((prev: SecondDashboardMetrics) => ({
        ...prev,
        recetasAuditadas: totalRecetasAuditadas,
        recetasConDesvio: totalRecetasConDesvio,
        costoAcumulado,
        ahorroAcumulado
      }));

      // Actualizar estados de variación
      setPreviousRecetasAuditadas(previousRecetasAuditadas);
      setPreviousRecetasConDesvio(previousRecetasConDesvio);
      setVariationRecetasAuditadas(variationRecetasAuditadas);
      setVariationRecetasConDesvio(variationRecetasConDesvio);

    } catch (error) {
      console.error('Error procesando métricas:', error);
      setMetrics(prev => ({
        ...prev,
        recetasAuditadas: 0,
        recetasConDesvio: 0,
        costoAcumulado: 0,
        ahorroAcumulado: 0
      }));
      setVariationRecetasAuditadas(null);
      setVariationRecetasConDesvio(null);
    }
  }, [data, effectiveDateRange]);

  useEffect((): void => {
    if (!data?.data) return;

    try {
      const valoresRecetasData: CsvRow[] = (data.data['valores-recetas.csv'] as CsvRow[]) || [];

      const dateRangeForFilter: [Date | null, Date | null] = [
        effectiveDateRange[0],
        effectiveDateRange[1]
      ];

      const filteredValoresRecetas: CsvRow[] = filterDataByDateRange(valoresRecetasData, dateRangeForFilter);

      let totalCostoPromedioReceta: number = 0;
      let totalCantidadPromedioMedicamentos: number = 0;

      for (const row of filteredValoresRecetas) {
        if (row['Costo Prom Rx'] && row['Costo Prom Rx'].trim() !== '') {
          const costoValue = row['Costo Prom Rx'];
          let costoNum: number = 0;

          // Parsear diferentes formatos
          if (costoValue.includes('$')) {
            // Formato: "$19,690.00"
            costoNum = parseMonto(costoValue);
          } else {
            // Formato: "18561" o "19303"
            costoNum = parseInt(costoValue) || 0;
          }

          if (costoNum > 0) {
            totalCostoPromedioReceta += costoNum;
          }
        }

        // Procesar cantidad promedio de medicamentos por receta
        if (row['Cantidad Med Rx'] && row['Cantidad Med Rx'].trim() !== '') {
          const cantidadValue = row['Cantidad Med Rx'];
          const cantidadNum = parseFloat(cantidadValue);

          if (!isNaN(cantidadNum) && cantidadNum > 0) {
            totalCantidadPromedioMedicamentos += cantidadNum;
          }
        }
      }

      setMetrics((prev: SecondDashboardMetrics) => ({
        ...prev,
        costoPromedioReceta: totalCostoPromedioReceta,
        cantidadPromedioMedicamentos: totalCantidadPromedioMedicamentos
      }));

    } catch (error) {
      console.error('Error procesando valores-recetas:', error);
      setMetrics((prev: SecondDashboardMetrics) => ({
        ...prev,
        costoPromedioReceta: 0,
        cantidadPromedioMedicamentos: 0
      }));
    }
  }, [data, effectiveDateRange]);

  if (error) {
    return (
      <>
        <div className={styles.parent}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50vh',
            fontSize: '1.2rem',
            color: '#dc3545'
          }}>
            Hubo un error al cargar los datos
          </div>
        </div>
      </>
    );
  }

  return (
    <div className={styles.parent}>
      <div className={`${styles["grid-item"]} ${styles["metric-card"]} ${styles["metric-card-left"]} ${styles.div1}`} style={{ position: 'relative' }}>
        <p className={styles['text']}>Recetas Auditadas</p>
        <div style={{ width: '100%', display: 'flex', paddingLeft: '10%' }}>
          <div style={{ display: 'flex', gap: "0.5rem", alignItems: "center" }}>
            <IconSpreadsheet />
            <p className={styles['value']}>{formatNumberWithValidation(metrics.recetasAuditadas)}</p>
          </div>
        </div>

        {variationRecetasAuditadas !== null && (metrics.recetasAuditadas > 0 || previousRecetasAuditadas > 0) && (
          <div style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            marginBottom: '0.5rem',
            marginRight: '1rem',
            backgroundColor: '#bbdefb',
            width: '7rem',
            height: '3rem',
            borderRadius: '2rem',
            boxShadow: '0 0 4px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontWeight: 'bold',
            fontSize: '1.5rem',
            color: `${variationRecetasAuditadas >= 0 ? '#e62720ff' : '#18af52ff'}`,
          }}>
            {variationRecetasAuditadas > 0 ? '+' : ''}{variationRecetasAuditadas}%
          </div>
        )}
      </div>

      <div className={`${styles["grid-item"]} ${styles["metric-card"]} ${styles["metric-card-left"]} ${styles.div2}`} style={{ position: 'relative' }}>
        <p className={styles['text']}>Recetas con Desvío Detectados</p>
        <div style={{ display: 'flex', gap: "0.5rem", paddingLeft: '10%' }}>
          <IconDanger />
          <p className={styles['value']}>{
            isLoading
              ? 'Cargando...'
              : formatNumberWithValidation(metrics.recetasConDesvio)}
          </p>
        </div>
        {variationRecetasConDesvio !== null && (metrics.recetasConDesvio > 0 || previousRecetasConDesvio > 0) && (
          <div style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            marginBottom: '0.5rem',
            marginRight: '1rem',
            backgroundColor: '#f4c7c3',
            width: '7rem',
            height: '3rem',
            borderRadius: '2rem',
            boxShadow: '0 0 4px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontWeight: 'bold',
            fontSize: '1.5rem',
            color: `${variationRecetasConDesvio >= 0 ? '#e62720ff' : '#18af52ff'}`,
          }}>
            {variationRecetasConDesvio > 0 ? '+' : ''}{variationRecetasConDesvio}%
          </div>
        )}
      </div>

      <div className={`${styles["grid-item"]} ${styles["metric-card"]} ${styles["metric-card-left"]} ${styles.div3}`} style={{ position: 'relative' }}>
        <p className={`${styles['text']}`}>Costo Acumulado</p>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
          <div style={{ display: 'flex', gap: "0.5rem", paddingLeft: '10%' }}>
            <IconSpreadsheet />
            <p className={styles['cost']}>{formatCurrencyWithValidation(metrics.costoAcumulado)}</p>
          </div>
        </div>
        {variationRecetasConDesvio !== null && (metrics.recetasConDesvio > 0 || previousRecetasConDesvio > 0) && (
          <div style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            marginBottom: '0.5rem',
            marginRight: '1rem',
            backgroundColor: '#eac6e2ff',
            width: '7rem',
            height: '3rem',
            borderRadius: '2rem',
            boxShadow: '0 0 4px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontWeight: 'bold',
            fontSize: '1.5rem',
            color: `${variationRecetasConDesvio >= 0 ? '#e62720ff' : '#18af52ff'}`,
          }}>
            {variationRecetasConDesvio > 0 ? '+' : ''}{variationRecetasConDesvio}%
          </div>
        )}
      </div>

      <div className={`${styles["grid-item"]} ${styles["metric-card"]} ${styles["metric-card-left"]} ${styles.div4}`}>
        <p className={styles['text']}>Posible Ahorro Estimado</p>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
          <div style={{ display: 'flex', gap: "0.5rem", paddingLeft: '10%' }}>
            <IconSpreadsheet />
            <p className={styles['value']}>{formatCurrencyWithValidation(metrics.ahorroAcumulado)}</p>
          </div>
        </div>
      </div>

      <div className={`${styles["grid-item"]} ${styles.div5}`}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 12,
          }}>
          <img src="/nurse.png" alt="doctor" style={{ display: 'block', borderWidth: '1px', height: '2.4rem', marginBottom: '0.5rem' }} />
          <p className={styles['text']}>Médicos Registrados</p>
          <p className={styles['value']}>{
            infoData.length > 0
              ? infoData[0].value
              : 'No hay datos'
          }</p>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 12,
            minWidth: 180
          }}>
          <img src="/money.png" alt="money" style={{ display: 'block', borderWidth: '1px', height: '2.4rem', marginBottom: '0.5rem' }} />
          <p className={styles['text']}>Costo Promedio por Médico</p>
          <p className={styles['cost']}>{
            infoData.length > 1
              ? infoData[1].value
              : 'No hay datos'}
          </p>
        </div>
      </div>

      <div className={`${styles["grid-item"]} ${styles.div6}`}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 12,
            minWidth: 180,
          }}>
          <img src="/people.png" alt="people" style={{ display: 'block', borderWidth: '1px', height: '2.4rem', marginBottom: '0.5rem' }} />
          <p className={styles['text']}>Afiliados Registrados</p>
          <p className={styles['value']}>{
            afiliadosData.length > 0
              ? afiliadosData[0].value
              : 'No hay datos'
          }</p>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 12,
            minWidth: 180,
          }}>
          <img src="/people-money.png" alt="people-money" style={{ display: 'block', borderWidth: '1px', height: '2.4rem', marginBottom: '0.5rem' }} />
          <p className={styles['text']}>Costo Promedio por Afiliado</p>
          <p className={styles['cost']}>{
            afiliadosData.length > 1
              ? afiliadosData[1].value
              : 'No hay datos'}
          </p>
        </div>
      </div>

      <div className={`${styles["grid-item"]} ${styles.div7}`}>

        <div style={{ padding: '1rem', color: '#333', fontWeight: 'bold', textAlign: 'center', fontSize: '1.5rem' }}>
          Tabla de Recetas
        </div>

        {isLoading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px',
            fontSize: '1.1rem',
            color: '#666'
          }}>
            Cargando datos de medicamentos...
          </div>
        ) : medicamentos.length === 0 ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px',
            fontSize: '1.1rem',
            color: '#666'
          }}>
            No hay datos de medicamentos para el período seleccionado
          </div>
        ) : (
          <table
            className="striped-table"
            style={{
              borderCollapse: 'collapse',
              width: '100%',
              height: '50%',
              textAlign: 'center',
              overflowY: 'auto',
            }}
          >
            <thead>
              <tr style={{
                position: 'sticky',
                top: 0,
                zIndex: 2,
                backgroundColor: '#91b6f2ff',
                color: '#333',
              }}>
                <th style={{ width: '25%', boxSizing: 'border-box', padding: '0.3rem' }}>Medicamentos</th>
                <th style={{ width: '25%', boxSizing: 'border-box', padding: '0.3rem' }}>Presentación</th>
                <th style={{ width: '25%', boxSizing: 'border-box', padding: '0.3rem' }}>Cantidad</th>
                <th style={{ width: '25%', boxSizing: 'border-box', padding: '0.3rem' }}>Monto Equivalente</th>
              </tr>
            </thead>

            <tbody>
              {medicamentos.map((med: Data3Item, index: number) => (
                <tr key={index} style={{ color: '#141414', textAlign: 'center' }}>
                  <td style={{ width: '25%', boxSizing: 'border-box', padding: '0.3rem' }}>{med.nombre}</td>
                  <td style={{ width: '25%', boxSizing: 'border-box', padding: '0.3rem' }}>{med.monto}</td>
                  <td style={{ width: '25%', boxSizing: 'border-box', padding: '0.3rem' }}>{med.porcentaje}</td>
                  <td style={{ width: '25%', boxSizing: 'border-box', padding: '0.3rem' }}>
                    {med.cantidad !== 'No hay datos'
                      ? `$${med.cantidad}`
                      : med.cantidad}
                  </td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, 9 - medicamentos.length) }).map((_, i) => (
                <tr key={`empty-${i}`}>
                  <td style={{ width: '25%', boxSizing: 'border-box', padding: '0.3rem' }}>&nbsp;</td>
                  <td style={{ width: '25%', boxSizing: 'border-box', padding: '0.3rem' }}>&nbsp;</td>
                  <td style={{ width: '25%', boxSizing: 'border-box', padding: '0.3rem' }}>&nbsp;</td>
                  <td style={{ width: '25%', boxSizing: 'border-box', padding: '0.3rem' }}>&nbsp;</td>
                </tr>
              ))}

              <tfoot>
                <tr>asdkasdklads</tr>
              </tfoot>
            </tbody>

            <tfoot>
              {(() => {
                const total: { monto: string; porcentaje: string; cantidad: string } = sumData3(medicamentos);
                return (
                  <tr style={{
                    fontWeight: 'bold',
                    backgroundColor: '#9f9f9fff',
                    position: 'absolute',
                    bottom: 0,
                    zIndex: 1,
                    width: '100%',
                    textAlign: 'center',
                    color: '#141414'
                  }}>
                    <td>Total</td>
                    <td>{total.monto}</td>
                    <td>{total.porcentaje}</td>
                    <td>{
                      total.cantidad !== 'No hay datos'
                        ? `$${total.cantidad}`
                        : total.cantidad}
                    </td>
                  </tr>
                );
              })()}
            </tfoot>
          </table>
        )};
      </div>

      <div className={`${styles["grid-item"]} ${styles.div8}`}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 12,
            minWidth: 180,
          }}>
          <img src="/people-money.png" alt="people-money" style={{ display: 'block', borderWidth: '1px', height: '2.4rem', marginBottom: '0.5rem' }} />
          <p className={styles['text']}>Costo Promedio por Receta:</p>
          <p className={styles['cost']}>{
            isLoading
              ? 'Cargando...'
              : formatCurrencyWithValidation(metrics.costoPromedioReceta)}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 12,
            minWidth: 180,
          }}>
          <img src="/people.png" alt="people" style={{ display: 'block', borderWidth: '1px', height: '2.4rem', marginBottom: '0.5rem' }} />
          <p className={styles['text-sm']} style={{ lineHeight: '0.9' }}>Cantidad Promedio</p>
          <p className={styles['text-sm']} style={{ lineHeight: '0.9' }}>Medicamentos por Receta:</p>
          <p className={styles['value']}>{isLoading
            ? 'Cargando...'
            : formatNumberWithOneDecimal(metrics.cantidadPromedioMedicamentos)}
          </p>
        </div>
      </div>

    </div>
  );
};

export { SecondDashboard };