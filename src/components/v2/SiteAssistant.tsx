import MasraAssistant from '@/components/landing/MasraAssistant';
import '@/styles/masra.css'; // أنماط المساعد (.mdl-asst) ومتغيّرات .mdl

/** مساعد الموقع العائم — أنماطه تحت .mdl؛ display:contents يمرّر المتغيّرات دون صندوق إضافي. */
export default function SiteAssistant() {
  return <div className="mdl v2-contents"><MasraAssistant /></div>;
}
