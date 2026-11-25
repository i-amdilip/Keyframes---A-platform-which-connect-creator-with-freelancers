import React from 'react';
import { MARKETPLACE_CATEGORIES } from '@/src/constants/categories';
import type { AppView } from '@/src/types/marketplace';

interface FooterProps {
  onNavigate: (view: AppView, anchor?: string, category?: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-[#111114] border-t border-[#23232A] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-4 space-y-3">
            <span className="font-display text-xl font-bold tracking-tight text-white">
              Keyframe
            </span>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">
              The collaboration marketplace built exclusively for content creators, video editors,
              thumbnail architects, and production specialists.
            </p>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h3 className="text-sm font-semibold text-white">Marketplace</h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('explore-talent')}
                  className="hover:text-[#E8F553] transition-colors cursor-pointer"
                >
                  Explore Talent
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('find-projects')}
                  className="hover:text-[#E8F553] transition-colors cursor-pointer"
                >
                  Find Projects
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('landing', 'how-it-works')}
                  className="hover:text-[#E8F553] transition-colors cursor-pointer"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('landing', 'success-stories')}
                  className="hover:text-[#E8F553] transition-colors cursor-pointer"
                >
                  Success Stories
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">Popular Categories</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-zinc-400">
              {MARKETPLACE_CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => onNavigate('explore-talent', undefined, cat.name)}
                  className="text-left hover:text-[#E8F553] transition-colors truncate cursor-pointer"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#202027] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} Keyframe Marketplace. All rights reserved.</p>
          <p>Escrow milestone protection · 10% flat platform commission on completed orders.</p>
        </div>
      </div>
    </footer>
  );
}
