import Stripe from 'stripe';

if(!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Stripe secret key is not defined in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil', // Use the latest stable version
});

export const STRIPE_CONFIG = {
    MONTHLY_SUBSCRIPTION_PRICE_ID: process.env.MONTHLY_SUBSCRIPTION_PRICE_ID || '',
    YEARLY_SUBSCRIPTION_PRICE_ID: process.env.YEARLY_SUBSCRIPTION_PRICE_ID || '',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
    TRIAL_PERIOD_DAYS: parseInt(process.env.TRIAL_PERIOD_DAYS || '14', 10), // Default to 14 days if not set

    SUCCESS_URL: 'http://localhost:8080/success?session_id={CHECKOUT_SESSION_ID}',
    CANCEL_URL:  'http://localhost:8080/cancel',
}

