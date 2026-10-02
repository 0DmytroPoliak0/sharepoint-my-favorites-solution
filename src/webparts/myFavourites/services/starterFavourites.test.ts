import type { ICatalogItem } from '../models/ICatalogItem';
import { buildStarterFavouritesFromCatalog } from './starterFavourites';

describe('starterFavourites', () => {
  const catalog: ICatalogItem[] = [
    {
      id: 1,
      title: 'Starter A',
      url: 'https://a',
      enabled: true,
      isStarter: true
    },
    {
      id: 2,
      title: 'Not starter',
      url: 'https://b',
      enabled: true,
      isStarter: false
    },
    {
      id: 3,
      title: 'Disabled starter',
      url: 'https://c',
      enabled: false,
      isStarter: true
    }
  ];

  it('returns only enabled starter catalog items', () => {
    const items = buildStarterFavouritesFromCatalog(catalog);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('Starter A');
    expect(items[0].catalogItemId).toBe(1);
    expect(items[0].source).toBe('catalog');
  });
});
