import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  CreditCard,
  Flag,
  FolderKanban,
  Layers,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { MARKETPLACE_CATEGORIES } from '@/src/constants/categories';
import { useAuth } from '@/src/contexts/AuthContext';
import {
  adminDeleteProject,
  adminSaveCategory,
  adminSetFreelancerStatus,
  adminSetUserStatus,
  adminToggleCategory,
  adminUpdatePaymentStatus,
  adminUpdateReportStatus,
  fetchAllOrdersForAdmin,
  subscribeAllPayments,
  subscribeAllUsers,
  subscribeReports,
} from '@/src/lib/firestoreService';
import { formatCurrency, formatTimestamp } from '@/src/lib/utils';
import { Button, Input, StatusText } from '@/src/components/ui/primitives';
import type {
  CategoryItem,
  FreelancerProfile,
  ModerationReport,
  Order,
  PaymentRecord,
  Project,
  UserAccount,
} from '@/src/types/marketplace';

type AdminTab = 'analytics' | 'users' | 'projects' | 'reports' | 'categories' | 'transactions';

interface AdminDashboardProps {
  liveFreelancers: FreelancerProfile[];
  liveProjects: Project[];
  categories: CategoryItem[];
}

export function AdminDashboard({
  liveFreelancers,
  liveProjects,
  categories,
}: AdminDashboardProps) {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<AdminTab>('analytics');
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [adminMsg, setAdminMsg] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    const u1 = subscribeAllUsers(setUsers);
    const u2 = subscribeReports(setReports);
    const u3 = subscribeAllPayments(setPayments);
    void fetchAllOrdersForAdmin().then(setOrders).catch(() => setOrders([]));
    return () => {
      u1();
      u2();
      u3();
    };
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-8">
          <ShieldAlert className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <h1 className="font-display text-xl font-bold text-white mb-2">
            Administrator Access Required
          </h1>
          <p className="text-sm text-zinc-400">
            This console is restricted to verified platform administrators.
          </p>
        </div>
      </div>
    );
  }

  const totalGross = payments
    .filter((p) => p.type === 'order_record')
    .reduce((sum, p) => sum + p.grossAmount, 0);
  const totalCommission = payments
    .filter((p) => p.type === 'order_record')
    .reduce((sum, p) => sum + p.platformCommission, 0);
  const openReports = reports.filter((r) => r.status === 'open');

  const handleSeedCategories = async () => {
    for (const cat of MARKETPLACE_CATEGORIES) {
      await adminSaveCategory({ name: cat.name, description: cat.description, active: true });
    }
    setAdminMsg('All 12 default creator categories synchronized to Firestore.');
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    await adminSaveCategory({ name: newCatName.trim(), description: newCatDesc.trim(), active: true });
    setNewCatName('');
    setNewCatDesc('');
    setAdminMsg('Category saved.');
  };

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'analytics', label: 'Platform Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'users', label: 'Users & Talent', icon: <Users className="w-4 h-4" />, count: users.length },
    { id: 'projects', label: 'Projects', icon: <FolderKanban className="w-4 h-4" />, count: liveProjects.length },
    { id: 'reports', label: 'Reported Profiles', icon: <Flag className="w-4 h-4" />, count: openReports.length },
    { id: 'categories', label: 'Categories', icon: <Layers className="w-4 h-4" /> },
    { id: 'transactions', label: 'Transactions', icon: <CreditCard className="w-4 h-4" />, count: payments.length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside className="lg:col-span-3 bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-4 space-y-4">
          <div className="px-2 pb-3 border-b border-[#262630]">
            <p className="text-xs font-medium text-[#E8F553]">Admin Console</p>
            <h1 className="font-display text-lg font-bold text-white mt-0.5">
              Keyframe Governance
            </h1>
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
                {typeof item.count === 'number' && (
                  <span className="text-xs font-mono tabular-nums text-zinc-500">
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        <main className="lg:col-span-9 space-y-6">
          {adminMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm rounded-xl px-4 py-3 flex items-center justify-between">
              <span>{adminMsg}</span>
              <button type="button" onClick={() => setAdminMsg('')} className="text-xs font-semibold underline cursor-pointer">
                Dismiss
              </button>
            </div>
          )}

          {tab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">Platform Analytics</h2>
                <p className="text-sm text-zinc-400">
                  Live user accounts, active collaborations, commission revenue, and moderation queue.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-5">
                  <div className="text-xs text-zinc-400">Registered Users</div>
                  <div className="font-mono text-2xl font-bold text-white tabular-nums mt-1">
                    {users.length}
                  </div>
                </div>
                <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-5">
                  <div className="text-xs text-zinc-400">Live Freelancer Profiles</div>
                  <div className="font-mono text-2xl font-bold text-white tabular-nums mt-1">
                    {liveFreelancers.length}
                  </div>
                </div>
                <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-5">
                  <div className="text-xs text-zinc-400">Live Projects</div>
                  <div className="font-mono text-2xl font-bold text-white tabular-nums mt-1">
                    {liveProjects.length}
                  </div>
                </div>
                <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-5">
                  <div className="text-xs text-zinc-400">Total Orders</div>
                  <div className="font-mono text-2xl font-bold text-white tabular-nums mt-1">
                    {orders.length}
                  </div>
                </div>
                <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-5">
                  <div className="text-xs text-zinc-400">Gross Order Volume</div>
                  <div className="font-mono text-2xl font-bold text-white tabular-nums mt-1">
                    {formatCurrency(totalGross)}
                  </div>
                </div>
                <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-5">
                  <div className="text-xs text-zinc-400">Platform Commission</div>
                  <div className="font-mono text-2xl font-bold text-[#E8F553] tabular-nums mt-1">
                    {formatCurrency(totalCommission)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'users' && (
            <div className="space-y-6">
              <section className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-[#2A2A33]">
                  <h2 className="font-display text-lg font-bold text-white">User Accounts</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#141419] text-xs text-zinc-400 border-b border-[#2A2A33]">
                      <tr>
                        <th className="py-3 px-4 font-medium">User</th>
                        <th className="py-3 px-4 font-medium">Role</th>
                        <th className="py-3 px-4 font-medium">Status</th>
                        <th className="py-3 px-4 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#262630]">
                      {users.map((u) => (
                        <tr key={u.uid} className="hover:bg-[#202028] transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-medium text-white">{u.displayName}</div>
                            <div className="text-xs text-zinc-400">{u.email}</div>
                          </td>
                          <td className="py-3 px-4 text-xs capitalize text-zinc-300">{u.role}</td>
                          <td className="py-3 px-4">
                            <StatusText status={u.accountStatus} />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              size="sm"
                              variant={u.accountStatus === 'active' ? 'secondary' : 'primary'}
                              onClick={() =>
                                void adminSetUserStatus(
                                  u.uid,
                                  u.accountStatus === 'active' ? 'suspended' : 'active'
                                )
                              }
                            >
                              {u.accountStatus === 'active' ? 'Suspend' : 'Activate'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-[#2A2A33]">
                  <h2 className="font-display text-lg font-bold text-white">Freelancer Listings</h2>
                </div>
                {liveFreelancers.length === 0 ? (
                  <p className="p-6 text-sm text-zinc-400">No published freelancer profiles yet.</p>
                ) : (
                  <div className="divide-y divide-[#262630]">
                    {liveFreelancers.map((fl) => (
                      <div key={fl.id} className="p-4 flex items-center justify-between gap-4">
                        <div>
                          <div className="font-medium text-white">{fl.name}</div>
                          <div className="text-xs text-zinc-400">{fl.category} · {fl.headline}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusText status={fl.status} />
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              void adminSetFreelancerStatus(
                                fl.id,
                                fl.status === 'active' ? 'suspended' : 'active'
                              )
                            }
                          >
                            {fl.status === 'active' ? 'Suspend' : 'Activate'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {tab === 'projects' && (
            <section className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-[#2A2A33]">
                <h2 className="font-display text-lg font-bold text-white">Published Projects</h2>
              </div>
              {liveProjects.length === 0 ? (
                <p className="p-6 text-sm text-zinc-400">No live projects posted yet.</p>
              ) : (
                <div className="divide-y divide-[#262630]">
                  {liveProjects.map((proj) => (
                    <div key={proj.id} className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <div className="font-medium text-white">{proj.title}</div>
                        <div className="text-xs text-zinc-400">
                          {proj.creatorName} · {proj.category} · {formatCurrency(proj.budget)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusText status={proj.status} />
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => void adminDeleteProject(proj.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === 'reports' && (
            <section className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-white">Reported Profiles & Content</h2>
              {reports.length === 0 ? (
                <p className="text-sm text-zinc-400">No moderation reports submitted.</p>
              ) : (
                <div className="divide-y divide-[#262630]">
                  {reports.map((rep) => (
                    <div key={rep.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                          <span className="capitalize">{rep.targetType}</span>
                          <span aria-hidden="true">·</span>
                          <StatusText status={rep.status} />
                        </div>
                        <h3 className="font-semibold text-white">{rep.targetName}</h3>
                        <p className="text-sm text-zinc-300 mt-1">{rep.reason}</p>
                      </div>
                      {rep.status === 'open' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => void adminUpdateReportStatus(rep.id, 'dismissed')}
                          >
                            Dismiss
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => void adminUpdateReportStatus(rep.id, 'resolved')}
                          >
                            Mark Resolved
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === 'categories' && (
            <section className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-white">
                    Marketplace Categories
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Manage active creator categories across discovery and project posting.
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => void handleSeedCategories()}>
                  Sync Default 12 Categories
                </Button>
              </div>

              <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="New category name"
                  required
                />
                <Input
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Short description"
                />
                <Button type="submit">Add Category</Button>
              </form>

              <div className="divide-y divide-[#262630]">
                {(categories.length > 0 ? categories : MARKETPLACE_CATEGORIES.map((c) => ({ ...c, id: c.slug, active: true }))).map((cat) => (
                  <div key={cat.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-white">{cat.name}</div>
                      {cat.description && <div className="text-xs text-zinc-400">{cat.description}</div>}
                    </div>
                    {categories.some((c) => c.id === cat.id) && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void adminToggleCategory(cat.id, !cat.active)}
                      >
                        {cat.active ? 'Disable' : 'Enable'}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab === 'transactions' && (
            <section className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-[#2A2A33]">
                <h2 className="font-display text-lg font-bold text-white">
                  Platform Transactions & Payouts
                </h2>
              </div>
              {payments.length === 0 ? (
                <p className="p-6 text-sm text-zinc-400">No payment transactions recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#141419] text-xs text-zinc-400 border-b border-[#2A2A33]">
                      <tr>
                        <th className="py-3 px-4 font-medium">Order / Request</th>
                        <th className="py-3 px-4 font-medium">Type</th>
                        <th className="py-3 px-4 font-medium">Status</th>
                        <th className="py-3 px-4 font-medium text-right">Gross</th>
                        <th className="py-3 px-4 font-medium text-right">Fee</th>
                        <th className="py-3 px-4 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#262630]">
                      {payments.map((pay) => (
                        <tr key={pay.id} className="hover:bg-[#202028] transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-medium text-white">{pay.orderTitle}</div>
                            <div className="text-xs text-zinc-500 tabular-nums">
                              {formatTimestamp(pay.createdAt)}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-xs text-zinc-400">{pay.type}</td>
                          <td className="py-3 px-4">
                            <StatusText status={pay.status} />
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-white tabular-nums">
                            {formatCurrency(pay.grossAmount)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-[#E8F553] tabular-nums">
                            {formatCurrency(pay.platformCommission)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {pay.type === 'withdrawal' && pay.status === 'requested' && (
                              <Button
                                size="sm"
                                onClick={() => void adminUpdatePaymentStatus(pay.id, 'paid')}
                              >
                                Mark Paid
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
