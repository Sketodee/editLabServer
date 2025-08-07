import { Request, Response } from "express";
import { ApiResponse, SubscriptionPlan } from "../types/appScopeTypes";
import { StripeService } from "../services/stripeService";
import { ProductKeyService } from "../services/productKeyService";
import { StripeWebhookHandler } from "../services/stripeWebhookHandler";
import { SubscriptionModel } from "../model/Subscription";

const subscriptionController = {
  async createCheckoutSession(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { userId, plan, successUrl, cancelUrl } = req.body;

      if (!userId || !plan) {
        res.status(400).json({
          success: false,
          message: 'User ID and plan are required',
          error: null,
          data: null,
        });
        return;
      }

      if (!Object.values(SubscriptionPlan).includes(plan)) {
        res.status(400).json({
          success: false,
          message: 'Invalid subscription plan',
          error: null,
          data: null,
        });
        return;
      }

      const session = await StripeService.createCheckoutSession(
        userId,
        plan, successUrl, cancelUrl
      );

      res.status(200).json({
        success: true,
        message: 'Checkout session created successfully',
        error: null,
        data: session,
      });

    }
    catch (error) {
      console.error('Error creating subscription:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create subscription',
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
      });
    }
  },

  async getUserSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const subscription = await StripeService.getUserActiveSubscription(parseInt(userId));

      if (!subscription) {
        res.status(404).json({ error: 'No active subscription found' });
        return;
      }

      res.json({
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        productKey: subscription.productKey,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        trialStart: subscription.trialStart,
        trialEnd: subscription.trialEnd,
        isTrialing: subscription.status === 'trialing',
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        pluginDownloadCount: subscription.pluginDownloadCount,
      });
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      res.status(500).json({ error: 'Failed to fetch subscription' });
    }
  },

  /**
   * Validate product key
   */
  async validateProductKey(req: Request, res: Response): Promise<void> {
    try {
      const { productKey } = req.body;

      if (!productKey) {
        res.status(400).json({ error: 'Product key is required' });
        return;
      }

      const validation = await ProductKeyService.validateProductKey(productKey);

      res.json({
        isValid: validation.isValid,
        status: validation.status,
        expiresAt: validation.expiresAt,
        subscription: validation.subscription ? {
          plan: validation.subscription.plan,
          status: validation.subscription.status,
          currentPeriodEnd: validation.subscription.currentPeriodEnd,
          willCancel: validation.willCancel
        } : null
      });
    } catch (error) {
      console.error('Error validating product key:', error);
      res.status(500).json({ error: 'Failed to validate product key' });
    }
  },

  /**
   * Get subscription by product key
   */
  async getSubscriptionByProductKey(req: Request, res: Response): Promise<void> {
    try {
      const { productKey } = req.params;

      const subscription = await ProductKeyService.getSubscriptionByProductKey(productKey);

      if (!subscription) {
        res.status(404).json({ error: 'Subscription not found' });
        return;
      }

      res.json({
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        productKey: subscription.productKey,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        trialStart: subscription.trialStart,
        trialEnd: subscription.trialEnd,
        user: {
          id: subscription.userId,
          email: (subscription as any).user?.email
        }
      });
    } catch (error) {
      console.error('Error fetching subscription by product key:', error);
      res.status(500).json({ error: 'Failed to fetch subscription' });
    }
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const subscription = await StripeService.getUserActiveSubscription(parseInt(userId));

      if (!subscription) {
        res.status(404).json({ error: 'No active subscription found' });
        return;
      }

      await StripeService.cancelSubscription(subscription.stripeSubscriptionId);

      res.json({ message: 'Subscription canceled successfully' });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  },

  /**
   * Create billing portal session
   */
  async createBillingPortalSession(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { returnUrl } = req.body;

      const subscription = await StripeService.getUserActiveSubscription(parseInt(userId));

      if (!subscription) {
        res.status(404).json({ error: 'No active subscription found' });
        return;
      }

      const session = await StripeService.createBillingPortalSession(
        subscription.stripeCustomerId,
        returnUrl || process.env.FRONTEND_URL || 'http://localhost:3000'
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error('Error creating billing portal session:', error);
      res.status(500).json({ error: 'Failed to create billing portal session' });
    }
  },

  /**
   * Change subscription plan
   */
  async changeSubscriptionPlan(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { newPlan } = req.body;

      if (!Object.values(SubscriptionPlan).includes(newPlan)) {
        res.status(400).json({ error: 'Invalid subscription plan' });
        return;
      }

      const subscription = await StripeService.getUserActiveSubscription(parseInt(userId));

      if (!subscription) {
        res.status(404).json({ error: 'No active subscription found' });
        return;
      }

      const updatedStripeSubscription = await StripeService.changeSubscriptionPlan(
        subscription.stripeSubscriptionId,
        newPlan
      );

      await StripeService.updateSubscriptionRecord(updatedStripeSubscription);

      res.json({ message: 'Subscription plan updated successfully' });
    } catch (error) {
      console.error('Error changing subscription plan:', error);
      res.status(500).json({ error: 'Failed to change subscription plan' });
    }
  },

  /**
   * Check product key expiration
   */
  async checkProductKeyExpiration(req: Request, res: Response): Promise<void> {
    try {
      const { productKey } = req.params;

      const expirationCheck = await ProductKeyService.checkExpirationWarning(productKey);

      res.json({
        willExpireSoon: expirationCheck.willExpireSoon,
        daysUntilExpiration: expirationCheck.daysUntilExpiration,
        expiresAt: expirationCheck.expiresAt
      });
    } catch (error) {
      console.error('Error checking product key expiration:', error);
      res.status(500).json({ error: 'Failed to check expiration' });
    }
  },

  /**
   * Handle Stripe webhooks
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['stripe-signature'] as string;

      if (!signature) {
        res.status(400).json({ error: 'Missing stripe-signature header' });
        return;
      }

      await StripeWebhookHandler.handleWebhook(req.body, signature);

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).json({ error: 'Webhook processing failed' });
    }
  },

  /**
   * Get all user subscriptions (including inactive ones)
   */
  async getAllUserSubscriptions(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const subscriptions = await SubscriptionModel.findAll({
        where: { userId: parseInt(userId) },
        order: [['createdAt', 'DESC']]
      });

      res.json(subscriptions.map(sub => ({
        id: sub.id,
        plan: sub.plan,
        status: sub.status,
        productKey: sub.productKey,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        trialStart: sub.trialStart,
        trialEnd: sub.trialEnd,
        canceledAt: sub.canceledAt,
        createdAt: sub.createdAt
      })));
    } catch (error) {
      console.error('Error fetching user subscriptions:', error);
      res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
  },

  async updatePluginDownloadCount(req: Request, res: Response): Promise<void> {
    try {
      const { productKey} = req.body;

      if (!productKey) {
        res.status(400).json({ error: 'Product key and count are required' });
        return;
      }

      const subscription = await ProductKeyService.getSubscriptionByProductKey(productKey);

      if (!subscription) {
        res.status(404).json({ error: 'Subscription not found' });
        return;
      }

      subscription.pluginDownloadCount = (subscription.pluginDownloadCount || 0) + 1;
      await subscription.save();

      res.json({ message: 'Plugin download count updated successfully', count: subscription.pluginDownloadCount });
    } catch (error) {
      console.error('Error updating plugin download count:', error);
      res.status(500).json({ error: 'Failed to update plugin download count' });
    }
  }
}

export default subscriptionController;