/** Both tenants store personal quick links on the Pulse site. */
export function resolveFavouritesStorageSiteUrl(pageSiteUrl: string): string {
  const hostname: string = new URL(pageSiteUrl).hostname.toLowerCase();

  switch (hostname) {
    case 'fhatesttenant.sharepoint.com':
      return 'https://fhatesttenant.sharepoint.com/sites/pulse-FH';

    case 'healthbc.sharepoint.com':
      return 'https://healthbc.sharepoint.com/sites/pulse-FH';

    default:
      throw new Error(`Unsupported quick links tenant: ${hostname}`);
  }
}

/** Identify Jen's list by its path, independently of its display name. */
export const MY_FAVOURITES_LIST_SERVER_RELATIVE_URL: string =
  '/sites/pulse-FH/Lists/PulseHomepageQuickLinks';


export const PULSE_FAVOURITES_CATALOG_LIST_TITLE: string =
  'Pulse homepage quick links catalogue';

export const FAVOURITES_FILE_VERSION: number = 1;