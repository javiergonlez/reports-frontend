//------------------------------------------------------------------------------------------------------------------------------

import { useEffect, useState } from "react";
import styles from "./first-dashboard.module.css";
import type { CsvRow, DateRange, DoctorData, MetricsBottomRow, MetricsRow, RecipeValuesRow } from "../../../types";
import { useS3DataStore } from "../../../stores/s3DataStore";
import { useTokenExpiration } from "../../../hooks/useTokenExpiration";
import { filterDataByDateRange, formatNumberNormalized, formatCurrencyNormalized, parseDate } from "../../../utils/dateUtils";
import { IconSpreadsheet } from "../../../Icons/IconSpreadsheet";
import { IconDoctor } from "../../../Icons/IconDoctor";
import "../../../App.css";
import { IconDanger } from "../../../Icons/IconDanger";
import { IconMoney } from "../../../Icons/IconMoney";
import { IconPeople } from "../../../Icons/IconPeople";
import { IconPeopleMoney } from "../../../Icons/IconPeopleMoney";
import { IconMedicine } from "../../../Icons/IconMedicine";

//------------------------------------------------------------------------------------------------------------------------------

interface FirstDashboardProps {
  dateRange: DateRange;
}

function hasValidData(value: number): boolean {
  return value > 0;
}

function formatNumberWithValidation(value: number): string {
  return hasValidData(value) ? formatNumberNormalized(value) : 'No hay datos';
}

function formatCurrencyWithValidation(value: number): string {
  return hasValidData(value) ? formatCurrencyNormalized(value) : 'No hay datos';
}

function parseMonto(monto: string): number {
  return parseFloat(monto.replace(/[$\s]/g, '').replace(/,/g, ''));
}

