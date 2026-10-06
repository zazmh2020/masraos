'use client';

import { IconShape } from '@/components/Icon';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/lib/i18n/LocaleProvider';

type Article = {
  id: string; title: string; body: string; category: string | null;
  isPublished: boolean; author: string | null; updatedAt: string;
};

export default function KnowledgeView({
  articles, canManage,
}: { articles: Article[]; canManage: boolean }) {
  const { t, locale } = useLocale();
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' });
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [publish, setPublish] = useState(false);

  function resetForm() { setTitle(''); setCategory(''); setContent(''); setPublish(false); }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(''); setBusyId('__new');
    try {
      const res = await fetch('/api/org/knowledge', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body: content, category, isPublished: publish }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? t('know.publishErr'));
      else { resetForm(); setCreating(false); router.refresh(); }
    } catch { setError(t('form.netErr')); }
    finally { setBusyId(null); }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/knowledge/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? t('form.saveErr'));
      else router.refresh();
    } catch { setError(t('form.netErr')); }
    finally { setBusyId(null); }
  }

  async function remove(id: string) {
    if (!confirm(t('know.deleteConfirm'))) return;
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/knowledge/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? t('form.deleteErr'));
      else router.refresh();
    } catch { setError(t('form.netErr')); }
    finally { setBusyId(null); }
  }

  return (
    <>
      {canManage && (
        <div className="org-toolbar">
          <span className="org-toolbar-spacer" />
          <button className="org-btn org-btn-primary" onClick={() => { setCreating((v) => !v); setError(''); }}>
            {creating ? t('shell.cancel') : t('know.new')}
          </button>
        </div>
      )}

      {error && <div className="org-alert">{error}</div>}

      {creating && (
        <form className="org-form" onSubmit={handleCreate}>
          <div className="org-field">
            <label htmlFor="k-title">{t('know.title')}</label>
            <input id="k-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="org-field">
            <label htmlFor="k-cat">{t('know.category')} <span className="org-hint">{t('know.catHint')}</span></label>
            <input id="k-cat" value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div className="org-field">
            <label htmlFor="k-body">{t('know.body')}</label>
            <textarea id="k-body" rows={6} value={content} onChange={(e) => setContent(e.target.value)} required />
          </div>
          <label className="org-check">
            <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
            {t('know.publishNow')}
          </label>
          <div className="org-form-actions">
            <button type="submit" className="org-btn org-btn-primary" disabled={busyId === '__new'}>
              {busyId === '__new' ? t('form.saving') : t('know.save')}
            </button>
          </div>
        </form>
      )}

      {articles.length === 0 ? (
        <div className="org-empty"><IconShape name="knowledge" variant="soft" size="xl" /><p>{t('know.none')}</p></div>
      ) : (
        <div className="org-articles">
          {articles.map((a) => {
            const open = openId === a.id;
            return (
              <article key={a.id} className="org-article">
                <button className="org-article-head" onClick={() => setOpenId(open ? null : a.id)}>
                  <div>
                    <h3>{a.title}</h3>
                    <div className="org-article-meta">
                      {a.category && <span className="org-chip">{a.category}</span>}
                      {canManage && (
                        <span className={`org-badge ${a.isPublished ? 'is-on' : ''}`}>
                          {a.isPublished ? t('know.published') : t('know.draft')}
                        </span>
                      )}
                      <span>{a.author ?? t('know.unknown')} · {dateFmt.format(new Date(a.updatedAt))}</span>
                    </div>
                  </div>
                  <span className="org-article-caret">{open ? '−' : '+'}</span>
                </button>
                {open && <p className="org-article-body">{a.body}</p>}
                {canManage && (
                  <div className="org-article-actions">
                    <button className="org-btn org-btn-quiet" disabled={busyId === a.id}
                      onClick={() => patch(a.id, { isPublished: !a.isPublished })}>
                      {a.isPublished ? t('know.unpublish') : t('know.publish')}
                    </button>
                    <button className="org-btn org-btn-danger" disabled={busyId === a.id} onClick={() => remove(a.id)}>{t('view.delete')}</button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
