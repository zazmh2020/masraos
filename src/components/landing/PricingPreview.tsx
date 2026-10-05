'use client';

import { useRef, useState } from 'react';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { useCurrency } from '@/components/CurrencyProvider';
import { CURRENCIES, convertRounded, formatAmount } from '@/lib/currency';
import { CurrencySymbol } from '@/components/RiyalSign';
import styles from './pricing-preview.module.css';
import PreviewPlanAdvisor from './PreviewPlanAdvisor';
import Icon from '@/components/Icon';

function PlanIcon({ level }: { level: number }) {
  return <Icon className={styles.planIcon} name={['leaf', 'home', 'organization', 'office'][level] ?? 'organization'} size={40} />;
}

// Presentation-only proposal: never use these values for billing or access control.
const plans = [
  {
    name: ['الانطلاقة', 'Launch'], price: 19, years: 10,
    description: ['نظّم أعمال مركزك اليومية، دون ذكاء اصطناعي.', 'Organize everyday center operations, without AI.'],
    features: [
      ['إدارة الطلاب والمعلمين والحلقات', 'Students, teachers and Quran circles'],
      ['الحضور والغياب ومتابعة الحفظ والمراجعة', 'Attendance, memorization and revision tracking'],
      ['استمارة الطالب وطباعتها وتقارير أساسية', 'Printable student registration and basic reports'],
      ['تصدير البيانات والصلاحيات الأساسية', 'Data export and essential permissions'],
    ],
    limits: ['حدود مقترحة: 100 طالب نشط • مركز واحد • ملفات 2 GB', 'Proposed limits: 100 active students • One center • 2 GB files'],
  },
  {
    name: ['النمو', 'Growth'], price: 49, years: 8,
    description: ['ساعد المعلم والموظف ووفّر وقت الفريق.', 'Help teachers and staff save time.'],
    features: [
      ['جميع خدمات الانطلاقة', 'Everything in Launch'],
      ['النقاط والتحفيز والشهادات وتقارير تقدم تفصيلية', 'Points, recognition, certificates and detailed progress reports'],
      ['مساعد ذكي للمعلم: تلخيص التقدم واقتراح المراجعة', 'Teacher AI: progress summaries and revision suggestions'],
      ['مساعد للموظف: مسودات التقارير والمراسلات', 'Staff AI: report and correspondence drafts'],
      ['قوالب جاهزة وتدريب جماعي عند التهيئة', 'Templates and group onboarding'],
    ],
    limits: ['حدود مقترحة: 300 طالب نشط • مركز واحد • ملفات 5 GB', 'Proposed limits: 300 active students • One center • 5 GB files'],
  },
  {
    name: ['التمكين', 'Empower'], price: 99, years: 5,
    description: ['افهم أداء المركز ونظّم قرارات المتابعة.', 'Understand center performance and organize follow-up decisions.'],
    features: [
      ['جميع خدمات النمو', 'Everything in Growth'],
      ['تحليلات إدارية ومقارنة أداء الحلقات والفترات', 'Management analytics across circles and periods'],
      ['مساعد إداري يبرز الغياب والتراجع مع أسبابه المستندة للبيانات', 'Management AI highlighting absence and decline with supporting data'],
      ['اقتراح إجراءات ومتابعة الحالات بعد اعتماد الإدارة', 'Suggested actions and case follow-up with management approval'],
      ['مسودات تقارير دورية وسعة أعلى للمساعد وتهيئة خاصة', 'Periodic report drafts, higher AI allowance and individual onboarding'],
    ],
    limits: ['حدود مقترحة: 750 طالبًا نشطًا • مركز واحد • ملفات 15 GB', 'Proposed limits: 750 active students • One center • 15 GB files'],
  },
];

