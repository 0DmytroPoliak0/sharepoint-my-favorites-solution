import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'AddFavouriteWebPartStrings';
import AddFavourite from './components/AddFavourite';
import type { IAddFavouriteLinkConfig, IAddFavouriteProps } from './components/IAddFavouriteProps';
import { FAVOURITES_STORAGE_SITE_URL } from '../myFavourites/services/constants';
import { FavouritesStorageService } from '../myFavourites/services/FavouritesStorageService';
import { resolveEntraUserId } from '../myFavourites/services/sharePointUtils';
import { propertyPaneWithoutVisibilityGroup } from '../shared/propertyPaneTypes';
import { applyThemeVariables } from '../shared/applyThemeVariables';
import { resolveAddFavouriteLink, type IAddFavouriteWebPartProps } from './services/resolveAddFavouriteLink';

export type { IAddFavouriteWebPartProps };

export default class AddFavouriteWebPart extends BaseClientSideWebPart<IAddFavouriteWebPartProps> {
  private _storageService!: FavouritesStorageService;

  public render(): void {
    const link: IAddFavouriteLinkConfig = resolveAddFavouriteLink(this.properties, this.context);

    const element: React.ReactElement<IAddFavouriteProps> = React.createElement(AddFavourite, {
      storageService: this._storageService,
      link
    });

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    applyThemeVariables(this.domElement, undefined);
    this._initServices();
    return Promise.resolve();
  }

  protected onPropertyPaneFieldChanged(propertyPath: string, oldValue: unknown, newValue: unknown): void {
    if (oldValue !== newValue) {
      this.render();
    }
    super.onPropertyPaneFieldChanged(propertyPath, oldValue, newValue);
  }

  private _initServices(): void {
    this._storageService = new FavouritesStorageService(
      this.context,
      FAVOURITES_STORAGE_SITE_URL,
      resolveEntraUserId(this.context),
      this.context.pageContext.user.loginName
    );
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
              groupName: strings.LinkGroupName,
              groupFields: [
                PropertyPaneTextField('linkTitle', {
                  label: strings.LinkTitleLabel,
                  description: strings.LinkTitleDescription
                }),
                PropertyPaneTextField('linkUrl', {
                  label: strings.LinkUrlLabel,
                  placeholder: 'https://',
                  description: strings.LinkUrlDescription
                }),
                PropertyPaneTextField('description', {
                  label: strings.DescriptionLabel,
                  multiline: true,
                  rows: 3
                }),
                PropertyPaneToggle('internal', {
                  label: strings.InternalLabel,
                  offText: strings.InternalOffText,
                  onText: strings.InternalOnText,
                  checked: this.properties.internal === true
                }),
                PropertyPaneTextField('helpInfo', {
                  label: strings.HelpInfoLabel,
                  description: strings.HelpInfoDescription,
                  multiline: true,
                  rows: 3
                })
              ]
            }
          ]
        }
      ]
    });
  }
}
