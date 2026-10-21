import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneSlider,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'MyFavouritesWebPartStrings';
import MyFavourites from './components/MyFavourites';
import { IMyFavouritesProps } from './components/IMyFavouritesProps';
import { CatalogService } from './services/CatalogService';
import { FavouritesStorageService } from './services/FavouritesStorageService';
import { DEFAULT_MAX_ROWS, normalizeMaxRows } from './services/gridLayout';
import { resolveFavouritesStorageSiteUrl } from './services/constants';
import { resolveEntraUserId } from './services/sharePointUtils';
import { propertyPaneWithoutVisibilityGroup } from '../shared/propertyPaneTypes';
import { applyThemeVariables } from '../shared/applyThemeVariables';

export interface IMyFavouritesWebPartProps {
  maxRows: number;
  manageAboutUrl: string;
}

export default class MyFavouritesWebPart extends BaseClientSideWebPart<IMyFavouritesWebPartProps> {
  private _storageService!: FavouritesStorageService;
  private _catalogService!: CatalogService;

  public render(): void {
    const element: React.ReactElement<IMyFavouritesProps> = React.createElement(MyFavourites, {
      storageService: this._storageService,
      catalogService: this._catalogService,
      maxRows: normalizeMaxRows(this.properties.maxRows),
      manageAboutUrl: (this.properties.manageAboutUrl ?? '').trim()
    });

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    applyThemeVariables(this.domElement, undefined);
    this._initServices();
    return Promise.resolve();
  }

  protected onPropertyPaneFieldChanged(propertyPath: string, oldValue: unknown, newValue: unknown): void {
    if ((propertyPath === 'maxRows' || propertyPath === 'manageAboutUrl') && oldValue !== newValue) {
      this.render();
    }
    super.onPropertyPaneFieldChanged(propertyPath, oldValue, newValue);
  }

  private _initServices(): void {
    // Resolve the shared storage site even on pages in other Pulse sites.
    const storageSiteUrl: string = resolveFavouritesStorageSiteUrl(
      this.context.pageContext.site.absoluteUrl
    );

    this._storageService = new FavouritesStorageService(
      this.context,
      storageSiteUrl,
      resolveEntraUserId(this.context)
    );

    this._catalogService = new CatalogService(this.context, storageSiteUrl);
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    applyThemeVariables(this.domElement, currentTheme);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return propertyPaneWithoutVisibilityGroup({
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.ManageGroupName,
              groupFields: [
                PropertyPaneTextField('manageAboutUrl', {
                  label: strings.ManageAboutUrlLabel,
                  description: strings.ManageAboutUrlDescription,
                  placeholder: 'https://'
                })
              ]
            },
            {
              groupName: strings.DisplayGroupName,
              groupFields: [
                PropertyPaneSlider('maxRows', {
                  label: strings.MaxRowsLabel,
                  min: 1,
                  max: 10,
                  step: 1,
                  showValue: true,
                  value: normalizeMaxRows(this.properties.maxRows ?? DEFAULT_MAX_ROWS)
                })
              ]
            }
          ]
        }
      ]
    });
  }
}
