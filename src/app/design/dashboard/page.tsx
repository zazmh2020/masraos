import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Icon from '@/components/Icon';
import CalmShell, { type CalmNavItem } from '@/components/calm/CalmShell';
import { CalmIcon } from '@/components/calm/icons';
import {
  PageHead, SectionHead, FilterButton, Pills, Status, StatCard, Metric,
  Sparkline, Bars, Tile, MonthCalendar, type Tone,
} from '@/components/calm/parts';
import '@/styles/calm.css';

/* ============================================================
   معاينة نظام الواجهة الهادئة — للتطوير فقط، ببيانات توضيحية.
   لا تقرأ قاعدة البيانات؛ تُعرض الشاشات الأربع للمراجعة البصرية.
   ============================================================ */

export const metadata: Metadata = { title: 'معاينة الواجهة — مسرى', robots: { index: false, follow: false } };

type Screen = 'overview' | 'attendance' | 'exams' | 'schedule';
const SCREENS: Screen[] = ['overview', 'attendance', 'exams', 'schedule'];
const href = (s: Screen) => `/design/dashboard?screen=${s}`;

const MAIN: CalmNavItem[] = [
  { key: 'overview', label: 'الرئيسية', icon: 'dashboard', href: href('overview'), kbd: ['⌘', 'M'] },
  { key: 'prep', label: 'تحضير الحلقات', icon: 'halaqat', href: '#' },
  { key: 'attendance', label: 'الحضور', icon: 'attendance', href: href('attendance') },
  { key: 'exams', label: 'الاختبارات', icon: 'assessment', href: href('exams') },
  { key: 'tasks', label: 'التسميع والواجبات', icon: 'memorization', href: '#' },
  { key: 'schedule', label: 'الجدول', icon: 'events', href: href('schedule') },
  { key: 'students', label: 'الطلاب', icon: 'students', href: href('overview') },
  { key: 'messages', label: 'الرسائل', icon: 'messages', href: '#', count: 2 },
  { key: 'analytics', label: 'التحليلات', icon: 'analytics', href: '#' },
  { key: 'reports', label: 'التقارير', icon: 'reports', href: '#' },
];
const SECONDARY: CalmNavItem[] = [
  { key: 'news', label: 'أخبار المركز', icon: 'announcement', href: '#' },
  { key: 'activities', label: 'أنشطة المركز', icon: 'activities', href: '#' },
  { key: 'whatsnew', label: 'ما الجديد', icon: 'star', href: '#' },
];
const ACCOUNT = { name: 'أ. خالد العتيبي', role: 'معلّم', initials: 'خع' };
const DEMO = <span className="calm-demo-flag"><CalmIcon name="info" size={14} />بيانات توضيحية</span>;

export default async function DesignDashboard({ searchParams }: { searchParams: Promise<{ screen?: string }> }) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { screen: raw } = await searchParams;
  const screen: Screen = SCREENS.includes(raw as Screen) ? (raw as Screen) : 'overview';
  const activeNav = screen === 'overview' ? 'students' : screen;

  const crumbs = {
    overview: [{ label: 'مَسرى', href: '#' }, { label: 'نظرة على الطلاب', href: '#', icon: 'home' }, { label: 'أحمد الزهراني' }],
    attendance: [{ label: 'مركز النور', href: '#' }, { label: 'الحضور', icon: 'attendance' }],
    exams: [{ label: 'مركز النور', href: '#' }, { label: 'الاختبارات', icon: 'assessment' }],
    schedule: [{ label: 'مركز النور', href: '#' }, { label: 'الجدول', icon: 'events' }],
  }[screen];

  return (
    <CalmShell main={MAIN} secondary={SECONDARY} active={activeNav} crumbs={crumbs} account={ACCOUNT}>
      {screen === 'overview' && <Overview />}
      {screen === 'attendance' && <Attendance />}
      {screen === 'exams' && <Exams />}
      {screen === 'schedule' && <Schedule />}
    </CalmShell>
  );
}

