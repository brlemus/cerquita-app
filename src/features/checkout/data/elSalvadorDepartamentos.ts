/**
 * Piso garantizado de la escalera de resolución de ubicación (ver
 * docs/phases/phase-4-checkout.md) -- nunca depende de red ni de permiso.
 *
 * Ajuste de alcance sobre el plan original ("municipio" -> "departamento"):
 * verificar coordenadas confiables para los ~262 municipios tradicionales
 * (o los 44 distritos de la reforma 2021-2024, sin fuentes consolidadas
 * todavía) no es viable sin arriesgar precisión inventada. Las 14
 * cabeceras departamentales sí están verificadas una por una.
 *
 * Fuente: infobox "Coordinates" del artículo de Wikipedia (en.wikipedia.org)
 * de cada cabecera departamental, consultado 2026-07-22.
 */
export type ElSalvadorDepartamento = {
  departamento: string;
  /** Cabecera departamental (capital) -- el punto de referencia real. */
  cabecera: string;
  lat: number;
  lng: number;
};

export const EL_SALVADOR_DEPARTAMENTOS: ElSalvadorDepartamento[] = [
  { departamento: 'Ahuachapán', cabecera: 'Ahuachapán', lat: 13.91694, lng: -89.85 },
  { departamento: 'Cabañas', cabecera: 'Sensuntepeque', lat: 13.867, lng: -88.633 },
  { departamento: 'Chalatenango', cabecera: 'Chalatenango', lat: 14.033, lng: -88.933 },
  { departamento: 'Cuscatlán', cabecera: 'Cojutepeque', lat: 13.72167, lng: -88.93444 },
  { departamento: 'La Libertad', cabecera: 'Santa Tecla', lat: 13.67306, lng: -89.24056 },
  { departamento: 'La Paz', cabecera: 'Zacatecoluca', lat: 13.5, lng: -88.867 },
  { departamento: 'La Unión', cabecera: 'La Unión', lat: 13.33694, lng: -87.84389 },
  { departamento: 'Morazán', cabecera: 'San Francisco Gotera', lat: 13.7, lng: -88.1 },
  { departamento: 'San Miguel', cabecera: 'San Miguel', lat: 13.48139, lng: -88.1775 },
  { departamento: 'San Salvador', cabecera: 'San Salvador', lat: 13.69889, lng: -89.19139 },
  { departamento: 'San Vicente', cabecera: 'San Vicente', lat: 13.64528, lng: -88.78417 },
  { departamento: 'Santa Ana', cabecera: 'Santa Ana', lat: 13.995, lng: -89.55611 },
  { departamento: 'Sonsonate', cabecera: 'Sonsonate', lat: 13.717, lng: -89.717 },
  { departamento: 'Usulután', cabecera: 'Usulután', lat: 13.34583, lng: -88.42306 },
];
