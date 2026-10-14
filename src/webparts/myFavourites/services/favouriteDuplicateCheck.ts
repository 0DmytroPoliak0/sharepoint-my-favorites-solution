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
  return `A quick link named "${title.trim()}" is already in your homepage quick links.`;
}

export function favouriteAlreadyAddedMessage(title: string): string {
  return `"${title.trim()}" is already in your homepage quick links.`;
}

export function normalizeUrlForCompare(url: string): string {
  const trimmed: string = url.trim();
  if (!trimmed) {
    return '';
  }

  try {
    return new URL(trimmed).href;
  } catch {
    return trimmed;
  }
}

export function findFavouriteDuplicate(
  items: IFavouriteItem[],
  title: string,
  url: string,
  excludeId?: string
): IFavouriteItem | undefined {
  const normalizedTitle: string = normalizeTitleForCompare(title);
  const normalizedUrl: string = normalizeUrlForCompare(url);

  return items.find((item) => {
    if (item.id === excludeId) {
      return false;
    }

    const sameTitle: boolean =
      normalizedTitle.length > 0 &&
      normalizeTitleForCompare(item.title) === normalizedTitle;

    const sameUrl: boolean =
      normalizedUrl.length > 0 &&
      normalizeUrlForCompare(item.url) === normalizedUrl;

    return sameTitle || sameUrl;
  });
}