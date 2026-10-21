import {
  createManualFavourite,
  favouriteItemKey,
  formValuesToFavourite,
  normalizeFavouriteItem,
  parseFavouritesFile,
  serializeFavouritesFile
} from './favouritesFileModel';

describe('favouritesFileModel', () => {
  it('serializes internal flag for manual favourites', () => {
    const items = [
      normalizeFavouriteItem({
        id: 'manual-1',
        title: 'VPN Portal',
        url: 'https://intranet.example',
        description: 'Internal only',
        internal: true,
        source: 'manual'
      })
    ];
    const json = serializeFavouritesFile(items);
    expect(json).toContain('"Internal": true');
    expect(json).not.toContain('catalogItemId');

    const parsed = parseFavouritesFile(json);
    expect(parsed[0].internal).toBe(true);
    expect(parsed[0].source).toBe('manual');
  });

  it('serializes only user-editable fields and catalog reference', () => {
    const items = [
      normalizeFavouriteItem({
        id: 'fixed-id',
        title: 'Portal',
        url: 'https://contoso.sharepoint.com',
        description: 'Main portal',
        catalogItemId: 5,
        source: 'catalog',
        supportPageUrl: 'https://should-not-persist.example/help',
        internal: true,
        displayAsNew: true
      })
    ];
    const json = serializeFavouritesFile(items);
    expect(json).toContain('"Title": "Portal"');
    expect(json).toContain('"catalogItemId": 5');
    expect(json).not.toContain('SupportPageUrl');
    expect(json).not.toContain('Internal');
    expect(json).not.toContain('DisplayAsNew');

    const parsed = parseFavouritesFile(json);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].title).toBe('Portal');
    expect(parsed[0].catalogItemId).toBe(5);
    expect(parsed[0].description).toBe('Main portal');
  });

  it('parses legacy camelCase payloads and fills required fields', () => {
    const parsed = parseFavouritesFile(
      JSON.stringify([
        {
          id: 'a',
          title: 'A',
          url: 'https://a',
          isInternal: true,
          isMobileFriendly: false
        }
      ])
    );
    expect(parsed).toHaveLength(1);
    expect(parsed[0].internal).toBe(true);
    expect(parsed[0].description).toBe('');
    expect(parsed[0].supportPageUrl).toBe('');
  });

  it('createManualFavourite sets catalog-only flags to defaults', () => {
    const item = createManualFavourite({
      title: 'Test',
      url: 'https://test.com',
      description: 'Desc',
      internal: false
    });
    expect(item.description).toBe('Desc');
    expect(item.supportPageUrl).toBe('');
    expect(item.mobileFriendly).toBe(false);
    expect(item.internal).toBe(false);
    expect(item.catalogItemId).toBeUndefined();
  });

  it('formValuesToFavourite keeps catalog reference when editing', () => {
    const updated = formValuesToFavourite(
      { title: 'New title', url: 'https://new.com', description: 'New desc', internal: false },
      {
        id: 'x',
        title: 'Old',
        url: 'https://old.com',
        description: '',
        catalogItemId: 5,
        source: 'catalog'
      }
    );
    expect(updated.title).toBe('New title');
    expect(updated.catalogItemId).toBe(5);
    expect(updated.source).toBe('catalog');
  });

  it('builds stable favourite keys', () => {
    expect(
      favouriteItemKey({
        id: '1',
        title: 'X',
        url: 'https://x',
        description: '',
        supportPageUrl: '',
        mobileFriendly: false,
        internal: false,
        catalogItemId: 42
      })
    ).toBe('catalog:42');
  });
});
