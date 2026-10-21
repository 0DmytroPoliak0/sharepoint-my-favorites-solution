export const DEFAULT_MAX_ROWS: number = 3;
export const TILE_SIZE_PX: number = 92;
export const TILE_GAP_PX: number = 8;

/** Fits as many ~92px tile columns as the available grid width allows. */
export function getColumnsForWidth(width: number): number {
  if (!Number.isFinite(width) || width <= 0) {
    return 1;
  }
  const unit: number = TILE_SIZE_PX + TILE_GAP_PX;
  return Math.max(1, Math.floor((width + TILE_GAP_PX) / unit));
}

/** Coerces web part property to a positive row count (default 3). */
export function normalizeMaxRows(value: number | string | undefined): number {
  const parsed: number = typeof value === 'string' ? parseInt(value, 10) : Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_MAX_ROWS;
  }
  return Math.floor(parsed);
}

export function getPageSize(columnsPerRow: number, maxRows: number): number {
  const columns: number = Math.max(1, columnsPerRow);
  const rows: number = Math.max(1, maxRows);
  return columns * rows;
}

export function getPageCount(itemCount: number, pageSize: number): number {
  if (itemCount <= 0) {
    return 1;
  }
  return Math.max(1, Math.ceil(itemCount / Math.max(1, pageSize)));
}
