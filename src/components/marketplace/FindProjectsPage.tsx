import React, { useMemo, useState } from 'react';
import { Calendar, ExternalLink, Plus, Search } from 'lucide-react';
import { MARKETPLACE_CATEGORIES } from '@/src/constants/categories';
import { useAuth } from '@/src/contexts/AuthContext';
import { SHOWCASE_PROJECTS } from '@/src/data/showcaseSamples';
import { createProject, submitProposal } from '@/src/lib/firestoreService';
import { formatCurrency, isSafeHttpUrl } from '@/src/lib/utils';
import { Button, Input, Modal, Select, Textarea } from '@/src/components/ui/primitives';
import type { CategoryItem, FreelancerProfile, Project } from '@/src/types/marketplace';

interface FindProjectsPageProps {
  liveProjects: Project[];
  liveFreelancers: FreelancerProfile[];
  categories: CategoryItem[];
  onRequireAuth: (role?: 'creator' | 'freelancer') => void;
}

export function FindProjectsPage({
  liveProjects,
  liveFreelancers,
  categories,
  onRequireAuth,
}: FindProjectsPageProps) {
  const { firebaseUser, userAccount } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [minBudget, setMinBudget] = useState('0');
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [postOpen, setPostOpen] = useState(false);

  const [pTitle, setPTitle] = useState('');
  const [pCategory, setPCategory] = useState(MARKETPLACE_CATEGORIES[0].name);
  const [pSkills, setPSkills] = useState('');
  const [pBudget, setPBudget] = useState('500');
  const [pDeadline, setPDeadline] = useState('2026-12-15');
  const [pRefUrl, setPRefUrl] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pError, setPError] = useState('');
  const [pSubmitting, setPSubmitting] = useState(false);

  const [propPrice, setPropPrice] = useState('');
  const [propDays, setPropDays] = useState('5');
  const [propCover, setPropCover] = useState('');
  const [propError, setPropError] = useState('');
  const [propSuccess, setPropSuccess] = useState('');
  const [propSubmitting, setPropSubmitting] = useState(false);

  const categoryNames = useMemo(() => {
    const names = new Set(MARKETPLACE_CATEGORIES.map((c) => c.name));
    categories.filter((c) => c.active).forEach((c) => names.add(c.name));
    return Array.from(names);
  }, [categories]);

  const allProjects = useMemo(() => {
    const openLive = liveProjects.filter((p) => p.status === 'open');
    return [...openLive, ...SHOWCASE_PROJECTS];
  }, [liveProjects]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const floor = Number(minBudget) || 0;
    return allProjects.filter((p) => {
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
      if (p.budget < floor) return false;
      if (q) {
        const hay = `${p.title} ${p.description} ${p.category} ${p.requiredSkills.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allProjects, search, selectedCategory, minBudget]);

  const handleOpenPost = () => {
    if (!firebaseUser) {
      onRequireAuth('creator');
      return;
    }
    setPError('');
    setPostOpen(true);
  };

  const handlePublishProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    if (pTitle.trim().length < 5) {
      setPError('Project title must be at least 5 characters.');
      return;
    }
    if (pDesc.trim().length < 15) {
      setPError('Please include at least 15 characters describing deliverables and scope.');
      return;
    }
    if (pRefUrl.trim() && !isSafeHttpUrl(pRefUrl.trim())) {
      setPError('Reference link must begin with https:// or http://.');
      return;
    }
    setPError('');
    setPSubmitting(true);
    try {
      await createProject({
        creatorUid: firebaseUser.uid,
        creatorName: userAccount?.channelName || userAccount?.displayName || firebaseUser.displayName || 'Creator',
        title: pTitle.trim(),
        description: pDesc.trim(),
        category: pCategory,
        requiredSkills: pSkills.split(',').map((s) => s.trim()).filter(Boolean),
        budget: Number(pBudget) || 250,
        deadline: pDeadline,
        referenceUrl: pRefUrl.trim() || undefined,
      });
      setPostOpen(false);
      setPTitle('');
      setPSkills('');
      setPDesc('');
      setPRefUrl('');
    } catch (err) {
      setPError(err instanceof Error ? err.message : 'Unable to publish project.');
    } finally {
      setPSubmitting(false);
    }
  };

  const handleOpenProject = (project: Project) => {
    setActiveProject(project);
    setPropPrice(String(project.budget));
    setPropDays('5');
    setPropCover('');
    setPropError('');
    setPropSuccess('');
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;
    if (!firebaseUser) {
      onRequireAuth('freelancer');
      return;
    }
    if (activeProject.isSample) {
      setPropError(
        'This is a curated showcase preview brief. Submit proposals on live creator briefs published above, or create a live project brief from a Creator account.'
      );
      return;
    }
    if (activeProject.creatorUid === firebaseUser.uid) {
      setPropError('You cannot submit a proposal to your own project.');
      return;
    }
    if (propCover.trim().length < 10) {
      setPropError('Please write a cover message of at least 10 characters.');
      return;
    }
    setPropError('');
    setPropSubmitting(true);
    try {
      const myProfile = liveFreelancers.find((f) => f.uid === firebaseUser.uid);
      await submitProposal({
        projectId: activeProject.id,
        projectTitle: activeProject.title,
        creatorUid: activeProject.creatorUid,
        freelancerUid: firebaseUser.uid,
        freelancerName: myProfile?.name || userAccount?.displayName || firebaseUser.displayName || 'Freelancer',
        freelancerHeadline: myProfile?.headline || userAccount?.channelName,
        proposedPrice: Number(propPrice) || activeProject.budget,
        deliveryDays: Number(propDays) || 5,
        coverMessage: propCover.trim(),
      });
      setPropSuccess('Proposal submitted! The creator can now review and accept it.');
      setPropCover('');
    } catch (err) {
      setPropError(err instanceof Error ? err.message : 'Failed to submit proposal.');
    } finally {
      setPropSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">
            Find Creator Projects
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 mt-1.5">
            Browse open production briefs, inspect deliverables, and send custom proposals directly to creators.
          </p>
        </div>
        <Button className="rounded-full" onClick={handleOpenPost}>
          <Plus className="w-4 h-4" />
          Post a Project
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-4 sm:p-5 mb-8 grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6 relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by title, skill, or format..."
            className="pl-10"
          />
        </div>
        <div className="md:col-span-4">
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="All">All Categories</option>
            {categoryNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </div>
        <div className="md:col-span-2">
          <Select value={minBudget} onChange={(e) => setMinBudget(e.target.value)} aria-label="Minimum budget">
            <option value="0">Any budget</option>
            <option value="150">$150+</option>
            <option value="500">$500+</option>
            <option value="1000">$1,000+</option>
          </Select>
        </div>
      </div>

      {/* Project List */}
      {filtered.length === 0 ? (
        <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-12 text-center">
          <h3 className="font-display text-lg font-semibold text-white mb-1">
            No open projects match those filters
          </h3>
          <p className="text-sm text-zinc-400 mb-5">
            Reset filters or publish a new creator brief to get started.
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setSearch('');
              setSelectedCategory('All');
              setMinBudget('0');
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((project) => (
            <article
              key={project.id}
              className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl p-6 hover:border-[#E8F553]/60 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                    <span className="font-medium text-[#E8F553]">{project.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>Posted by {project.creatorName}</span>
                    {project.isSample && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>Showcase Preview</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Calendar className="w-3.5 h-3.5" />
                      Due {project.deadline}
                    </span>
                  </div>

                  <h2 className="font-display text-xl font-semibold text-white">
                    {project.title}
                  </h2>

                  <p className="text-sm text-zinc-400 leading-relaxed max-w-3xl">
                    {project.description}
                  </p>

                  <p className="text-xs text-zinc-500 pt-1">
                    Skills: {project.requiredSkills.join(' · ')}
                  </p>
                </div>

                <div className="flex lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0 lg:min-w-[170px] border-t lg:border-t-0 pt-4 lg:pt-0 border-[#282832]">
                  <div className="text-left lg:text-right">
                    <div className="text-xs text-zinc-400">Project Budget</div>
                    <div className="font-mono text-2xl font-bold text-[#E8F553] tabular-nums">
                      {formatCurrency(project.budget)}
                    </div>
                  </div>
                  <Button size="sm" className="rounded-full" onClick={() => handleOpenProject(project)}>
                    View & Submit Proposal
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Project Detail & Proposal Modal */}
      <Modal
        open={Boolean(activeProject)}
        onClose={() => setActiveProject(null)}
        title={activeProject?.title || 'Project Brief'}
        subtitle={
          activeProject
            ? `${activeProject.category} · Budget ${formatCurrency(activeProject.budget)} · Due ${activeProject.deadline}`
            : undefined
        }
        maxWidth="max-w-2xl"
      >
        {activeProject && (
          <div className="space-y-6">
            <div className="space-y-3 text-sm text-zinc-300 leading-relaxed">
              <p className="whitespace-pre-line">{activeProject.description}</p>
              <p className="text-xs text-zinc-400">
                Required skills: {activeProject.requiredSkills.join(' · ')}
              </p>
              {activeProject.referenceUrl && isSafeHttpUrl(activeProject.referenceUrl) && (
                <a
                  href={activeProject.referenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E8F553] hover:underline"
                >
                  Open creator reference link
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <div className="border-t border-[#282832] pt-5">
              <h3 className="font-display text-base font-semibold text-white mb-3">
                Submit Your Proposal
              </h3>
              {propSuccess ? (
                <div className="space-y-4">
                  <p className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3.5">
                    {propSuccess}
                  </p>
                  <Button onClick={() => setActiveProject(null)}>Done</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmitProposal} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">
                        Proposed Price (USD)
                      </label>
                      <Input
                        type="number"
                        min={5}
                        value={propPrice}
                        onChange={(e) => setPropPrice(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">
                        Delivery Estimate (Days)
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        value={propDays}
                        onChange={(e) => setPropDays(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Cover Message & Relevant Samples
                    </label>
                    <Textarea
                      rows={4}
                      value={propCover}
                      onChange={(e) => setPropCover(e.target.value)}
                      placeholder="Explain your creative approach, turnaround plan, and relevant channel work..."
                      required
                    />
                  </div>
                  {propError && (
                    <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                      {propError}
                    </p>
                  )}
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={() => setActiveProject(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={propSubmitting}>
                      {propSubmitting ? 'Submitting...' : 'Submit Proposal'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Post Project Modal */}
      <Modal
        open={postOpen}
        onClose={() => setPostOpen(false)}
        title="Publish a Creator Project"
        subtitle="Freelancers will review your brief and submit tailored proposals."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handlePublishProject} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Project Title</label>
            <Input
              value={pTitle}
              onChange={(e) => setPTitle(e.target.value)}
              placeholder="e.g. 15-Minute YouTube Video Essay Edit"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Category</label>
              <Select value={pCategory} onChange={(e) => setPCategory(e.target.value)}>
                {categoryNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Budget (USD)</label>
              <Input
                type="number"
                min={10}
                value={pBudget}
                onChange={(e) => setPBudget(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Required Skills (comma separated)
              </label>
              <Input
                value={pSkills}
                onChange={(e) => setPSkills(e.target.value)}
                placeholder="Premiere Pro, Sound Design, LUTs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Target Deadline</label>
              <Input
                type="date"
                value={pDeadline}
                onChange={(e) => setPDeadline(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Reference Link (Optional)
            </label>
            <Input
              type="url"
              value={pRefUrl}
              onChange={(e) => setPRefUrl(e.target.value)}
              placeholder="https://youtube.com/... or https://frame.io/..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Project Description & Deliverables
            </label>
            <Textarea
              rows={4}
              value={pDesc}
              onChange={(e) => setPDesc(e.target.value)}
              placeholder="Outline raw footage length, style references, and expected deliverables..."
              required
            />
          </div>
          {pError && (
            <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              {pError}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={() => setPostOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pSubmitting}>
              {pSubmitting ? 'Publishing...' : 'Publish Project'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
