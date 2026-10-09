import { redirect } from 'next/navigation';

// محتوى «الأنظمة» صار جزءًا من صفحة المزايا (المجالات ووحداتها) — الرابط القديم يبقى عاملًا
export default function SystemsRedirect() {
  redirect('/features');
}
