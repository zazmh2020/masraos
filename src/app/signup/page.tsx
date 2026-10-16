'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import Link from 'next/link';
import AuthShell from '@/components/auth/AuthShell';
import Icon from '@/components/Icon';
import { useT } from '@/lib/i18n/LocaleProvider';
import '@/styles/signup.css';

type Channel = 'EMAIL' | 'PHONE';
type Field = 'name' | 'orgName' | 'slug' | 'email' | 'phone' | 'password' | 'channel';

/** لاحقة النطاق الظاهرة بجانب رابط المركز — قيمة الخادم فارغة، والمتصفح يعطي المضيف الفعلي. */
const noopSubscribe = () => () => {};
const clientSuffix = () => process.env.NEXT_PUBLIC_APP_PATH_ROUTING === '1'
  ? `${window.location.host}/org/`
  : `.${window.location.hostname.replace(/^www\./, '')}`;
const serverSuffix = () => '';

export default function SignupPage() {
  const t = useT();
  const [step, setStep] = useState<'details' | 'verify'>('details');
  const [form, setForm] = useState({ name: '', orgName: '', slug: '', email: '', phone: '', password: '' });
  const [channel, setChannel] = useState<Channel>('EMAIL');
  const [showPw, setShowPw] = useState(false);
  const [fieldErr, setFieldErr] = useState<Partial<Record<Field, string>>>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [requestId, setRequestId] = useState('');
  const [masked, setMasked] = useState('');
  const [devCode, setDevCode] = useState('');
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);
  const suffix = useSyncExternalStore(noopSubscribe, clientSuffix, serverSuffix);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  useEffect(() => { if (step === 'verify') codeRef.current?.focus(); }, [step]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = k === 'slug' ? e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') : e.target.value;
    setForm((f) => ({ ...f, [k]: value }));
    if (fieldErr[k]) setFieldErr((fe) => ({ ...fe, [k]: undefined }));
  };

  async function post(url: string, body: unknown) {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  }

  async function start(e: FormEvent) {
    e.preventDefault();
    setError(''); setNotice(''); setFieldErr({});
    setBusy(true);
    try {
      const { res, data } = await post('/api/auth/signup/start', { ...form, channel });
      if (!res.ok) {
        if (data.field) setFieldErr({ [data.field as Field]: data.error });
        else setError(data.error ?? t('signup.err.network'));
        return;
      }
      setRequestId(data.requestId);
      setMasked(data.maskedTarget);
      setDevCode(data.devCode ?? '');
      setCode('');
      setCooldown(60);
      setStep('verify');
    } catch {
      setError(t('signup.err.network'));
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setError(''); setNotice('');
    if (code.length !== 6) { setError(t('signup.err.code')); return; } // الخادم يوحّد الأرقام العربية
    setBusy(true);
    try {
      const { res, data } = await post('/api/auth/signup/verify', { requestId, code });
      if (!res.ok) {
        setError(data.error ?? t('signup.err.network'));
        if (data.restart) { setStep('details'); setRequestId(''); }
        return;
      }
      window.location.href = data.redirectTo ?? window.location.origin;
    } catch {
      setError(t('signup.err.network'));
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setError(''); setNotice('');
    setBusy(true);
    try {
      const { res, data } = await post('/api/auth/signup/resend', { requestId });
      if (!res.ok) {
        setError(data.error ?? t('signup.err.network'));
        if (data.retryAfter) setCooldown(data.retryAfter);
        if (data.restart) { setStep('details'); setRequestId(''); }
        return;
      }
      setDevCode(data.devCode ?? '');
      setCode('');
      setCooldown(60);
      setNotice(t('signup.sent'));
    } catch {
      setError(t('signup.err.network'));
    } finally {
      setBusy(false);
    }
  }

  const fieldProps = (k: Field) => ({
    'aria-invalid': fieldErr[k] ? true : undefined,
    'aria-describedby': fieldErr[k] ? `err-${k}` : undefined,
  });
  const fieldError = (k: Field) => (fieldErr[k] ? <span id={`err-${k}`} className="su-field-error" role="alert">{fieldErr[k]}</span> : null);

  return (
    <AuthShell wide>

      <div className="lg-head">
        <h1>{step === 'details' ? t('signup.title') : t('signup.verifyTitle')}</h1>
        <p>{step === 'details' ? t('signup.sub') : t('signup.sentTo')}</p>
      </div>

      <ol className="su-steps" aria-label={t('signup.title')}>
        <li className={`su-step ${step === 'details' ? 'is-on' : ''}`} aria-current={step === 'details' ? 'step' : undefined}><i>1</i>{t('signup.step.details')}</li>
        <li className="su-step-sep" aria-hidden="true" />
        <li className={`su-step ${step === 'verify' ? 'is-on' : ''}`} aria-current={step === 'verify' ? 'step' : undefined}><i>2</i>{t('signup.step.verify')}</li>
      </ol>

      {error && (
        <div className="lg-error" role="alert">
          <Icon name="alert" size={16} />
          <span>{error}</span>
        </div>
      )}

      {step === 'details' ? (
        <form onSubmit={start} noValidate>
          <div className="su-row">
            <label className="lg-field">
              <span className="lg-label">{t('signup.name')}</span>
              <input autoComplete="name" value={form.name} onChange={set('name')} {...fieldProps('name')} />
              {fieldError('name')}
            </label>
            <label className="lg-field">
              <span className="lg-label">{t('signup.orgName')}</span>
              <input autoComplete="organization" value={form.orgName} onChange={set('orgName')} {...fieldProps('orgName')} />
              {fieldError('orgName')}
            </label>
          </div>

          <label className="lg-field">
            <span className="lg-label">{t('signup.slug')}</span>
            <span className="su-slug">
              {process.env.NEXT_PUBLIC_APP_PATH_ROUTING === '1' && <span>/org/</span>}
              <input dir="ltr" inputMode="url" autoCapitalize="none" spellCheck={false} placeholder="alnoor" value={form.slug} onChange={set('slug')} {...fieldProps('slug')} />
              {process.env.NEXT_PUBLIC_APP_PATH_ROUTING !== '1' && <span>{suffix}</span>}
            </span>
            {fieldErr.slug ? fieldError('slug') : <span className="su-hint">{t('signup.slugHint')}</span>}
            {process.env.NEXT_PUBLIC_APP_PATH_ROUTING === '1' && <span className="su-hint su-url-preview" dir="ltr">{suffix}{form.slug || 'alnoor'}</span>}
          </label>

          <label className="lg-field">
            <span className="lg-label">{t('login.email')}</span>
            <input type="email" dir="ltr" autoComplete="email" placeholder="name@example.com" value={form.email} onChange={set('email')} {...fieldProps('email')} />
            {fieldError('email')}
          </label>

          <label className="lg-field">
            <span className="lg-label">{t('signup.phone')}</span>
            <input type="tel" dir="ltr" inputMode="tel" autoComplete="tel" placeholder="05XXXXXXXX" value={form.phone} onChange={set('phone')} {...fieldProps('phone')} />
            {fieldErr.phone ? fieldError('phone') : <span className="su-hint">{t('signup.phoneHint')}</span>}
          </label>

          <label className="lg-field">
            <span className="lg-label">{t('login.password')}</span>
            <span className="lg-input-wrap">
              <input type={showPw ? 'text' : 'password'} autoComplete="new-password" placeholder="••••••••" value={form.password} onChange={set('password')} {...fieldProps('password')} />
              <button type="button" className="lg-eye" onClick={() => setShowPw(!showPw)} aria-label={showPw ? t('signup.hidePw') : t('signup.showPw')}>
                <Icon name={showPw ? 'hide' : 'view'} size={20} />
              </button>
            </span>
            {fieldErr.password ? fieldError('password') : <span className="su-hint">{t('signup.passwordHint')}</span>}
          </label>

          <span className="lg-label" id="su-channel-label">{t('signup.channel')}</span>
          <div className="su-channels" role="radiogroup" aria-labelledby="su-channel-label">
            {(['EMAIL', 'PHONE'] as Channel[]).map((c) => (
              <button key={c} type="button" role="radio" aria-checked={channel === c} className="su-channel" onClick={() => { setChannel(c); setFieldErr((fe) => ({ ...fe, phone: undefined })); }}>
                <span className="ic"><Icon name={c === 'EMAIL' ? 'messages' : 'notifications'} size={20} /></span>
                <span><b>{t(c === 'EMAIL' ? 'signup.channel.email' : 'signup.channel.phone')}</b><small>{t(c === 'EMAIL' ? 'signup.channel.emailSub' : 'signup.channel.phoneSub')}</small></span>
              </button>
            ))}
          </div>

          <p className="su-terms">
            {t('signup.termsPre')} <Link href="/terms">{t('signup.terms')}</Link> {t('signup.and')} <Link href="/privacy">{t('signup.privacy')}</Link>.
          </p>

          <button className="lg-submit" type="submit" disabled={busy}>
            {busy ? t('signup.submitting') : t('signup.submit')}
            {!busy && <span className="au-arrow" aria-hidden="true">←</span>}
          </button>

          <p className="su-switch">{t('signup.haveAccount')} <Link href="/login">{t('login.submit')}</Link></p>
        </form>
      ) : (
        <form onSubmit={verify} noValidate>
          <p className="su-target"><b>{masked}</b></p>

          {notice && <div className="su-dev" role="status" style={{ marginTop: 0, marginBottom: '1rem' }}>{notice}</div>}

          <label className="lg-field">
            <span className="lg-label">{t('signup.code')}</span>
            {/* حقل واحد حقيقي (يدعم التعبئة التلقائية واللصق) تعرضه ست خانات؛ المؤشّر يتقدّم تلقائيًا */}
            <span className="su-otp-wrap" data-invalid={error ? 'true' : undefined}>
              <input
                ref={codeRef}
                className="su-otp-input" dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                value={code} aria-invalid={error ? true : undefined}
                onChange={(e) => setCode(e.target.value.replace(/[^\d٠-٩۰-۹]/g, '').slice(0, 6))}
              />
              <span className="su-otp-boxes" aria-hidden="true">
                {Array.from({ length: 6 }, (_, i) => (
                  <span key={i} className={`su-otp-box${code[i] ? ' is-filled' : ''}${i === Math.min(code.length, 5) ? ' is-next' : ''}`}>{code[i] ?? ''}</span>
                ))}
              </span>
            </span>
          </label>

          <button className="lg-submit" type="submit" disabled={busy || code.length < 6}>
            {busy ? t('signup.verifying') : t('signup.verify')}
          </button>

          <div className="su-actions">
            <button type="button" className="su-link" onClick={() => { setStep('details'); setError(''); setNotice(''); }}>{t('signup.back')}</button>
            <button type="button" className="su-link" onClick={resend} disabled={busy || cooldown > 0}>
              {cooldown > 0 ? t('signup.resendIn', { s: cooldown }) : t('signup.resend')}
            </button>
          </div>

          {devCode && <p className="su-dev">{t('signup.dev', { code: devCode })}</p>}
        </form>
      )}
    </AuthShell>
  );
}
