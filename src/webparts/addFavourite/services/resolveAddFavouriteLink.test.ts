import { resolveAddFavouriteLink, resolvePageTitle, resolvePageUrl } from './resolveAddFavouriteLink';
import type { IAddFavouriteWebPartProps } from './resolveAddFavouriteLink';
import type { WebPartContext } from '@microsoft/sp-webpart-base';

describe('resolveAddFavouriteLink', () => {
  const baseProps: IAddFavouriteWebPartProps = {
    linkTitle: '',
    linkUrl: '',
    description: '',
    internal: false,
    helpInfo: ''
  };

  const context = {
    pageContext: {
      legacyPageContext: { pageTitle: 'Pulse Home' },
      web: { title: 'Pulse Site' }
    }
  } as unknown as WebPartContext;

  it('uses configured title and url when provided', () => {
    const link = resolveAddFavouriteLink(
      { ...baseProps, linkTitle: 'Custom', linkUrl: 'https://example.com/page' },
      context
    );
    expect(link.title).toBe('Custom');
    expect(link.url).toBe('https://example.com/page');
    expect(link.hasConfiguredTitle).toBe(true);
  });

  it('falls back to page title and url when properties are empty', () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { href: 'https://contoso.sharepoint.com/sites/pulse/SitePages/Home.aspx?Mode=Edit' }
    });

    const link = resolveAddFavouriteLink(baseProps, context);
    expect(link.title).toBe('Pulse Home');
    expect(link.url).toBe('https://contoso.sharepoint.com/sites/pulse/SitePages/Home.aspx');
    expect(link.hasConfiguredTitle).toBe(false);
  });

  it('resolvePageTitle strips site name from document title when legacy title missing', () => {
    const ctx = {
      pageContext: {
        legacyPageContext: {},
        web: { title: 'Pulse Site' }
      }
    } as unknown as WebPartContext;

    Object.defineProperty(document, 'title', {
      configurable: true,
      value: 'Important reminders | Pulse'
    });

    expect(resolvePageTitle(ctx)).toBe('Important reminders');
  });

  it('resolvePageUrl removes query string', () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { href: 'https://contoso.sharepoint.com/page.aspx?x=1#section' }
    });
    expect(resolvePageUrl()).toBe('https://contoso.sharepoint.com/page.aspx');
  });
});
