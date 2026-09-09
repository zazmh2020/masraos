import type { ReactNode } from 'react';

/** إطار نافذة وهمي لواجهات المنصة (يُستخدم عبر الصفحة). */
function Shell({ title, active = 0, children }: { title: string; active?: number; children: ReactNode }) {
  return (
    <div className="mk">
      <div className="mk-bar">
        <span className="mk-dot" /><span className="mk-dot" /><span className="mk-dot" />
        <span className="mk-title">{title}</span>
      </div>
      <div className="mk-body">
        <div className="mk-rail">
          {[0, 1, 2, 3, 4].map((i) => (
            <i key={i} className={i === active ? 'on' : ''} />
          ))}
        </div>
        <div className="mk-main">{children}</div>
      </div>
    </div>
  );
}

function Rows({ items }: { items: { c: string; tag?: 'g' | 'o'; tl?: string }[] }) {
  return (
    <div className="mk-rows">
      {items.map((it, i) => (
        <div key={i} className="mk-row">
          <span className="mk-av">{it.c}</span>
          <span className="rl"><span className="a" /><span className="b" /></span>
          {it.tag && <span className={`mk-tag ${it.tag}`}>{it.tl}</span>}
        </div>
      ))}
    </div>
  );
}

export type MockKind =
  | 'dashboard' | 'org' | 'hr' | 'people' | 'projects'
  | 'beneficiaries' | 'education' | 'finance' | 'reports' | 'documents' | 'ai';

const KPI = ({ k, v, t }: { k: string; v: string; t?: string }) => (
  <div className="mk-kpi"><div className="k">{k}</div><div className="v">{v}</div>{t && <div className="t">▲ {t}</div>}</div>
);

