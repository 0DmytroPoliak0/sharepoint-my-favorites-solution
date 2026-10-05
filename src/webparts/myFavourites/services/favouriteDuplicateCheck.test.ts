import {
  duplicateTitleError,
  favouriteAlreadyAddedMessage,
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
