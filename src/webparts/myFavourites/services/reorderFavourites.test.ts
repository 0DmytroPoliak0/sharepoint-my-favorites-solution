import { normalizeFavouriteItem } from './favouritesFileModel';
import { reorderFavourites } from './reorderFavourites';

describe('reorderFavourites', () => {
  const items = [
    normalizeFavouriteItem({ id: 'a', title: 'A', url: 'https://a' }),
    normalizeFavouriteItem({ id: 'b', title: 'B', url: 'https://b' }),
    normalizeFavouriteItem({ id: 'c', title: 'C', url: 'https://c' })
  ];

  it('moves item to target index', () => {
    const reordered = reorderFavourites(items, 'c', 'a');
    expect(reordered.map((i) => i.id)).toEqual(['c', 'a', 'b']);
  });

  it('returns same array when ids are invalid', () => {
    expect(reorderFavourites(items, 'x', 'a')).toBe(items);
  });
});