/* ============================================================ نظرة على الطالب */
function Overview() {
  const tasks: [string, string, Parameters<typeof Status>[0]['kind'], string][] = [
    ['سورة البقرة — الآيات 1–20', 'قبل 12 ساعة', 'late', 'لم يُسلَّم'],
    ['مراجعة جزء عمّ', 'قبل 23 ساعة', 'done', 'مكتمل'],
    ['سورة آل عمران — الآيات 1–15', 'قبل يومين', 'done', 'مكتمل'],
    ['أحكام النون الساكنة', 'قبل 3 أيام', 'done', 'مكتمل'],
    ['سرد خمسة أجزاء', 'قبل 5 أيام', 'wait', 'لم يكتمل'],
    ['مراجعة جزء تبارك', 'قبل 5 أيام', 'new', 'لم يُراجَع'],
  ];
  return (
    <>
      <PageHead
        lead={<span className="calm-ava is-lg">أز</span>}
        title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>أحمد الزهراني <Icon name="chevronDown" size={20} /></span>}
        sub="نظرة على تقدّم أحمد في الحفظ والحضور والاختبارات."
        actions={<>{DEMO}<FilterButton count={1} /></>}
      />

      <div className="calm-stats">
        <StatCard title="تقدّم الحفظ" icon="growth">
          <div className="calm-stat-body"><Metric value="+10%" label="منذ الشهر الماضي" /><Sparkline points={[18, 22, 20, 34, 30, 52, 48, 70, 88]} /></div>
        </StatCard>
        <StatCard title="الاختبارات" icon="assessment" link="عرض الاختبارات">
          <div className="calm-stat-body"><Metric value="19.3" label="متوسط الدرجة من 20" /><Bars values={[70, 40, 92, 55, 30, 82, 60]} highlight={[0, 2, 5]} /></div>
        </StatCard>
        <StatCard title="النشاط" icon="activities" link="عرض الحالة">
          <div className="calm-trio">
            <div><div className="calm-num">8</div><Status kind="done">حاضر</Status></div>
            <div><div className="calm-num">3</div><Status kind="late">غائب</Status></div>
            <div><div className="calm-num">12</div><Status kind="wait">فعالية</Status></div>
          </div>
        </StatCard>
      </div>

      <section className="calm-section">
        <SectionHead title="التسميع" />
        <div className="calm-tiles">
          <Tile icon="pending" value="23/32" label="لم يُراجَع" />
          <Tile tone="rose" icon="clock" value="23/32" label="لم يُسلَّم" />
          <Tile tone="sand" icon="x" value="23/32" label="لم يكتمل" />
          <Tile tone="mint" icon="check" value="23/32" label="مكتمل" />
        </div>
      </section>

      <section className="calm-section">
        <SectionHead title="آخر الواجبات"><FilterButton count={1} /></SectionHead>
        <div className="calm-table-wrap">
          <table className="calm-table">
            <thead><tr><th>اسم الواجب</th><th>الوقت</th><th className="end">الحالة</th></tr></thead>
            <tbody>
              {tasks.map(([name, time, kind, label]) => (
                <tr key={name}><td>{name}</td><td className="muted">{time}</td><td className="end"><Status kind={kind}>{label}</Status></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="calm-section">
        <SectionHead title="اختبارات الطالب"><FilterButton count={1} /></SectionHead>
        <div className="calm-table-wrap">
          <table className="calm-table">
            <thead><tr><th>التاريخ</th><th>عنوان الاختبار</th><th>الدرجة</th><th>الترتيب</th><th className="end">التغيّر عن السابق</th></tr></thead>
            <tbody>
              <tr><td>9 يونيو 2025</td><td>اختبار جزء عمّ</td><td className="num">19.75</td><td className="num">#7</td><td className="end"><Status kind="late">‎-23%</Status></td></tr>
              <tr><td>2 يونيو 2025</td><td>اختبار أحكام التجويد</td><td className="num">18.50</td><td className="num">#4</td><td className="end"><Status kind="done">‎+12%</Status></td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

/* ============================================================ الحضور */
const PRESENT = ['عبدالله الشهري', 'يوسف القحطاني', 'عمر الدوسري', 'سلمان الحربي', 'فيصل المطيري', 'إبراهيم العنزي', 'مازن الغامدي', 'حمزة السبيعي', 'أنس الشمري', 'زياد العمري', 'بدر الزهراني', 'ريان المالكي'];
const ABSENT = ['نواف العتيبي', 'تركي الرشيدي', 'سعود البقمي', 'ماجد الجهني'];
const LATE = ['هشام الفيفي', 'وليد العسيري'];
const initials = (n: string) => n.split(' ').map((w) => w.replace(/^ال/, '')[0]).join('');

function People({ names }: { names: string[] }) {
  return (
    <div className="calm-people">
      {names.map((n, i) => (
        <a key={n} href="#" className="calm-person-row">
          <span className={`calm-ava is-sm c${(i % 4) + 1}`}>{initials(n)}</span>
          {n}
          <span className="go"><CalmIcon name="chevronEnd" size={16} /></span>
        </a>
      ))}
    </div>
  );
}

function Attendance() {
  return (
    <>
      <PageHead title="الحضور" sub="تابع حضور طلاب الحلقة يوميًا وراقب الغياب والتأخّر بسهولة." actions={<>{DEMO}<Pills label="الحلقات" items={['حلقة 302', 'حلقة 303', 'حلقة 304']} active="حلقة 302" withCheck /></>} />
      <div className="calm-att">
        <div className="calm-att-cal">
          <MonthCalendar month="فبراير" startOffset={4} days={28} today={9} has={[1, 2, 5, 6, 8]} />
          <Tile tone="mint" icon="check" value="23/24" label="حضور" meter={14} meterOn={13} />
          <Tile tone="rose" icon="x" value="1/24" label="غياب" meter={14} meterOn={2} />
          <Tile icon="pending" value="1/24" label="تأخّر" meter={14} meterOn={2} />
        </div>
        <div className="calm-col">
          <div className="calm-col-head is-ok"><CalmIcon name="check" size={18} />الحضور<span className="n">{PRESENT.length}</span></div>
          <People names={PRESENT} />
        </div>
        <div className="calm-col">
          <div className="calm-col-head is-off"><CalmIcon name="x" size={18} />الغياب<span className="n">{ABSENT.length}</span></div>
          <People names={ABSENT} />
        </div>
        <div className="calm-col">
          <div className="calm-col-head is-late"><CalmIcon name="clock" size={18} />التأخّر<span className="n">{LATE.length}</span></div>
          <People names={LATE} />
        </div>
      </div>
    </>
  );
}

/* ============================================================ الاختبارات */
type Exam = { code: string; time: string; title: string; level: string; tone: Tone; count: number };
const EXAMS: Record<number, Exam[]> = {
  1: [
    { code: '302', time: '8:00 ص', title: 'اختبار جزء عمّ', level: 'المستوى الثالث', tone: 'lav', count: 19 },
    { code: '303', time: '9:00 ص', title: 'اختبار التجويد', level: 'المستوى الأول', tone: 'sand', count: 18 },
  ],
  3: [
    { code: '304', time: '8:00 ص', title: 'سرد خمسة أجزاء', level: 'المستوى الخامس', tone: 'rose', count: 20 },
    { code: '302', time: '9:00 ص', title: 'اختبار جزء تبارك', level: 'المستوى الثالث', tone: 'sky', count: 19 },
    { code: '305', time: '10:00 ص', title: 'اختبار المراجعة', level: 'المستوى الرابع', tone: 'mint', count: 18 },
  ],
  6: [{ code: '303', time: '8:00 ص', title: 'اختبار التجويد', level: 'المستوى الأول', tone: 'sand', count: 18 }],
};
const DAY_NOTE: Record<number, string> = { 2: 'لا يوجد اختبار.', 4: 'عطلة نهاية الأسبوع', 5: 'عطلة نهاية الأسبوع' };

function ExamCard({ e }: { e: Exam }) {
  return (
    <article className={`calm-exam ${e.tone === 'lav' ? '' : `is-${e.tone}`}`}>
      <div className="calm-exam-top"><span className="code">{e.code}</span><span><b>حلقة {e.code}</b><small>{e.time}</small></span></div>
      <div className="calm-exam-body"><span className="ico"><Icon name="assessment" size={16} /></span><span><b>{e.title}</b><small>{e.level}</small></span></div>
      <div className="calm-exam-foot">
        <span className="calm-status is-on-white"><CalmIcon name="check" size={13} />مؤكّد</span>
        <span className="calm-status is-on-white"><Icon name="students" size={16} />{e.count}</span>
        <span className="more"><CalmIcon name="more" size={18} /></span>
      </div>
    </article>
  );
}

function Exams() {
  return (
    <>
      <PageHead
        title="الاختبارات"
        sub="خطّط لاختبارات الحفظ والتجويد، وتابع مواعيدها وأعداد المختبَرين في كل حلقة."
        actions={<>{DEMO}<button type="button" className="calm-icon-btn" aria-label="بحث"><Icon name="search" size={18} /></button><button type="button" className="calm-btn calm-btn-primary"><Icon name="add" size={16} />إضافة اختبار</button></>}
      />
      <div className="calm-split">
        <div className="calm-split-main">
          <div className="calm-section-head" style={{ marginBottom: 'var(--s-4)' }}><h2>تقويم الاختبارات</h2><FilterButton count={1} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 'var(--s-3)' }}>
            <button type="button" className="calm-icon-btn" aria-label="السابق"><CalmIcon name="chevronStart" size={16} /></button>
            <Pills label="الأشهر" items={['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو']} active="فبراير" />
            <button type="button" className="calm-icon-btn" aria-label="التالي"><CalmIcon name="chevronEnd" size={16} /></button>
          </div>
          {[1, 2, 3, 4, 5, 6].map((d) => (
            <div key={d} className="calm-dayrow">
              <span className={`d ${d === 6 ? 'is-today' : ''}`}>{d}</span>
              {EXAMS[d] ? <div className="calm-exams">{EXAMS[d].map((e, i) => <ExamCard key={i} e={e} />)}</div> : <span className="empty">{DAY_NOTE[d]}</span>}
            </div>
          ))}
        </div>
        <aside className="calm-split-aside">
          <MonthCalendar month="فبراير" startOffset={4} days={28} today={6}
            has={[1, 2, 5, 7, 8, 9, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 26, 27, 28]}
            marks={{ 1: 'rose', 5: 'rose', 9: 'sky', 14: 'lav', 20: 'lav', 26: 'rose', 29: 'rose' }}
            note="اختبارات هذا الشهر" />
          <section className="calm-section">
            <SectionHead title="الاختبارات القادمة"><FilterButton /></SectionHead>
            <div className="calm-upcoming">
              <div className="calm-up"><span className="code">302</span><b>اختبار جزء عمّ</b><span className="left calm-status is-on-white">بعد 4 أيام</span><small>10 فبراير · 7:30 ← 9:00 ص</small></div>
              <div className="calm-up is-mint"><span className="code">303</span><b>اختبار التجويد</b><span className="left calm-status is-on-white">بعد 5 أيام</span><small>11 فبراير · 7:30 ← 9:00 ص</small></div>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}

/* ============================================================ الجدول الأسبوعي */
const WEEK = ['1 - الأحد', '2 - الإثنين', '3 - الثلاثاء', '4 - الأربعاء', '5 - الخميس', '6 - الجمعة', '7 - السبت'];
const HOURS = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];
const HOUR_PX = 76;
type Ev = { day: number; from: number; to: number; title: string; tone: Tone; confirmed?: boolean };
const toMin = (h: number, m = 0) => h * 60 + m;
const EVENTS: Ev[] = [
  { day: 1, from: toMin(7), to: toMin(7, 40), title: 'تسميع الحفظ', tone: 'lav' },
  { day: 1, from: toMin(7, 40), to: toMin(9), title: 'درس التجويد', tone: 'sky' },
  { day: 1, from: toMin(10), to: toMin(10, 40), title: 'مراجعة الجزء', tone: 'lav' },
  { day: 1, from: toMin(10, 50), to: toMin(12, 10), title: 'نشاط رياضي', tone: 'sand', confirmed: true },
  { day: 3, from: toMin(9), to: toMin(9, 40), title: 'تسميع الحفظ', tone: 'lav' },
  { day: 3, from: toMin(9, 40), to: toMin(11), title: 'اختبار المراجعة', tone: 'mint', confirmed: true },
  { day: 6, from: toMin(8), to: toMin(8, 40), title: 'درس التجويد', tone: 'sky' },
  { day: 6, from: toMin(8, 50), to: toMin(10, 10), title: 'مسابقة الحفظ', tone: 'rose', confirmed: true },
];
const fmt = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;

function Schedule() {
  const now = toMin(8, 40);
  return (
    <>
      <PageHead
        title="01–07 يناير 2025"
        actions={<>{DEMO}<Pills label="التصنيف" items={['الكل', 'الحفظ', 'التجويد', 'المراجعة', 'الأنشطة']} active="الكل" withCheck /><button type="button" className="calm-pill is-plain">هذا الأسبوع <Icon name="chevronDown" size={16} /></button><FilterButton count={1} /><button type="button" className="calm-btn calm-btn-primary"><Icon name="add" size={16} />إضافة موعد</button></>}
      />
      <div className="calm-week-wrap">
        <div className="calm-week" style={{ gridTemplateRows: `auto repeat(${HOURS.length}, ${HOUR_PX}px)` }}>
          {/* مواضع صريحة لكل خلية — وإلا تدفعها الممرّات المثبّتة إلى صفوف ضمنية */}
          <span className="corner" style={{ gridColumn: 1, gridRow: 1 }} />
          {WEEK.map((d, i) => <span key={d} className={`wh ${i === 1 ? 'is-today' : ''}`} style={{ gridColumn: i + 2, gridRow: 1 }}>{d}</span>)}
          {HOURS.map((h, r) => (
            <span key={h} style={{ display: 'contents' }}>
              <span className="time" style={{ gridColumn: 1, gridRow: r + 2 }}>{h}</span>
              {WEEK.map((d, i) => <span key={d} className={`cell ${i === 5 ? 'is-off' : ''}`} style={{ gridColumn: i + 2, gridRow: r + 2 }} />)}
            </span>
          ))}
          {WEEK.map((d, i) => (
            <div key={`lane-${d}`} className="lane" style={{ gridColumn: i + 2 }}>
              {EVENTS.filter((e) => e.day === i).map((e, k) => (
                <div key={k} className={`calm-ev ${e.tone === 'lav' ? '' : `is-${e.tone}`}`} style={{ top: ((e.from - toMin(6)) / 60) * HOUR_PX + 2, height: ((e.to - e.from) / 60) * HOUR_PX - 4 }}>
                  <b>{e.title}<CalmIcon name="more" size={16} /></b>
                  <small>{fmt(e.from)} – {fmt(e.to)}</small>
                  {e.confirmed && <span className="calm-status is-on-white"><CalmIcon name="check" size={13} />مؤكّد</span>}
                </div>
              ))}
              {i === 1 && <div className="calm-now" style={{ top: ((now - toMin(6)) / 60) * HOUR_PX }}><span>{fmt(now)}</span></div>}
              {[1, 3, 6].includes(i) && (
                <button type="button" className={`calm-week-fab ${i === 6 ? 'is-rose' : i === 3 ? 'is-sky' : 'is-sand'}`} aria-label="تعديل اليوم"><CalmIcon name="pencil" size={16} /></button>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
