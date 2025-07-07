import { DataTypes, Model } from "sequelize";
import db from "../config/database-config";
import { UserModel } from "./User";
import { AffiliateModel } from "./Affiliate";

export enum ReferralStatus {
  PENDING = 'pending',
  CONVERTED = 'converted',
  CANCELLED = 'cancelled'
}

export interface ReferralModelAttributes {
  id?: number;
  affiliateId: number;
  referredUserId: number;
  referralCode: string;
  status: ReferralStatus;
  conversionValue: number;
  commission: number;
  conversionDate?: Date;
  source?: string;
  campaign?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ReferralModel extends Model<ReferralModelAttributes> implements ReferralModelAttributes {
  public id?: number;
  public affiliateId!: number;
  public referredUserId!: number;
  public referralCode!: string;
  public status!: ReferralStatus;
  public conversionValue!: number;
  public commission!: number;
  public conversionDate?: Date;
  public source?: string;
  public campaign?: string;
  public ipAddress?: string;
  public userAgent?: string;
  public createdAt?: Date;
  public updatedAt?: Date;

  // Associations
  public Affiliate?: AffiliateModel;
  public ReferredUser?: UserModel;
}

ReferralModel.init(
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
    referredUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    referralCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isUppercase: true
      }
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ReferralStatus)),
      allowNull: false,
      defaultValue: ReferralStatus.PENDING
    },
    conversionValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    commission: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    conversionDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    source: {
      type: DataTypes.STRING,
      allowNull: true
    },
    campaign: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ipAddress: {
      type: DataTypes.INET, // PostgreSQL INET type for IP addresses
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    tableName: "referrals",
    sequelize: db,
    timestamps: true,
    indexes: [
      {
        fields: ['affiliateId']
      },
      {
        fields: ['referredUserId']
      },
      {
        fields: ['referralCode']
      },
      {
        fields: ['status']
      },
      {
        fields: ['conversionDate']
      }
    ]
  }
);

// Define associations
ReferralModel.belongsTo(AffiliateModel, {
  foreignKey: 'affiliateId',
  as: 'Affiliate'
});

ReferralModel.belongsTo(UserModel, {
  foreignKey: 'referredUserId',
  as: 'ReferredUser'
});

AffiliateModel.hasMany(ReferralModel, {
  foreignKey: 'affiliateId',
  as: 'Referrals'
});

UserModel.hasMany(ReferralModel, {
  foreignKey: 'referredUserId',
  as: 'Referrals'
});

export default ReferralModel;