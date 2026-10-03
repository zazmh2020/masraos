'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import type { Locale } from '@/lib/i18n/config';
import Icon from '@/components/Icon';

interface Msg { role: 'user' | 'ai'; text: string }

/* مساعد مسرى مختصّ بالمنصّة فقط: يجيب عمّا يخصّها، ويرفض بلطف ما خرج عنها. */

const ON_TOPIC_AR = /مسرى|مداد|midad|المنصّ|المنصة|النظام|نظام|أنظمة|وحدة|ميزة|مميز|باقة|باقات|سعر|اشترا|تكلفة|مجان|مؤسس|جمعي|منظم|مركز|قرآن|حلق|طلاب|حفظ|تعليم|مستفيد|متطوع|موظف|موارد|مشروع|برنامج|حمل|تبرع|مالية|تمويل|تقرير|تحليل|وثيق|مستند|هوية|أمان|صلاحي|تكامل|دعم|حساب|دخول|اشتراك|لوحة|إدارة|تسجيل|بدء|ابدأ|شهادة|مسابقة/;
const ON_TOPIC_EN = /masra|midad|platform|system|module|feature|plan|pricing|price|subscri|free|organi|associati|center|centre|quran|circle|student|memoriz|educat|beneficiar|volunteer|employee|staff|project|program|campaign|donat|financ|report|analytic|document|identit|security|permission|integrat|account|login|sign|dashboard|manage|start|begin|certificate|competition/i;

function replyAr(q: string): string {
  if (/سعر|باقة|باقات|اشترا|تكلفة|مجان/.test(q))
    return 'انطلاقة ونمو وتمكين باقات مقترحة للمراجعة، وليست متاحة للشراء. انطلاقة دون مساعد ذكي؛ نمو وتمكين تتضمنان خدمات ذكاء اصطناعي مقترحة تحتاج التحقق من الجاهزية وحدود الاستخدام. الاستحقاق بعد 10 و8 و5 سنوات مدفوعة تصور غير معتمد، وتكلفة التشغيل اللاحقة لم تحدد.';
  if (/تكامل|ربط|api|واتس|بريد/i.test(q))
    return 'التكاملات المعلنة مع البريد والدفع وWhatsApp وGoogle وMicrosoft على خارطة الطريق. لا نعرضها هنا كخدمات جاهزة.';
  if (/أبدأ|ابدأ|بدء|بداية|تسجيل|حساب|دخول|تواصل|طلب/.test(q))
    return 'استكشف تجربة المركز والباقات المقترحة. الحسابات تنشئها إدارة المنصة، وليست هناك خدمة تسجيل ذاتي أو استقبال طلبات مفعلة هنا. موظف الذكاء الاصطناعي للرد والطلبات مخطط لاحقًا؛ راجع صفحة التواصل لحالة الخدمة.';
  if (/ذكاء|مساعد|ذكي|ai/i.test(q))
    return 'أنا دليل تعريفي بإجابات جاهزة، ولا أتصل ببيانات مركزك أو بنموذج ذكاء اصطناعي. مساعد المؤسسة منفصل ويتطلب التهيئة والتحقق من الجاهزية. المحادثة المعروضة في الصفحة محاكاة، وتحتاج الإجابات الفعلية إلى مراجعة بشرية.';
  if (/أمان|صلاحي|خصوصي|حماية|عزل/.test(q))
    return 'يستخدم النظام صلاحيات للأدوار وسجلات مرتبطة بالمؤسسة. هذه ضوابط وليست ضمانًا مطلقًا للأمان. سياسات الاستضافة والنسخ الاحتياطي وحفظ البيانات تحتاج اعتمادًا قبل البيع.';
  if (/جمعي|خيري|إنساني|تبرع|حمل|تمويل/.test(q))
    return 'التركيز الحالي على مراكز القرآن. القطاعات الخيرية والإنسانية والتعليمية الأخرى مخططة لاحقًا، وليست متاحة للاشتراك الآن.';
  if (ON_TOPIC_AR.test(q))
    return 'يركز مَسرى على تنظيم مراكز القرآن: بيانات الطلاب والحلقات والحضور وسجل الحفظ والمراجعة. يمكنك استكشاف الواجهات التوضيحية ورحلة الطالب والباقات المقترحة في هذه الصفحة.';
  return 'أقدّم إجابات جاهزة عن مَسرى فقط: تجربة المركز والباقات وحالة الخدمات وكيفية البدء. لا أستطيع تنفيذ إجراءات أو استقبال طلب اشتراك.';
}

function replyEn(q: string): string {
  if (/plan|pricing|price|subscri|free|cost/i.test(q))
    return 'Launch, Growth and Empower are proposed plans, not available for purchase. Launch has no AI; Growth and Empower propose AI services subject to readiness and usage limits. Entitlement after 10, 8 and 5 paid years is an unapproved concept; subsequent operating costs are not defined.';
  if (/integrat|connect|api|whatsapp|email/i.test(q))
    return 'The listed email, payment, WhatsApp, Google and Microsoft integrations are on the roadmap, not presented as ready services.';
  if (/start|begin|sign|account|login|contact|request/i.test(q))
    return 'Explore the center experience and proposed plans. Platform administration creates accounts; self-registration and requests are not enabled here. An AI representative for replies and requests is planned. Check the contact page for availability.';
  if (/assistant|intelligence|\bai\b/i.test(q))
    return 'I am a guide with prepared replies, not an AI model, and cannot access center data. The organization assistant is separate and requires configuration and readiness checks. The page conversation is simulated; real answers need human review.';
  if (/secur|permission|privacy|isolat|protect/i.test(q))
    return 'The system uses role-based permissions and organization-scoped records. These controls are not an absolute security guarantee. Hosting, backup and retention policies need approval before sales.';
  if (/charit|humanitarian|donat|campaign/i.test(q))
    return 'The current focus is Quran centers. Charity, humanitarian and other education sectors are planned, not currently available for subscription.';
  if (ON_TOPIC_EN.test(q))
    return 'Masra focuses on Quran centers: student records, circles, attendance and memorization logs. Explore the illustrative interfaces, student journey and proposed plans on this page.';
  return 'I provide prepared replies about Masra: the center experience, plans, service availability and getting started. I cannot perform actions or accept subscriptions.';
}

export function getLandingReply(locale: Locale, q: string): string {
  const t = q.trim();
  return locale === 'en' ? replyEn(t) : replyAr(t);
}

export default function MasraAssistant() {
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
    const answer = getLandingReply(locale, val);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { role: 'ai', text: answer }]);
    }, 900);
  }

  return (
    <div className="mdl-asst">
      {open && (
        <div className="mdl-asst-panel" role="dialog" aria-label={t('asst.title')}>
          <div className="mdl-asst-head">
            <span className="mdl-asst-ava">
              <Icon name="assistant" size={20} />
            </span>
            <div className="mdl-asst-head-tx"><b>{t('asst.title')}</b><span>{t('asst.subtitle')}</span></div>
            <button className="mdl-asst-x" onClick={() => setOpen(false)} aria-label={locale === 'en' ? 'Close' : 'إغلاق'}>
              <Icon name="close" size={16} />
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
              <Icon name="send" size={20} />
            </button>
          </form>
        </div>
      )}

      <button className={`mdl-asst-fab ${open ? 'is-open' : ''}`} onClick={() => setOpen((v) => !v)} aria-label={t('asst.title')} aria-expanded={open}>
        <Icon name={open ? 'close' : 'assistant'} size={24} />
      </button>
    </div>
  );
}
