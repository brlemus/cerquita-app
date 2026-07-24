import { feedbackSchema } from './schemas';

describe('feedbackSchema', () => {
  it('acepta text sin category', () => {
    expect(feedbackSchema.safeParse({ text: 'Me encanta la app' }).success).toBe(true);
  });

  it('acepta text con category válida', () => {
    expect(feedbackSchema.safeParse({ text: 'Encontré un bug', category: 'BUG' }).success).toBe(
      true,
    );
  });

  it('rechaza text vacío', () => {
    expect(feedbackSchema.safeParse({ text: '' }).success).toBe(false);
  });

  it('rechaza text de más de 2000 caracteres', () => {
    expect(feedbackSchema.safeParse({ text: 'a'.repeat(2001) }).success).toBe(false);
  });

  it('rechaza una category inválida', () => {
    expect(feedbackSchema.safeParse({ text: 'x', category: 'OTRA' }).success).toBe(false);
  });
});
