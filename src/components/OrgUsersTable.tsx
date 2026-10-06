'use client';

import { IconShape } from '@/components/Icon';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ASSIGNABLE_ROLES } from '@/lib/permissions';
import { useLocale } from '@/lib/i18n/LocaleProvider';

type Row = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  departmentId: string | null;
  customRoleId: string | null;
  avatarUrl: string | null;
};

type Department = { id: string; name: string };
type Ref = { id: string; name: string };

export default function OrgUsersTable({
  users,
  departments,
  customRoles,
  currentUserId,
  canManage,
}: {
  users: Row[];
  departments: Department[];
  customRoles: Ref[];
  currentUserId: string;
  canManage: boolean;
}) {
  const { t, locale } = useLocale();
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' });
  const deptName = (id: string | null) =>
    id ? departments.find((d) => d.id === id)?.name ?? '—' : '—';
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function patch(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    setError('');
    try {
      const res = await fetch(`/api/org/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t('ousers.saveErr'));
      } else {
        router.refresh();
      }
    } catch {
      setError(t('ousers.netErr'));
    } finally {
      setBusyId(null);
    }
  }

  if (users.length === 0) {
    return <div className="org-empty"><IconShape name="users" variant="soft" size="xl" /><p>{t('ousers.none')}</p></div>;
  }

  return (
    <>
      {error && <div className="org-alert">{error}</div>}
      <div className="org-table-wrap">
        <table className="org-table">
          <thead>
            <tr>
              <th>{t('ousers.th.user')}</th>
              <th>{t('ousers.th.role')}</th>
              {customRoles.length > 0 && <th>{t('ousers.th.customRole')}</th>}
              <th>{t('ousers.th.unit')}</th>
              <th>{t('ousers.th.lastLogin')}</th>
              <th>{t('ousers.th.status')}</th>
              {canManage && <th></th>}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              const busy = busyId === u.id;
              return (
                <tr key={u.id} className={u.isActive ? '' : 'is-inactive'}>
                  <td>
                    <div className="ousers-user">
                      <span className="ousers-ava">
                        {u.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.avatarUrl} alt="" />
                        ) : (
                          <svg className="ava-default" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <circle cx="12" cy="8.5" r="3.8" />
                            <path d="M4.6 20a7.4 7.4 0 0 1 14.8 0z" />
                          </svg>
                        )}
                      </span>
                      <span className="ousers-user-tx">
                        <strong>{u.name}{isSelf && <span className="org-tag-self">{t('ousers.you')}</span>}</strong>
                        <small dir="ltr">{u.email}</small>
                      </span>
                    </div>
                  </td>
                  <td>
                    {canManage && !isSelf ? (
                      <select
                        className="org-inline-select"
                        value={u.role}
                        disabled={busy}
                        onChange={(e) => patch(u.id, { role: e.target.value })}
                      >
                        {ASSIGNABLE_ROLES.map((r) => (
                          <option key={r} value={r}>{t(`role.${r}`)}</option>
                        ))}
                      </select>
                    ) : (
                      t(`role.${u.role}`)
                    )}
                  </td>
                  {customRoles.length > 0 && (
                    <td>
                      {canManage ? (
                        <select
                          className="org-inline-select"
                          value={u.customRoleId ?? ''}
                          disabled={busy}
                          onChange={(e) => patch(u.id, { customRoleId: e.target.value || null })}
                        >
                          <option value="">{t('ousers.baseRole')}</option>
                          {customRoles.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      ) : (
                        customRoles.find((r) => r.id === u.customRoleId)?.name ?? '—'
                      )}
                    </td>
                  )}
                  <td>
                    {canManage && departments.length > 0 ? (
                      <select
                        className="org-inline-select"
                        value={u.departmentId ?? ''}
                        disabled={busy}
                        onChange={(e) => patch(u.id, { departmentId: e.target.value || null })}
                      >
                        <option value="">{t('ousers.noUnit')}</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    ) : (
                      deptName(u.departmentId)
                    )}
                  </td>
                  <td>
                    {u.lastLoginAt ? dateFmt.format(new Date(u.lastLoginAt)) : '—'}
                  </td>
                  <td>
                    <span className={`org-badge ${u.isActive ? 'is-on' : ''}`}>
                      {u.isActive ? t('ousers.active') : t('ousers.suspended')}
                    </span>
                  </td>
                  {canManage && (
                    <td className="org-row-actions">
                      {!isSelf && (
                        <button
                          className="org-btn org-btn-quiet"
                          disabled={busy}
                          onClick={() => patch(u.id, { isActive: !u.isActive })}
                        >
                          {busy ? '…' : u.isActive ? t('ousers.disable') : t('ousers.enable')}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
