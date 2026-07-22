import { addressFormSchema } from './schemas';

describe('addressFormSchema', () => {
  it('acepta line no vacío, sin label/instructions', () => {
    const result = addressFormSchema.safeParse({ line: 'Frente a la tienda El Progreso' });
    expect(result.success).toBe(true);
  });

  it('rechaza line vacío', () => {
    const result = addressFormSchema.safeParse({ line: '' });
    expect(result.success).toBe(false);
  });

  it('rechaza line de más de 300 caracteres', () => {
    const result = addressFormSchema.safeParse({ line: 'a'.repeat(301) });
    expect(result.success).toBe(false);
  });

  it('rechaza instructions de más de 300 caracteres', () => {
    const result = addressFormSchema.safeParse({
      line: 'Casa azul',
      instructions: 'a'.repeat(301),
    });
    expect(result.success).toBe(false);
  });

  it('rechaza label de más de 50 caracteres', () => {
    const result = addressFormSchema.safeParse({ line: 'Casa azul', label: 'a'.repeat(51) });
    expect(result.success).toBe(false);
  });

  it('acepta label e instructions opcionales presentes', () => {
    const result = addressFormSchema.safeParse({
      line: 'Casa azul',
      label: 'Casa',
      instructions: 'Toca el timbre',
    });
    expect(result.success).toBe(true);
  });
});
