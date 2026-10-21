import {
  DEFAULT_MAX_ROWS,
  getColumnsForWidth,
  getPageCount,
  getPageSize,
  normalizeMaxRows
} from './gridLayout';

describe('gridLayout', () => {
  it('normalizeMaxRows defaults to 3 and accepts positive integers', () => {
    expect(normalizeMaxRows(undefined)).toBe(DEFAULT_MAX_ROWS);
    expect(normalizeMaxRows('3')).toBe(3);
    expect(normalizeMaxRows(1)).toBe(1);
    expect(normalizeMaxRows(5)).toBe(5);
    expect(normalizeMaxRows(0)).toBe(DEFAULT_MAX_ROWS);
    expect(normalizeMaxRows('')).toBe(DEFAULT_MAX_ROWS);
  });

  it('getPageSize multiplies columns by max rows', () => {
    expect(getPageSize(9, 1)).toBe(9);
    expect(getPageSize(9, 3)).toBe(27);
    expect(getPageSize(3, 3)).toBe(9);
  });

  it('getPageCount adds pages when items exceed capacity', () => {
    expect(getPageCount(10, 9)).toBe(2);
    expect(getPageCount(9, 9)).toBe(1);
    expect(getPageCount(0, 9)).toBe(1);
  });

  it('getColumnsForWidth fits tiles to available width', () => {
    expect(getColumnsForWidth(400)).toBe(4);
    expect(getColumnsForWidth(999)).toBe(10);
    expect(getColumnsForWidth(1200)).toBe(12);
  });
});
