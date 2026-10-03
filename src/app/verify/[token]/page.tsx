import { prisma } from '@/lib/prisma';
import { roleLabel } from '@/lib/permissions';
import { getT } from '@/lib/i18n/server';
import { LogoMark } from '@/components/Logo';
import Icon from '@/components/Icon';
import '@/styles/cards.css';

export const dynamic = 'force-dynamic';

/** صفحة تحقّق عامة — تُفتح عند مسح رمز QR في البطاقة الرقمية. */
export default async function VerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { t } = await getT();

  const member = /^[a-f0-9]{32}$/.test(token)
    ? await prisma.user.findFirst({
        where: { cardToken: token },
        select: {
          name: true, role: true, jobTitle: true, isActive: true,
          organization: { select: { name: true, isActive: true } },
        },
      })
    : null;

  const valid = !!member && member.isActive && !!member.organization?.isActive;

  return (
    <div className="vf-page">
      <div className={`vf-card ${valid ? 'vf-ok' : 'vf-bad'}`}>
        <div className="vf-logo"><LogoMark size={30} /></div>
        {valid && member ? (
          <>
            <div className="vf-check" aria-hidden="true"><Icon name="check" size={32} /></div>
            <h1 className="vf-title">{t('verify.valid')}</h1>
            <div className="vf-details">
              <div className="vf-row"><span>{t('verify.name')}</span><strong>{member.name}</strong></div>
              <div className="vf-row"><span>{t('verify.org')}</span><strong>{member.organization?.name}</strong></div>
              <div className="vf-row"><span>{t('verify.role')}</span><strong>{member.jobTitle || roleLabel(member.role)}</strong></div>
            </div>
          </>
        ) : (
          <>
            <div className="vf-cross" aria-hidden="true"><Icon name="close" size={32} /></div>
            <h1 className="vf-title">{t('verify.invalid')}</h1>
            <p className="vf-hint">{t('verify.invalidHint')}</p>
          </>
        )}
        <div className="vf-foot">{t('brand')} · {t('verify.foot')}</div>
      </div>
    </div>
  );
}
