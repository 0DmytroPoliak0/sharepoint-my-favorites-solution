import type { IFavouriteItem } from '../models/IFavouriteItem';

/** Moves one favourite before another by id (stable reorder for drag-and-drop). */
export function reorderFavourites(
  items: IFavouriteItem[],
  sourceId: string,
  targetId: string
): IFavouriteItem[] {
  const fromIndex: number = items.findIndex((item) => item.id === sourceId);
  const toIndex: number = items.findIndex((item) => item.id === targetId);

  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return items;
  }

  const next: IFavouriteItem[] = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}
