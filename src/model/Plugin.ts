import { DataTypes, Model, Association, HasManyGetAssociationsMixin, HasManyAddAssociationMixin, HasManyCreateAssociationMixin } from "sequelize";
import db from "../config/database-config";
import { Platform, PluginType } from "../types/appScopeTypes";



// Updated Plugin interface
export interface PluginModelAttributes {
  id?: number;
  name: string;
  description: string;
  iconUrl: string;
  imageUrl: string;
  pluginType: PluginType;
  subDescriptions: Array<{ title: string; description: string }>;
  // windowsFile: string;
  // macOsFile: string;
  // windowsVersion: string;
  // macOsVersion: string;
  // New fields for current versions
  currentWindowsVersion: string;
  currentMacOsVersion: string;
  createdAt?: string;
  updatedAt?: string;
}

// Version interface
export interface VersionModelAttributes {
  id?: number;
  pluginId: number;
  platform: Platform;
  url: string;
  size: number; // in bytes
  version: string;
  releaseDate: string;
  createdAt?: string;
  updatedAt?: string;
}

// Updated Plugin Model
export class PluginModel extends Model<PluginModelAttributes> implements PluginModelAttributes {
  public id?: number;
  public name!: string;
  public description!: string;
  public iconUrl!: string;
  public imageUrl!: string;
  public pluginType!: PluginType;
  public subDescriptions!: Array<{ title: string; description: string }>;
  // public windowsFile!: string;
  // public macOsFile!: string;
  // public windowsVersion!: string;
  // public macOsVersion!: string;
  public currentWindowsVersion!: string;
  public currentMacOsVersion!: string;
  public createdAt?: string;
  public updatedAt?: string;

  // Association methods
  public getVersions!: HasManyGetAssociationsMixin<VersionModel>;
  public addVersion!: HasManyAddAssociationMixin<VersionModel, number>;
  public createVersion!: HasManyCreateAssociationMixin<VersionModel>;

  // Association
  public readonly versions?: VersionModel[];
  public static associations: {
    versions: Association<PluginModel, VersionModel>;
  };
}

// Version Model
export class VersionModel extends Model<VersionModelAttributes> implements VersionModelAttributes {
  public id?: number;
  public pluginId!: number;
  public platform!: Platform;
  public url!: string;
  public size!: number;
  public version!: string;
  public releaseDate!: string;
  public createdAt?: string;
  public updatedAt?: string;

  // Association
  public readonly plugin?: PluginModel;
  public static associations: {
    plugin: Association<VersionModel, PluginModel>;
  };
}

// Initialize Plugin Model
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
    pluginType: {
      type: DataTypes.STRING,
    },
    subDescriptions: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    currentWindowsVersion: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    currentMacOsVersion: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  },
  {
    tableName: "plugins",
    sequelize: db,
    timestamps: true,
  }
);

// Initialize Version Model
VersionModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    pluginId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: PluginModel,
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    platform: {
      type: DataTypes.ENUM('windows', 'mac'),
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    size: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    version: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    releaseDate: {
      type: DataTypes.DATE,
      allowNull: false,
    }
  },
  {
    tableName: "plugin_versions",
    sequelize: db,
    timestamps: true,
    indexes: [
      {
        fields: ['pluginId'],
      },
      {
        fields: ['platform'],
      },
      {
        fields: ['pluginId', 'platform'],
      },
      {
        fields: ['releaseDate'],
      }
    ]
  }
);

// Define associations
PluginModel.hasMany(VersionModel, {
  foreignKey: 'pluginId',
  as: 'versions',
});

VersionModel.belongsTo(PluginModel, {
  foreignKey: 'pluginId',
  as: 'plugin',
});


// import { DataTypes, Model } from "sequelize";
// import db from "../config/database-config";
// import { PluginType } from "../types/appScopeTypes";

// // Define the TypeScript interface
// export interface PluginModelAttributes {
//   id?: number;
//   name: string;
//   description: string;
//   iconUrl: string;
//   imageUrl: string;
//   pluginType: PluginType;
//   subDescriptions: Array<{ title: string; description: string }>;
//   windowsFile: string;
//   macOsFile: string;
//   windowsVersion: string;
//   macOsVersion: string;
//   createdAt?: string;
//   updatedAt?: string;
// }

// // Extend the Sequelize Model
// export class PluginModel extends Model<PluginModelAttributes> implements PluginModelAttributes {
//   public id?: number;
//   public name!: string;
//   public description!: string;
//   public iconUrl!: string;
//   public imageUrl!: string;
//   public pluginType!: PluginType;
//   public subDescriptions!: Array<{ title: string; description: string }>;
//   public windowsFile!: string;
//   public macOsFile!: string;
//   public windowsVersion!: string;
//   public macOsVersion!: string;
//   public createdAt?: string;
//   public updatedAt?: string;
// }

// // Initialize the model
// PluginModel.init(
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       autoIncrement: true,
//       primaryKey: true,
//     },
//     name: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     description: {
//       type: DataTypes.TEXT,
//       allowNull: false,
//     },
//     imageUrl: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     iconUrl: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     pluginType: {
//       type: DataTypes.INTEGER,
//     },
//     subDescriptions: {
//       type: DataTypes.JSONB, // PostgreSQL (or DataTypes.JSON for general)
//       allowNull: false,
//       defaultValue: [],
//     },
//     windowsFile: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     macOsFile: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     windowsVersion: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     macOsVersion: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     }
//   },
//   {
//     tableName: "plugins",
//     sequelize: db,
//     timestamps: true,
//   }
// );
