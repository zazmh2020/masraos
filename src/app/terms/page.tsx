import Link from 'next/link';
import MasraHeader from '@/components/landing/MasraHeader';
import { getLocale } from '@/lib/i18n/server';
import '@/styles/masra.css';
import '@/styles/legal.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'الشروط والأحكام · مسرى' };

const UPDATED = '2026-09-05';

export default async function TermsPage() {
  const locale = await getLocale();
  const en = locale === 'en';

  return (
    <div className="mdl">
      <MasraHeader />
      <main className="legal">
        <span className="legal-eyebrow">{en ? 'Legal' : 'قانوني'}</span>
        <h1>{en ? 'Terms of Service' : 'الشروط والأحكام'}</h1>
        <p className="legal-updated">{en ? `Last updated: ${UPDATED}` : `آخر تحديث: ${UPDATED}`}</p>
        <div className="legal-note">
          {en
            ? 'This is a template agreement provided as a starting point. Have it reviewed by a qualified lawyer before you rely on it for a public launch.'
            : 'هذه اتفاقية نموذجية استرشادية. يُنصَح بمراجعتها من مختصّ قانوني قبل اعتمادها رسميًا عند الإطلاق العام.'}
        </div>

        {en ? (
          <>
            <p>These Terms govern your use of Masra (“the Platform”). By creating an account or using the Platform, you agree to them.</p>

            <h2>1. The service</h2>
            <p>Masra provides multi-tenant management software for nonprofit and educational organizations. Features may change or improve over time.</p>

            <h2>2. Accounts</h2>
            <p>You are responsible for the accuracy of your account information, for keeping your credentials secure, and for all activity under your account. Notify us of any unauthorized use.</p>

            <h2>3. Acceptable use</h2>
            <p>You agree not to misuse the Platform, attempt to breach its security or isolation between organizations, upload unlawful content, or use it to violate the rights of others.</p>

            <h2>4. Organization data</h2>
            <p>Content you enter (members, students, beneficiaries, documents, etc.) remains owned by your Organization. You grant us the limited rights needed to host and process it to provide the service.</p>

            <h2>5. Subscriptions &amp; payment</h2>
            <ul>
              <li>Paid plans are billed on a recurring basis through our payment processor (Stripe).</li>
              <li>Subscriptions renew automatically until canceled from the billing portal.</li>
              <li>Cancellation stops future renewals; unless required by law, payments already made are non-refundable.</li>
              <li>Prices and plan limits may change with prior notice.</li>
            </ul>

            <h2>6. Availability</h2>
            <p>We aim for high availability but do not guarantee uninterrupted service, and may perform maintenance.</p>

            <h2>7. Termination</h2>
            <p>You may stop using the Platform at any time. We may suspend or terminate access for breach of these Terms. On termination, you may request an export or deletion of your data.</p>

            <h2>8. Disclaimers &amp; liability</h2>
            <p>The Platform is provided “as is”. To the extent permitted by law, we are not liable for indirect or consequential damages, and our total liability is limited to the fees you paid in the preceding period.</p>

            <h2>9. Governing law</h2>
            <p>These Terms are governed by the laws of the Kingdom of Saudi Arabia, unless otherwise agreed in writing.</p>

            <h2>10. Changes</h2>
            <p>We may update these Terms; continued use after changes constitutes acceptance.</p>

            <h2>11. Contact</h2>
            <p>For questions about these Terms, contact Masra support.</p>
          </>
        ) : (
          <>
            <p>تحكم هذه الشروط استخدامك لمنصّة مسرى («المنصة»). بإنشائك حسابًا أو باستخدامك المنصة فإنك توافق عليها.</p>

            <h2>١. الخدمة</h2>
            <p>تقدّم مسرى برمجيات إدارة متعدّدة المؤسسات للجمعيات والمؤسسات التعليمية وغير الربحية. قد تتغيّر الميزات أو تتحسّن مع الوقت.</p>

            <h2>٢. الحسابات</h2>
            <p>أنت مسؤول عن صحّة بيانات حسابك، وعن الحفاظ على سرّية بيانات الدخول، وعن كل نشاط يتمّ عبر حسابك. أبلِغنا بأي استخدام غير مصرّح به.</p>

            <h2>٣. الاستخدام المقبول</h2>
            <p>تتعهّد بعدم إساءة استخدام المنصة، أو محاولة اختراق أمنها أو العزل بين المؤسسات، أو رفع محتوى غير نظامي، أو استخدامها لانتهاك حقوق الآخرين.</p>

            <h2>٤. بيانات المؤسسة</h2>
            <p>يبقى المحتوى الذي تُدخِله (الأعضاء، الطلاب، المستفيدون، المستندات…) مملوكًا لمؤسستك. وتمنحنا الحقوق المحدودة اللازمة لاستضافته ومعالجته لتقديم الخدمة.</p>

            <h2>٥. الاشتراكات والدفع</h2>
            <ul>
              <li>تُفوتَر الباقات المدفوعة بشكل دوري عبر مزوّد الدفع (Stripe).</li>
              <li>تتجدّد الاشتراكات تلقائيًا حتى يتمّ إلغاؤها من بوابة الفوترة.</li>
              <li>الإلغاء يوقف التجديدات المستقبلية؛ وما لم يقتضِ النظام غير ذلك، فالمبالغ المدفوعة غير قابلة للاسترداد.</li>
              <li>قد تتغيّر الأسعار وحدود الباقات بإشعار مسبق.</li>
            </ul>

            <h2>٦. التوفّر</h2>
            <p>نسعى لتوفّر عالٍ للخدمة لكننا لا نضمن استمرارها دون انقطاع، وقد نُجري أعمال صيانة.</p>

            <h2>٧. الإنهاء</h2>
            <p>يمكنك التوقف عن استخدام المنصة في أي وقت. ويمكننا تعليق أو إنهاء الوصول عند مخالفة هذه الشروط. عند الإنهاء يمكنك طلب تصدير بياناتك أو حذفها.</p>

            <h2>٨. إخلاء المسؤولية والحدود</h2>
            <p>تُقدَّم المنصة «كما هي». وبالقدر الذي يسمح به النظام، لا نتحمّل مسؤولية الأضرار غير المباشرة أو التبعية، وتقتصر مسؤوليتنا الإجمالية على الرسوم المدفوعة في الفترة السابقة.</p>

            <h2>٩. القانون الحاكم</h2>
            <p>تخضع هذه الشروط لأنظمة المملكة العربية السعودية، ما لم يُتّفق كتابةً على غير ذلك.</p>

            <h2>١٠. التغييرات</h2>
            <p>قد نحدّث هذه الشروط، واستمرارك في الاستخدام بعد التغيير يُعدّ موافقة.</p>

            <h2>١١. التواصل</h2>
            <p>لأي استفسار حول هذه الشروط، تواصل مع دعم مسرى.</p>
          </>
        )}

        <div className="legal-foot">
          <Link href="/privacy">{en ? '← Privacy Policy' : 'سياسة الخصوصية →'}</Link>
          <span>مسرى © 2026</span>
        </div>
      </main>
    </div>
  );
}
