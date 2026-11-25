import React, { useEffect, useMemo, useState } from 'react';
import {
  DollarSign,
  FileCheck2,
  FolderKanban,
  Image as ImageIcon,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Send,
  Settings,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { MARKETPLACE_CATEGORIES, PLATFORM_COMMISSION_RATE } from '@/src/constants/categories';
import { useAuth } from '@/src/contexts/AuthContext';
import {
  AVATAR_ELENA,
  AVATAR_MARCUS,
  AVATAR_MAYA,
  HERO_STUDIO_IMAGE,
  PORTFOLIO_MOTION_IMAGE,
  PORTFOLIO_VIDEO_IMAGE,
} from '@/src/data/showcaseSamples';
import {
  requestWithdrawal,
  saveFreelancerProfile,
  subscribeNotifications,
  subscribeOrdersForFreelancer,
  subscribePaymentsForUser,
  subscribeProposalsForFreelancer,
  updateOrderWorkflow,
} from '@/src/lib/firestoreService';
import { formatCurrency, formatTimestamp, isSafeHttpUrl } from '@/src/lib/utils';
import { MessagingPanel } from '@/src/components/messaging/MessagingPanel';
import { Button, Input, Modal, SafeImage, Select, StatusText, Textarea } from '@/src/components/ui/primitives';
import type {
  AppNotification,
  AppView,
  FreelancerProfile,
  Order,
  PaymentRecord,
  PortfolioItem,
  Project,
  Proposal,
  ServicePackage,
  UserRole,
} from '@/src/types/marketplace';

type FreelancerTab =
  | 'overview'
  | 'profile'
  | 'portfolio'
  | 'projects'
  | 'proposals'
  | 'orders'
  | 'messages'
  | 'earnings'
  | 'settings';

interface FreelancerDashboardProps {
  liveFreelancers: FreelancerProfile[];
  liveProjects: Project[];
  initialTab?: FreelancerTab;
  initialConversationId?: string | null;
  onNavigate: (view: AppView) => void;
}

export function FreelancerDashboard({
  liveFreelancers,
  liveProjects,
  initialTab = 'overview',
  initialConversationId = null,
  onNavigate,
}: FreelancerDashboardProps) {
  const { firebaseUser, userAccount, updateAccountProfile } = useAuth();
  const [tab, setTab] = useState<FreelancerTab>(initialTab);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const myProfile = useMemo(
    () => liveFreelancers.find((f) => f.uid === firebaseUser?.uid) || null,
    [liveFreelancers, firebaseUser]
  );

  // Profile Form State
  const [fName, setFName] = useState(userAccount?.displayName || '');
  const [fHeadline, setFHeadline] = useState('');
  const [fCategory, setFCategory] = useState(MARKETPLACE_CATEGORIES[0].name);
  const [fSkills, setFSkills] = useState('');
  const [fPrice, setFPrice] = useState('250');
  const [fHourly, setFHourly] = useState('75');
  const [fBio, setFBio] = useState('');
  const [fAvatar, setFAvatar] = useState(AVATAR_MAYA);
  const [fPackages, setFPackages] = useState<ServicePackage[]>([
    {
      name: 'Standard Cut',
      price: 250,
      deliveryDays: 4,
      revisions: 2,
      description: 'Complete edit with clean audio mastering and color balance.',
    },
  ]);
  const [fPortfolio, setFPortfolio] = useState<PortfolioItem[]>([]);
  const [profileNotice, setProfileNotice] = useState('');
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Portfolio item add form
  const [itemTitle, setItemTitle] = useState('');
  const [itemCategory, setItemCategory] = useState(MARKETPLACE_CATEGORIES[0].name);
  const [itemImage, setItemImage] = useState(PORTFOLIO_VIDEO_IMAGE);
  const [itemOutcome, setItemOutcome] = useState('');

  // Delivery Modal
  const [deliverOrder, setDeliverOrder] = useState<Order | null>(null);
  const [deliveryUrl, setDeliveryUrl] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  // Withdrawal form
  const [wdAmount, setWdAmount] = useState('');
  const [wdMethod, setWdMethod] = useState('Stripe Express / Bank ACH');
  const [wdError, setWdError] = useState('');
  const [wdNotice, setWdNotice] = useState('');

  // Settings
  const [sName, setSName] = useState(userAccount?.displayName || '');
  const [sRole, setSRole] = useState<UserRole>(userAccount?.role || 'freelancer');
  const [sBio, setSBio] = useState(userAccount?.bio || '');
  const [sNotice, setSNotice] = useState('');

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (userAccount) {
      setSName(userAccount.displayName);
      setSRole(userAccount.role);
      setSBio(userAccount.bio || '');
      if (!myProfile) setFName(userAccount.displayName);
    }
  }, [userAccount, myProfile]);

  useEffect(() => {
    if (myProfile) {
      setFName(myProfile.name);
      setFHeadline(myProfile.headline);
      setFCategory(myProfile.category);
      setFSkills(myProfile.skills.join(', '));
      setFPrice(String(myProfile.startingPrice));
      setFHourly(String(myProfile.hourlyRate || myProfile.startingPrice));
      setFBio(myProfile.bio);
      setFAvatar(myProfile.avatarUrl);
      if (myProfile.packages?.length) setFPackages(myProfile.packages);
      if (myProfile.portfolioItems) setFPortfolio(myProfile.portfolioItems);
    }
  }, [myProfile]);

  useEffect(() => {
    if (!firebaseUser) return;
    const u1 = subscribeProposalsForFreelancer(firebaseUser.uid, setProposals);
    const u2 = subscribeOrdersForFreelancer(firebaseUser.uid, setOrders);
    const u3 = subscribePaymentsForUser(firebaseUser.uid, 'freelancer', setPayments);
    const u4 = subscribeNotifications(firebaseUser.uid, setNotifications);
    return () => {
      u1();
      u2();
      u3();
      u4();
    };
  }, [firebaseUser]);

  if (!firebaseUser) return null;

  const activeOrders = orders.filter((o) => !['completed', 'cancelled'].includes(o.status));
  const completedOrders = orders.filter((o) => o.status === 'completed');

  const releasedEarnings = payments
    .filter((p) => p.type === 'order_record' && p.status === 'released')
    .reduce((sum, p) => sum + p.netAmount, 0);

  const pendingEscrow = payments
    .filter((p) => p.type === 'order_record' && p.status === 'held')
    .reduce((sum, p) => sum + p.netAmount, 0);

  const totalCommission = payments
    .filter((p) => p.type === 'order_record')
    .reduce((sum, p) => sum + p.platformCommission, 0);

  const withdrawnTotal = payments
    .filter((p) => p.type === 'withdrawal')
    .reduce((sum, p) => sum + p.netAmount, 0);

  const availableBalance = Math.max(0, releasedEarnings - withdrawnTotal);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fHeadline.trim().length < 4 || fBio.trim().length < 10) {
      setProfileError('Headline (min 4 chars) and bio (min 10 chars) are required.');
      return;
    }
    setProfileError('');
    setProfileNotice('');
    setSavingProfile(true);
    try {
      await saveFreelancerProfile({
        uid: firebaseUser.uid,
        name: fName.trim() || userAccount?.displayName || 'Freelancer',
        headline: fHeadline.trim(),
        bio: fBio.trim(),
        category: fCategory,
        skills: fSkills.split(',').map((s) => s.trim()).filter(Boolean),
        startingPrice: Number(fPrice) || 100,
        hourlyRate: Number(fHourly) || 65,
        avatarUrl: fAvatar,
        portfolioItems: fPortfolio,
        packages: fPackages,
      });
      setProfileNotice('Public freelancer profile published and live in Explore Talent.');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim()) return;
    if (itemImage.trim() && !isSafeHttpUrl(itemImage.trim())) {
      setProfileError('Portfolio image URL must start with https:// or /src/assets/.');
      return;
    }
    const next = [
      ...fPortfolio,
      {
        id: `pf_${Date.now()}`,
        title: itemTitle.trim(),
        category: itemCategory,
        imageUrl: itemImage.trim() || PORTFOLIO_VIDEO_IMAGE,
        outcome: itemOutcome.trim() || undefined,
      },
    ].slice(0, 8);
    setFPortfolio(next);
    setItemTitle('');
    setItemOutcome('');
    if (myProfile) {
      await saveFreelancerProfile({
        uid: firebaseUser.uid,
        name: myProfile.name,
        headline: myProfile.headline,
        bio: myProfile.bio,
        category: myProfile.category,
        skills: myProfile.skills,
        startingPrice: myProfile.startingPrice,
        hourlyRate: myProfile.hourlyRate,
        avatarUrl: myProfile.avatarUrl,
        portfolioItems: next,
        packages: myProfile.packages,
      });
      setActionMsg('Portfolio item added to your public profile.');
    }
  };

  const handleRemovePortfolio = async (id: string) => {
    const next = fPortfolio.filter((p) => p.id !== id);
    setFPortfolio(next);
    if (myProfile) {
      await saveFreelancerProfile({
        uid: firebaseUser.uid,
        name: myProfile.name,
        headline: myProfile.headline,
        bio: myProfile.bio,
        category: myProfile.category,
        skills: myProfile.skills,
        startingPrice: myProfile.startingPrice,
        hourlyRate: myProfile.hourlyRate,
        avatarUrl: myProfile.avatarUrl,
        portfolioItems: next,
        packages: myProfile.packages,
      });
    }
  };

  const handleStartOrder = async (order: Order) => {
    setActionBusy(true);
    try {
      await updateOrderWorkflow({ order, status: 'in_progress' });
      setActionMsg(`Started work on "${order.title}".`);
    } finally {
      setActionBusy(false);
    }
  };

  const handleSubmitDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliverOrder) return;
    if (deliveryUrl.trim() && !isSafeHttpUrl(deliveryUrl.trim())) {
      setActionMsg('Delivery link must start with https:// or http://.');
      return;
    }
    setActionBusy(true);
    try {
      await updateOrderWorkflow({
        order: deliverOrder,
        status: 'delivered',
        deliveryUrl: deliveryUrl.trim(),
        deliveryNotes: deliveryNotes.trim(),
      });
      setDeliverOrder(null);
      setDeliveryUrl('');
      setDeliveryNotes('');
      setActionMsg('Deliverables submitted to the creator for review.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWdError('');
    setWdNotice('');
    const amt = Number(wdAmount);
    if (!amt || amt < 10) {
      setWdError('Minimum withdrawal request is $10.');
      return;
    }
    if (amt > availableBalance) {
      setWdError(`Requested amount exceeds available released balance (${formatCurrency(availableBalance)}).`);
      return;
    }
    try {
      await requestWithdrawal({
        freelancerUid: firebaseUser.uid,
        amount: amt,
        payoutMethod: wdMethod,
      });
      setWdAmount('');
      setWdNotice('Withdrawal request recorded. Admin settlement status can be tracked in your ledger.');
    } catch (err) {
      setWdError(err instanceof Error ? err.message : 'Unable to submit withdrawal.');
    }
  };

  const navItems: { id: FreelancerTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'profile', label: 'Profile & Services', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'portfolio', label: 'Portfolio', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'projects', label: 'Available Projects', icon: <FolderKanban className="w-4 h-4" /> },
    { id: 'proposals', label: 'Submitted Proposals', icon: <Send className="w-4 h-4" />, count: proposals.length },
    { id: 'orders', label: 'Active Orders', icon: <FileCheck2 className="w-4 h-4" />, count: activeOrders.length },
    { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'earnings', label: 'Earnings & Withdrawals', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'settings', label: 'Account Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar */}
        <aside className="lg:col-span-3 bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-4 space-y-5">
          <div className="px-2 pb-4 border-b border-[#262630]">
            <p className="text-xs font-medium text-[#E8F553]">Freelancer Studio</p>
            <h1 className="font-display text-lg font-bold text-white truncate mt-0.5">
              {myProfile?.name || userAccount?.displayName || 'Freelancer'}
            </h1>
            <p className="text-xs text-zinc-400 truncate">{userAccount?.email}</p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  tab === item.id
                    ? 'bg-[#E8F553]/15 text-[#E8F553]'
                    : 'text-zinc-400 hover:bg-[#23232B] hover:text-white'
                }`}
              >
                <span className="inline-flex items-center gap-2.5 truncate">
                  {item.icon}
                  {item.label}
                </span>
                {typeof item.count === 'number' && item.count > 0 && (
                  <span className="text-xs font-mono tabular-nums text-zinc-500">
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="pt-4 border-t border-[#262630]">
            <Button className="w-full" size="sm" onClick={() => onNavigate('find-projects')}>
              Find Open Projects
            </Button>
          </div>
        </aside>

        {/* Main Panel */}
        <main className="lg:col-span-9 space-y-6">
          {actionMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm rounded-xl px-4 py-3 flex items-center justify-between gap-4">
              <span>{actionMsg}</span>
              <button
                type="button"
                onClick={() => setActionMsg('')}
                className="text-xs font-semibold underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {!myProfile && tab === 'overview' && (
            <div className="bg-[#E8F553]/10 border border-[#E8F553]/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-base font-semibold text-[#E8F553]">
                  Publish your public freelancer profile
                </h2>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Add your headline, skills, starting rate, and portfolio so creators can discover and hire you.
                </p>
              </div>
              <Button size="sm" onClick={() => setTab('profile')}>
                Set Up Profile
              </Button>
            </div>
          )}

          {tab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">
                  Freelancer Overview
                </h2>
                <p className="text-sm text-zinc-400">
                  Track your active orders, proposals, and available earnings.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-4">
                  <div className="text-xs text-zinc-400">Active Orders</div>
                  <div className="font-mono text-2xl font-bold text-white tabular-nums mt-1">
                    {activeOrders.length}
                  </div>
                </div>
                <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-4">
                  <div className="text-xs text-zinc-400">Completed</div>
                  <div className="font-mono text-2xl font-bold text-white tabular-nums mt-1">
                    {completedOrders.length}
                  </div>
                </div>
                <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-4">
                  <div className="text-xs text-zinc-400">Available Balance</div>
                  <div className="font-mono text-2xl font-bold text-emerald-400 tabular-nums mt-1">
                    {formatCurrency(availableBalance)}
                  </div>
                </div>
                <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-4">
                  <div className="text-xs text-zinc-400">In Escrow</div>
                  <div className="font-mono text-2xl font-bold text-[#E8F553] tabular-nums mt-1">
                    {formatCurrency(pendingEscrow)}
                  </div>
                </div>
              </div>

              <section className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-6">
                <h3 className="font-display text-base font-semibold text-white mb-3">
                  Recent Notifications ({notifications.filter((n) => !n.read).length} unread)
                </h3>
                {notifications.length === 0 ? (
                  <p className="text-sm text-zinc-400">
                    Proposal acceptances, revision notes, and payout updates appear here.
                  </p>
                ) : (
                  <div className="divide-y divide-[#262630]">
                    {notifications.slice(0, 5).map((n) => (
                      <div key={n.id} className="py-3">
                        <p className="text-sm font-medium text-white">{n.title}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{n.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {tab === 'profile' && (
            <section className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-6">
              <h2 className="font-display text-xl font-bold text-white mb-1">
                Public Profile & Service Packages
              </h2>
              <p className="text-xs text-zinc-400 mb-6">
                Published profiles appear live on Explore Talent for creators to view and hire.
              </p>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Display Name</label>
                    <Input value={fName} onChange={(e) => setFName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Primary Category</label>
                    <Select value={fCategory} onChange={(e) => setFCategory(e.target.value)}>
                      {MARKETPLACE_CATEGORIES.map((c) => (
                        <option key={c.slug} value={c.name}>{c.name}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Professional Headline</label>
                  <Input
                    value={fHeadline}
                    onChange={(e) => setFHeadline(e.target.value)}
                    placeholder="e.g. Documentary Video Editor & Colorist for YouTube Creators"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Starting Price (USD)</label>
                    <Input type="number" min={5} value={fPrice} onChange={(e) => setFPrice(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Hourly Rate (USD)</label>
                    <Input type="number" min={5} value={fHourly} onChange={(e) => setFHourly(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Portrait Style</label>
                    <Select value={fAvatar} onChange={(e) => setFAvatar(e.target.value)}>
                      <option value={AVATAR_MAYA}>Studio Portrait A</option>
                      <option value={AVATAR_MARCUS}>Studio Portrait B</option>
                      <option value={AVATAR_ELENA}>Studio Portrait C</option>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Skills & Tools (comma separated)
                  </label>
                  <Input
                    value={fSkills}
                    onChange={(e) => setFSkills(e.target.value)}
                    placeholder="DaVinci Resolve, Premiere Pro, Sound Design"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">About & Production Process</label>
                  <Textarea
                    rows={4}
                    value={fBio}
                    onChange={(e) => setFBio(e.target.value)}
                    placeholder="Describe your editing workflow, channel niches, and turnaround speed..."
                    required
                  />
                </div>

                {/* Package Editor */}
                <div className="border-t border-[#262630] pt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base font-semibold text-white">
                      Pricing Packages (Up to 3)
                    </h3>
                    {fPackages.length < 3 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          setFPackages([
                            ...fPackages,
                            {
                              name: `Package Tier ${fPackages.length + 1}`,
                              price: Number(fPrice) * (fPackages.length + 1),
                              deliveryDays: 5,
                              revisions: 2,
                              description: 'Expanded production deliverable package.',
                            },
                          ])
                        }
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Tier
                      </Button>
                    )}
                  </div>

                  {fPackages.map((pkg, idx) => (
                    <div key={idx} className="bg-[#141419] border border-[#262630] rounded-xl p-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input
                          value={pkg.name}
                          onChange={(e) => {
                            const copy = [...fPackages];
                            copy[idx] = { ...pkg, name: e.target.value };
                            setFPackages(copy);
                          }}
                          placeholder="Package name"
                        />
                        <Input
                          type="number"
                          min={5}
                          value={pkg.price}
                          onChange={(e) => {
                            const copy = [...fPackages];
                            copy[idx] = { ...pkg, price: Number(e.target.value) };
                            setFPackages(copy);
                          }}
                          placeholder="Price"
                        />
                        <Input
                          type="number"
                          min={1}
                          value={pkg.deliveryDays}
                          onChange={(e) => {
                            const copy = [...fPackages];
                            copy[idx] = { ...pkg, deliveryDays: Number(e.target.value) };
                            setFPackages(copy);
                          }}
                          placeholder="Days"
                        />
                      </div>
                      <Input
                        value={pkg.description}
                        onChange={(e) => {
                          const copy = [...fPackages];
                          copy[idx] = { ...pkg, description: e.target.value };
                          setFPackages(copy);
                        }}
                        placeholder="What is included in this package?"
                      />
                    </div>
                  ))}
                </div>

                {profileError && <p className="text-xs text-red-400">{profileError}</p>}
                {profileNotice && <p className="text-xs text-emerald-400">{profileNotice}</p>}

                <Button type="submit" disabled={savingProfile}>
                  {savingProfile ? 'Saving Profile...' : 'Publish & Save Profile'}
                </Button>
              </form>
            </section>
          )}

          {tab === 'portfolio' && (
            <section className="space-y-6">
              <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-6">
                <h2 className="font-display text-xl font-bold text-white mb-4">
                  Add Portfolio Showcase
                </h2>
                <form onSubmit={handleAddPortfolio} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">Work Title</label>
                      <Input
                        value={itemTitle}
                        onChange={(e) => setItemTitle(e.target.value)}
                        placeholder="e.g. 20-Min Tech Documentary Edit"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">Category</label>
                      <Select value={itemCategory} onChange={(e) => setItemCategory(e.target.value)}>
                        {MARKETPLACE_CATEGORIES.map((c) => (
                          <option key={c.slug} value={c.name}>{c.name}</option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">Cover Visual</label>
                      <Select value={itemImage} onChange={(e) => setItemImage(e.target.value)}>
                        <option value={PORTFOLIO_VIDEO_IMAGE}>Documentary Cinema Production</option>
                        <option value={PORTFOLIO_MOTION_IMAGE}>3D Motion Architecture</option>
                        <option value={HERO_STUDIO_IMAGE}>Color Grading & Studio Edit</option>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">Outcome / Result (Optional)</label>
                      <Input
                        value={itemOutcome}
                        onChange={(e) => setItemOutcome(e.target.value)}
                        placeholder="e.g. 640K views · 59% avg retention"
                      />
                    </div>
                  </div>
                  <Button type="submit" size="sm">
                    <Plus className="w-4 h-4" />
                    Add to Portfolio
                  </Button>
                </form>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {fPortfolio.map((item) => (
                  <div key={item.id} className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl overflow-hidden">
                    <div className="aspect-[4/3] bg-[#141419]">
                      <SafeImage src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-zinc-400">
                          {item.category}
                          {item.outcome ? ` · ${item.outcome}` : ''}
                        </p>
                        <h3 className="font-display text-sm font-semibold text-white mt-0.5">
                          {item.title}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleRemovePortfolio(item.id)}
                        aria-label="Remove portfolio item"
                        className="p-1.5 text-zinc-500 hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab === 'projects' && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-white">Available Open Projects</h2>
                <Button size="sm" onClick={() => onNavigate('find-projects')}>
                  Open Full Project Board
                </Button>
              </div>
              {liveProjects.filter((p) => p.status === 'open').length === 0 ? (
                <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-10 text-center">
                  <p className="text-sm text-zinc-400 mb-4">
                    Visit the project marketplace to browse all creator briefs and submit proposals.
                  </p>
                  <Button onClick={() => onNavigate('find-projects')}>Browse Find Projects</Button>
                </div>
              ) : (
                liveProjects
                  .filter((p) => p.status === 'open')
                  .map((proj) => (
                    <div
                      key={proj.id}
                      className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-5 flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="text-xs text-[#E8F553] font-medium">{proj.category}</p>
                        <h3 className="font-display text-base font-semibold text-white">{proj.title}</h3>
                        <p className="text-xs text-zinc-400 mt-1">
                          Budget {formatCurrency(proj.budget)} · Due {proj.deadline}
                        </p>
                      </div>
                      <Button size="sm" onClick={() => onNavigate('find-projects')}>
                        Submit Proposal
                      </Button>
                    </div>
                  ))
              )}
            </section>
          )}

          {tab === 'proposals' && (
            <section className="space-y-4">
              <h2 className="font-display text-xl font-bold text-white">Submitted Proposals</h2>
              {proposals.length === 0 ? (
                <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-10 text-center text-sm text-zinc-400">
                  Proposals you submit to creator projects will appear here.
                </div>
              ) : (
                proposals.map((prop) => (
                  <div key={prop.id} className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-5 space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-display text-base font-semibold text-white">
                        {prop.projectTitle}
                      </h3>
                      <StatusText status={prop.status} />
                    </div>
                    <p className="text-xs text-zinc-400 tabular-nums">
                      Proposed {formatCurrency(prop.proposedPrice)} · {prop.deliveryDays}-day estimate
                    </p>
                    <p className="text-sm text-zinc-300">{prop.coverMessage}</p>
                  </div>
                ))
              )}
            </section>
          )}

          {tab === 'orders' && (
            <section className="space-y-4">
              <h2 className="font-display text-xl font-bold text-white">Orders & Deliveries</h2>
              {orders.length === 0 ? (
                <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-10 text-center text-sm text-zinc-400">
                  Accepted proposals and direct creator hires appear here.
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                          <span>Creator: {order.creatorName}</span>
                          <span aria-hidden="true">·</span>
                          <StatusText status={order.status} />
                        </div>
                        <h3 className="font-display text-lg font-semibold text-white">
                          {order.title}
                        </h3>
                      </div>
                      <div className="text-left sm:text-right tabular-nums">
                        <div className="font-mono text-lg font-bold text-[#E8F553]">
                          {formatCurrency(order.netPayout)} net
                        </div>
                        <div className="text-xs text-zinc-400">
                          {formatCurrency(order.price)} gross − {formatCurrency(order.platformFee)} fee
                        </div>
                      </div>
                    </div>

                    {order.revisionNote && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-300">
                        <strong>Creator requested revision:</strong> {order.revisionNote}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#262630]">
                      <button
                        type="button"
                        onClick={() => setTab('messages')}
                        className="text-xs font-semibold text-[#E8F553] hover:underline cursor-pointer"
                      >
                        Message {order.creatorName} →
                      </button>
                      <div className="flex items-center gap-2.5">
                        {order.status === 'ordered' && (
                          <Button
                            size="sm"
                            disabled={actionBusy}
                            onClick={() => void handleStartOrder(order)}
                          >
                            Start Working
                          </Button>
                        )}
                        {(order.status === 'in_progress' || order.status === 'revision_requested') && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setDeliverOrder(order);
                              setDeliveryUrl(order.deliveryUrl || '');
                              setDeliveryNotes(order.deliveryNotes || '');
                            }}
                          >
                            Submit Delivery
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </section>
          )}

          {tab === 'messages' && <MessagingPanel initialConversationId={initialConversationId} />}

          {tab === 'earnings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-5">
                  <div className="text-xs text-zinc-400">Available for Withdrawal</div>
                  <div className="font-mono text-2xl font-bold text-emerald-400 tabular-nums mt-1">
                    {formatCurrency(availableBalance)}
                  </div>
                </div>
                <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-5">
                  <div className="text-xs text-zinc-400">Pending Order Escrow</div>
                  <div className="font-mono text-2xl font-bold text-[#E8F553] tabular-nums mt-1">
                    {formatCurrency(pendingEscrow)}
                  </div>
                </div>
                <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-5">
                  <div className="text-xs text-zinc-400">
                    Platform Commission ({Math.round(PLATFORM_COMMISSION_RATE * 100)}%)
                  </div>
                  <div className="font-mono text-2xl font-bold text-white tabular-nums mt-1">
                    {formatCurrency(totalCommission)}
                  </div>
                </div>
              </div>

              {/* Withdrawal Request Form */}
              <section className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-6">
                <h2 className="font-display text-lg font-semibold text-white mb-1">
                  Request Payout Withdrawal
                </h2>
                <p className="text-xs text-zinc-400 mb-4">
                  Withdrawals are tracked as pending payout requests until settled by platform finance.
                </p>
                <form onSubmit={handleWithdraw} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Amount (USD)</label>
                    <Input
                      type="number"
                      min={10}
                      step="0.01"
                      value={wdAmount}
                      onChange={(e) => setWdAmount(e.target.value)}
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Payout Method</label>
                    <Select value={wdMethod} onChange={(e) => setWdMethod(e.target.value)}>
                      <option value="Stripe Express / Bank ACH">Stripe Express / Bank ACH</option>
                      <option value="Wise International Transfer">Wise International Transfer</option>
                      <option value="PayPal Business Payout">PayPal Business Payout</option>
                    </Select>
                  </div>
                  <Button type="submit">Request Withdrawal</Button>
                </form>
                {wdError && <p className="text-xs text-red-400 mt-3">{wdError}</p>}
                {wdNotice && <p className="text-xs text-emerald-400 mt-3">{wdNotice}</p>}
              </section>

              {/* Earnings Ledger */}
              <section className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-[#2A2A33]">
                  <h3 className="font-display text-base font-semibold text-white">
                    Earnings & Withdrawal Ledger
                  </h3>
                </div>
                {payments.length === 0 ? (
                  <p className="p-8 text-center text-sm text-zinc-400">No transactions recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#141419] text-xs text-zinc-400 border-b border-[#2A2A33]">
                        <tr>
                          <th className="py-3 px-4 font-medium">Description</th>
                          <th className="py-3 px-4 font-medium">Type</th>
                          <th className="py-3 px-4 font-medium">Status</th>
                          <th className="py-3 px-4 font-medium text-right">Fee</th>
                          <th className="py-3 px-4 font-medium text-right">Net</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#262630]">
                        {payments.map((pay) => (
                          <tr key={pay.id} className="hover:bg-[#202028] transition-colors">
                            <td className="py-3 px-4 font-medium text-white">
                              {pay.orderTitle}
                              <div className="text-xs text-zinc-500 tabular-nums">
                                {formatTimestamp(pay.createdAt)}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-xs text-zinc-400">
                              {pay.type === 'withdrawal' ? 'Withdrawal' : 'Order Payout'}
                            </td>
                            <td className="py-3 px-4">
                              <StatusText status={pay.status} />
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-xs text-zinc-400 tabular-nums">
                              {formatCurrency(pay.platformCommission)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-white tabular-nums">
                              {pay.type === 'withdrawal' ? '−' : '+'}
                              {formatCurrency(pay.netAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}

          {tab === 'settings' && (
            <section className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-6">
              <h2 className="font-display text-xl font-bold text-white mb-4">Account Settings</h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await updateAccountProfile({
                    displayName: sName.trim() || 'Freelancer',
                    role: sRole,
                    bio: sBio.trim() || undefined,
                  });
                  setSNotice('Account settings updated.');
                }}
                className="space-y-4 max-w-lg"
              >
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Account Display Name</label>
                  <Input value={sName} onChange={(e) => setSName(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Workspace Role</label>
                  <Select value={sRole} onChange={(e) => setSRole(e.target.value as UserRole)}>
                    <option value="freelancer">Freelancer</option>
                    <option value="creator">Content Creator</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Account Bio</label>
                  <Textarea rows={3} value={sBio} onChange={(e) => setSBio(e.target.value)} />
                </div>
                {sNotice && <p className="text-xs text-emerald-400">{sNotice}</p>}
                <Button type="submit">Save Settings</Button>
              </form>
            </section>
          )}
        </main>
      </div>

      {/* Delivery Submission Modal */}
      <Modal
        open={Boolean(deliverOrder)}
        onClose={() => setDeliverOrder(null)}
        title="Submit Order Deliverables"
        subtitle={deliverOrder?.title}
      >
        <form onSubmit={handleSubmitDelivery} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Deliverable Link (Frame.io, Google Drive, Dropbox, Figma)
            </label>
            <Input
              type="url"
              value={deliveryUrl}
              onChange={(e) => setDeliveryUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Delivery Summary & Export Specs
            </label>
            <Textarea
              rows={4}
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="4K ProRes & H.264 masters uploaded, mixed to -14 LUFS..."
              required
            />
          </div>
          <div className="flex justify-end gap-2.5">
            <Button type="button" variant="ghost" onClick={() => setDeliverOrder(null)}>Cancel</Button>
            <Button type="submit" disabled={actionBusy}>
              {actionBusy ? 'Submitting...' : 'Submit for Creator Review'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
