import { Request, Response } from "express";
import { validateUserData } from "../config/validators";
import { ApiResponse } from "../types/appScopeTypes";
import { UserModel } from "../model/User";
import { Op } from "sequelize";
import { extractReferralCode } from "../utils/referrralUtils";
import { AffiliateService } from "../services/affiliateService";
import AffiliateModel, { AffiliateStatus } from "../model/Affiliate";

const userController = {
  async createUser(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const {
        email,
        userType,
        provider,
        providerId,
        referralCode: rawReferralCode, // raw from body
      } = req.body;

      console.log(email)

      const errors = validateUserData({ email, userType, provider });

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: errors.join(', '),
          data: null,
        });
        return;
      }

      const existingUser = await UserModel.findOne({
        where: {
          email: {
            [Op.iLike]: email,
          },
        },
      });

      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'User already exists',
          error: 'Email already in use',
          data: null,
        });
        return;
      }

      // Use referralCode from body or fallback to extracted one
      const referralCode = rawReferralCode ?? extractReferralCode(req);

      if (referralCode) {
        //check if referral code is valid
        const affiliate = await AffiliateModel.findOne({
          where: {
            referralCode: referralCode,
            status: AffiliateStatus.APPROVED
          },
        });
        if (!affiliate) {
          res.status(400).json({
            success: false,
            message: 'Invalid or inactive referral code',
            error: 'Referral code not found or inactive',
            data: null,
          });
          return;
        }
      }

      const user = await UserModel.create({
        email,
        userType,
        provider,
        providerId
      });

      //compute the referral commisson 
      if(user) {
        const result = await AffiliateService.processReferralConversion({
          userId: user.id!,                    // The new user who just registered
          referralCode: referralCode,         // "ABC123XYZ"
          conversionValue: 10,               // $10 value for new signup (you set this)
          source: req.headers.referer,        // Where they came from
          ipAddress: req.ip,                  // For fraud detection
          userAgent: req.headers['user-agent'] // For analytics
        });
        if(result) {
           // Clear the cookie so it doesn't get used again
          res.clearCookie('referralCode');
        }
      }

      res.status(200).json({
        success: true,
        message: 'User created successfully',
        error: null,
        data: null,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
        data: null,
      });
    }
  },


};


export default userController;