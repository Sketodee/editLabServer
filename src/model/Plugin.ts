import { DataTypes, Model } from "sequelize";
import db from "../config/database-config";

// Define the TypeScript interface
export interface PluginModelAttributes {
  id?: number;
  name: string;
  description: string;
  iconUrl: string; 
  imageUrl: string;
  subDescriptions: Array<{ title: string; description: string }>;
  windowsFile: string;
  macOsFile: string;
  createdAt?: string;
  updatedAt?: string;
}

// Extend the Sequelize Model
export class PluginModel extends Model<PluginModelAttributes> implements PluginModelAttributes {
  public id?: number;
  public name!: string;
  public description!: string;
  public iconUrl!: string;
  public imageUrl!: string;
  public subDescriptions!: Array<{ title: string; description: string }>;
  public windowsFile!: string;
  public macOsFile!: string;
  public createdAt?: string;
  public updatedAt?: string;
}

// Initialize the model
PluginModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    iconUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subDescriptions: {
      type: DataTypes.JSONB, // PostgreSQL (or DataTypes.JSON for general)
      allowNull: false,
      defaultValue: [],
    },
    windowsFile: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    macOsFile: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "plugins",
    sequelize: db,
    timestamps: true,
  }
);
