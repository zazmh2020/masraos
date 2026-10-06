import type { ReactNode } from 'react';
import '@/styles/dashboard.css';

/**
 * غلاف لوحة التحكم — يوفّر بنية اللوحة.
 * أسطح صلبة بيضاء — لا نمط زجاجي في المنصة.
 */
export default function DashboardShell({
  children,
  toolbar,
}: {
  children: ReactNode;
  toolbar?: ReactNode;
}) {
  return (
    <div className="dash">
      {toolbar && (
        <div className="dash-toolbar" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', alignItems: 'center' }}>
          {toolbar}
        </div>
      )}
      {children}
    </div>
  );
}
