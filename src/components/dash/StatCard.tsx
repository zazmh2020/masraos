import { IconShape } from '@/components/Icon';

export type StatColor = 'purple' | 'gold' | 'green' | 'blue';

/** بطاقة إحصاء واحدة مع أيقونة ملوّنة وقيمة واتجاه اختياري. */
export default function StatCard({
  icon,
  color = 'purple',
  label,
  value,
  trend,
}: {
  icon: string;
  color?: StatColor;
  label: string;
  value: string | number;
  trend?: string;
}) {
  // الأيقونة داخل مربع فاتح بألوان الهوية (نمط ثنائي اللون)؛ اللون يبقى للتوافق مع المستدعين
  return (
    <div className={`dash-stat dash-stat-${color}`}>
      <div className="dash-stat-label">
        <IconShape name={icon} shape="square" variant="soft" size="md" className="dash-stat-shape" />
        <span>{label}</span>
      </div>
      <div className="dash-stat-value">{value}</div>
      {trend && <span className="dash-stat-trend up">▲ {trend}</span>}
    </div>
  );
}
