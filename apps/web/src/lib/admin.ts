import type { IconName } from '@/components/Icon';

export const adminNav: { label: string; href: string; icon: IconName }[] = [
  { label: 'Dashboard', href: '/admin', icon: 'grid' },
  { label: 'Analytics', href: '/admin/analytics', icon: 'eye' },
  { label: 'Announcements', href: '/admin/announcements', icon: 'megaphone' },
  { label: 'Statistics', href: '/admin/statistics', icon: 'sparkle' },
  { label: 'News', href: '/admin/news', icon: 'bell' },
  { label: 'Events', href: '/admin/events', icon: 'calendar' },
  { label: 'Gallery & Media', href: '/admin/media', icon: 'image' },
  { label: 'Admissions', href: '/admin/admissions', icon: 'inbox' },
  { label: 'Careers', href: '/admin/careers', icon: 'briefcase' },
  { label: 'Job Applications', href: '/admin/job-applications', icon: 'users' },
  { label: 'Live Streams', href: '/admin/live', icon: 'video' },
  { label: 'Alumni', href: '/admin/alumni', icon: 'users' },
  { label: 'Downloads', href: '/admin/downloads', icon: 'download' },
  { label: 'Social Wall', href: '/admin/social', icon: 'instagram' },
  { label: 'Forms', href: '/admin/forms', icon: 'inbox' },
  { label: 'Messages', href: '/admin/contact', icon: 'mail' },
  { label: 'Integrations', href: '/admin/integrations', icon: 'link' },
  { label: 'Audit Trail', href: '/admin/audit', icon: 'shield-check' },
  { label: 'Settings & SEO', href: '/admin/settings', icon: 'settings' },
];

export const dashboardStats = [
  { label: 'New admissions', value: '128', delta: '+12%', icon: 'inbox' as IconName },
  { label: 'Job applications', value: '64', delta: '+8%', icon: 'briefcase' as IconName },
  { label: 'Published articles', value: '42', delta: '+3', icon: 'megaphone' as IconName },
  { label: 'Live viewers (peak)', value: '312', delta: 'live', icon: 'video' as IconName },
];

export const recentAdmissions = [
  { ref: 'CPS-2026-481204', pupil: 'Aine Komugisha', section: 'Primary', status: 'under_review', date: '2026-06-12' },
  { ref: 'CPS-2026-481199', pupil: 'Mukasa Junior', section: 'Nursery', status: 'submitted', date: '2026-06-11' },
  { ref: 'CPS-2026-481187', pupil: 'Nakimuli Faith', section: 'Secondary', status: 'shortlisted', date: '2026-06-10' },
  { ref: 'CPS-2026-481170', pupil: 'Opio Daniel', section: 'Primary', status: 'accepted', date: '2026-06-09' },
];

export const adminNews = [
  { id: '1', title: 'City Parents tops the district in national examinations', status: 'published', date: '2026-05-12', views: 4820 },
  { id: '2', title: 'Annual Sports Gala unites all four houses', status: 'published', date: '2026-04-28', views: 2310 },
  { id: '3', title: 'New science and innovation block opens', status: 'published', date: '2026-03-15', views: 1980 },
  { id: '4', title: 'Term 3 prize-giving ceremony announced', status: 'draft', date: '2026-06-10', views: 0 },
  { id: '5', title: 'Holiday programme registration now open', status: 'scheduled', date: '2026-06-20', views: 0 },
];

export const adminApplications = [
  { name: 'Grace Nantongo', role: 'Secondary Physics Teacher', status: 'shortlisted', date: '2026-06-08' },
  { name: 'Samuel Wasswa', role: 'Primary Class Teacher', status: 'under_review', date: '2026-06-07' },
  { name: 'Diana Achan', role: 'School Counsellor', status: 'submitted', date: '2026-06-06' },
  { name: 'Robert Kato', role: 'ICT Systems Administrator', status: 'rejected', date: '2026-06-05' },
];

export const adminStreams = [
  { title: 'Morning Assembly', status: 'live', scheduled: '2026-06-14 08:00', viewers: 312 },
  { title: 'Graduation Ceremony 2026', status: 'scheduled', scheduled: '2026-08-23 14:00', viewers: 0 },
  { title: 'Founders’ Day Assembly', status: 'ended', scheduled: '2026-02-02 09:00', viewers: 1640 },
];
