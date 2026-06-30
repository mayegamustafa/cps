import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AnnouncementBar } from '@/components/AnnouncementBar';
import { AnnouncementPopup } from '@/components/AnnouncementPopup';
import { ApplyNowFab } from '@/components/ApplyNowFab';
import { AnalyticsBeacon } from '@/components/AnalyticsBeacon';
import { MaintenanceScreen } from '@/components/MaintenanceScreen';
import { getSiteConfig } from '@/lib/site-config';

// Render the public site dynamically so pages are built with the LIVE admin
// settings/content on every request — never the build-time defaults. This
// removes the brief "demo content" flash that static pre-rendering caused.
// (getSiteConfig and the content fetches still use a short data-cache window,
// so this stays fast and doesn't hammer the API.)
export const dynamic = 'force-dynamic';

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getSiteConfig();

  // Maintenance mode: public site shows a branded screen; /admin is a separate
  // route group and stays accessible.
  if (config.maintenance?.enabled) {
    return <MaintenanceScreen config={config} />;
  }

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <AnnouncementBar />
      <Header config={config} />
      <main id="main">{children}</main>
      <Footer config={config} />
      <AnnouncementPopup />
      <ApplyNowFab />
      <AnalyticsBeacon />
    </>
  );
}
