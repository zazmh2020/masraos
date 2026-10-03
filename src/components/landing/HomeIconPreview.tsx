import type { Locale } from '@/lib/i18n/config';
import type { IconName } from '@/lib/icons';
import Icon from '@/components/Icon';
import styles from './home-icon-preview.module.css';

const icons: { name: IconName; ar: string; en: string }[] = [
  { name: 'dashboard', ar: 'الرئيسية', en: 'Home' },
  { name: 'users', ar: 'الفريق', en: 'Team' },
  { name: 'settings', ar: 'الإعدادات', en: 'Settings' },
  { name: 'reports', ar: 'التقارير', en: 'Reports' },
  { name: 'search', ar: 'البحث', en: 'Search' },
  { name: 'events', ar: 'التقويم', en: 'Calendar' },
];

export default function HomeIconPreview({ locale }: { locale: Locale }) {
  return (
    <section id="icon-preview" className={styles.section} aria-labelledby="icon-preview-title">
      <div className={styles.inner}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}>{locale === 'ar' ? 'معاينة بصرية' : 'Visual preview'}</span>
          <h2 id="icon-preview-title">{locale === 'ar' ? 'أيقونات واجهة مَسرى' : 'Masra interface icons'}</h2>
          <p>{locale === 'ar' ? 'هذه الأيقونات الست للمعاينة داخل تصميم الصفحة الرئيسية.' : 'Preview these six icons within the home page design.'}</p>
        </div>
        <div className={styles.grid}>
          {icons.map((item) => (
            <div className={styles.card} key={item.name}>
              <span className={styles.iconFrame}><Icon name={item.name} size={32} className={styles.icon} /></span>
              <span className={styles.label}>{locale === 'ar' ? item.ar : item.en}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
