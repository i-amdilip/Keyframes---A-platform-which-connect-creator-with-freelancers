export type UserRole = 'creator' | 'freelancer';
export type AccountStatus = 'active' | 'suspended';

export interface UserAccount {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  accountStatus: AccountStatus;
  avatarUrl?: string;
  bio?: string;
  channelName?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  projectUrl?: string;
  outcome?: string;
}

export interface ServicePackage {
  name: string;
  price: number;
  deliveryDays: number;
  revisions: number;
  description: string;
}

export interface FreelancerProfile {
  id: string;
  uid: string;
  name: string;
  headline: string;
  bio: string;
  category: string;
  skills: string[];
  startingPrice: number;
  hourlyRate?: number;
  rating: number;
  reviewCount: number;
  completedOrders: number;
  avatarUrl: string;
  coverUrl?: string;
  portfolioItems: PortfolioItem[];
  packages: ServicePackage[];
  status: AccountStatus;
  isSample?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type ProjectStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

export interface Project {
  id: string;
  creatorUid: string;
  creatorName: string;
  title: string;
  description: string;
  category: string;
  requiredSkills: string[];
  budget: number;
  deadline: string;
  referenceUrl?: string;
  status: ProjectStatus;
  proposalCount: number;
  isSample?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type ProposalStatus = 'pending' | 'accepted' | 'rejected';

export interface Proposal {
  id: string;
  projectId: string;
  projectTitle: string;
  creatorUid: string;
  freelancerUid: string;
  freelancerName: string;
  freelancerHeadline?: string;
  proposedPrice: number;
  deliveryDays: number;
  coverMessage: string;
  status: ProposalStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type OrderStatus =
  | 'ordered'
  | 'in_progress'
  | 'delivered'
  | 'revision_requested'
  | 'completed'
  | 'cancelled';

export interface Order {
  id: string;
  projectId?: string;
  proposalId?: string;
  title: string;
  category: string;
  creatorUid: string;
  creatorName: string;
  freelancerUid: string;
  freelancerName: string;
  price: number;
  platformFee: number;
  netPayout: number;
  deadline?: string;
  status: OrderStatus;
  deliveryUrl?: string;
  deliveryNotes?: string;
  revisionNote?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Conversation {
  id: string;
  participantUids: string[];
  creatorUid: string;
  creatorName: string;
  freelancerUid: string;
  freelancerName: string;
  projectId?: string;
  projectTitle?: string;
  lastMessage?: string;
  lastSenderUid?: string;
  unreadByCreator: boolean;
  unreadByFreelancer: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  participantUids: string[];
  senderUid: string;
  senderName: string;
  body: string;
  attachmentName?: string;
  attachmentUrl?: string;
  createdAt?: unknown;
}

export interface Review {
  id: string;
  orderId: string;
  freelancerId: string;
  freelancerUid: string;
  creatorUid: string;
  creatorName: string;
  rating: number;
  comment: string;
  createdAt?: unknown;
}

export interface PaymentRecord {
  id: string;
  orderId?: string;
  orderTitle: string;
  creatorUid?: string;
  freelancerUid: string;
  grossAmount: number;
  platformCommission: number;
  netAmount: number;
  type: 'order_record' | 'withdrawal';
  status: 'pending' | 'held' | 'released' | 'requested' | 'paid';
  payoutMethod?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AppNotification {
  id: string;
  recipientUid: string;
  title: string;
  body: string;
  linkTab?: string;
  read: boolean;
  createdAt?: unknown;
}

export interface ModerationReport {
  id: string;
  reporterUid: string;
  targetType: 'freelancer' | 'project';
  targetId: string;
  targetName: string;
  reason: string;
  status: 'open' | 'resolved' | 'dismissed';
  createdAt?: unknown;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
  createdAt?: unknown;
}

export type AppView =
  | 'landing'
  | 'explore-talent'
  | 'freelancer-profile'
  | 'find-projects'
  | 'creator-dashboard'
  | 'freelancer-dashboard'
  | 'admin-dashboard'
  | 'messages';
