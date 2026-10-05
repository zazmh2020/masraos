'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import styles from './plan-advisor-preview.module.css';
import Icon from '@/components/Icon';
import type { ReactNode } from 'react';

type Plan = { name: string[]; description: string[]; price: number };

export default function PreviewPlanAdvisor({ plans, price, period, symbol }: {
  plans: Plan[]; price: (amount: number) => string; period: string; symbol: ReactNode;
}) {
  const { locale } = useLocale();
  const en = locale === 'en';
  const t = (ar: string, english: string) => en ? english : ar;
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null]);
  useEffect(() => { if (dialog.current?.open) heading.current?.focus(); }, [step]);

  const questions = [
    { title: t('كم طالبًا يتابع مركزك؟', 'How many students do you support?'), sub: t('نحسب الطلاب النشطين فقط، دون الملفات المؤرشفة.', 'Count active students only, not archived records.'), options: [
      [t('حتى 100 طالب', 'Up to 100 students'), t('حلقات أو مركز صغير', 'Small center or Quran circles')],
      [t('من 101 إلى 300 طالب', '101–300 students'), t('مركز في مرحلة النمو', 'A growing center')],
      [t('من 301 إلى 750 طالبًا', '301–750 students'), t('مركز ذو سعة أكبر', 'A larger center')],
      [t('أكثر من 750 طالبًا', 'Over 750 students'), t('احتياج يتطلب دراسة خاصة', 'Needs a tailored review')],
    ] },
    { title: t('ما الأولوية لفريقك؟', 'What matters most to your team?'), sub: t('اختر مستوى الخدمات الذي تحتاجه، وليس ما قد تحتاجه لاحقًا.', 'Choose the services you need today.'), options: [
      [t('تنظيم العمل اليومي', 'Everyday organization'), t('الطلاب والحلقات والحضور والحفظ، دون مساعد ذكي.', 'Students, circles, attendance and memorization, without AI.')],
      [t('مساعدة المعلم والموظف', 'Support teachers and staff'), t('مساعد ذكي، تحفيز وشهادات، وتقارير تقدم تفصيلية.', 'AI assistance, recognition, certificates and detailed progress reports.')],
      [t('تمكين الإدارة والمتابعة', 'Management insights'), t('تحليل الأداء واقتراح إجراءات ومتابعة الحالات.', 'Performance insights, suggested actions and case follow-up.')],
    ] },
    { title: t('كيف يتوزّع عملكم؟', 'How is your organization structured?'), sub: t('يساعدنا ذلك على التأكد أن الباقة تغطي نطاق المركز.', 'This helps us check that a plan covers your scope.'), options: [
      [t('مركز واحد', 'One center'), t('إدارة واحدة، ولو تعددت الحلقات.', 'One center, with any number of circles within plan limits.')],
      [t('عدة مراكز أو فروع', 'Multiple centers or branches'), t('نحتاج مراجعة النطاق قبل ترشيح باقة.', 'Scope needs review before recommending a plan.')],
    ] },
  ];
  const custom = answers[0] === 3 || answers[2] === 1;
  const recommended = Math.max(answers[0] ?? 0, answers[1] ?? 0);
  const plan = custom ? null : plans[recommended];
  const current = questions[Math.min(step, 2)];
  function choose(index: number) {
    setAnswers(prev => prev.map((value, i) => i === step ? index : value));
  }
  function open() {
    dialog.current?.showModal();
    heading.current?.focus();
  }
  function viewPlan() {
    dialog.current?.close();
    const card = document.getElementById(`preview-plan-${recommended}`);
    card?.focus({ preventScroll: true });
    card?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  }
  return (
    <>
      <div className={styles.invitation}>
        <span className={styles.emblem} aria-hidden="true"><Icon name="assistant" size={24} /></span>
        <div className={styles.invitationText}>
          <span className={styles.eyebrow}>{t('اختيار يناسب مركزك', 'A plan that fits')}</span>
          <h3>{t('لنساعدك في اختيار الباقة', 'Find your right plan')}</h3>
          <p>{t('ثلاث خطوات قصيرة، وتوصية واضحة بناءً على احتياجاتك.', 'Three short steps. A clear recommendation based on your needs.')}</p>
        </div>
        <button type="button" className={styles.launch} onClick={open}>{t('اكتشف باقتك', 'Find my plan')} <Icon name={en ? 'forward' : 'back'} size={16} /></button>
      </div>
      <dialog ref={dialog} className={styles.dialog} aria-labelledby="advisor-step-title" dir={en ? 'ltr' : 'rtl'}>
        <div className={styles.topbar}><span>{t('مساعد اختيار الباقة', 'Plan finder')}</span><button type="button" className={styles.close} aria-label={t('إغلاق المساعد', 'Close plan finder')} onClick={() => dialog.current?.close()}><Icon name="close" size={20} /></button></div>
        <div className={styles.body}>
          <div className={styles.progress} aria-label={t(`الخطوة ${Math.min(step + 1, 3)} من 3${step === 3 ? ' — النتيجة' : ''}`, `Step ${Math.min(step + 1, 3)} of 3${step === 3 ? ' — result' : ''}`)}>
            {questions.map((_, i) => <span key={i} className={i <= step ? styles.filled : ''} />)}
          </div>
          <span className={styles.stepLabel}>{step < 3 ? t(`الخطوة ${step + 1} من 3`, `Step ${step + 1} of 3`) : t('توصيتنا لمركزك', 'Your recommendation')}</span>
          <h2 id="advisor-step-title" ref={heading} tabIndex={-1}>{step < 3 ? current.title : custom ? t('احتياجك يستحق عرضًا مخصصًا', 'Your needs call for a tailored review') : t(`باقة ${plan!.name[0]} هي الأنسب لك`, `${plan!.name[1]} is your best fit`)}</h2>
          {step < 3 ? <>
            <p className={styles.subtitle}>{current.sub}</p>
            <div className={`${styles.options} ${step === 0 ? styles.twoColumns : ''}`} role="group" aria-label={current.title}>
              {current.options.map(([label, description], index) => <button type="button" key={label} className={`${styles.option} ${answers[step] === index ? styles.selected : ''}`} aria-pressed={answers[step] === index} onClick={() => choose(index)}>
                <span className={styles.optionMark} aria-hidden="true">{answers[step] === index && <Icon name="check" size={16} />}</span><span><strong>{label}</strong><small>{description}</small></span>
              </button>)}
            </div>
          </> : <>
            <p className={styles.subtitle}>{custom ? t('الباقات الحالية تغطي مركزًا واحدًا وحتى 750 طالبًا. لا نرشّح باقة أقل من احتياجك؛ نحتاج تحديد نطاق العمل أولًا.', 'Current plans cover one center and up to 750 students. Your scope needs review before we can recommend a plan.') : t('أقل باقة تجمع الخدمات التي طلبتها والسعة المناسبة لمركزك.', 'The lowest plan covering both your requested services and student capacity.')}</p>
            <div className={styles.result}>
              {plan && <div className={styles.resultPrice}><b dir="ltr">{price(plan.price)}</b><span>{symbol} {period}</span></div>}
              <h3>{t('بناءً على اختياراتك', 'Based on your answers')}</h3>
              <ul>{questions.map((q, i) => <li key={q.title}>{q.options[answers[i] ?? 0][0]}</li>)}</ul>
              {plan && (answers[0] ?? 0) > (answers[1] ?? 0) && <p>{t('ترشيح هذه الباقة سببه سعة الطلاب، حتى إن لم تحتج جميع خدماتها الإضافية.', 'This tier is needed for student capacity even if you do not need every extra feature.')}</p>}
            </div>
            <p className={styles.disclaimer}>{t('ترشيح إرشادي للباقات التجريبية، وليس تأكيد اشتراك أو دفع.', 'Guidance for the draft plans, not a subscription or payment confirmation.')}</p>
          </>}
          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={() => step === 0 ? dialog.current?.close() : setStep(step - 1)}>{step === 0 ? t('ليس الآن', 'Not now') : t('السابق', 'Back')}</button>
            {step < 3 ? <button type="button" className={styles.primary} disabled={answers[step] === null} onClick={() => setStep(step + 1)}>{step === 2 ? t('اعرض توصيتك', 'Show recommendation') : t('التالي', 'Continue')}</button> : plan ? <button type="button" className={styles.primary} onClick={viewPlan}>{t('استعرض الباقة', 'View plan')}</button> : <button type="button" className={styles.primary} onClick={() => setStep(0)}>{t('راجع اختياراتك', 'Review answers')}</button>}
          </div>
          <p className={styles.privacy}>{t('دون تسجيل • إجاباتك تبقى داخل هذه الصفحة', 'No sign-up • Answers stay on this page')}</p>
        </div>
      </dialog>
    </>
  );
}
