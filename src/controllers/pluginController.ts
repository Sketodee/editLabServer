import { Request, Response } from "express";
import { ApiResponse } from "../types/appScopeTypes";
import { validatePluginData, validatePluginWithVersionsData } from "../config/validators";
import { PluginModel, VersionModel } from "../model/Plugin";
import { Op } from "sequelize";
import db from "../config/database-config";
import { extractReferralCode } from "../utils/referrralUtils";

const pluginController = {
    async createPlugin(req: Request, res: Response<ApiResponse>): Promise<void> {
        const transaction = await db.transaction();

        try {
            const {
                name,
                description,
                iconUrl,
                imageUrl,
                subDescriptions,
                currentWindowsVersion,
                currentMacOsVersion,
                pluginType,
                versions
            } = req.body;

            // Validate the entire request body using the new validator
            const errors = validatePluginWithVersionsData(req.body);

            if (errors.length > 0) {
                await transaction.rollback();
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    error: errors.join(', '),
                    data: null,
                });
                return;
            }

            // Check if plugin with the same name already exists
            const existingPlugin = await PluginModel.findOne({
                where: {
                    name: {
                        [Op.iLike]: name
                    }
                },
                transaction
            });

            if (existingPlugin) {
                await transaction.rollback();
                res.status(400).json({
                    success: false,
                    message: 'Plugin already exists',
                    error: 'Name already in use',
                    data: null,
                });
                return;
            }

            // Create the plugin
            const plugin = await PluginModel.create({
                name,
                description,
                iconUrl,
                imageUrl,
                subDescriptions,
                currentWindowsVersion,
                currentMacOsVersion,
                pluginType
            }, { transaction });

            // Create all versions
            const createdVersions = [];
            for (const versionData of versions) {
                const version = await VersionModel.create({
                    pluginId: plugin.id!,
                    platform: versionData.platform,
                    url: versionData.url,
                    size: versionData.size,
                    version: versionData.version,
                    releaseDate: versionData.releaseDate
                }, { transaction });

                createdVersions.push(version);
            }

            // Commit the transaction
            await transaction.commit();

            // Fetch the created plugin with its versions for the response
            const createdPlugin = await PluginModel.findByPk(plugin.id, {
                include: [{
                    model: VersionModel,
                    as: 'versions',
                    order: [['releaseDate', 'DESC']]
                }]
            });

            res.status(200).json({
                success: true,
                message: 'Plugin and versions created successfully',
                error: null,
                data: {
                    plugin: createdPlugin,
                    versionsCreated: createdVersions.length
                },
            });

        } catch (error: any) {
            // Rollback the transaction on any error
            await transaction.rollback();

            console.error('Error creating plugin with versions:', error);

            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message,
                data: null,
            });
        }
    },


    async updatePlugin(req: Request, res: Response<ApiResponse>): Promise<void> {
        try {
            const { id, name, description, iconUrl, imageUrl, subDescriptions, windowsFile, macOsFile, windowsVersion, macOsVersion, pluginType } = req.body;

            // Validate ID
            const pluginId = parseInt(id);
            if (!pluginId || isNaN(pluginId)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid plugin ID",
                    error: "ID must be a valid number in the request body",
                    data: null,
                });
                return;
            }

            // Validate plugin fields
            const errors = validatePluginData({ name, description, iconUrl, imageUrl, subDescriptions, windowsFile, macOsFile, windowsVersion, macOsVersion, pluginType });

            if (errors.length > 0) {
                res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    error: errors.join(", "),
                    data: null,
                });
                return;
            }

            // Check if the plugin exists
            const plugin = await PluginModel.findByPk(pluginId);
            if (!plugin) {
                res.status(404).json({
                    success: false,
                    message: "Plugin not found",
                    error: "No plugin with this ID",
                    data: null,
                });
                return;
            }

            // Check for name conflict (excluding this plugin)
            const existingPlugin = await PluginModel.findOne({
                where: {
                    id: { [Op.ne]: pluginId },
                    name: { [Op.iLike]: name },
                },
            });

            if (existingPlugin) {
                res.status(400).json({
                    success: false,
                    message: "Plugin name already in use",
                    error: "Another plugin with this name exists",
                    data: null,
                });
                return;
            }

            // Update plugin
            await plugin.update({
                name,
                description,
                iconUrl,
                imageUrl,
                subDescriptions,
            });

            res.status(200).json({
                success: true,
                message: "Plugin updated successfully",
                error: null,
                data: plugin,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
                data: null,
            });
        }
    },

    async getAllPlugins(req: Request, res: Response<ApiResponse>): Promise<void> {
        try {
            // Extract pagination parameters from query string
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const offset = (page - 1) * limit;

            // Extract filter parameters
            const type = req.query.type as string;
            const filter = req.query.filter as string;

            // Build where clause based on query parameters
            const whereClause: any = {};

            // Filter by plugin type if provided
            if (type && type.trim() !== '') {
                whereClause.pluginType = type.trim();
            }

            // Filter by name (case-insensitive) if provided
            if (filter && filter.trim() !== '') {
                whereClause.name = {
                    [Op.iLike]: `%${filter.trim()}%`
                };
            }

            // Count total plugins with filters applied
            const totalPlugins = await PluginModel.count({
                where: whereClause
            });

            // Fetch paginated results without versions
            const plugins = await PluginModel.findAll({
                where: whereClause,
                offset,
                limit,
                order: [["createdAt", "DESC"]],
                // Explicitly exclude versions to keep response light
                attributes: {
                    exclude: [] // You can exclude specific fields here if needed
                }
            });

            res.status(200).json({
                success: true,
                message: "Plugins fetched successfully",
                error: null,
                data: {
                    currentPage: page,
                    totalPages: Math.ceil(totalPlugins / limit),
                    totalItems: totalPlugins,
                    items: plugins,
                    filters: {
                        type: type || null,
                        filter: filter || null,
                        appliedFilters: Object.keys(whereClause).length
                    }
                },
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
                data: null,
            });
        }
    },

    async getPluginWithVersions(req: Request, res: Response<ApiResponse>): Promise<void> {
        try {
            const { id } = req.params;
            // Validate plugin ID
            if (!id || isNaN(parseInt(id))) {
                res.status(400).json({
                    success: false,
                    message: "Invalid plugin ID",
                    error: "Plugin ID must be a valid number",
                    data: null,
                });
                return;
            }

            // Fetch plugin with all versions
           const plugin = await PluginModel.findByPk(id, {
    include: [{
        model: VersionModel,
        as: 'versions'
    }],
    order: [
        [{ model: VersionModel, as: 'versions' }, 'releaseDate', 'DESC']
    ]
});

            if (!plugin) {
                res.status(404).json({
                    success: false,
                    message: "Plugin not found",
                    error: "No plugin found with the provided ID",
                    data: null,
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: "Plugin with versions fetched successfully",
                error: null,
                data: plugin,
            });

        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
                data: null,
            });
        }
    }

}

export default pluginController