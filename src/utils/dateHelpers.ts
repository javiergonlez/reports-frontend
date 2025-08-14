// Used for the DateInputPicker
const getDatePresets = (): Array<{
  value: [string, string];
  label: string;
}> => {
  const today: Date = new Date();
  const yesterday: Date = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const lastMonthStart: Date = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd: Date = new Date(today.getFullYear(), today.getMonth(), 0);

  const threeMonthsAgo: Date = new Date(today.getFullYear(), today.getMonth() - 2, 1);
  const sixMonthsAgo: Date = new Date(today.getFullYear(), today.getMonth() - 5, 1);

  const lastYearStart: Date = new Date(today.getFullYear() - 1, 0, 1);
  const lastYearEnd: Date = new Date(today.getFullYear() - 1, 11, 31);

  return [
    {
      value: [today.toISOString().slice(0, 10), today.toISOString().slice(0, 10)] as [string, string],
      label: 'Hoy'
    },
    {
      value: [yesterday.toISOString().slice(0, 10), yesterday.toISOString().slice(0, 10)] as [string, string],
      label: 'Ayer'
    },
    {
      value: [lastMonthStart.toISOString().slice(0, 10), lastMonthEnd.toISOString().slice(0, 10)] as [string, string],
      label: 'Mes pasado'
    },
    {
      value: [threeMonthsAgo.toISOString().slice(0, 10), today.toISOString().slice(0, 10)] as [string, string],
      label: 'Últimos 3 meses'
    },
    {
      value: [sixMonthsAgo.toISOString().slice(0, 10), today.toISOString().slice(0, 10)] as [string, string],
      label: 'Últimos 6 meses'
    },
    {
      value: [lastYearStart.toISOString().slice(0, 10), lastYearEnd.toISOString().slice(0, 10)] as [string, string],
      label: 'Año pasado'
    },
  ];
}; 

// Used for the FiltroFecha component - Range presets
const getDateRangePresets = (): Array<{
  value: [string, string];
  label: string;
}> => {
  const today: Date = new Date();
  
  // Función auxiliar para formatear fechas sin problemas de zona horaria
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Día anterior
  const yesterday: Date = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  // Semana anterior (7 días atrás hasta ayer)
  const weekAgo: Date = new Date(today);
  weekAgo.setDate(today.getDate() - 7);
  const dayBeforeYesterday: Date = new Date(today);
  dayBeforeYesterday.setDate(today.getDate() - 2);
  
  // Mes anterior (mes completo anterior)
  const lastMonthStart: Date = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd: Date = new Date(today.getFullYear(), today.getMonth(), 0);
  
  // 3 meses anteriores (desde hace 3 meses hasta hoy)
  const threeMonthsAgo: Date = new Date(today.getFullYear(), today.getMonth() - 3, 1);
  
  // 6 meses anteriores (desde hace 6 meses hasta hoy)
  const sixMonthsAgo: Date = new Date(today.getFullYear(), today.getMonth() - 6, 1);
  
  // Año anterior (año completo anterior)
  const lastYearStart: Date = new Date(today.getFullYear() - 1, 0, 1);
  const lastYearEnd: Date = new Date(today.getFullYear() - 1, 11, 31);

  return [
    {
      value: [formatDate(yesterday), formatDate(yesterday)] as [string, string],
      label: 'Día anterior'
    },
    {
      value: [formatDate(weekAgo), formatDate(dayBeforeYesterday)] as [string, string],
      label: 'Semana anterior'
    },
    {
      value: [formatDate(lastMonthStart), formatDate(lastMonthEnd)] as [string, string],
      label: 'Mes anterior'
    },
    {
      value: [formatDate(threeMonthsAgo), formatDate(today)] as [string, string],
      label: '3 meses anteriores'
    },
    {
      value: [formatDate(sixMonthsAgo), formatDate(today)] as [string, string],
      label: '6 meses anteriores'
    },
    {
      value: [formatDate(lastYearStart), formatDate(lastYearEnd)] as [string, string],
      label: 'Año anterior'
    },
  ];
};

export { getDatePresets, getDateRangePresets };