import { reviewSchema } from './schemas';

describe('reviewSchema', () => {
  it('acepta rating 1-5 sin comment', () => {
    expect(reviewSchema.safeParse({ rating: 4 }).success).toBe(true);
  });

  it('acepta rating con comment', () => {
    expect(reviewSchema.safeParse({ rating: 5, comment: 'Excelente' }).success).toBe(true);
  });

  it('rechaza rating 0', () => {
    expect(reviewSchema.safeParse({ rating: 0 }).success).toBe(false);
  });

  it('rechaza rating mayor a 5', () => {
    expect(reviewSchema.safeParse({ rating: 6 }).success).toBe(false);
  });

  it('rechaza rating no entero', () => {
    expect(reviewSchema.safeParse({ rating: 3.5 }).success).toBe(false);
  });

  it('rechaza comment de más de 1000 caracteres', () => {
    expect(reviewSchema.safeParse({ rating: 3, comment: 'a'.repeat(1001) }).success).toBe(false);
  });
});
