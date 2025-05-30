import { DataTypes, Model } from "sequelize";
import db from "../config/database-config";
import { AllowedProviders, UserType } from "../types/appScopeTypes";

export interface UserModelAttributes {
  id?: number;
  email: string;
  provider: AllowedProviders; // Optional field for OAuth provider
  providerId?: string; // Optional field for OAuth provider ID
  createdAt?: string;
  updatedAt?: string;
  userType: UserType;
  otp?: string; 
  refreshToken?: string; // Optional field for refresh token
}

export class UserModel extends Model<UserModelAttributes> implements UserModelAttributes {
  public id?: number;
  public email!: string;
  public provider!: AllowedProviders; // Optional field for OAuth provider
  public providerId?: string; // Optional field for OAuth provider ID
  public createdAt?: string;
  public updatedAt?: string;
  public userType!: UserType;
  public otp?: string;
  public refreshToken?: string; // Optional field for refresh token
}

UserModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userType: {
      type: DataTypes.INTEGER,
      defaultValue: UserType.USER,
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
     refreshToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
     provider: {
      type: DataTypes.STRING,
      allowNull: false,
    },
     providerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "users",
    sequelize: db,
    timestamps: true,
  }
);
