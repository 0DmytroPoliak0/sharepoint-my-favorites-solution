const ENTRA_USER_ID_PATTERN: RegExp =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const INVALID_FILE_CHARS: RegExp = /[\\/:*?"<>|#%&{}~]/g;

/**
 * Builds a filesystem-safe favourites file key from the user's Microsoft Entra object id (GUID).
 */
export function toUserFileKey(entraUserId: string): string {
  const id: string = (entraUserId ?? '').trim().replace(/^\{|\}$/g, '').toLowerCase();
  if (!id) {
    throw new Error('Entra user id is required to build the favourites file name.');
  }

  if (!ENTRA_USER_ID_PATTERN.test(id)) {
    throw new Error('Entra user id must be a valid GUID.');
  }

  return id;
}

export function toUserFavouritesFileName(entraUserId: string): string {
  return `${toUserFileKey(entraUserId)}.json`;
}

/**
 * Legacy key derived from SharePoint `loginName` (typically UPN/email). Used only when migrating
 * existing favourites files created before Entra id-based storage.
 */
export function toLegacyUserFileKeyFromLoginName(loginName: string): string {
  let id: string = (loginName ?? '').trim();
  if (!id) {
    throw new Error('Login name is required to build the legacy favourites file name.');
  }

  if (id.indexOf('|') >= 0) {
    const parts: string[] = id.split('|');
    id = parts[parts.length - 1] ?? id;
  }

  const backslash: number = id.indexOf('\\');
  if (backslash >= 0) {
    id = id.slice(backslash + 1);
  }

  id = id.toLowerCase().replace(INVALID_FILE_CHARS, '_').replace(/\s+/g, '_');
  id = id.replace(/_+/g, '_').replace(/^\.+|\.+$/g, '');

  if (!id) {
    throw new Error('Could not derive a valid legacy user file key from login name.');
  }

  return id.slice(0, 120);
}

export function toLegacyUserFavouritesFileName(loginName: string): string {
  return `${toLegacyUserFileKeyFromLoginName(loginName)}.json`;
}
