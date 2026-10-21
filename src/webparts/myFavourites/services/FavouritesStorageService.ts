import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { IFavouriteItem } from '../models/IFavouriteItem';
import {
  FAVOURITES_FILE_VERSION,
  MY_FAVOURITES_LIST_SERVER_RELATIVE_URL
} from './constants';
import { parseFavouritesFile, serializeFavouritesFile } from './favouritesFileModel';
import { normalizeSiteUrl, readResponseError } from './sharePointUtils';
import {
  toUserFavouritesFileName,
  toUserFileKey
} from './userFileKey';

export interface IFavouritesLoadResult {
  items: IFavouriteItem[];
  fileExists: boolean;
}

export class FavouritesStorageService {

  // Share pending operations between instances of this service.
  private static readonly _operations: Map<string, Promise<void>> = new Map();

  public constructor(
    private readonly _context: WebPartContext,
    private readonly _storageSiteUrl: string,
    private readonly _entraUserId: string
  ) {}

  public get fileName(): string {
    return toUserFavouritesFileName(this._entraUserId);
  }

  public get storageSiteUrl(): string {
    return normalizeSiteUrl(this._storageSiteUrl);
  }

  public get listMetadataUrl(): string {
    // Locate the personal list by its path rather than its display name.
    const listPath: string = MY_FAVOURITES_LIST_SERVER_RELATIVE_URL;
    const encodedPath: string = encodeURIComponent(
      `'${listPath.replace(/'/g, "''")}'`
    );

    return `${this.storageSiteUrl}/_api/web/GetList(@listUrl)` +
      `?@listUrl=${encodedPath}`;
  }

