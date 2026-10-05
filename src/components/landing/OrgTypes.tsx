'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from '@/components/Icon';

const ORGS = [
  { icon: 'organization/organization-institution', title: 'الجمعيات الخيرية', desc: 'أدر المتطوعين والمشاريع والتبرعات والمستفيدين ضمن منظومة واحدة.', tags: ['المستفيدون', 'التبرعات', 'المشاريع'] },
  { icon: 'people/people-groups', title: 'المؤسسات الإنسانية', desc: 'برامج ميدانية وفرق عمل ومتابعة حالات وتقارير دقيقة.', tags: ['البرامج', 'الفرق', 'التقارير'] },
  { icon: 'education/education-education', title: 'المؤسسات التعليمية', desc: 'طلاب ومعلمون وحضور وتقييمات وبرامج تعليمية.', tags: ['الطلاب', 'الحضور', 'التقييم'] },
  { icon: 'education/education-quran', title: 'مراكز القرآن', desc: 'حلقات وحفظ وتسميع ومسابقات وشهادات وأولياء أمور.', tags: ['الحلقات', 'الحفظ', 'المسابقات'] },
  { icon: 'analytics/analytics-growth', title: 'المؤسسات التنموية', desc: 'مبادرات ومؤشرات ونتائج قابلة للقياس والمتابعة.', tags: ['المبادرات', 'المؤشرات', 'الأثر'] },
  { icon: 'organization/organization-building', title: 'المؤسسات الوقفية', desc: 'أصول ومشاريع وقفية وتبرعات وتقارير دورية.', tags: ['الأصول', 'الأوقاف', 'المالية'] },
];

export default function OrgTypes() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mdl-orgs">
      {ORGS.map((o, i) => (
        <button
          key={o.title}
          className={`mdl-org ${open === i ? 'is-open' : ''}`}
          onClick={() => setOpen(open === i ? null : i)}
          aria-expanded={open === i}
        >
          <span className="mdl-org-ic"><Icon name={o.icon} size={22} /></span>
          <h4>{o.title}</h4>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                className="mdl-org-extra"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
              >
                <p>{o.desc}</p>
                <div className="tags">{o.tags.map((t) => <span key={t}>{t}</span>)}</div>
              </motion.div>
            )}
          </AnimatePresence>
          {open !== i && <div className="mdl-org-more">اعرف المزيد ←</div>}
        </button>
      ))}
    </div>
  );
}
