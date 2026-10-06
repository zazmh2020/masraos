/* ============================================================
   النمط العام لواجهة الجهة — يُخزَّن في organizations.uiTheme (JSON).
   مصدر واحد للخيارات والقيم الافتراضية والتحقق، للخادم والواجهة.
   ============================================================ */

export const SIDEBAR_STYLES = ['brand', 'deep', 'white'] as const;
export const ICON_STYLES = ['line', 'duo', 'solid'] as const;
export const SHAPE_STYLES = ['soft', 'solid', 'deep', 'outline'] as const;
export const SHAPE_FORMS = ['square', 'circle'] as const;
export const BUTTON_STYLES = ['pill', 'rounded'] as const;

export type UiTheme = {
  sidebar: (typeof SIDEBAR_STYLES)[number];
  icons: (typeof ICON_STYLES)[number];
  shape: (typeof SHAPE_STYLES)[number];
  shapeForm: (typeof SHAPE_FORMS)[number];
  buttons: (typeof BUTTON_STYLES)[number];
};

/** الافتراضي لكل الجهات: شريط جانبي بلون الهوية، أيقونات ثنائية اللون، مربعات فاتحة، أزرار كبسولية. */
export const DEFAULT_UI_THEME: UiTheme = {
  sidebar: 'brand',
  icons: 'duo',
  shape: 'soft',
  shapeForm: 'square',
  buttons: 'pill',
};

const pick = <T extends readonly string[]>(list: T, v: unknown, fallback: T[number]): T[number] =>
  typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T[number]) : fallback;

/** يقرأ أي قيمة مخزّنة (أو null) ويعيد نمطًا صالحًا كاملًا — القيم غير المعروفة تعود للافتراضي. */
export function normalizeUiTheme(raw: unknown): UiTheme {
  const o = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return {
    sidebar: pick(SIDEBAR_STYLES, o.sidebar, DEFAULT_UI_THEME.sidebar),
    icons: pick(ICON_STYLES, o.icons, DEFAULT_UI_THEME.icons),
    shape: pick(SHAPE_STYLES, o.shape, DEFAULT_UI_THEME.shape),
    shapeForm: pick(SHAPE_FORMS, o.shapeForm, DEFAULT_UI_THEME.shapeForm),
    buttons: pick(BUTTON_STYLES, o.buttons, DEFAULT_UI_THEME.buttons),
  };
}

/** تحقق صارم لما يرسله العميل: يرفض المفاتيح أو القيم غير المعروفة بدل تجاهلها بصمت. */
export function parseUiThemeInput(raw: unknown): UiTheme | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const allowed: Record<keyof UiTheme, readonly string[]> = {
    sidebar: SIDEBAR_STYLES, icons: ICON_STYLES, shape: SHAPE_STYLES, shapeForm: SHAPE_FORMS, buttons: BUTTON_STYLES,
  };
  for (const k of Object.keys(o)) if (!(k in allowed)) return null;
  for (const [k, list] of Object.entries(allowed)) {
    if (o[k] !== undefined && !(typeof o[k] === 'string' && list.includes(o[k] as string))) return null;
  }
  return normalizeUiTheme(o);
}

/** سمات data-* على غلاف اللوحة؛ الأنماط في calm-org.css تقرأها. */
export function uiThemeAttrs(t: UiTheme): Record<string, string> {
  return {
    'data-sidebar': t.sidebar,
    'data-icons': t.icons,
    'data-shape': t.shape,
    'data-shape-form': t.shapeForm,
    'data-buttons': t.buttons,
  };
}