export default function PricingPreview() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState(0);
  const [yearly, setYearly] = useState(false);
  const { locale } = useLocale();
  const { currency } = useCurrency();
  const symbol = <CurrencySymbol code={currency} locale={locale} />;
  // Draft prices are USD; the shared converter accepts SAR amounts.
  const money = (usd: number) => formatAmount(convertRounded(usd / CURRENCIES.USD.rate, currency), locale);
  const lang = locale === 'en' ? 1 : 0;
  const pick = (ar: string, en: string) => lang ? en : ar;
  const period = yearly ? pick('/ سنة للمركز', '/ center / year') : pick('/ شهر للمركز', '/ center / month');
  const total = (monthly: number) => money(monthly * (yearly ? 12 : 1));
  return (
    <div className={`masra-ui ${styles.preview}`} data-pricing-preview>
      <PreviewPlanAdvisor plans={plans} price={total} period={period} symbol={symbol} />
      <p className={styles.limits}>{pick('باقة الأثر: التفاصيل قريبًا، ولا تدخل في الترشيح حتى تُحدّد خدماتها وحدودها.', 'Impact: details coming soon. It is not included in recommendations until its services and limits are defined.')}</p>
      <div className={styles.billingControls}>
        <div className="billing-toggle" role="group" aria-label={pick('دورة الاشتراك', 'Billing period')}>
          <button type="button" className={`billing-opt ${!yearly ? 'is-active' : ''}`} aria-pressed={!yearly} onClick={() => setYearly(false)}>{pick('شهري', 'Monthly')}</button>
          <button type="button" className={`billing-opt ${yearly ? 'is-active' : ''}`} aria-pressed={yearly} onClick={() => setYearly(true)}>{pick('سنوي', 'Annual')}</button>
        </div>
        {yearly && <p>{pick('المبلغ المعروض إجمالي 12 شهرًا، دون خصم سنوي حاليًا.', 'The displayed total covers 12 months, with no annual discount currently.')}</p>}
      </div>
      <div className={styles.planGrid}>
        {plans.map((plan, index) => (
          <article id={`preview-plan-${index}`} tabIndex={-1} key={plan.price} className={`${styles.planCard} ${index === 2 ? styles.growthCard : ''}`}>
            <div className={styles.cardIntro}>
              <PlanIcon level={index} />
              <h3 className={styles.planName}>{plan.name[lang]}</h3>
              <div className={styles.planPrice} aria-live="polite"><b className={styles.planAmount} dir="ltr">{total(plan.price)}</b><span className={styles.planPeriod}>{symbol} {period}</span></div>
              <small>{pick('سعر مقترح، قبل الضرائب.', 'Proposed price, before taxes.')}</small>
              <p className={styles.planDescription}>{plan.description[lang]}</p>
            </div>
            <button type="button" className={styles.cardAction} onClick={() => { setSelected(index); dialogRef.current?.showModal(); }} aria-label={pick(`استعرض باقة ${plan.name[0]}`, `Preview ${plan.name[1]}`)}>{pick('استعرض الباقة', 'Preview plan')}</button>
            <div className={styles.cardDetails}>
              <h4>{pick('أبرز الخدمات المقترحة', 'Proposed highlights')}</h4>
              <p className={styles.aiNote}>{pick(index === 0 ? 'إدارة أساسية دون مساعد ذكي' : 'المساعد الذكي مشمول بالتصوّر', index === 0 ? 'Core management · No AI' : 'AI included in the proposal')}</p>
              <ul className={styles.featureList}>{plan.features.map((feature) => <li key={feature[1]}><Icon name="check" size={16} /><span>{feature[lang]}</span></li>)}</ul>
            </div>
            <p className={styles.limits}>{plan.limits[lang]}</p>
          </article>
        ))}
        <article id="preview-plan-3" tabIndex={-1} className={`${styles.planCard} ${styles.empowerCard}`}>
          <div className={styles.cardIntro}>
            <PlanIcon level={3} />
            <h3 className={styles.planName}>{pick('الأثر', 'Impact')}</h3>
            <div className={styles.planPrice}><b className={styles.pendingPrice}>{pick('التفاصيل قريبًا', 'Coming soon')}</b></div>
            <small>{pick('السعر ومدة الاستحقاق لم يُحدّدا بعد.', 'Price and entitlement period are not defined yet.')}</small>
            <p className={styles.planDescription}>{pick('باقة جديدة، تُعلن تفاصيلها بعد اعتمادها.', 'A new plan. Details will be announced once approved.')}</p>
          </div>
          <button type="button" className={styles.cardAction} disabled>{pick('قريبًا', 'Coming soon')}</button>
          <div className={styles.cardDetails}>
            <h4>{pick('الخدمات والحدود', 'Services and limits')}</h4>
            <p className={styles.aiNote}>{pick('لم تُحدّد مزايا هذه الباقة بعد. لا تتاح للشراء أو طلب الاشتراك حاليًا.', 'This plan’s features have not been defined. It is not available for purchase or subscription requests.')}</p>
          </div>
          <p className={styles.limits}>{pick('لا يوجد سعر أو التزام مالي معتمد لهذه الباقة.', 'No approved price or financial commitment for this plan.')}</p>
        </article>
      </div>
      <p className={styles.shared}>{pick('ضمن تصور الانطلاقة والنمو والتمكين: حماية البيانات وعزل المؤسسات والصلاحيات الأساسية وتصدير البيانات والنسخ الاحتياطي وفق سياسة تُعتمد لاحقًا. نمو وتمكين تشملان المساعد بحصص استخدام تُحدد بعد قياس التكلفة، دون رسوم مفاجئة أو تنفيذ إجراءات مهمة دون موافقة.', 'In the Launch, Growth and Empower proposal: data protection, tenant isolation, essential permissions, export and backups under a policy to be finalized. Growth and Empower include AI with allowances determined after cost measurement, no surprise charges, and approval before consequential actions.')}</p>
      <p className={styles.limits}>{pick('التحويل للعرض وفق أسعار الصرف التقريبية المضبوطة في الموقع، وليس سعر صرف مباشرًا أو عرض دفع نهائيًا.', 'Display conversion uses the approximate rates configured on this site, not live exchange rates or a final payment quote.')}</p>
      <details id="entitlement-preview" className={styles.policy}>
        <summary className={styles.policyToggle}>{pick('برنامج الاستحقاق الدائم — خيار مستقل · عرض التفاصيل', 'Long-term entitlement — separate option · View details')}</summary>
        <span className={styles.tag}>{pick('مسودة سياسة للمناقشة — ليست اتفاقية نهائية', 'Discussion draft — not a final agreement')}</span>
        <h3>{pick('برنامج الاستحقاق الدائم', 'Long-term entitlement program')}</h3>
        <div className={styles.durations}>{plans.map(plan => <div key={plan.price}><strong>{plan.name[lang]}</strong><span>{pick(`${plan.years} سنوات مدفوعة (${plan.years * 12} شهرًا)`, `${plan.years} paid years (${plan.years * 12} months)`)}</span></div>)}</div>
        <p>{pick('الفكرة: يدفع المركز اشتراك باقته خلال المدة المؤهلة؛ وبعد إكمالها يتوقف رسم اشتراك مَسرى، ويستمر المركز على خدمات باقته مقابل حصته من تكاليف التشغيل الفعلية فقط. لا تعني هذه الفكرة خدمة مجانية أو نقل ملكية البرنامج.', 'Concept: the center pays its plan subscription during the qualifying period. Afterwards, the Masra subscription fee ends and the center retains its plan services while paying only its share of actual operating costs. This does not mean free service or software ownership.')}</p>
        <div className={styles.policyGrid}>
          <div><h4>{pick('كيف تُحسب المدة؟', 'How does time qualify?')}</h4><p>{pick('انطلاقة: 120 شهرًا، نمو: 96 شهرًا، تمكين: 60 شهرًا. المقترح احتساب أشهر الخدمة المدفوعة فعليًا؛ الدفع مقدمًا لا يُكمل السنوات فورًا. هذه مدة استحقاق وليست التزامًا بالبقاء طوالها.', 'Launch: 120 months; Growth: 96; Empower: 60. The proposal counts paid service months as they elapse; prepayment does not instantly complete the years. This is an eligibility period, not a commitment to remain subscribed throughout.')}</p></div>
          <div><h4>{pick('ما تكلفة التشغيل؟', 'What are operating costs?')}</h4><p>{pick('حصة عادلة من الخادم وقاعدة البيانات والتخزين والنسخ الاحتياطي والنطاق والخدمات المشتركة، مع تكلفة الذكاء الاصطناعي والرسائل والتحصيل بحسب الاستخدام. دون هامش ربح في هذا التصوّر ودون تحميل كل مركز فاتورة الخادم كاملة.', 'A fair share of hosting, database, storage, backups, domain and shared services, plus usage-based AI, messaging and collection costs. The proposal adds no profit margin and does not charge each center the full server bill.')}</p></div>
          <div><h4>{pick('لماذا لا يوجد مبلغ ثابت الآن؟', 'Why is there no fixed amount yet?')}</h4><p>{pick('لم تُعتمد خدمات الإنتاج أو تُقَس تكاليف الاستخدام بعد. يتحدد المبلغ بكشف واضح وآلية توزيع معلنة، وقد يتغير مع الاستهلاك وأسعار المزودين. لا نعِد بمبلغ ثابت للأبد.', 'Production services and measured usage costs are not finalized. Charges require an itemized statement and published allocation method and may change with usage and supplier prices. No forever-fixed operating price is promised.')}</p></div>
          <div><h4>{pick('ما الذي يحتاج اعتمادًا؟', 'What remains to be approved?')}</h4><p>{pick('الأسعار النهائية، الترقية وتغيير الباقة، التوقف والاستئناف، حصص الاستخدام، تمويل الدعم والصيانة بعد الاستحقاق، الضرائب، وسياسة حفظ البيانات والإشعار بتغير التكلفة. هذا العرض لا يفعّل الدفع أو التسجيل في البرنامج.', 'Final pricing, upgrades and plan changes, pauses and resumption, usage allowances, funding support and maintenance after entitlement, taxes, data retention and cost-change notices. This preview does not activate payment or program enrollment.')}</p></div>
        </div>
      </details>
      <dialog ref={dialogRef} className={styles.subscriptionDialog} aria-labelledby="subscription-preview-title">
        <span className={styles.tag}>{pick('معاينة الاشتراك', 'Subscription preview')}</span>
        <h3 id="subscription-preview-title">{pick('باقة ', 'Plan: ')}{plans[selected].name[lang]}</h3>
        <p className={styles.dialogPrice}><b dir="ltr">{total(plans[selected].price)}</b> {symbol} {period}</p>
        <p>{plans[selected].description[lang]}</p>
        <p>{pick('هذا عرض تجريبي فقط. لم يُرسل طلب، ولم يُنشأ اشتراك أو يُخصم أي مبلغ. تأكيد الاشتراك والدفع سيُتاحان بعد اعتماد الأسعار والسياسة.', 'This is a preview only. No request has been sent, no subscription created and no payment taken. Confirmation and payment will become available after pricing and policy approval.')}</p>
        <form method="dialog"><button className={`plan-cta is-primary ${styles.subscribe}`}>{pick('العودة إلى الباقات', 'Back to plans')}</button></form>
      </dialog>
    </div>
  );
}
