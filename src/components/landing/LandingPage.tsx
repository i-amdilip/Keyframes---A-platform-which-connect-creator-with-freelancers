import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Search, ShieldCheck, Star } from 'lucide-react';
import { MARKETPLACE_CATEGORIES } from '@/src/constants/categories';
import {
  AVATAR_ELENA,
  AVATAR_MARCUS,
  AVATAR_MAYA,
  HERO_STUDIO_IMAGE,
  PORTFOLIO_MOTION_IMAGE,
  PORTFOLIO_VIDEO_IMAGE,
  SHOWCASE_FREELANCERS,
  SHOWCASE_PROJECTS,
  SHOWCASE_REVIEWS,
} from '@/src/data/showcaseSamples';
import { formatCurrency } from '@/src/lib/utils';
import { Button, SafeImage } from '@/src/components/ui/primitives';
import type { AppView, FreelancerProfile, Project, UserRole } from '@/src/types/marketplace';

interface LandingPageProps {
  liveFreelancers: FreelancerProfile[];
  liveProjects: Project[];
  onNavigate: (view: AppView, anchor?: string, category?: string, searchQuery?: string) => void;
  onSelectFreelancer: (freelancer: FreelancerProfile) => void;
  onOpenAuth: (mode: 'login' | 'signup', role?: UserRole) => void;
}

const HERO_QUICK_TAGS = [
  'Video Editing',
  'Thumbnail Design',
  'Motion Graphics',
  'Script Writing',
];

