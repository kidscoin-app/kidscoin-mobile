/**
 * Types relacionados a recompensas
 */

export type RedemptionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Reward {
  id: string;
  name: string;
  description: string | null;
  coinCost: number;
  category: string | null;
  imageUrl: string | null;
  isActive: boolean;
  familyId: string;
  createdByName: string;
  createdAt: string;
}

export interface Redemption {
  id: string;
  reward: Reward;
  childId: string;
  childName: string;
  status: RedemptionStatus;
  requestedAt: string;
  reviewedAt: string | null;
  reviewedByName: string | null;
  rejectionReason: string | null;
}

export interface CreateRewardData {
  name: string;
  description?: string;
  coinCost: number;
  category?: string;
  imageUrl?: string;
}

export interface CreateRedemptionData {
  rewardId: string;
}

export interface RejectRedemptionData {
  rejectionReason: string;
}
