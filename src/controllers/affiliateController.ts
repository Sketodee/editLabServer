import { validateAffiliateApplyData, validateAffiliateUpdateData } from "../config/validators";
import AffiliateModel, { AffiliateStatus } from "../model/Affiliate";
import { AffiliateService } from "../services/affiliateService";
import { ApiResponse } from "../types/appScopeTypes";
import { Request, Response } from "express";
interface CustomRequest extends Request {
  email?: string;
  id?: string;
  userType?: number;
}


export const affiliateController = {
  async applyAffiliate(req: CustomRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      if (!req.id) {
        res.status(400).json({
          success: false,
          message: 'Authentication required',
          error: null,
          data: null,
        });
        return;
      }
      const { paymentMethod, paymentDetails } = req.body;
      const errors = validateAffiliateApplyData({
        paymentMethod, paymentDetails
      })

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: errors.join(', '),
          data: null,
        });
        return;
      }

      const affiliate = await AffiliateService.createAffiliate(
        Number(req.id),
        paymentMethod, paymentDetails
      );

      res.status(201).json({
        success: true,
        message: 'Affiliate application submitted successfully',
        data: {
          id: affiliate.id,
          referralCode: affiliate.referralCode,
          status: affiliate.status,
          appliedAt: affiliate.appliedAt
        }
      });

    } catch (error: any) {
      console.error('Apply affiliate error:', error);

      if (error.message === 'Affiliate account already exists for this user') {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create affiliate account'
      });
    }
  },

  async verifyAffilliateStatus(req: CustomRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      if (!req.id) {
        res.status(400).json({
          success: false,
          message: 'Authentication required',
          error: null,
          data: null,
        });
        return;
      }

      const existingAffiliate = await AffiliateModel.findOne({
        where: { userId: req.id },
      });
      if (!existingAffiliate) {
        res.status(404).json({
          success: false,
          message: 'Affiliate account not found',
          data: null,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Affiliate account status retrieved successfully',
        data: {
          id: existingAffiliate.id,
          referralCode: existingAffiliate.referralCode,
          status: existingAffiliate.status,
          appliedAt: existingAffiliate.appliedAt,
          approvedAt: existingAffiliate.approvedAt,
          commissionRate: existingAffiliate.commissionRate
        }
      });
    } catch (error:any) {
      console.error('Verify affiliate status error:', error);

      if (error.message === 'Affiliate account not found') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to verify affiliate status'
      });
    }
  },

  async getDashboard(req: CustomRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      if (!req.id) {
        res.status(400).json({
          success: false,
          message: 'Authentication required',
          error: null,
          data: null,
        });
        return;
      }

      const dashboardData = await AffiliateService.getAffiliateDashboard(Number(req.id));
      res.status(200).json({
        success: true,
        message: 'Affiliate dashboard data retrieved successfully',
        data: dashboardData
      });
    } catch (error: any) {
      console.error('Get dashboard error:', error);

      if (error.message === 'Affiliate account not found') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard data'
      });
    }
  },

  async getPerformanceReport(req: CustomRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      if (!req.id) {
        res.status(400).json({
          success: false,
          message: 'Authentication required',
          error: null,
          data: null,
        });
        return;
      }

      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const report = await AffiliateService.getPerformanceReport(Number(req.id), start, end);
      res.status(200).json({
        success: true,
        message: 'Performance report retrieved successfully',
        data: report
      });
    } catch (error: any) {
      console.error('Get performance report error:', error);

      if (error.message === 'Affiliate account not found') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to generate performance report'
      });
    }
  },

  async processConversion(req: CustomRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const { userId, conversionValue, referralCode, source, campaign } = req.body;

      if (!userId || !conversionValue || !referralCode) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: userId, conversionValue, referralCode'
        });
        return;
      }

      const result = await AffiliateService.processReferralConversion({
        userId,
        conversionValue,
        referralCode: referralCode.toUpperCase(),
        source,
        campaign,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      if (!result) {
        res.status(400).json({
          success: false,
          message: 'Invalid referral code or conversion already processed'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Conversion processed successfully',
        data: {
          referralId: result.referral.id,
          commissionAmount: result.commission.amount
        }
      });
    } catch (error: any) {
      console.error('Process conversion error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process conversion'
      });
    }
  },


  async updateAffiliateStatus(req: CustomRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const { affiliateId } = req.params;
      const { status, commissionRate } = req.body;

      const errors = validateAffiliateUpdateData({
        status, commissionRate
      })

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: errors.join(', '),
          data: null,
        });
        return;
      }

      const affiliate = await AffiliateService.updateAffiliateStatus(
        parseInt(affiliateId),
        status,
        Number(req.id),
        commissionRate
      );

      res.status(200).json({
        success: true,
        message: `Affiliate ${status} successfully`,
        data: {
          id: affiliate.id,
          status: affiliate.status,
          commissionRate: affiliate.commissionRate,
          approvedAt: affiliate.approvedAt
        }
      });
    } catch (error: any) {
      console.error('Update affiliate status error:', error);

      if (error.message === 'Affiliate not found') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update affiliate status'
      });
    }
  },

  /**
   * Get all affiliates (Admin only)
   */
  //   async getAllAffiliates(req: CustomRequest, res: Response<ApiResponse>): Promise<void> {
  //     try {
  //       const { page = 1, limit = 10, status } = req.query;

  //       const affiliates = await AffiliateService.getAllAffiliates(
  //         parseInt(page as string),
  //         parseInt(limit as string),
  //         status as AffiliateStatus
  //       );

  //       res.json({
  //         success: true,
  //         data: affiliates
  //       });
  //     } catch (error: any) {
  //       console.error('Get all affiliates error:', error);
  //       res.status(500).json({
  //         success: false,
  //         message: 'Failed to fetch affiliates'
  //       });
  //     }
  //   }


  async trackReferralRedirect(req: CustomRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const { ref, redirect = '/' } = req.query;

      if (ref && typeof ref === 'string') {
        const referralCode = ref.toUpperCase();

        // Set cookie for tracking
        res.cookie('referralCode', referralCode, {
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });

        // Optional: Log the referral click for analytics
        console.log('Referral click tracked:', {
          code: referralCode,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          source: req.headers.referer
        });
      }

      res.redirect(redirect as string);
    } catch (error: any) {
      console.error('Track referral redirect error:', error);
      res.redirect('/'); // Fallback redirect
    }
  }
}