import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Reveal from '@/components/Reveal';
import '@/styles/landing.css';

const values = [
  { title: 'الوضوح', text: 'واجهات مفهومة ونصوص واضحة، بلا تعقيد ولا مصطلحات فارغة.' },
  { title: 'الاحترام', text: 'احترام وقت المستخدم، وخصوصية بياناته، وحدود صلاحياته.' },
  { title: 'الاستمرارية', text: 'نبني ما يبقى ويتراكم، لا ما يُهمَل بعد أشهر.' },
  { title: 'الجودة', text: 'كل وحدة تُختبر وتُصقل قبل أن تصل للمؤسسات.' },
];

export default function AboutMasraPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-header">
          <div className="page-header-inner">
            <Reveal>
              <span className="eyebrow">عن مسرى</span>
              <h1>من نحن</h1>
              <p>
                مسرى فريق يؤمن أن المؤسسات لا تحتاج مزيدًا من الأنظمة، بل تحتاج
                منظومة واحدة تجمع ما تفرّق وتُنظّم ما تشتّت.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="section">
          <div className="section-heading">
            <Reveal>
              <span className="eyebrow">رؤيتنا</span>
              <h2>بنية رقمية موثوقة للتحول المؤسسي</h2>
              <p>
                أن تصبح مسرى المنصة التي تعتمد عليها المؤسسات لبناء بيئة عمل
                أكثر تنظيمًا وأمانًا وكفاءة، والانتقال من الإدارة التقليدية إلى
                الإدارة الرقمية الذكية.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="section section-dark">
          <div className="section-heading">
            <Reveal>
              <span className="eyebrow">رسالتنا</span>
              <h2>تمكين المؤسسات من إدارة أعمالها بذكاء</h2>
              <p>
                من خلال منظومة رقمية موحّدة، آمنة، مرنة، وقابلة للتوسع —
                تناسب كل حجم وكل نوع من المؤسسات.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="section">
          <div className="section-heading">
            <Reveal>
              <span className="eyebrow">قيمنا</span>
              <h2>ما نؤمن به</h2>
            </Reveal>
          </div>

          <div className="card-grid">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.05}>
                <article className="card">
                  <div className="card-icon">
                    <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="14" cy="14" r="10" />
                      <circle cx="14" cy="14" r="4" fill="currentColor" />
                    </svg>
                  </div>
                  <h3>{v.title}</h3>
                  <p>{v.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="cta-band">
          <Reveal>
            <h2>هل تشاركنا الرؤية؟</h2>
            <p>تواصل معنا لنبدأ رحلة مؤسستك الرقمية معًا.</p>
            <Link className="btn btn-light" href="/contact">تواصل معنا</Link>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
