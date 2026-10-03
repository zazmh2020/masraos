'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useT } from '@/lib/i18n/LocaleProvider';
import Icon from '@/components/Icon';

/** عرض محادثة يحاكي مساعد مسرى الذكي: سؤال → تحليل → إجابة بمؤشرات. */
export default function MasraAIChat() {
  const t = useT();
  const [stage, setStage] = useState(0); // 0 user, 1 typing, 2 answer
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          if (!reduced) timers.push(setTimeout(() => setStage(1), 800));
          timers.push(setTimeout(() => setStage(2), reduced ? 0 : 2400));
        }
      });
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => { obs.disconnect(); timers.forEach(clearTimeout); };
  }, []);

  return (
    <div className="mdl-chat" ref={ref}>
      <div className="mdl-chat-head">
        <span className="ava">
          <Icon name="assistant" size={20} />
        </span>
        <div>
          <b>{t('aichat.title')}</b><br />
          <span>{t('aichat.subtitle')}</span>
        </div>
      </div>

      <div className="mdl-msgs">
        <motion.div className="mdl-msg user" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {t('aichat.q')}
        </motion.div>

        <AnimatePresence mode="wait">
          {stage === 1 && (
            <motion.div key="typing" className="mdl-msg ai" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <span className="mdl-typing"><i /><i /><i /></span>
            </motion.div>
          )}
          {stage === 2 && (
            <motion.div key="answer" className="mdl-msg ai" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              {t('aichat.a', { p: '89%' })}
              <div className="ai-metrics">
                <div className="ai-metric"><div className="m">{t('aichat.m1')}</div><div className="n">89%</div></div>
                <div className="ai-metric"><div className="m">{t('aichat.m2')}</div><div className="n">2</div></div>
                <div className="ai-metric"><div className="m">{t('aichat.m3')}</div><div className="n">{t('aichat.m3v')}</div></div>
                <div className="ai-metric"><div className="m">{t('aichat.m4')}</div><div className="n">{t('aichat.m4v')}</div></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
