

export type LoginCredentials = {
  email: string;
  password: string;
}

export type User = {
  id: string;
  email: string;
  role: 'auditor' | 'director';
}

export type AuthResponse = {
  user: User;
  token: string;
  expiresAt: number;
}

export type BackendError = {
  message: string;
  error?: string;
  statusCode?: number;
}

export type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: 'auditor' | 'director') => boolean;
}

export type ValidationError = {
  field: string;
  message: string;
}

export type ValidationResult = {
  isValid: boolean;
  errors: ValidationError[];
}

export type DashboardData = {
  [filename: string]: Array<{ [key: string]: string }>;
}

export type S3Response = {
  data: Record<string, unknown[]>;
  files: string[];
  message: string;
}

export type S3DataState = {
  data: S3Response | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: Date | null;

  fetchS3Data: () => Promise<void>;
  setData: (data: S3Response) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearData: () => void;
}

export type MostPrescribedMedications = {
  Fecha: string;
  Medicamentos: string;
  Porcentaje: string;
  Cantidad: string;
  'Monto Equivalente': string;
}

export type Medication = {
  Fecha?: string;
  nombreComercial1: string;
  localidad: string;
  Descuento: string;
  PrecioFinalCopago: string;
  "Precio c/ Env": number;
  envases: number;
}

export type MetricsRow = {
  Fecha: string;
  'Costo Acum': string;
  'Ahorro Acum': string;
  'Q R Real': string;
  'Q R Sospe': string;
}

export type MetricsBottomRow = {
  Fecha: string;
  ID?: string;
  Descripcion: string;
  Cantidad: string;
  Costo: string;
}

export type DoctorData = {
  cantidad: string;
  costo: string;
}

export type DateRange = {
  [0]: Date | null;
  [1]: Date | null;
}

export type StringOrDateOrNull = string | Date | null;

export type AuthProviderProps = {
  children: React.ReactNode;
}

export type LoginFormProps = {
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  isLoading: boolean;
}

export type ApiResponse<T> = {
  data: T;
  message: string;
  success: boolean;
}

export type ErrorResponse = {
  message: string;
  error: string;
  statusCode: number;
}

export type CsvRow = {
  [key: string]: string;
}

export type CsvData = {
  [filename: string]: CsvRow[];
}

export type MedicationRow = {
  localidad: string;
  PrecioFinalCopago: string;
  [key: string]: string;
}

export type SumsByLocality = {
  [localidad: string]: number;
}

export type GeoJsonProperties = {
  cabecera?: string;
  departamento?: string;
  [key: string]: string | number | undefined;
}

export type MinMaxValues = {
  min: number;
  max: number;
}

export type LabelData = {
  position: [number, number];
  nombre: string;
  value?: number;
}

export type MapProps = {
  onLocalityClick?: (localidad: string) => void;
  dateRange?: DateRange;
  billingData?: CsvRow[];
  selectedLocalities?: string[];
}

export type PolygonLabelsProps = {
  geojson: GeoJSON.FeatureCollection;
  sums: SumsByLocality;
  hoveredMunicipality: string | null;
}

export type LoginRequest = {
  email: string;
  password: string;
}

export type LoginResponse = {
  user: User;
  token: string;
  expiresAt: number;
}

export type LogoutResponse = {
  message: string;
}

export type ProfileResponse = {
  email: string;
  role: string;
}

export type RecipeValuesRow = {
  'Cantidad Med Rx': string,
  'Costo Prom Rx': string,
  'Fecha': string
}

export type MostPrescribedMeds = {
  nombre: string;
  monto: string;
  montoNumero: number;
  porcentaje: string;
  porcentajeNumero: number;
  cantidad: string;
  cantidadNumero: number;
  fecha: string;
}

export type InfoDataItem = {
  label: string;
  value: string;
}

export type SecondDashboardMetrics = {
  recetasAuditadas: number;
  recetasConDesvio: number;
  costoAcumulado: number;
  ahorroAcumulado: number;
  medicosRegistrados: number;
  costoPromedioMedico: number;
  afiliadosRegistrados: number;
  costoPromedioAfiliado: number;
  costoPromedioReceta: number;
  cantidadPromedioMedicamentos: number;
}

export type SecondDashboardState = {
  metrics: SecondDashboardMetrics;
  medicamentos: MostPrescribedMeds[];
  infoData: InfoDataItem[];
  afiliadosData: InfoDataItem[];
  isLoading: boolean;
  error: string | null;
}

export type RecetaSospechosa = {
  link: string;
  id: string;
  patient_department: string;
  motivoSospecha1: string;
  motivoSospecha2: string;
  patient_id: string;
  suspicion_percentage: string;
  total_discounted_price: string;
  timestamp: string;
}

export type RecetaAuditada = {
  localidad: string;
  medicamento: string;
  montoTotal: number;
  vecesPrescripto: number;
  patient_id: string;
  suspicion_percentage: string;
}

export type ThirdDashboardProps = {
  dateRange: DateRange;
}

export type ThirdDashboardState = {
  recetasAuditadas: number;
  costoAcumulado: number;
  costoAcumuladoFiltrado: number;
  suspicionPercentage: number;
  recetasSospechosasFiltradas: RecetaSospechosa[];
  recetaActualIndex: number;
  recetasAuditadasFiltradas: number;
  ahorroEstimado: number;
  ahorroEstimadoFiltrado: number;
  ahorroTratamientoSugerido: number;
  ahorroTratamientoSugeridoFiltrado: number;
  costoPromedioReceta: number;
  costoPromedioRecetaFiltrado: number;
  cantidadPacientesRegistrados: number;
  cantidadPacientesRegistradosFiltrado: number;
  costoPromedioPaciente: number;
  costoPromedioPacienteFiltrado: number;
  localidadSeleccionada: string | null;
  localidadFiltro: string | null;
  isLoading: boolean;
  error: string | null;
}

export type FirstDashboardProps = {
  dateRange: DateRange;
}

export type SecondDashboardProps = {
  dateRange: DateRange;
}

export type FirstDashboardState = {
  recetasAuditadas: number;
  recetasConDesvio: number;
  costoAcumulado: number;
  ahorroAcumulado: number;
  medicosRegistrados: number;
  costoPromedioMedico: number;
  afiliadosRegistrados: number;
  costoPromedioAfiliado: number;
  costoPromedioReceta: number;
  cantidadPromedioMedicamentos: number;
  isLoading: boolean;
  error: string | null;
}

export type FilterItem = {
  value: string;
  label: string;
  gasto: string;
  gastoOriginal: number;
}
