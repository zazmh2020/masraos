'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { useCurrency } from '@/components/CurrencyProvider';
import { convertRounded, currencySymbol, formatAmount } from '@/lib/currency';
import {
  recommend,
  type AdvisorAnswers,
  type BranchAnswer,
  type NeedKey,
  type StudentBucket,
  type WebsiteAnswer,
} from '@/lib/plan-advisor';

/* ============================================================
   مساعد اختيار الباقة — استشارة مجانية (Wizard عام على صفحة الأسعار).
   بلا تسجيل ولا بيانات قبل النتيجة. حفظ التقدّم في sessionStorage.
   ============================================================ */

const STORAGE_KEY = 'masra_plan_advisor_v1';
const TOTAL_Q = 4;

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0-3 أسئلة، 4 نتيجة، 5 استشارة، 6 تم الإرسال

const emptyAnswers = (): AdvisorAnswers => ({ needs: [] });

/** يقرأ التقدّم المحفوظ (آمن على الخادم — يعيد الافتراضي عند غياب window). */
function loadSaved(): { step: Step; answers: AdvisorAnswers } {
  if (typeof window === 'undefined') return { step: 0, answers: emptyAnswers() };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as { step?: Step; answers?: AdvisorAnswers };
      const answers: AdvisorAnswers = saved.answers
        ? { ...saved.answers, needs: Array.isArray(saved.answers.needs) ? saved.answers.needs : [] }
        : emptyAnswers();
      const step = typeof saved.step === 'number' && saved.step >= 0 && saved.step <= 4 ? (saved.step as Step) : 0;
      return { step, answers };
    }
  } catch { /* لا شيء */ }
  return { step: 0, answers: emptyAnswers() };
}

/** إطلاق حدث تحليلات إن وُجد نظام قائم فقط (لا نضيف نظامًا جديدًا). */
function track(event: string, data?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  try {
    const w = window as unknown as {
      dataLayer?: unknown[];
      plausible?: (e: string, o?: { props?: Record<string, unknown> }) => void;
    };
    w.dataLayer?.push({ event, ...data });
    w.plausible?.(event, data ? { props: data } : undefined);
  } catch { /* التحليلات أفضل جهد */ }
}

