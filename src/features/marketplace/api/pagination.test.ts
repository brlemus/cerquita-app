import { getNextCursorParam } from './pagination';

describe('getNextCursorParam', () => {
  it('devuelve el cursor cuando hasNextPage es true', () => {
    expect(getNextCursorParam({ data: [], nextCursor: 'abc', hasNextPage: true })).toBe('abc');
  });

  it('devuelve undefined cuando hasNextPage es false, incluso con nextCursor presente', () => {
    expect(getNextCursorParam({ data: [], nextCursor: 'abc', hasNextPage: false })).toBeUndefined();
  });

  it('devuelve undefined cuando no hay más páginas y nextCursor es null', () => {
    expect(getNextCursorParam({ data: [], nextCursor: null, hasNextPage: false })).toBeUndefined();
  });
});
