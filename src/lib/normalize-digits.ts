/** Normalize Arabic-Indic and Persian digits without changing IDs or other text. */
export function normalizeDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (digit) =>
    String(digit.charCodeAt(0) - (digit <= '٩' ? 0x0660 : 0x06f0)),
  );
}
