import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import { PULSE_FAVOURITES_CATALOG_LIST_TITLE } from './constants';
import {
  buildCatalogFieldMap,
  type CatalogFieldKey,
  type ICatalogFieldMap,
  type ISharePointFieldInfo
} from './catalogFieldMap';
import { readResponseError, spErrorMessage } from './sharePointUtils';

export type { CatalogFieldKey, ICatalogFieldMap } from './catalogFieldMap';
export { readRowValue } from './catalogFieldMap';

interface IFieldsResponse {
  value?: ISharePointFieldInfo[];
}

export class CatalogFieldResolver {
  private _fieldMap: ICatalogFieldMap | undefined;

  public constructor(
    private readonly _context: WebPartContext,
    private readonly _storageSiteUrl: string
  ) {}

  public async getFieldMap(): Promise<ICatalogFieldMap> {
    if (this._fieldMap) {
      return this._fieldMap;
    }

    const url: string = `${this._storageSiteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(
      PULSE_FAVOURITES_CATALOG_LIST_TITLE
    )}')/fields?$select=InternalName,Title,StaticName`;

    let response: SPHttpClientResponse;
    try {
      response = await this._context.spHttpClient.get(url, SPHttpClient.configurations.v1, {
        headers: {
          Accept: 'application/json;odata=nometadata'
        }
      });
    } catch (err: unknown) {
      throw new Error(`Failed to load catalog field metadata: ${spErrorMessage(err)}`);
    }

    if (!response.ok) {
      throw new Error(
        `Failed to load catalog field metadata (${response.status}): ${await readResponseError(response)}`
      );
    }

    const data = (await response.json()) as IFieldsResponse;
    this._fieldMap = buildCatalogFieldMap(data.value ?? []);
    return this._fieldMap;
  }

  public async getSelectFields(): Promise<string[]> {
    const map: ICatalogFieldMap = await this.getFieldMap();
    const select: string[] = ['Id', 'Title'];

    (Object.keys(map) as CatalogFieldKey[]).forEach((key) => {
      const internalName: string | undefined = map[key];
      if (internalName && select.indexOf(internalName) < 0) {
        select.push(internalName);
      }
    });

    return select;
  }
}
