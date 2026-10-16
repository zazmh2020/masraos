import LogoMotion from '@/components/LogoMotion';
import SplashDismiss from '@/components/SplashDismiss';
import '@/styles/site-splash.css';

const SPLASH_KEY = 'masra_splash_seen';

// يعمل أثناء تحليل الصفحة قبل رسم الشاشة: إن ظهرت في هذه الجلسة تُخفى فورًا بلا وميض.
const seenScript = `try{if(sessionStorage.getItem('${SPLASH_KEY}')==='1')document.documentElement.classList.add('splash-seen')}catch(e){}`;

/**
 * شاشة تحميل أول فتح للموقع العام: حركة الشعار على خلفية داكنة، مرة واحدة في
 * جلسة المتصفح (sessionStorage). لا تحجب المحتوى عن محركات البحث؛ هي طبقة فوقه.
 */
export default function SiteSplash() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: seenScript }} />
      <div className="site-splash" id="site-splash" aria-hidden="true">
        <LogoMotion size={180} />
      </div>
      <SplashDismiss storageKey={SPLASH_KEY} />
    </>
  );
}
