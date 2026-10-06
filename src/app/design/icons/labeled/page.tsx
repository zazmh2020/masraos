import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Icon, { IconShape, type IconTone, type IconShapeVariant } from '@/components/Icon';
import { icons, type IconName } from '@/lib/icons';
import { ICON_GROUPS, ICON_LABELS } from '../icon-catalog';

/* ============================================================
   معاينة أيقونات مسرى مع المسميات — للتطوير فقط.
   نفس اللوحة الأولى، وتحت كل أيقونة مسمّاها كما يظهر في الواجهة.
   ============================================================ */

export const metadata: Metadata = { title: 'أيقونات مسرى مع المسميات — معاينة', robots: { index: false, follow: false } };

const TONES: { tone: IconTone; label: string }[] = [
  { tone: 'line', label: 'خط' },
  { tone: 'duo', label: 'ثنائي اللون' },
  { tone: 'solid', label: 'معبّأ' },
];
const SHAPES: { variant: IconShapeVariant; shape: 'circle' | 'square'; label: string }[] = [
  { variant: 'soft', shape: 'square', label: 'مربع فاتح' },
  { variant: 'solid', shape: 'square', label: 'مربع أساسي' },
  { variant: 'deep', shape: 'circle', label: 'دائرة داكنة' },
  { variant: 'outline', shape: 'circle', label: 'دائرة بحد' },
];

export default function LabeledIconsPreview() {
  if (process.env.NODE_ENV === 'production') notFound();
  const all = Object.keys(icons) as IconName[];
  const listed = new Set(ICON_GROUPS.flatMap((g) => g.names));
  const rest = all.filter((n) => !listed.has(n));
  const groups = rest.length ? [...ICON_GROUPS, { title: 'أخرى', names: rest }] : ICON_GROUPS;

  return (
    <main className="icl" dir="rtl">
      <style>{`
        .icl { font-family: var(--font-body); color: var(--text-primary); background: var(--white); padding: 32px; }
        .icl h1 { font-size: 28px; font-weight: 700; color: var(--brand-primary-dark); margin: 0 0 8px; }
        .icl > p { margin: 0 0 32px; color: var(--text-secondary); font-size: 14px; }
        .icl h2 { font-size: 16px; font-weight: 700; color: var(--brand-primary-dark); margin: 32px 0 12px; }
        .icl table { border-collapse: collapse; width: 100%; table-layout: fixed; }
        .icl th { font-size: 12px; font-weight: 600; color: var(--text-secondary); text-align: center; padding: 8px; border-bottom: 1px solid var(--gray-200); }
        .icl th:first-child { text-align: start; width: 150px; }
        .icl td { text-align: center; padding: 12px 4px; border-bottom: 1px solid var(--gray-100); vertical-align: middle; }
        .icl td:first-child { text-align: start; }
        .icl .nm { display: block; font-size: 14px; font-weight: 600; color: var(--brand-primary-dark); }
        .icl .nm-en { display: block; font-size: 12px; color: var(--text-secondary); }
        .icl .cell { display: inline-grid; justify-items: center; gap: 8px; color: var(--brand-primary-dark); }
        .icl .cell span.lb { font-size: 12px; font-weight: 500; line-height: 1.3; color: var(--text-primary); }
        .icl td.deep { background: var(--brand-primary-dark); }
        .icl td.deep .lb { color: #FFFFFF; }
      `}</style>
      <h1>أيقونات مسرى مع المسميات</h1>
      <p>{all.length} أيقونة · كل أيقونة بمسمّاها كما يظهر في الواجهة · 3 أنماط · 4 أشكال · على خلفية فاتحة وداكنة.</p>
      {groups.map((g) => (
        <section key={g.title}>
          <h2>{g.title}</h2>
          <table>
            <thead>
              <tr>
                <th>المسمّى</th>
                {TONES.map((t) => <th key={t.tone}>{t.label}</th>)}
                <th>ثنائي على داكن</th>
                {SHAPES.map((s) => <th key={s.label}>{s.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {g.names.map((n) => {
                const label = ICON_LABELS[n];
                return (
                  <tr key={n}>
                    <td><span className="nm">{label.ar}</span><span className="nm-en">{label.en} · {n}</span></td>
                    {TONES.map((t) => (
                      <td key={t.tone}><span className="cell"><Icon name={n} size={24} tone={t.tone} /><span className="lb">{label.ar}</span></span></td>
                    ))}
                    <td className="deep"><span className="cell"><Icon name={n} size={24} tone="duo" className="on-deep" /><span className="lb">{label.ar}</span></span></td>
                    {SHAPES.map((s) => (
                      <td key={s.label}><span className="cell"><IconShape name={n} shape={s.shape} variant={s.variant} size="md" /><span className="lb">{label.ar}</span></span></td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ))}
    </main>
  );
}
