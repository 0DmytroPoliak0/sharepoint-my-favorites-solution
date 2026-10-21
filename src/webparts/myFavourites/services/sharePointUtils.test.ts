import type { WebPartContext } from '@microsoft/sp-webpart-base';
import { normalizeSiteUrl, resolveEntraUserId } from './sharePointUtils';

describe('sharePointUtils', () => {
  it('normalizeSiteUrl trims trailing slashes', () => {
    expect(normalizeSiteUrl('https://contoso.sharepoint.com/sites/a///')).toBe(
      'https://contoso.sharepoint.com/sites/a'
    );
  });

  it('resolveEntraUserId reads aadUserId from page context', () => {
    const context = {
      pageContext: {
        legacyPageContext: {
          aadUserId: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890'
        }
      }
    } as WebPartContext;

    expect(resolveEntraUserId(context)).toBe('A1B2C3D4-E5F6-7890-ABCD-EF1234567890');
  });

  it('resolveEntraUserId throws when aadUserId is missing', () => {
    const context = {
      pageContext: {
        legacyPageContext: {}
      }
    } as WebPartContext;

    expect(() => resolveEntraUserId(context)).toThrow(/Entra user id/i);
  });
});
