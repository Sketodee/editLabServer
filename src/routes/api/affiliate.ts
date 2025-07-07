import express from 'express';
import { affiliateController } from '../../controllers/affiliateController';
import verifyRoles from '../../middleware/verifyRoles';
import { UserType } from '../../types/appScopeTypes';
import { requireAffiliate, trackReferral } from '../../middleware/referralTracking';
const router = express.Router()

router.route('/track')
  .get(affiliateController.trackReferralRedirect);

router.use(trackReferral);

router.route('/apply')
  .post(affiliateController.applyAffiliate);

router.route('/verify')
  .get(affiliateController.verifyAffilliateStatus);

router.route('/admin/update/:affiliateId')
  .post(verifyRoles(UserType.ADMIN), affiliateController.updateAffiliateStatus);

router.use(requireAffiliate)

router.route('/dashboard')
  .get(affiliateController.getDashboard);

router.route('/report')
  .get(affiliateController.getPerformanceReport)


router.route('/admin/conversion')
  .post(verifyRoles(UserType.ADMIN), affiliateController.processConversion)

export default router