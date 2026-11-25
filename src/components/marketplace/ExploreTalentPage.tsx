import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, Star } from 'lucide-react';
import { MARKETPLACE_CATEGORIES } from '@/src/constants/categories';
import { SHOWCASE_FREELANCERS } from '@/src/data/showcaseSamples';
import { formatCurrency } from '@/src/lib/utils';
import { Button, Input, SafeImage, Select } from '@/src/components/ui/primitives';
import type { CategoryItem, FreelancerProfile } from '@/src/types/marketplace';

interface ExploreTalentPageProps {
  liveFreelancers: FreelancerProfile[];
  categories: CategoryItem[];
  initialCategory?: string;
  initialSearch?: string;
  onSelectFreelancer: (freelancer: FreelancerProfile) => void;
  onHireFreelancer: (freelancer: FreelancerProfile) => void;
}

export function ExploreTalentPage({
  liveFreelancers,
  categories,
  initialCategory = 'All',
  initialSearch = '',
  onSelectFreelancer,
  onHireFreelancer,
}: ExploreTalentPageProps) {
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'All');
  const [maxBudget, setMaxBudget] = useState<string>('all');
  const [minRating, setMinRating] = useState<string>('0');
  const [sortBy, setSortBy] = useState<'popular' | 'price_asc' | 'price_desc' | 'rating'>('popular');

  React.useEffect(() => {
    if (initialCategory) setSelectedCategory(initialCategory);
  }, [initialCategory]);

  React.useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  const categoryOptions = useMemo(() => {
    const names = new Set(MARKETPLACE_CATEGORIES.map((c) => c.name));
    categories.filter((c) => c.active).forEach((c) => names.add(c.name));
    return ['All', ...Array.from(names)];
  }, [categories]);

  const allFreelancers = useMemo(() => {
    const activeLive = liveFreelancers.filter((f) => f.status === 'active');
    return [...activeLive, ...SHOWCASE_FREELANCERS];
  }, [liveFreelancers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const budgetLimit = maxBudget === 'all' ? Infinity : Number(maxBudget);
    const ratingFloor = Number(minRating) || 0;

    const list = allFreelancers.filter((f) => {
      if (selectedCategory !== 'All' && f.category !== selectedCategory) return false;
      if (f.startingPrice > budgetLimit) return false;
      if (f.rating < ratingFloor) return false;
      if (q) {
        const hay = `${f.name} ${f.headline} ${f.category} ${f.skills.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price_asc') return a.startingPrice - b.startingPrice;
      if (sortBy === 'price_desc') return b.startingPrice - a.startingPrice;
      if (sortBy === 'rating') return b.rating - a.rating || b.reviewCount - a.reviewCount;
      return b.completedOrders + b.reviewCount - (a.completedOrders + a.reviewCount);
    });
  }, [allFreelancers, search, selectedCategory, maxBudget, minRating, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-white">
          Explore Creative Talent
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 mt-1.5">
          Discover video editors, thumbnail designers, scriptwriters, and motion specialists vetted for creator channels.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-4 sm:p-5 mb-8 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, tool, or skill (e.g. DaVinci, Thumbnail)..."
              className="pl-10"
            />
          </div>
          <div className="md:col-span-2">
            <Select value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} aria-label="Max budget">
              <option value="all">Any budget</option>
              <option value="150">Up to $150</option>
              <option value="400">Up to $400</option>
              <option value="1000">Up to $1,000</option>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Select value={minRating} onChange={(e) => setMinRating(e.target.value)} aria-label="Minimum rating">
              <option value="0">Any rating</option>
              <option value="4.5">4.5+ stars</option>
              <option value="4.8">4.8+ stars</option>
              <option value="5">5.0 stars</option>
            </Select>
          </div>
          <div className="md:col-span-3">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              aria-label="Sort freelancers"
            >
              <option value="popular">Sort: Popularity</option>
              <option value="rating">Sort: Highest Rated</option>
              <option value="price_asc">Sort: Price Low to High</option>
              <option value="price_desc">Sort: Price High to Low</option>
            </Select>
          </div>
        </div>

        {/* Interactive Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500 mr-1 shrink-0" />
          {categoryOptions.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-full whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#E8F553] text-[#131316] font-semibold'
                  : 'bg-[#222229] text-zinc-300 hover:bg-[#2C2C35] hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-5 text-xs text-zinc-400">
        <span>
          Showing <strong className="text-white tabular-nums">{filtered.length}</strong>{' '}
          {filtered.length === 1 ? 'specialist' : 'specialists'}
          {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
        </span>
        {(search || selectedCategory !== 'All' || maxBudget !== 'all' || minRating !== '0') && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setSelectedCategory('All');
              setMaxBudget('all');
              setMinRating('0');
            }}
            className="text-[#E8F553] font-medium hover:underline cursor-pointer"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Freelancer Grid */}
      {filtered.length === 0 ? (
        <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-12 text-center">
          <h3 className="font-display text-lg font-semibold text-white mb-1">
            No matching freelancers found
          </h3>
          <p className="text-sm text-zinc-400 mb-5">
            Try widening your budget limit or switching back to all categories.
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setSearch('');
              setSelectedCategory('All');
              setMaxBudget('all');
              setMinRating('0');
            }}
          >
            Clear All Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((freelancer) => (
            <article
              key={freelancer.id}
              className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl overflow-hidden flex flex-col hover:border-[#E8F553]/60 transition-colors"
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
                    className="w-11 h-11 rounded-full object-cover border border-[#34343F] shrink-0"
                  />
                  <div className="min-w-0">
                    <h2 className="font-display text-base font-semibold text-white truncate">
                      {freelancer.name}
                    </h2>
                    <p className="text-xs text-zinc-400 truncate">
                      {freelancer.category}
                      {freelancer.isSample ? ' · Showcase Preview' : ''}
                    </p>
                  </div>
                </div>

                <p className="text-sm font-medium text-zinc-200 leading-snug mb-2 line-clamp-2">
                  {freelancer.headline}
                </p>

                <p className="text-xs text-zinc-500 mb-4 truncate">
                  {freelancer.skills.join(' · ')}
                </p>

                <div className="flex items-center justify-between text-xs text-zinc-400 mb-4 tabular-nums">
                  <span className="inline-flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-[#E8F553] text-[#E8F553]" />
                    <strong className="text-white">{freelancer.rating.toFixed(1)}</strong>
                    <span>({freelancer.reviewCount})</span>
                  </span>
                  <span>
                    Starting at <strong className="text-white">{formatCurrency(freelancer.startingPrice)}</strong>
                  </span>
                </div>

                <div className="mt-auto pt-4 border-t border-[#262630] grid grid-cols-2 gap-2.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-full"
                    onClick={() => onSelectFreelancer(freelancer)}
                  >
                    View Profile
                  </Button>
                  <Button size="sm" className="rounded-full" onClick={() => onHireFreelancer(freelancer)}>
                    Hire Now
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
