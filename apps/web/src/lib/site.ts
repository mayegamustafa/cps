/**
 * Default, admin-overridable site configuration.
 *
 * These values are the fallback shown when the API has no saved settings (or is
 * unreachable). The admin "Settings & SEO" screen edits a `site` record that is
 * deep-merged over these defaults by getSiteConfig(). Every field here is
 * therefore editable from the admin panel.
 */

import type { IconName } from '@/components/Icon';
import type { FormField } from '@/components/admin/FieldDesigner';

export type CtaLink = { label: string; href: string };

export type PageHeadConfig = {
  show: boolean;
  eyebrow?: string;
  title?: string;
  intro?: string;
  image?: string;
};

/** Inner pages that render an editable header banner. */
export type PageHeadKey =
  | 'about'
  | 'academics'
  | 'admissions'
  | 'news'
  | 'gallery'
  | 'alumni'
  | 'careers'
  | 'contact'
  | 'virtual-tour'
  | 'live'
  | 'downloads'
  | 'talent';

export type SiteConfig = {
  brand: {
    logoUrl: string;
    logoLightUrl: string;
    name: string;
    locality: string;
    foundingYear: string;
    /** Active colour theme. sun = maroon/yellow/white (brand), gold = maroon/gold/white,
     *  crest = maroon/black/gold, slate = maroon/white/grey, plain = maroon/white,
     *  noir = maroon/white/black. */
    theme: 'slate' | 'gold' | 'crest' | 'plain' | 'noir' | 'sun';
  };
  tagline: string;
  description: string;
  url: string;
  address: {
    line1: string;
    poBox: string;
    city: string;
    country: string;
    plusCode: string;
  };
  coords: { lat: number; lng: number };
  contact: { phone: string; email: string; whatsapp: string };
  social: { network: string; label: string; href: string }[];
  hero: {
    eyebrow: string;
    titleLead: string;
    titleAccent: string;
    intro: string;
    /** Optional background video URL (mp4/webm). Autoplays muted + looped when set. */
    backgroundVideo: string;
    /** Background image shown when no video is set (also the video poster). */
    backgroundImage: string;
    primaryCta: CtaLink;
    secondaryCta: CtaLink;
    stats: { value: string; label: string }[];
    live: {
      status: string;
      message: string;
      ctaLabel: string;
      chatLabel: string;
    };
  };
  /** Editable homepage sections below the hero. */
  home: {
    welcome: {
      eyebrow: string;
      title: string;
      intro: string;
      image: string;
      bullets: string[];
      statValue: string;
      statLabel: string;
      primaryCta: CtaLink;
      secondaryCta: CtaLink;
    };
    pathways: {
      eyebrow: string;
      title: string;
      intro: string;
      /** `image` is optional — when set, the card shows that photo instead of the icon. */
      items: { name: string; icon: IconName; image?: string; age: string; blurb: string; href: string }[];
    };
    why: {
      eyebrow: string;
      title: string;
      items: { title: string; icon: IconName; body: string }[];
    };
    admissionsCta: {
      eyebrow: string;
      title: string;
      intro: string;
      image: string;
      primaryCta: CtaLink;
      secondaryCta: CtaLink;
    };
    news: { eyebrow: string; title: string };
    /** "Captured moments" — a visual strip of recent gallery photos on the home page. */
    gallery: { eyebrow: string; title: string; intro: string };
    testimonials: {
      eyebrow: string;
      title: string;
      items: { quote: string; name: string; role: string }[];
    };
    visit: {
      eyebrow: string;
      title: string;
      intro: string;
      officeHours: string;
    };
    headTeacher: {
      eyebrow: string;
      name: string;
      title: string;
      message: string;
      image: string;
    };
    feeds: {
      heading: string;
      /** TikTok @username or profile URL */
      tiktok: string;
      /** Facebook page URL */
      facebook: string;
      /** YouTube video or playlist URL/ID */
      youtube: string;
    };
  };
  /** Talent Development Program (TDP) page — media-led showcase. */
  talent: {
    intro: { eyebrow: string; title: string; body: string };
    areas: { title: string; icon: IconName; body: string }[];
    media: { type: 'image' | 'video'; url: string; title: string; description: string }[];
    cta: CtaLink;
  };
  /** Editable Academics-page content. `image` is optional on every card —
   *  when set it replaces the icon; when empty the icon is used. */
  academics: {
    stages: { name: string; age: string; icon: IconName; image?: string; summary: string; subjects: string[]; href: string }[];
    dayBoarding: {
      eyebrow: string;
      title: string;
      intro: string;
      options: { name: string; icon: IconName; image?: string; summary: string; features: string[] }[];
    };
    resources: {
      eyebrow: string;
      title: string;
      items: { title: string; icon: IconName; image?: string; body: string }[];
    };
  };
  /** Editable Virtual Tour page content (the hero is set via pageHeads). */
  virtualTour: {
    /** 360°/Matterport/Google/YouTube embed URL. When set, it shows in the viewer. */
    embedUrl: string;
    /** Poster image shown in the viewer when there is no embed (or before launch). */
    viewerImage: string;
    caption: string;
    stopsHeading: { eyebrow: string; title: string };
    stops: { title: string; image: string }[];
    cta: { eyebrow: string; title: string; primary: CtaLink; secondary: CtaLink };
  };
  /** Editable About-page content. */
  about: {
    story: { eyebrow: string; title: string; intro: string; body: string; image: string };
    vision: { title: string; body: string };
    mission: { title: string; body: string };
    values: { title: string; icon: IconName; body: string }[];
    leadership: { name: string; title: string; bio: string; image: string }[];
  };
  footer: {
    columns: { heading: string; links: CtaLink[] }[];
  };
  /** Per-page header banners (show/hide + editable copy and image). */
  pageHeads: Record<PageHeadKey, PageHeadConfig>;
  /** Admin-editable category lists used by the content dropdowns. */
  taxonomies: {
    galleryCategories: string[];
    newsCategories: string[];
    eventCategories: string[];
  };
  /** Extra questions appended to the public admissions application form. */
  admissionsFields: FormField[];
  /** Website maintenance / shutdown mode. */
  maintenance: {
    enabled: boolean;
    message: string;
    returnAt?: string;
  };
  /** Homepage block visibility toggles. */
  sections: {
    welcome: boolean;
    pathways: boolean;
    why: boolean;
    admissionsCta: boolean;
    news: boolean;
    gallery: boolean;
    testimonials: boolean;
    visit: boolean;
    headTeacher: boolean;
    feeds: boolean;
  };
  /** Page/feature enable flags — disabled pages drop out of navigation and 404. */
  pages: {
    about: boolean;
    academics: boolean;
    admissions: boolean;
    news: boolean;
    gallery: boolean;
    alumni: boolean;
    careers: boolean;
    contact: boolean;
    virtualTour: boolean;
    live: boolean;
    downloads: boolean;
    talent: boolean;
  };
};

