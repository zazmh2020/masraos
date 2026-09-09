import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Reveal from '@/components/Reveal';
import '@/styles/landing.css';

const features = [
  { title: 'منصة واحدة', text: 'كل شيء في مكان واحد بدل مجموعة أنظمة منفصلة تعمل بمفردها.' },
  { title: 'وحدات معيارية', text: 'تُفعّل ما تحتاجه فقط، ويبقى الباقي مطفأً حتى يأتي وقته.' },
  { title: 'عزل كامل للبيانات', text: 'كل مؤسسة تعمل في بيئة مستقلة تمامًا — بياناتها لها وحدها.' },
  { title: 'صلاحيات دقيقة', text: 'المستخدم لا يرى إلا ما يحقّ له الوصول إليه، بلا استثناءات.' },
  { title: 'ذكاء اصطناعي محترم للصلاحيات', text: 'المساعد يعمل ضمن حدود ما يحقّ للمستخدم رؤيته، لا خارجها.' },
  { title: 'واجهة عربية أصيلة', text: 'مصمّمة من اليمين لليسار منذ البداية، بخطوط ونصوص واضحة.' },
  { title: 'قابلية للتوسّع', text: 'تبدأ بمؤسسة واحدة، وتضيف عشرات المؤسسات دون إعادة بناء.' },
  { title: 'تحديثات مستمرة', text: 'المنصة تتطوّر باستمرار، والتحديثات تصل لكل المؤسسات تلقائيًا.' },
];

export default function FeaturesPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-header">
          <div className="page-header-inner">
            <Reveal>
              <span className="eyebrow">المميزات</span>
              <h1>لماذا مسرى</h1>
              <p>
                ثمانية أسباب تجعل مسرى الخيار المناسب للمؤسسات التي تريد
                الانتقال من الفوضى إلى النظام.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="section">
          <div className="card-grid">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={(i % 4) * 0.05}>
                <article className="card">
                  <div className="card-icon">
                    <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 3l3.5 7.5L25 12l-5.5 5.5L21 25l-7-3.5L7 25l1.5-7.5L3 12l7.5-1.5z" />
                    </svg>
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="cta-band">
          <Reveal>
            <h2>جاهز لتجربة مسرى؟</h2>
            <p>تواصل معنا لإنشاء مساحة مؤسستك.</p>
            <Link className="btn btn-light" href="/contact">تواصل معنا</Link>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
