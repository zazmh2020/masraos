'use client';

import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { COUNTRIES } from '@/lib/countries';
import { readLogoFile } from '@/lib/image-file';
import ImageCropper from '@/components/ImageCropper';

/** يفصل رقمًا مخزّنًا "+966 5xxxx" إلى مفتاح دولة ورقم محلّي. */
function splitPhone(raw: string): { dial: string; number: string } {
  const val = (raw ?? '').trim();
  if (!val) return { dial: '+966', number: '' };
  const dials = [...COUNTRIES].map((c) => c.dial).sort((a, b) => b.length - a.length);
  const hit = dials.find((d) => val.startsWith(d));
  if (hit) return { dial: hit, number: val.slice(hit.length).trim() };
  return { dial: '+966', number: val };
}

export default function ProfileForm({
  name: initialName, email, role, avatarUrl: initialAvatar = '',
  jobTitle: initialJob = '', phone: initialPhone = '',
}: { name: string; email: string; role: string; avatarUrl?: string | null; jobTitle?: string | null; phone?: string | null }) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const countryName = (c: (typeof COUNTRIES)[number]) => (locale === 'en' ? c.name : c.nameAr);

  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar ?? '');
  const avatarRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState('');

  async function generateAi() {
    setAiErr(''); setAiBusy(true);
    try {
      const res = await fetch('/api/ai/image', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt.trim(), kind: 'avatar' }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setAiErr(d.error ?? t('form.netErr')); return; }
      setAiOpen(false);
      setCropSrc(d.image); // الصورة المولّدة تُفتح في أداة الضبط
    } catch { setAiErr(t('form.netErr')); }
    finally { setAiBusy(false); }
  }

  async function onPickAvatar(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) { setNameStatus({ kind: 'error', msg: t('brand.logoTooBig') }); return; }
    try { setCropSrc(await readLogoFile(file, 1024)); }
    catch { setNameStatus({ kind: 'error', msg: t('brand.logoReadErr') }); }
  }
  const [jobTitle, setJobTitle] = useState(initialJob ?? '');
  const initPhone = splitPhone(initialPhone ?? '');
  const [dial, setDial] = useState(initPhone.dial);
  const [phoneNum, setPhoneNum] = useState(initPhone.number);
  const phone = phoneNum.trim() ? `${dial} ${phoneNum.trim()}` : '';
  const [nameStatus, setNameStatus] = useState<{ kind: 'ok' | 'error'; msg: string } | null>(null);
  const [nameBusy, setNameBusy] = useState(false);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [pwStatus, setPwStatus] = useState<{ kind: 'ok' | 'error'; msg: string } | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  async function saveName(e: FormEvent) {
    e.preventDefault();
    setNameStatus(null);
    setNameBusy(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatarUrl, jobTitle, phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setNameStatus({ kind: 'error', msg: data.error ?? t('form.saveErr') });
      else { setNameStatus({ kind: 'ok', msg: t('pf.savedProfile') }); router.refresh(); }
    } catch {
      setNameStatus({ kind: 'error', msg: t('form.netErr') });
    } finally { setNameBusy(false); }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setPwStatus(null);
    setPwBusy(true);
    try {
      const res = await fetch('/api/profile/password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setPwStatus({ kind: 'error', msg: data.error ?? t('pf.pwChangeErr') });
      else { setPwStatus({ kind: 'ok', msg: t('pf.pwChanged') }); setCurrent(''); setNext(''); }
    } catch {
      setPwStatus({ kind: 'error', msg: t('form.netErr') });
    } finally { setPwBusy(false); }
  }

  return (
    <>
      <form className="org-form" onSubmit={saveName}>
        {nameStatus && <div className={`org-alert ${nameStatus.kind === 'ok' ? 'is-ok' : ''}`}>{nameStatus.msg}</div>}
        <div className="pf-avatar-row">
          <span className="pf-avatar">
            {avatarUrl.trim() ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" />
            ) : (
              <svg className="ava-default" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <circle cx="12" cy="8.5" r="3.8" />
                <path d="M4.6 20a7.4 7.4 0 0 1 14.8 0z" />
              </svg>
            )}
          </span>
          <div className="org-field" style={{ flex: 1, margin: 0 }}>
            <label>{t('pf.avatar')}</label>
            <div className="pf-avatar-controls">
              <button type="button" className="org-btn org-btn-outline" onClick={() => avatarRef.current?.click()}>{t('brand.uploadLogo')}</button>
              <button type="button" className="org-btn org-btn-outline" onClick={() => { setAiErr(''); setAiOpen(true); }}>✦ {t('pf.aiGenerate')}</button>
              {avatarUrl.trim() && <button type="button" className="org-btn org-btn-ghost" onClick={() => setAvatarUrl('')}>{t('view.delete')}</button>}
              <input ref={avatarRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={onPickAvatar} />
            </div>
            <span className="org-hint">{t('pf.avatarHint2')}</span>
          </div>
        </div>

        {cropSrc && (
          <ImageCropper
            src={cropSrc}
            outputSize={256}
            round
            onCancel={() => setCropSrc(null)}
            onConfirm={(dataUrl) => { setAvatarUrl(dataUrl); setCropSrc(null); }}
          />
        )}

        {aiOpen && (
          <div className="crp-overlay" role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget) setAiOpen(false); }}>
            <div className="crp-box">
              <div className="crp-title">✦ {t('pf.aiGenerate')}</div>
              {aiErr && <div className="org-alert">{aiErr}</div>}
              <textarea className="pf-ai-prompt" rows={3} value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder={t('pf.aiPromptPlaceholder')} />
              <p className="crp-hint">{t('pf.aiHint')}</p>
              <div className="crp-actions">
                <button type="button" className="org-btn org-btn-primary" disabled={aiBusy || aiPrompt.trim().length < 3} onClick={generateAi}>
                  {aiBusy ? t('pf.aiGenerating') : t('pf.aiGenerate')}
                </button>
                <button type="button" className="org-btn org-btn-outline" onClick={() => setAiOpen(false)}>{t('shell.cancel')}</button>
              </div>
            </div>
          </div>
        )}
        <div className="org-field-row">
          <div className="org-field">
            <label htmlFor="pf-name">{t('pf.name')}</label>
            <input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} minLength={2} required />
          </div>
          <div className="org-field">
            <label htmlFor="pf-job">{t('pf.jobTitle')} <span className="org-hint">{t('view.optional')}</span></label>
            <input id="pf-job" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
          </div>
        </div>
        <div className="org-field-row">
          <div className="org-field">
            <label htmlFor="pf-email">{t('pf.email')}</label>
            <input id="pf-email" dir="ltr" value={email} readOnly />
            <span className="org-hint">{t('pf.emailHint')}</span>
          </div>
          <div className="org-field">
            <label htmlFor="pf-phone">{t('pf.phone')}</label>
            <div className="pf-phone-row" dir="ltr">
              <div className="pf-dial-wrap">
                <span className="pf-dial-face" aria-hidden="true">
                  {/* علم الدولة كصورة صغيرة (رموز الأعلام لا تظهر على ويندوز) */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="pf-dial-flag"
                    src={`https://flagcdn.com/${(COUNTRIES.find((c) => c.dial === dial) ?? COUNTRIES[0]).code.toLowerCase()}.svg`}
                    alt=""
                    onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                  />
                  <span className="pf-dial-code">{dial}</span>
                  <svg className="pf-dial-chev" width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8l4 4 4-4" /></svg>
                </span>
                <select className="pf-dial-native" value={dial} onChange={(e) => setDial(e.target.value)} aria-label={t('pf.phoneHint')}>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.dial}>{c.dial} — {countryName(c)}</option>
                  ))}
                </select>
              </div>
              <input id="pf-phone" type="tel" lang="en" inputMode="tel" value={phoneNum} onChange={(e) => setPhoneNum(e.target.value)} placeholder="5X XXX XXXX" />
            </div>
          </div>
        </div>
        <div className="org-kv"><span>{t('pf.role')}</span><strong>{t(`role.${role}`)}</strong></div>
        <div className="org-form-actions">
          <button type="submit" className="org-btn org-btn-primary" disabled={nameBusy || (name.trim() === initialName.trim() && avatarUrl.trim() === (initialAvatar ?? '').trim() && jobTitle.trim() === (initialJob ?? '').trim() && phone.trim() === (initialPhone ?? '').trim())}>
            {nameBusy ? t('form.saving') : t('pf.saveChanges')}
          </button>
        </div>
      </form>

      <h2 className="org-settings-h2">{t('pf.password')}</h2>
      <form className="org-form" onSubmit={changePassword}>
        {pwStatus && <div className={`org-alert ${pwStatus.kind === 'ok' ? 'is-ok' : ''}`}>{pwStatus.msg}</div>}
        <div className="org-field">
          <label htmlFor="pf-current">{t('pf.currentPw')}</label>
          <input id="pf-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </div>
        <div className="org-field">
          <label htmlFor="pf-next">{t('pf.newPw')} <span className="org-hint">{t('pf.pwHint')}</span></label>
          <input id="pf-next" type="password" autoComplete="new-password" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} required />
        </div>
        <div className="org-form-actions">
          <button type="submit" className="org-btn org-btn-primary" disabled={pwBusy || !current || next.length < 8}>
            {pwBusy ? t('pf.changing') : t('pf.changePw')}
          </button>
        </div>
      </form>
    </>
  );
}
