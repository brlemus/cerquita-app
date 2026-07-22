import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import { Linking, Platform } from 'react-native';

import type { ElSalvadorDepartamento } from '../data/elSalvadorDepartamentos';

export type LocationSource = 'gps' | 'geocodedLine' | 'departamento' | 'existing';
export type LocationStatus = 'idle' | 'requesting' | 'resolved' | 'manual';

export type UseAddressLocationResult = {
  status: LocationStatus;
  lat: number | null;
  lng: number | null;
  source: LocationSource | null;
  /** Sugerencia para prellenar `line` tras un reverse-geocode exitoso. */
  reverseGeocodedLine: string | null;
  canAskPermissionAgain: boolean;
  requestGps: () => Promise<void>;
  useManualFallback: () => void;
  /**
   * Intenta geocodificar el texto de `line` tal cual lo escribió el
   * usuario -- solo funciona en iOS sin permiso (Android lo exige, ver
   * docs/phases/phase-4-checkout.md). Devuelve la coordenada resuelta
   * directamente (no solo un boolean) para que el caller pueda continuar
   * el flujo de guardado sin depender de releer el estado del hook, que
   * todavía no se re-renderizó en el mismo tick.
   */
  tryGeocodeLine: (line: string) => Promise<{ lat: number; lng: number } | null>;
  selectDepartamento: (departamento: ElSalvadorDepartamento) => void;
  openSettings: () => void;
};

/**
 * Escalera de resolución de lat/lng para el formulario de direcciones.
 * Nunca bloquea el guardado por permiso negado -- ver
 * docs/phases/phase-4-checkout.md.
 */
export type AddressLocationInitial = { lat: number; lng: number };

/** `initial` -- edición de una dirección que ya tiene lat/lng guardados. */
export function useAddressLocation(initial?: AddressLocationInitial): UseAddressLocationResult {
  const [status, setStatus] = useState<LocationStatus>(initial ? 'resolved' : 'idle');
  const [lat, setLat] = useState<number | null>(initial?.lat ?? null);
  const [lng, setLng] = useState<number | null>(initial?.lng ?? null);
  const [source, setSource] = useState<LocationSource | null>(initial ? 'existing' : null);
  const [reverseGeocodedLine, setReverseGeocodedLine] = useState<string | null>(null);
  const [canAskPermissionAgain, setCanAskPermissionAgain] = useState(true);

  const requestGps = useCallback(async () => {
    setStatus('requesting');
    const { status: permissionStatus, canAskAgain } =
      await Location.requestForegroundPermissionsAsync();
    setCanAskPermissionAgain(canAskAgain);

    if (permissionStatus !== 'granted') {
      setStatus('manual');
      return;
    }

    const position = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = position.coords;

    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    const first = results[0];
    const formatted = first
      ? [first.street, first.city ?? first.subregion, first.region].filter(Boolean).join(', ')
      : null;

    setLat(latitude);
    setLng(longitude);
    setSource('gps');
    setReverseGeocodedLine(formatted);
    setStatus('resolved');
  }, []);

  const useManualFallback = useCallback(() => {
    setStatus('manual');
  }, []);

  const tryGeocodeLine = useCallback(
    async (line: string): Promise<{ lat: number; lng: number } | null> => {
      // Android exige permiso de ubicación para geocoding (docs de Expo) --
      // si llegamos acá es porque el permiso está negado, así que ni
      // intentamos la llamada nativa (fallaría igual).
      if (Platform.OS !== 'ios') {
        return null;
      }
      try {
        const results = await Location.geocodeAsync(line);
        const first = results[0];
        if (!first) {
          return null;
        }
        setLat(first.latitude);
        setLng(first.longitude);
        setSource('geocodedLine');
        setStatus('resolved');
        return { lat: first.latitude, lng: first.longitude };
      } catch {
        return null;
      }
    },
    [],
  );

  const selectDepartamento = useCallback((departamento: ElSalvadorDepartamento) => {
    setLat(departamento.lat);
    setLng(departamento.lng);
    setSource('departamento');
    setStatus('resolved');
  }, []);

  const openSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  return {
    status,
    lat,
    lng,
    source,
    reverseGeocodedLine,
    canAskPermissionAgain,
    requestGps,
    useManualFallback,
    tryGeocodeLine,
    selectDepartamento,
    openSettings,
  };
}
