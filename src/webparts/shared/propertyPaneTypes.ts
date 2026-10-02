import type { IPropertyPaneConfiguration } from '@microsoft/sp-property-pane';

/** Hides SharePoint's built-in Visibility group ("Show in mobile and email view"). */
export interface IPropertyPaneConfigurationExtended extends IPropertyPaneConfiguration {
  disableVisibilityGroup?: boolean;
}

export function propertyPaneWithoutVisibilityGroup(
  config: IPropertyPaneConfiguration
): IPropertyPaneConfiguration {
  const extended: IPropertyPaneConfigurationExtended = {
    ...config,
    disableVisibilityGroup: true
  };
  return extended;
}
