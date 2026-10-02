import type { ICatalogItem } from '../models/ICatalogItem';
import type { IFavouriteItem } from '../models/IFavouriteItem';
import { normalizeFavouriteItem } from './favouritesFileModel';

/** Enabled catalog rows marked as starter defaults for new users. */
export function buildStarterFavouritesFromCatalog(catalog: ICatalogItem[]): IFavouriteItem[] {
  const starters: IFavouriteItem[] = [];
  for (const row of catalog) {
    if (row.isStarter === true && row.enabled) {
      starters.push(
        normalizeFavouriteItem({
          title: row.title,
          url: row.url,
          description: row.description ?? '',
          catalogItemId: row.id,
          source: 'catalog'
        })
      );
    }
  }
  return starters;
}
