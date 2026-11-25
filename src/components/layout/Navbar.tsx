import React, { useState } from 'react';
import { ChevronDown, Menu, Search, X } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { Button } from '@/src/components/ui/primitives';
import type { AppView, UserRole } from '@/src/types/marketplace';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView, anchor?: string, category?: string, searchQuery?: string) => void;
  onOpenAuth: (mode: 'login' | 'signup', role?: UserRole) => void;
}

export function Navbar({ currentView, onNavigate, onOpenAuth }: NavbarProps) {
  const { firebaseUser, userAccount, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navQuery, setNavQuery] = useState('');

  const dashboardView: AppView =
    userAccount?.role === 'freelancer' ? 'freelancer-dashboard' : 'creator-dashboard';

  const handleNav = (view: AppView, anchor?: string, category?: string, searchQuery?: string) => {
    setMobileOpen(false);
    onNavigate(view, anchor, category, searchQuery);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleNav('explore-talent', undefined, undefined, navQuery.trim());
  };

  return (
    <header className="sticky top-0 z-40 bg-[#131316]/95 backdrop-blur-md border-b border-[#23232A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-5">
        {/* Left: Wordmark + Embedded Search Bar */}
        <div className="flex items-center gap-5 min-w-0">
          <button
            type="button"
            onClick={() => handleNav('landing')}
            className="font-display text-xl font-bold tracking-tight text-white hover:text-[#E8F553] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Keyframe
          </button>

          <form
            onSubmit={handleSearchSubmit}
            className="hidden lg:flex items-center bg-[#1A1A20] border border-[#2B2B34] rounded-lg p-1 pl-3.5 w-72 focus-within:border-[#E8F553]/70 transition-colors"
          >
            <input
              type="text"
              value={navQuery}
              onChange={(e) => setNavQuery(e.target.value)}
              placeholder="What service are you looking for today?"
              aria-label="Search creative services"
              className="bg-transparent text-xs text-white placeholder:text-zinc-500 focus:outline-none flex-1 min-w-0 pr-2"
            />
            <button
              type="submit"
              aria-label="Search talent"
              className="w-7 h-7 rounded-md bg-[#E8F553] text-[#131316] flex items-center justify-center hover:bg-[#DCF035] transition-colors shrink-0 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </form>
        </div>

        {/* Middle: Clean Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium text-zinc-300">
          <button
            type="button"
            onClick={() => handleNav('explore-talent')}
            className={`inline-flex items-center gap-1 whitespace-nowrap shrink-0 py-1 transition-colors cursor-pointer ${
              currentView === 'explore-talent' || currentView === 'freelancer-profile'
                ? 'text-[#E8F553]'
                : 'hover:text-white'
            }`}
          >
            Explore
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          </button>
          <button
            type="button"
            onClick={() => handleNav('find-projects')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors cursor-pointer ${
              currentView === 'find-projects' ? 'text-[#E8F553]' : 'hover:text-white'
            }`}
          >
            Find Projects
          </button>
          <button
            type="button"
            onClick={() => handleNav('landing', 'categories')}
            className="whitespace-nowrap shrink-0 py-1 hover:text-white transition-colors cursor-pointer"
          >
            Categories
          </button>
          {!firebaseUser && (
            <button
              type="button"
              onClick={() => onOpenAuth('signup', 'freelancer')}
              className="whitespace-nowrap shrink-0 py-1 hover:text-white transition-colors cursor-pointer"
            >
              Apply as Freelancer
            </button>
          )}
        </nav>

        {/* Right: Auth & Primary Actions */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {firebaseUser ? (
            <>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleNav('admin-dashboard')}
                  className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    currentView === 'admin-dashboard'
                      ? 'text-[#E8F553]'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  Admin
                </button>
              )}
              <button
                type="button"
                onClick={() => logout()}
                className="text-sm font-medium text-zinc-400 hover:text-white whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                Log out
              </button>
              <Button
                size="sm"
                className="rounded-full px-4"
                onClick={() => handleNav(dashboardView)}
              >
                {userAccount?.role === 'freelancer' ? 'Freelancer Studio' : 'Creator Studio'}
              </Button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="text-sm font-medium text-zinc-300 hover:text-white whitespace-nowrap shrink-0 pr-2 border-r border-[#2C2C35] transition-colors cursor-pointer"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('signup', 'creator')}
                className="px-4 py-1.5 text-xs font-medium text-white border border-[#363642] hover:border-zinc-400 rounded-full whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                Sign Up
              </button>
              <Button
                size="sm"
                className="rounded-full px-4"
                onClick={() => handleNav('explore-talent')}
              >
                Find Freelancers
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Trigger */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          className="md:hidden p-2 text-zinc-300 hover:bg-[#1E1E24] rounded-lg transition-colors cursor-pointer"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#23232A] bg-[#16161B] px-4 py-4 space-y-3">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center bg-[#1C1C22] border border-[#2C2C35] rounded-lg p-1 pl-3"
          >
            <input
              type="text"
              value={navQuery}
              onChange={(e) => setNavQuery(e.target.value)}
              placeholder="What service are you looking for?"
              className="bg-transparent text-xs text-white placeholder:text-zinc-500 focus:outline-none flex-1"
            />
            <button
              type="submit"
              aria-label="Search"
              className="w-7 h-7 rounded-md bg-[#E8F553] text-[#131316] flex items-center justify-center shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="flex flex-col space-y-2 text-sm font-medium text-zinc-300">
            <button type="button" onClick={() => handleNav('explore-talent')} className="text-left py-2 hover:text-[#E8F553]">
              Explore Talent
            </button>
            <button type="button" onClick={() => handleNav('find-projects')} className="text-left py-2 hover:text-[#E8F553]">
              Find Projects
            </button>
            <button type="button" onClick={() => handleNav('landing', 'categories')} className="text-left py-2 hover:text-[#E8F553]">
              Categories
            </button>
            <button type="button" onClick={() => handleNav('landing', 'how-it-works')} className="text-left py-2 hover:text-[#E8F553]">
              How It Works
            </button>
          </div>
          <div className="pt-3 border-t border-[#23232A] flex items-center gap-3">
            {firebaseUser ? (
              <>
                <Button className="flex-1 rounded-full" size="sm" onClick={() => handleNav(dashboardView)}>
                  Open Studio
                </Button>
                {isAdmin && (
                  <Button variant="secondary" size="sm" onClick={() => handleNav('admin-dashboard')}>
                    Admin
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => logout()}>
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  className="flex-1 rounded-full"
                  size="sm"
                  onClick={() => {
                    setMobileOpen(false);
                    onOpenAuth('login');
                  }}
                >
                  Login
                </Button>
                <Button
                  className="flex-1 rounded-full"
                  size="sm"
                  onClick={() => {
                    setMobileOpen(false);
                    onOpenAuth('signup');
                  }}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
