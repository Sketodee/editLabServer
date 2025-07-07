import { DataTypes, Model } from "sequelize";
import db from "../config/database-config";
import { UserModel } from "./User";

export enum AffiliateStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected'
}

export enum PaymentMethod {
  PAYPAL = 'paypal',
  BANK = 'bank',
  STRIPE = 'stripe'
}

export interface AffiliateModelAttributes {
  id?: number;
  userId: number;
  referralCode: string;
  status: AffiliateStatus;
  commissionRate: number;
  totalEarnings: number;
  totalReferrals: number;
  appliedAt?: Date;
  approvedAt?: Date;
  approvedBy?: number;
  paymentMethod?: PaymentMethod;
  paymentDetails?: any; // JSON field for payment details
  createdAt?: Date;
  updatedAt?: Date;
}

export class AffiliateModel extends Model<AffiliateModelAttributes> implements AffiliateModelAttributes {
  public id?: number;
  public userId!: number;
  public referralCode!: string;
  public status!: AffiliateStatus;
  public commissionRate!: number;
  public totalEarnings!: number;
  public totalReferrals!: number;
  public appliedAt?: Date;
  public approvedAt?: Date;
  public approvedBy?: number;
  public paymentMethod?: PaymentMethod;
  public paymentDetails?: any;
  public createdAt?: Date;
  public updatedAt?: Date;

  // Associations
  public User?: UserModel;
  public ApprovedByUser?: UserModel;
}

AffiliateModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    referralCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        isUppercase: true,
        len: [6, 20]
      }
    },
    status: {
      type: DataTypes.ENUM(...Object.values(AffiliateStatus)),
      allowNull: false,
      defaultValue: AffiliateStatus.PENDING
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 4), // e.g., 0.1000 for 10%
      allowNull: false,
      defaultValue: 0.10,
      validate: {
        min: 0,
        max: 1
      }
    },
    totalEarnings: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    totalReferrals: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    appliedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    paymentMethod: {
      type: DataTypes.ENUM(...Object.values(PaymentMethod)),
      allowNull: true
    },
    paymentDetails: {
      type: DataTypes.JSONB, // PostgreSQL JSON field
      allowNull: true
    }
  },
  {
    tableName: "affiliates",
    sequelize: db,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['referralCode']
      },
      {
        unique: true,
        fields: ['userId']
      },
      {
        fields: ['status']
      }
    ]
  }
);

// Define associations
AffiliateModel.belongsTo(UserModel, {
  foreignKey: 'userId',
  as: 'User'
});

AffiliateModel.belongsTo(UserModel, {
  foreignKey: 'approvedBy',
  as: 'ApprovedByUser'
});

UserModel.hasOne(AffiliateModel, {
  foreignKey: 'userId',
  as: 'Affiliate'
});

export default AffiliateModel;