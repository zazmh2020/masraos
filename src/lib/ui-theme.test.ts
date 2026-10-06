import { describe, expect, it } from 'vitest';
import { DEFAULT_UI_THEME, normalizeUiTheme, parseUiThemeInput, uiThemeAttrs } from './ui-theme';

describe('organization UI theme', () => {
  it('defaults to a brand-colored sidebar, duotone icons, soft squares and pill buttons', () => {
    expect(normalizeUiTheme(null)).toEqual(DEFAULT_UI_THEME);
    expect(DEFAULT_UI_THEME.sidebar).toBe('brand');
  });
  it('keeps valid stored values and repairs unknown ones', () => {
    expect(normalizeUiTheme({ sidebar: 'white', icons: 'solid', shape: 'nope' })).toEqual({ ...DEFAULT_UI_THEME, sidebar: 'white', icons: 'solid' });
    expect(normalizeUiTheme(['brand'])).toEqual(DEFAULT_UI_THEME);
  });
  it('rejects unknown keys or values from clients instead of silently saving them', () => {
    expect(parseUiThemeInput({ sidebar: 'deep', icons: 'line', shape: 'outline', shapeForm: 'circle', buttons: 'rounded' }))
      .toEqual({ sidebar: 'deep', icons: 'line', shape: 'outline', shapeForm: 'circle', buttons: 'rounded' });
    expect(parseUiThemeInput({ sidebar: 'red' })).toBeNull();
    expect(parseUiThemeInput({ sidebar: 'brand', css: 'body{}' })).toBeNull();
    expect(parseUiThemeInput('brand')).toBeNull();
  });
  it('exposes the theme as data attributes for CSS', () => {
    expect(uiThemeAttrs(DEFAULT_UI_THEME)).toEqual({ 'data-sidebar': 'brand', 'data-icons': 'duo', 'data-shape': 'soft', 'data-shape-form': 'square', 'data-buttons': 'pill' });
  });
});
