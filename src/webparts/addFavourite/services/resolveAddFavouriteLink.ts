import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { IAddFavouriteLinkConfig } from '../components/IAddFavouriteProps';

export interface IAddFavouriteWebPartProps {
  linkTitle: string;
  linkUrl: string;
  description: string;
  internal: boolean;
  helpInfo: string;
}

function trim(value: string | undefined): string {
  return (value ?? '').trim();
}

export function resolvePageTitle(context: WebPartContext): string {
  const legacyTitle: string | undefined = context.pageContext.legacyPageContext?.pageTitle?.trim();
  if (legacyTitle) {
    return legacyTitle;
  }

  if (typeof document !== 'undefined') {
    const docTitle: string = document.title.trim();
    if (docTitle) {
      const withoutSite: string = docTitle.replace(/\s+[|\u2013\u2014-]\s+.+$/, '').trim();
      if (withoutSite) {
        return withoutSite;
      }
    }
  }

  return context.pageContext.web.title?.trim() || 'This page';
}

export function resolvePageUrl(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.location.href.split('#')[0].split('?')[0];
}

/** Uses web part properties when set; otherwise falls back to the current SharePoint page. */
export function resolveAddFavouriteLink(
  properties: IAddFavouriteWebPartProps,
  context: WebPartContext
): IAddFavouriteLinkConfig {
  const configuredTitle: string = trim(properties.linkTitle);
  const configuredUrl: string = trim(properties.linkUrl);

  return {
    title: configuredTitle || resolvePageTitle(context),
    url: configuredUrl || resolvePageUrl(),
    description: trim(properties.description),
    internal: properties.internal === true,
    helpInfo: trim(properties.helpInfo),
    hasConfiguredTitle: configuredTitle.length > 0
  };
}
