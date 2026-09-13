import { getPlatformSettings } from '@/lib/platform-settings';
import PlatformContentForm from '@/components/PlatformContentForm';
import { getT } from '@/lib/i18n/server';
import '@/styles/org.css';

export const dynamic = 'force-dynamic';

export default async function AdminContentPage() {
  const { t } = await getT();
  const settings = await getPlatformSettings();

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>{t('apc.title')}</h1>
          <p>{t('apc.sub')}</p>
        </div>
      </div>

      <div className="section-block">
        <div style={{ maxWidth: 620, marginInline: 'auto' }}>
          <PlatformContentForm initial={settings} />
        </div>
      </div>
    </div>
  );
}
