export interface User {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
}

export interface AuthResponse {
  authenticated: boolean;
  user: User | null;
}

export interface Sender {
  id: string;
  email: string;
  displayName: string | null;
}

export interface SlackConnection {
  id: string;
  teamId: string;
  teamName: string;
  channelId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SlackResponse {
  connected: boolean;
  connection: SlackConnection | null;
}

export interface EmailStats {
  scheduled: number;
  queued: number;
  processing: number;
  sending: number;
  sent: number;
  failed: number;
  retryPending: number;
  active: number;
}

export interface EmailRecord {
  id: string;
  campaignId: string;
  senderId: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  scheduledAt: string;
  sentAt: string | null;
  sequence: number;
  attemptCount: number;
  messageId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailSearchResponse {
  data: EmailRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Real campaign status stored in PostgreSQL.
 *
 * This is intentionally separate from EmailRecord.status because
 * a campaign and an individual email have different lifecycles.
 */
export type CampaignStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "RUNNING"
  | "COMPLETED"
  | "PAUSED"
  | "CANCELLED";

export interface CampaignRecord {
  id: string;
  userId: string;
  senderId: string;
  subject: string;
  body: string;
  startTime: string;
  delayBetweenEmailsMs: number;
  hourlyLimit: number;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;

  sender: Sender;

  _count: {
    emails: number;
  };
}

export interface CampaignResponse {
  campaigns: CampaignRecord[];
}

export interface CampaignForm {
  senderId: string;
  subject: string;
  body: string;
  recipients: string[];
  startTime: string;
  delayBetweenEmailsMs: number;
  hourlyLimit: number;
}

export type DashboardView =
  | "overview"
  | "campaigns"
  | "scheduled"
  | "sent"
  | "search"
  | "timeline"
  | "senders"
  | "slack"
  | "queue";