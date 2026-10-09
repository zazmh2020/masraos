import Link from 'next/link';
import V2Header from '@/components/v2/V2Header';
import V2Footer from '@/components/v2/V2Footer';
import Reveal from '@/components/Reveal';
import Icon from '@/components/Icon';
import '@/styles/landing.css';
import '@/styles/v2.css'; // الرأس والتذييل الموحّدان

const problems = [
  { title: 'تشتت المعلومات', text: 'ملفات ورقية، جداول، تطبيقات تواصل، وأنظمة منفصلة لكل مهمة.' },
  { title: 'تكرار العمل', text: 'نفس البيانات تُدخل مرات، ونفس الإجراء يُعاد شرحه لكل موظف جديد.' },
  { title: 'ضعف المتابعة', text: 'قرارات تُتخذ بدون بيانات، ومهام تُنسى، وتقارير تتأخر أسابيع.' },
  { title: 'فقدان المعرفة', text: 'الخبرة تخرج من الباب مع الموظف، ولا يتراكم شيء للمؤسسة.' },
];

const pillars = [
  { title: 'توحيد', text: 'جمع العمليات والمعلومات في بيئة واحدة، بدل أنظمة متفرقة.' },
  { title: 'تنظيم', text: 'تحويل الإجراءات المتفرقة إلى عمليات واضحة وقابلة للمتابعة.' },
  { title: 'تمكين', text: 'توفير الأدوات التي تساعد كل موظف على أداء عمله بكفاءة.' },
  { title: 'تطوير', text: 'استخدام البيانات والذكاء الاصطناعي لبناء مؤسسة أكثر قدرة.' },
];

export default function AboutPage() {
  return (
    <>
      <V2Header />
      <main id="main">
        <section className="page-header">
          <div className="page-header-inner">
            <Reveal>
              <span className="eyebrow">عن المنصة</span>
              <h1>ما هي مسرى؟</h1>
              <p>
                منظومة رقمية متكاملة للتحول المؤسسي، تساعد المؤسسات على إدارة
                عملياتها وبياناتها وأفرادها وبرامجها ومشاريعها من منصة واحدة.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="section">
          <div className="section-heading">
            <Reveal>
              <span className="eyebrow">لماذا مسرى</span>
              <h2>مشكلات تعرفها كل مؤسسة</h2>
              <p>
                معلومات متفرقة، عمل مكرّر، ومعرفة تضيع — هذه ليست تفاصيل صغيرة،
                بل ما يُبطئ المؤسسات ويستنزفها.
              </p>
            </Reveal>
          </div>

          <div className="card-grid">
            {problems.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.05}>
                <article className="card">
                  <div className="card-icon">
                    <Icon name="alert" size={24} />
                  </div>
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="section section-dark">
          <div className="section-heading">
            <Reveal>
              <span className="eyebrow">فلسفة مسرى</span>
              <h2>أربعة مفاهيم تحكم كل ما نبنيه</h2>
            </Reveal>
          </div>

          <div className="card-grid">
            {pillars.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.05}>
                <article className="card">
                  <div className="card-icon">
                    <Icon name="check" size={24} />
                  </div>
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="cta-band">
          <Reveal>
            <h2>مستعد للبدء؟</h2>
            <p>اكتشف الأنظمة والوحدات التي يمكن أن تخدم مؤسستك.</p>
            <Link className="btn btn-light" href="/systems">استكشف الأنظمة</Link>
          </Reveal>
        </section>
      </main>
      <V2Footer />
    </>
  );
}
