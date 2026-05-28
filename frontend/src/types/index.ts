import type { LucideIcon } from "lucide-react";

export type NavItemId = "home" | "history" | "market" | "rewards" | "profile";

export type ChallengeStepStatus = "done" | "current" | "pending";

export interface ChallengeFlowStep {
  id: string;
  label: string;
}

export interface ChallengeProgressStep {
  id: string;
  label: string;
  status: ChallengeStepStatus;
}

export interface RewardOffer {
  id: string;
  title: string;
  description: string;
}

export interface MonthlyChallenge {
  id: string;
  posterLabel: string;
  title: string;
  imageUrl: string;
  daysRemaining: number;
  endDateLabel: string;
  flowSteps: ChallengeFlowStep[];
  ideasDetail: string;
  ideasBullets: string[];
}

export interface ChallengeProgress {
  percent: number;
  completedSteps: number;
  totalSteps: number;
  steps: ChallengeProgressStep[];
}

export interface RewardsPageData {
  challenge: MonthlyChallenge;
  reward: RewardOffer;
  progress: ChallengeProgress;
}

export interface VideoItem {
  id: string;
  title: string;
  channel: string;
  thumbnailUrl: string;
  /** External URL (YouTube, etc.) */
  url: string;
  /** e.g. "10:17" */
  durationLabel?: string;
}

export interface ProductItem {
  id: string;
  name: string;
  seller: string;
  priceLabel: string;
  /** Price per unit for cart total (USD) */
  unitPrice: number;
  quantity: number;
  category: string;
  description: string;
  thumbnailUrl?: string;
  /** All product photos (first is thumbnail) */
  imageUrls: string[];
  /** Optional link to external marketplace or contact */
  url?: string;
}

export interface NavItem {
  id: NavItemId;
  label: string;
  path: string;
  icon: LucideIcon;
}

export interface SolutionPhoto {
  url: string;
  caption?: string;
  description?: string;
}

export interface SolutionMedia {
  /** Used for Watch (video) and Listen (audio-only, same file) */
  videoUrl: string;
  audioUrl?: string;
  photos: SolutionPhoto[];
}

export interface SolutionStep {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  media?: SolutionMedia;
}

export interface Problem {
  id: string;
  label: string;
  imageUrl: string;
  icon: LucideIcon;
  slug: string;
  /** Short line over the hero image */
  heroText: string;
  solutions: SolutionStep[];
}

/** @deprecated Use Problem — kept for gradual migration */
export type ProblemCategory = Problem;
