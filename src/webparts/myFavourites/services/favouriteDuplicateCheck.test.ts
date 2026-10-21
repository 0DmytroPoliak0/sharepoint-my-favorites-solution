import {
  duplicateTitleError,
  favouriteAlreadyAddedMessage,
  findFavouriteDuplicate,
  findFavouriteWithTitle,
  normalizeTitleForCompare
} from './favouriteDuplicateCheck';
import { normalizeFavouriteItem } from './favouritesFileModel';

describe('favouriteDuplicateCheck', () => {
  const items = [
    normalizeFavouriteItem({ id: '1', title: 'VPN Portal', url: 'https://a' }),
    normalizeFavouriteItem({ id: '2', title: 'HR Hub', url: 'https://b' })
  ];

  it('normalizes titles for comparison', () => {
    expect(normalizeTitleForCompare('  VPN Portal ')).toBe('vpn portal');
  });

  it('finds duplicate title case-insensitively', () => {
    expect(findFavouriteWithTitle(items, 'vpn portal')?.id).toBe('1');
    expect(findFavouriteWithTitle(items, 'HR HUB')?.id).toBe('2');
  });

  it('excludes item being edited', () => {
    expect(findFavouriteWithTitle(items, 'VPN Portal', '1')).toBeUndefined();
  });

  it('returns duplicate message', () => {
    expect(duplicateTitleError(' VPN Portal ')).toBe('A quick link named "VPN Portal" is already in your homepage quick links.');
  });

  it('returns already-added message', () => {
    expect(favouriteAlreadyAddedMessage(' VPN Portal ')).toBe('"VPN Portal" is already in your homepage quick links.');
  });
});

describe('title or URL duplicate checks', () => {
  const saved = [
    normalizeFavouriteItem({
      id: '1',
      title: 'Portal',
      url: 'https://example.com/Tools?app=one#top'
    }),
    normalizeFavouriteItem({
      id: '2',
      title: 'Staff hub',
      url: 'https://example.com/staff'
    })
  ];

  it('rejects the same URL under a different title', () => {
    expect(
      findFavouriteDuplicate(
        saved,
        'Renamed portal',
        'https://EXAMPLE.COM:443/Tools?app=one#top'
      )?.id
    ).toBe('1');
  });

  it('rejects the same title with a different URL', () => {
    expect(
      findFavouriteDuplicate(
        saved,
        ' portal ',
        'https://example.com/different'
      )?.id
    ).toBe('1');
  });

  it('allows editing an item without matching itself', () => {
    expect(
      findFavouriteDuplicate(
        saved,
        'Renamed portal',
        saved[0].url,
        '1'
      )
    ).toBeUndefined();
  });

  it('still detects another item while editing', () => {
    expect(
      findFavouriteDuplicate(saved, 'New name', saved[0].url, '2')?.id
    ).toBe('1');
  });

  it('preserves meaningful URL differences', () => {
    const differentUrls = [
      'https://example.com/Tools?app=two#top',
      'https://example.com/tools?app=one#top',
      'https://example.com/Tools?app=one#other'
    ];

    for (const url of differentUrls) {
      expect(
        findFavouriteDuplicate(saved, 'Different link', url)
      ).toBeUndefined();
    }
  });

  it('allows a new title and URL', () => {
    expect(
      findFavouriteDuplicate(
        saved,
        'New resource',
        'https://example.com/new'
      )
    ).toBeUndefined();
  });
});
