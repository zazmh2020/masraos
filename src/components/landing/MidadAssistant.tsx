'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import type { Locale } from '@/lib/i18n/config';

interface Msg { role: 'user' | 'ai'; text: string }

/* مساعد مسرى مختصّ بالمنصّة فقط: يجيب عمّا يخصّها، ويرفض بلطف ما خرج عنها. */

const ON_TOPIC_AR = /مسرى|مداد|midad|المنصّ|المنصة|النظام|نظام|أنظمة|وحدة|ميزة|مميز|باقة|باقات|سعر|اشترا|تكلفة|مجان|مؤسس|جمعي|منظم|مركز|قرآن|حلق|طلاب|حفظ|تعليم|مستفيد|متطوع|موظف|موارد|مشروع|برنامج|حمل|تبرع|مالية|تمويل|تقرير|تحليل|وثيق|مستند|هوية|أمان|صلاحي|تكامل|دعم|حساب|دخول|اشتراك|لوحة|إدارة|تسجيل|بدء|ابدأ|شهادة|مسابقة/;
const ON_TOPIC_EN = /midad|platform|system|module|feature|plan|pricing|price|subscri|free|organi|associati|center|centre|quran|circle|student|memoriz|educat|beneficiar|volunteer|employee|staff|project|program|campaign|donat|financ|report|analytic|document|identit|security|permission|integrat|account|login|sign|dashboard|manage|start|begin|certificate|competition/i;

function replyAr(q: string): string {
  if (/سعر|باقة|باقات|اشترا|تكلفة|مجان/.test(q))
    return 'لدى مسرى أربع باقات: انطلاقة (مجانية)، نمو، تمكين، وأثر للمؤسسات الكبيرة. تصفّح قسم «الباقات» للتفاصيل، وابدأ مجانًا في أي وقت.';
  if (/نظام|أنظمة|وحدة|ميزة|مميزات/.test(q))
    return 'تشمل مسرى إدارة المؤسسة والموارد البشرية والمشاريع والمستفيدين والتعليم والمالية والتقارير وإدارة الوثائق، إضافةً إلى مساعد مسرى AI. فعّل ما تحتاجه فقط.';
  if (/تبرع|حمل|مالية|تمويل/.test(q))
    return 'نظام المالية والتبرعات في مسرى يدير الحملات والمتبرعين والعمليات المالية مع تقارير جاهزة للربط.';
  if (/تعليم|حلق|قرآن|طلاب|حفظ|شهادة|مسابقة/.test(q))
    return 'نظام التعليم يدير الحلقات والطلاب والحضور وتقدّم الحفظ والتقييم والمسابقات والشهادات — مناسب لمراكز القرآن والمراكز التعليمية.';
  if (/أمان|صلاحي|خصوصي|حماية|عزل/.test(q))
    return 'مسرى توفّر تحكّمًا دقيقًا بالصلاحيات والوصول وعزلًا كاملًا لبيانات كل مؤسسة عن غيرها.';
  if (/تكامل|ربط|api|واتس|بريد/i.test(q))
    return 'تتكامل مسرى مع البريد الإلكتروني وبوابات الدفع وWhatsApp وGoogle وMicrosoft عبر واجهات API.';
  if (/ابدأ|بداية|تسجيل|حساب|دخول/.test(q))
    return 'ابدأ بتسجيل الدخول ثم إعداد بيانات مؤسستك وهيكلها، وفعّل الأنظمة التي تحتاجها. تُنشأ حسابات الجهات عبر إدارة المنصّة.';
  if (ON_TOPIC_AR.test(q))
    return 'سؤال ممتاز عن مسرى! يمكنني مساعدتك في الأنظمة والباقات وكيفية البدء والأمان والتكاملات. حدّد ما تريد معرفته بالتفصيل، أو سجّل الدخول لتجربة المساعد الكامل داخل مؤسستك.';
  return 'أنا مساعد مسرى المتخصّص، وأجيب فقط عمّا يخصّ المنصّة: الأنظمة، الباقات، كيفية البدء، الأمان والتكاملات. اسألني عن أي شيء متعلّق بمسرى وسأكون سعيدًا بمساعدتك 🙏';
}

