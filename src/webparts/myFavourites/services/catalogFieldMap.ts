export type CatalogFieldKey =
  | 'url'
  | 'description'
  | 'supportPageUrl'
  | 'category'
  | 'enabled'
  | 'displayAsNew'
  | 'isStarter'
  | 'isMobileFriendly'
  | 'isInternal';

export interface ISharePointFieldInfo {
  InternalName?: string;
  Title?: string;
  StaticName?: string;
}

export type ICatalogFieldMap = Readonly<Record<CatalogFieldKey, string | undefined>>;

interface ICatalogFieldLookup {
  titles: string[];
  staticNames: string[];
}

const CATALOG_FIELD_LOOKUP: Record<CatalogFieldKey, ICatalogFieldLookup> = {
  url: { titles: ['URL'], staticNames: ['URL'] },
  description: {
    titles: ['Description', 'Short Description'],
    staticNames: ['Description']
  },
  supportPageUrl: {
    titles: ['Support Page Url', 'Support Page URL'],
    staticNames: [
      'SupportPageUrl',
      'SupportPageURL',
      'Support_x0020_Page_x0020_Url',
      'Support_x0020_Page_x0020_URL'
    ]
  },
  category: { titles: ['Category'], staticNames: ['Category'] },
  enabled: { titles: ['Enabled'], staticNames: ['Enabled'] },
  displayAsNew: { titles: ['DisplayAsNew', 'Display As New'], staticNames: ['DisplayAsNew'] },
  isStarter: {
    titles: ['isStarter', 'Is Starter', 'Starter'],
    staticNames: ['isStarter', 'IsStarter']
  },
  isMobileFriendly: {
    titles: ['isMobileFriendly', 'Is Mobile Friendly'],
    staticNames: ['isMobileFriendly']
  },
  isInternal: { titles: ['isInternal', 'Is Internal', 'Internal Link'], staticNames: ['isInternal'] }
};

function equalsIgnoreCase(a: string, b: string): boolean {
  return a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0;
}

function resolveOneField(fields: ISharePointFieldInfo[], key: CatalogFieldKey): string | undefined {
  const lookup: ICatalogFieldLookup = CATALOG_FIELD_LOOKUP[key];

  for (const field of fields) {
    const title: string = field.Title ?? '';
    if (title && lookup.titles.some((t) => equalsIgnoreCase(title, t))) {
      return field.InternalName ?? field.StaticName;
    }
  }

  for (const field of fields) {
    const staticName: string = field.StaticName ?? '';
    const internalName: string = field.InternalName ?? '';
    if (
      lookup.staticNames.some(
        (candidate) =>
          (staticName && equalsIgnoreCase(staticName, candidate)) ||
          (internalName && equalsIgnoreCase(internalName, candidate))
      )
    ) {
      return internalName || staticName;
    }
  }

  return undefined;
}

export function buildCatalogFieldMap(fields: ISharePointFieldInfo[]): ICatalogFieldMap {
  return {
    url: resolveOneField(fields, 'url'),
    description: resolveOneField(fields, 'description'),
    supportPageUrl: resolveOneField(fields, 'supportPageUrl'),
    category: resolveOneField(fields, 'category'),
    enabled: resolveOneField(fields, 'enabled'),
    displayAsNew: resolveOneField(fields, 'displayAsNew'),
    isStarter: resolveOneField(fields, 'isStarter'),
    isMobileFriendly: resolveOneField(fields, 'isMobileFriendly'),
    isInternal: resolveOneField(fields, 'isInternal')
  };
}

export function readRowValue(row: Record<string, unknown>, internalName: string | undefined): unknown {
  if (!internalName) {
    return undefined;
  }
  return row[internalName];
}
