/**
 * رسوم توضيحية مدمجة (SVG) لكل خطوة في دليل مسابقة النقاط.
 * تستخدم متغيّرات لون العلامة فتتكيّف مع كل جهة والوضع الداكن.
 * مكوّن خادمي بحت (بلا تفاعل) — مجرّد رسم.
 */

const P = 'var(--purple-500, #6b57a0)';
const PD = 'var(--purple-700, #4a357e)';
const PL = 'var(--purple-100, #efeaf7)';
const LINE = 'var(--line, #e6e3ee)';
const INK = 'var(--text-strong, #2b1a4e)';
const MUT = 'var(--text-muted, #8b8794)';
const CARD = 'var(--surface, #ffffff)';
const OK = 'var(--success, #16a34a)';
const GOLD = 'var(--gold-600, #b8860b)';

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 320 180" role="img" className="pts-guide-svg" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="318" height="178" rx="16" fill={CARD} stroke={LINE} strokeWidth="1.5" />
      {children}
    </svg>
  );
}

// 1) قائمة الطلاب بأرقام تسلسلية
function Students() {
  return (
    <Frame>
      <rect x="16" y="16" width="120" height="12" rx="6" fill={INK} opacity="0.85" />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(0 ${44 + i * 40})`}>
          <rect x="16" y="0" width="288" height="32" rx="10" fill={PL} opacity="0.5" />
          <circle cx="36" cy="16" r="11" fill={P} />
          <rect x="56" y="9" width="120" height="8" rx="4" fill={INK} opacity="0.55" />
          <rect x="56" y="21" width="70" height="6" rx="3" fill={MUT} opacity="0.5" />
          <rect x="250" y="6" width="40" height="20" rx="10" fill="#fff" stroke={P} strokeWidth="1.4" />
          <text x="270" y="20" textAnchor="middle" fontSize="11" fontWeight="800" fill={P}>#{i + 1}</text>
        </g>
      ))}
    </Frame>
  );
}

// 2) بطاقة الطالب: اسم + رقم كبير + باركود
function Card() {
  return (
    <Frame>
      <rect x="60" y="26" width="200" height="128" rx="14" fill="#fff" stroke={LINE} strokeWidth="1.5" />
      <rect x="76" y="42" width="90" height="9" rx="4.5" fill={INK} opacity="0.65" />
      <text x="76" y="96" fontSize="40" fontWeight="900" fill={P}>12</text>
      <g transform="translate(76 112)">
        {Array.from({ length: 22 }).map((_, i) => (
          <rect key={i} x={i * 7} y="0" width={i % 3 === 0 ? 3.5 : 1.6} height="26" fill={INK} opacity="0.8" />
        ))}
      </g>
      <rect x="200" y="40" width="44" height="30" rx="7" fill={PL} />
      <path d="M212 55h20M222 45v20" stroke={P} strokeWidth="2.2" strokeLinecap="round" />
    </Frame>
  );
}

// 3) منح النقاط: إدخال رقم + زر تنفيذ + شارة +10
function Award() {
  return (
    <Frame>
      <rect x="20" y="66" width="180" height="48" rx="12" fill="#fff" stroke={P} strokeWidth="2" />
      <text x="40" y="98" fontSize="26" fontWeight="800" fill={INK}>7</text>
      <rect x="210" y="66" width="90" height="48" rx="12" fill={P} />
      <text x="255" y="96" textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff">تنفيذ</text>
      <g transform="translate(232 26)">
        <rect x="0" y="0" width="56" height="30" rx="15" fill={OK} />
        <text x="28" y="20" textAnchor="middle" fontSize="15" fontWeight="900" fill="#fff">10+</text>
      </g>
    </Frame>
  );
}

// 4) الخصم عند الاستبدال: رقم + مبلغ + شارة −
function Deduct() {
  return (
    <Frame>
      <g transform="translate(20 30)">
        <rect x="0" y="0" width="130" height="26" rx="13" fill={PL} />
        <text x="16" y="18" fontSize="12" fontWeight="700" fill={PD}>خصم</text>
      </g>
      <rect x="20" y="76" width="120" height="46" rx="12" fill="#fff" stroke={P} strokeWidth="2" />
      <text x="40" y="106" fontSize="24" fontWeight="800" fill={INK}>7</text>
      <rect x="150" y="76" width="80" height="46" rx="12" fill="#fff" stroke={GOLD} strokeWidth="2" />
      <text x="176" y="106" fontSize="22" fontWeight="800" fill={INK}>15</text>
      <g transform="translate(244 84)">
        <rect x="0" y="0" width="52" height="30" rx="15" fill={GOLD} />
        <text x="26" y="20" textAnchor="middle" fontSize="15" fontWeight="900" fill="#fff">15−</text>
      </g>
    </Frame>
  );
}

// 5) شاشة العرض الكبيرة: اسم + رصيد كبير + نقطة مباشر
function Display() {
  return (
    <Frame>
      <rect x="28" y="24" width="264" height="112" rx="12" fill={PD} />
      <circle cx="52" cy="44" r="5" fill={OK} />
      <text x="66" y="49" fontSize="11" fontWeight="700" fill="#fff" opacity="0.85">مباشر</text>
      <rect x="96" y="58" width="128" height="12" rx="6" fill="#fff" opacity="0.9" />
      <text x="160" y="116" textAnchor="middle" fontSize="40" fontWeight="900" fill="#fff">30</text>
      <rect x="120" y="148" width="80" height="8" rx="4" fill={MUT} opacity="0.5" />
    </Frame>
  );
}

// 6) التقرير: جدول حركات النقاط + الرصيد
function Report() {
  return (
    <Frame>
      <rect x="16" y="18" width="288" height="26" rx="8" fill={PL} />
      <rect x="30" y="27" width="70" height="8" rx="4" fill={PD} opacity="0.7" />
      <rect x="150" y="27" width="40" height="8" rx="4" fill={PD} opacity="0.7" />
      <rect x="250" y="27" width="40" height="8" rx="4" fill={PD} opacity="0.7" />
      {[
        { c: OK, s: '10+' },
        { c: GOLD, s: '15−' },
        { c: OK, s: '10+' },
      ].map((r, i) => (
        <g key={i} transform={`translate(0 ${54 + i * 38})`}>
          <circle cx="36" cy="14" r="10" fill={P} opacity="0.85" />
          <rect x="54" y="9" width="96" height="8" rx="4" fill={INK} opacity="0.5" />
          <rect x="150" y="4" width="44" height="20" rx="10" fill={r.c} />
          <text x="172" y="18" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">{r.s}</text>
          <text x="288" y="19" textAnchor="end" fontSize="15" fontWeight="800" fill={INK}>{[30, 15, 25][i]}</text>
        </g>
      ))}
    </Frame>
  );
}

export const GUIDE_ART = [Students, Card, Award, Deduct, Display, Report];
