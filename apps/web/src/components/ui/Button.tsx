import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { Icon, type IconName } from '@/components/Icon';

type Variant = 'primary' | 'gold' | 'outline' | 'ghost';
type Size = 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 font-medium rounded-full transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  primary:
    'bg-maroon-700 text-white hover:bg-maroon-800 shadow-soft hover:shadow-lift focus-visible:outline-maroon-900',
  gold: 'bg-gold-400 text-maroon-900 hover:bg-gold-300 shadow-soft focus-visible:outline-gold-700',
  outline:
    'border border-maroon-700/30 text-maroon-800 hover:bg-maroon-50 hover:border-maroon-700/60 focus-visible:outline-maroon-700',
  ghost:
    'text-maroon-800 hover:bg-maroon-50 focus-visible:outline-maroon-700',
};

const sizes: Record<Size, string> = {
  md: 'text-sm px-5 py-2.5',
  lg: 'text-base px-7 py-3.5',
};

type Props = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  className?: string;
} & ({ href: string } | ComponentProps<'button'>);

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  ...rest
}: Props) {
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;
  const content = (
    <>
      {children}
      {icon ? <Icon name={icon} size={size === 'lg' ? 20 : 18} /> : null}
    </>
  );

  if ('href' in rest && rest.href) {
    return (
      <Link href={rest.href} className={cls}>
        {content}
      </Link>
    );
  }
  return (
    <button className={cls} {...(rest as ComponentProps<'button'>)}>
      {content}
    </button>
  );
}
