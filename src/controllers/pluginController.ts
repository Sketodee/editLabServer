import { Request, Response } from "express";
import { ApiResponse } from "../types/appScopeTypes";
import { validatePluginData } from "../config/validators";
import { PluginModel } from "../model/Plugin";
import { Op } from "sequelize";

const pluginController = {
    async createPlugin(req: Request, res: Response<ApiResponse>): Promise<void> {
        try {
            const { name, description, iconUrl, imageUrl, subDescriptions, windowsFile, macOsFile } = req.body
            const errors = validatePluginData({ name, description, iconUrl, imageUrl, subDescriptions, windowsFile, macOsFile })

            if (errors.length > 0) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    error: errors.join(', '),
                    data: null,
                });
                return;
            }

            const existingPlugin = await PluginModel.findOne({
                where: {
                    name: {
                        [Op.iLike]: name
                    }
                }
            })

            if (existingPlugin) {
                res.status(400).json({
                    success: false,
                    message: 'Plugin already exists',
                    error: 'Name already in use',
                    data: null,
                });
                return;
            }

            await PluginModel.create({ name, description, iconUrl, imageUrl, subDescriptions, windowsFile, macOsFile })
            res.status(201).json({
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


    async updatePlugin(req: Request, res: Response<ApiResponse>): Promise<void> {
        try {
            const { id, name, description, iconUrl, imageUrl, subDescriptions, windowsFile, macOsFile } = req.body;

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
            const errors = validatePluginData({ name, description, iconUrl, imageUrl, subDescriptions, windowsFile, macOsFile });

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
                windowsFile,
                macOsFile,
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

            // Count total plugins
            const totalPlugins = await PluginModel.count();

            // Fetch paginated results
            const plugins = await PluginModel.findAll({
                offset,
                limit,
                order: [["createdAt", "DESC"]],
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
    }
}

export default pluginController