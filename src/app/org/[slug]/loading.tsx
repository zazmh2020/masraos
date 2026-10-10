import { getT } from '@/lib/i18n/server';
import '@/styles/dash2.css';

// حالة التحميل: هيكل بنفس بنية اللوحة (رأس + مقياس + قسمان) بدل شاشة فارغة
export default async function Loading() {
  const { t } = await getT();
  return (
    <div className="org-page" role="status" aria-live="polite">
      <span className="sr-only">{t('d2.loading')}</span>
      <div className="d2-skel" aria-hidden="true">
        <span className="h" /><span className="m" /><span className="p" /><span className="p" />
      </div>
    </div>
  );
}
