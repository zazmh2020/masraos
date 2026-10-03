import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DICTIONARIES, translate } from './i18n/dictionaries';
import { getLandingReply } from '@/components/landing/MasraAssistant';

const source = (path: string) => readFileSync(path, 'utf8');

describe('marketing content and honest preview boundaries', () => {
  it('provides matching Arabic and English landing/contact keys', () => {
    const prefixes = ['hero.', 'contact.', 'how.', 'prod.', 'faq.', 'asst.', 'aichat.'];
    const selected = (locale: 'ar' | 'en') => Object.keys(DICTIONARIES[locale]).filter(k => prefixes.some(p => k.startsWith(p))).sort();
    expect(selected('ar')).toEqual(selected('en'));
    expect(translate('ar', 'hero.eyebrow')).toContain('القرآن');
    expect(translate('en', 'hero.eyebrow')).toContain('Quran');
  });

  it('does not collect contact data while the future AI representative is unavailable', () => {
    const contact = source('src/app/contact/page.tsx');
    expect(contact).not.toMatch(/<form|<input|<textarea|fetch\(/);
    expect(contact).not.toContain('+90 000');
    expect(translate('ar', 'contact.detail')).toContain('ليست متاحة الآن');
    expect(translate('en', 'contact.detail')).toContain('not available yet');
  });

  it('uses preview labels and never calls a purchase endpoint', () => {
    const pricing = source('src/components/landing/PricingPreview.tsx');
    expect(pricing).toContain('استعرض الباقة');
    expect(pricing).not.toContain('اشترك الآن');
    expect(pricing).not.toMatch(/fetch\(/);
    expect(pricing).toContain('لم يُرسل طلب');
  });

  it('keeps the FAQ consistent with live self-serve signup', () => {
    expect(translate('ar', 'faq.a1')).toContain('إنشاء حساب');
    expect(translate('en', 'faq.a1')).toContain('sign-up');
    for (const l of ['ar', 'en'] as const) expect(translate(l, 'faq.a1')).not.toMatch(/not enabled in this preview|غير مفعّلين في هذا العرض/);
  });

  it('links contact to the contact page and removes numeric security guarantees', () => {
    const home = source('src/app/page.tsx');
    expect(home).toContain('href="/contact"');
    expect(home).not.toContain('<strong>100%</strong>');
  });

  it.each([
    ['ar', 'هل يوجد ربط واتساب؟', 'خارطة الطريق'],
    ['en', 'WhatsApp integration?', 'roadmap'],
    ['ar', 'كيف ابدأ؟', 'إنشاء حساب'],
    ['ar', 'كيف أبدأ؟', 'إنشاء حساب'],
    ['en', 'How do I start?', 'sign-up page'],
    ['ar', 'كيف أبدأ؟', 'الدفع غير مفعّل'],
    ['en', 'How do I start?', 'Payments are not enabled'],
    ['ar', 'هل أنت ذكاء اصطناعي؟', 'إجابات جاهزة'],
    ['en', 'Are you AI?', 'prepared replies'],
    ['ar', 'هل يخدم الجمعيات الخيرية؟', 'ليست متاحة للاشتراك'],
    ['en', 'Is it for charities?', 'not currently available'],
  ] as const)('keeps %s guide answers accurate: %s', (locale, question, expected) => {
    expect(getLandingReply(locale, question)).toContain(expected);
  });
});
