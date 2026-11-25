import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flag,
  MessageSquare,
  Star,
} from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { SHOWCASE_REVIEWS } from '@/src/data/showcaseSamples';
import { submitReport } from '@/src/lib/firestoreService';
import { formatCurrency, isSafeHttpUrl } from '@/src/lib/utils';
import { Button, Modal, SafeImage, Textarea } from '@/src/components/ui/primitives';
import type { FreelancerProfile, PortfolioItem, Review, ServicePackage } from '@/src/types/marketplace';

interface FreelancerProfilePageProps {
  freelancer: FreelancerProfile;
  reviews: Review[];
  onBack: () => void;
  onHire: (freelancer: FreelancerProfile, selectedPackage?: ServicePackage) => void;
  onContact: (freelancer: FreelancerProfile) => void;
  onRequireAuth: () => void;
}

export function FreelancerProfilePage({
  freelancer,
  reviews,
  onBack,
  onHire,
  onContact,
  onRequireAuth,
}: FreelancerProfilePageProps) {
  const { firebaseUser } = useAuth();
  const [selectedPkgIndex, setSelectedPkgIndex] = useState(0);
  const [lightboxItem, setLightboxItem] = useState<PortfolioItem | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDone, setReportDone] = useState(false);
  const [reportError, setReportError] = useState('');

  const profileReviews = useMemo(() => {
    const live = reviews.filter(
      (r) => r.freelancerUid === freelancer.uid || r.freelancerId === freelancer.id
    );
    const sample = freelancer.isSample
      ? SHOWCASE_REVIEWS.filter((r) => r.freelancerId === freelancer.id)
      : [];
    return [...live, ...sample];
  }, [reviews, freelancer]);

  const computedRating = useMemo(() => {
    if (profileReviews.length === 0) return freelancer.rating;
    const sum = profileReviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / profileReviews.length;
  }, [profileReviews, freelancer.rating]);

  const packages = freelancer.packages?.length
    ? freelancer.packages
    : [
        {
          name: 'Standard Service Package',
          price: freelancer.startingPrice,
          deliveryDays: 5,
          revisions: 2,
          description: `Complete ${freelancer.category} deliverable tailored to your brief.`,
        },
      ];

  const activePackage = packages[selectedPkgIndex] || packages[0];

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
      onRequireAuth();
      return;
    }
    if (reportReason.trim().length < 5) {
      setReportError('Please describe why you are reporting this profile (min 5 characters).');
      return;
    }
    setReportError('');
    try {
      await submitReport({
        reporterUid: firebaseUser.uid,
        targetType: 'freelancer',
        targetId: freelancer.id,
        targetName: freelancer.name,
        reason: reportReason.trim(),
      });
      setReportDone(true);
      setReportReason('');
    } catch (err) {
      setReportError(err instanceof Error ? err.message : 'Unable to submit report.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Explore Talent
      </button>

      {/* Cover & Identity Header */}
      <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl overflow-hidden mb-8">
        <div className="h-44 sm:h-56 bg-[#131316] overflow-hidden">
          <SafeImage
            src={freelancer.coverUrl || freelancer.portfolioItems[0]?.imageUrl}
            alt={`${freelancer.name} cover banner`}
            className="w-full h-full object-cover"
            fallbackTitle={freelancer.category}
          />
        </div>
        <div className="px-6 sm:px-8 pb-7 pt-5 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <SafeImage
              src={freelancer.avatarUrl}
              alt={freelancer.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-[#1A1A20] -mt-14 sm:-mt-16 bg-[#131316] shadow-md shrink-0"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mb-1">
                <span className="text-[#E8F553] font-medium">{freelancer.category}</span>
                {freelancer.isSample && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>Showcase Preview Profile</span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-white font-medium tabular-nums">
                  <Star className="w-3.5 h-3.5 fill-[#E8F553] text-[#E8F553]" />
                  {computedRating.toFixed(1)} ({profileReviews.length || freelancer.reviewCount} reviews)
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{freelancer.completedOrders} completed orders</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
                {freelancer.name}
              </h1>
              <p className="text-sm sm:text-base text-zinc-300 mt-1">{freelancer.headline}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button variant="secondary" className="rounded-full" onClick={() => onContact(freelancer)}>
              <MessageSquare className="w-4 h-4" />
              Contact
            </Button>
            <Button className="rounded-full" onClick={() => onHire(freelancer, activePackage)}>
              Hire Now
            </Button>
            <button
              type="button"
              onClick={() => {
                setReportDone(false);
                setReportOpen(true);
              }}
              aria-label="Report profile"
              className="p-2.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
              title="Report profile"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-6 sm:p-7">
            <h2 className="font-display text-lg font-semibold text-white mb-3">About</h2>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed whitespace-pre-line mb-6">
              {freelancer.bio}
            </p>
            <h3 className="text-xs font-semibold text-white mb-2.5">Skills & Tools</h3>
            <p className="text-sm text-zinc-400">{freelancer.skills.join('  ·  ')}</p>
          </section>

          <section className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-6 sm:p-7">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-semibold text-white">
                Portfolio & Previous Projects
              </h2>
              <span className="text-xs text-zinc-400 tabular-nums">
                {freelancer.portfolioItems.length} featured{' '}
                {freelancer.portfolioItems.length === 1 ? 'work' : 'works'}
              </span>
            </div>

            {freelancer.portfolioItems.length === 0 ? (
              <p className="text-sm text-zinc-400 py-6">
                No portfolio samples published yet. Message {freelancer.name} for private work links.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {freelancer.portfolioItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLightboxItem(item)}
                    className="group text-left bg-[#141419] border border-[#282832] rounded-xl overflow-hidden hover:border-[#E8F553]/60 transition-colors cursor-pointer"
                  >
                    <div className="aspect-[4/3] bg-[#131316] overflow-hidden">
                      <SafeImage
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                        fallbackTitle={item.title}
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-zinc-400 mb-1">
                        {item.category}
                        {item.outcome ? ` · ${item.outcome}` : ''}
                      </p>
                      <h3 className="font-display text-sm font-semibold text-white line-clamp-1">
                        {item.title}
                      </h3>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-6 sm:p-7">
            <h2 className="font-display text-lg font-semibold text-white mb-5">
              Creator Reviews ({profileReviews.length})
            </h2>
            {profileReviews.length === 0 ? (
              <p className="text-sm text-zinc-400">
                No verified reviews yet. Complete an order with {freelancer.name} to leave the first review.
              </p>
            ) : (
              <div className="divide-y divide-[#262630]">
                {profileReviews.map((rev) => (
                  <div key={rev.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-4 mb-1.5">
                      <span className="text-sm font-semibold text-white">{rev.creatorName}</span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#E8F553] tabular-nums">
                        <Star className="w-3.5 h-3.5 fill-[#E8F553] text-[#E8F553]" />
                        {rev.rating}.0
                      </span>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="lg:col-span-4 bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-semibold text-white mb-4">
            Services & Pricing Packages
          </h2>

          {packages.length > 1 && (
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#131317] border border-[#262630] rounded-lg mb-5">
              {packages.map((pkg, idx) => (
                <button
                  key={pkg.name}
                  type="button"
                  onClick={() => setSelectedPkgIndex(idx)}
                  className={`py-1.5 px-2 text-xs font-medium rounded-md truncate transition-colors cursor-pointer ${
                    selectedPkgIndex === idx
                      ? 'bg-[#E8F553] text-[#131316] font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Tier {idx + 1}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-display text-base font-semibold text-white">
                {activePackage.name}
              </h3>
              <span className="font-mono text-xl font-bold text-[#E8F553] tabular-nums shrink-0">
                {formatCurrency(activePackage.price)}
              </span>
            </div>

            <p className="text-sm text-zinc-400 leading-relaxed">{activePackage.description}</p>

            <div className="py-3 border-y border-[#262630] flex items-center justify-between text-xs text-zinc-400 tabular-nums">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                {activePackage.deliveryDays}-day delivery
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#E8F553]" />
                {activePackage.revisions} revisions included
              </span>
            </div>

            <div className="space-y-2.5 pt-1">
              <Button className="w-full rounded-full" onClick={() => onHire(freelancer, activePackage)}>
                Hire for {formatCurrency(activePackage.price)}
              </Button>
              <Button
                variant="secondary"
                className="w-full rounded-full"
                onClick={() => onContact(freelancer)}
              >
                Message {freelancer.name.split(' ')[0]}
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* Portfolio Lightbox Modal */}
      <Modal
        open={Boolean(lightboxItem)}
        onClose={() => setLightboxItem(null)}
        title={lightboxItem?.title || 'Portfolio Work'}
        subtitle={
          lightboxItem
            ? `${lightboxItem.category}${lightboxItem.outcome ? ` · ${lightboxItem.outcome}` : ''}`
            : undefined
        }
        maxWidth="max-w-2xl"
      >
        {lightboxItem && (
          <div className="space-y-4">
            <div className="aspect-[16/10] bg-[#131316] rounded-lg overflow-hidden">
              <SafeImage
                src={lightboxItem.imageUrl}
                alt={lightboxItem.title}
                className="w-full h-full object-cover"
              />
            </div>
            {lightboxItem.projectUrl && isSafeHttpUrl(lightboxItem.projectUrl) && (
              <a
                href={lightboxItem.projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#E8F553] hover:underline"
              >
                Open external portfolio link
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}
      </Modal>

      {/* Report Profile Modal */}
      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title={`Report ${freelancer.name}`}
        subtitle="Moderation reports are reviewed by Keyframe administrators."
      >
        {reportDone ? (
          <div className="space-y-4">
            <p className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3.5">
              Thank you. Your report has been queued for admin moderation.
            </p>
            <Button onClick={() => setReportOpen(false)}>Close</Button>
          </div>
        ) : (
          <form onSubmit={handleReportSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Reason for report
              </label>
              <Textarea
                rows={4}
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Describe misleading portfolio claims, spam, or policy violations..."
                required
              />
            </div>
            {reportError && (
              <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                {reportError}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setReportOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger">
                Submit Report
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
