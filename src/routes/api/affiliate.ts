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


router.route('/admin/getpendingaffiliatecount')
  .get(verifyRoles(UserType.ADMIN), affiliateController.getPendingCount);

  router.route('/admin/getallaffiliates')
  .get(verifyRoles(UserType.ADMIN), affiliateController.getAllAffiliates);

  router.route('/admin/getaffiliatestats')
  .get(verifyRoles(UserType.ADMIN), affiliateController.getAffiliateStats);

  router.route('/admin/bulkupdatestatus')
  .post(verifyRoles(UserType.ADMIN), affiliateController.bulkUpdateStatus);


router.use(requireAffiliate)

router.route('/dashboard')
  .get(affiliateController.getDashboard);

router.route('/report')
  .get(affiliateController.getPerformanceReport)


router.route('/admin/conversion')
  .post(verifyRoles(UserType.ADMIN), affiliateController.processConversion)

export default router