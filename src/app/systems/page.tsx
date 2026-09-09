import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Reveal from '@/components/Reveal';
import '@/styles/landing.css';

const systems = [
  { title: 'إدارة الأفراد', text: 'موظفون، متطوعون، معلمون، مستفيدون — بملفاتهم وأدوارهم وصلاحياتهم.' },
  { title: 'الهيكل المؤسسي', text: 'إدارات، أقسام، فروع — مع صلاحيات تُضبط مرة وتسري في كل مكان.' },
  { title: 'إدارة المشاريع', text: 'مراحل تنفيذ، مهام، مسؤوليات، متابعة — بلا جداول متفرقة.' },
  { title: 'إدارة البرامج', text: 'برامج تعليمية وإنسانية وتنموية، تُنشأ وتُدار من نفس المنظومة.' },
  { title: 'إدارة الحملات', text: 'حملات خيرية، موسمية، توعوية، مجتمعية — بتخطيط ومتابعة موحّدَين.' },
  { title: 'إدارة التبرعات', text: 'متبرعون، حملات، عمليات مالية، تقارير — جاهزة للربط ببوابات الدفع.' },
  { title: 'إدارة المستفيدين', text: 'بيانات الحالات والخدمات المقدَّمة، بمستويات وصول تحمي كل ملف.' },
  { title: 'إدارة الوثائق', text: 'سياسات، إجراءات، تقارير، نماذج، أدلة — كلها قابلة للبحث.' },
  { title: 'قاعدة المعرفة', text: 'الخبرة المؤسسية محفوظة ومنظّمة، لا تخرج مع الموظف عند مغادرته.' },
  { title: 'المساعد الذكي', text: 'يبحث ويلخّص ويشرح ويجهّز المسودات، ضمن حدود الصلاحيات.' },
  { title: 'التقارير والتحليلات', text: 'قراءة واضحة للأداء والإنجاز والنتائج، تُبنى من بياناتك لا تقديراتك.' },
  { title: 'الأدوار والصلاحيات', text: 'من يرى ماذا ومن يعدّل ماذا، تُضبط مرة واحدة وتُطبَّق في كل مكان.' },
];

export default function SystemsPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-header">
          <div className="page-header-inner">
            <Reveal>
              <span className="eyebrow">الأنظمة</span>
              <h1>ما الذي تديره مسرى</h1>
              <p>
                منظومة معيارية — لا نظام جاهز واحد. تختار الوحدات التي تناسب عملك،
                ويبقى الباقي مطفأً حتى تحتاجه.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="section">
          <div className="card-grid">
            {systems.map((s, i) => (
              <Reveal key={s.title} delay={(i % 4) * 0.05}>
                <article className="card">
                  <div className="card-icon">
                    <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="4" width="9" height="9" rx="1.5" />
                      <rect x="15" y="4" width="9" height="9" rx="1.5" />
                      <rect x="4" y="15" width="9" height="9" rx="1.5" />
                      <rect x="15" y="15" width="9" height="9" rx="1.5" />
                    </svg>
                  </div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="cta-band">
          <Reveal>
            <h2>أي الوحدات تحتاج مؤسستك؟</h2>
            <p>تواصل معنا لتشغيل مساحة تُفعَّل فيها الوحدات التي تخدم عملك.</p>
            <Link className="btn btn-light" href="/contact">تواصل معنا</Link>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
