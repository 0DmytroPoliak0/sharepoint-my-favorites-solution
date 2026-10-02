import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { ICatalogItem } from '../models/ICatalogItem';
import type { IFavouriteItem } from '../models/IFavouriteItem';
import { PULSE_FAVOURITES_CATALOG_LIST_TITLE } from './constants';
import { PULSE_FAVOURITES_CATALOGUE_LABEL } from '../../shared/catalogueLabels';
import { readRowValue, type ICatalogFieldMap } from './catalogFieldMap';
import { CatalogFieldResolver } from './catalogFieldResolver';
import { favouriteItemKey, normalizeFavouriteItem } from './favouritesFileModel';
import { normalizeTitleForCompare } from './favouriteDuplicateCheck';
import {
  normalizeSiteUrl,
  readBooleanField,
  readResponseError,
  readTextField,
  readUrlField,
  spErrorMessage
} from './sharePointUtils';

interface IListItemsResponse {
  value?: Record<string, unknown>[];
}

export class CatalogService {
  private readonly _fieldResolver: CatalogFieldResolver;

  public constructor(
    private readonly _context: WebPartContext,
    private readonly _storageSiteUrl: string
  ) {
    this._fieldResolver = new CatalogFieldResolver(this._context, this.storageSiteUrl);
  }

  public get storageSiteUrl(): string {
    return normalizeSiteUrl(this._storageSiteUrl);
  }

  /** Enabled catalog rows only (for the add-from-catalog picker). */
  public async loadCatalog(): Promise<ICatalogItem[]> {
    const rows: ICatalogItem[] = await this.loadCatalogAll();
    return rows.filter((row) => row.enabled);
  }

  /** All catalog rows including disabled (for runtime enrichment of user favourites). */
  public async loadCatalogAll(): Promise<ICatalogItem[]> {
    const fieldMap: ICatalogFieldMap = await this._fieldResolver.getFieldMap();
    const select: string[] = await this._fieldResolver.getSelectFields();

    const url: string = `${this.storageSiteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(
      PULSE_FAVOURITES_CATALOG_LIST_TITLE
    )}')/items?$select=${encodeURIComponent(select.join(','))}&$orderby=Title asc&$top=500`;

    let response: SPHttpClientResponse;
    try {
      response = await this._context.spHttpClient.get(url, SPHttpClient.configurations.v1, {
        headers: {
          Accept: 'application/json;odata=nometadata'
        }
      });
    } catch (err: unknown) {
      throw new Error(`Failed to load ${PULSE_FAVOURITES_CATALOGUE_LABEL}: ${spErrorMessage(err)}`);
    }

    if (!response.ok) {
      throw new Error(
        `Failed to load ${PULSE_FAVOURITES_CATALOGUE_LABEL} (${response.status}): ${await readResponseError(response)}`
      );
    }

    const data = (await response.json()) as IListItemsResponse;
    const rows: Record<string, unknown>[] = data.value ?? [];
    const items: ICatalogItem[] = [];

    for (const row of rows) {
      const parsed: ICatalogItem | undefined = this._parseCatalogRow(row, fieldMap);
      if (parsed) {
        items.push(parsed);
      }
    }

    return items;
  }

  private _parseCatalogRow(
    row: Record<string, unknown>,
    fieldMap: ICatalogFieldMap
  ): ICatalogItem | undefined {
    const idRaw: unknown = row.Id;
    const id: number | undefined = typeof idRaw === 'number' ? idRaw : undefined;
    if (id === undefined || !Number.isFinite(id)) {
      return undefined;
    }

    const title: string = readTextField(row.Title);
    const itemUrl: string = readUrlField(readRowValue(row, fieldMap.url));
    if (!title || !itemUrl) {
      return undefined;
    }

    const enabledField: string | undefined = fieldMap.enabled;
    const enabled: boolean = enabledField
      ? readBooleanField(readRowValue(row, enabledField), true)
      : true;

    return {
      id,
      title,
      url: itemUrl,
      description: readTextField(readRowValue(row, fieldMap.description)) || undefined,
      supportPageUrl: readUrlField(readRowValue(row, fieldMap.supportPageUrl)) || undefined,
      category: readTextField(readRowValue(row, fieldMap.category)) || undefined,
      enabled,
      displayAsNew: readBooleanField(readRowValue(row, fieldMap.displayAsNew), false),
      isStarter: readBooleanField(readRowValue(row, fieldMap.isStarter), false),
      isMobileFriendly: readBooleanField(readRowValue(row, fieldMap.isMobileFriendly), false),
      isInternal: readBooleanField(readRowValue(row, fieldMap.isInternal), false)
    };
  }

  public static catalogItemToFavourite(catalogItem: ICatalogItem): IFavouriteItem {
    return normalizeFavouriteItem({
      title: catalogItem.title,
      url: catalogItem.url,
      description: catalogItem.description ?? '',
      catalogItemId: catalogItem.id,
      source: 'catalog'
    });
  }

  public static filterCatalogNotInFavourites(
    catalog: ICatalogItem[],
    favourites: IFavouriteItem[]
  ): ICatalogItem[] {
    const existing = new Set(favourites.map((f) => favouriteItemKey(f)));
    const existingTitles = new Set(favourites.map((f) => normalizeTitleForCompare(f.title)));
    return catalog.filter(
      (c) =>
        c.enabled &&
        !existing.has(`catalog:${c.id}`) &&
        !existingTitles.has(normalizeTitleForCompare(c.title))
    );
  }
}
