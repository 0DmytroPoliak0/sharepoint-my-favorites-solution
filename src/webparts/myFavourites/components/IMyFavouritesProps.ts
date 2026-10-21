import type { CatalogService } from '../services/CatalogService';
import type { FavouritesStorageService } from '../services/FavouritesStorageService';

export interface IMyFavouritesProps {
  storageService: FavouritesStorageService;
  catalogService: CatalogService;
  maxRows: number;
  manageAboutUrl: string;
}
