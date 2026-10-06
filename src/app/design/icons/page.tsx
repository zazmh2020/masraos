import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Icon, { IconShape, type IconTone, type IconShapeVariant } from '@/components/Icon';
import { icons, filledIcons, type IconName } from '@/lib/icons';

/* ============================================================
   معاينة أيقونات مسرى بألوان الهوية — للتطوير فقط.
   كل الأيقونات بلا استثناء، بكل الأنماط والأشكال، للمراجعة والاعتماد.
   ============================================================ */

export const metadata: Metadata = { title: 'أيقونات مسرى — معاينة', robots: { index: false, follow: false } };

const GROUPS: { title: string; names: IconName[] }[] = [
  { title: 'التنقّل والحساب', names: ['home', 'dashboard', 'user', 'login', 'logout', 'settings', 'notifications', 'messages', 'search', 'menu', 'sidebar', 'language', 'apps'] },
  { title: 'التعليم', names: ['education', 'quran', 'students', 'teachers', 'halaqat', 'attendance', 'memorization', 'recitation', 'review', 'assessment', 'certificates', 'knowledge'] },
  { title: 'الجهة والإدارة', names: ['organization', 'building', 'office', 'structure', 'users', 'group', 'activeUser', 'administration', 'verified', 'identity', 'qr', 'lock'] },
  { title: 'العمليات والمحتوى', names: ['operations', 'resources', 'projects', 'programs', 'campaigns', 'donations', 'beneficiaries', 'events', 'announcement', 'documents', 'content', 'folders', 'folder', 'notes'] },
  { title: 'التحليلات', names: ['analytics', 'statistics', 'reports', 'growth', 'activities', 'target', 'assistant', 'star', 'heart', 'leaf', 'world', 'pin', 'completed', 'alert'] },
  { title: 'إجراءات التحكّم', names: ['add', 'edit', 'delete', 'copy', 'link', 'view', 'hide', 'send', 'check', 'close', 'reject', 'back', 'forward', 'chevronDown', 'expand', 'collapse', 'sun', 'moon'] },
];

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

export default function IconsPreview() {
  if (process.env.NODE_ENV === 'production') notFound();
  const all = Object.keys(icons) as IconName[];
  const listed = new Set(GROUPS.flatMap((g) => g.names));
  const rest = all.filter((n) => !listed.has(n));
  const groups = rest.length ? [...GROUPS, { title: 'أخرى', names: rest }] : GROUPS;

  return (
    <main className="icp" dir="rtl">
      <style>{`
        .icp { font-family: var(--font-body); color: var(--text-primary); background: var(--white); padding: 32px; }
        .icp h1 { font-size: 28px; font-weight: 700; color: var(--brand-primary-dark); margin: 0 0 8px; }
        .icp > p { margin: 0 0 32px; color: var(--text-secondary); font-size: 14px; }
        .icp h2 { font-size: 16px; font-weight: 700; color: var(--brand-primary-dark); margin: 32px 0 12px; }
        .icp table { border-collapse: collapse; width: 100%; }
        .icp th { font-size: 12px; font-weight: 600; color: var(--text-secondary); text-align: center; padding: 8px; border-bottom: 1px solid var(--gray-200); }
        .icp th:first-child { text-align: start; }
        .icp td { text-align: center; padding: 8px; border-bottom: 1px solid var(--gray-100); color: var(--brand-primary-dark); }
        .icp td:first-child { text-align: start; font-size: 12px; color: var(--text-secondary); white-space: nowrap; }
        .icp td.deep { background: var(--brand-primary-dark); color: #fff; }
        .icp .tag { font-size: 11.5px; color: var(--brand-primary); }
      `}</style>
      <h1>أيقونات مسرى بألوان الهوية</h1>
      <p>{all.length} أيقونة · 3 أنماط · 4 أشكال · على خلفية فاتحة وداكنة. «•» = تعبئة Tabler الجاهزة؛ والبقية بتعبئات مصمَّمة على هندسة الأيقونة نفسها.</p>
      {groups.map((g) => (
        <section key={g.title}>
          <h2>{g.title}</h2>
          <table>
            <thead>
              <tr>
                <th>الاسم</th>
                {TONES.map((t) => <th key={t.tone}>{t.label}</th>)}
                <th>ثنائي على داكن</th>
                {SHAPES.map((s) => <th key={s.label}>{s.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {g.names.map((n) => (
                <tr key={n}>
                  <td>{n} {filledIcons[n] ? <span className="tag">•</span> : null}</td>
                  {TONES.map((t) => <td key={t.tone}><Icon name={n} size={24} tone={t.tone} /></td>)}
                  <td className="deep"><Icon name={n} size={24} tone="duo" className="on-deep" /></td>
                  {SHAPES.map((s) => <td key={s.label}><IconShape name={n} shape={s.shape} variant={s.variant} size="md" /></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </main>
  );
}
