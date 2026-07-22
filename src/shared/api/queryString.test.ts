import { buildQueryString } from './queryString';

describe('buildQueryString', () => {
  it('devuelve string vacío sin params', () => {
    expect(buildQueryString({})).toBe('');
  });

  it('omite undefined, null y string vacío', () => {
    expect(buildQueryString({ a: undefined, b: null, c: '' })).toBe('');
  });

  it('arma el query string con ? y los params presentes', () => {
    expect(buildQueryString({ cursor: 'abc', limit: 20 })).toBe('?cursor=abc&limit=20');
  });

  it('encodea valores especiales', () => {
    expect(buildQueryString({ search: 'paletería lili' })).toBe('?search=paleter%C3%ADa+lili');
  });

  it('omite solo los params vacíos, mantiene el resto', () => {
    expect(buildQueryString({ search: undefined, platformCategoryId: 'cat-1' })).toBe(
      '?platformCategoryId=cat-1',
    );
  });
});
