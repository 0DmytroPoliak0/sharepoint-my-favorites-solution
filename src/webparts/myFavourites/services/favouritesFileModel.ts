import type { IFavouriteFormValues, IFavouriteItem, IFavouritesFileDocument } from '../models/IFavouriteItem';
import { FAVOURITES_FILE_VERSION } from './constants';
import { stripFavouriteForStorage } from './favouritesCatalogMerge';
import { readBooleanField } from './sharePointUtils';

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function readStringFromKeys(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v: unknown = obj[key];
    if (typeof v === 'string') {
      return v.trim();
    }
  }
  return '';
}

function readBooleanFromKeys(obj: Record<string, unknown>, keys: string[], defaultValue: boolean): boolean {
  for (const key of keys) {
    const v: unknown = obj[key];
    if (typeof v === 'boolean') {
      return v;
    }
    if (v === 1 || v === '1' || v === 'true' || v === 'True') {
      return true;
    }
    if (v === 0 || v === '0' || v === 'false' || v === 'False') {
      return false;
    }
  }
  return defaultValue;
}

function parseFavouriteItem(raw: unknown): IFavouriteItem | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }

  const title: string = readStringFromKeys(raw, ['Title', 'title']);
  const url: string = readStringFromKeys(raw, ['URL', 'url']);
  const id: string = readStringFromKeys(raw, ['id']);
  if (!title || !url || !id) {
    return undefined;
  }

  const catalogItemIdRaw: unknown = raw.catalogItemId;
  const catalogItemId: number | undefined =
    typeof catalogItemIdRaw === 'number' && Number.isFinite(catalogItemIdRaw)
      ? catalogItemIdRaw
      : undefined;

  const sourceRaw: unknown = raw.source;
  const source: IFavouriteItem['source'] =
    sourceRaw === 'catalog' || sourceRaw === 'manual' ? sourceRaw : undefined;

  return normalizeFavouriteItem({
    id,
    title,
    url,
    description: readStringFromKeys(raw, ['Description', 'description']),
    supportPageUrl: readStringFromKeys(raw, ['SupportPageUrl', 'supportPageUrl']),
    mobileFriendly: readBooleanFromKeys(raw, ['MobileFriendly', 'mobileFriendly', 'isMobileFriendly'], false),
    internal: readBooleanFromKeys(raw, ['Internal', 'internal', 'isInternal'], false),
    category: readStringFromKeys(raw, ['Category', 'category']) || undefined,
    enabled: readBooleanField(raw.Enabled ?? raw.enabled, true),
    displayAsNew: readBooleanField(raw.DisplayAsNew ?? raw.displayAsNew, false),
    isStarter: readBooleanFromKeys(raw, ['isStarter', 'IsStarter'], false),
    catalogItemId,
    source
  });
}

export function normalizeFavouriteItem(
  item: Partial<IFavouriteItem> & Pick<IFavouriteItem, 'title' | 'url'> & { id?: string }
): IFavouriteItem {
  return {
    id: item.id ?? createItemId(),
    title: item.title.trim(),
    url: item.url.trim(),
    description: (item.description ?? '').trim(),
    supportPageUrl: (item.supportPageUrl ?? '').trim(),
    mobileFriendly: item.mobileFriendly ?? false,
    internal: item.internal ?? false,
    category: item.category?.trim() || undefined,
    enabled: item.enabled ?? true,
    displayAsNew: item.displayAsNew,
    isStarter: item.isStarter,
    catalogItemId: item.catalogItemId,
    source: item.source
  };
}

export function parseFavouritesFile(jsonText: string): IFavouriteItem[] {
  if (!jsonText || !jsonText.trim()) {
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return [];
  }

  if (Array.isArray(parsed)) {
    const legacy: IFavouriteItem[] = [];
    for (const entry of parsed) {
      const item: IFavouriteItem | undefined = parseFavouriteItem(entry);
      if (item) {
        legacy.push(item);
      }
    }
    return legacy;
  }

  if (!isRecord(parsed)) {
    return [];
  }

  const favouritesRaw: unknown = parsed.favourites;
  if (!Array.isArray(favouritesRaw)) {
    return [];
  }

  const items: IFavouriteItem[] = [];
  for (const entry of favouritesRaw) {
    const item: IFavouriteItem | undefined = parseFavouriteItem(entry);
    if (item) {
      items.push(item);
    }
  }
  return items;
}

function favouriteToJsonRecord(item: IFavouriteItem): Record<string, unknown> {
  const stored: IFavouriteItem = stripFavouriteForStorage(item);
  const record: Record<string, unknown> = {
    id: stored.id,
    Title: stored.title,
    URL: stored.url,
    Description: stored.description
  };

  if (stored.catalogItemId !== undefined) {
    record.catalogItemId = stored.catalogItemId;
  } else if (stored.internal) {
    record.Internal = true;
  }
  if (stored.source) {
    record.source = stored.source;
  }

  return record;
}

export function serializeFavouritesFile(items: IFavouriteItem[]): string {
  const normalized: IFavouriteItem[] = items.map((item) => stripFavouriteForStorage(item));
  const doc: IFavouritesFileDocument = {
    version: FAVOURITES_FILE_VERSION as 1,
    favourites: normalized
  };

  return JSON.stringify(
    {
      version: doc.version,
      favourites: doc.favourites.map((item) => favouriteToJsonRecord(item))
    },
    undefined,
    2
  );
}

export const emptyFavouriteFormValues = (): IFavouriteFormValues => ({
  title: '',
  url: '',
  description: '',
  internal: false
});

export function favouriteToFormValues(item: IFavouriteItem): IFavouriteFormValues {
  return {
    title: item.title,
    url: item.url,
    description: item.description,
    internal: item.internal
  };
}

export function validateFavouriteForm(values: IFavouriteFormValues): string | undefined {
  const title: string = values.title.trim();
  const url: string = values.url.trim();

  if (!title) {
    return 'Title is required.';
  }
  if (!url) {
    return 'URL is required.';
  }
  try {
    // eslint-disable-next-line no-new
    new URL(url);
  } catch {
    return 'Enter a valid URL (include https://).';
  }

  return undefined;
}

export function formValuesToFavourite(
  values: IFavouriteFormValues,
  existing?: Partial<IFavouriteItem>
): IFavouriteItem {
  return normalizeFavouriteItem({
    id: existing?.id,
    title: values.title,
    url: values.url,
    description: values.description,
    internal: values.internal,
    catalogItemId: existing?.catalogItemId,
    source: existing?.source ?? (existing?.catalogItemId !== undefined ? 'catalog' : 'manual')
  });
}

export function createManualFavourite(values: IFavouriteFormValues): IFavouriteItem {
  return formValuesToFavourite(values, { source: 'manual', internal: values.internal });
}

export function createItemId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `fav-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function favouriteItemKey(item: IFavouriteItem): string {
  if (item.catalogItemId !== undefined) {
    return `catalog:${item.catalogItemId}`;
  }
  return `url:${item.url.toLowerCase()}`;
}
