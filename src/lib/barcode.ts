/* ============================================================
   Code 39 — توليد باركود SVG (بلا مكتبة أو خط خارجي)
   يقرأه قارئ USB الليزري كالنظام القديم. لكل رمز 9 عناصر (5 أعمدة + 4 فراغات)
   ثلاثة منها عريضة. النمط '1' = عريض، '0' = ضيّق. تبدأ/تنتهي بالرمز '*'.
   ============================================================ */

const C39: Record<string, string> = {
  '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
  '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
  '8': '100100100', '9': '001100100', 'A': '100001001', 'B': '001001001',
  'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000',
  'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
  'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011',
  'O': '100010010', 'P': '001010010', 'Q': '000000111', 'R': '100000110',
  'S': '001000110', 'T': '000010110', 'U': '110000001', 'V': '011000001',
  'W': '111000000', 'X': '010010001', 'Y': '110010000', 'Z': '011010000',
  '-': '010000101', '.': '110000100', ' ': '011000100', '$': '010101000',
  '/': '010100010', '+': '010001010', '%': '000101010', '*': '010010100',
};

const VALID = /^[0-9A-Z\-. $/+%]*$/;

/** هل القيمة قابلة للترميز بـ Code 39؟ */
export function isCode39Value(v: string): boolean {
  return VALID.test(String(v).toUpperCase());
}

/** سلسلة العناصر (n/w) للنص مع رمزَي البداية/النهاية — للاختبار والتوليد. */
export function code39Pattern(value: string): string {
  const text = '*' + String(value).toUpperCase().replace(/[^0-9A-Z\-. $/+%]/g, '') + '*';
  let out = '';
  for (const ch of text) {
    const p = C39[ch];
    if (p) out += p; // 9 عناصر لكل رمز
  }
  return out;
}

/** ينتج SVG لباركود Code 39 من القيمة (رقم الطالب مثلاً). */
export function code39Svg(
  value: string,
  opts: { height?: number; narrow?: number; ratio?: number } = {},
): string {
  const height = opts.height ?? 64;
  const N = opts.narrow ?? 2;
  const W = N * (opts.ratio ?? 2.5);
  const quiet = N * 10;

  const text = '*' + String(value).toUpperCase().replace(/[^0-9A-Z\-. $/+%]/g, '') + '*';
  const bars: string[] = [];
  let x = quiet;
  for (const ch of text) {
    const pat = C39[ch];
    if (!pat) continue;
    for (let i = 0; i < 9; i++) {
      const w = pat[i] === '1' ? W : N;
      if (i % 2 === 0) bars.push(`<rect x="${x.toFixed(2)}" y="0" width="${w.toFixed(2)}" height="${height}"/>`); // عمود
      x += w;
    }
    x += N; // فراغ فاصل ضيّق بين الرموز
  }
  const totalW = x - N + quiet;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW.toFixed(2)} ${height}" width="100%" height="${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${String(value)}"><rect x="0" y="0" width="${totalW.toFixed(2)}" height="${height}" fill="#fff"/><g fill="#000">${bars.join('')}</g></svg>`;
}
