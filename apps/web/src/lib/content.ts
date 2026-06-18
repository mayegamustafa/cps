/**
 * Demo content for the public site. In production these are served by the
 * NestJS API / Prisma; the shapes here intentionally mirror the DB models so
 * pages can be swapped to live data with minimal change.
 */
import type { IconName } from '@/components/Icon';

export const leadership = [
  {
    name: 'Dr. Margaret Nakato',
    title: 'Head Teacher',
    bio: 'A career educator with over 25 years of experience leading high-performing schools across East Africa.',
  },
  {
    name: 'Mr. Joseph Mwangi',
    title: 'Deputy Head, Academics',
    bio: 'Oversees curriculum, assessment and teacher development across all three sections.',
  },
  {
    name: 'Mrs. Aisha Namusoke',
    title: 'Head of Admissions',
    bio: 'Guides every family through a warm, transparent admissions journey.',
  },
  {
    name: 'Mr. Daniel Okello',
    title: 'Head of Pastoral Care',
    bio: 'Leads our house system, counselling and the wellbeing of every pupil.',
  },
];

export const values: { title: string; icon: IconName; body: string }[] = [
  { title: 'Integrity', icon: 'shield-check', body: 'We do what is right, especially when no one is watching.' },
  { title: 'Excellence', icon: 'trophy', body: 'We pursue our personal best in every endeavour.' },
  { title: 'Compassion', icon: 'heart-hand', body: 'We lead with empathy and serve our community.' },
  { title: 'Curiosity', icon: 'sparkle', body: 'We ask questions and love to learn.' },
];

export const departments: {
  section: string;
  age: string;
  icon: IconName;
  summary: string;
  subjects: string[];
}[] = [
  {
    section: 'Pre-Primary',
    age: 'KG1 to KG3 · Ages 3 to 5',
    icon: 'heart-hand',
    summary:
      'A nurturing, play-based foundation across KG1, KG2 and KG3 that develops language, motor skills, social confidence and a lifelong love of learning.',
    subjects: ['Early Literacy', 'Numeracy', 'Creative Play', 'Music and Movement', 'Social Skills'],
  },
  {
    section: 'Lower Primary',
    age: 'P.1 to P.3 · Ages 6 to 8',
    icon: 'book-open',
    summary:
      'The building blocks of formal learning from Primary One to Primary Three, growing strong reading, writing and numeracy alongside curiosity and confidence.',
    subjects: ['English', 'Mathematics', 'Reading', 'Science', 'Social Studies', 'Religious Education', 'Physical Education'],
  },
  {
    section: 'Upper Primary',
    age: 'P.4 to P.7 · Ages 9 to 12',
    icon: 'graduation-cap',
    summary:
      'A rigorous programme from Primary Four to Primary Seven that deepens academic mastery and prepares pupils for the Primary Leaving Examinations.',
    subjects: ['English', 'Mathematics', 'Integrated Science', 'Social Studies', 'ICT', 'Religious Education', 'Creative Arts'],
  },
];

export const boardingOptions: {
  name: string;
  icon: IconName;
  summary: string;
  features: string[];
}[] = [
  {
    name: 'Day Section',
    icon: 'globe',
    summary:
      'For families who prefer their children to learn with us by day and return home each evening, with safe, GPS-tracked transport across Kampala.',
    features: ['Flexible drop-off and pick-up', 'Supervised lunch and breaks', 'After-school clubs', 'GPS-tracked bus routes'],
  },
  {
    name: 'Boarding Section',
    icon: 'shield-check',
    summary:
      'A nurturing, well-supervised boarding environment for upper Primary classes, with structured study, balanced meals and round-the-clock pastoral care.',
    features: ['Caring resident matrons', 'Structured evening preps', 'Balanced, nutritious meals', '24-hour security and care'],
  },
];

export const admissionSteps = [
  { step: '01', title: 'Enquire & Apply', body: 'Complete the online application form and create your tracking account.' },
  { step: '02', title: 'Submit Documents', body: 'Upload the pupil’s birth certificate, reports and a passport photo.' },
  { step: '03', title: 'Assessment & Visit', body: 'Attend a friendly assessment and tour the campus with our team.' },
  { step: '04', title: 'Offer & Enrolment', body: 'Receive your admission letter and complete enrolment to secure a place.' },
];

export const feeStructure = [
  { level: 'Pre-Primary (KG1 to KG3)', termly: 'UGX 850,000', annual: 'UGX 2,550,000' },
  { level: 'Lower Primary (P.1 to P.3)', termly: 'UGX 1,100,000', annual: 'UGX 3,300,000' },
  { level: 'Upper Primary (P.4 to P.7)', termly: 'UGX 1,250,000', annual: 'UGX 3,750,000' },
  { level: 'Boarding supplement (per term)', termly: 'UGX 600,000', annual: 'UGX 1,800,000' },
];

