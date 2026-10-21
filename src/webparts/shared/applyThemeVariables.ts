import type { IReadonlyTheme } from '@microsoft/sp-component-base';

/** Maps SharePoint theme palette/semantic colors to CSS custom properties on the web part root. */
export function applyThemeVariables(element: HTMLElement, theme: IReadonlyTheme | undefined): void {
  element.style.setProperty(
    '--wpFontFamily',
    "'BC Sans', var(--fontFamilyCustom, var(--fontFamilyBase, inherit))"
  );

  if (!theme) {
    return;
  }

  const { palette, semanticColors } = theme;

  if (semanticColors) {
    element.style.setProperty('--bodyText', semanticColors.bodyText || '');
    element.style.setProperty('--link', semanticColors.link || '');
    element.style.setProperty('--linkHovered', semanticColors.linkHovered || '');
  }

  if (palette) {
    element.style.setProperty('--themePrimary', palette.themePrimary || '');
    element.style.setProperty('--themeDark', palette.themeDark || '');
    element.style.setProperty('--themeDarker', palette.themeDarker || '');
    element.style.setProperty('--themeLight', palette.themeLight || '');
    element.style.setProperty('--bodyBackground', palette.white || '');
    element.style.setProperty('--neutralSecondary', palette.neutralSecondary || '');
    element.style.setProperty('--neutralPrimary', palette.neutralPrimary || '');
    element.style.setProperty('--neutralQuaternary', palette.neutralQuaternary || '');
    element.style.setProperty('--tileText', palette.white || '');
  }
}
