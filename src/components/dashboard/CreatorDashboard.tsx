import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CreditCard,
  ExternalLink,
  FileText,
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Settings,
  Star,
  Users,
} from 'lucide-react';
import { MARKETPLACE_CATEGORIES } from '@/src/constants/categories';
import { useAuth } from '@/src/contexts/AuthContext';
import {
  createProject,
  markNotificationRead,
  respondToProposal,
  subscribeNotifications,
  subscribeOrdersForCreator,
  subscribePaymentsForUser,
  subscribeProposalsForCreator,
  submitReview,
  updateOrderWorkflow,
  updateProjectStatus,
} from '@/src/lib/firestoreService';
import { formatCurrency, formatTimestamp, isSafeHttpUrl } from '@/src/lib/utils';
import { MessagingPanel } from '@/src/components/messaging/MessagingPanel';
import { Button, Input, Modal, Select, StatusText, Textarea } from '@/src/components/ui/primitives';
import type {
  AppNotification,
  AppView,
  Order,
  PaymentRecord,
  Project,
  Proposal,
  Review,
  UserRole,
} from '@/src/types/marketplace';

type CreatorTab =
  | 'overview'
  | 'projects'
  | 'orders'
  | 'hired'
  | 'proposals'
  | 'messages'
  | 'payments'
  | 'reviews'
  | 'settings';

interface CreatorDashboardProps {
  liveProjects: Project[];
  reviews: Review[];
  initialTab?: CreatorTab;
  initialConversationId?: string | null;
  onNavigate: (view: AppView) => void;
}

