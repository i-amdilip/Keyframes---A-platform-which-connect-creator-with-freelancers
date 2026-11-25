import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { PLATFORM_COMMISSION_RATE } from '@/src/constants/categories';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { sanitizeId, slugify } from '@/src/lib/utils';
import type {
  AccountStatus,
  AppNotification,
  CategoryItem,
  ChatMessage,
  Conversation,
  FreelancerProfile,
  ModerationReport,
  Order,
  OrderStatus,
  PaymentRecord,
  PortfolioItem,
  Project,
  ProjectStatus,
  Proposal,
  Review,
  ServicePackage,
  UserAccount,
  UserRole,
} from '@/src/types/marketplace';

function sortByCreatedDesc<T extends { createdAt?: unknown }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ta = getMillis(a.createdAt);
    const tb = getMillis(b.createdAt);
    return tb - ta;
  });
}

function sortByCreatedAsc<T extends { createdAt?: unknown }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ta = getMillis(a.createdAt);
    const tb = getMillis(b.createdAt);
    return ta - tb;
  });
}

function getMillis(ts: unknown): number {
  if (!ts) return Date.now();
  if (typeof ts === 'object' && ts !== null && 'toMillis' in ts && typeof (ts as { toMillis: () => number }).toMillis === 'function') {
    return (ts as { toMillis: () => number }).toMillis();
  }
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'number') return ts;
  return 0;
}

function makeDocId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return sanitizeId(`${prefix}_${Date.now()}_${rand}`);
}

// --- Users ---

