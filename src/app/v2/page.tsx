import { redirect } from 'next/navigation';

// ‎/v2‎ كانت نسخة المراجعة — صارت هي الصفحة الرئيسية
export default function V2Redirect() {
  redirect('/');
}
