'use client';

import { useState } from 'react';
import { Field, TextAreaField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';

export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const res = await fetch(
        `/api/contact`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      setStatus(res.ok ? 'done' : 'error');
      if (res.ok) (e.target as HTMLFormElement).reset();
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div className="rounded-2xl border border-line bg-paper p-8 text-center">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-gold-100 text-maroon-700">
          <Icon name="shield-check" size={26} />
        </span>
        <h3 className="mt-4 text-xl">Thank you for reaching out</h3>
        <p className="mt-2 text-ink-soft">
          We have received your message and will respond within one working day.
        </p>
        <Button className="mt-6" variant="outline" onClick={() => setStatus('idle')}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-line bg-paper p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" id="name" name="name" required placeholder="Jane Doe" />
        <Field label="Email" id="email" name="email" type="email" required placeholder="jane@example.com" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Phone" id="phone" name="phone" placeholder="+256 …" />
        <Field label="Subject" id="subject" name="subject" placeholder="Admissions enquiry" />
      </div>
      <TextAreaField label="Message" id="message" name="message" required placeholder="How can we help?" />
      <Button type="submit" size="lg" icon="arrow-right" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </Button>
      {status === 'error' ? (
        <p className="text-sm text-maroon-600">Something went wrong. Please try again or call us.</p>
      ) : null}
    </form>
  );
}