export function LandingPage({
  liveFreelancers,
  liveProjects,
  onNavigate,
  onSelectFreelancer,
  onOpenAuth,
}: LandingPageProps) {
  const [heroSearch, setHeroSearch] = useState('');

  const featuredFreelancers = [
    ...liveFreelancers.filter((f) => f.status === 'active'),
    ...SHOWCASE_FREELANCERS,
  ].slice(0, 3);

  const trendingProjects = [
    ...liveProjects.filter((p) => p.status === 'open'),
    ...SHOWCASE_PROJECTS,
  ].slice(0, 4);

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('explore-talent', undefined, undefined, heroSearch.trim());
  };

  return (
    <div className="bg-[#131316] text-white">
      {/* Hero Section matching reference layout */}
      <section className="pt-12 sm:pt-16 pb-16 border-b border-[#222229]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Centered Headline with inline lime search badge and 3-avatar cluster */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="font-display text-[clamp(2.25rem,4.6vw,3.75rem)] font-bold tracking-tight text-white leading-[1.15] text-balance">
              <span className="inline-flex flex-wrap items-center justify-center gap-x-3.5 gap-y-2">
                <span>Find</span>
                <span
                  aria-hidden="true"
                  className="inline-flex items-center justify-center w-16 h-9 sm:w-20 sm:h-11 rounded-full border border-[#E8F553]/70 bg-[#1B1B20] text-[#E8F553]"
                >
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                </span>
                <span>Best Creative</span>
              </span>
              <br />
              <span className="inline-flex flex-wrap items-center justify-center gap-x-3.5 gap-y-2 mt-1">
                <span>Services</span>
                <span className="inline-flex items-center -space-x-2.5" aria-hidden="true">
                  <SafeImage
                    src={AVATAR_MAYA}
                    alt="Maya Lin"
                    className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-[#E8F553]"
                  />
                  <SafeImage
                    src={AVATAR_MARCUS}
                    alt="Marcus Vance"
                    className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-[#E8F553]"
                  />
                  <SafeImage
                    src={AVATAR_ELENA}
                    alt="Elena Rostova"
                    className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-[#E8F553]"
                  />
                </span>
                <span>For Your Channel</span>
              </span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto mt-4">
              Create More. Collaborate Better. Earn Together. Connect with editors, thumbnail
              designers, and creative specialists ready to elevate every upload.
            </p>

            {/* Centered Search Bar */}
            <form
              onSubmit={handleHeroSearchSubmit}
              className="mt-7 max-w-md mx-auto flex items-center bg-[#1A1A20] border border-[#2D2D37] rounded-xl p-1.5 pl-4 focus-within:border-[#E8F553]/80 transition-colors"
            >
              <input
                type="text"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="What service are you looking for today?"
                aria-label="Search creative service"
                className="bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none flex-1 min-w-0 pr-2"
              />
              <button
                type="submit"
                aria-label="Search services"
                className="w-9 h-9 rounded-lg bg-[#E8F553] text-[#131316] flex items-center justify-center hover:bg-[#DCF035] transition-colors shrink-0 cursor-pointer"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>

            {/* 4 Quick Category Filter Buttons */}
            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
              {HERO_QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onNavigate('explore-talent', undefined, tag)}
                  className="px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-[#131316] hover:bg-[#E8F553] border border-[#2F2F39] hover:border-[#E8F553] rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 3-Card Asymmetric Visual Showcase flanked by dark rounded tiles */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* Left Elevated Showcase Card */}
            <div className="md:col-span-4">
              <button
                type="button"
                onClick={() => onNavigate('explore-talent', undefined, 'Video Editing')}
                className="group w-full text-left bg-[#1A1A20] border border-[#282832] hover:border-[#E8F553]/60 rounded-2xl p-3 transition-all duration-150 hover:-translate-y-0.5 cursor-pointer"
              >
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#131316]">
                  <SafeImage
                    src={HERO_STUDIO_IMAGE}
                    alt="Video Editing & Color Studio"
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                    fallbackTitle="Video Editing"
                  />
                </div>
                <p className="text-center text-sm font-medium text-zinc-200 group-hover:text-[#E8F553] pt-3 pb-1 transition-colors">
                  Video Editing
                </p>
              </button>
            </div>

            {/* Center Lowered Card + Subtle Grid Tiles */}
            <div className="md:col-span-4 md:pt-8">
              <div className="relative flex items-center justify-center gap-2.5">
                {/* Left 2x3 Decorative Subtle Rounded Tiles */}
                <div className="hidden lg:grid grid-cols-2 gap-2 shrink-0" aria-hidden="true">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="w-10 h-14 rounded-xl bg-[#16161A] border border-[#22222A]"
                    />
                  ))}
                </div>

                {/* Center Showcase Card */}
                <button
                  type="button"
                  onClick={() => onNavigate('explore-talent', undefined, 'Motion Graphics')}
                  className="group w-full text-left bg-[#1A1A20] border border-[#282832] hover:border-[#E8F553]/60 rounded-2xl p-3 transition-all duration-150 hover:-translate-y-0.5 cursor-pointer"
                >
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#131316]">
                    <SafeImage
                      src={PORTFOLIO_MOTION_IMAGE}
                      alt="Motion Graphics & 3D Packaging"
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                      fallbackTitle="Motion Graphics"
                    />
                  </div>
                  <p className="text-center text-sm font-medium text-zinc-200 group-hover:text-[#E8F553] pt-3 pb-1 transition-colors">
                    Motion & Animation
                  </p>
                </button>

                {/* Right 2x3 Decorative Subtle Rounded Tiles */}
                <div className="hidden lg:grid grid-cols-2 gap-2 shrink-0" aria-hidden="true">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="w-10 h-14 rounded-xl bg-[#16161A] border border-[#22222A]"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Elevated Showcase Card */}
            <div className="md:col-span-4">
              <button
                type="button"
                onClick={() => onNavigate('explore-talent', undefined, 'Reels and Shorts Editing')}
                className="group w-full text-left bg-[#1A1A20] border border-[#282832] hover:border-[#E8F553]/60 rounded-2xl p-3 transition-all duration-150 hover:-translate-y-0.5 cursor-pointer"
              >
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#131316]">
                  <SafeImage
                    src={PORTFOLIO_VIDEO_IMAGE}
                    alt="Documentary & Production"
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                    fallbackTitle="Documentary & Reels"
                  />
                </div>
                <p className="text-center text-sm font-medium text-zinc-200 group-hover:text-[#E8F553] pt-3 pb-1 transition-colors">
                  Documentary & Reels
                </p>
              </button>
            </div>
          </div>

          {/* Primary Dual CTAs cleanly below showcase */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3.5">
            <Button size="lg" className="rounded-full px-7" onClick={() => onNavigate('explore-talent')}>
              Find Creative Talent
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full px-7"
              onClick={() => onOpenAuth('signup', 'freelancer')}
            >
              Start Earning
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Categories Section */}
      <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Featured categories
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 mt-1.5">
            Discover the most popular picks, handpicked just for you.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MARKETPLACE_CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => onNavigate('explore-talent', undefined, cat.name)}
              className="group text-left bg-[#1A1A20] border border-[#282832] hover:border-[#E8F553]/60 rounded-2xl p-5 transition-all duration-150 hover:-translate-y-0.5 cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-display text-base font-semibold text-white group-hover:text-[#E8F553] transition-colors">
                  {cat.name}
                </h3>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-[#E8F553] transition-colors shrink-0" />
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-3 line-clamp-2">
                {cat.description}
              </p>
              <p className="text-xs font-mono tabular-nums text-zinc-500">
                Typical {cat.typicalBudget}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Freelancers */}
      <section className="bg-[#17171B] border-y border-[#23232B] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Featured Creative Freelancers
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 mt-1.5">
                Vetted editors, motion directors, and packaging specialists ready for your next upload.
              </p>
            </div>
            <Button variant="secondary" size="sm" className="rounded-full" onClick={() => onNavigate('explore-talent')}>
              Explore All Talent
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredFreelancers.map((freelancer) => (
              <div
                key={freelancer.id}
                className="bg-[#1C1C22] border border-[#2A2A33] rounded-2xl overflow-hidden flex flex-col hover:border-[#E8F553]/60 transition-colors"
              >
                <div className="aspect-[4/3] bg-[#131316] overflow-hidden">
                  <SafeImage
                    src={freelancer.portfolioItems[0]?.imageUrl || freelancer.coverUrl}
                    alt={`${freelancer.name} portfolio preview`}
                    className="w-full h-full object-cover"
                    fallbackTitle={freelancer.category}
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <SafeImage
                      src={freelancer.avatarUrl}
                      alt={freelancer.name}
                      className="w-10 h-10 rounded-full object-cover border border-[#34343F] shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="font-display text-base font-semibold text-white truncate">
                        {freelancer.name}
                      </h3>
                      <p className="text-xs text-zinc-400 truncate">
                        {freelancer.category}
                        {freelancer.isSample ? ' · Showcase Preview' : ''}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-300 leading-snug mb-3 line-clamp-2">
                    {freelancer.headline}
                  </p>

                  <p className="text-xs text-zinc-500 mb-5 truncate">
                    {freelancer.skills.slice(0, 3).join(' · ')}
                  </p>

                  <div className="mt-auto pt-4 border-t border-[#282832] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-zinc-400 tabular-nums">
                      <span className="inline-flex items-center gap-1 font-semibold text-white">
                        <Star className="w-3.5 h-3.5 fill-[#E8F553] text-[#E8F553]" />
                        {freelancer.rating.toFixed(1)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>From {formatCurrency(freelancer.startingPrice)}</span>
                    </div>
                    <Button size="sm" className="rounded-full" onClick={() => onSelectFreelancer(freelancer)}>
                      View Profile
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Projects */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Trending Creator Projects
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 mt-1.5">
              Open production briefs posted by channels hiring right now.
            </p>
          </div>
          <Button variant="secondary" size="sm" className="rounded-full" onClick={() => onNavigate('find-projects')}>
            Browse All Projects
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {trendingProjects.map((project) => (
            <div
              key={project.id}
              className="bg-[#1A1A20] border border-[#282832] rounded-2xl p-6 flex flex-col justify-between hover:border-[#E8F553]/60 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-4 text-xs text-zinc-400 mb-2">
                  <span>
                    {project.category} · {project.creatorName}
                    {project.isSample ? ' · Showcase' : ''}
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-[#E8F553]">
                    {formatCurrency(project.budget)}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold text-white mb-2">
                  {project.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2 mb-4">
                  {project.description}
                </p>
              </div>
              <div className="pt-4 border-t border-[#262630] flex items-center justify-between gap-4">
                <span className="text-xs text-zinc-500 truncate">
                  {project.requiredSkills.join(' · ')}
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('find-projects')}
                  className="text-xs font-semibold text-[#E8F553] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  View Brief →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How Keyframe Works */}
      <section id="how-it-works" className="bg-[#17171B] border-y border-[#23232B] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
              How Keyframe Works
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 mt-1.5">
              One structured workflow connecting briefs, creative reviews, and transparent payouts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border-t-2 border-[#E8F553] pt-5">
              <h3 className="font-display text-lg font-semibold text-white mb-2">
                01. Post a Project or Browse Talent
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Creators publish clear production briefs with budget and deadline, or directly hire
                specialists after inspecting portfolio reels and service packages.
              </p>
            </div>
            <div className="border-t-2 border-[#2D2D37] pt-5">
              <h3 className="font-display text-lg font-semibold text-white mb-2">
                02. Collaborate & Track Deliverables
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Accepting a proposal opens a dedicated order and real-time message thread where
                reference links, cuts, and revision notes stay organized.
              </p>
            </div>
            <div className="border-t-2 border-[#2D2D37] pt-5">
              <h3 className="font-display text-lg font-semibold text-white mb-2">
                03. Approve Cuts & Release Payouts
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Creators inspect final deliveries, approve completed orders, and leave verified
                reviews while freelancers withdraw earnings with a clear 10% fee breakdown.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose & Testimonials */}
      <section id="success-stories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mb-14">
          <div className="lg:col-span-5">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
              Why Channels and Freelancers Choose Keyframe
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              Built around how modern production teams actually ship—not generic office gigs.
            </p>
          </div>
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-[#1A1A20] border border-[#282832] rounded-2xl p-5">
              <ShieldCheck className="w-5 h-5 text-[#E8F553] mb-3" />
              <h3 className="font-display text-base font-semibold text-white mb-1">
                Verified Creator Portfolios
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Every specialist lists concrete channel outcomes, turnaround estimates, and transparent package pricing.
              </p>
            </div>
            <div className="bg-[#1A1A20] border border-[#282832] rounded-2xl p-5">
              <CheckCircle2 className="w-5 h-5 text-[#E8F553] mb-3" />
              <h3 className="font-display text-base font-semibold text-white mb-1">
                Structured Revision Loop
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Order milestones track work from briefing to final approval so nothing gets lost across DMs.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SHOWCASE_REVIEWS.map((review) => (
            <blockquote
              key={review.id}
              className="bg-[#1A1A20] border border-[#282832] rounded-2xl p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1 text-[#E8F553] mb-3">
                  {Array.from({ length: review.rating }).map((_, idx) => (
                    <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">“{review.comment}”</p>
              </div>
              <footer className="mt-5 pt-4 border-t border-[#262630] text-xs font-medium text-white">
                {review.creatorName}
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-[#1C1C23] border border-[#30303C] rounded-2xl p-8 sm:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-balance text-white">
              Ready to ship your next video, rebrand, or client sprint?
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 mt-2">
              Join Keyframe as a Content Creator to hire vetted specialists, or create your
              Freelancer studio to win recurring production retainers.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button size="lg" className="rounded-full px-6" onClick={() => onOpenAuth('signup', 'creator')}>
              Hire as Creator
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full px-6"
              onClick={() => onOpenAuth('signup', 'freelancer')}
            >
              Join as Freelancer
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
