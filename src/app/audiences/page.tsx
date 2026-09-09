import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Reveal from '@/components/Reveal';
import '@/styles/landing.css';

const audiences = [
  { title: 'الجمعيات الخيرية', text: 'موظفون ومتطوعون ومستفيدون ومشاريع وتبرعات وتقارير.' },
  { title: 'المنظمات الإنسانية', text: 'برامج ميدانية وفرق عمل ومتابعة حالات وتقارير ميدانية.' },
  { title: 'المؤسسات التنموية', text: 'مبادرات ومؤشرات ونتائج قابلة للقياس والمتابعة.' },
  { title: 'المراكز التعليمية', text: 'طلاب ومعلمون وحضور وتقييمات وبرامج تعليمية.' },
  { title: 'مراكز القرآن الكريم', text: 'حلقات وحفظ وتسميع ومسابقات وشهادات وأولياء أمور.' },
  { title: 'المؤسسات الوقفية', text: 'أصول ومشاريع وقفية وتبرعات وتقارير دورية.' },
  { title: 'المساجد', text: 'إدارة أنشطة المسجد وبرامجه ومتطوعيه والتبرعات.' },
  { title: 'المشاريع الخاصة', text: 'بيئة رقمية تُشكَّل بحسب طبيعة المشروع والوحدات التي يحتاجها.' },
];

export default function AudiencesPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-header">
          <div className="page-header-inner">
            <Reveal>
              <span className="eyebrow">الجهات</span>
              <h1>لمن مسرى</h1>
              <p>
                منظومة واحدة لمؤسسات مختلفة — ما يتغيّر هو الوحدات المفعّلة
                والمصطلحات، لا الأساس الذي تقوم عليه كل بيئة.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="section">
          <div className="card-grid">
            {audiences.map((a, i) => (
              <Reveal key={a.title} delay={(i % 4) * 0.05}>
                <article className="card">
                  <div className="card-icon">
                    <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 25V11l10-7 10 7v14" />
                      <path d="M11 25v-8h6v8" />
                    </svg>
                  </div>
                  <h3>{a.title}</h3>
                  <p>{a.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="cta-band">
          <Reveal>
            <h2>لا ترى مؤسستك في القائمة؟</h2>
            <p>مسرى قابلة للتشكيل — تواصل معنا لنبني ما يناسبك.</p>
            <Link className="btn btn-light" href="/contact">تواصل معنا</Link>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
