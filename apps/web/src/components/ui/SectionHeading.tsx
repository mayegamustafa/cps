import type { ReactNode } from 'react';

type Props = {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: 'left' | 'center';
  tone?: 'light' | 'dark';
};

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = 'left',
  tone = 'light',
}: Props) {
  return (
    <div
      className={[
        'max-w-2xl',
        align === 'center' ? 'mx-auto text-center' : '',
      ].join(' ')}
    >
      {eyebrow ? (
        <span
          className={`eyebrow ${tone === 'dark' ? '!text-gold-300' : ''} ${
            align === 'center' ? 'justify-center' : ''
          }`}
        >
          {eyebrow}
        </span>
      ) : null}
      <h2
        className={`mt-4 text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.1] ${
          tone === 'dark' ? '!text-white' : ''
        }`}
      >
        {title}
      </h2>
      {intro ? (
        <p
          className={`mt-5 text-lg leading-relaxed ${
            tone === 'dark' ? 'text-paper/80' : 'text-ink-soft'
          }`}
        >
          {intro}
        </p>
      ) : null}
    </div>
  );
}
