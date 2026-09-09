import Link from 'next/link';
import MidadHeader from '@/components/landing/MidadHeader';
import { getLocale } from '@/lib/i18n/server';
import '@/styles/midad.css';
import '@/styles/legal.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'سياسة الخصوصية · مسرى' };

const UPDATED = '2026-09-05';

export default async function PrivacyPage() {
  const locale = await getLocale();
  const en = locale === 'en';

  return (
    <div className="mdl">
      <MidadHeader />
      <main className="legal">
        <span className="legal-eyebrow">{en ? 'Legal' : 'قانوني'}</span>
        <h1>{en ? 'Privacy Policy' : 'سياسة الخصوصية'}</h1>
        <p className="legal-updated">{en ? `Last updated: ${UPDATED}` : `آخر تحديث: ${UPDATED}`}</p>
        <div className="legal-note">
          {en
            ? 'This is a template policy provided as a starting point. Have it reviewed by a qualified lawyer before you rely on it for a public launch.'
            : 'هذه سياسة نموذجية استرشادية. يُنصَح بمراجعتها من مختصّ قانوني قبل اعتمادها رسميًا عند الإطلاق العام.'}
        </div>

        {en ? (
          <>
            <p>Masra (“the Platform”, “we”) provides digital management software to nonprofit and educational organizations (“Organizations”). This policy explains what data we handle and how.</p>

            <h2>1. Data we collect</h2>
            <ul>
              <li><b>Account data:</b> name, email, phone, job title, and password (stored hashed).</li>
              <li><b>Organization data:</b> content Organizations enter — members, students, teachers, halaqat, beneficiaries, donations, documents, and related records.</li>
              <li><b>Payment data:</b> handled by our payment processor (Stripe). We do not store card numbers.</li>
              <li><b>Usage data:</b> basic technical logs needed to operate and secure the service.</li>
            </ul>

            <h2>2. How we use data</h2>
            <p>To provide and maintain the service, authenticate users, process subscriptions, provide support, and improve the Platform. We do not sell personal data.</p>

            <h2>3. Data isolation &amp; ownership</h2>
            <p>Each Organization’s data is logically isolated and belongs to that Organization. We act as a processor of the data an Organization enters; the Organization is the controller of its members’ and beneficiaries’ data.</p>

            <h2>4. Minors</h2>
            <p>Organizations may record data about students who are minors (e.g., Quran-memorization students). Organizations are responsible for obtaining any consent required by law before entering such data, and should minimize it to what is necessary.</p>

            <h2>5. Sub-processors</h2>
            <p>We rely on trusted providers to run the service, including hosting/database (Neon), payments (Stripe), and — when enabled — email delivery and file storage. Each processes data only as needed to provide its function.</p>

            <h2>6. Security</h2>
            <p>Passwords are hashed, sessions are protected, and access is restricted by role. No system is perfectly secure, but we take reasonable measures to protect data.</p>

            <h2>7. Retention &amp; deletion</h2>
            <p>We retain Organization data while the account is active. On request or account closure, data can be deleted subject to legal retention needs.</p>

            <h2>8. Your rights</h2>
            <p>Subject to applicable law, you may request access to, correction of, or deletion of your personal data by contacting the Organization that holds it, or us.</p>

            <h2>9. Changes</h2>
            <p>We may update this policy; the “last updated” date reflects the latest version.</p>

            <h2>10. Contact</h2>
            <p>Questions about this policy: contact your Organization’s administrator or Masra support.</p>
          </>
        ) : (
          <>
            <p>تقدّم منصة مسرى («المنصة»، «نحن») برمجيات إدارة رقمية للجمعيات والمؤسسات التعليمية وغير الربحية («المؤسسات»). توضّح هذه السياسة البيانات التي نتعامل معها وكيفية ذلك.</p>

            <h2>١. البيانات التي نجمعها</h2>
            <ul>
              <li><b>بيانات الحساب:</b> الاسم، البريد، الهاتف، المسمّى الوظيفي، وكلمة المرور (مخزَّنة مشفّرة).</li>
              <li><b>بيانات المؤسسة:</b> المحتوى الذي تُدخِله المؤسسات — الأعضاء، الطلاب، المعلمون، الحلقات، المستفيدون، التبرعات، المستندات، والسجلّات المرتبطة.</li>
              <li><b>بيانات الدفع:</b> يعالجها مزوّد الدفع (Stripe). لا نخزّن أرقام البطاقات.</li>
              <li><b>بيانات الاستخدام:</b> سجلّات تقنية أساسية لازمة لتشغيل الخدمة وحمايتها.</li>
            </ul>

            <h2>٢. كيف نستخدم البيانات</h2>
            <p>لتقديم الخدمة وصيانتها، والتحقّق من هوية المستخدمين، ومعالجة الاشتراكات، وتقديم الدعم، وتحسين المنصة. لا نبيع البيانات الشخصية.</p>

            <h2>٣. عزل البيانات وملكيتها</h2>
            <p>بيانات كل مؤسسة معزولة منطقيًا وتعود ملكيتها للمؤسسة. نحن نعمل كمعالِج للبيانات التي تُدخِلها المؤسسة، والمؤسسة هي المتحكّم في بيانات أعضائها ومستفيديها.</p>

            <h2>٤. القُصَّر</h2>
            <p>قد تسجّل المؤسسات بيانات طلاب قُصَّر (مثل طلاب حلقات التحفيظ). المؤسسة مسؤولة عن الحصول على أي موافقات يقتضيها النظام قبل إدخال هذه البيانات، وينبغي الاقتصار على ما هو ضروري فقط.</p>

            <h2>٥. المعالِجون الفرعيون</h2>
            <p>نعتمد على مزوّدين موثوقين لتشغيل الخدمة، منهم الاستضافة/قاعدة البيانات (Neon)، والمدفوعات (Stripe)، وعند التفعيل: إرسال البريد وتخزين الملفات. يعالج كلٌّ منهم البيانات بالقدر اللازم لأداء وظيفته فقط.</p>

            <h2>٦. الأمان</h2>
            <p>كلمات المرور مشفّرة، والجلسات محميّة، والوصول مقيّد حسب الدور. لا يوجد نظام آمن تمامًا، لكننا نتّخذ تدابير معقولة لحماية البيانات.</p>

            <h2>٧. الاحتفاظ والحذف</h2>
            <p>نحتفظ ببيانات المؤسسة ما دام الحساب نشطًا. عند الطلب أو إغلاق الحساب، يمكن حذف البيانات مع مراعاة أي متطلّبات نظامية للاحتفاظ.</p>

            <h2>٨. حقوقك</h2>
            <p>وفقًا للأنظمة المعمول بها، يمكنك طلب الاطّلاع على بياناتك الشخصية أو تصحيحها أو حذفها بالتواصل مع المؤسسة التي تحتفظ بها، أو معنا.</p>

            <h2>٩. التغييرات</h2>
            <p>قد نحدّث هذه السياسة، ويعكس تاريخ «آخر تحديث» أحدث نسخة.</p>

            <h2>١٠. التواصل</h2>
            <p>لأي استفسار حول هذه السياسة، تواصل مع مدير مؤسستك أو دعم مسرى.</p>
          </>
        )}

        <div className="legal-foot">
          <Link href="/terms">{en ? 'Terms of Service →' : '← الشروط والأحكام'}</Link>
          <span>مسرى © 2026</span>
        </div>
      </main>
    </div>
  );
}
