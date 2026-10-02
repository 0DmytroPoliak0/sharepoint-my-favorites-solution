declare interface IMyFavouritesWebPartStrings {
  PropertyPaneDescription: string;
  ManageGroupName: string;
  ManageAboutUrlLabel: string;
  ManageAboutUrlDescription: string;
  DisplayGroupName: string;
  MaxRowsLabel: string;
  MaxRowsDescription: string;
}

declare module 'MyFavouritesWebPartStrings' {
  const strings: IMyFavouritesWebPartStrings;
  export = strings;
}
