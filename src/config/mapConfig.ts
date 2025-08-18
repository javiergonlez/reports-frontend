// Config de mapa
export const MAP_CONFIG = {
  // Stadia Maps con tiles oscuros
  primary: {
    name: 'Stadia Maps',
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
    requiresApiKey: true
  },
  // Respaldo (OpenStreetMap sin API key)
  fallback: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    requiresApiKey: false
  }
} as const;

export const getActiveMapConfig = () => {
  const stadiaKey: string | undefined = import.meta.env.VITE_STADIA_KEY;

  if (stadiaKey && stadiaKey.trim() !== '') {
    return {
      ...MAP_CONFIG.primary,
      url: `${MAP_CONFIG.primary.url}?api_key=${stadiaKey}`,
      isActive: true
    };
  }

  return {
    ...MAP_CONFIG.fallback,
    isActive: false
  };
}; 