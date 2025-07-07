import { SubscriptionPlan } from "../types/appScopeTypes";
import { stripe, STRIPE_CONFIG } from "../config/stripe-config";
import Stripe from "stripe";
import { UserModel } from "../model/User";
import { SubscriptionModel, SubscriptionStatus } from "../model/Subscription";
import { ProductKeyService } from "./productKeyService";


export class StripeService {

  static async createOrGetCustomer(userId: number, email: string): Promise<Stripe.Customer> {
    // Check if user already has a subscription with customer ID
    const existingSubscription = await SubscriptionModel.findOne({
      where: { userId }
    });

    if (existingSubscription?.stripeCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(existingSubscription.stripeCustomerId);
        if (customer && !customer.deleted) {
          return customer as Stripe.Customer;
        }
      } catch (error) {
        console.error('Error retrieving existing customer:', error);
      }
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId: userId.toString()
      }
    });

    return customer;
  }


  // create a checkout session for a user to subscribe to a plan
  static async createCheckoutSession(
    userId: number,
    plan: SubscriptionPlan,
    successUrl?: string,
    cancelUrl?: string
  ): Promise<Stripe.Checkout.Session> {
    const user = await UserModel.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const customer = await this.createOrGetCustomer(userId, user.email);
    const priceId = plan === SubscriptionPlan.MONTHLY
      ? STRIPE_CONFIG.MONTHLY_SUBSCRIPTION_PRICE_ID
      : STRIPE_CONFIG.YEARLY_SUBSCRIPTION_PRICE_ID;

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        // trial_period_days: STRIPE_CONFIG.TRIAL_PERIOD_DAYS,
        metadata: {
          userId: userId.toString(),
          plan
        }
      },
      success_url: successUrl || STRIPE_CONFIG.SUCCESS_URL,
      cancel_url: cancelUrl || STRIPE_CONFIG.CANCEL_URL,
      metadata: {
        userId: userId.toString(),
        plan
      }
    });
    return session;
  }

  //create subscription record 
  static async createSubscriptionRecord(
    stripeSubscription: any,
    userId: number
  ): Promise<SubscriptionModel> {
    const plan = stripeSubscription.metadata.plan as SubscriptionPlan;
    const productKey = ProductKeyService.generateProductKey();

    const subscriptionData = {
      userId,
      stripeCustomerId: stripeSubscription.customer as string,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: stripeSubscription.items.data[0].price.id,
      status: stripeSubscription.status as SubscriptionStatus,
      plan,
      productKey,
      currentPeriodStart: stripeSubscription.items.data[0].current_period_start && stripeSubscription.items.data[0].current_period_start > 0
        ? new Date(stripeSubscription.items.data[0].current_period_start * 1000)
        : null,

      currentPeriodEnd: stripeSubscription.items.data[0].current_period_end && stripeSubscription.items.data[0].current_period_end > 0
        ? new Date(stripeSubscription.items.data[0].current_period_end * 1000)
        : null,

      trialStart: stripeSubscription.trial_start && stripeSubscription.trial_start > 0
        ? new Date(stripeSubscription.trial_start * 1000)
        : null,
      trialEnd: stripeSubscription.trial_end && stripeSubscription.trial_end > 0
        ? new Date(stripeSubscription.trial_end * 1000)
        : null,
    };

    // Check if subscription already exists
    const existingSubscription = await SubscriptionModel.findOne({
      where: { stripeSubscriptionId: stripeSubscription.id }
    });

    if (existingSubscription) {
      await existingSubscription.update(subscriptionData);
      return existingSubscription;
    }

    return await SubscriptionModel.create(subscriptionData);
  }


  static async updateSubscriptionRecord(
    stripeSubscription: any
  ): Promise<SubscriptionModel | null> {
    const subscription = await SubscriptionModel.findOne({
      where: { stripeSubscriptionId: stripeSubscription.id }
    });

    if (!subscription) {
      console.error('Subscription not found for update:', stripeSubscription.id);
      return null;
    }

    const updateData = {
      status: stripeSubscription.status as SubscriptionStatus,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      canceledAt: stripeSubscription.canceled_at
        ? new Date(stripeSubscription.canceled_at * 1000)
        : null,
    };

    await subscription.update(updateData);
    return subscription;
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(subscriptionId: string): Promise<void> {
    await stripe.subscriptions.cancel(subscriptionId);
  }

  /**
   * Create billing portal session
   */
  static async createBillingPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  /**
   * Get user's active subscription
   */
  static async getUserActiveSubscription(userId: number): Promise<SubscriptionModel | null> {
    return await SubscriptionModel.findOne({
      where: {
        userId,
        status: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING]
      },
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Change subscription plan
   */
  static async changeSubscriptionPlan(
    subscriptionId: string,
    newPlan: SubscriptionPlan
  ): Promise<Stripe.Subscription> {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const newPriceId = newPlan === SubscriptionPlan.MONTHLY
      ? STRIPE_CONFIG.MONTHLY_SUBSCRIPTION_PRICE_ID
      : STRIPE_CONFIG.YEARLY_SUBSCRIPTION_PRICE_ID;

    return await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      metadata: {
        ...subscription.metadata,
        plan: newPlan
      }
    });
  }
}