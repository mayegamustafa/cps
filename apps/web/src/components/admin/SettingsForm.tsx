'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Field, TextAreaField, SelectField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';
import { siteDefaults, type SiteConfig } from '@/lib/site';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function Card({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-6">
      <h2 className="font-display text-lg text-maroon-900">{title}</h2>
      <p className="mt-1 text-sm text-ink-soft">{desc}</p>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

export function SettingsForm() {
  const [cfg, setCfg] = useState<SiteConfig>(siteDefaults);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'saved' | 'error'>('loading');

  // Load saved settings (merged over defaults) on mount.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/settings`);
        if (res.ok) {
          const saved = await res.json();
          setCfg((prev) => deepMerge(prev, saved));
        }
      } catch {
        /* API offline: keep defaults */
      }
      setStatus('idle');
    })();
  }, []);

  function patch(updater: (draft: SiteConfig) => void) {
    setCfg((prev) => {
      const next = structuredClone(prev);
      updater(next);
      return next;
    });
  }

  async function save() {
    setStatus('saving');
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('cps_token') : null;
      const res = await fetch(`${API}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(cfg),
      });
      setStatus(res.ok ? 'saved' : 'error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-maroon-900">Settings & SEO</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Edit the school identity, logo, hero and contact details shown across the public website.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {status === 'saved' ? <span className="text-sm font-medium text-emerald-600">Saved</span> : null}
          {status === 'error' ? <span className="text-sm font-medium text-rose-600">Could not save (sign in again)</span> : null}
          <Button onClick={save} disabled={status === 'saving' || status === 'loading'}>
            {status === 'saving' ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="School badge & logo" desc="The crest shown in the header and footer. Paste a URL or use a bundled badge.">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-line bg-paper">
              <Image src={cfg.brand.logoUrl} alt="Logo preview" width={64} height={64} className="h-full w-full object-contain" unoptimized />
            </span>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => patch((d) => { d.brand.logoUrl = '/cps.png'; })} className="rounded-full border border-line px-3 py-1.5 text-sm hover:bg-maroon-50">Badge 1</button>
              <button type="button" onClick={() => patch((d) => { d.brand.logoUrl = '/cps11.png'; })} className="rounded-full border border-line px-3 py-1.5 text-sm hover:bg-maroon-50">Badge 2</button>
            </div>
          </div>
          <Field label="Logo URL" id="logoUrl" value={cfg.brand.logoUrl} onChange={(e) => patch((d) => { d.brand.logoUrl = e.target.value; })} />
          <p className="text-xs text-ink-muted">Uploading custom files routes to Cloudflare R2 once storage is connected.</p>

          <SelectField
            label="Colour theme"
            id="theme"
            value={cfg.brand.theme}
            onChange={(e) => patch((d) => { d.brand.theme = e.target.value as SiteConfig['brand']['theme']; })}
          >
            <option value="slate">Maroon, White &amp; Grey (default)</option>
            <option value="gold">Maroon, Gold &amp; White (classic)</option>
          </SelectField>
          <div className="flex gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs">
              <span className="h-3 w-3 rounded-full" style={{ background: '#6e1f23' }} />
              <span className="h-3 w-3 rounded-full" style={{ background: cfg.brand.theme === 'gold' ? '#d4af37' : '#64748b' }} />
              <span className="h-3 w-3 rounded-full border border-line" style={{ background: '#ffffff' }} />
              Live preview after save
            </span>
          </div>
        </Card>

        <Card title="Identity" desc="School name, location and strapline.">
          <Field label="School name" id="name" value={cfg.brand.name} onChange={(e) => patch((d) => { d.brand.name = e.target.value; })} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Locality" id="locality" value={cfg.brand.locality} onChange={(e) => patch((d) => { d.brand.locality = e.target.value; })} />
            <Field label="Founded" id="founded" value={cfg.brand.foundingYear} onChange={(e) => patch((d) => { d.brand.foundingYear = e.target.value; })} />
          </div>
          <Field label="Tagline" id="tagline" value={cfg.tagline} onChange={(e) => patch((d) => { d.tagline = e.target.value; })} />
          <TextAreaField label="Description (used in footer & SEO)" id="description" value={cfg.description} onChange={(e) => patch((d) => { d.description = e.target.value; })} />
        </Card>

        <Card title="Homepage hero" desc="The large banner at the top of the home page.">
          <Field label="Eyebrow" id="eyebrow" value={cfg.hero.eyebrow} onChange={(e) => patch((d) => { d.hero.eyebrow = e.target.value; })} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Headline line 1" id="tl" value={cfg.hero.titleLead} onChange={(e) => patch((d) => { d.hero.titleLead = e.target.value; })} />
            <Field label="Headline line 2 (gold)" id="ta" value={cfg.hero.titleAccent} onChange={(e) => patch((d) => { d.hero.titleAccent = e.target.value; })} />
          </div>
          <TextAreaField label="Intro" id="hintro" value={cfg.hero.intro} onChange={(e) => patch((d) => { d.hero.intro = e.target.value; })} />
          <div className="grid grid-cols-3 gap-3">
            {cfg.hero.stats.map((s, i) => (
              <div key={i} className="space-y-2 rounded-xl border border-line p-3">
                <Field label="Value" id={`sv${i}`} value={s.value} onChange={(e) => patch((d) => { d.hero.stats[i].value = e.target.value; })} />
                <Field label="Label" id={`sl${i}`} value={s.label} onChange={(e) => patch((d) => { d.hero.stats[i].label = e.target.value; })} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Live card status" id="ls" value={cfg.hero.live.status} onChange={(e) => patch((d) => { d.hero.live.status = e.target.value; })} />
            <Field label="Live card message" id="lm" value={cfg.hero.live.message} onChange={(e) => patch((d) => { d.hero.live.message = e.target.value; })} />
          </div>
        </Card>

        <Card title="Contact & address" desc="Shown in the header bar, footer and contact page.">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone" id="phone" value={cfg.contact.phone} onChange={(e) => patch((d) => { d.contact.phone = e.target.value; })} />
            <Field label="WhatsApp number" id="wa" value={cfg.contact.whatsapp} onChange={(e) => patch((d) => { d.contact.whatsapp = e.target.value; })} />
          </div>
          <Field label="Email" id="email" type="email" value={cfg.contact.email} onChange={(e) => patch((d) => { d.contact.email = e.target.value; })} />
          <Field label="Street / road" id="line1" value={cfg.address.line1} onChange={(e) => patch((d) => { d.address.line1 = e.target.value; })} />
          <div className="grid grid-cols-3 gap-4">
            <Field label="P.O. Box" id="pobox" value={cfg.address.poBox} onChange={(e) => patch((d) => { d.address.poBox = e.target.value; })} />
            <Field label="City" id="city" value={cfg.address.city} onChange={(e) => patch((d) => { d.address.city = e.target.value; })} />
            <Field label="Country" id="country" value={cfg.address.country} onChange={(e) => patch((d) => { d.address.country = e.target.value; })} />
          </div>
        </Card>

        <Card title="Social media links" desc="Database-driven links shown in the header, footer and social wall. Update once, reflected everywhere.">
          {cfg.social.map((s, i) => (
            <Field
              key={s.network}
              label={s.label}
              id={`social-${s.network}`}
              value={s.href}
              placeholder={`https://${s.network}.com/...`}
              onChange={(e) => patch((d) => { d.social[i].href = e.target.value; })}
            />
          ))}
        </Card>
      </div>
    </>
  );
}

// Local deep-merge (saved settings over defaults), arrays replaced wholesale.
function deepMerge<T>(base: T, override: unknown): T {
  if (typeof override !== 'object' || override === null || Array.isArray(override)) {
    return (override as T) ?? base;
  }
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(override as Record<string, unknown>)) {
    const b = (base as Record<string, unknown>)[k];
    out[k] = typeof b === 'object' && b !== null && !Array.isArray(b) ? deepMerge(b, v) : v;
  }
  return out as T;
}
