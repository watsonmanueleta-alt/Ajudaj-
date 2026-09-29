/**
 * Cálculo de distância geodésica pela fórmula de Haversine em Kilómetros
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function formatDistance(distanceKm?: number): string {
  if (distanceKm === undefined || isNaN(distanceKm)) {
    return 'Distância não calculada';
  }
  if (distanceKm < 1) {
    return `A ${(distanceKm * 1000).toFixed(0)}m de si`;
  }
  return `A ${distanceKm.toFixed(1)} km de si`;
}

export interface UserCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

// Coordenadas padrão em Luanda (Marco Histórico) caso utilizador rejeite GPS
export const DEFAULT_LUANDA_COORDS: UserCoordinates = {
  latitude: -8.839988,
  longitude: 13.289437,
};

export async function requestDeviceLocation(): Promise<UserCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não é suportada pelo seu navegador'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        console.warn('Erro ao obter geolocalização:', error.message);
        // Fallback gracioso para Luanda
        resolve(DEFAULT_LUANDA_COORDS);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}
