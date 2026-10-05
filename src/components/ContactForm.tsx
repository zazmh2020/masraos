'use client';

import { useState, type FormEvent } from 'react';
import Icon from '@/components/Icon';

export default function ContactForm() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="contact-row">
        <div>
          <label htmlFor="name">الاسم الكامل</label>
          <input id="name" name="name" type="text" required />
        </div>
        <div>
          <label htmlFor="org">اسم المؤسسة</label>
          <input id="org" name="org" type="text" />
        </div>
      </div>

      <div>
        <label htmlFor="email">البريد الإلكتروني</label>
        <input id="email" name="email" type="email" dir="ltr" required />
      </div>

      <div>
        <label htmlFor="subject">الموضوع</label>
        <input id="subject" name="subject" type="text" required />
      </div>

      <div>
        <label htmlFor="message">رسالتك</label>
        <textarea id="message" name="message" required />
      </div>

      <button className="btn btn-primary" type="submit">
        {sent ? <>تم الإرسال <Icon name="check" size={16} /></> : 'إرسال الرسالة'}
      </button>
    </form>
  );
}
