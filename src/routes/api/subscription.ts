import express from 'express';
import subscriptionController from '../../controllers/subscriptionController';
const router = express.Router();
const rawBodyMiddleware = express.raw({ type: 'application/json' });


router.route('/create-checkout-session')
    .post(subscriptionController.createCheckoutSession);

    // Get user subscription
router.get('/user/:userId', subscriptionController.getUserSubscription);

// Get all user subscriptions
router.get('/user/:userId/all', subscriptionController.getAllUserSubscriptions);

// Validate product key
router.post('/validate-product-key', subscriptionController.validateProductKey);

// Get subscription by product key
router.get('/product-key/:productKey', subscriptionController.getSubscriptionByProductKey);

// Cancel subscription
router.post('/user/cancel/:userId/', subscriptionController.cancelSubscription);

// Create billing portal session
router.post('/user/:userId/billing-portal', subscriptionController.createBillingPortalSession);

// Change subscription plan
router.put('/user/:userId/change-plan', subscriptionController.changeSubscriptionPlan);

// Check product key expiration
router.get('/product-key/:productKey/expiration', subscriptionController.checkProductKeyExpiration);

// Stripe webhook endpoint (use raw body middleware)
// router.post('/webhook', rawBodyMiddleware, subscriptionController.handleWebhook);


    export default router