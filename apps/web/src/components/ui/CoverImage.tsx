import { imgProps, isVideoUrl, videoPoster } from '@/lib/media';

type Props = {
  src: string;
  alt?: string;
  /** Sizes hint — how wide the image slot is at each breakpoint. */
  sizes?: string;
  className?: string;
  /** The hero image should not be lazy-loaded; everything else should. */
  priority?: boolean;
};

/**
 * An absolutely-positioned, object-cover image that fills its (relative) parent.
 *
 * This replaces `style={{ backgroundImage: url(...) }}` divs across the site.
 * A CSS background can't carry a `srcset`, so phones were downloading the same
 * full-size file as desktops; a real <img> lets the browser pick a 420px-wide
 * AVIF instead of a 3MB JPEG.
 */
export function CoverImage({ src, alt = '', sizes = '100vw', className = '', priority = false }: Props) {
  if (!src) return null;
  // An album whose first item is a video hands us an .mp4 as its cover; a still
  // from the start of it is what belongs in an <img>.
  const still = isVideoUrl(src) ? videoPoster(src) : src;
  if (!still) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...imgProps(still, sizes)}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding={priority ? 'sync' : 'async'}
      className={`absolute inset-0 h-full w-full object-cover ${className}`}
    />
  );
}
