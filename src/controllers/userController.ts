import { Request, Response } from "express";
import { validateUserData } from "../config/validators";
import { ApiResponse } from "../types/appScopeTypes";
import { UserModel } from "../model/User";
import { Op } from "sequelize";

const userController = {
  async createUser(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { email, userType, provider, providerId } = req.body;
      const errors = validateUserData({ email, userType, provider });

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: errors.join(', '),
          data: null,
        });
        return;
      }

      const existingUser = await UserModel.findOne({
        where: {
          email: {
            [Op.iLike]: email,
          },
        },
      });

      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'User already exists',
          error: 'Email already in use',
          data: null,
        });
        return;
      }

      await UserModel.create({ email, userType, provider, providerId });

      res.status(200).json({
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


};


export default userController;