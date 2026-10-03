import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import OrgShell, { type NavEntry } from '@/components/OrgShell';
import '@/styles/org.css';
import '@/styles/calm.css';
import '@/styles/calm-org.css';

/* ============================================================
   فحص بصري للجلد الهادئ على OrgShell الحقيقي — للتطوير فقط.
   بلا قاعدة بيانات: خصائص توضيحية. ?brand=%23RRGGBB لمحاكاة هوية جهة.
   ============================================================ */

export const metadata: Metadata = { title: 'فحص لوحة المؤسسة — مسرى', robots: { index: false, follow: false } };

const base = '/design/org-shell';
const NAV: NavEntry[] = [
  { kind: 'link', href: base, label: 'الرئيسية', icon: 'home' },
  { kind: 'divider', label: 'التعليم' },
  {
    kind: 'group', label: 'الحلقات والطلاب', icon: 'education',
    children: [
      { href: `${base}/students`, label: 'الطلاب' },
      { href: `${base}/halaqat`, label: 'الحلقات' },
      { href: `${base}/attendance`, label: 'الحضور' },
    ],
  },
  { kind: 'link', href: `${base}/plans`, label: 'الخطط والتسميع', icon: 'plans' },
  { kind: 'link', href: `${base}/competitions`, label: 'المسابقات', icon: 'competitions' },
  { kind: 'divider', label: 'الإدارة' },
  { kind: 'link', href: `${base}/users`, label: 'المستخدمون', icon: 'users' },
  { kind: 'link', href: `${base}/reports`, label: 'التقارير', icon: 'reports' },
  { kind: 'link', href: `${base}/settings`, label: 'الإعدادات', icon: 'settings' },
];

const ROWS: [string, string, string, boolean][] = [
  ['عبدالله الشهري', 'حلقة النور', 'قبل ساعتين', true],
  ['يوسف القحطاني', 'حلقة الفجر', 'أمس', true],
  ['عمر الدوسري', 'حلقة النور', 'قبل 3 أيام', false],
  ['سلمان الحربي', 'حلقة الهدى', 'قبل أسبوع', true],
];

export default async function OrgShellCheck({ searchParams }: { searchParams: Promise<{ brand?: string }> }) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { brand } = await searchParams;
  const brandColor = brand && /^#[0-9a-fA-F]{6}$/.test(brand) ? brand : null;

  return (
    <OrgShell
      org={{ name: 'مركز النور لتعليم القرآن', slug: 'design-check', brandColor }}
      user={{ name: 'أ. خالد العتيبي', role: 'ORG_ADMIN', jobTitle: 'مدير المركز' }}
      nav={NAV}
      inbox={{ messages: [], notifications: [] }}
    >
      <div className="org-page">
        <div className="org-page-head">
          <div>
            <span className="org-eyebrow">لوحة المؤسسة · بيانات توضيحية</span>
            <h1>مرحبًا، خالد</h1>
            <p>نظرة سريعة على الحلقات والطلاب والحضور في مركزك اليوم.</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="org-btn org-btn-outline">تصدير</button>
            <button type="button" className="org-btn org-btn-primary">+ إضافة طالب</button>
          </div>
        </div>

        <div className="org-stats">
          <div className="org-stat"><div className="org-stat-label">إجمالي الطلاب</div><div className="org-stat-value">247</div></div>
          <div className="org-stat"><div className="org-stat-label">الحلقات</div><div className="org-stat-value">32</div></div>
          <div className="org-stat"><div className="org-stat-label">نسبة الحضور</div><div className="org-stat-value">89%</div></div>
          <div className="org-stat"><div className="org-stat-label">اختبارات هذا الشهر</div><div className="org-stat-value">9</div></div>
        </div>

        <section className="org-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2>آخر نشاط الطلاب</h2>
            <button type="button" className="org-btn org-btn-quiet">عرض الكل</button>
          </div>
          <div className="org-table-wrap">
            <table className="org-table">
              <thead><tr><th>الطالب</th><th>الحلقة</th><th>آخر حضور</th><th>الحالة</th></tr></thead>
              <tbody>
                {ROWS.map(([n, h, t, on]) => (
                  <tr key={n}><td><strong>{n}</strong></td><td>{h}</td><td>{t}</td><td><span className={`org-badge ${on ? 'is-on' : ''}`}>{on ? 'نشط' : 'موقوف'}</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </OrgShell>
  );
}