export const faqs = [
  { q: 'What is the minimum age for Pre-Primary?', a: 'Children must be at least 3 years old by the start of the school year to join KG1.' },
  { q: 'Do you have a boarding section?', a: 'Yes. We offer a day section for all classes and a nurturing boarding section for upper Primary pupils.' },
  { q: 'Do you offer transport?', a: 'Yes. We operate safe, GPS-tracked school buses across major routes in Kampala for day pupils.' },
  { q: 'When does the admissions window open?', a: 'Applications for the 2026 and 2027 academic years are open now and close one month before each term.' },
  { q: 'Are there scholarships?', a: 'We offer a limited number of merit and need-based bursaries each year. Contact admissions for details.' },
];

export const events = [
  { title: 'Open Day & Campus Tour', date: '2026-07-12', time: '9:00 AM', category: 'Admissions', location: 'Main Campus' },
  { title: 'Inter-House Athletics Gala', date: '2026-07-26', time: '8:00 AM', category: 'Sports', location: 'School Grounds' },
  { title: 'Annual Science & Innovation Fair', date: '2026-08-09', time: '10:00 AM', category: 'Academics', location: 'Innovation Block' },
  { title: 'Graduation Ceremony 2026', date: '2026-08-23', time: '2:00 PM', category: 'Ceremony', location: 'Main Hall' },
  { title: 'Parent and Teacher Conference', date: '2026-09-06', time: '9:00 AM', category: 'Community', location: 'Classrooms' },
];

export const galleryAlbums = [
  { title: 'Sports Day 2026', category: 'Sports', count: 48, image: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=800&q=70' },
  { title: 'Science Fair', category: 'Academics', count: 32, image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=70' },
  { title: 'Graduation 2025', category: 'Graduation', count: 64, image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=70' },
  { title: 'Cultural Day', category: 'Events', count: 41, image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=70' },
  { title: 'Educational Trip', category: 'Trips', count: 27, image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=70' },
  { title: 'Music & Drama', category: 'Arts', count: 38, image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=800&q=70' },
];

export const jobs = [
  { slug: 'primary-science-teacher', title: 'Primary Science Teacher', department: 'Primary', type: 'Full-time', deadline: '2026-07-15' },
  { slug: 'kindergarten-teacher', title: 'Kindergarten Teacher', department: 'Kindergarten', type: 'Full-time', deadline: '2026-07-20' },
  { slug: 'boarding-matron', title: 'Boarding Section Matron', department: 'Pastoral Care', type: 'Full-time', deadline: '2026-07-22' },
  { slug: 'school-counsellor', title: 'School Counsellor', department: 'Pastoral Care', type: 'Full-time', deadline: '2026-07-25' },
  { slug: 'ict-administrator', title: 'ICT Systems Administrator', department: 'Operations', type: 'Full-time', deadline: '2026-08-01' },
];

export const recordings = [
  { title: 'Graduation Ceremony 2025', date: '2025-08-23', duration: '2:14:30', views: '4,820' },
  { title: 'Inter-House Music Festival', date: '2026-03-14', duration: '1:48:12', views: '2,310' },
  { title: 'Founders’ Day Assembly', date: '2026-02-02', duration: '0:52:40', views: '1,640' },
];

export const alumni = [
  { name: 'Patricia Atim', year: 2008, role: 'Medical Doctor', org: 'Mulago Hospital' },
  { name: 'Brian Ssempa', year: 2010, role: 'Software Engineer', org: 'Google' },
  { name: 'Rachel Auma', year: 2012, role: 'Lawyer', org: 'High Court of Uganda' },
  { name: 'Kevin Lubega', year: 2015, role: 'Entrepreneur', org: 'Founder, AgriTech UG' },
];

export const downloads = [
  { title: 'School Prospectus 2026', category: 'Prospectus', size: '4.2 MB' },
  { title: 'Admission Application Form', category: 'Forms', size: '320 KB' },
  { title: 'Fees Structure 2026', category: 'Forms', size: '180 KB' },
  { title: 'Code of Conduct Policy', category: 'Policies', size: '640 KB' },
  { title: 'Term Calendar 2026', category: 'Calendar', size: '210 KB' },
  { title: 'Parent Handbook', category: 'Policies', size: '2.1 MB' },
];

export const houses = [
  { name: 'Nile', color: '#1E4D8C', points: 1240, motto: 'Strength in Flow' },
  { name: 'Rwenzori', color: '#2E7D32', points: 1180, motto: 'Reach the Summit' },
  { name: 'Elgon', color: '#6E1F23', points: 1095, motto: 'Rooted and Rising' },
  { name: 'Victoria', color: '#B8860B', points: 1320, motto: 'Boundless Horizons' },
];
