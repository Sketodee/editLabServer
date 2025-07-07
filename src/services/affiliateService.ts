
import { Op } from "sequelize";
import db from "../config/database-config";
import AffiliateModel, { AffiliateStatus, PaymentMethod } from "../model/Affiliate";
import CommissionModel, { CommissionStatus } from "../model/Commission";
import ReferralModel, { ReferralStatus } from "../model/Referral";
import { UserModel } from "../model/User";
import { AffiliateStats, ReferralConversionData } from "../types/appScopeTypes";
import { generateUniqueReferralCode } from "../utils/referrralUtils";

export class AffiliateService {
    static async createAffiliate(userId: number, paymentMethod: PaymentMethod, paymentDetails: any ): Promise<AffiliateModel> {
        try {
            const existingAffiliate = await AffiliateModel.findOne({
                where: { userId },
            });

            if (existingAffiliate) {
                throw new Error("Affiliate account already exists for this user");
            }

            //generate unique referral code
            const referralCode = await generateUniqueReferralCode(userId);
            const affiliate = await AffiliateModel.create({
                userId,
                referralCode,
                status: AffiliateStatus.PENDING,
                commissionRate: 0.10, // 10% default
                totalEarnings: 0,
                totalReferrals: 0,
                paymentMethod,
                paymentDetails,
                appliedAt: new Date()
            })
            return affiliate;
        } catch (error) {
            throw error
        }
    }

    static async processReferralConversion(data: ReferralConversionData): Promise<{ referral: ReferralModel; commission: CommissionModel } | null> {
        try {
            const affiliate = await AffiliateModel.findOne({
                where: {
                    referralCode: data.referralCode,
                    status: AffiliateStatus.APPROVED
                },
            });

            if (!affiliate) {
                console.log('Invalid or inactive affiliate code:', data.referralCode);
                return null;
            }

            // Check if this user was already referred
            const existingReferral = await ReferralModel.findOne({
                where: {
                    affiliateId: affiliate.id!,
                    referredUserId: data.userId
                }
            });

            if (existingReferral) {
                console.log('User already referred by this affiliate');
                return null;
            }

            // Calculate commission
            const commissionAmount = data.conversionValue * affiliate.commissionRate;

            // Create referral record
            const referral = await ReferralModel.create({
                affiliateId: affiliate.id!,
                referredUserId: data.userId,
                referralCode: data.referralCode,
                status: ReferralStatus.CONVERTED,
                conversionValue: data.conversionValue,
                commission: commissionAmount,
                conversionDate: new Date(),
                source: data.source,
                campaign: data.campaign,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent
            });

            // Create commission record
            const commission = await CommissionModel.create({
                affiliateId: affiliate.id!,
                referralId: referral.id!,
                amount: commissionAmount,
                status: CommissionStatus.PENDING
            });

            // Update affiliate totals
            await AffiliateModel.update({
                totalReferrals: affiliate.totalReferrals + 1,
                totalEarnings: parseFloat(affiliate.totalEarnings.toString()) + parseFloat(commissionAmount.toString())
            }, {
                where: { id: affiliate.id },
            });


            console.log('Referral processed successfully:', {
                referralId: referral.id,
                commission: commissionAmount
            });

            return { referral, commission };

        } catch (error) {
            console.error('Error processing referral:', error);
            throw error;
        }
    }