export default function Mockup({ kind, title, active }: { kind: MockKind; title?: string; active?: number }) {
  switch (kind) {
    case 'projects':
      return (
        <Shell title={title ?? 'مسرى — المشاريع'} active={active ?? 2}>
          <div className="mk-h"><b>لوحة المشاريع</b><span className="mk-chip">١٤ مشروعًا</span></div>
          <div className="mk-panel" style={{ marginBottom: '0.7rem' }}>
            <div className="pt"><span>حالة الإنجاز</span></div>
            <div className="mk-prog">
              <div className="pr"><div className="pl"><span>برنامج التمكين</span><span>82%</span></div><div className="track"><i style={{ width: '82%' }} /></div></div>
              <div className="pr"><div className="pl"><span>حملة الشتاء</span><span>64%</span></div><div className="track"><i style={{ width: '64%' }} /></div></div>
              <div className="pr"><div className="pl"><span>مشروع الأيتام</span><span>45%</span></div><div className="track"><i style={{ width: '45%' }} /></div></div>
            </div>
          </div>
          <div className="mk-kpis"><KPI k="نشطة" v="9" /><KPI k="مكتملة" v="4" /><KPI k="متأخرة" v="1" /></div>
        </Shell>
      );
    case 'hr':
    case 'people':
      return (
        <Shell title={title ?? 'مسرى — الموارد البشرية'} active={active ?? 1}>
          <div className="mk-h"><b>الموظفون والمتطوعون</b><span className="mk-chip">٢٤٧ عضوًا</span></div>
          <div className="mk-kpis"><KPI k="موظفون" v="86" t="4" /><KPI k="متطوعون" v="161" /><KPI k="فرق" v="12" /></div>
          <div className="mk-panel">
            <div className="pt"><span>أحدث الأعضاء</span></div>
            <Rows items={[{ c: 'م', tag: 'g', tl: 'نشط' }, { c: 'س', tag: 'o', tl: 'قيد' }, { c: 'ع', tag: 'g', tl: 'نشط' }]} />
          </div>
        </Shell>
      );
    case 'reports':
      return (
        <Shell title={title ?? 'مسرى — التقارير'} active={active ?? 4}>
          <div className="mk-h"><b>التقارير والتحليلات</b><span className="mk-chip">هذا الشهر</span></div>
          <div className="mk-two">
            <div className="mk-panel"><div className="pt"><span>الأداء</span></div><div className="mk-bars"><span style={{ height: '50%' }} /><span style={{ height: '72%' }} /><span style={{ height: '40%' }} /><span style={{ height: '88%' }} /><span style={{ height: '62%' }} /><span style={{ height: '95%' }} /></div></div>
            <div className="mk-panel"><div className="pt"><span>الإنجاز</span></div><div className="mk-donut" /></div>
          </div>
          <div className="mk-kpis" style={{ marginTop: '0.7rem' }}><KPI k="مؤشرات" v="18" /><KPI k="نمو" v="24%" t="6" /><KPI k="تقارير" v="42" /></div>
        </Shell>
      );
    case 'beneficiaries':
      return (
        <Shell title={title ?? 'مسرى — المستفيدون'} active={active ?? 3}>
          <div className="mk-h"><b>سجل المستفيدين</b><span className="mk-chip">١٬٩٤٠ حالة</span></div>
          <div className="mk-kpis"><KPI k="حالات" v="1,940" t="38" /><KPI k="خدمات" v="7" /><KPI k="مغطاة" v="86%" /></div>
          <div className="mk-panel"><div className="pt"><span>أحدث الحالات</span></div><Rows items={[{ c: 'ح', tag: 'g', tl: 'مقبولة' }, { c: 'ن', tag: 'o', tl: 'مراجعة' }, { c: 'ر', tag: 'g', tl: 'مقبولة' }]} /></div>
        </Shell>
      );
    case 'education':
      return (
        <Shell title={title ?? 'مسرى — التعليم'} active={active ?? 3}>
          <div className="mk-h"><b>الحلقات والبرامج</b><span className="mk-chip">٣٢ حلقة</span></div>
          <div className="mk-kpis"><KPI k="طلاب" v="247" t="12" /><KPI k="حلقات" v="32" /><KPI k="حضور" v="89%" t="4" /></div>
          <div className="mk-panel"><div className="pt"><span>تقدّم الحفظ</span></div><div className="mk-prog"><div className="pr"><div className="pl"><span>حلقة النور</span><span>74%</span></div><div className="track"><i style={{ width: '74%' }} /></div></div><div className="pr"><div className="pl"><span>حلقة الفلق</span><span>58%</span></div><div className="track"><i style={{ width: '58%' }} /></div></div></div></div>
        </Shell>
      );
    case 'finance':
      return (
        <Shell title={title ?? 'مسرى — المالية والتبرعات'} active={active ?? 2}>
          <div className="mk-h"><b>المالية والتبرعات</b><span className="mk-chip">SAR</span></div>
          <div className="mk-kpis"><KPI k="التبرعات" v="482K" t="12%" /><KPI k="حملات" v="6" /><KPI k="متبرعون" v="1,204" /></div>
          <div className="mk-panel"><div className="pt"><span>التبرعات — آخر ٦ أشهر</span></div><div className="mk-bars"><span style={{ height: '40%' }} /><span style={{ height: '55%' }} /><span style={{ height: '48%' }} /><span style={{ height: '70%' }} /><span style={{ height: '82%' }} /><span style={{ height: '95%' }} /></div></div>
        </Shell>
      );
    case 'documents':
      return (
        <Shell title={title ?? 'مسرى — الوثائق'} active={active ?? 0}>
          <div className="mk-h"><b>إدارة الوثائق</b><span className="mk-chip">٣١٨ ملفًا</span></div>
          <div className="mk-kpis"><KPI k="ملفات" v="318" /><KPI k="سياسات" v="24" /><KPI k="نماذج" v="47" /></div>
          <div className="mk-panel"><div className="pt"><span>أحدث المستندات</span></div><Rows items={[{ c: 'PDF', tag: 'g', tl: 'معتمد' }, { c: 'DOC' }, { c: 'XLS', tag: 'o', tl: 'مسودة' }]} /></div>
        </Shell>
      );
    case 'org':
      return (
        <Shell title={title ?? 'مسرى — إدارة المؤسسة'} active={active ?? 0}>
          <div className="mk-h"><b>الهيكل المؤسسي</b><span className="mk-chip">٦ إدارات</span></div>
          <div className="mk-kpis"><KPI k="إدارات" v="6" /><KPI k="أقسام" v="18" /><KPI k="فروع" v="4" /></div>
          <div className="mk-panel"><div className="pt"><span>الوحدات التنظيمية</span></div><Rows items={[{ c: 'إد' }, { c: 'قس' }, { c: 'فر' }]} /></div>
        </Shell>
      );
    case 'ai':
      return (
        <Shell title={title ?? 'مسرى AI'} active={active ?? 4}>
          <div className="mk-h"><b>مساعد مسرى الذكي</b><span className="mk-chip">AI</span></div>
          <div className="mk-panel" style={{ marginBottom: '0.7rem' }}>مرحبًا 👋 اسألني عن أداء مؤسستك…</div>
          <div className="mk-kpis"><KPI k="رؤى" v="12" /><KPI k="توصيات" v="5" /><KPI k="تنبيهات" v="3" /></div>
        </Shell>
      );
    case 'dashboard':
    default:
      return (
        <Shell title={title ?? 'مسرى — لوحة التحكم'} active={active ?? 0}>
          <div className="mk-h"><b>نظرة عامة</b><span className="mk-chip">مباشر</span></div>
          <div className="mk-kpis"><KPI k="المستخدمون" v="247" t="12" /><KPI k="المشاريع" v="14" /><KPI k="الإنجاز" v="86%" t="4" /></div>
          <div className="mk-two">
            <div className="mk-panel"><div className="pt"><span>النشاط</span></div><div className="mk-bars"><span style={{ height: '45%' }} /><span style={{ height: '65%' }} /><span style={{ height: '52%' }} /><span style={{ height: '80%' }} /><span style={{ height: '60%' }} /><span style={{ height: '92%' }} /></div></div>
            <div className="mk-panel"><div className="pt"><span>التوزيع</span></div><div className="mk-donut" /></div>
          </div>
        </Shell>
      );
  }
}
