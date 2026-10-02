import { buildCatalogFieldMap } from './catalogFieldMap';

describe('catalogFieldMap', () => {
  it('resolves Support Page Url by display title', () => {
    const map = buildCatalogFieldMap([
      { Title: 'Support Page Url', InternalName: 'Support_x0020_Page_x0020_Url', StaticName: 'SupportPageUrl' }
    ]);
    expect(map.supportPageUrl).toBe('Support_x0020_Page_x0020_Url');
  });

  it('falls back to static name when title does not match', () => {
    const map = buildCatalogFieldMap([
      { Title: 'Support', InternalName: 'SupportPageURL', StaticName: 'SupportPageURL' }
    ]);
    expect(map.supportPageUrl).toBe('SupportPageURL');
  });

  it('resolves Short Description for description field', () => {
    const map = buildCatalogFieldMap([
      { Title: 'Short Description', InternalName: 'Description', StaticName: 'Description' }
    ]);
    expect(map.description).toBe('Description');
  });
});
