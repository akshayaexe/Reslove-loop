import { Timestamp } from 'firebase/firestore';

export type NavTabId =
  | 'dashboard'
  | 'submit'
  | 'complaints'
  | 'track'
  | 'promises'
  | 'confirm'
  | 'notifications'
  | 'profile';

export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type ComplaintStatus =
  | 'Draft'
  | 'In Progress'
  | 'Awaiting Confirmation'
  | 'Resolved'
  | 'Escalated';

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  dateOfBirth: string;
  occupation: string;
  location: string;
  notifyEmail: boolean;
  notifySms: boolean;
  notifyPromise: boolean;
  notifyCommunity: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Complaint {
  id: string;
  userId: string;
  ticketCode: string;
  title: string;
  category: string;
  orderId: string;
  description: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  currentStep: number;
  assignedAgentName: string;
  assignedAgentRole: string;
  assignedAgentRating: number;
  aiClassification: string;
  aiClarityScore: number;
  aiSuggestion: string;
  estimatedResolution: string;
  assignedTeam: string;
  attachments: string[];
  latestUpdateNote: string;
  resolutionSummary: string[];
  rating: number;
  feedbackText: string;
  resolvedInDays: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ComplaintEvent {
  id: string;
  userId: string;
  title: string;
  description: string;
  senderType: 'system' | 'agent' | 'customer' | 'ai';
  senderName: string;
  tag: string;
  createdAt?: Timestamp;
}

export interface PromiseItem {
  id: string;
  userId: string;
  complaintId: string;
  ticketCode: string;
  title: string;
  dueDateIso: string;
  progressPercent: number;
  status: 'Active' | 'Kept' | 'At Risk' | 'Expired';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface NotificationItem {
  id: string;
  userId: string;
  complaintId: string;
  ticketCode: string;
  type:
    | 'Agent Reply'
    | 'AI Analysis'
    | 'Promise Met'
    | 'Progress Update'
    | 'Resolution Confirm';
  title: string;
  message: string;
  previewText: string;
  progressPercent: number;
  isRead: boolean;
  unreadCount: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface AiAnalysisResult {
  classification: string;
  detectedPriority: string;
  clarityScore: number;
  clarityLabel: string;
  claritySummary: string;
  suggestion: string;
  estimatedResolution: string;
  assignedTeam: string;
}
