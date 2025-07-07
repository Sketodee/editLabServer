// models/SubscriptionModel.ts
import { DataTypes, Model } from "sequelize";
import db from "../config/database-config";
import { UserModel } from "./User";
import { SubscriptionPlan } from "../types/appScopeTypes";

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  UNPAID = 'unpaid',
  TRIALING = 'trialing',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired'
}

export interface SubscriptionModelAttributes {
  id?: number;
  userId: number;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
  productKey: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  trialStart?: Date | null;
  trialEnd?: Date | null;
  canceledAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class SubscriptionModel extends Model<SubscriptionModelAttributes> implements SubscriptionModelAttributes {
  public id?: number;
  public userId!: number;
  public stripeCustomerId!: string;
  public stripeSubscriptionId!: string;
  public stripePriceId!: string;
  public status!: SubscriptionStatus;
  public plan!: SubscriptionPlan;
  public productKey!: string;
  public currentPeriodStart!: Date | null;
  public currentPeriodEnd!: Date | null;
  public trialStart?: Date | null;
  public trialEnd?: Date | null;
  public canceledAt?: Date | null;
  public createdAt?: Date;
  public updatedAt?: Date;
}

SubscriptionModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: UserModel,
        key: 'id'
      }
    },
    stripeCustomerId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    stripeSubscriptionId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    stripePriceId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(SubscriptionStatus)),
      allowNull: false,
    },
    plan: {
      type: DataTypes.ENUM(...Object.values(SubscriptionPlan)),
      allowNull: false,
    },
    productKey: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    currentPeriodStart: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    currentPeriodEnd: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    trialStart: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    trialEnd: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    canceledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "subscriptions",
    sequelize: db,
    timestamps: true,
  }
);

// Define associations
SubscriptionModel.belongsTo(UserModel, { foreignKey: 'userId', as: 'user' });
UserModel.hasMany(SubscriptionModel, { foreignKey: 'userId', as: 'subscriptions' });