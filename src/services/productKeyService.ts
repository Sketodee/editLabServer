// services/ProductKeyService.ts
import crypto from 'crypto';
import { SubscriptionModel, SubscriptionStatus } from '../model/Subscription';

export class ProductKeyService {
  /**
   * Generate a unique product key
   */
static generateProductKey(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const keyLength = 16

  let key = ''
  for (let i = 0; i < keyLength; i++) {
    const randomIndex = crypto.randomInt(0, characters.length)
    key += characters[randomIndex]
  }

  // Format as XXXX-XXXX-XXXX-XXXX
  return key.match(/.{1,4}/g)!.join('-')
}
  /**
   * Validate if a product key is valid and active
   */
  static async validateProductKey(productKey: string): Promise<{
    isValid: boolean;
    subscription?: SubscriptionModel;
    expiresAt?: Date | null;
    status?: string;
     willCancel?: boolean;
  }> {
    try {
      const subscription = await SubscriptionModel.findOne({
        where: { productKey },
        include: ['user']
      });

      if (!subscription) {
        return { isValid: false, status: 'Product key not found' };
      }

      const now = new Date();
      const isExpired = subscription.currentPeriodEnd! < now;
      const isActive = [
        SubscriptionStatus.ACTIVE,
        SubscriptionStatus.TRIALING
      ].includes(subscription.status);

      // Check if subscription is scheduled for cancellation
    const willCancel = subscription.cancelAtPeriodEnd;

      if (isExpired || !isActive) {
        return {
          isValid: false,
          subscription,
          expiresAt: subscription.currentPeriodEnd,
          status: isExpired ? 'Expired' : 'Inactive', 
          willCancel
        };
      }

      return {
        isValid: true,
        subscription,
        expiresAt: subscription.currentPeriodEnd,
        status: willCancel ? 'Active (Canceling at period end)' : 'Active',
      willCancel
      };
    } catch (error) {
      console.error('Error validating product key:', error);
      return { isValid: false, status: 'Validation error' };
    }
  }

  /**
   * Get subscription details by product key
   */
  static async getSubscriptionByProductKey(productKey: string): Promise<SubscriptionModel | null> {
    try {
      return await SubscriptionModel.findOne({
        where: { productKey },
        include: ['user']
      });
    } catch (error) {
      console.error('Error fetching subscription by product key:', error);
      return null;
    }
  }

  /**
   * Check if product key will expire soon (within 7 days)
   */
  static async checkExpirationWarning(productKey: string): Promise<{
    willExpireSoon: boolean;
    daysUntilExpiration?: number;
    expiresAt?: Date;
  }> {
    const validation = await this.validateProductKey(productKey);
    
    if (!validation.isValid || !validation.expiresAt) {
      return { willExpireSoon: false };
    }

    const now = new Date();
    const msUntilExpiration = validation.expiresAt.getTime() - now.getTime();
    const daysUntilExpiration = Math.ceil(msUntilExpiration / (1000 * 60 * 60 * 24));

    return {
      willExpireSoon: daysUntilExpiration <= 7 && daysUntilExpiration > 0,
      daysUntilExpiration,
      expiresAt: validation.expiresAt
    };
  }
}