/** Maps a nav/footer href to its page-visibility flag. */
export const NAV_PAGE_KEY: Record<string, keyof SiteConfig['pages']> = {
  '/about': 'about',
  '/academics': 'academics',
  '/admissions': 'admissions',
  '/news': 'news',
  '/gallery': 'gallery',
  '/alumni': 'alumni',
  '/careers': 'careers',
  '/contact': 'contact',
  '/virtual-tour': 'virtualTour',
  '/live': 'live',
  '/downloads': 'downloads',
  '/talent': 'talent',
};

/** Whether a given href is enabled (true when it maps to no toggle). */
export function isHrefEnabled(config: SiteConfig, href: string): boolean {
  const key = NAV_PAGE_KEY[href];
  return !key || config.pages?.[key] !== false;
}

/**
 * Builds a WhatsApp deep link with a pre-filled message that is tagged so the
 * school can tell, at a glance, that the enquiry came from the website.
 */
export function waLink(number: string, message?: string): string {
  const digits = (number || '').replace(/[^\d]/g, '');
  const body = message?.trim() || 'Hello City Parents School, I’m reaching out from your website.';
  const marked = `[City Parents Website] ${body}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(marked)}`;
}

export const siteDefaults: SiteConfig = {
  brand: {
    logoUrl: '/cps.png',
    logoLightUrl: '/cps.png',
    name: 'City Parents School',
    locality: 'Kampala',
    foundingYear: '1999',
    theme: 'sun',
  },
  tagline: 'Nurturing brilliance, building character.',
  description:
    'City Parents School, Kampala is a premier institution shaping confident, curious and compassionate learners from Pre-Primary through Upper Primary, in day and boarding sections.',
  // Canonical public URL — used for sitemap.xml, robots.txt, canonical tags
  // and Open Graph. MUST match the domain registered in Google Search Console,
  // or Google ignores the sitemap URLs as cross-domain (0 pages discovered).
  // Override per-environment with NEXT_PUBLIC_SITE_URL without editing code.
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://cityparentsschool.co.ug',
  address: {
    line1: 'Kabaka Njagala Road',
    poBox: 'P.O. Box 26811',
    city: 'Kampala',
    country: 'Uganda',
    plusCode: '8H47+2F Kampala',
  },
  coords: { lat: 0.30537705324686104, lng: 32.5637337974885 },
  contact: {
    phone: '+256 700 000 000',
    email: 'info@cityparents.sc.ug',
    whatsapp: '256700000000',
  },
  social: [
    { network: 'youtube', label: 'YouTube', href: 'https://youtube.com' },
    { network: 'instagram', label: 'Instagram', href: 'https://instagram.com' },
    { network: 'facebook', label: 'Facebook', href: 'https://facebook.com' },
    { network: 'tiktok', label: 'TikTok', href: 'https://tiktok.com' },
    { network: 'linkedin', label: 'LinkedIn', href: 'https://linkedin.com' },
  ],
  hero: {
    eyebrow: 'Established 1999 · Kampala, Uganda',
    titleLead: 'Nurturing brilliance,',
    titleAccent: 'building character.',
    intro:
      'A premier institution shaping confident, curious and compassionate learners from Pre-Primary through Upper Primary, in day and boarding sections, in the heart of Kampala.',
    backgroundVideo: '',
    backgroundImage:
      'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=2000&q=70',
    primaryCta: { label: 'Begin Admission', href: '/admissions' },
    secondaryCta: { label: 'Take the Virtual Tour', href: '/virtual-tour' },
    stats: [
      { value: '25+', label: 'Years of excellence' },
      { value: '2,400+', label: 'Pupils enrolled' },
      { value: '45', label: 'National awards' },
    ],
    live: {
      status: 'Live now · School Assembly',
      message: 'Watch school events live, wherever you are.',
      ctaLabel: 'Open Live TV',
      chatLabel: 'Chat with Admissions',
    },
  },
  home: {
    welcome: {
      eyebrow: 'Welcome to City Parents',
      title: 'A school where every child is known, challenged and championed.',
      intro:
        'For three decades, City Parents School has been a home for ambitious learning in Kampala. We pair a demanding academic programme with genuine care, so that pupils leave us not only with results, but with character.',
      image:
        'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1000&q=70',
      bullets: [
        'Experienced, qualified and caring teaching staff',
        'A safe, modern campus on Kabaka Njagala Road',
        'Strong pastoral care and house system',
      ],
      statValue: '98%',
      statLabel: 'of parents recommend us to other families',
      primaryCta: { label: 'Our Story', href: '/about' },
      secondaryCta: { label: 'Meet the Leadership', href: '/about#leadership' },
    },
    pathways: {
      eyebrow: 'Academics',
      title: 'Three pathways. One standard of excellence.',
      intro:
        'A continuous, carefully-sequenced journey from the first day of Nursery to the final year of Secondary.',
      items: [
        { name: 'Pre-Primary', icon: 'heart-hand', age: 'KG1 to KG3 · Ages 3 to 5', blurb: 'A warm, play-rich foundation where curiosity, language and confidence take root.', href: '/academics#pre-primary' },
        { name: 'Lower Primary', icon: 'book-open', age: 'P.1 to P.3 · Ages 6 to 8', blurb: 'The building blocks of formal learning, growing strong reading, writing and numeracy.', href: '/academics#lower-primary' },
        { name: 'Upper Primary', icon: 'graduation-cap', age: 'P.4 to P.7 · Ages 9 to 12', blurb: 'Academic mastery and confidence, preparing pupils for the Primary Leaving Examinations.', href: '/academics#upper-primary' },
      ],
    },
    why: {
      eyebrow: 'Why City Parents',
      title: 'An education that lasts a lifetime.',
      items: [
        { title: 'Academic Excellence', icon: 'trophy', body: 'Consistently among the top-performing schools in the region, with a record of national distinction.' },
        { title: 'Character & Values', icon: 'shield-check', body: 'Integrity, discipline and compassion are taught as deliberately as mathematics and science.' },
        { title: 'Global Outlook', icon: 'globe', body: 'Learners graduate as confident citizens prepared for universities and careers worldwide.' },
        { title: 'Creative & Co-curricular', icon: 'palette', body: 'Music, sport, debate and the arts give every child a stage to discover their talents.' },
        { title: 'Inquiry & Science', icon: 'flask', body: 'Modern laboratories and a question-led approach build genuine scientific thinking.' },
        { title: 'Vibrant Community', icon: 'users', body: 'A close partnership of teachers, parents and alumni surrounds every learner.' },
      ],
    },
    admissionsCta: {
      eyebrow: 'Admissions 2026 / 2027',
      title: 'Applications are open. Give your child a head start.',
      intro:
        'Our online admissions portal makes it simple to apply, upload documents and track your child’s application from anywhere.',
      image:
        'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=1600&q=60',
      primaryCta: { label: 'Start Application', href: '/admissions' },
      secondaryCta: { label: 'Download Prospectus', href: '/downloads' },
    },
    news: { eyebrow: 'News & Events', title: 'The latest from our community' },
    gallery: { eyebrow: 'Life at City Parents', title: 'Captured moments', intro: 'A glimpse of everyday life, celebrations and achievements across the school.' },
    testimonials: {
      eyebrow: 'In their words',
      title: 'Trusted by families and alumni',
      items: [
        { quote: 'The teachers know my daughter as an individual. She has grown in confidence and curiosity in ways we never expected.', name: 'Sarah N.', role: 'Parent, Primary' },
        { quote: 'City Parents gave me the foundation and the values that carried me through university and into my career.', name: 'David K.', role: 'Alumnus, Class of 2012' },
      ],
    },
    visit: {
      eyebrow: 'Plan a visit',
      title: 'Come and see City Parents for yourself.',
      intro:
        'We warmly welcome prospective families to tour our campus, meet our teachers and experience the City Parents difference first-hand.',
      officeHours: 'Monday to Friday, 8:00am to 5:00pm',
    },
    headTeacher: {
      eyebrow: "Head Teacher's Message",
      name: 'Sekiganda Robert',
      title: 'Head Teacher, City Parents School',
      message:
        'It is my pleasure to welcome you to City Parents School. I thank our parents and partners for the support they render to this school, which I treasure deeply. Together we continue to nurture confident, disciplined and accomplished learners, and to drive the steady growth of this great school.',
      image: '',
    },
    feeds: {
      heading: 'Connect with us',
      tiktok: '',
      facebook: '',
      youtube: '',
    },
  },
  talent: {
    intro: {
      eyebrow: 'Talent Development Program',
      title: 'Where every talent finds its stage.',
      body: 'Our Talent Development Program nurtures each child’s gifts — in music, sport, the arts, debate, technology and more — through dedicated coaching, performances and competitions.',
    },
    areas: [
      { title: 'Music & Performing Arts', icon: 'music', body: 'Choir, instruments, drama and dance, with regular showcases.' },
      { title: 'Sports & Athletics', icon: 'trophy', body: 'Football, athletics, swimming and more, with inter-house competition.' },
      { title: 'Creative Arts', icon: 'palette', body: 'Drawing, painting and design that build confidence and expression.' },
      { title: 'Debate & Leadership', icon: 'users', body: 'Public speaking, debate and clubs that grow tomorrow’s leaders.' },
      { title: 'Science & Innovation', icon: 'flask', body: 'STEM clubs, coding and projects that turn curiosity into creation.' },
    ],
    media: [],
    cta: { label: 'Enquire about the programme', href: '/contact' },
  },
  academics: {
    stages: [
      {
        name: 'Pre-Primary',
        age: 'KG1 to KG3 · Ages 3 to 5',
        icon: 'heart-hand',
        summary:
          'A nurturing, play-based foundation across KG1, KG2 and KG3 that develops language, motor skills, social confidence and a lifelong love of learning.',
        subjects: ['Early Literacy', 'Numeracy', 'Creative Play', 'Music and Movement', 'Social Skills'],
        href: '/admissions',
      },
      {
        name: 'Lower Primary',
        age: 'P.1 to P.3 · Ages 6 to 8',
        icon: 'book-open',
        summary:
          'The building blocks of formal learning from Primary One to Primary Three, growing strong reading, writing and numeracy alongside curiosity and confidence.',
        subjects: ['English', 'Mathematics', 'Reading', 'Science', 'Social Studies', 'Religious Education', 'Physical Education'],
        href: '/admissions',
      },
      {
        name: 'Upper Primary',
        age: 'P.4 to P.7 · Ages 9 to 12',
        icon: 'graduation-cap',
        summary:
          'A rigorous programme from Primary Four to Primary Seven that deepens academic mastery and prepares pupils for the Primary Leaving Examinations.',
        subjects: ['English', 'Mathematics', 'Integrated Science', 'Social Studies', 'ICT', 'Religious Education', 'Creative Arts'],
        href: '/admissions',
      },
    ],
    dayBoarding: {
      eyebrow: 'Day & Boarding',
      title: 'Two ways to belong at City Parents',
      intro:
        'Every family chooses the arrangement that suits them best, with the same standard of care and academic excellence in both.',
      options: [
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
      ],
    },
    resources: {
      eyebrow: 'Beyond the classroom',
      title: 'Resources that bring learning to life',
      items: [
        { title: 'Science Laboratories', icon: 'flask', body: 'Modern physics, chemistry and biology labs.' },
        { title: 'Library & Resource Centre', icon: 'book-open', body: 'Thousands of titles and digital resources.' },
        { title: 'Arts & Music Studios', icon: 'palette', body: 'Spaces for creativity, performance and design.' },
        { title: 'Sports Facilities', icon: 'trophy', body: 'Fields, courts and a vibrant house system.' },
      ],
    },
  },
  virtualTour: {
    embedUrl: '',
    viewerImage: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=2000&q=70',
    caption: 'Drag to look around · Click hotspots to move between locations',
    stopsHeading: { eyebrow: 'Explore', title: 'Tour highlights' },
    stops: [
      { title: 'Main Entrance & Reception', image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=900&q=70' },
      { title: 'Classrooms & Learning Spaces', image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=900&q=70' },
      { title: 'Science & Innovation Block', image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=900&q=70' },
      { title: 'Library & Resource Centre', image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=70' },
      { title: 'Sports Fields & Courts', image: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=900&q=70' },
      { title: 'Dining Hall & Boarding', image: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?auto=format&fit=crop&w=900&q=70' },
    ],
    cta: {
      eyebrow: 'Prefer to visit in person?',
      title: 'Book a guided campus tour',
      primary: { label: 'Schedule a visit', href: '/contact' },
      secondary: { label: 'Start application', href: '/admissions' },
    },
  },
  about: {
    story: {
      eyebrow: 'Our Story',
      title: 'From a small classroom to a beacon of learning.',
      intro:
        'What began as a handful of pupils and a bold vision has become a thriving community of over 2,400 learners. Through every chapter, our commitment has remained unchanged: to know, challenge and champion every child.',
      body:
        'Today, our graduates lead in medicine, law, technology, business and public service across Uganda and the world — a living testament to the foundation laid on Kabaka Njagala Road.',
      image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1000&q=70',
    },
    vision: {
      title: 'Our Vision',
      body: 'To be the leading school in the region, nurturing confident, principled and globally-minded citizens.',
    },
    mission: {
      title: 'Our Mission',
      body: 'To provide a holistic, values-driven education that empowers every learner to achieve academic excellence and lead with character.',
    },
    values: [
      { title: 'Integrity', icon: 'shield-check', body: 'We do what is right, especially when no one is watching.' },
      { title: 'Excellence', icon: 'trophy', body: 'We pursue our personal best in every endeavour.' },
      { title: 'Compassion', icon: 'heart-hand', body: 'We lead with empathy and serve our community.' },
      { title: 'Curiosity', icon: 'sparkle', body: 'We ask questions and love to learn.' },
    ],
    leadership: [
      { name: 'Dr. Margaret Nakato', title: 'Head Teacher', bio: 'A career educator with over 25 years of experience leading high-performing schools across East Africa.', image: '' },
      { name: 'Mr. Joseph Mwangi', title: 'Deputy Head, Academics', bio: 'Oversees curriculum, assessment and teacher development across all three sections.', image: '' },
      { name: 'Mrs. Aisha Namusoke', title: 'Head of Admissions', bio: 'Guides every family through a warm, transparent admissions journey.', image: '' },
      { name: 'Mr. Daniel Okello', title: 'Head of Pastoral Care', bio: 'Leads our house system, counselling and the wellbeing of every pupil.', image: '' },
    ],
  },
  footer: {
    columns: [
      {
        heading: 'Explore',
        links: [
          { label: 'About School', href: '/about' },
          { label: 'Academics', href: '/academics' },
          { label: 'Virtual Tour', href: '/virtual-tour' },
          { label: 'Live TV', href: '/live' },
          { label: 'Achievement Wall', href: '/achievements' },
        ],
      },
      {
        heading: 'Community',
        links: [
          { label: 'News & Events', href: '/news' },
          { label: 'Gallery', href: '/gallery' },
          { label: 'Alumni', href: '/alumni' },
          { label: 'Digital Magazine', href: '/magazine' },
          { label: 'Houses', href: '/houses' },
        ],
      },
      {
        heading: 'Resources',
        links: [
          { label: 'Admissions', href: '/admissions' },
          { label: 'Careers', href: '/careers' },
          { label: 'Downloads Center', href: '/downloads' },
          { label: 'Parent Portal', href: '/portal' },
          { label: 'Contact', href: '/contact' },
        ],
      },
    ],
  },
  pageHeads: {
    about: { show: true, eyebrow: 'Our School', title: 'A legacy of nurturing brilliance.', intro: 'Discover the story, people and values behind City Parents School.' },
    academics: { show: true, eyebrow: 'Academics', title: 'A continuous journey of discovery and excellence.', intro: 'From Kindergarten to the final year of Primary, our curriculum is carefully sequenced to build knowledge, skills and character at every stage.' },
    admissions: { show: true, eyebrow: 'Admissions 2026 / 2027', title: 'Begin your child’s journey with us.', intro: 'Our online admissions process makes it simple to apply, upload documents and track your application, from anywhere.' },
    news: { show: true, eyebrow: 'Newsroom', title: 'News & Events', intro: 'The latest stories, achievements and happenings from across the school.' },
    gallery: { show: true, eyebrow: 'Media Center', title: 'Life at City Parents, in pictures and film.', intro: 'Browse moments from across our school year, sports, academics, the arts, trips and our biggest celebrations.' },
    alumni: { show: true, eyebrow: 'Alumni', title: 'Once a City Parent, always a City Parent.', intro: 'Celebrating the achievements of our graduates around the world.' },
    careers: { show: true, eyebrow: 'Careers', title: 'Join our team.', intro: 'Build your career with a school that invests in its people.' },
    contact: { show: true, eyebrow: 'Contact', title: 'We would love to hear from you.', intro: 'Reach the right office quickly — admissions, general enquiries or a campus visit.' },
    'virtual-tour': { show: true, eyebrow: 'Virtual Tour', title: 'Explore our campus from anywhere.', intro: 'Take a guided look around our classrooms, laboratories and grounds.' },
    live: { show: true, eyebrow: 'Live TV', title: 'Watch City Parents live.', intro: 'Assemblies, events and ceremonies streamed to families wherever they are.' },
    downloads: { show: true, eyebrow: 'Downloads', title: 'Forms, prospectus and resources.', intro: 'Everything you need to download in one place.' },
    talent: { show: true, eyebrow: 'Talent Development Program', title: 'Where every talent finds its stage.', intro: 'Discover how we nurture each child’s gifts — in music, sport, the arts, debate, science and more.' },
  },
  taxonomies: {
    galleryCategories: ['Sports', 'Graduation', 'Trips', 'Academics', 'Arts', 'Events', 'Campus'],
    newsCategories: ['Achievement', 'Events', 'Campus', 'Academics', 'Community', 'Announcement'],
    eventCategories: ['Academic', 'Sports', 'Cultural', 'Parents', 'Holiday', 'Ceremony'],
  },
  admissionsFields: [],
  maintenance: {
    enabled: false,
    message: 'Our website is undergoing scheduled maintenance and will be back shortly. Thank you for your patience.',
  },
  sections: { welcome: true, pathways: true, why: true, admissionsCta: true, news: true, gallery: true, testimonials: true, visit: true, headTeacher: true, feeds: true },
  pages: {
    about: true, academics: true, admissions: true, news: true, gallery: true,
    alumni: true, careers: true, contact: true, virtualTour: true, live: true, downloads: true, talent: true,
  },
};

// Backwards-compatible alias used by components that only need static values.
export const site = siteDefaults;

export const primaryNav = [
  { label: 'About', href: '/about' },
  { label: 'Academics', href: '/academics' },
  { label: 'TDP', href: '/talent' },
  { label: 'Admissions', href: '/admissions' },
  { label: 'News & Events', href: '/news' },
  { label: 'Media', href: '/gallery' },
  { label: 'Alumni', href: '/alumni' },
  { label: 'Careers', href: '/careers' },
  { label: 'Contact', href: '/contact' },
] as const;

// Legacy export kept for any importer; the footer now reads config.footer.columns.
export const footerNav = {
  Explore: siteDefaults.footer.columns[0].links,
  Community: siteDefaults.footer.columns[1].links,
  Resources: siteDefaults.footer.columns[2].links,
} as const;
