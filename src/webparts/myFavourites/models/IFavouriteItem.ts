/** A single favourite link stored in the user's JSON file. */
export interface IFavouriteItem {
  id: string;
  title: string;
  url: string;
  description: string;
  supportPageUrl: string;
  mobileFriendly: boolean;
  internal: boolean;
  category?: string;
  enabled?: boolean;
  displayAsNew?: boolean;
  isStarter?: boolean;
  /** Set when the item was added from the Pulse Favourites Catalogue list. */
  catalogItemId?: number;
  source?: 'catalog' | 'manual';
}

export interface IFavouritesFileDocument {
  version: 1;
  favourites: IFavouriteItem[];
}

/** Values the user may edit in the add / edit form (catalog-only fields are preserved from JSON). */
export interface IFavouriteFormValues {
  title: string;
  url: string;
  description: string;
  internal: boolean;
}