    static async getAffiliateDashboard(userId: number): Promise<{
        affiliate: AffiliateModel;
        stats: AffiliateStats;
        recentReferrals: ReferralModel[];
        recentCommissions: CommissionModel[];
    }> {
        const affiliate = await AffiliateModel.findOne({
            where: { userId },
            include: [
                {
                    model: UserModel,
                    as: 'User',
                    attributes: ['id', 'email']
                }
            ]
        });

        if (!affiliate) {
            throw new Error('Affiliate account not found');
        }

        // Get referral stats
        const referralStats = await ReferralModel.findAll({
            where: { affiliateId: affiliate.id },
            attributes: [
                'status',
                [db.fn('COUNT', db.col('id')), 'count'],
                [db.fn('SUM', db.col('conversionValue')), 'totalValue']
            ],
            group: ['status'],
            raw: true
        });

        // Get commission stats
        const commissionStats = await CommissionModel.findAll({
            where: { affiliateId: affiliate.id },
            attributes: [
                'status',
                [db.fn('SUM', db.col('amount')), 'totalAmount']
            ],
            group: ['status'],
            raw: true
        });

        // Get recent referrals
        const recentReferrals = await ReferralModel.findAll({
            where: { affiliateId: affiliate.id },
            include: [
                {
                    model: UserModel,
                    as: 'ReferredUser',
                    attributes: ['id', 'email']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: 10
        });

        // Get recent commissions
        const recentCommissions = await CommissionModel.findAll({
            where: { affiliateId: affiliate.id },
            order: [['createdAt', 'DESC']],
            limit: 20
        });

        // Calculate stats
        const stats = this.calculateAffiliateStats(referralStats, commissionStats, affiliate);

        return {
            affiliate,
            stats,
            recentReferrals,
            recentCommissions
        };
    }

    static async getPerformanceReport(userId: number, startDate?: Date, endDate?: Date): Promise<{
    dailyStats: any[];
    summary: AffiliateStats;
  }> {
    const affiliate = await AffiliateModel.findOne({
      where: { userId }
    });
    
    if (!affiliate) {
      throw new Error('Affiliate account not found');
    }
    
    const dateFilter: any = { affiliateId: affiliate.id };
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt[Op.gte] = startDate;
      if (endDate) dateFilter.createdAt[Op.lte] = endDate;
    }
    
    // Get daily stats
    const dailyStats = await ReferralModel.findAll({
      where: dateFilter,
      attributes: [
        [db.fn('DATE', db.col('createdAt')), 'date'],
        [db.fn('COUNT', db.col('id')), 'referrals'],
        [db.fn('SUM', db.literal("CASE WHEN status = 'converted' THEN 1 ELSE 0 END")), 'conversions'],
        [db.fn('SUM', db.col('conversionValue')), 'revenue'],
        [db.fn('SUM', db.col('commission')), 'commission']
      ],
      group: [db.fn('DATE', db.col('createdAt'))],
      order: [[db.fn('DATE', db.col('createdAt')), 'ASC']],
      raw: true
    });
    
    // Get summary stats
    const referralStats = await ReferralModel.findAll({
      where: { affiliateId: affiliate.id },
      attributes: [
        'status',
        [db.fn('COUNT', db.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });
    
    const commissionStats = await CommissionModel.findAll({
      where: { affiliateId: affiliate.id },
      attributes: [
        'status',
        [db.fn('SUM', db.col('amount')), 'totalAmount']
      ],
      group: ['status'],
      raw: true
    });
    
    const summary = this.calculateAffiliateStats(referralStats, commissionStats, affiliate);
    
    return {
      dailyStats,
      summary
    };
  }
  
  /**
   * Update affiliate status (admin function)
   */
  static async updateAffiliateStatus(
    affiliateId: number, 
    status: AffiliateStatus, 
    approvedById?: number,
    commissionRate?: number
  ): Promise<AffiliateModel> {
    const affiliate = await AffiliateModel.findByPk(affiliateId);
    
    if (!affiliate) {
      throw new Error('Affiliate not found');
    }
    
    const updateData: any = { status };
    
    if (commissionRate !== undefined) {
      updateData.commissionRate = commissionRate;
    }
    
    if (status === AffiliateStatus.APPROVED) {
      updateData.approvedAt = new Date();
      if (approvedById) {
        updateData.approvedBy = approvedById;
      }
    }
    
    await affiliate.update(updateData);
    
    return affiliate;
  }
  
  /**
   * Calculate affiliate statistics
   */
  private static calculateAffiliateStats(
    referralStats: any[], 
    commissionStats: any[], 
    affiliate: AffiliateModel
  ): AffiliateStats {
    const referralBreakdown = {
      pending: 0,
      converted: 0,
      cancelled: 0
    };
    
    let totalReferrals = 0;
    referralStats.forEach((stat: any) => {
      const count = parseInt(stat.count);
      totalReferrals += count;
      
      if (stat.status === 'pending') referralBreakdown.pending = count;
      else if (stat.status === 'converted') referralBreakdown.converted = count;
      else if (stat.status === 'cancelled') referralBreakdown.cancelled = count;
    });
    
    let pendingCommissions = 0;
    let paidCommissions = 0;
    
    commissionStats.forEach((stat: any) => {
      const amount = parseFloat(stat.totalAmount || 0);
      if (stat.status === 'pending' || stat.status === 'approved') {
        pendingCommissions += amount;
      } else if (stat.status === 'paid') {
        paidCommissions += amount;
      }
    });
    
    const conversionRate = totalReferrals > 0 ? (referralBreakdown.converted / totalReferrals) * 100 : 0;
    
    return {
      totalReferrals: affiliate.totalReferrals,
      totalEarnings: parseFloat(affiliate.totalEarnings.toString()),
      pendingCommissions,
      paidCommissions,
      conversionRate,
      referralBreakdown
    };
  }
}