  public async getPersonalListMetadata(): Promise<IPersonalListMetadata> {
    const url: string = this.listMetadataUrl +
      '&$select=Id,BaseTemplate,EnableAttachments,' +
      'ListItemEntityTypeFullName,RootFolder/ServerRelativeUrl' +
      '&$expand=RootFolder';

    const response: SPHttpClientResponse = await this._context.spHttpClient.get(
      url,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: 'application/json;odata=nometadata',
          'odata-version': ''
        }
      }
    );

    if (!response.ok) {
      throw new Error(
        `Could not read the personal quick links list (${response.status}): ` +
        await readResponseError(response)
      );
    }

    const metadata = await response.json() as IPersonalListMetadata;
    const actualPath: string =
      (metadata.RootFolder?.ServerRelativeUrl ?? '').replace(/\/+$/, '');

    // Prevent accidentally using the old document library.
    if (
      metadata.BaseTemplate !== 100 ||
      actualPath.toLowerCase() !==
        MY_FAVOURITES_LIST_SERVER_RELATIVE_URL.toLowerCase()
    ) {
      throw new Error('The configured resource is not the expected personal quick links list.');
    }

    if (!metadata.EnableAttachments) {
      throw new Error('Attachments must be enabled on the personal quick links list.');
    }

    return metadata;
  }

  public async getStorageUserId(): Promise<number> {
    // Resolve the user on the site where their personal item is stored.
    const url: string =
      `${this.storageSiteUrl}/_api/web/currentuser?$select=Id`;

    const response: SPHttpClientResponse = await this._context.spHttpClient.get(
      url,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: 'application/json;odata=nometadata',
          'odata-version': ''
        }
      }
    );

    if (!response.ok) {
      throw new Error(
        `Could not resolve the storage-site user (${response.status}): ` +
        await readResponseError(response)
      );
    }

    const user = await response.json() as { Id: number };

    if (!Number.isInteger(user.Id) || user.Id <= 0) {
      throw new Error('SharePoint did not return a valid storage-site user ID.');
    }

    return user.Id;
  }

  public async findPersonalItem(): Promise<IPersonalItem | undefined> {
    const [metadata, userId] = await Promise.all([
      this.getPersonalListMetadata(),
      this.getStorageUserId()
    ]);

    const userKey: string = toUserFileKey(this._entraUserId);
    const listUrl: string =
      `${this.storageSiteUrl}/_api/web/lists(guid'${metadata.Id}')`;

    // Match the identifier and creator, including when testing as an owner.
    const filter: string = encodeURIComponent(
      `Title eq '${userKey}' and AuthorId eq ${userId}`
    );

    const url: string = `${listUrl}/items` +
      `?$select=Id,AuthorId,Title&$filter=${filter}&$top=2`;

    const response: SPHttpClientResponse = await this._context.spHttpClient.get(
      url,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: 'application/json;odata=nometadata',
          'odata-version': '',
          'Cache-Control': 'no-cache'
        }
      }
    );

    if (!response.ok) {
      throw new Error(
        `Could not find your personal quick links item (${response.status}): ` +
        await readResponseError(response)
      );
    }

    const data = await response.json() as { value: IPersonalItem[] };

    if (!Array.isArray(data.value)) {
      throw new Error('SharePoint returned an unexpected personal item response.');
    }

    // Stop rather than silently choosing between conflicting saved records.
    if (data.value.length > 1) {
      throw new Error(
        'Multiple personal quick links items were found. Contact the site owner.'
      );
    }

    const item: IPersonalItem | undefined = data.value[0];

    if (
      item &&
      (
        !Number.isInteger(item.Id) ||
        item.Id <= 0 ||
        item.AuthorId !== userId ||
        typeof item.Title !== 'string' ||
        item.Title.toLowerCase() !== userKey
      )
    ) {
      throw new Error('The personal quick links item does not match your account.');
    }

    return item;
  }

  public async findPersonalAttachment(
    itemId: number
  ): Promise<string | undefined> {
    const metadata: IPersonalListMetadata =
      await this.getPersonalListMetadata();

    const url: string =
      `${this.storageSiteUrl}/_api/web/lists(guid'${metadata.Id}')` +
      `/items(${itemId})/AttachmentFiles?$select=FileName`;

    const response: SPHttpClientResponse = await this._context.spHttpClient.get(
      url,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: 'application/json;odata=nometadata',
          'odata-version': '',
          'Cache-Control': 'no-cache'
        }
      }
    );

    if (!response.ok) {
      throw new Error(
        `Could not read your quick links attachments (${response.status}): ` +
        await readResponseError(response)
      );
    }

    const data = await response.json() as {
      value: { FileName: string }[];
    };

    if (
      !Array.isArray(data.value) ||
      data.value.some((file) => typeof file?.FileName !== 'string')
    ) {
      throw new Error('SharePoint returned an unexpected attachment response.');
    }

    const expectedName: string = this.fileName.toLowerCase();
    const attachment = data.value.find(
      (file) => file.FileName.toLowerCase() === expectedName
    );

    // Avoid treating an incorrectly named attachment as a new personal list.
    if (!attachment && data.value.length > 0) {
      throw new Error(
        'Your quick links item has an unexpected attachment. Contact the site owner.'
      );
    }

    return attachment?.FileName;
  }

  public loadFavourites(): Promise<IFavouritesLoadResult> {
    return this._runExclusive(() => this._loadFavourites());
  }

  public saveFavourites(items: IFavouriteItem[]): Promise<void> {
    // Capture this save now, before waiting for another operation.
    const body: string = serializeFavouritesFile(items);

    return this._runExclusive(() => this._saveFavourites(body));
  }

  private async _loadFavourites(): Promise<IFavouritesLoadResult> {
    const item: IPersonalItem | undefined = await this.findPersonalItem();

    if (!item) {
      return { items: [], fileExists: false };
    }

    const attachmentName: string | undefined =
      await this.findPersonalAttachment(item.Id);

    if (!attachmentName) {
      // Allow initialization or retry after an interrupted first upload.
      return { items: [], fileExists: false };
    }

    const metadata: IPersonalListMetadata =
      await this.getPersonalListMetadata();

    const encodedName: string = encodeURIComponent(
      attachmentName.replace(/'/g, "''")
    );

    const url: string =
      `${this.storageSiteUrl}/_api/web/lists(guid'${metadata.Id}')` +
      `/items(${item.Id})/AttachmentFiles('${encodedName}')/$value`;

    const response: SPHttpClientResponse = await this._context.spHttpClient.get(
      url,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: 'application/json;odata=nometadata',
          'odata-version': '',
          'Cache-Control': 'no-cache'
        }
      }
    );

    if (!response.ok) {
      throw new Error(
        `Could not load your saved quick links (${response.status}): ` +
        await readResponseError(response)
      );
    }

    const text: string = await response.text();

    // Invalid saved data must produce an error, not an apparently empty list.
    let document: unknown;
    try {
      document = JSON.parse(text);
    } catch {
      throw new Error('Your saved quick links contain invalid JSON.');
    }

    const record: Record<string, unknown> | undefined =
      document && typeof document === 'object' && !Array.isArray(document)
        ? document as Record<string, unknown>
        : undefined;

    if (
      !Array.isArray(document) &&
      (
        record?.version !== FAVOURITES_FILE_VERSION ||
        !Array.isArray(record?.favourites)
      )
    ) {
      throw new Error('Your saved quick links have an unsupported format.');
    }

    // An existing empty favourites array must stay empty after refresh.
    return {
      items: parseFavouritesFile(text),
      fileExists: true
    };
  }

  private async _saveFavourites(body: string): Promise<void> {
    const metadata: IPersonalListMetadata =
      await this.getPersonalListMetadata();

    const listUrl: string =
      `${this.storageSiteUrl}/_api/web/lists(guid'${metadata.Id}')`;

    let item: IPersonalItem | undefined = await this.findPersonalItem();

    if (!item) {
      // SharePoint sets Created By to the signed-in user automatically.
      const createResponse: SPHttpClientResponse =
        await this._context.spHttpClient.post(
          `${listUrl}/items`,
          SPHttpClient.configurations.v1,
          {
            headers: {
              Accept: 'application/json;odata=nometadata',
              'Content-Type': 'application/json;odata=verbose',
              'odata-version': ''
            },
            body: JSON.stringify({
              __metadata: {
                type: metadata.ListItemEntityTypeFullName
              },
              Title: toUserFileKey(this._entraUserId)
            })
          }
        );

      if (!createResponse.ok) {
        throw new Error(
          `Could not create your quick links item (${createResponse.status}): ` +
          await readResponseError(createResponse)
        );
      }

      // Reuse the lookup so ownership and duplicate checks still apply.
      item = await this.findPersonalItem();

      if (!item) {
        throw new Error(
          'Your quick links item was created but could not be found. Try again.'
        );
      }
    }

    const attachmentName: string | undefined =
      await this.findPersonalAttachment(item.Id);

    const encodedName: string = encodeURIComponent(
      (attachmentName ?? this.fileName).replace(/'/g, "''")
    );

    const itemUrl: string = `${listUrl}/items(${item.Id})`;

    const uploadUrl: string = attachmentName
      ? `${itemUrl}/AttachmentFiles('${encodedName}')/$value`
      : `${itemUrl}/AttachmentFiles/add(FileName='${encodedName}')`;

    const headers: Record<string, string> = {
      Accept: 'application/json;odata=nometadata',
      'Content-Type': 'application/octet-stream',
      'odata-version': ''
    };

    if (attachmentName) {
      // Replace the contents in place; never delete the attachment first.
      headers['X-HTTP-Method'] = 'PUT';
    }

    const response: SPHttpClientResponse =
      await this._context.spHttpClient.post(
        uploadUrl,
        SPHttpClient.configurations.v1,
        {
          headers,
          body
        }
      );

    if (!response.ok) {
      throw new Error(
        `Could not save your quick links (${response.status}): ` +
        await readResponseError(response)
      );
    }
  }

  private _runExclusive<T>(operation: () => Promise<T>): Promise<T> {
    const key: string =
      `pulse-quick-links:${this.storageSiteUrl}:` +
      toUserFileKey(this._entraUserId);

    const previous: Promise<void> =
      FavouritesStorageService._operations.get(key) ?? Promise.resolve();

    const result: Promise<T> = previous.then(() => {
      const locks = typeof navigator === 'undefined'
        ? undefined
        : navigator.locks;

      // Browser locks also coordinate matching operations in other tabs.
      return locks
        ? locks.request(key, () => operation())
        : operation();
    });

    // A failed operation must not block the next attempt.
    const settled: Promise<void> = result.then(
      () => undefined,
      () => undefined
    );

    FavouritesStorageService._operations.set(key, settled);

    settled.then(() => {
      // Keep any newer queued operation registered.
      if (FavouritesStorageService._operations.get(key) === settled) {
        FavouritesStorageService._operations.delete(key);
      }
    }).catch(() => undefined);

    return result;
  }

}

interface IPersonalItem {
  Id: number;
  AuthorId: number;
  Title: string;
}

interface IPersonalListMetadata {
    Id: string;
    BaseTemplate: number;
    EnableAttachments: boolean;
    ListItemEntityTypeFullName: string;
    RootFolder: {
      ServerRelativeUrl: string;
    };
}
