import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AnnouncementBar } from '@/components/AnnouncementBar';
import { AnnouncementPopup } from '@/components/AnnouncementPopup';
import { getSiteConfig } from '@/lib/site-config';

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getSiteConfig();
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <AnnouncementBar />
      <Header config={config} />
      <main id="main">{children}</main>
      <Footer config={config} />
      <AnnouncementPopup />
    </>
  );
}
