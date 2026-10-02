import type { FavouritesStorageService } from '../../myFavourites/services/FavouritesStorageService';

export interface IAddFavouriteLinkConfig {
  title: string;
  url: string;
  description: string;
  internal: boolean;
  helpInfo: string;
  /** True when Title is set in web part properties (not resolved from the current page). */
  hasConfiguredTitle: boolean;
}

export interface IAddFavouriteProps {
  storageService: FavouritesStorageService;
  link: IAddFavouriteLinkConfig;
}
