'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Field, TextAreaField, SelectField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { uploadFile, FileUpload } from '@/components/admin/FileUpload';
import { siteDefaults, type SiteConfig, type PageHeadKey } from '@/lib/site';
import type { IconName } from '@/components/Icon';

const API = ''; // same-origin; proxied to the backend

const inputCls =
  'w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink shadow-sm transition-colors placeholder:text-ink-muted focus:border-maroon-500 focus:outline-none focus:ring-2 focus:ring-maroon-500/20';

// Icons offered for the homepage cards.
const ICONS: IconName[] = [
  'heart-hand', 'book-open', 'graduation-cap', 'trophy', 'shield-check', 'globe',
  'palette', 'flask', 'music', 'users', 'sparkle', 'quote', 'map-pin', 'phone',
  'mail', 'image', 'video', 'briefcase', 'download', 'megaphone', 'calendar', 'bell',
];

const TABS = ['Brand', 'Hero', 'Homepage', 'Page heads', 'Footer', 'Categories', 'Contact'] as const;
type Tab = (typeof TABS)[number];

const PAGE_HEADS: { key: PageHeadKey; label: string }[] = [
  { key: 'about', label: 'About' },
  { key: 'academics', label: 'Academics' },
  { key: 'admissions', label: 'Admissions' },
  { key: 'news', label: 'News & Events' },
  { key: 'gallery', label: 'Gallery / Media' },
  { key: 'alumni', label: 'Alumni' },
  { key: 'careers', label: 'Careers' },
  { key: 'contact', label: 'Contact' },
  { key: 'virtual-tour', label: 'Virtual Tour' },
  { key: 'live', label: 'Live TV' },
  { key: 'downloads', label: 'Downloads' },
];

function Card({ title, desc, onSave, children }: { title: string; desc?: string; onSave?: () => Promise<void> | void; children: React.ReactNode }) {
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  return (
    <section className="rounded-2xl border border-line bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg text-maroon-900">{title}</h2>
          {desc ? <p className="mt-1 text-sm text-ink-soft">{desc}</p> : null}
        </div>
        {onSave ? (
          <button
            type="button"
            disabled={saving}
            onClick={async () => { setSaving(true); await onSave(); setSaving(false); setDone(true); setTimeout(() => setDone(false), 2000); }}
            className="shrink-0 rounded-full bg-maroon-700 px-4 py-2 text-sm font-medium text-white hover:bg-maroon-800 disabled:opacity-50"
          >
            {saving ? 'Saving…' : done ? 'Saved ✓' : 'Save'}
          </button>
        ) : null}
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function ImageInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      <div className="flex gap-2">
        <input className={inputCls} value={value} placeholder="Paste an image URL or upload" onChange={(e) => onChange(e.target.value)} />
        <label className="shrink-0 cursor-pointer rounded-xl border border-line px-3 py-2.5 text-sm font-medium text-maroon-700 hover:bg-maroon-50">
          {busy ? 'Uploading…' : 'Upload'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy(true); setErr('');
              try { onChange(await uploadFile(f)); } catch (e) { setErr((e as Error).message); }
              setBusy(false);
            }}
          />
        </label>
      </div>
      {err ? <p className="mt-1 text-xs text-rose-600">{err}</p> : null}
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="mt-2 h-20 w-32 rounded-lg border border-line object-cover" />
      ) : null}
    </div>
  );
}

function StringList({ label, items, onChange, placeholder }: { label: string; items: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2">
            <input className={inputCls} value={it} placeholder={placeholder} onChange={(e) => { const n = [...items]; n[i] = e.target.value; onChange(n); }} />
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="shrink-0 rounded-lg px-3 text-sm text-rose-600 hover:bg-rose-50">Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...items, ''])} className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-maroon-700 hover:bg-maroon-50">+ Add</button>
      </div>
    </div>
  );
}

function Repeater<T>({ items, onChange, blank, addLabel, children }: {
  items: T[];
  onChange: (v: T[]) => void;
  blank: () => T;
  addLabel: string;
  children: (item: T, update: (patch: Partial<T>) => void, index: number) => React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="relative rounded-xl border border-line p-4 pt-9">
          <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="absolute right-3 top-3 text-xs font-medium text-rose-600 hover:underline">Remove</button>
          <div className="space-y-3">{children(item, (patch) => { const n = [...items]; n[i] = { ...n[i], ...patch }; onChange(n); }, i)}</div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, blank()])} className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-maroon-700 hover:bg-maroon-50">{addLabel}</button>
    </div>
  );
}

function IconSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <SelectField label="Icon" id={`icon-${Math.random()}`} value={value} onChange={(e) => onChange(e.target.value)}>
      {ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
    </SelectField>
  );
}

export function SettingsForm() {
  const [cfg, setCfg] = useState<SiteConfig>(siteDefaults);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'saved' | 'error'>('loading');
  const [tab, setTab] = useState<Tab>('Brand');

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
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(cfg),
      });
      setStatus(res.ok ? 'saved' : 'error');
    } catch {
      setStatus('error');
    }
  }

  const h = cfg.home;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-maroon-900">Content & Settings</h1>
          <p className="mt-1 text-sm text-ink-soft">Everything shown on the public website — text, images and links — edited in one place.</p>
        </div>
        <div className="flex items-center gap-3">
          {status === 'saved' ? <span className="text-sm font-medium text-emerald-600">Saved</span> : null}
          {status === 'error' ? <span className="text-sm font-medium text-rose-600">Could not save (sign in again)</span> : null}
          <Button onClick={save} disabled={status === 'saving' || status === 'loading'}>
            {status === 'saving' ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`-mb-px rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${tab === t ? 'border-b-2 border-maroon-700 text-maroon-800' : 'text-ink-muted hover:text-maroon-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {tab === 'Brand' ? (
          <>
            <Card onSave={save} title="School badge & logo" desc="The crest shown in the header and footer. Paste a URL or upload.">
              <div className="flex items-center gap-4">
                <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-line bg-paper">
                  <Image src={cfg.brand.logoUrl} alt="Logo preview" width={64} height={64} className="h-full w-full object-contain" unoptimized />
                </span>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => patch((d) => { d.brand.logoUrl = '/cps.png'; })} className="rounded-full border border-line px-3 py-1.5 text-sm hover:bg-maroon-50">Badge 1</button>
                  <button type="button" onClick={() => patch((d) => { d.brand.logoUrl = '/cps11.png'; })} className="rounded-full border border-line px-3 py-1.5 text-sm hover:bg-maroon-50">Badge 2</button>
                </div>
              </div>
              <ImageInput label="Logo image" value={cfg.brand.logoUrl} onChange={(v) => patch((d) => { d.brand.logoUrl = v; d.brand.logoLightUrl = v; })} />
              <SelectField label="Colour theme" id="theme" value={cfg.brand.theme} onChange={(e) => patch((d) => { d.brand.theme = e.target.value as SiteConfig['brand']['theme']; })}>
                <option value="slate">Maroon, White &amp; Grey (default)</option>
                <option value="gold">Maroon, Gold &amp; White (classic)</option>
              </SelectField>
            </Card>

            <Card onSave={save} title="Identity & SEO" desc="School name, location and the description used in the footer and search results.">
              <Field label="School name" id="name" value={cfg.brand.name} onChange={(e) => patch((d) => { d.brand.name = e.target.value; })} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Locality" id="locality" value={cfg.brand.locality} onChange={(e) => patch((d) => { d.brand.locality = e.target.value; })} />
                <Field label="Founded" id="founded" value={cfg.brand.foundingYear} onChange={(e) => patch((d) => { d.brand.foundingYear = e.target.value; })} />
              </div>
              <Field label="Tagline" id="tagline" value={cfg.tagline} onChange={(e) => patch((d) => { d.tagline = e.target.value; })} />
              <TextAreaField label="Description (footer & SEO)" id="description" value={cfg.description} onChange={(e) => patch((d) => { d.description = e.target.value; })} />
            </Card>
          </>
        ) : null}

        {tab === 'Hero' ? (
          <Card onSave={save} title="Homepage hero" desc="The large banner at the top of the home page.">
            <Field label="Eyebrow" id="eyebrow" value={cfg.hero.eyebrow} onChange={(e) => patch((d) => { d.hero.eyebrow = e.target.value; })} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Headline line 1" id="tl" value={cfg.hero.titleLead} onChange={(e) => patch((d) => { d.hero.titleLead = e.target.value; })} />
              <Field label="Headline line 2 (accent)" id="ta" value={cfg.hero.titleAccent} onChange={(e) => patch((d) => { d.hero.titleAccent = e.target.value; })} />
            </div>
            <TextAreaField label="Intro" id="hintro" value={cfg.hero.intro} onChange={(e) => patch((d) => { d.hero.intro = e.target.value; })} />
            <FileUpload label="Background video (upload an mp4 or paste a URL — autoplays, muted, looped; leave empty to use the image)" accept="video/*" value={cfg.hero.backgroundVideo} onChange={(url) => patch((d) => { d.hero.backgroundVideo = url; })} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Primary button" id="hpc" value={cfg.hero.primaryCta.label} onChange={(e) => patch((d) => { d.hero.primaryCta.label = e.target.value; })} />
              <Field label="Primary link" id="hpl" value={cfg.hero.primaryCta.href} onChange={(e) => patch((d) => { d.hero.primaryCta.href = e.target.value; })} />
              <Field label="Secondary button" id="hsc" value={cfg.hero.secondaryCta.label} onChange={(e) => patch((d) => { d.hero.secondaryCta.label = e.target.value; })} />
              <Field label="Secondary link" id="hsl" value={cfg.hero.secondaryCta.href} onChange={(e) => patch((d) => { d.hero.secondaryCta.href = e.target.value; })} />
            </div>
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
        ) : null}

        {tab === 'Homepage' ? (
          <>
            <Card onSave={save} title="Welcome section" desc="The introduction block with a feature image and highlights.">
              <Field label="Eyebrow" id="w-eb" value={h.welcome.eyebrow} onChange={(e) => patch((d) => { d.home.welcome.eyebrow = e.target.value; })} />
              <Field label="Title" id="w-t" value={h.welcome.title} onChange={(e) => patch((d) => { d.home.welcome.title = e.target.value; })} />
              <TextAreaField label="Intro" id="w-i" value={h.welcome.intro} onChange={(e) => patch((d) => { d.home.welcome.intro = e.target.value; })} />
              <ImageInput label="Feature image" value={h.welcome.image} onChange={(v) => patch((d) => { d.home.welcome.image = v; })} />
              <StringList label="Highlights" items={h.welcome.bullets} placeholder="A highlight about the school" onChange={(v) => patch((d) => { d.home.welcome.bullets = v; })} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Stat value" id="w-sv" value={h.welcome.statValue} placeholder="98%" onChange={(e) => patch((d) => { d.home.welcome.statValue = e.target.value; })} />
                <Field label="Stat label" id="w-sl" value={h.welcome.statLabel} onChange={(e) => patch((d) => { d.home.welcome.statLabel = e.target.value; })} />
                <Field label="Primary button" id="w-pc" value={h.welcome.primaryCta.label} onChange={(e) => patch((d) => { d.home.welcome.primaryCta.label = e.target.value; })} />
                <Field label="Primary link" id="w-pl" value={h.welcome.primaryCta.href} onChange={(e) => patch((d) => { d.home.welcome.primaryCta.href = e.target.value; })} />
                <Field label="Secondary button" id="w-sc" value={h.welcome.secondaryCta.label} onChange={(e) => patch((d) => { d.home.welcome.secondaryCta.label = e.target.value; })} />
                <Field label="Secondary link" id="w-sl2" value={h.welcome.secondaryCta.href} onChange={(e) => patch((d) => { d.home.welcome.secondaryCta.href = e.target.value; })} />
              </div>
            </Card>

            <Card onSave={save} title="Academic pathways" desc="The three programme cards. Leave empty to hide the section.">
              <Field label="Eyebrow" id="p-eb" value={h.pathways.eyebrow} onChange={(e) => patch((d) => { d.home.pathways.eyebrow = e.target.value; })} />
              <Field label="Title" id="p-t" value={h.pathways.title} onChange={(e) => patch((d) => { d.home.pathways.title = e.target.value; })} />
              <TextAreaField label="Intro" id="p-i" value={h.pathways.intro} onChange={(e) => patch((d) => { d.home.pathways.intro = e.target.value; })} />
              <Repeater
                items={h.pathways.items}
                onChange={(v) => patch((d) => { d.home.pathways.items = v; })}
                blank={() => ({ name: '', icon: 'book-open' as IconName, age: '', blurb: '', href: '/academics' })}
                addLabel="+ Add pathway"
              >
                {(item, update) => (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Name" id={`pn-${item.name}`} value={item.name} onChange={(e) => update({ name: e.target.value })} />
                      <IconSelect value={item.icon} onChange={(v) => update({ icon: v as IconName })} />
                    </div>
                    <Field label="Age range / subtitle" id={`pa-${item.name}`} value={item.age} onChange={(e) => update({ age: e.target.value })} />
                    <TextAreaField label="Blurb" id={`pb-${item.name}`} value={item.blurb} onChange={(e) => update({ blurb: e.target.value })} />
                    <Field label="Link" id={`ph-${item.name}`} value={item.href} onChange={(e) => update({ href: e.target.value })} />
                  </>
                )}
              </Repeater>
            </Card>

            <Card onSave={save} title="Why City Parents" desc="The feature/value cards. Leave empty to hide the section.">
              <Field label="Eyebrow" id="y-eb" value={h.why.eyebrow} onChange={(e) => patch((d) => { d.home.why.eyebrow = e.target.value; })} />
              <Field label="Title" id="y-t" value={h.why.title} onChange={(e) => patch((d) => { d.home.why.title = e.target.value; })} />
              <Repeater
                items={h.why.items}
                onChange={(v) => patch((d) => { d.home.why.items = v; })}
                blank={() => ({ title: '', icon: 'sparkle' as IconName, body: '' })}
                addLabel="+ Add value"
              >
                {(item, update) => (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Title" id={`yt-${item.title}`} value={item.title} onChange={(e) => update({ title: e.target.value })} />
                      <IconSelect value={item.icon} onChange={(v) => update({ icon: v as IconName })} />
                    </div>
                    <TextAreaField label="Body" id={`yb-${item.title}`} value={item.body} onChange={(e) => update({ body: e.target.value })} />
                  </>
                )}
              </Repeater>
            </Card>

            <Card onSave={save} title="Admissions banner" desc="The maroon call-to-action band.">
              <Field label="Eyebrow" id="a-eb" value={h.admissionsCta.eyebrow} onChange={(e) => patch((d) => { d.home.admissionsCta.eyebrow = e.target.value; })} />
              <Field label="Title" id="a-t" value={h.admissionsCta.title} onChange={(e) => patch((d) => { d.home.admissionsCta.title = e.target.value; })} />
              <TextAreaField label="Intro" id="a-i" value={h.admissionsCta.intro} onChange={(e) => patch((d) => { d.home.admissionsCta.intro = e.target.value; })} />
              <ImageInput label="Background image" value={h.admissionsCta.image} onChange={(v) => patch((d) => { d.home.admissionsCta.image = v; })} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Primary button" id="a-pc" value={h.admissionsCta.primaryCta.label} onChange={(e) => patch((d) => { d.home.admissionsCta.primaryCta.label = e.target.value; })} />
                <Field label="Primary link" id="a-pl" value={h.admissionsCta.primaryCta.href} onChange={(e) => patch((d) => { d.home.admissionsCta.primaryCta.href = e.target.value; })} />
                <Field label="Secondary button" id="a-sc" value={h.admissionsCta.secondaryCta.label} onChange={(e) => patch((d) => { d.home.admissionsCta.secondaryCta.label = e.target.value; })} />
                <Field label="Secondary link" id="a-sl" value={h.admissionsCta.secondaryCta.href} onChange={(e) => patch((d) => { d.home.admissionsCta.secondaryCta.href = e.target.value; })} />
              </div>
            </Card>

            <Card onSave={save} title="News heading & Testimonials">
              <div className="grid grid-cols-2 gap-4">
                <Field label="News eyebrow" id="n-eb" value={h.news.eyebrow} onChange={(e) => patch((d) => { d.home.news.eyebrow = e.target.value; })} />
                <Field label="News title" id="n-t" value={h.news.title} onChange={(e) => patch((d) => { d.home.news.title = e.target.value; })} />
                <Field label="Testimonials eyebrow" id="t-eb" value={h.testimonials.eyebrow} onChange={(e) => patch((d) => { d.home.testimonials.eyebrow = e.target.value; })} />
                <Field label="Testimonials title" id="t-t" value={h.testimonials.title} onChange={(e) => patch((d) => { d.home.testimonials.title = e.target.value; })} />
              </div>
              <Repeater
                items={h.testimonials.items}
                onChange={(v) => patch((d) => { d.home.testimonials.items = v; })}
                blank={() => ({ quote: '', name: '', role: '' })}
                addLabel="+ Add testimonial"
              >
                {(item, update) => (
                  <>
                    <TextAreaField label="Quote" id={`tq-${item.name}`} value={item.quote} onChange={(e) => update({ quote: e.target.value })} />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Name" id={`tn-${item.name}`} value={item.name} onChange={(e) => update({ name: e.target.value })} />
                      <Field label="Role" id={`tr-${item.name}`} value={item.role} onChange={(e) => update({ role: e.target.value })} />
                    </div>
                  </>
                )}
              </Repeater>
            </Card>

            <Card onSave={save} title="Plan a visit">
              <Field label="Eyebrow" id="v-eb" value={h.visit.eyebrow} onChange={(e) => patch((d) => { d.home.visit.eyebrow = e.target.value; })} />
              <Field label="Title" id="v-t" value={h.visit.title} onChange={(e) => patch((d) => { d.home.visit.title = e.target.value; })} />
              <TextAreaField label="Intro" id="v-i" value={h.visit.intro} onChange={(e) => patch((d) => { d.home.visit.intro = e.target.value; })} />
              <Field label="Office hours" id="v-oh" value={h.visit.officeHours} onChange={(e) => patch((d) => { d.home.visit.officeHours = e.target.value; })} />
            </Card>
          </>
        ) : null}

        {tab === 'Page heads' ? (
          <Card onSave={save} title="Page header banners" desc="Each inner page's banner. Turn one off to hide it, or edit its text and background image.">
            {PAGE_HEADS.map(({ key, label }) => {
              const ph = cfg.pageHeads[key];
              return (
                <div key={key} className="rounded-xl border border-line p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-maroon-800">{label}</h3>
                    <label className="flex items-center gap-2 text-sm text-ink-soft">
                      <input type="checkbox" checked={ph.show} onChange={(e) => patch((d) => { d.pageHeads[key].show = e.target.checked; })} />
                      Show banner
                    </label>
                  </div>
                  {ph.show ? (
                    <div className="mt-3 space-y-3">
                      <Field label="Eyebrow" id={`ph-eb-${key}`} value={ph.eyebrow ?? ''} onChange={(e) => patch((d) => { d.pageHeads[key].eyebrow = e.target.value; })} />
                      <Field label="Title" id={`ph-t-${key}`} value={ph.title ?? ''} onChange={(e) => patch((d) => { d.pageHeads[key].title = e.target.value; })} />
                      <TextAreaField label="Intro" id={`ph-i-${key}`} value={ph.intro ?? ''} onChange={(e) => patch((d) => { d.pageHeads[key].intro = e.target.value; })} />
                      <ImageInput label="Background image" value={ph.image ?? ''} onChange={(v) => patch((d) => { d.pageHeads[key].image = v; })} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </Card>
        ) : null}

        {tab === 'Footer' ? (
          <Card onSave={save} title="Footer link columns" desc="The grouped link lists in the site footer.">
            <Repeater
              items={cfg.footer.columns}
              onChange={(v) => patch((d) => { d.footer.columns = v; })}
              blank={() => ({ heading: 'New column', links: [] })}
              addLabel="+ Add column"
            >
              {(col, update) => (
                <>
                  <Field label="Heading" id={`fc-${col.heading}`} value={col.heading} onChange={(e) => update({ heading: e.target.value })} />
                  <Repeater
                    items={col.links}
                    onChange={(links) => update({ links })}
                    blank={() => ({ label: '', href: '/' })}
                    addLabel="+ Add link"
                  >
                    {(lnk, updateLink) => (
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Label" id={`fl-${lnk.label}`} value={lnk.label} onChange={(e) => updateLink({ label: e.target.value })} />
                        <Field label="Link" id={`fh-${lnk.label}`} value={lnk.href} onChange={(e) => updateLink({ href: e.target.value })} />
                      </div>
                    )}
                  </Repeater>
                </>
              )}
            </Repeater>
          </Card>
        ) : null}

        {tab === 'Categories' ? (
          <Card onSave={save} title="Content categories" desc="The dropdown options used when creating albums, news and events. Add or remove freely.">
            <StringList label="Gallery categories" items={cfg.taxonomies.galleryCategories} placeholder="e.g. Sports" onChange={(v) => patch((d) => { d.taxonomies.galleryCategories = v; })} />
            <StringList label="News categories" items={cfg.taxonomies.newsCategories} placeholder="e.g. Achievement" onChange={(v) => patch((d) => { d.taxonomies.newsCategories = v; })} />
            <StringList label="Event categories" items={cfg.taxonomies.eventCategories} placeholder="e.g. Sports" onChange={(v) => patch((d) => { d.taxonomies.eventCategories = v; })} />
          </Card>
        ) : null}

        {tab === 'Contact' ? (
          <>
            <Card onSave={save} title="Contact & address" desc="Shown in the header bar, footer and contact page.">
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

            <Card onSave={save} title="Social media links" desc="Used in the header, footer and social wall.">
              {cfg.social.map((s, i) => (
                <Field key={s.network} label={s.label} id={`social-${s.network}`} value={s.href} placeholder={`https://${s.network}.com/...`} onChange={(e) => patch((d) => { d.social[i].href = e.target.value; })} />
              ))}
            </Card>
          </>
        ) : null}
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
