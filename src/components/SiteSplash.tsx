import LogoMotion from '@/components/LogoMotion';
import SplashDismiss from '@/components/SplashDismiss';
import { BRAND } from '@/lib/brand';
import { getLocale } from '@/lib/i18n/server';
import '@/styles/site-splash.css';

const SPLASH_KEY = 'masra_splash_seen';

// يعمل أثناء تحليل الصفحة قبل رسم الشاشة: إن ظهرت في هذه الجلسة تُخفى فورًا بلا وميض.
const seenScript = `try{if(sessionStorage.getItem('${SPLASH_KEY}')==='1')document.documentElement.classList.add('splash-seen')}catch(e){}`;

/**
 * شاشة تحميل أول فتح للموقع العام: حركة الشعار الرسمي على خلفية داكنة، مرة واحدة في
 * جلسة المتصفح. الشعار الأفقي على الشاشات العريضة (اتجاهه حسب اللغة) والعمودي على الجوال.
 * طبقة فوق المحتوى فلا تحجبه عن محركات البحث.
 */
export default async function SiteSplash() {
  const locale = await getLocale();
  const label = `${BRAND.ar.corporate} — ${BRAND.en.corporate}`;
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: seenScript }} />
      <div className="site-splash" id="site-splash" aria-hidden="true">
        <LogoMotion layout={locale === 'ar' ? 'rtl' : 'ltr'} width="min(520px, 80vw)" label={label} className="site-splash-wide" />
        <LogoMotion layout="stacked" width="min(300px, 78vw)" label={label} className="site-splash-narrow" />
      </div>
      <SplashDismiss storageKey={SPLASH_KEY} />
    </>
  );
}
