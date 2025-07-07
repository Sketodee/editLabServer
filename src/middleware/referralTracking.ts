import { Request, Response, NextFunction } from "express";
import { extractReferralCode } from "../utils/referrralUtils";
import AffiliateModel, { AffiliateStatus } from "../model/Affiliate";

interface CustomRequest extends Request {
    referralInfo?: {
        affiliateId: number;
        referralCode: string;
        source?: string;
        ipAddress?: string;
        userAgent?: string;
    },
    email?: string;
    id?: string;
    userType?: number;
}

export const trackReferral = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const referralCode = extractReferralCode(req);
    
    if (referralCode && !req.id) {
      // Store referral code in cookie for later use
      res.cookie('referralCode', referralCode, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      
      // Verify the referral code is valid and active
      const affiliate = await AffiliateModel.findOne({
        where: { 
          referralCode: referralCode,
          status: AffiliateStatus.APPROVED
        }
      });
      
      if (affiliate) {
        req.referralInfo = {
          affiliateId: affiliate.id!,
          referralCode: referralCode,
          source: req.headers.referer,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        };
        
        console.log('Valid referral tracked:', {
          code: referralCode,
          affiliateId: affiliate.id,
          ip: req.ip
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Referral tracking error:', error);
    next(); // Continue even if tracking fails
  }
}

export const requireAffiliate = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.id) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const affiliate = await AffiliateModel.findOne({
      where: { userId: req.id }
    });

    if (!affiliate) {
      res.status(403).json({
        success: false,
        message: 'Affiliate account required'
      });
      return;
    }

    // if (affiliate.status !== AffiliateStatus.APPROVED) {
    //   res.status(403).json({
    //     success: false,
    //     message: 'Affiliate account must be approved'
    //   });
    //   return;
    // }

    // Add affiliate to request
    (req as any).affiliate = affiliate;
    next();
  } catch (error) {
    console.error('Affiliate middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};