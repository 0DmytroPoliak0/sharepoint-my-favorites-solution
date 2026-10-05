import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { IFavouriteItem } from '../models/IFavouriteItem';
import { MY_FAVOURITES_LIBRARY_TITLE } from './constants';
import { parseFavouritesFile, serializeFavouritesFile } from './favouritesFileModel';
import { normalizeSiteUrl, readResponseError, spErrorMessage } from './sharePointUtils';
import { toLegacyUserFavouritesFileName, toUserFavouritesFileName } from './userFileKey';

export interface IFavouritesLoadResult {
  items: IFavouriteItem[];
  fileExists: boolean;
}

interface IRootFolderResponse {
  ServerRelativeUrl?: string;
}

interface IFileLoadResult {
  found: boolean;
  status: number;
  text?: string;
}

export class FavouritesStorageService {
  private _folderServerRelativeUrl: string | undefined;

  public constructor(
    private readonly _context: WebPartContext,
    private readonly _storageSiteUrl: string,
    private readonly _entraUserId: string,
    private readonly _legacyLoginName?: string
  ) {}

  public get fileName(): string {
    return toUserFavouritesFileName(this._entraUserId);
  }

  public get storageSiteUrl(): string {
    return normalizeSiteUrl(this._storageSiteUrl);
  }

  public async loadFavourites(): Promise<IFavouritesLoadResult> {
    const primary: IFileLoadResult = await this._tryLoadFile(this.fileName);
    if (primary.found && primary.text !== undefined) {
      return { items: parseFavouritesFile(primary.text), fileExists: true };
    }

    if (primary.status !== 404) {
      throw new Error(
        `Failed to read favourites file (${primary.status}): ${primary.text ?? 'Unknown error'}`
      );
    }

    const legacyLoginName: string = (this._legacyLoginName ?? '').trim();
    if (legacyLoginName) {
      const legacyFileName: string = toLegacyUserFavouritesFileName(legacyLoginName);
      const legacy: IFileLoadResult = await this._tryLoadFile(legacyFileName);
      if (legacy.found && legacy.text !== undefined) {
        const items: IFavouriteItem[] = parseFavouritesFile(legacy.text);
        await this.saveFavourites(items);
        return { items, fileExists: true };
      }

      if (legacy.status !== 404) {
        throw new Error(
          `Failed to read legacy favourites file (${legacy.status}): ${legacy.text ?? 'Unknown error'}`
        );
      }
    }

    return { items: [], fileExists: false };
  }

  public async saveFavourites(items: IFavouriteItem[]): Promise<void> {
    const folderUrl: string = await this._getLibraryFolderServerRelativeUrl();
    const escapedFolder: string = folderUrl.replace(/'/g, "''");
    const escapedFile: string = this.fileName.replace(/'/g, "''");
    const uploadUrl: string = `${this.storageSiteUrl}/_api/web/GetFolderByServerRelativeUrl('${escapedFolder}')/Files/add(url='${escapedFile}',overwrite=true)`;

    const body: string = serializeFavouritesFile(items);
    let response: SPHttpClientResponse;
    try {
      response = await this._context.spHttpClient.post(uploadUrl, SPHttpClient.configurations.v1, {
        headers: {
          Accept: 'application/json;odata=nometadata',
          'Content-Type': 'application/json; charset=utf-8'
        },
        body
      });
    } catch (err: unknown) {
      throw new Error(`Failed to save favourites file: ${spErrorMessage(err)}`);
    }

    if (!response.ok) {
      throw new Error(
        `Failed to save favourites file (${response.status}): ${await readResponseError(response)}`
      );
    }
  }

  private async _tryLoadFile(fileName: string): Promise<IFileLoadResult> {
    const url: string = `${this.storageSiteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(
      MY_FAVOURITES_LIBRARY_TITLE
    )}')/RootFolder/Files('${encodeURIComponent(fileName)}')/$value`;

    let response: SPHttpClientResponse;
    try {
      response = await this._context.spHttpClient.get(url, SPHttpClient.configurations.v1, {
        headers: {
          Accept: 'application/json;odata=nometadata'
        }
      });
    } catch (err: unknown) {
      throw new Error(`Failed to read favourites file: ${spErrorMessage(err)}`);
    }

    if (response.status === 404) {
      return { found: false, status: 404 };
    }

    if (!response.ok) {
      return {
        found: false,
        status: response.status,
        text: await readResponseError(response)
      };
    }

    const text: string = await response.text();
    return { found: true, status: response.status, text };
  }

  private async _getLibraryFolderServerRelativeUrl(): Promise<string> {
    if (this._folderServerRelativeUrl) {
      return this._folderServerRelativeUrl;
    }

    const url: string = `${this.storageSiteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(
      MY_FAVOURITES_LIBRARY_TITLE
    )}')/RootFolder`;

    let response: SPHttpClientResponse;
    try {
      response = await this._context.spHttpClient.get(url, SPHttpClient.configurations.v1, {
        headers: {
          Accept: 'application/json;odata=nometadata'
        }
      });
    } catch (err: unknown) {
      throw new Error(`Failed to resolve Pulse homepage quick links library: ${spErrorMessage(err)}`);
    }

    if (!response.ok) {
      throw new Error(
        `Pulse homepage quick links library was not found (${response.status}): ${await readResponseError(response)}`
      );
    }

    const data = (await response.json()) as IRootFolderResponse;
    const serverRelativeUrl: string | undefined = data.ServerRelativeUrl;
    if (!serverRelativeUrl) {
      throw new Error('Could not resolve the server-relative URL for the Pulse homepage quick links library.');
    }

    this._folderServerRelativeUrl = serverRelativeUrl;
    return serverRelativeUrl;
  }
}