export default function PlanAdvisor() {
  const { t, locale } = useLocale();
  const { currency } = useCurrency();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>(() => loadSaved().step);
  const [answers, setAnswers] = useState<AdvisorAnswers>(() => loadSaved().answers);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstOptRef = useRef<HTMLButtonElement>(null);

  const cur = currencySymbol(currency, locale);
  const money = (sar: number) => formatAmount(convertRounded(sar, currency), locale);

  // بوابة (portal) للعرض خارج أي عنصر مُحوَّل (transform) يحصر position:fixed.
  // نمط SSR القياسي: التركيب مرة واحدة بعد التحميل (لا رندرات متتالية).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  // حفظ التقدّم (حتى النتيجة فقط)
  useEffect(() => {
    try {
      if (step <= 4) sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ step, answers }));
    } catch { /* لا شيء */ }
  }, [step, answers]);

  const close = useCallback(() => { setOpen(false); }, []);

  const start = useCallback(() => {
    setOpen(true);
    track('plan_advisor_opened');
  }, []);

  // Esc للإغلاق + تركيز أول خيار عند تغيّر الخطوة
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    const id = window.setTimeout(() => firstOptRef.current?.focus(), 60);
    return () => { document.removeEventListener('keydown', onKey); window.clearTimeout(id); };
  }, [open, step, close]);

  // منع تمرير الخلفية أثناء فتح النافذة — نقفل html أيضًا لإزالة شريط التمرير
  // (وإلا يزيح شريطُ التمرير النافذةَ المثبّتة على المحور الأفقي في RTL)
  useEffect(() => {
    if (!open) return;
    const de = document.documentElement;
    const prevBody = document.body.style.overflow;
    const prevHtml = de.style.overflow;
    document.body.style.overflow = 'hidden';
    de.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevBody; de.style.overflow = prevHtml; };
  }, [open]);

  function answerQuestion() {
    // تُستدعى بعد ضبط الإجابة للانتقال للسؤال التالي
    track('plan_advisor_question_answered', { q: step + 1 });
    setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
  }

  function pickSingle<K extends keyof AdvisorAnswers>(key: K, value: AdvisorAnswers[K]) {
    setAnswers((a) => ({ ...a, [key]: value }));
    answerQuestion();
  }

  function toggleNeed(need: NeedKey) {
    setAnswers((a) => {
      const has = a.needs.includes(need);
      return { ...a, needs: has ? a.needs.filter((n) => n !== need) : [...a.needs, need] };
    });
  }

  function goResult() {
    track('plan_advisor_completed', { needs: answers.needs.length });
    setStep(4);
  }

  function restart() {
    setAnswers(emptyAnswers());
    setStep(0);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* لا شيء */ }
  }

  const rec = step >= 4 ? recommend(answers) : null;
  useEffect(() => {
    if (rec) track('plan_recommendation_shown', { plan: rec.plan.id });
    // نُطلقه مرة عند ظهور النتيجة
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step === 4]);

  const en = locale === 'en';
  const planName = rec ? (en ? rec.plan.en : rec.plan.name) : '';
  const progressPct = Math.round(((Math.min(step, TOTAL_Q)) / TOTAL_Q) * 100);

  return (
    <>
      {/* بطاقة الدعوة داخل قسم الأسعار */}
      <div className="adv-cta">
        <div className="adv-cta-tx">
          <span className="adv-cta-badge">{t('advisor.freeBadge')}</span>
          <h3>{t('advisor.cta.title')}</h3>
          <p>{t('advisor.cta.sub')}</p>
        </div>
        <button type="button" className="mdl-btn mdl-btn-primary adv-cta-btn" onClick={start}>
          {t('advisor.cta.button')}
        </button>
      </div>

      {mounted && createPortal(
      <div className="mdl adv-portal-root">
      <AnimatePresence>
        {open && (
          <motion.div
            className="adv-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={close}
          >
            <motion.div
              className="adv-modal"
              role="dialog"
              aria-modal="true"
              aria-label={t('advisor.title')}
              ref={dialogRef}
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* الرأس */}
              <div className="adv-head">
                <div className="adv-head-tx">
                  <span className="adv-head-eyebrow">{t('advisor.freeBadge')}</span>
                  <h2>{t('advisor.title')}</h2>
                </div>
                <button type="button" className="adv-x" onClick={close} aria-label={t('advisor.close')}>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15" /></svg>
                </button>
              </div>

              {/* شريط التقدّم (أسئلة فقط) */}
              {step < 4 && (
                <div className="adv-progress" aria-hidden="true">
                  <div className="adv-progress-bar"><span style={{ width: `${progressPct}%` }} /></div>
                  <span className="adv-progress-tx">{t('advisor.qOf', { n: step + 1, total: TOTAL_Q })}</span>
                </div>
              )}

              <div className="adv-body">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: en ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: en ? -20 : 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* ---------- السؤال 1: الحجم ---------- */}
                    {step === 0 && (
                      <Question sub={t('advisor.q1.sub')} title={t('advisor.q1.title')}>
                        {(['lt100', 'b100_300', 'b301_750', 'gt750'] as StudentBucket[]).map((v, i) => (
                          <OptionCard
                            key={v}
                            ref={i === 0 ? firstOptRef : undefined}
                            selected={answers.students === v}
                            label={t(`advisor.q1.${v}`)}
                            onSelect={() => pickSingle('students', v)}
                          />
                        ))}
                      </Question>
                    )}

                    {/* ---------- السؤال 2: الفروع ---------- */}
                    {step === 1 && (
                      <Question sub={t('advisor.q2.sub')} title={t('advisor.q2.title')}>
                        {(['one', 'multi', 'expand'] as BranchAnswer[]).map((v, i) => (
                          <OptionCard
                            key={v}
                            ref={i === 0 ? firstOptRef : undefined}
                            selected={answers.branches === v}
                            label={t(`advisor.q2.${v}`)}
                            onSelect={() => pickSingle('branches', v)}
                          />
                        ))}
                      </Question>
                    )}

                    {/* ---------- السؤال 3: الموقع ---------- */}
                    {step === 2 && (
                      <Question sub={t('advisor.q3.sub')} title={t('advisor.q3.title')}>
                        {(['have', 'basic', 'pro', 'unsure'] as WebsiteAnswer[]).map((v, i) => (
                          <OptionCard
                            key={v}
                            ref={i === 0 ? firstOptRef : undefined}
                            selected={answers.website === v}
                            label={t(`advisor.q3.${v}`)}
                            onSelect={() => pickSingle('website', v)}
                          />
                        ))}
                      </Question>
                    )}

                    {/* ---------- السؤال 4: الاحتياجات (متعدّد) ---------- */}
                    {step === 3 && (
                      <Question sub={t('advisor.q4.sub')} title={t('advisor.q4.title')}>
                        {([
                          'students_halaqat', 'full_center', 'reports', 'website_identity',
                          'communication', 'automation_ai', 'branches_expand',
                        ] as NeedKey[]).map((v, i) => (
                          <OptionCard
                            key={v}
                            ref={i === 0 ? firstOptRef : undefined}
                            multi
                            selected={answers.needs.includes(v)}
                            label={t(`advisor.q4.${v}`)}
                            onSelect={() => toggleNeed(v)}
                          />
                        ))}
                      </Question>
                    )}

                    {/* ---------- النتيجة ---------- */}
                    {step === 4 && rec && (
                      <div className="adv-result">
                        <span className="adv-result-eyebrow">🎯 {t('advisor.result.eyebrow')}</span>
                        <h3 className="adv-result-plan">{planName}</h3>
                        <p className="adv-result-lead">{t('advisor.result.lead')}</p>

                        <div className="adv-result-price">
                          {rec.plan.price === null ? (
                            <span className="adv-price-custom">{t('plan.custom')}</span>
                          ) : rec.plan.price === 0 ? (
                            <span className="adv-price-custom">{t('plan.free')}</span>
                          ) : (
                            <>
                              <span className="adv-price-amount">{money(rec.plan.price)}</span>
                              <span className="adv-price-period">{cur} {t('plan.perMonth')}</span>
                            </>
                          )}
                        </div>

                        <div className="adv-why">
                          <h4>{t('advisor.result.whyTitle')}</h4>
                          <ul>
                            {rec.reasons.map((code) => (
                              <li key={code}>
                                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10.5l4 4 8-9" /></svg>
                                {t(`advisor.reason.${code}`, { plan: planName })}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="adv-result-actions">
                          {rec.plan.id === 'ENTERPRISE' ? (
                            <a href="#contact" className="mdl-btn mdl-btn-primary" onClick={() => { track('recommended_plan_selected', { plan: rec.plan.id }); close(); }}>
                              {t('plan.cta.contact')}
                            </a>
                          ) : (
                            <Link href="/login" className="mdl-btn mdl-btn-primary" onClick={() => track('recommended_plan_selected', { plan: rec.plan.id })}>
                              {t('advisor.result.start')}
                            </Link>
                          )}
                          <a href="#pricing" className="mdl-btn mdl-btn-ghost" onClick={close}>
                            {t('advisor.result.compare')}
                          </a>
                        </div>

                        <div className="adv-unsure">
                          <span>{t('advisor.unsure.q')}</span>
                          <button type="button" className="adv-link" onClick={() => { track('consultation_opened'); setStep(5); }}>
                            {t('advisor.unsure.cta')}
                          </button>
                        </div>

                        <button type="button" className="adv-restart" onClick={restart}>{t('advisor.restart')}</button>
                      </div>
                    )}

                    {/* ---------- استشارة بشرية ---------- */}
                    {step === 5 && (
                      <ConsultationForm
                        recommendedPlan={rec?.plan.id ?? ''}
                        onDone={() => setStep(6)}
                        onBack={() => setStep(4)}
                      />
                    )}

                    {/* ---------- تم الإرسال ---------- */}
                    {step === 6 && (
                      <div className="adv-done">
                        <div className="adv-done-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                        </div>
                        <h3>{t('advisor.done.title')}</h3>
                        <p>{t('advisor.done.sub')}</p>
                        <button type="button" className="mdl-btn mdl-btn-primary" onClick={close}>{t('advisor.close')}</button>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* التذييل: تنقّل الأسئلة */}
              {step < 4 && (
                <div className="adv-foot">
                  <button
                    type="button"
                    className="adv-back"
                    onClick={() => setStep((s) => (s > 0 ? ((s - 1) as Step) : s))}
                    disabled={step === 0}
                  >
                    {t('advisor.back')}
                  </button>
                  {step === 3 && (
                    <button type="button" className="mdl-btn mdl-btn-primary adv-next" onClick={goResult} disabled={answers.needs.length === 0}>
                      {t('advisor.showResult')}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>,
      document.body,
      )}
    </>
  );
}

/* -------------------- مكوّنات مساعدة -------------------- */

function Question({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="adv-q">
      <p className="adv-q-sub">{sub}</p>
      <h3 className="adv-q-title">{title}</h3>
      <div className="adv-options">{children}</div>
    </div>
  );
}

const OptionCard = (function () {
  return function OptionCardInner(
    { label, selected, onSelect, multi, ref }:
    { label: string; selected: boolean; onSelect: () => void; multi?: boolean; ref?: React.Ref<HTMLButtonElement> },
  ) {
    return (
      <button
        type="button"
        ref={ref}
        className={`adv-opt ${selected ? 'is-selected' : ''} ${multi ? 'is-multi' : ''}`}
        aria-pressed={selected}
        onClick={onSelect}
      >
        <span className="adv-opt-mark" aria-hidden="true">
          {selected && <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10.5l4 4 8-9" /></svg>}
        </span>
        <span className="adv-opt-label">{label}</span>
      </button>
    );
  };
})();

function ConsultationForm({ recommendedPlan, onDone, onBack }: { recommendedPlan: string; onDone: () => void; onBack: () => void }) {
  const { t } = useLocale();
  const [form, setForm] = useState({ name: '', center: '', phone: '', email: '', note: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.center.trim() || !form.phone.trim()) { setError(t('advisor.consult.required')); return; }
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, recommendedPlan }),
      });
      if (res.ok) { track('consultation_requested', { plan: recommendedPlan }); onDone(); }
      else setError(t('advisor.consult.error'));
    } catch { setError(t('advisor.consult.error')); }
    finally { setBusy(false); }
  }

  return (
    <form className="adv-consult" onSubmit={submit}>
      <h3>{t('advisor.consult.title')}</h3>
      <p className="adv-consult-sub">{t('advisor.consult.sub')}</p>

      <label className="adv-field">
        <span>{t('advisor.consult.name')} <b>*</b></span>
        <input value={form.name} onChange={set('name')} required autoComplete="name" />
      </label>
      <label className="adv-field">
        <span>{t('advisor.consult.center')} <b>*</b></span>
        <input value={form.center} onChange={set('center')} required />
      </label>
      <label className="adv-field">
        <span>{t('advisor.consult.phone')} <b>*</b></span>
        <input value={form.phone} onChange={set('phone')} required inputMode="tel" dir="ltr" autoComplete="tel" />
      </label>
      <label className="adv-field">
        <span>{t('advisor.consult.email')}</span>
        <input value={form.email} onChange={set('email')} type="email" dir="ltr" autoComplete="email" />
      </label>
      <label className="adv-field">
        <span>{t('advisor.consult.note')}</span>
        <textarea value={form.note} onChange={set('note')} rows={3} />
      </label>

      {error && <div className="adv-alert">{error}</div>}

      <div className="adv-consult-actions">
        <button type="button" className="adv-back" onClick={onBack}>{t('advisor.back')}</button>
        <button type="submit" className="mdl-btn mdl-btn-primary" disabled={busy}>
          {busy ? t('advisor.consult.sending') : t('advisor.consult.send')}
        </button>
      </div>
    </form>
  );
}

