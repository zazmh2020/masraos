import Link from 'next/link';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canManageEducation } from '@/lib/permissions';
import PlansView, { type ReadyPlan, type CustomPlan, type Stage } from '@/components/education/PlansView';
import '@/styles/statistics.css';
import '@/styles/modules.css';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

// القوالب الجاهزة (خطط معدّة مسبقًا)
const READY_PLANS: ReadyPlan[] = [
  {
    id: 'full', icon: 'education/education-quran', title: 'خطة الحفظ الكامل', subtitle: '٣٠ جزءًا · ٣ سنوات', tag: 'شاملة',
    desc: 'مسار متدرّج لحفظ القرآن كاملًا مع التثبيت والمراجعة الدورية.',
    kpis: [['المدة', '٣ سنوات'], ['الأجزاء', '30'], ['الحصص/أسبوع', '5']],
    stages: [
      { t: 'التأسيس', d: 'جزء عمّ + تبارك', meta: '4 أشهر' },
      { t: 'المتوسط', d: 'من الذاريات إلى المجادلة', meta: '10 أشهر' },
      { t: 'المتقدّم', d: 'بقية الأجزاء مع التثبيت', meta: '16 شهرًا' },
      { t: 'الختم والإجازة', d: 'مراجعة شاملة وتقييم نهائي', meta: '6 أشهر' },
    ],
  },
  {
    id: 'juz30', icon: 'education/education-learning', title: 'خطة جزء عمّ', subtitle: 'للمبتدئين · 4 أشهر', tag: 'مبتدئ',
    desc: 'مدخل مثالي للناشئة لبناء عادة الحفظ من السور القصيرة.',
    kpis: [['المدة', '4 أشهر'], ['السور', '37'], ['الحصص/أسبوع', '3']],
    stages: [
      { t: 'قصار السور', d: 'من الناس إلى الضحى', meta: '6 أسابيع' },
      { t: 'الوسط', d: 'من الليل إلى النبأ', meta: '6 أسابيع' },
      { t: 'التثبيت', d: 'مراجعة الجزء كاملًا', meta: '4 أسابيع' },
    ],
  },
  {
    id: 'mufassal', icon: 'education/education-courses', title: 'خطة المفصّل', subtitle: 'من ق إلى الناس · 8 أشهر', tag: 'متوسط',
    desc: 'حفظ المفصّل بأقسامه الثلاثة (الطوال والأوساط والقصار).',
    kpis: [['المدة', '8 أشهر'], ['الأجزاء', '7'], ['الحصص/أسبوع', '4']],
    stages: [
      { t: 'طوال المفصّل', d: 'من ق إلى المرسلات', meta: '3 أشهر' },
      { t: 'أوساط المفصّل', d: 'من النبأ إلى الضحى', meta: '3 أشهر' },
      { t: 'قصار المفصّل', d: 'من الشرح إلى الناس', meta: 'شهران' },
    ],
  },
  {
    id: 'review', icon: 'operations/operations-progress', title: 'خطة المراجعة', subtitle: 'تثبيت المحفوظ · مستمرة', tag: 'مستمرة',
    desc: 'دورة مراجعة منتظمة تحافظ على المحفوظ وتقيس التثبيت.',
    kpis: [['الدورة', 'أسبوعية'], ['الورد', 'حزب/يوم'], ['التقييم', 'شهري']],
    stages: [
      { t: 'الورد اليومي', d: 'مراجعة حزب مع المعلّم', meta: 'يوميًا' },
      { t: 'التسميع الأسبوعي', d: 'عرض 5 أجزاء', meta: 'أسبوعيًا' },
      { t: 'التقييم الشهري', d: 'اختبار تثبيت شامل', meta: 'شهريًا' },
    ],
  },
  {
    id: 'tajweed', icon: 'education/education-lessons', title: 'خطة التجويد', subtitle: 'الأحكام العملية · 3 أشهر', tag: 'مهارة',
    desc: 'إتقان أحكام التلاوة تطبيقيًا مع مخارج الحروف والصفات.',
    kpis: [['المدة', '3 أشهر'], ['الأحكام', '12'], ['الحصص/أسبوع', '2']],
    stages: [
      { t: 'المخارج والصفات', d: 'أساس النطق السليم', meta: '4 أسابيع' },
      { t: 'أحكام النون والميم', d: 'إظهار وإدغام وإخفاء', meta: '4 أسابيع' },
      { t: 'المدود والتطبيق', d: 'تلاوة مُتقنة', meta: '4 أسابيع' },
    ],
  },
];

export default async function PlansPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();
  const base = `/org/${org.slug}`;

  const rows = await prisma.studyPlan.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, subtitle: true, description: true, tag: true, stages: true },
  });
  const custom: CustomPlan[] = rows.map((p) => ({
    id: p.id, title: p.title, subtitle: p.subtitle, description: p.description, tag: p.tag,
    stages: Array.isArray(p.stages) ? (p.stages as unknown as Stage[]) : [],
  }));

  return (
    <div className="org-page">
      <nav className="org-crumb" aria-label="مسار">
        <Link href={base}>لوحة التحكم</Link><span>/</span>
        <Link href={`${base}/education`}>التعليم</Link><span>/</span>
        <span className="is-current">الخطط والمقرّرات</span>
      </nav>
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('pg.eyeQuran')}</span>
          <h1>{t('pg.plans.title')}</h1>
          <p>{t('pg.plans.sub')}</p>
        </div>
      </div>
      <PlansView ready={READY_PLANS} custom={custom} canManage={canManageEducation(user)} orgName={org.name} orgLogo={org.logoUrl} />
    </div>
  );
}
