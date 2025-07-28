export enum UserType {
  ADMIN = 0,
  USER = 1,
}

export enum PluginType {
  PREMIEREPRO = 'premierepro',
  AFTEREFFECTS = 'aftereffects',
}

// Platform enum
export enum Platform {
  WINDOWS = 'windows',
  MAC = 'mac'
}

export type ApiResponse = {
  success: boolean;
  message: string;
  error?: string | null;
  data?: any;
};

export enum AllowedProviders {
  GOOGLE = 'google',
  APPLE = 'apple',
  CUSTOM = 'custom', // For custom providers
}

export enum SubscriptionPlan {
  SINGLE= 'single',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export interface ReferralConversionData {
  userId: number;
  referralCode: string;
  conversionValue: number;
  source?: string;
  campaign?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AffiliateStats {
  totalReferrals: number;
  totalEarnings: number;
  pendingCommissions: number;
  paidCommissions: number;
  conversionRate: number;
  referralBreakdown: {
    pending: number;
    converted: number;
    cancelled: number;
  };
}