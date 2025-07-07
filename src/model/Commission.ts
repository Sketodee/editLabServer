import { DataTypes, Model } from "sequelize";
import db from "../config/database-config";
import { AffiliateModel } from "./Affiliate";
import { ReferralModel } from "./Referral";

export enum CommissionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  PAID = 'paid',
  CANCELLED = 'cancelled'
}

export interface CommissionModelAttributes {
  id?: number;
  affiliateId: number;
  referralId: number;
  amount: number;
  status: CommissionStatus;
  paidAt?: Date;
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CommissionModel extends Model<CommissionModelAttributes> implements CommissionModelAttributes {
  public id?: number;
  public affiliateId!: number;
  public referralId!: number;
  public amount!: number;
  public status!: CommissionStatus;
  public paidAt?: Date;
  public paymentMethod?: string;
  public transactionId?: string;
  public notes?: string;
  public createdAt?: Date;
  public updatedAt?: Date;

  // Associations
  public Affiliate?: AffiliateModel;
  public Referral?: ReferralModel;
}

CommissionModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    affiliateId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'affiliates',
        key: 'id'
      }
    },
    referralId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'referrals',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    status: {
      type: DataTypes.ENUM(...Object.values(CommissionStatus)),
      allowNull: false,
      defaultValue: CommissionStatus.PENDING
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    tableName: "commissions",
    sequelize: db,
    timestamps: true,
    indexes: [
      {
        fields: ['affiliateId']
      },
      {
        fields: ['referralId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['paidAt']
      }
    ]
  }
);

// Define associations
CommissionModel.belongsTo(AffiliateModel, {
  foreignKey: 'affiliateId',
  as: 'Affiliate'
});

CommissionModel.belongsTo(ReferralModel, {
  foreignKey: 'referralId',
  as: 'Referral'
});

AffiliateModel.hasMany(CommissionModel, {
  foreignKey: 'affiliateId',
  as: 'Commissions'
});

ReferralModel.hasOne(CommissionModel, {
  foreignKey: 'referralId',
  as: 'Commission'
});

export default CommissionModel;