export async function getUserAccount(uid: string): Promise<UserAccount | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return snap.data() as UserAccount;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function upsertUserAccount(input: {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
  bio?: string;
  channelName?: string;
}): Promise<void> {
  const path = `users/${input.uid}`;
  try {
    const existingSnap = await getDoc(doc(db, 'users', input.uid));
    if (!existingSnap.exists()) {
      const payload: Record<string, unknown> = {
        uid: input.uid,
        email: input.email.slice(0, 200),
        displayName: input.displayName.slice(0, 100) || 'Creator',
        role: input.role,
        accountStatus: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (input.avatarUrl) payload.avatarUrl = input.avatarUrl.slice(0, 500);
      if (input.bio) payload.bio = input.bio.slice(0, 1000);
      if (input.channelName) payload.channelName = input.channelName.slice(0, 120);
      await setDoc(doc(db, 'users', input.uid), payload);
    } else {
      const updates: Record<string, unknown> = {
        displayName: input.displayName.slice(0, 100) || 'Creator',
        role: input.role,
        updatedAt: serverTimestamp(),
      };
      if (input.avatarUrl !== undefined) updates.avatarUrl = input.avatarUrl.slice(0, 500);
      if (input.bio !== undefined) updates.bio = input.bio.slice(0, 1000);
      if (input.channelName !== undefined) updates.channelName = input.channelName.slice(0, 120);
      await updateDoc(doc(db, 'users', input.uid), updates);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function subscribeAllUsers(cb: (users: UserAccount[]) => void): () => void {
  const path = 'users';
  return onSnapshot(
    collection(db, 'users'),
    (snap) => {
      const list = snap.docs.map((d) => d.data() as UserAccount);
      cb(sortByCreatedDesc(list));
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export async function adminSetUserStatus(uid: string, accountStatus: AccountStatus): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      accountStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// --- Freelancers ---

export function subscribeFreelancers(cb: (profiles: FreelancerProfile[]) => void): () => void {
  const path = 'freelancers';
  return onSnapshot(
    collection(db, 'freelancers'),
    (snap) => {
      const list = snap.docs.map((d) => ({
        ...(d.data() as Omit<FreelancerProfile, 'id'>),
        id: d.id,
      }));
      cb(sortByCreatedDesc(list));
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export async function saveFreelancerProfile(input: {
  uid: string;
  name: string;
  headline: string;
  bio: string;
  category: string;
  skills: string[];
  startingPrice: number;
  hourlyRate?: number;
  avatarUrl?: string;
  coverUrl?: string;
  portfolioItems?: PortfolioItem[];
  packages?: ServicePackage[];
}): Promise<void> {
  const path = `freelancers/${input.uid}`;
  try {
    const existingSnap = await getDoc(doc(db, 'freelancers', input.uid));
    const cleanSkills = input.skills
      .map((s) => s.trim().slice(0, 40))
      .filter(Boolean)
      .slice(0, 10);
    if (cleanSkills.length === 0) cleanSkills.push(input.category);

    const payload: Record<string, unknown> = {
      uid: input.uid,
      name: input.name.trim().slice(0, 100),
      headline: input.headline.trim().slice(0, 160),
      bio: input.bio.trim().slice(0, 2000),
      category: input.category.trim().slice(0, 80),
      skills: cleanSkills,
      startingPrice: Math.max(5, Number(input.startingPrice) || 50),
      hourlyRate: Math.max(5, Number(input.hourlyRate || input.startingPrice) || 50),
      avatarUrl: (input.avatarUrl || '/src/assets/images/avatar_maya_lin_1795622062773.jpg').slice(0, 500),
      coverUrl: (input.coverUrl || '/src/assets/images/hero_creator_studio_1795622062132.jpg').slice(0, 500),
      portfolioItems: (input.portfolioItems || []).slice(0, 8),
      packages: (input.packages || []).slice(0, 3),
      updatedAt: serverTimestamp(),
    };

    if (!existingSnap.exists()) {
      await setDoc(doc(db, 'freelancers', input.uid), {
        ...payload,
        rating: 5.0,
        reviewCount: 0,
        completedOrders: 0,
        status: 'active',
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'freelancers', input.uid), payload);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function adminSetFreelancerStatus(freelancerId: string, status: AccountStatus): Promise<void> {
  const path = `freelancers/${freelancerId}`;
  try {
    await updateDoc(doc(db, 'freelancers', freelancerId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// --- Projects ---

export function subscribeProjects(cb: (projects: Project[]) => void): () => void {
  const path = 'projects';
  return onSnapshot(
    collection(db, 'projects'),
    (snap) => {
      const list = snap.docs.map((d) => ({
        ...(d.data() as Omit<Project, 'id'>),
        id: d.id,
      }));
      cb(sortByCreatedDesc(list));
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export async function createProject(input: {
  creatorUid: string;
  creatorName: string;
  title: string;
  description: string;
  category: string;
  requiredSkills: string[];
  budget: number;
  deadline: string;
  referenceUrl?: string;
}): Promise<string> {
  const id = makeDocId('proj');
  const path = `projects/${id}`;
  try {
    const skills = input.requiredSkills
      .map((s) => s.trim().slice(0, 40))
      .filter(Boolean)
      .slice(0, 10);
    if (skills.length === 0) skills.push(input.category);

    const payload: Record<string, unknown> = {
      creatorUid: input.creatorUid,
      creatorName: input.creatorName.trim().slice(0, 100),
      title: input.title.trim().slice(0, 160),
      description: input.description.trim().slice(0, 3000),
      category: input.category.trim().slice(0, 80),
      requiredSkills: skills,
      budget: Math.max(10, Number(input.budget) || 100),
      deadline: input.deadline.trim().slice(0, 40),
      status: 'open',
      proposalCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (input.referenceUrl && input.referenceUrl.trim()) {
      payload.referenceUrl = input.referenceUrl.trim().slice(0, 500);
    }
    await setDoc(doc(db, 'projects', id), payload);
    return id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateProjectStatus(projectId: string, status: ProjectStatus): Promise<void> {
  const path = `projects/${projectId}`;
  try {
    await updateDoc(doc(db, 'projects', projectId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// --- Proposals ---

export function subscribeProposalsForCreator(creatorUid: string, cb: (proposals: Proposal[]) => void): () => void {
  const path = 'proposals';
  const q = query(collection(db, 'proposals'), where('creatorUid', '==', creatorUid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ ...(d.data() as Omit<Proposal, 'id'>), id: d.id }));
      cb(sortByCreatedDesc(list));
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeProposalsForFreelancer(freelancerUid: string, cb: (proposals: Proposal[]) => void): () => void {
  const path = 'proposals';
  const q = query(collection(db, 'proposals'), where('freelancerUid', '==', freelancerUid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ ...(d.data() as Omit<Proposal, 'id'>), id: d.id }));
      cb(sortByCreatedDesc(list));
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export async function submitProposal(input: {
  projectId: string;
  projectTitle: string;
  creatorUid: string;
  freelancerUid: string;
  freelancerName: string;
  freelancerHeadline?: string;
  proposedPrice: number;
  deliveryDays: number;
  coverMessage: string;
}): Promise<string> {
  const id = makeDocId('prop');
  const path = `proposals/${id}`;
  try {
    const payload: Record<string, unknown> = {
      projectId: input.projectId,
      projectTitle: input.projectTitle.slice(0, 160),
      creatorUid: input.creatorUid,
      freelancerUid: input.freelancerUid,
      freelancerName: input.freelancerName.slice(0, 100),
      proposedPrice: Math.max(5, Number(input.proposedPrice)),
      deliveryDays: Math.max(1, Math.min(365, Math.round(Number(input.deliveryDays)))),
      coverMessage: input.coverMessage.trim().slice(0, 2000),
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (input.freelancerHeadline) {
      payload.freelancerHeadline = input.freelancerHeadline.slice(0, 160);
    }
    await setDoc(doc(db, 'proposals', id), payload);

    await createNotification({
      recipientUid: input.creatorUid,
      title: 'New proposal received',
      body: `${input.freelancerName} submitted a $${input.proposedPrice} proposal for "${input.projectTitle}".`,
      linkTab: 'proposals',
    });

    return id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function respondToProposal(input: {
  proposal: Proposal;
  decision: 'accepted' | 'rejected';
  creatorName: string;
  projectCategory: string;
  projectDeadline: string;
}): Promise<string | null> {
  const path = `proposals/${input.proposal.id}`;
  try {
    await updateDoc(doc(db, 'proposals', input.proposal.id), {
      status: input.decision,
      updatedAt: serverTimestamp(),
    });

    if (input.decision === 'accepted') {
      const orderId = await createOrderAndEscrow({
        projectId: input.proposal.projectId,
        proposalId: input.proposal.id,
        title: input.proposal.projectTitle,
        category: input.projectCategory,
        creatorUid: input.proposal.creatorUid,
        creatorName: input.creatorName,
        freelancerUid: input.proposal.freelancerUid,
        freelancerName: input.proposal.freelancerName,
        price: input.proposal.proposedPrice,
        deadline: input.projectDeadline,
      });

      await updateProjectStatus(input.proposal.projectId, 'in_progress');

      await createNotification({
        recipientUid: input.proposal.freelancerUid,
        title: 'Proposal accepted',
        body: `${input.creatorName} accepted your proposal for "${input.proposal.projectTitle}". An active order has been started.`,
        linkTab: 'orders',
      });

      return orderId;
    }

    await createNotification({
      recipientUid: input.proposal.freelancerUid,
      title: 'Proposal update',
      body: `Your proposal for "${input.proposal.projectTitle}" was not selected.`,
      linkTab: 'proposals',
    });

    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// --- Orders & Escrow Payments ---

export function subscribeOrdersForCreator(creatorUid: string, cb: (orders: Order[]) => void): () => void {
  const path = 'orders';
  const q = query(collection(db, 'orders'), where('creatorUid', '==', creatorUid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ ...(d.data() as Omit<Order, 'id'>), id: d.id }));
      cb(sortByCreatedDesc(list));
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeOrdersForFreelancer(freelancerUid: string, cb: (orders: Order[]) => void): () => void {
  const path = 'orders';
  const q = query(collection(db, 'orders'), where('freelancerUid', '==', freelancerUid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ ...(d.data() as Omit<Order, 'id'>), id: d.id }));
      cb(sortByCreatedDesc(list));
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export async function createOrderAndEscrow(input: {
  projectId?: string;
  proposalId?: string;
  title: string;
  category: string;
  creatorUid: string;
  creatorName: string;
  freelancerUid: string;
  freelancerName: string;
  price: number;
  deadline?: string;
}): Promise<string> {
  const orderId = makeDocId('ord');
  const path = `orders/${orderId}`;
  try {
    const gross = Math.max(5, Number(input.price));
    const platformFee = Math.round(gross * PLATFORM_COMMISSION_RATE * 100) / 100;
    const netPayout = Math.round((gross - platformFee) * 100) / 100;

    const orderPayload: Record<string, unknown> = {
      title: input.title.trim().slice(0, 160),
      category: input.category.trim().slice(0, 80),
      creatorUid: input.creatorUid,
      creatorName: input.creatorName.trim().slice(0, 100),
      freelancerUid: input.freelancerUid,
      freelancerName: input.freelancerName.trim().slice(0, 100),
      price: gross,
      platformFee,
      netPayout,
      status: 'ordered',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (input.projectId) orderPayload.projectId = input.projectId;
    if (input.proposalId) orderPayload.proposalId = input.proposalId;
    if (input.deadline) orderPayload.deadline = input.deadline.slice(0, 40);

    await setDoc(doc(db, 'orders', orderId), orderPayload);

    // Create corresponding payment ledger record (held pending order completion)
    const payId = sanitizeId(`pay_${orderId}`);
    await setDoc(doc(db, 'payments', payId), {
      orderId,
      orderTitle: input.title.trim().slice(0, 160),
      creatorUid: input.creatorUid,
      freelancerUid: input.freelancerUid,
      grossAmount: gross,
      platformCommission: platformFee,
      netAmount: netPayout,
      type: 'order_record',
      status: 'held',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Ensure a conversation thread exists between creator and freelancer
    await ensureConversation({
      creatorUid: input.creatorUid,
      creatorName: input.creatorName,
      freelancerUid: input.freelancerUid,
      freelancerName: input.freelancerName,
      projectId: input.projectId,
      projectTitle: input.title,
    });

    return orderId;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateOrderWorkflow(input: {
  order: Order;
  status: OrderStatus;
  deliveryUrl?: string;
  deliveryNotes?: string;
  revisionNote?: string;
}): Promise<void> {
  const path = `orders/${input.order.id}`;
  try {
    const updates: Record<string, unknown> = {
      status: input.status,
      updatedAt: serverTimestamp(),
    };

    if (input.status === 'delivered' || input.status === 'in_progress') {
      if (input.deliveryUrl !== undefined) updates.deliveryUrl = input.deliveryUrl.trim().slice(0, 500);
      if (input.deliveryNotes !== undefined) updates.deliveryNotes = input.deliveryNotes.trim().slice(0, 2000);
    }

    if (input.status === 'revision_requested' && input.revisionNote !== undefined) {
      updates.revisionNote = input.revisionNote.trim().slice(0, 1000);
    }

    await updateDoc(doc(db, 'orders', input.order.id), updates);

    if (input.status === 'delivered') {
      await createNotification({
        recipientUid: input.order.creatorUid,
        title: 'Delivery ready for review',
        body: `${input.order.freelancerName} submitted deliverables for "${input.order.title}".`,
        linkTab: 'orders',
      });
    } else if (input.status === 'revision_requested') {
      await createNotification({
        recipientUid: input.order.freelancerUid,
        title: 'Revision requested',
        body: `${input.order.creatorName} requested a revision on "${input.order.title}".`,
        linkTab: 'orders',
      });
    } else if (input.status === 'completed') {
      const payId = sanitizeId(`pay_${input.order.id}`);
      const paySnap = await getDoc(doc(db, 'payments', payId));
      if (paySnap.exists() && paySnap.data().status === 'held') {
        await updateDoc(doc(db, 'payments', payId), {
          status: 'released',
          updatedAt: serverTimestamp(),
        });
      }
      if (input.order.projectId) {
        try {
          await updateProjectStatus(input.order.projectId, 'completed');
        } catch {
          // Non-blocking if project doc was sample/archived
        }
      }
      await createNotification({
        recipientUid: input.order.freelancerUid,
        title: 'Order completed & earnings released',
        body: `${input.order.creatorName} approved "${input.order.title}". $${input.order.netPayout} is now available.`,
        linkTab: 'earnings',
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// --- Conversations & Real-time Messages ---

export function subscribeConversations(uid: string, cb: (convs: Conversation[]) => void): () => void {
  const path = 'conversations';
  const q = query(collection(db, 'conversations'), where('participantUids', 'array-contains', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ ...(d.data() as Omit<Conversation, 'id'>), id: d.id }));
      cb(
        [...list].sort((a, b) => getMillis(b.updatedAt) - getMillis(a.updatedAt))
      );
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export async function ensureConversation(input: {
  creatorUid: string;
  creatorName: string;
  freelancerUid: string;
  freelancerName: string;
  projectId?: string;
  projectTitle?: string;
}): Promise<string> {
  const sorted = [input.creatorUid, input.freelancerUid].sort();
  const convId = sanitizeId(`conv_${sorted[0]}_${sorted[1]}`);
  const path = `conversations/${convId}`;
  try {
    const snap = await getDoc(doc(db, 'conversations', convId));
    if (!snap.exists()) {
      const payload: Record<string, unknown> = {
        participantUids: sorted,
        creatorUid: input.creatorUid,
        creatorName: input.creatorName.slice(0, 100),
        freelancerUid: input.freelancerUid,
        freelancerName: input.freelancerName.slice(0, 100),
        unreadByCreator: false,
        unreadByFreelancer: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (input.projectId) payload.projectId = input.projectId.slice(0, 128);
      if (input.projectTitle) payload.projectTitle = input.projectTitle.slice(0, 160);
      await setDoc(doc(db, 'conversations', convId), payload);
    }
    return convId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function subscribeMessages(conversationId: string, cb: (messages: ChatMessage[]) => void): () => void {
  const path = `conversations/${conversationId}/messages`;
  return onSnapshot(
    collection(db, 'conversations', conversationId, 'messages'),
    (snap) => {
      const list = snap.docs.map((d) => ({ ...(d.data() as Omit<ChatMessage, 'id'>), id: d.id }));
      cb(sortByCreatedAsc(list));
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export async function sendMessage(input: {
  conversation: Conversation;
  senderUid: string;
  senderName: string;
  body: string;
  attachmentName?: string;
  attachmentUrl?: string;
}): Promise<void> {
  const msgId = makeDocId('msg');
  const path = `conversations/${input.conversation.id}/messages/${msgId}`;
  try {
    const payload: Record<string, unknown> = {
      conversationId: input.conversation.id,
      participantUids: input.conversation.participantUids,
      senderUid: input.senderUid,
      senderName: input.senderName.slice(0, 100),
      body: input.body.trim().slice(0, 3000),
      createdAt: serverTimestamp(),
    };
    if (input.attachmentName && input.attachmentName.trim()) {
      payload.attachmentName = input.attachmentName.trim().slice(0, 200);
    }
    if (input.attachmentUrl && input.attachmentUrl.trim()) {
      payload.attachmentUrl = input.attachmentUrl.trim().slice(0, 500);
    }

    await setDoc(doc(db, 'conversations', input.conversation.id, 'messages', msgId), payload);

    const isCreatorSender = input.senderUid === input.conversation.creatorUid;
    await updateDoc(doc(db, 'conversations', input.conversation.id), {
      lastMessage: input.body.trim().slice(0, 500),
      lastSenderUid: input.senderUid,
      unreadByCreator: !isCreatorSender,
      unreadByFreelancer: isCreatorSender,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function markConversationRead(conversation: Conversation, viewerUid: string): Promise<void> {
  const path = `conversations/${conversation.id}`;
  const isCreator = viewerUid === conversation.creatorUid;
  const needsUpdate = isCreator ? conversation.unreadByCreator : conversation.unreadByFreelancer;
  if (!needsUpdate) return;
  try {
    await updateDoc(doc(db, 'conversations', conversation.id), {
      unreadByCreator: isCreator ? false : conversation.unreadByCreator,
      unreadByFreelancer: !isCreator ? false : conversation.unreadByFreelancer,
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Silent read-receipt sync failure should not disrupt UX
  }
}

// --- Reviews ---

export function subscribeReviews(cb: (reviews: Review[]) => void): () => void {
  const path = 'reviews';
  return onSnapshot(
    collection(db, 'reviews'),
    (snap) => {
      const list = snap.docs.map((d) => ({ ...(d.data() as Omit<Review, 'id'>), id: d.id }));
      cb(sortByCreatedDesc(list));
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export async function submitReview(input: {
  orderId: string;
  freelancerId: string;
  freelancerUid: string;
  creatorUid: string;
  creatorName: string;
  rating: number;
  comment: string;
}): Promise<void> {
  const reviewId = sanitizeId(`rev_${input.orderId}`);
  const path = `reviews/${reviewId}`;
  try {
    await setDoc(doc(db, 'reviews', reviewId), {
      orderId: input.orderId,
      freelancerId: input.freelancerId,
      freelancerUid: input.freelancerUid,
      creatorUid: input.creatorUid,
      creatorName: input.creatorName.slice(0, 100),
      rating: Math.max(1, Math.min(5, Math.round(input.rating))),
      comment: input.comment.trim().slice(0, 1500),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

// --- Payments & Withdrawals ---

export function subscribePaymentsForUser(
  uid: string,
  role: 'creator' | 'freelancer',
  cb: (records: PaymentRecord[]) => void
): () => void {
  const path = 'payments';
  const field = role === 'creator' ? 'creatorUid' : 'freelancerUid';
  const q = query(collection(db, 'payments'), where(field, '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ ...(d.data() as Omit<PaymentRecord, 'id'>), id: d.id }));
      cb(sortByCreatedDesc(list));
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeAllPayments(cb: (records: PaymentRecord[]) => void): () => void {
  const path = 'payments';
  return onSnapshot(
    collection(db, 'payments'),
    (snap) => {
      const list = snap.docs.map((d) => ({ ...(d.data() as Omit<PaymentRecord, 'id'>), id: d.id }));
      cb(sortByCreatedDesc(list));
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export async function requestWithdrawal(input: {
  freelancerUid: string;
  amount: number;
  payoutMethod: string;
}): Promise<void> {
  const id = makeDocId('wd');
  const path = `payments/${id}`;
  try {
    const amount = Math.max(10, Number(input.amount));
    await setDoc(doc(db, 'payments', id), {
      orderTitle: 'Freelancer Withdrawal Request',
      freelancerUid: input.freelancerUid,
      grossAmount: amount,
      platformCommission: 0,
      netAmount: amount,
      type: 'withdrawal',
      status: 'requested',
      payoutMethod: input.payoutMethod.trim().slice(0, 120),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function adminUpdatePaymentStatus(
  paymentId: string,
  status: PaymentRecord['status']
): Promise<void> {
  const path = `payments/${paymentId}`;
  try {
    await updateDoc(doc(db, 'payments', paymentId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// --- Notifications ---

export function subscribeNotifications(uid: string, cb: (items: AppNotification[]) => void): () => void {
  const path = 'notifications';
  const q = query(collection(db, 'notifications'), where('recipientUid', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ ...(d.data() as Omit<AppNotification, 'id'>), id: d.id }));
      cb(sortByCreatedDesc(list));
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export async function createNotification(input: {
  recipientUid: string;
  title: string;
  body: string;
  linkTab?: string;
}): Promise<void> {
  const id = makeDocId('notif');
  const path = `notifications/${id}`;
  try {
    const payload: Record<string, unknown> = {
      recipientUid: input.recipientUid,
      title: input.title.slice(0, 140),
      body: input.body.slice(0, 400),
      read: false,
      createdAt: serverTimestamp(),
    };
    if (input.linkTab) payload.linkTab = input.linkTab.slice(0, 60);
    await setDoc(doc(db, 'notifications', id), payload);
  } catch {
    // Notifications should never block primary workflow
  }
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const path = `notifications/${notificationId}`;
  try {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// --- Moderation Reports & Categories (Admin) ---

export async function submitReport(input: {
  reporterUid: string;
  targetType: 'freelancer' | 'project';
  targetId: string;
  targetName: string;
  reason: string;
}): Promise<void> {
  const id = makeDocId('rep');
  const path = `reports/${id}`;
  try {
    await setDoc(doc(db, 'reports', id), {
      reporterUid: input.reporterUid,
      targetType: input.targetType,
      targetId: sanitizeId(input.targetId),
      targetName: input.targetName.slice(0, 160),
      reason: input.reason.trim().slice(0, 1000),
      status: 'open',
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export function subscribeReports(cb: (reports: ModerationReport[]) => void): () => void {
  const path = 'reports';
  return onSnapshot(
    collection(db, 'reports'),
    (snap) => {
      const list = snap.docs.map((d) => ({ ...(d.data() as Omit<ModerationReport, 'id'>), id: d.id }));
      cb(sortByCreatedDesc(list));
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export async function adminUpdateReportStatus(
  reportId: string,
  status: ModerationReport['status']
): Promise<void> {
  const path = `reports/${reportId}`;
  try {
    await updateDoc(doc(db, 'reports', reportId), { status });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export function subscribeCategories(cb: (categories: CategoryItem[]) => void): () => void {
  const path = 'categories';
  return onSnapshot(
    collection(db, 'categories'),
    (snap) => {
      const list = snap.docs.map((d) => ({ ...(d.data() as Omit<CategoryItem, 'id'>), id: d.id }));
      cb(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export async function adminSaveCategory(input: {
  name: string;
  description?: string;
  active?: boolean;
}): Promise<void> {
  const slug = sanitizeId(slugify(input.name));
  const path = `categories/${slug}`;
  try {
    const payload: Record<string, unknown> = {
      name: input.name.trim().slice(0, 80),
      slug,
      active: input.active ?? true,
      createdAt: serverTimestamp(),
    };
    if (input.description) payload.description = input.description.trim().slice(0, 300);
    await setDoc(doc(db, 'categories', slug), payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function adminToggleCategory(categoryId: string, active: boolean): Promise<void> {
  const path = `categories/${categoryId}`;
  try {
    await updateDoc(doc(db, 'categories', categoryId), { active });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function fetchAllOrdersForAdmin(): Promise<Order[]> {
  const path = 'orders';
  try {
    const snap = await getDocs(collection(db, 'orders'));
    return sortByCreatedDesc(snap.docs.map((d) => ({ ...(d.data() as Omit<Order, 'id'>), id: d.id })));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function adminDeleteProject(projectId: string): Promise<void> {
  const path = `projects/${projectId}`;
  try {
    await deleteDoc(doc(db, 'projects', projectId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
