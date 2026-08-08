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
        className={`mt-3 text-[1.75rem] sm:mt-4 sm:text-4xl lg:text-[2.75rem] leading-[1.1] ${
          tone === 'dark' ? '!text-white' : ''
        }`}
      >
        {title}
      </h2>
      {intro ? (
        // Section intros are supporting copy, not the headline — kept to three
        // lines on a phone so the eye reaches the content underneath sooner.
        <p
          className={`clamp-mobile mt-3.5 text-base leading-relaxed sm:mt-5 sm:text-lg ${
            tone === 'dark' ? 'text-paper/80' : 'text-ink-soft'
          }`}
          style={{ WebkitLineClamp: 3 }}
        >
          {intro}
        </p>
      ) : null}
    </div>
  );
}
