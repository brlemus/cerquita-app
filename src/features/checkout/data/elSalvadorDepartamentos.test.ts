import { EL_SALVADOR_DEPARTAMENTOS } from './elSalvadorDepartamentos';

// Bounding box real de El Salvador (con margen).
const MIN_LAT = 13.15;
const MAX_LAT = 14.45;
const MIN_LNG = -90.15;
const MAX_LNG = -87.65;

describe('EL_SALVADOR_DEPARTAMENTOS', () => {
  it('tiene los 14 departamentos', () => {
    expect(EL_SALVADOR_DEPARTAMENTOS).toHaveLength(14);
  });

  it('no tiene departamentos duplicados', () => {
    const names = EL_SALVADOR_DEPARTAMENTOS.map((d) => d.departamento);
    expect(new Set(names).size).toBe(names.length);
  });

  it('todas las coordenadas están dentro del bounding box de El Salvador', () => {
    for (const { lat, lng } of EL_SALVADOR_DEPARTAMENTOS) {
      expect(lat).toBeGreaterThanOrEqual(MIN_LAT);
      expect(lat).toBeLessThanOrEqual(MAX_LAT);
      expect(lng).toBeGreaterThanOrEqual(MIN_LNG);
      expect(lng).toBeLessThanOrEqual(MAX_LNG);
    }
  });

  it('cada entrada tiene departamento y cabecera no vacíos', () => {
    for (const { departamento, cabecera } of EL_SALVADOR_DEPARTAMENTOS) {
      expect(departamento.length).toBeGreaterThan(0);
      expect(cabecera.length).toBeGreaterThan(0);
    }
  });
});
