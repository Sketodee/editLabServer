// services/StripeWebhookHandler.ts
import { stripe, STRIPE_CONFIG } from '../config/stripe-config';
import { SubscriptionModel, SubscriptionStatus } from '../model/Subscription';
import Stripe from 'stripe';
import { StripeService } from './stripeService';

export class StripeWebhookHandler {
  /**
   * Handle Stripe webhook events
   */
  static async handleWebhook(body: Buffer, signature: string): Promise<void> {
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_CONFIG.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      throw new Error('Webhook signature verification failed');
    }

    console.log('Received webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.trial_will_end':
        await this.handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }
  }

  /**
   * Handle checkout session completed
   */
  private static async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    if (session.mode === 'subscription' && session.subscription) {
      const userId = parseInt(session.metadata?.userId || '0');
      if (userId) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        // console.log('Subscription created:', subscription);
        // await StripeService.createSubscriptionRecord(subscription, userId);
        console.log('Subscription created for user:', userId);
      }
    }
  }

  /**
   * Handle subscription created
   */
  private static async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    const userId = parseInt(subscription.metadata?.userId || '0');
    // console.log('Subscription current period start:', subscription.items.data[0].current_period_end);
    if (userId) {
      await StripeService.createSubscriptionRecord(subscription, userId);
      console.log('Subscription record created:', subscription.id);
    }
  }

  /**
   * Handle subscription updated
   */
  private static async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    await StripeService.updateSubscriptionRecord(subscription);
    console.log('Subscription updated:', subscription.id);
  }

  /**
   * Handle subscription deleted/canceled
   */
  private static async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const subscriptionRecord = await SubscriptionModel.findOne({
      where: { stripeSubscriptionId: subscription.id }
    });

    if (subscriptionRecord) {
      await subscriptionRecord.update({
        status: SubscriptionStatus.CANCELED,
        canceledAt: new Date()
      });
      console.log('Subscription canceled:', subscription.id);
    }
  }

  /**
   * Handle successful payment
   */
  private static async handleInvoicePaymentSucceeded(invoice: any): Promise<void> {
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
      console.log(subscription)
      await StripeService.updateSubscriptionRecord(subscription);
      console.log('Payment succeeded for subscription:', subscription.id);
    }
  }

  /**
   * Handle failed payment
   */
  private static async handleInvoicePaymentFailed(invoice: any): Promise<void> {
    if (invoice.subscription) {
      const subscriptionRecord = await SubscriptionModel.findOne({
        where: { stripeSubscriptionId: invoice.subscription as string }
      });

      if (subscriptionRecord) {
        await subscriptionRecord.update({
          status: SubscriptionStatus.PAST_DUE
        });
        console.log('Payment failed for subscription:', invoice.subscription);
        
        // Here you could send notification emails to the user
        // await EmailService.sendPaymentFailedNotification(subscriptionRecord.userId);
      }
    }
  }

  /**
   * Handle trial ending soon
   */
  private static async handleTrialWillEnd(subscription: Stripe.Subscription): Promise<void> {
    const subscriptionRecord = await SubscriptionModel.findOne({
      where: { stripeSubscriptionId: subscription.id },
      include: ['user']
    });

    if (subscriptionRecord) {
      console.log('Trial ending soon for subscription:', subscription.id);
      
      // Here you could send trial ending notification
      // await EmailService.sendTrialEndingNotification(subscriptionRecord.userId);
    }
  }
}