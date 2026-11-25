import React, { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { PLATFORM_COMMISSION_RATE } from '@/src/constants/categories';
import { AuthProvider, useAuth } from '@/src/contexts/AuthContext';
import {
  createNotification,
  createOrderAndEscrow,
  ensureConversation,
  subscribeCategories,
  subscribeFreelancers,
  subscribeProjects,
  subscribeReviews,
} from '@/src/lib/firestoreService';
import { formatCurrency } from '@/src/lib/utils';
import { AuthModal, OnboardingModal } from '@/src/components/auth/AuthModal';
import { AdminDashboard } from '@/src/components/dashboard/AdminDashboard';
import { CreatorDashboard } from '@/src/components/dashboard/CreatorDashboard';
import { FreelancerDashboard } from '@/src/components/dashboard/FreelancerDashboard';
import { LandingPage } from '@/src/components/landing/LandingPage';
import { Footer } from '@/src/components/layout/Footer';
import { Navbar } from '@/src/components/layout/Navbar';
import { ExploreTalentPage } from '@/src/components/marketplace/ExploreTalentPage';
import { FindProjectsPage } from '@/src/components/marketplace/FindProjectsPage';
import { FreelancerProfilePage } from '@/src/components/marketplace/FreelancerProfilePage';
import { ErrorBoundary } from '@/src/components/ui/ErrorBoundary';
import { Button, Input, Modal } from '@/src/components/ui/primitives';
import type {
  AppView,
  CategoryItem,
  FreelancerProfile,
  Project,
  Review,
  ServicePackage,
  UserRole,
} from '@/src/types/marketplace';

function MarketplaceShell() {
  const { firebaseUser, userAccount, isAdmin, loading } = useAuth();

  const [view, setView] = useState<AppView>('landing');
  const [talentCategory, setTalentCategory] = useState<string>('All');
  const [talentSearch, setTalentSearch] = useState<string>('');
  const [selectedFreelancer, setSelectedFreelancer] = useState<FreelancerProfile | null>(null);

  // Public Firestore real-time data
  const [liveFreelancers, setLiveFreelancers] = useState<FreelancerProfile[]>([]);
  const [liveProjects, setLiveProjects] = useState<Project[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  // Auth modal state
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authRole, setAuthRole] = useState<UserRole>('creator');

  // Direct Hire Modal state
  const [hireModal, setHireModal] = useState<{
    freelancer: FreelancerProfile;
    pkg?: ServicePackage;
  } | null>(null);
  const [hireTitle, setHireTitle] = useState('');
  const [hirePrice, setHirePrice] = useState('250');
  const [hireDeadline, setHireDeadline] = useState('2026-12-18');
  const [hireBusy, setHireBusy] = useState(false);
  const [hireError, setHireError] = useState('');

  // Dashboard routing context
  const [creatorTab, setCreatorTab] = useState<'overview' | 'orders' | 'messages'>('overview');
  const [freelancerTab, setFreelancerTab] = useState<'overview' | 'messages'>('overview');
  const [activeConvId, setActiveConvId] = useState<string | null>(null);

  // Showcase preview notice modal
  const [showcaseNotice, setShowcaseNotice] = useState<string | null>(null);

  useEffect(() => {
    const u1 = subscribeFreelancers(setLiveFreelancers);
    const u2 = subscribeProjects(setLiveProjects);
    const u3 = subscribeReviews(setReviews);
    const u4 = subscribeCategories(setCategories);
    return () => {
      u1();
      u2();
      u3();
      u4();
    };
  }, []);

  const handleNavigate = (
    nextView: AppView,
    anchor?: string,
    category?: string,
    searchQuery?: string
  ) => {
    if (category) {
      setTalentCategory(category);
    } else if (nextView === 'explore-talent' && view !== 'explore-talent') {
      setTalentCategory('All');
    }

    if (typeof searchQuery === 'string') {
      setTalentSearch(searchQuery);
    } else if (nextView === 'explore-talent' && view !== 'explore-talent') {
      setTalentSearch('');
    }

    // Protected dashboard route checks
    if (
      (nextView === 'creator-dashboard' ||
        nextView === 'freelancer-dashboard' ||
        nextView === 'admin-dashboard') &&
      !firebaseUser
    ) {
      setAuthMode('login');
      setAuthOpen(true);
      return;
    }

    setView(nextView);

    if (anchor) {
      setTimeout(() => {
        const el = document.getElementById(anchor);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenAuth = (mode: 'login' | 'signup', role: UserRole = 'creator') => {
    setAuthMode(mode);
    setAuthRole(role);
    setAuthOpen(true);
  };

  const handleSelectFreelancer = (freelancer: FreelancerProfile) => {
    setSelectedFreelancer(freelancer);
    setView('freelancer-profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHireFreelancer = (freelancer: FreelancerProfile, pkg?: ServicePackage) => {
    if (!firebaseUser) {
      handleOpenAuth('signup', 'creator');
      return;
    }
    if (freelancer.isSample) {
      setShowcaseNotice(
        `${freelancer.name} is a curated showcase preview profile. To test end-to-end hiring and messaging with real Firestore accounts, publish a Freelancer profile from another account or post a live project brief in Find Projects.`
      );
      return;
    }
    if (freelancer.uid === firebaseUser.uid) {
      setShowcaseNotice('You cannot place an order on your own freelancer profile.');
      return;
    }
    setHireTitle(pkg ? `${pkg.name} with ${freelancer.name}` : `${freelancer.category} Project`);
    setHirePrice(String(pkg?.price || freelancer.startingPrice));
    setHireError('');
    setHireModal({ freelancer, pkg });
  };

  const handleConfirmHire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hireModal || !firebaseUser) return;
    if (hireTitle.trim().length < 3) {
      setHireError('Enter a short order title (min 3 characters).');
      return;
    }
    setHireBusy(true);
    setHireError('');
    try {
      const price = Math.max(5, Number(hirePrice) || hireModal.freelancer.startingPrice);
      await createOrderAndEscrow({
        title: hireTitle.trim(),
        category: hireModal.freelancer.category,
        creatorUid: firebaseUser.uid,
        creatorName: userAccount?.channelName || userAccount?.displayName || 'Creator',
        freelancerUid: hireModal.freelancer.uid,
        freelancerName: hireModal.freelancer.name,
        price,
        deadline: hireDeadline,
      });
      await createNotification({
        recipientUid: hireModal.freelancer.uid,
        title: 'New direct order received',
        body: `${userAccount?.displayName || 'A creator'} hired you for "${hireTitle.trim()}" (${formatCurrency(price)}).`,
        linkTab: 'orders',
      });
      setHireModal(null);
      setCreatorTab('orders');
      setView('creator-dashboard');
    } catch (err) {
      setHireError(err instanceof Error ? err.message : 'Unable to create order.');
    } finally {
      setHireBusy(false);
    }
  };

  const handleContactFreelancer = async (freelancer: FreelancerProfile) => {
    if (!firebaseUser) {
      handleOpenAuth('login', 'creator');
      return;
    }
    if (freelancer.isSample) {
      setShowcaseNotice(
        `${freelancer.name} is a showcase preview profile. Real-time messaging connects live registered Creator and Freelancer accounts.`
      );
      return;
    }
    if (freelancer.uid === firebaseUser.uid) {
      setShowcaseNotice('You cannot open a direct chat with yourself.');
      return;
    }
    const convId = await ensureConversation({
      creatorUid: firebaseUser.uid,
      creatorName: userAccount?.displayName || 'Creator',
      freelancerUid: freelancer.uid,
      freelancerName: freelancer.name,
      projectTitle: `Inquiry · ${freelancer.category}`,
    });
    setActiveConvId(convId);
    if (userAccount?.role === 'freelancer') {
      setFreelancerTab('messages');
      setView('freelancer-dashboard');
    } else {
      setCreatorTab('messages');
      setView('creator-dashboard');
    }
  };

  const isSuspended = userAccount?.accountStatus === 'suspended';

  return (
    <div className="min-h-screen flex flex-col bg-[#131316] text-white">
      <Navbar
        currentView={view}
        onNavigate={handleNavigate}
        onOpenAuth={(mode, role) => handleOpenAuth(mode, role)}
      />

      {isSuspended && (
        <div className="bg-red-500/10 border-b border-red-500/30 text-red-300 px-4 py-3 text-sm text-center flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Your account is currently suspended by platform moderation. Contact support to restore access.</span>
        </div>
      )}

      <div className="flex-1">
        {loading && view !== 'landing' ? (
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="h-10 w-56 bg-[#1C1C22] rounded-lg animate-pulse mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-64 bg-[#1A1A20] border border-[#2A2A33] rounded-2xl animate-pulse" />
              <div className="h-64 bg-[#1A1A20] border border-[#2A2A33] rounded-2xl animate-pulse" />
              <div className="h-64 bg-[#1A1A20] border border-[#2A2A33] rounded-2xl animate-pulse" />
            </div>
          </div>
        ) : view === 'landing' ? (
          <LandingPage
            liveFreelancers={liveFreelancers}
            liveProjects={liveProjects}
            onNavigate={handleNavigate}
            onSelectFreelancer={handleSelectFreelancer}
            onOpenAuth={handleOpenAuth}
          />
        ) : view === 'explore-talent' ? (
          <ExploreTalentPage
            liveFreelancers={liveFreelancers}
            categories={categories}
            initialCategory={talentCategory}
            initialSearch={talentSearch}
            onSelectFreelancer={handleSelectFreelancer}
            onHireFreelancer={(fl) => handleHireFreelancer(fl)}
          />
        ) : view === 'freelancer-profile' && selectedFreelancer ? (
          <FreelancerProfilePage
            freelancer={selectedFreelancer}
            reviews={reviews}
            onBack={() => setView('explore-talent')}
            onHire={handleHireFreelancer}
            onContact={handleContactFreelancer}
            onRequireAuth={() => handleOpenAuth('login')}
          />
        ) : view === 'find-projects' ? (
          <FindProjectsPage
            liveProjects={liveProjects}
            liveFreelancers={liveFreelancers}
            categories={categories}
            onRequireAuth={(role) => handleOpenAuth('signup', role)}
          />
        ) : view === 'creator-dashboard' ? (
          <CreatorDashboard
            liveProjects={liveProjects}
            reviews={reviews}
            initialTab={creatorTab}
            initialConversationId={activeConvId}
            onNavigate={(v) => handleNavigate(v)}
          />
        ) : view === 'freelancer-dashboard' ? (
          <FreelancerDashboard
            liveFreelancers={liveFreelancers}
            liveProjects={liveProjects}
            initialTab={freelancerTab}
            initialConversationId={activeConvId}
            onNavigate={(v) => handleNavigate(v)}
          />
        ) : view === 'admin-dashboard' && isAdmin ? (
          <AdminDashboard
            liveFreelancers={liveFreelancers}
            liveProjects={liveProjects}
            categories={categories}
          />
        ) : (
          <LandingPage
            liveFreelancers={liveFreelancers}
            liveProjects={liveProjects}
            onNavigate={handleNavigate}
            onSelectFreelancer={handleSelectFreelancer}
            onOpenAuth={handleOpenAuth}
          />
        )}
      </div>

      <Footer onNavigate={handleNavigate} />

      <AuthModal
        open={authOpen}
        initialMode={authMode}
        initialRole={authRole}
        onClose={() => setAuthOpen(false)}
      />
      <OnboardingModal />

      {/* Direct Hire Confirmation Modal */}
      <Modal
        open={Boolean(hireModal)}
        onClose={() => setHireModal(null)}
        title={`Hire ${hireModal?.freelancer.name || ''}`}
        subtitle="Create a collaboration order with milestone tracking."
      >
        {hireModal && (
          <form onSubmit={handleConfirmHire} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Order Title</label>
              <Input value={hireTitle} onChange={(e) => setHireTitle(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Agreed Price (USD)</label>
                <Input
                  type="number"
                  min={5}
                  value={hirePrice}
                  onChange={(e) => setHirePrice(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Target Delivery</label>
                <Input
                  type="date"
                  value={hireDeadline}
                  onChange={(e) => setHireDeadline(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="bg-[#141419] border border-[#282832] rounded-xl p-3.5 text-xs space-y-1.5 tabular-nums">
              <div className="flex justify-between text-zinc-300">
                <span>Order Total</span>
                <span className="font-mono font-semibold text-white">
                  {formatCurrency(Number(hirePrice) || 0)}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Platform Commission ({Math.round(PLATFORM_COMMISSION_RATE * 100)}%)</span>
                <span className="font-mono">
                  {formatCurrency((Number(hirePrice) || 0) * PLATFORM_COMMISSION_RATE)}
                </span>
              </div>
              <div className="flex justify-between text-[#E8F553] pt-1.5 border-t border-[#262630] font-medium">
                <span>Freelancer Net Payout on Approval</span>
                <span className="font-mono">
                  {formatCurrency((Number(hirePrice) || 0) * (1 - PLATFORM_COMMISSION_RATE))}
                </span>
              </div>
            </div>

            {hireError && <p className="text-xs text-red-400">{hireError}</p>}

            <div className="flex justify-end gap-2.5">
              <Button type="button" variant="ghost" onClick={() => setHireModal(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={hireBusy}>
                {hireBusy ? 'Creating Order...' : 'Confirm & Open Order'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Showcase Preview Info Modal */}
      <Modal
        open={Boolean(showcaseNotice)}
        onClose={() => setShowcaseNotice(null)}
        title="Showcase Preview Profile"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-300 leading-relaxed">{showcaseNotice}</p>
          <div className="flex flex-wrap justify-end gap-2.5">
            <Button
              variant="secondary"
              onClick={() => {
                setShowcaseNotice(null);
                handleNavigate('find-projects');
              }}
            >
              Go to Find Projects
            </Button>
            <Button onClick={() => setShowcaseNotice(null)}>Got it</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MarketplaceShell />
      </AuthProvider>
    </ErrorBoundary>
  );
}