export function CreatorDashboard({
  liveProjects,
  reviews,
  initialTab = 'overview',
  initialConversationId = null,
  onNavigate,
}: CreatorDashboardProps) {
  const { firebaseUser, userAccount, updateAccountProfile } = useAuth();
  const [tab, setTab] = useState<CreatorTab>(initialTab);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Post Project Form
  const [showNewProj, setShowNewProj] = useState(false);
  const [pTitle, setPTitle] = useState('');
  const [pCategory, setPCategory] = useState(MARKETPLACE_CATEGORIES[0].name);
  const [pSkills, setPSkills] = useState('');
  const [pBudget, setPBudget] = useState('500');
  const [pDeadline, setPDeadline] = useState('2026-12-20');
  const [pRefUrl, setPRefUrl] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pError, setPError] = useState('');
  const [pBusy, setPBusy] = useState(false);

  // Order Revision / Review Modals
  const [revisionOrder, setRevisionOrder] = useState<Order | null>(null);
  const [revisionNote, setRevisionNote] = useState('');
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  // Account Settings
  const [sName, setSName] = useState(userAccount?.displayName || '');
  const [sChannel, setSChannel] = useState(userAccount?.channelName || '');
  const [sBio, setSBio] = useState(userAccount?.bio || '');
  const [sRole, setSRole] = useState<UserRole>(userAccount?.role || 'creator');
  const [sNotice, setSNotice] = useState('');

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (userAccount) {
      setSName(userAccount.displayName);
      setSChannel(userAccount.channelName || '');
      setSBio(userAccount.bio || '');
      setSRole(userAccount.role);
    }
  }, [userAccount]);

  useEffect(() => {
    if (!firebaseUser) return;
    const u1 = subscribeProposalsForCreator(firebaseUser.uid, setProposals);
    const u2 = subscribeOrdersForCreator(firebaseUser.uid, setOrders);
    const u3 = subscribePaymentsForUser(firebaseUser.uid, 'creator', setPayments);
    const u4 = subscribeNotifications(firebaseUser.uid, setNotifications);
    return () => {
      u1();
      u2();
      u3();
      u4();
    };
  }, [firebaseUser]);

  const myProjects = useMemo(
    () => liveProjects.filter((p) => p.creatorUid === firebaseUser?.uid),
    [liveProjects, firebaseUser]
  );

  const myReviews = useMemo(
    () => reviews.filter((r) => r.creatorUid === firebaseUser?.uid),
    [reviews, firebaseUser]
  );

  const hiredFreelancers = useMemo(() => {
    const map = new Map<string, { uid: string; name: string; count: number; spent: number; lastOrder: string }>();
    orders.forEach((o) => {
      const prev = map.get(o.freelancerUid);
      if (prev) {
        prev.count += 1;
        prev.spent += o.price;
      } else {
        map.set(o.freelancerUid, {
          uid: o.freelancerUid,
          name: o.freelancerName,
          count: 1,
          spent: o.price,
          lastOrder: o.title,
        });
      }
    });
    return Array.from(map.values());
  }, [orders]);

  const unreadNotifs = notifications.filter((n) => !n.read);
  const pendingProposals = proposals.filter((p) => p.status === 'pending');
  const activeOrders = orders.filter((o) => !['completed', 'cancelled'].includes(o.status));
  const totalSpend = payments.reduce((sum, p) => sum + p.grossAmount, 0);

  if (!firebaseUser) return null;

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pTitle.trim().length < 5 || pDesc.trim().length < 15) {
      setPError('Enter a clear title (min 5 chars) and description (min 15 chars).');
      return;
    }
    if (pRefUrl.trim() && !isSafeHttpUrl(pRefUrl.trim())) {
      setPError('Reference link must begin with https:// or http://.');
      return;
    }
    setPError('');
    setPBusy(true);
    try {
      await createProject({
        creatorUid: firebaseUser.uid,
        creatorName: userAccount?.channelName || userAccount?.displayName || 'Creator',
        title: pTitle.trim(),
        description: pDesc.trim(),
        category: pCategory,
        requiredSkills: pSkills.split(',').map((s) => s.trim()).filter(Boolean),
        budget: Number(pBudget) || 300,
        deadline: pDeadline,
        referenceUrl: pRefUrl.trim() || undefined,
      });
      setShowNewProj(false);
      setPTitle('');
      setPSkills('');
      setPDesc('');
      setPRefUrl('');
    } catch (err) {
      setPError(err instanceof Error ? err.message : 'Unable to create project.');
    } finally {
      setPBusy(false);
    }
  };

  const handleProposalDecision = async (proposal: Proposal, decision: 'accepted' | 'rejected') => {
    const project = myProjects.find((p) => p.id === proposal.projectId);
    setActionBusy(true);
    try {
      await respondToProposal({
        proposal,
        decision,
        creatorName: userAccount?.displayName || 'Creator',
        projectCategory: project?.category || 'Video Editing',
        projectDeadline: project?.deadline || 'TBD',
      });
      setActionMsg(
        decision === 'accepted'
          ? `Proposal accepted! Active order created with ${proposal.freelancerName}.`
          : 'Proposal marked as rejected.'
      );
      if (decision === 'accepted') setTab('orders');
    } finally {
      setActionBusy(false);
    }
  };

  const handleApproveOrder = async (order: Order) => {
    setActionBusy(true);
    try {
      await updateOrderWorkflow({ order, status: 'completed' });
      setActionMsg(`Approved "${order.title}". Payment released to ${order.freelancerName}.`);
    } finally {
      setActionBusy(false);
    }
  };

  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionOrder || !revisionNote.trim()) return;
    setActionBusy(true);
    try {
      await updateOrderWorkflow({
        order: revisionOrder,
        status: 'revision_requested',
        revisionNote: revisionNote.trim(),
      });
      setRevisionOrder(null);
      setRevisionNote('');
      setActionMsg('Revision instructions sent to freelancer.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleLeaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewOrder || reviewComment.trim().length < 5) return;
    setActionBusy(true);
    try {
      await submitReview({
        orderId: reviewOrder.id,
        freelancerId: reviewOrder.freelancerUid,
        freelancerUid: reviewOrder.freelancerUid,
        creatorUid: firebaseUser.uid,
        creatorName: userAccount?.displayName || 'Creator',
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviewOrder(null);
      setReviewComment('');
      setActionMsg('Verified review published.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSNotice('');
    await updateAccountProfile({
      displayName: sName.trim() || 'Creator',
      role: sRole,
      channelName: sChannel.trim() || undefined,
      bio: sBio.trim() || undefined,
    });
    setSNotice('Account settings updated.');
  };

  const navItems: { id: CreatorTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'projects', label: 'Posted Projects', icon: <FolderKanban className="w-4 h-4" />, count: myProjects.length },
    { id: 'orders', label: 'Active Orders', icon: <FileText className="w-4 h-4" />, count: activeOrders.length },
    { id: 'proposals', label: 'Received Proposals', icon: <Bell className="w-4 h-4" />, count: pendingProposals.length },
    { id: 'hired', label: 'Hired Freelancers', icon: <Users className="w-4 h-4" /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'reviews', label: 'Reviews', icon: <Star className="w-4 h-4" /> },
    { id: 'settings', label: 'Account Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Creator Sidebar */}
        <aside className="lg:col-span-3 bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-4 space-y-5">
          <div className="px-2 pb-4 border-b border-[#262630]">
            <p className="text-xs font-medium text-[#E8F553]">Creator Studio</p>
            <h1 className="font-display text-lg font-bold text-white truncate mt-0.5">
              {userAccount?.channelName || userAccount?.displayName || 'Creator Workspace'}
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

          <div className="pt-4 border-t border-[#262630] space-y-2">
            <Button className="w-full" size="sm" onClick={() => onNavigate('explore-talent')}>
              Browse Creative Talent
            </Button>
          </div>
        </aside>

        {/* Main Workspace */}
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

          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">Creator Overview</h2>
                  <p className="text-sm text-zinc-400">
                    Manage active collaborations, incoming freelancer proposals, and deliveries.
                  </p>
                </div>
                <Button onClick={() => setShowNewProj(true)}>
                  <Plus className="w-4 h-4" />
                  Post New Project
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-4">
                  <div className="text-xs text-zinc-400">Posted Projects</div>
                  <div className="font-mono text-2xl font-bold text-white tabular-nums mt-1">
                    {myProjects.length}
                  </div>
                </div>
                <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-4">
                  <div className="text-xs text-zinc-400">Active Orders</div>
                  <div className="font-mono text-2xl font-bold text-white tabular-nums mt-1">
                    {activeOrders.length}
                  </div>
                </div>
                <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-4">
                  <div className="text-xs text-zinc-400">Pending Proposals</div>
                  <div className="font-mono text-2xl font-bold text-[#E8F553] tabular-nums mt-1">
                    {pendingProposals.length}
                  </div>
                </div>
                <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-4">
                  <div className="text-xs text-zinc-400">Total Committed</div>
                  <div className="font-mono text-2xl font-bold text-white tabular-nums mt-1">
                    {formatCurrency(totalSpend)}
                  </div>
                </div>
              </div>

              {/* Notifications Feed */}
              <section className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-base font-semibold text-white">
                    Recent Activity ({unreadNotifs.length} unread)
                  </h3>
                </div>
                {notifications.length === 0 ? (
                  <p className="text-sm text-zinc-400">
                    No notifications yet. Activity from proposals, deliveries, and messages will appear here.
                  </p>
                ) : (
                  <div className="divide-y divide-[#262630]">
                    {notifications.slice(0, 5).map((n) => (
                      <div key={n.id} className="py-3 flex items-start justify-between gap-4">
                        <div>
                          <p className={`text-sm font-medium ${n.read ? 'text-zinc-400' : 'text-white'}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-zinc-500 mt-0.5">{n.body}</p>
                        </div>
                        {!n.read && (
                          <button
                            type="button"
                            onClick={() => void markNotificationRead(n.id)}
                            className="text-xs font-medium text-[#E8F553] hover:underline shrink-0 cursor-pointer"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {tab === 'projects' && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-white">Posted Projects</h2>
                <Button size="sm" onClick={() => setShowNewProj(true)}>
                  <Plus className="w-4 h-4" />
                  New Project
                </Button>
              </div>
              {myProjects.length === 0 ? (
                <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-10 text-center">
                  <p className="text-sm text-zinc-400 mb-4">
                    You have not published any project briefs yet.
                  </p>
                  <Button onClick={() => setShowNewProj(true)}>Publish Your First Project</Button>
                </div>
              ) : (
                myProjects.map((proj) => (
                  <div
                    key={proj.id}
                    className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <span>{proj.category}</span>
                        <span aria-hidden="true">·</span>
                        <StatusText status={proj.status} />
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">Due {proj.deadline}</span>
                      </div>
                      <h3 className="font-display text-base font-semibold text-white">
                        {proj.title}
                      </h3>
                      <p className="text-xs text-zinc-400 line-clamp-1">{proj.description}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-base font-bold text-[#E8F553] tabular-nums">
                        {formatCurrency(proj.budget)}
                      </span>
                      {proj.status === 'open' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => void updateProjectStatus(proj.id, 'cancelled')}
                        >
                          Close Brief
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </section>
          )}

          {tab === 'proposals' && (
            <section className="space-y-4">
              <h2 className="font-display text-xl font-bold text-white">Received Proposals</h2>
              {proposals.length === 0 ? (
                <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-10 text-center text-sm text-zinc-400">
                  Proposals submitted by freelancers on your projects will appear here.
                </div>
              ) : (
                proposals.map((prop) => (
                  <div key={prop.id} className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                          <span>For: {prop.projectTitle}</span>
                          <span aria-hidden="true">·</span>
                          <StatusText status={prop.status} />
                        </div>
                        <h3 className="font-display text-base font-semibold text-white">
                          {prop.freelancerName}
                        </h3>
                        {prop.freelancerHeadline && (
                          <p className="text-xs text-zinc-400">{prop.freelancerHeadline}</p>
                        )}
                      </div>
                      <div className="text-left sm:text-right tabular-nums">
                        <div className="font-mono text-lg font-bold text-[#E8F553]">
                          {formatCurrency(prop.proposedPrice)}
                        </div>
                        <div className="text-xs text-zinc-400">{prop.deliveryDays}-day estimate</div>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed bg-[#141419] border border-[#262630] rounded-xl p-3.5">
                      {prop.coverMessage}
                    </p>
                    {prop.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2.5 pt-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={actionBusy}
                          onClick={() => void handleProposalDecision(prop, 'rejected')}
                        >
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          disabled={actionBusy}
                          onClick={() => void handleProposalDecision(prop, 'accepted')}
                        >
                          Accept & Start Order
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </section>
          )}

          {tab === 'orders' && (
            <section className="space-y-4">
              <h2 className="font-display text-xl font-bold text-white">
                Active & Completed Orders
              </h2>
              {orders.length === 0 ? (
                <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-10 text-center">
                  <p className="text-sm text-zinc-400 mb-4">
                    No active orders yet. Hire a freelancer directly or accept a project proposal.
                  </p>
                  <Button onClick={() => onNavigate('explore-talent')}>Explore Talent</Button>
                </div>
              ) : (
                orders.map((order) => {
                  const alreadyReviewed = myReviews.some((r) => r.orderId === order.id);
                  return (
                    <div key={order.id} className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                            <span>{order.category}</span>
                            <span aria-hidden="true">·</span>
                            <span>Freelancer: {order.freelancerName}</span>
                            <span aria-hidden="true">·</span>
                            <StatusText status={order.status} />
                          </div>
                          <h3 className="font-display text-lg font-semibold text-white">
                            {order.title}
                          </h3>
                        </div>
                        <div className="font-mono text-lg font-bold text-[#E8F553] tabular-nums">
                          {formatCurrency(order.price)}
                        </div>
                      </div>

                      {order.deliveryNotes && (
                        <div className="bg-[#E8F553]/10 border border-[#E8F553]/25 rounded-xl p-4 space-y-2">
                          <div className="text-xs font-semibold text-[#E8F553]">
                            Submitted Delivery
                          </div>
                          <p className="text-sm text-zinc-200">{order.deliveryNotes}</p>
                          {order.deliveryUrl && isSafeHttpUrl(order.deliveryUrl) && (
                            <a
                              href={order.deliveryUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E8F553] hover:underline"
                            >
                              Open delivered files
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      )}

                      {order.revisionNote && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-300">
                          <strong>Revision requested:</strong> {order.revisionNote}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#262630]">
                        <button
                          type="button"
                          onClick={() => setTab('messages')}
                          className="text-xs font-semibold text-[#E8F553] hover:underline cursor-pointer"
                        >
                          Open order messages →
                        </button>
                        <div className="flex flex-wrap items-center gap-2.5">
                          {order.status === 'delivered' && (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setRevisionOrder(order)}
                              >
                                Request Revision
                              </Button>
                              <Button
                                size="sm"
                                disabled={actionBusy}
                                onClick={() => void handleApproveOrder(order)}
                              >
                                Approve & Complete
                              </Button>
                            </>
                          )}
                          {order.status === 'completed' && !alreadyReviewed && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setReviewOrder(order)}
                            >
                              Leave Review
                            </Button>
                          )}
                          {order.status === 'completed' && alreadyReviewed && (
                            <span className="text-xs text-emerald-400 font-medium">Review submitted</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </section>
          )}

          {tab === 'hired' && (
            <section className="space-y-4">
              <h2 className="font-display text-xl font-bold text-white">Hired Freelancers</h2>
              {hiredFreelancers.length === 0 ? (
                <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-10 text-center text-sm text-zinc-400">
                  Freelancers you hire will appear in your roster here.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {hiredFreelancers.map((hf) => (
                    <div key={hf.uid} className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-5">
                      <h3 className="font-display text-base font-semibold text-white">{hf.name}</h3>
                      <p className="text-xs text-zinc-400 mt-1">Latest: {hf.lastOrder}</p>
                      <div className="mt-4 pt-3 border-t border-[#262630] flex items-center justify-between text-xs tabular-nums">
                        <span className="text-zinc-400">{hf.count} {hf.count === 1 ? 'order' : 'orders'}</span>
                        <span className="font-mono font-semibold text-[#E8F553]">{formatCurrency(hf.spent)} total</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === 'messages' && <MessagingPanel initialConversationId={initialConversationId} />}

          {tab === 'payments' && (
            <section className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-[#2A2A33] flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold text-white">Payment History</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Escrow records and released payouts across your creator orders.
                  </p>
                </div>
                <div className="font-mono text-lg font-bold text-[#E8F553] tabular-nums">
                  {formatCurrency(totalSpend)}
                </div>
              </div>
              {payments.length === 0 ? (
                <p className="p-8 text-center text-sm text-zinc-400">No payment records yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#141419] text-xs text-zinc-400 border-b border-[#2A2A33]">
                      <tr>
                        <th className="py-3 px-4 font-medium">Order</th>
                        <th className="py-3 px-4 font-medium">Date</th>
                        <th className="py-3 px-4 font-medium">Status</th>
                        <th className="py-3 px-4 font-medium text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#262630]">
                      {payments.map((pay) => (
                        <tr key={pay.id} className="hover:bg-[#202028] transition-colors">
                          <td className="py-3 px-4 font-medium text-white">{pay.orderTitle}</td>
                          <td className="py-3 px-4 text-xs text-zinc-400 tabular-nums">
                            {formatTimestamp(pay.createdAt)}
                          </td>
                          <td className="py-3 px-4">
                            <StatusText status={pay.status} />
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-white tabular-nums">
                            {formatCurrency(pay.grossAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {tab === 'reviews' && (
            <section className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-6 space-y-4">
              <h2 className="font-display text-xl font-bold text-white">Reviews Written</h2>
              {myReviews.length === 0 ? (
                <p className="text-sm text-zinc-400">
                  Reviews you publish after completing orders will appear here.
                </p>
              ) : (
                <div className="divide-y divide-[#262630]">
                  {myReviews.map((rev) => (
                    <div key={rev.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-zinc-400">Order {rev.orderId}</span>
                        <span className="text-xs font-semibold text-[#E8F553] tabular-nums">
                          {rev.rating}.0 / 5.0
                        </span>
                      </div>
                      <p className="text-sm text-zinc-300">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === 'settings' && (
            <section className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-6">
              <h2 className="font-display text-xl font-bold text-white mb-4">Account Settings</h2>
              <form onSubmit={handleSaveSettings} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Display Name</label>
                  <Input value={sName} onChange={(e) => setSName(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Channel or Brand Name</label>
                  <Input value={sChannel} onChange={(e) => setSChannel(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Primary Workspace Role</label>
                  <Select value={sRole} onChange={(e) => setSRole(e.target.value as UserRole)}>
                    <option value="creator">Content Creator</option>
                    <option value="freelancer">Freelancer</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Channel Bio</label>
                  <Textarea rows={3} value={sBio} onChange={(e) => setSBio(e.target.value)} />
                </div>
                {sNotice && <p className="text-xs text-emerald-400">{sNotice}</p>}
                <Button type="submit">Save Account Changes</Button>
              </form>
            </section>
          )}
        </main>
      </div>

      {/* New Project Modal */}
      <Modal
        open={showNewProj}
        onClose={() => setShowNewProj(false)}
        title="Post a Creator Project"
        subtitle="Describe your deliverables, timeline, and budget."
      >
        <form onSubmit={handleCreateProject} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Title</label>
            <Input value={pTitle} onChange={(e) => setPTitle(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Category</label>
              <Select value={pCategory} onChange={(e) => setPCategory(e.target.value)}>
                {MARKETPLACE_CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.name}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Budget (USD)</label>
              <Input type="number" min={10} value={pBudget} onChange={(e) => setPBudget(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Required Skills</label>
              <Input value={pSkills} onChange={(e) => setPSkills(e.target.value)} placeholder="Premiere, LUTs" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Deadline</label>
              <Input type="date" value={pDeadline} onChange={(e) => setPDeadline(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Reference URL (Optional)</label>
            <Input type="url" value={pRefUrl} onChange={(e) => setPRefUrl(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Description</label>
            <Textarea rows={4} value={pDesc} onChange={(e) => setPDesc(e.target.value)} required />
          </div>
          {pError && <p className="text-xs text-red-400">{pError}</p>}
          <div className="flex justify-end gap-2.5 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowNewProj(false)}>Cancel</Button>
            <Button type="submit" disabled={pBusy}>{pBusy ? 'Publishing...' : 'Publish Project'}</Button>
          </div>
        </form>
      </Modal>

      {/* Request Revision Modal */}
      <Modal
        open={Boolean(revisionOrder)}
        onClose={() => setRevisionOrder(null)}
        title="Request Order Revision"
        subtitle={revisionOrder?.title}
      >
        <form onSubmit={handleRequestRevision} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Revision Notes</label>
            <Textarea
              rows={4}
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              placeholder="Specify timecodes, typography tweaks, or audio adjustments..."
              required
            />
          </div>
          <div className="flex justify-end gap-2.5">
            <Button type="button" variant="ghost" onClick={() => setRevisionOrder(null)}>Cancel</Button>
            <Button type="submit" disabled={actionBusy}>Send Revision Request</Button>
          </div>
        </form>
      </Modal>

      {/* Leave Review Modal */}
      <Modal
        open={Boolean(reviewOrder)}
        onClose={() => setReviewOrder(null)}
        title="Review Completed Order"
        subtitle={reviewOrder ? `Rate your collaboration with ${reviewOrder.freelancerName}` : undefined}
      >
        <form onSubmit={handleLeaveReview} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Rating</label>
            <Select value={String(reviewRating)} onChange={(e) => setReviewRating(Number(e.target.value))}>
              <option value="5">5 Stars — Outstanding</option>
              <option value="4">4 Stars — Great</option>
              <option value="3">3 Stars — Good</option>
              <option value="2">2 Stars — Needs Improvement</option>
              <option value="1">1 Star — Poor</option>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Review Comment</label>
            <Textarea
              rows={4}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share concrete feedback on turnaround, pacing, and communication..."
              required
            />
          </div>
          <div className="flex justify-end gap-2.5">
            <Button type="button" variant="ghost" onClick={() => setReviewOrder(null)}>Cancel</Button>
            <Button type="submit" disabled={actionBusy}>Publish Review</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
