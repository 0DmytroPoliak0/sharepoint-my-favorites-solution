import type { ICatalogItem } from '../models/ICatalogItem';
import type { IFavouriteItem } from '../models/IFavouriteItem';
import { normalizeFavouriteItem } from './favouritesFileModel';

export function buildCatalogById(catalog: ICatalogItem[]): Map<number, ICatalogItem> {
  const map = new Map<number, ICatalogItem>();
  for (const row of catalog) {
    map.set(row.id, row);
  }
  return map;
}

/** Overlay catalog-only fields; user-editable title/url/description stay from the saved favourite. */
export function enrichFavouriteWithCatalog(
  item: IFavouriteItem,
  catalogById: Map<number, ICatalogItem>
): IFavouriteItem {
  const base: IFavouriteItem = normalizeFavouriteItem(item);

  if (base.catalogItemId === undefined) {
    return base;
  }

  const catalog: ICatalogItem | undefined = catalogById.get(base.catalogItemId);
  if (!catalog) {
    return {
      ...base,
      enabled: false,
      supportPageUrl: '',
      mobileFriendly: false,
      internal: false,
      displayAsNew: false,
      isStarter: false
    };
  }

  return normalizeFavouriteItem({
    id: base.id,
    title: base.title,
    url: base.url,
    description: base.description,
    catalogItemId: catalog.id,
    source: 'catalog',
    supportPageUrl: catalog.supportPageUrl ?? '',
    mobileFriendly: catalog.isMobileFriendly ?? false,
    internal: catalog.isInternal ?? false,
    displayAsNew: catalog.displayAsNew,
    isStarter: catalog.isStarter,
    enabled: catalog.enabled,
    category: catalog.category
  });
}

export function enrichFavouritesWithCatalog(
  items: IFavouriteItem[],
  catalog: ICatalogItem[]
): IFavouriteItem[] {
  const catalogById: Map<number, ICatalogItem> = buildCatalogById(catalog);
  return items.map((item) => enrichFavouriteWithCatalog(item, catalogById));
}

/** Manual favourites always show; catalog favourites show only when enabled in the catalog list. */
export function isFavouriteVisibleInView(item: IFavouriteItem): boolean {
  if (item.catalogItemId === undefined) {
    return true;
  }
  return item.enabled !== false;
}

export function resolveFavouritesForView(
  stored: IFavouriteItem[],
  catalog: ICatalogItem[]
): IFavouriteItem[] {
  return enrichFavouritesWithCatalog(stored, catalog).filter(isFavouriteVisibleInView);
}

export function stripFavouriteForStorage(item: IFavouriteItem): IFavouriteItem {
  const stripped: Partial<IFavouriteItem> & Pick<IFavouriteItem, 'title' | 'url'> = {
    id: item.id,
    title: item.title,
    url: item.url,
    description: item.description ?? ''
  };

  if (item.catalogItemId !== undefined) {
    return normalizeFavouriteItem({
      ...stripped,
      catalogItemId: item.catalogItemId,
      source: 'catalog'
    });
  }

  return normalizeFavouriteItem({
    ...stripped,
    internal: item.internal ?? false,
    source: item.source ?? 'manual'
  });
}

export function stripFavouritesForStorage(items: IFavouriteItem[]): IFavouriteItem[] {
  return items.map((item) => stripFavouriteForStorage(item));
}
