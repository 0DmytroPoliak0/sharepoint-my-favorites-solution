import type { IFavouriteItem } from '../models/IFavouriteItem';

export function normalizeTitleForCompare(title: string): string {
  return title.trim().toLocaleLowerCase();
}

export function findFavouriteWithTitle(
  items: IFavouriteItem[],
  title: string,
  excludeId?: string
): IFavouriteItem | undefined {
  const normalized: string = normalizeTitleForCompare(title);
  if (!normalized) {
    return undefined;
  }

  return items.find(
    (item) => item.id !== excludeId && normalizeTitleForCompare(item.title) === normalized
  );
}

export function duplicateTitleError(title: string): string {
  return `A favourite named "${title.trim()}" is already in your list.`;
}

export function favouriteAlreadyAddedMessage(title: string): string {
  return `"${title.trim()}" is already in your favourites.`;
}
