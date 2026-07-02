'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Field, TextAreaField, SelectField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { uploadFile, FileUpload } from '@/components/admin/FileUpload';
import { siteDefaults, type SiteConfig, type PageHeadKey } from '@/lib/site';
import { FieldDesigner, type FormField } from '@/components/admin/FieldDesigner';
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

const TABS = ['Brand', 'Hero', 'Homepage', 'About page', 'Academics page', 'Talent (TDP)', 'Virtual Tour', 'Live TV', 'Page heads', 'Website control', 'Footer', 'Categories', 'Admissions form', 'Contact'] as const;

const HOMEPAGE_SECTIONS: { key: keyof SiteConfig['sections']; label: string }[] = [
  { key: 'welcome', label: 'Welcome' },
  { key: 'pathways', label: 'Academic pathways' },
  { key: 'why', label: 'Why City Parents' },
  { key: 'admissionsCta', label: 'Admissions banner' },
  { key: 'news', label: 'Latest news' },
  { key: 'gallery', label: 'Captured moments (gallery)' },
  { key: 'testimonials', label: 'Testimonials' },
  { key: 'visit', label: 'Plan a visit' },
  { key: 'headTeacher', label: "Head Teacher's message" },
  { key: 'feeds', label: 'Social feeds (TikTok/Facebook/YouTube)' },
];

const PAGE_TOGGLES: { key: keyof SiteConfig['pages']; label: string }[] = [
  { key: 'about', label: 'About' },
  { key: 'academics', label: 'Academics' },
  { key: 'admissions', label: 'Admissions' },
  { key: 'news', label: 'News & Events' },
  { key: 'gallery', label: 'Gallery' },
  { key: 'alumni', label: 'Alumni' },
  { key: 'careers', label: 'Careers' },
  { key: 'contact', label: 'Contact' },
  { key: 'virtualTour', label: 'Virtual Tour' },
  { key: 'live', label: 'Live TV' },
  { key: 'downloads', label: 'Downloads' },
  { key: 'talent', label: 'Talent (TDP)' },
];
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
  { key: 'talent', label: 'Talent (TDP)' },
];

