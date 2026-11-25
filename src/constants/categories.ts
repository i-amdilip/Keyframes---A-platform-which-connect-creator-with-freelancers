export interface DefaultCategory {
  slug: string;
  name: string;
  description: string;
  typicalBudget: string;
}

export const PLATFORM_COMMISSION_RATE = 0.1;

export const MARKETPLACE_CATEGORIES: DefaultCategory[] = [
  {
    slug: 'video-editing',
    name: 'Video Editing',
    description: 'Long-form YouTube documentaries, vlogs, and podcast post-production.',
    typicalBudget: '$250 – $1,500',
  },
  {
    slug: 'reels-and-shorts-editing',
    name: 'Reels and Shorts Editing',
    description: 'High-retention vertical edits with kinetic captions and sound design.',
    typicalBudget: '$45 – $250',
  },
  {
    slug: 'thumbnail-design',
    name: 'Thumbnail Design',
    description: 'CTR-tested YouTube covers, visual storytelling, and A/B concepts.',
    typicalBudget: '$35 – $180',
  },
  {
    slug: 'graphic-design',
    name: 'Graphic Design',
    description: 'Channel banners, sponsor media kits, carousel decks, and merch graphics.',
    typicalBudget: '$80 – $600',
  },
  {
    slug: 'motion-graphics',
    name: 'Motion Graphics',
    description: 'Custom lower thirds, explainer sequences, and data callout packages.',
    typicalBudget: '$200 – $1,200',
  },
  {
    slug: 'script-writing',
    name: 'Script Writing',
    description: 'Hook-driven video essays, retention pacing, and narrative outlines.',
    typicalBudget: '$120 – $800',
  },
  {
    slug: 'content-writing',
    name: 'Content Writing',
    description: 'Creator newsletters, sponsor copy, community posts, and show notes.',
    typicalBudget: '$75 – $450',
  },
  {
    slug: 'social-media-management',
    name: 'Social Media Management',
    description: 'Multi-channel publishing calendars, clips distribution, and analytics.',
    typicalBudget: '$400 – $2,000',
  },
  {
    slug: 'voiceovers',
    name: 'Voiceovers',
    description: 'Broadcast-quality narration, character reads, and documentary VO.',
    typicalBudget: '$60 – $400',
  },
  {
    slug: 'content-research',
    name: 'Content Research',
    description: 'Topic validation, archival sourcing, fact-checking, and guest briefs.',
    typicalBudget: '$90 – $500',
  },
  {
    slug: 'animation',
    name: 'Animation',
    description: '2D character storytelling, whiteboard sequences, and 3D product intros.',
    typicalBudget: '$300 – $2,400',
  },
  {
    slug: 'branding',
    name: 'Branding',
    description: 'Complete creator visual identity, typography systems, and sonic marks.',
    typicalBudget: '$450 – $3,000',
  },
];
