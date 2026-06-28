import { NotFoundView } from '@/components/NotFoundView';

// Rendered inside the public site chrome (header + footer) for any missing
// site page or notFound() (e.g. unpublished/coming-soon pages).
export default function SiteNotFound() {
  return <NotFoundView />;
}