const FirstDashboard: React.FC<FirstDashboardProps> = ({ dateRange }) => {

  const [costoAcumulado, setCostoAcumulado] = useState<number>(0);
  const [ahorroAcumulado, setAhorroAcumulado] = useState<number>(0);
  const [auditedRecipes, setAuditedRecipes] = useState<number>(0);
  const [detectedRecipes, setDetectedRecipes] = useState<number>(0);

  const [doctorData, setDoctorData] = useState<DoctorData | null>(null);
  const [affiliateData, setAffiliateData] = useState<DoctorData | null>(null);
  const [mostRecetedMeds] = useState<string>('Clonazepam');

  const [cantidadPromedioMedicamentos, setCantidadPromedioMedicamentos] = useState<number>(0);
  const [costoPromedioReceta, setCostoPromedioReceta] = useState<number>(0);

  const { data, error, fetchS3Data } = useS3DataStore();

  useTokenExpiration();

  useEffect((): void => {
    if (!data) {
      fetchS3Data();
    }
  }, [data, fetchS3Data]);

  useEffect((): void => {
    if (data?.data) {
      const metricsTopData: CsvRow[] = (data.data['metricas-arriba.csv'] as CsvRow[]) || [];

      const metricsRows: MetricsRow[] = metricsTopData.map((row: CsvRow): MetricsRow => ({
        Fecha: row.Fecha || '',
        'Costo Acum': row['Costo Acum'] || '',
        'Ahorro Acum': row['Ahorro Acum'] || '',
        'Q R Real': row['Q R Real'] || '',
        'Q R Sospe': row['Q R Sospe'] || ''
      }));

      const filteredRows: MetricsRow[] = filterDataByDateRange(metricsRows, dateRange);

      let totalRecetasAuditadas: number = 0;
      let totalRecetasConDesvio: number = 0;

      let latestCostoAcumulado: number = 0;
      let latestAhorroAcumulado: number = 0;
      let latestDate: Date | null = null;

      for (const row of filteredRows) {
        if (row['Q R Real']) {
          totalRecetasAuditadas += parseInt(row['Q R Real'].replace(/,/g, '')) || 0;
        }

        if (row['Q R Sospe']) {
          totalRecetasConDesvio += parseInt(row['Q R Sospe'].replace(/,/g, '')) || 0;
        }

        if (row.Fecha) {
          const rowDate: Date | null = parseDate(row.Fecha);
          if (rowDate && (!latestDate || rowDate > latestDate)) {
            latestDate = rowDate;
            latestCostoAcumulado = parseMonto(row['Costo Acum'] || '0');
            latestAhorroAcumulado = parseMonto(row['Ahorro Acum'] || '0');
          }
        }
      }

      setDetectedRecipes(totalRecetasConDesvio);
      setAuditedRecipes(totalRecetasAuditadas);
      setCostoAcumulado(latestCostoAcumulado);
      setAhorroAcumulado(latestAhorroAcumulado);
    }
  }, [data, dateRange]);

  useEffect((): void => {
    if (data?.data) {
      const metricsBottomData: CsvRow[] = (data.data['metricas-abajo.csv'] as CsvRow[]) || [];

      const metricsBottomRows: MetricsBottomRow[] = metricsBottomData.map((row: CsvRow): MetricsBottomRow => ({
        Fecha: row.Fecha || '',
        ID: row.ID,
        Descripcion: row.Descripcion || '',
        Cantidad: row.Cantidad || '',
        Costo: row.Costo || ''
      }));

      const filteredRows: MetricsBottomRow[] = filterDataByDateRange(metricsBottomRows, dateRange);

      let latestDoctor: MetricsBottomRow | null = null;
      let latestDoctorDate: Date | null = null;
      let latestPatient: MetricsBottomRow | null = null;
      let latestPatientDate: Date | null = null;

      for (const row of filteredRows) {
        if (!row.Fecha || !row.Descripcion) continue;
        const rowDate: Date | null = parseDate(row.Fecha);
        if (!rowDate) continue;

        if (row.Descripcion === 'Medico') {
          if (!latestDoctorDate || rowDate > latestDoctorDate) {
            latestDoctorDate = rowDate;
            latestDoctor = row;
          }
        }
        if (row.Descripcion === 'Paciente') {
          if (!latestPatientDate || rowDate > latestPatientDate) {
            latestPatientDate = rowDate;
            latestPatient = row;
          }
        }
      }

      setDoctorData(latestDoctor ? { cantidad: latestDoctor.Cantidad, costo: latestDoctor.Costo } : null);
      setAffiliateData(latestPatient ? { cantidad: latestPatient.Cantidad, costo: latestPatient.Costo } : null);
    }
  }, [data, dateRange]);

  useEffect((): void => {
    if (data?.data) {
      const recipeValues: CsvRow[] = (data.data['valores-recetas.csv'] as CsvRow[]) || [];


      const recipeValuesRows: RecipeValuesRow[] = recipeValues.map((row: CsvRow): RecipeValuesRow => ({
        Fecha: row.Fecha || '',
        'Cantidad Med Rx': row['Cantidad Med Rx'] || '',
        'Costo Prom Rx': row['Costo Prom Rx'] || '',
      }));



      const filteredRows: RecipeValuesRow[] = filterDataByDateRange(recipeValuesRows, dateRange);

      let latestRow: RecipeValuesRow | null = null;
      let latestDate: Date | null = null;

      for (const row of filteredRows) {
        if (!row.Fecha || !row['Cantidad Med Rx'] || !row['Costo Prom Rx']) continue;
        const rowDate: Date | null = parseDate(row.Fecha);
        if (!rowDate) continue;

        if (!latestDate || rowDate > latestDate) {
          latestDate = rowDate;
          latestRow = row;
        }
      }



      if (latestRow) {

        const cantidadMed: number = parseFloat(latestRow['Cantidad Med Rx'] || '0');
        setCantidadPromedioMedicamentos(isNaN(cantidadMed) ? 0 : cantidadMed);

        const costoProm: string = latestRow['Costo Prom Rx'];

        if (costoProm && costoProm.trim() !== '') {
          const costoClean: string = costoProm.replace(/[$,]/g, '');

          const costoNum: number = parseFloat(costoClean);

          if (!isNaN(costoNum)) {
            setCostoPromedioReceta(costoNum);
          } else {

            setCostoPromedioReceta(0);

          }
        } else {

          setCostoPromedioReceta(0);

        }
      } else {
        setCantidadPromedioMedicamentos(0);
        setCostoPromedioReceta(0);
      }
    }
  }, [data, dateRange]);

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

  //------------------------------------------------------------------------------------------------------------------------------

  return (
    <>
      <div className={styles.parent}>

        <div className={`${styles["grid-item"]} ${styles.div1}`}>
          <p className="textItalic">Recetas Auditadas</p>
          <div className={styles.iconValueWrapper}>
            <IconSpreadsheet />
            <p className="text">{formatNumberWithValidation(auditedRecipes)}</p>
          </div>
        </div>

        <div className={`${styles["grid-item"]} ${styles.div2}`}>
          <p className="textItalic">Recetas con Desvío Detectados</p>
          <div className={styles.iconValueWrapper}>
            <IconDanger />
            <p className="text">{formatNumberWithValidation(detectedRecipes)}</p>
          </div>
        </div>

        <div className={`${styles["grid-item"]} ${styles.div3}`}>
          <p className="textItalic">Costo Acumulado</p>
          <p className="text">{formatCurrencyWithValidation(costoAcumulado)}</p>
        </div>

        <div className={`${styles["grid-item"]} ${styles.div4}`}>
          <p className="textItalic">Posible Ahorro Estimado</p>
          <p className="text">{formatCurrencyWithValidation(ahorroAcumulado)}</p>
        </div>

        <div className={`${styles["grid-item"]} ${styles.div5}`}>
          <div className={styles.metricItem}>
            <IconDoctor />
            <p className="textItalic">Médicos Registrados</p>
            <p className="text">
              {doctorData && hasValidData(parseInt(doctorData.cantidad || '0'))
                ? formatNumberNormalized(parseInt(doctorData.cantidad))
                : 'No hay datos'}
            </p>
          </div>
          <div className={styles.metricItem}>
            <IconMoney />
            <p className="textItalic">Costo Promedio por Médico</p>
            <p className="text">
              {doctorData && hasValidData(parseMonto(doctorData.costo || '0'))
                ? formatCurrencyNormalized(parseMonto(doctorData.costo))
                : 'No hay datos'}
            </p>
          </div>
          <div className={styles.metricItem}>
            <IconDoctor />
            <p className="textItalic">Cantidad Promedio Medicamentos por Receta</p>
            <p className="text">{formatNumberWithValidation(cantidadPromedioMedicamentos)}</p>
          </div>
          <div className={styles.metricItem}>
            <IconDoctor />
            <p className="textItalic">Costo Promedio por Receta</p>
            <p className="text">{formatCurrencyWithValidation(costoPromedioReceta)}</p>
          </div>
        </div>
        <div className={`${styles["grid-item"]} ${styles.div6}`}>
          <div className={styles.metricItem}>
            <IconPeople />
            <p className="textItalic">Afiliados Registrados</p>
            <p className="text">
              {affiliateData && hasValidData(parseInt(affiliateData.cantidad || '0'))
                ? formatNumberNormalized(parseInt(affiliateData.cantidad))
                : 'No hay datos'}
            </p>
          </div>
          <div className={styles.metricItem}>
            <IconPeopleMoney />
            <p className="textItalic">Costo Promedio por Afiliado</p>
            <p className="text">
              {affiliateData && hasValidData(parseMonto(affiliateData.costo || '0'))
                ? formatCurrencyNormalized(parseMonto(affiliateData.costo))
                : 'No hay datos'}
            </p>
          </div>
          <div className={styles.metricItem}>
            <IconMedicine />
            <p className="textItalic">Medicamentos más recetados</p>
            <p className="text">{mostRecetedMeds || 'No hay datos'}</p>
            {/* TODO: PREGUNTAR POR mostRecetedMeds */}
          </div>
        </div>
      </div>
    </>
  );
}

export { FirstDashboard };