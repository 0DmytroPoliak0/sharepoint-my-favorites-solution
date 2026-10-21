import type { ICatalogItem } from '../models/ICatalogItem';
import type { IFavouriteItem } from '../models/IFavouriteItem';
import {
  enrichFavouriteWithCatalog,
  isFavouriteVisibleInView,
  resolveFavouritesForView,
  stripFavouriteForStorage
} from './favouritesCatalogMerge';
import { normalizeFavouriteItem } from './favouritesFileModel';

const catalogRow: ICatalogItem = {
  id: 10,
  title: 'Catalog title',
  url: 'https://catalog.example',
  description: 'From catalog',
  supportPageUrl: 'https://catalog.example/help',
  enabled: true,
  displayAsNew: true,
  isStarter: false,
  isMobileFriendly: true,
  isInternal: true
};

describe('favouritesCatalogMerge', () => {
  it('enriches catalog favourites from catalog map at runtime', () => {
    const stored: IFavouriteItem = normalizeFavouriteItem({
      id: 'a',
      title: 'My label',
      url: 'https://catalog.example',
      description: 'User note',
      catalogItemId: 10,
      source: 'catalog',
      internal: false,
      supportPageUrl: '',
      displayAsNew: false
    });

    const enriched = enrichFavouriteWithCatalog(stored, new Map([[10, catalogRow]]));
    expect(enriched.internal).toBe(true);
    expect(enriched.displayAsNew).toBe(true);
    expect(enriched.supportPageUrl).toBe('https://catalog.example/help');
    expect(enriched.title).toBe('My label');
    expect(enriched.description).toBe('User note');
  });

  it('hides disabled catalog favourites in view but keeps them in storage shape', () => {
    const stored: IFavouriteItem = normalizeFavouriteItem({
      id: 'b',
      title: 'Hidden',
      url: 'https://hidden.example',
      catalogItemId: 10,
      source: 'catalog'
    });
    const disabledCatalog: ICatalogItem = { ...catalogRow, enabled: false };
    const view = resolveFavouritesForView([stored], [disabledCatalog]);
    expect(view).toHaveLength(0);
    expect(isFavouriteVisibleInView(enrichFavouriteWithCatalog(stored, new Map([[10, disabledCatalog]])))).toBe(
      false
    );
  });

  it('keeps internal flag from JSON for manual favourites', () => {
    const manual: IFavouriteItem = normalizeFavouriteItem({
      id: 'm',
      title: 'Manual',
      url: 'https://manual.example',
      internal: true,
      source: 'manual'
    });
    const enriched = enrichFavouriteWithCatalog(manual, new Map());
    expect(enriched.internal).toBe(true);
  });

  it('strips catalog-only fields before persisting to JSON', () => {
    const enriched: IFavouriteItem = normalizeFavouriteItem({
      id: 'c',
      title: 'T',
      url: 'https://t.example',
      description: 'D',
      catalogItemId: 10,
      source: 'catalog',
      internal: true,
      supportPageUrl: 'https://help',
      displayAsNew: true,
      enabled: true
    });
    const stored = stripFavouriteForStorage(enriched);
    expect(stored.catalogItemId).toBe(10);
    expect(stored.internal).toBe(false);
    expect(stored.supportPageUrl).toBe('');
    expect(stored.displayAsNew).toBeUndefined();
  });

  it('keeps internal for manual favourites in storage shape', () => {
    const manual: IFavouriteItem = normalizeFavouriteItem({
      id: 'm',
      title: 'Manual',
      url: 'https://manual.example',
      internal: true,
      source: 'manual'
    });
    const stored = stripFavouriteForStorage(manual);
    expect(stored.internal).toBe(true);
    expect(stored.catalogItemId).toBeUndefined();
  });
});
