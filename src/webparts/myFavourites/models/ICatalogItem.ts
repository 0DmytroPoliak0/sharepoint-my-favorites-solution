/** Row from the Pulse Favourites Catalogue SharePoint list. */
export interface ICatalogItem {
  id: number;
  title: string;
  url: string;
  description?: string;
  supportPageUrl?: string;
  category?: string;
  enabled: boolean;
  displayAsNew?: boolean;
  isStarter?: boolean;
  isMobileFriendly?: boolean;
  isInternal?: boolean;
}