function replyEn(q: string): string {
  if (/plan|pricing|price|subscri|free|cost/i.test(q))
    return 'Midad has four plans: Launch (free), Growth, Empower, and Impact for large organizations. Check the “Pricing” section for details, and start free anytime.';
  if (/system|module|feature/i.test(q))
    return 'Midad covers organization management, HR, projects, beneficiaries, education, finance, reports and documents — plus the Midad AI assistant. Enable only what you need.';
  if (/donat|financ|campaign|fund/i.test(q))
    return 'Midad’s finance & donations system manages campaigns, donors and financial operations with reports ready to connect.';
  if (/educat|circle|quran|student|memoriz|certificate|competition/i.test(q))
    return 'The education system manages circles, students, attendance, memorization progress, assessment, competitions and certificates — ideal for Quran and educational centers.';
  if (/secur|permission|privacy|isolat|protect/i.test(q))
    return 'Midad provides precise control over permissions and access, with full data isolation for every organization.';
  if (/integrat|connect|api|whatsapp|email/i.test(q))
    return 'Midad integrates with email, payment gateways, WhatsApp, Google and Microsoft via APIs.';
  if (/start|begin|sign|account|login/i.test(q))
    return 'Start by signing in, then set up your organization’s data and structure and enable the systems you need. Organization accounts are created via platform administration.';
  if (ON_TOPIC_EN.test(q))
    return 'Great question about Midad! I can help with systems, pricing, getting started, security and integrations. Tell me what you’d like to know, or sign in to try the full assistant inside your organization.';
  return 'I’m Midad’s dedicated assistant and only answer questions about the platform: systems, pricing, getting started, security and integrations. Ask me anything about Midad and I’ll be glad to help 🙏';
}

function reply(locale: Locale, q: string): string {
  const t = q.trim();
  return locale === 'en' ? replyEn(t) : replyAr(t);
}

export default function MidadAssistant() {
  const { locale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>(() => [{ role: 'ai', text: t('asst.welcome') }]);
  const [q, setQ] = useState('');
  const [typing, setTyping] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const SUGGESTIONS = [t('asst.sug.1'), t('asst.sug.2'), t('asst.sug.3')];

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [msgs, typing, open]);

  function send(text: string) {
    const val = text.trim();
    if (!val || typing) return;
    setMsgs((m) => [...m, { role: 'user', text: val }]);
    setQ('');
    setTyping(true);
    const answer = reply(locale, val);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { role: 'ai', text: answer }]);
    }, 900);
  }

  return (
    <div className="mdl-asst">
      {open && (
        <div className="mdl-asst-panel" role="dialog" aria-label="مساعد مسرى الذكي">
          <div className="mdl-asst-head">
            <span className="mdl-asst-ava">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z" /></svg>
            </span>
            <div className="mdl-asst-head-tx"><b>{t('asst.title')}</b><span>{t('asst.subtitle')}</span></div>
            <button className="mdl-asst-x" onClick={() => setOpen(false)} aria-label={locale === 'en' ? 'Close' : 'إغلاق'}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15" /></svg>
            </button>
          </div>

          <div className="mdl-asst-body" ref={bodyRef}>
            {msgs.map((m, i) => (
              <div key={i} className={`mdl-asst-msg ${m.role}`}>{m.text}</div>
            ))}
            {typing && <div className="mdl-asst-msg ai"><span className="mdl-typing"><i /><i /><i /></span></div>}
            {msgs.length <= 1 && !typing && (
              <div className="mdl-asst-sugs">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="mdl-asst-sug" onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            )}
          </div>

          <form className="mdl-asst-input" onSubmit={(e) => { e.preventDefault(); send(q); }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('asst.placeholder')} aria-label={t('asst.placeholder')} />
            <button type="submit" aria-label={locale === 'en' ? 'Send' : 'إرسال'} disabled={!q.trim() || typing}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 4L3 11l6 2 2 6z" /></svg>
            </button>
          </form>
        </div>
      )}

      <button className={`mdl-asst-fab ${open ? 'is-open' : ''}`} onClick={() => setOpen((v) => !v)} aria-label="مساعد مسرى الذكي">
        {open ? (
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15" /></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z" /><path d="M19 15l.7 1.8L21.5 17.5l-1.8.7L19 20l-.7-1.8L16.5 17.5l1.8-.7z" /></svg>
        )}
      </button>
    </div>
  );
}
