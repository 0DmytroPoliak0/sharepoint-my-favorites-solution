import type { WebPartContext } from '@microsoft/sp-webpart-base';

export function normalizeSiteUrl(siteUrl: string): string {
  return siteUrl.trim().replace(/\/+$/, '');
}

/** Microsoft Entra object id for the signed-in user (`legacyPageContext.aadUserId`). */
export function resolveEntraUserId(context: WebPartContext): string {
  const legacy = context.pageContext.legacyPageContext as { aadUserId?: string } | undefined;
  const userId: string | undefined = legacy?.aadUserId?.trim();
  if (!userId) {
    throw new Error(
      'Microsoft Entra user id is not available. Favourites require a signed-in user on SharePoint.'
    );
  }
  return userId;
}

export function spErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

export async function readResponseError(response: { status: number; statusText: string; text: () => Promise<string> }): Promise<string> {
  try {
    const text: string = await response.text();
    if (!text) {
      return `${response.status} ${response.statusText}`;
    }
    try {
      const json: unknown = JSON.parse(text);
      if (json && typeof json === 'object') {
        const o = json as Record<string, unknown>;
        const error = o.error;
        if (error && typeof error === 'object') {
          const msg = (error as Record<string, unknown>).message;
          if (typeof msg === 'string') {
            return msg;
          }
        }
        const message = o.message;
        if (typeof message === 'string') {
          return message;
        }
      }
    } catch {
      // not JSON
    }
    return text.slice(0, 500);
  } catch {
    return `${response.status} ${response.statusText}`;
  }
}

/** Reads a SharePoint hyperlink or text field into a URL string. */
export function readUrlField(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (value && typeof value === 'object') {
    const url = (value as Record<string, unknown>).Url;
    if (typeof url === 'string') {
      return url.trim();
    }
  }
  return '';
}

export function readTextField(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function readBooleanField(value: unknown, defaultValue: boolean = false): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 1 || value === '1' || value === 'true' || value === 'True') {
    return true;
  }
  if (value === 0 || value === '0' || value === 'false' || value === 'False') {
    return false;
  }
  return defaultValue;
}
