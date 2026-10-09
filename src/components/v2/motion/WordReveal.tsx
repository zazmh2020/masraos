import { Fragment } from 'react';

/**
 * WordReveal — دخول النص كلمةً كلمة.
 * مقتبس من VengeanceUI `staggerText` (MIT — https://github.com/Ashutoshx7/VengeanceUI).
 * التعديلات: CSS فقط (بلا JavaScript — النص يظهر فور تحميل الصفحة ولا يؤخّر LCP على الجوال)،
 * المسافة بين الكلمات خارج الصندوق المقصوص (داخله تنطوي ولا تظهر)،
 * وتقسيم بالكلمات حصرًا لأن تقسيم الحروف يكسر اتصال الحروف العربية.
 */
export default function WordReveal({ text, delay = 0, step = 0.06 }: { text: string; delay?: number; step?: number }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <span className="v2-words">
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="v2-word"><span style={{ animationDelay: `${(delay + i * step).toFixed(2)}s` }}>{w}</span></span>
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </span>
  );
}