function Card({ title, desc, onSave, children }: { title: string; desc?: string; onSave?: () => Promise<boolean> | boolean | void; children: React.ReactNode }) {
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<'idle' | 'ok' | 'fail'>('idle');
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
            onClick={async () => {
              setSaving(true);
              const ok = await onSave();
              setSaving(false);
              setResult(ok === false ? 'fail' : 'ok');
              setTimeout(() => setResult('idle'), 3000);
            }}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${result === 'fail' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-maroon-700 hover:bg-maroon-800'}`}
          >
            {saving ? 'Saving…' : result === 'ok' ? 'Saved ✓' : result === 'fail' ? 'Failed — sign in again' : 'Save'}
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

  async function save(): Promise<boolean> {
    setStatus('saving');
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('cps_token') : null;
      const res = await fetch(`${API}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(cfg),
      });
      if (res.ok) {
        setStatus('saved');
        // Refresh the public site's cached config so changes appear immediately.
        fetch('/api/revalidate', { method: 'POST' }).catch(() => {});
        return true;
      }
      setStatus('error');
      return false;
    } catch {
      setStatus('error');
      return false;
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
                <option value="sun">Maroon, Yellow &amp; White (brand)</option>
                <option value="gold">Maroon, Gold &amp; White (classic)</option>
                <option value="crest">Maroon, Black &amp; Gold (crest)</option>
                <option value="slate">Maroon, White &amp; Grey</option>
                <option value="plain">Maroon &amp; White (minimal)</option>
                <option value="noir">Maroon, White &amp; Black (noir)</option>
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
            <ImageInput label="Hero background image (shown when no video is set)" value={cfg.hero.backgroundImage} onChange={(url) => patch((d) => { d.hero.backgroundImage = url; })} />
            <FileUpload label="Hero background video (optional — autoplays muted & looped; overrides the image when set)" accept="video/*" value={cfg.hero.backgroundVideo} onChange={(url) => patch((d) => { d.hero.backgroundVideo = url; })} />
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
                blank={() => ({ name: '', icon: 'book-open' as IconName, image: '', age: '', blurb: '', href: '/academics' })}
                addLabel="+ Add pathway"
              >
                {(item, update) => (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Name" id={`pn-${item.name}`} value={item.name} onChange={(e) => update({ name: e.target.value })} />
                      <IconSelect value={item.icon} onChange={(v) => update({ icon: v as IconName })} />
                    </div>
                    <ImageInput label="Image (optional — replaces the icon when set)" value={item.image ?? ''} onChange={(v) => update({ image: v })} />
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

            <Card onSave={save} title="Captured moments (gallery)" desc="Heading for the homepage photo strip. The photos come automatically from your latest gallery albums.">
              <Field label="Eyebrow" id="g-eb" value={h.gallery.eyebrow} onChange={(e) => patch((d) => { d.home.gallery.eyebrow = e.target.value; })} />
              <Field label="Title" id="g-t" value={h.gallery.title} onChange={(e) => patch((d) => { d.home.gallery.title = e.target.value; })} />
              <TextAreaField label="Intro" id="g-i" value={h.gallery.intro} onChange={(e) => patch((d) => { d.home.gallery.intro = e.target.value; })} />
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

            <Card onSave={save} title="Head Teacher's message" desc="Shown on the homepage with the head teacher's portrait.">
              <Field label="Eyebrow / section label" id="ht-eb" value={h.headTeacher.eyebrow} onChange={(e) => patch((d) => { d.home.headTeacher.eyebrow = e.target.value; })} />
              <TextAreaField label="Message" id="ht-msg" value={h.headTeacher.message} onChange={(e) => patch((d) => { d.home.headTeacher.message = e.target.value; })} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Name" id="ht-name" value={h.headTeacher.name} onChange={(e) => patch((d) => { d.home.headTeacher.name = e.target.value; })} />
                <Field label="Title" id="ht-title" value={h.headTeacher.title} onChange={(e) => patch((d) => { d.home.headTeacher.title = e.target.value; })} />
              </div>
              <ImageInput label="Portrait photo" value={h.headTeacher.image} onChange={(v) => patch((d) => { d.home.headTeacher.image = v; })} />
            </Card>

            <Card onSave={save} title="Social feeds" desc="Live embeds shown on the homepage. Leave a field blank to hide that feed.">
              <Field label="Section heading" id="fd-h" value={h.feeds.heading} onChange={(e) => patch((d) => { d.home.feeds.heading = e.target.value; })} />
              <Field label="TikTok username or profile URL" id="fd-tt" value={h.feeds.tiktok} placeholder="@sirapollokaggwaschools" onChange={(e) => patch((d) => { d.home.feeds.tiktok = e.target.value; })} />
              <Field label="Facebook page URL" id="fd-fb" value={h.feeds.facebook} placeholder="https://www.facebook.com/YourSchoolPage" onChange={(e) => patch((d) => { d.home.feeds.facebook = e.target.value; })} />
              <Field label="YouTube video or playlist URL" id="fd-yt" value={h.feeds.youtube} placeholder="https://www.youtube.com/watch?v=…" onChange={(e) => patch((d) => { d.home.feeds.youtube = e.target.value; })} />
            </Card>
          </>
        ) : null}

        {tab === 'About page' ? (
          <>
            <Card onSave={save} title="Our Story" desc="The opening section of the About page.">
              <Field label="Eyebrow" id="ab-eb" value={cfg.about.story.eyebrow} onChange={(e) => patch((d) => { d.about.story.eyebrow = e.target.value; })} />
              <Field label="Title" id="ab-t" value={cfg.about.story.title} onChange={(e) => patch((d) => { d.about.story.title = e.target.value; })} />
              <TextAreaField label="Intro" id="ab-i" value={cfg.about.story.intro} onChange={(e) => patch((d) => { d.about.story.intro = e.target.value; })} />
              <TextAreaField label="Body paragraph" id="ab-b" value={cfg.about.story.body} onChange={(e) => patch((d) => { d.about.story.body = e.target.value; })} />
              <ImageInput label="Story image" value={cfg.about.story.image} onChange={(v) => patch((d) => { d.about.story.image = v; })} />
            </Card>

            <Card onSave={save} title="Vision & Mission">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <Field label="Vision title" id="ab-vt" value={cfg.about.vision.title} onChange={(e) => patch((d) => { d.about.vision.title = e.target.value; })} />
                  <TextAreaField label="Vision" id="ab-vb" value={cfg.about.vision.body} onChange={(e) => patch((d) => { d.about.vision.body = e.target.value; })} />
                </div>
                <div className="space-y-3">
                  <Field label="Mission title" id="ab-mt" value={cfg.about.mission.title} onChange={(e) => patch((d) => { d.about.mission.title = e.target.value; })} />
                  <TextAreaField label="Mission" id="ab-mb" value={cfg.about.mission.body} onChange={(e) => patch((d) => { d.about.mission.body = e.target.value; })} />
                </div>
              </div>
            </Card>

            <Card onSave={save} title="Core values">
              <Repeater
                items={cfg.about.values}
                onChange={(v) => patch((d) => { d.about.values = v; })}
                blank={() => ({ title: '', icon: 'sparkle' as IconName, body: '' })}
                addLabel="+ Add value"
              >
                {(item, update) => (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Title" id={`av-t-${item.title}`} value={item.title} onChange={(e) => update({ title: e.target.value })} />
                      <IconSelect value={item.icon} onChange={(v) => update({ icon: v as IconName })} />
                    </div>
                    <TextAreaField label="Description" id={`av-b-${item.title}`} value={item.body} onChange={(e) => update({ body: e.target.value })} />
                  </>
                )}
              </Repeater>
            </Card>

            <Card onSave={save} title="Leadership team">
              <Repeater
                items={cfg.about.leadership}
                onChange={(v) => patch((d) => { d.about.leadership = v; })}
                blank={() => ({ name: '', title: '', bio: '', image: '' })}
                addLabel="+ Add leader"
              >
                {(item, update) => (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Name" id={`ld-n-${item.name}`} value={item.name} onChange={(e) => update({ name: e.target.value })} />
                      <Field label="Title / role" id={`ld-t-${item.name}`} value={item.title} onChange={(e) => update({ title: e.target.value })} />
                    </div>
                    <TextAreaField label="Bio" id={`ld-b-${item.name}`} value={item.bio} onChange={(e) => update({ bio: e.target.value })} />
                    <ImageInput label="Photo (optional — initials shown if empty)" value={item.image} onChange={(v) => update({ image: v })} />
                  </>
                )}
              </Repeater>
            </Card>
          </>
        ) : null}

        {tab === 'Academics page' ? (
          <>
            <Card onSave={save} title="Programme stages" desc="Pre-Primary, Lower & Upper Primary. Set an image to replace the icon on any card. Leave the list empty to hide the section.">
              <Repeater
                items={cfg.academics.stages}
                onChange={(v) => patch((d) => { d.academics.stages = v; })}
                blank={() => ({ name: '', age: '', icon: 'book-open' as IconName, image: '', summary: '', subjects: [], href: '/admissions' })}
                addLabel="+ Add stage"
              >
                {(item, update) => (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Name" id={`ac-n-${item.name}`} value={item.name} onChange={(e) => update({ name: e.target.value })} />
                      <IconSelect value={item.icon} onChange={(v) => update({ icon: v as IconName })} />
                    </div>
                    <ImageInput label="Image (optional — replaces the icon when set)" value={item.image ?? ''} onChange={(v) => update({ image: v })} />
                    <Field label="Age range / subtitle" id={`ac-a-${item.name}`} value={item.age} onChange={(e) => update({ age: e.target.value })} />
                    <TextAreaField label="Summary" id={`ac-s-${item.name}`} value={item.summary} onChange={(e) => update({ summary: e.target.value })} />
                    <StringList label="Subjects" items={item.subjects} placeholder="e.g. Mathematics" onChange={(v) => update({ subjects: v })} />
                    <Field label="Apply link" id={`ac-h-${item.name}`} value={item.href} onChange={(e) => update({ href: e.target.value })} />
                  </>
                )}
              </Repeater>
            </Card>

            <Card onSave={save} title="Day & Boarding" desc="The two arrangement cards. Set an image to replace the icon on any card. Leave the list empty to hide the section.">
              <Field label="Eyebrow" id="ac-db-eb" value={cfg.academics.dayBoarding.eyebrow} onChange={(e) => patch((d) => { d.academics.dayBoarding.eyebrow = e.target.value; })} />
              <Field label="Title" id="ac-db-t" value={cfg.academics.dayBoarding.title} onChange={(e) => patch((d) => { d.academics.dayBoarding.title = e.target.value; })} />
              <TextAreaField label="Intro" id="ac-db-i" value={cfg.academics.dayBoarding.intro} onChange={(e) => patch((d) => { d.academics.dayBoarding.intro = e.target.value; })} />
              <Repeater
                items={cfg.academics.dayBoarding.options}
                onChange={(v) => patch((d) => { d.academics.dayBoarding.options = v; })}
                blank={() => ({ name: '', icon: 'globe' as IconName, image: '', summary: '', features: [] })}
                addLabel="+ Add option"
              >
                {(item, update) => (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Name" id={`ac-db-n-${item.name}`} value={item.name} onChange={(e) => update({ name: e.target.value })} />
                      <IconSelect value={item.icon} onChange={(v) => update({ icon: v as IconName })} />
                    </div>
                    <ImageInput label="Image (optional — replaces the icon when set)" value={item.image ?? ''} onChange={(v) => update({ image: v })} />
                    <TextAreaField label="Summary" id={`ac-db-s-${item.name}`} value={item.summary} onChange={(e) => update({ summary: e.target.value })} />
                    <StringList label="Features" items={item.features} placeholder="e.g. GPS-tracked bus routes" onChange={(v) => update({ features: v })} />
                  </>
                )}
              </Repeater>
            </Card>

            <Card onSave={save} title="Learning resources" desc="The 'Beyond the classroom' cards. Set an image to replace the icon on any card. Leave the list empty to hide the section.">
              <Field label="Eyebrow" id="ac-r-eb" value={cfg.academics.resources.eyebrow} onChange={(e) => patch((d) => { d.academics.resources.eyebrow = e.target.value; })} />
              <Field label="Title" id="ac-r-t" value={cfg.academics.resources.title} onChange={(e) => patch((d) => { d.academics.resources.title = e.target.value; })} />
              <Repeater
                items={cfg.academics.resources.items}
                onChange={(v) => patch((d) => { d.academics.resources.items = v; })}
                blank={() => ({ title: '', icon: 'sparkle' as IconName, image: '', body: '' })}
                addLabel="+ Add resource"
              >
                {(item, update) => (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Title" id={`ac-r-n-${item.title}`} value={item.title} onChange={(e) => update({ title: e.target.value })} />
                      <IconSelect value={item.icon} onChange={(v) => update({ icon: v as IconName })} />
                    </div>
                    <ImageInput label="Image (optional — replaces the icon when set)" value={item.image ?? ''} onChange={(v) => update({ image: v })} />
                    <TextAreaField label="Description" id={`ac-r-b-${item.title}`} value={item.body} onChange={(e) => update({ body: e.target.value })} />
                  </>
                )}
              </Repeater>
            </Card>
          </>
        ) : null}

        {tab === 'Talent (TDP)' ? (
          <>
            <Card onSave={save} title="Talent Development Program — intro">
              <Field label="Eyebrow" id="tp-eb" value={cfg.talent.intro.eyebrow} onChange={(e) => patch((d) => { d.talent.intro.eyebrow = e.target.value; })} />
              <Field label="Title" id="tp-t" value={cfg.talent.intro.title} onChange={(e) => patch((d) => { d.talent.intro.title = e.target.value; })} />
              <TextAreaField label="Intro paragraph" id="tp-b" value={cfg.talent.intro.body} onChange={(e) => patch((d) => { d.talent.intro.body = e.target.value; })} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="CTA button label" id="tp-cl" value={cfg.talent.cta.label} onChange={(e) => patch((d) => { d.talent.cta.label = e.target.value; })} />
                <Field label="CTA link" id="tp-ch" value={cfg.talent.cta.href} onChange={(e) => patch((d) => { d.talent.cta.href = e.target.value; })} />
              </div>
            </Card>

            <Card onSave={save} title="Talent areas">
              <Repeater
                items={cfg.talent.areas}
                onChange={(v) => patch((d) => { d.talent.areas = v; })}
                blank={() => ({ title: '', icon: 'sparkle' as IconName, body: '' })}
                addLabel="+ Add area"
              >
                {(item, update) => (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Title" id={`ta-t-${item.title}`} value={item.title} onChange={(e) => update({ title: e.target.value })} />
                      <IconSelect value={item.icon} onChange={(v) => update({ icon: v as IconName })} />
                    </div>
                    <TextAreaField label="Description" id={`ta-b-${item.title}`} value={item.body} onChange={(e) => update({ body: e.target.value })} />
                  </>
                )}
              </Repeater>
            </Card>

            <Card onSave={save} title="Media (photos & videos)" desc="Each item shows on the Talent page with its description. Use an image, or a YouTube/MP4 link for video.">
              <Repeater
                items={cfg.talent.media}
                onChange={(v) => patch((d) => { d.talent.media = v; })}
                blank={() => ({ type: 'image' as const, url: '', title: '', description: '' })}
                addLabel="+ Add media"
              >
                {(item, update) => (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <SelectField label="Type" id={`tm-ty-${item.url}`} value={item.type} onChange={(e) => update({ type: e.target.value as 'image' | 'video' })}>
                        <option value="image">Photo</option>
                        <option value="video">Video</option>
                      </SelectField>
                      <Field label="Title" id={`tm-t-${item.url}`} value={item.title} onChange={(e) => update({ title: e.target.value })} />
                    </div>
                    {item.type === 'image' ? (
                      <ImageInput label="Photo" value={item.url} onChange={(v) => update({ url: v })} />
                    ) : (
                      <Field label="Video URL (YouTube or .mp4)" id={`tm-u-${item.url}`} value={item.url} placeholder="https://www.youtube.com/watch?v=…" onChange={(e) => update({ url: e.target.value })} />
                    )}
                    <TextAreaField label="Description" id={`tm-d-${item.url}`} value={item.description} onChange={(e) => update({ description: e.target.value })} />
                  </>
                )}
              </Repeater>
            </Card>
          </>
        ) : null}

        {tab === 'Virtual Tour' ? (
          <>
            <Card onSave={save} title="360° viewer" desc="Paste a tour embed link (Matterport, Google Street View, YouTube 360, etc.) to show the live tour. Leave it blank to show a poster image and a 'coming soon' badge. The page banner is edited under 'Page heads'.">
              <Field label="Tour embed URL" id="vt-embed" value={cfg.virtualTour.embedUrl} placeholder="https://my.matterport.com/show/?m=…" onChange={(e) => patch((d) => { d.virtualTour.embedUrl = e.target.value; })} />
              <ImageInput label="Poster image (shown when no embed URL is set)" value={cfg.virtualTour.viewerImage} onChange={(v) => patch((d) => { d.virtualTour.viewerImage = v; })} />
              <Field label="Caption under the viewer" id="vt-cap" value={cfg.virtualTour.caption} onChange={(e) => patch((d) => { d.virtualTour.caption = e.target.value; })} />
            </Card>

            <Card onSave={save} title="Tour highlights" desc="The photo tiles below the viewer. Leave the list empty to hide the section.">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Eyebrow" id="vt-se" value={cfg.virtualTour.stopsHeading.eyebrow} onChange={(e) => patch((d) => { d.virtualTour.stopsHeading.eyebrow = e.target.value; })} />
                <Field label="Title" id="vt-st" value={cfg.virtualTour.stopsHeading.title} onChange={(e) => patch((d) => { d.virtualTour.stopsHeading.title = e.target.value; })} />
              </div>
              <Repeater
                items={cfg.virtualTour.stops}
                onChange={(v) => patch((d) => { d.virtualTour.stops = v; })}
                blank={() => ({ title: '', image: '' })}
                addLabel="+ Add highlight"
              >
                {(item, update) => (
                  <>
                    <Field label="Title" id={`vt-h-${item.title}`} value={item.title} onChange={(e) => update({ title: e.target.value })} />
                    <ImageInput label="Photo" value={item.image} onChange={(v) => update({ image: v })} />
                  </>
                )}
              </Repeater>
            </Card>

            <Card onSave={save} title="Call to action" desc="The 'book a visit' band at the bottom. Clear the title to hide it.">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Eyebrow" id="vt-ce" value={cfg.virtualTour.cta.eyebrow} onChange={(e) => patch((d) => { d.virtualTour.cta.eyebrow = e.target.value; })} />
                <Field label="Title" id="vt-ct" value={cfg.virtualTour.cta.title} onChange={(e) => patch((d) => { d.virtualTour.cta.title = e.target.value; })} />
                <Field label="Primary button label" id="vt-pl" value={cfg.virtualTour.cta.primary.label} onChange={(e) => patch((d) => { d.virtualTour.cta.primary.label = e.target.value; })} />
                <Field label="Primary button link" id="vt-ph" value={cfg.virtualTour.cta.primary.href} onChange={(e) => patch((d) => { d.virtualTour.cta.primary.href = e.target.value; })} />
                <Field label="Secondary button label" id="vt-sl" value={cfg.virtualTour.cta.secondary.label} onChange={(e) => patch((d) => { d.virtualTour.cta.secondary.label = e.target.value; })} />
                <Field label="Secondary button link" id="vt-sh" value={cfg.virtualTour.cta.secondary.href} onChange={(e) => patch((d) => { d.virtualTour.cta.secondary.href = e.target.value; })} />
              </div>
            </Card>
          </>
        ) : null}

        {tab === 'Live TV' ? (
          <Card onSave={save} title="Live TV — idle message" desc="Shown when nothing is streaming. When you start a stream in Admin → Live (or a recording exists), it automatically takes over the page. The page banner is edited under 'Page heads'.">
            <Field label="Badge" id="lv-b" value={cfg.live.badge} onChange={(e) => patch((d) => { d.live.badge = e.target.value; })} />
            <Field label="Title" id="lv-t" value={cfg.live.title} onChange={(e) => patch((d) => { d.live.title = e.target.value; })} />
            <TextAreaField label="Message" id="lv-m" value={cfg.live.message} onChange={(e) => patch((d) => { d.live.message = e.target.value; })} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Primary button label" id="lv-pl" value={cfg.live.primary.label} onChange={(e) => patch((d) => { d.live.primary.label = e.target.value; })} />
              <Field label="Primary button link" id="lv-ph" value={cfg.live.primary.href} onChange={(e) => patch((d) => { d.live.primary.href = e.target.value; })} />
              <Field label="Secondary button label" id="lv-sl" value={cfg.live.secondary.label} onChange={(e) => patch((d) => { d.live.secondary.label = e.target.value; })} />
              <Field label="Secondary button link" id="lv-sh" value={cfg.live.secondary.href} onChange={(e) => patch((d) => { d.live.secondary.href = e.target.value; })} />
            </div>
          </Card>
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

        {tab === 'Website control' ? (
          <>
            <Card onSave={save} title="Maintenance mode" desc="When ON, public visitors see a branded maintenance screen. The admin dashboard stays accessible.">
              <label className="flex items-center gap-2 rounded-xl border border-line p-3 text-sm font-medium text-ink">
                <input type="checkbox" checked={cfg.maintenance.enabled} onChange={(e) => patch((d) => { d.maintenance.enabled = e.target.checked; })} />
                Enable maintenance mode {cfg.maintenance.enabled ? <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">LIVE — site is down for visitors</span> : null}
              </label>
              <TextAreaField label="Message" id="mt-msg" value={cfg.maintenance.message} onChange={(e) => patch((d) => { d.maintenance.message = e.target.value; })} />
              <Field label="Estimated return (optional — shows a countdown)" id="mt-ret" type="datetime-local" value={cfg.maintenance.returnAt ? cfg.maintenance.returnAt.slice(0, 16) : ''} onChange={(e) => patch((d) => { d.maintenance.returnAt = e.target.value ? new Date(e.target.value).toISOString() : undefined; })} />
            </Card>

            <Card onSave={save} title="Homepage sections" desc="Show or hide individual blocks on the homepage.">
              <div className="grid gap-2 sm:grid-cols-2">
                {HOMEPAGE_SECTIONS.map((s) => (
                  <label key={s.key} className="flex items-center justify-between rounded-xl border border-line px-4 py-2.5 text-sm text-ink">
                    {s.label}
                    <input type="checkbox" checked={cfg.sections[s.key] !== false} onChange={(e) => patch((d) => { d.sections[s.key] = e.target.checked; })} />
                  </label>
                ))}
              </div>
            </Card>

            <Card onSave={save} title="Pages & features" desc="Disabled pages are removed from the menus and show a 'not found' page if visited directly.">
              <div className="grid gap-2 sm:grid-cols-2">
                {PAGE_TOGGLES.map((p) => (
                  <label key={p.key} className="flex items-center justify-between rounded-xl border border-line px-4 py-2.5 text-sm text-ink">
                    {p.label}
                    <input type="checkbox" checked={cfg.pages[p.key] !== false} onChange={(e) => patch((d) => { d.pages[p.key] = e.target.checked; })} />
                  </label>
                ))}
              </div>
            </Card>
          </>
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

        {tab === 'Admissions form' ? (
          <Card onSave={save} title="Admissions application — extra questions" desc="These questions are added to the public admissions form, after the standard pupil and guardian details. Answers appear in the Admissions list and exports.">
            <FieldDesigner fields={(cfg.admissionsFields ?? []) as FormField[]} onChange={(fields) => patch((d) => { d.admissionsFields = fields; })} addLabel="+ Add question" />
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
