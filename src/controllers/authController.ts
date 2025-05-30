import { Request, Response } from "express";
import { validateLoginData } from "../config/validators";
import { ApiResponse } from "../types/appScopeTypes";
import { UserModel } from "../model/User";
import { Op } from "sequelize";
import { decryptToObject, encryptObject, sendEmail } from "../utils/helperFunctions";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();


const authController = {
    async login(req: Request, res: Response<ApiResponse>): Promise<void> {
        try {
            const { email, otp } = req.body;
            const errors = validateLoginData({ email, otp });

            if (errors.length > 0) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    error: errors.join(', '),
                    data: null,
                });
                return;
            }

            //check if the user exists
            const user = await UserModel.findOne({
                where: {
                    email: {
                        [Op.iLike]: email,
                    },
                },
            })

            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found',
                    error: 'No user found with this email',
                    data: null,
                });
                return;
            }

            //check if the OTP matches
            const decryptedOtpObject = user.otp ? JSON.parse(decryptToObject(user.otp)) : null;

            if (!decryptedOtpObject || decryptedOtpObject.otp !== otp) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid OTP',
                    error: 'The provided OTP is incorrect',
                    data: null,
                });
                return
            }

            // Check if the OTP has expired
            if (new Date(decryptedOtpObject.expiresAt) < new Date()) {
                res.status(401).json({
                    success: false,
                    message: 'OTP expired',
                    error: 'The provided OTP has expired',
                    data: null,
                });
                return
            }


              const secret = process.env.ACCESS_TOKEN_SECRET!;

            //create JWT
            const accessToken = jwt.sign(
                {
                    "UserInfo": {
                        "email": user.email,
                        "id": user.id,
                        "userType": user.userType
                    }
                },
                secret,
                { 'expiresIn': '300s' }
            );

            const refreshToken = jwt.sign(
                { 'email': user.email },
                process.env.REFRESH_TOKEN_SECRET as string,
                { 'expiresIn': '1d' }
            );

            //send token as a cookie
            res.cookie('aligno', refreshToken, { httpOnly: true, sameSite: 'none', secure: true, maxAge: 24 * 60 * 60 * 1000 })

            //save the refresh token in the database TODO 
                   await UserModel.update(
              { refreshToken: refreshToken },
              { where: { email } }
            );

            res.status(200).json({
                success: true,
                message: 'Login successful',
                error: null,
                data: {
                    accessToken,
                    user: {
                        id: user.id,
                        email: user.email,
                        userType: user.userType
                    }
                },
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

    
  async generateOtp(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { email } = req.body;
  
      if (!email) {
        res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    error: "Email is required",
                    data: null,
                });
                return;
      }

      const user = await UserModel.findOne({ where: { email } });

      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
          error: "No user found with this email ooo",
          data: null,
        });
        return;
      }

      // Generate a 4-digit OTP
      const otp = Math.floor(1000 + Math.random() * 9000);

      const otpObject = {
        otp: otp.toString(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), 
      };

      const encryptedOtp = encryptObject(JSON.stringify(otpObject));
            console.log(otp);

       await UserModel.update(
              { otp: encryptedOtp },
              { where: { email } }
            );

      // Send OTP to user's email
      const emailSent = await sendEmail(user.email,  otp.toString()); 

        res.status(200).json({
                    success: true,
                    message: 'OTP generated successfully',
                    error: null,
                    data: null,
                });
                return;

    } catch (error:any) {
      res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message,
                data: null,
            });
    }
  }, 

  async generateRefreshToken(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
        // Get the refresh token from cookies
        const refreshToken = req.cookies?.aligno;

        if (!refreshToken) {
            res.status(401).json({
                success: false,
                message: 'No refresh token provided',
                error: 'Refresh token not found in cookies',
                data: null,
            });
            return;
        }

        // Verify and decode the refresh token
        let decoded: any;
        try {
            decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string);
        } catch (jwtError: any) {
            res.status(403).json({
                success: false,
                message: 'Invalid refresh token',
                error: 'Refresh token verification failed',
                data: null,
            });
            return;
        }

        // Extract email from decoded token
        const { email } = decoded;

        // Find user in database and verify refresh token matches
        const user = await UserModel.findOne({
            where: {
                email: {
                    [Op.iLike]: email,
                },
                refreshToken: refreshToken, // Ensure the token in DB matches the one sent
            },
        });

        if (!user) {
            res.status(403).json({
                success: false,
                message: 'Invalid refresh token',
                error: 'User not found or refresh token mismatch',
                data: null,
            });
            return;
        }

        // Generate new access token
        const newAccessToken = jwt.sign(
            {
                "UserInfo": {
                    "email": user.email,
                    "id": user.id,
                    "userType": user.userType
                }
            },
            process.env.ACCESS_TOKEN_SECRET!,
            { 'expiresIn': '300s' }
        );

        // Generate new refresh token
        const newRefreshToken = jwt.sign(
            { 'email': user.email },
            process.env.REFRESH_TOKEN_SECRET as string,
            { 'expiresIn': '1d'}
        );

        // Update refresh token in database
        await UserModel.update(
            { refreshToken: newRefreshToken },
            { where: { email: user.email } }
        );

        // Set new refresh token as httpOnly cookie
        res.cookie('aligno', newRefreshToken, { 
            httpOnly: true, 
            sameSite: 'none', 
            secure: true, 
            maxAge: 24 * 60 * 60 * 1000 
        });

        // Return new access token
        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            error: null,
            data: {
                accessToken: newAccessToken,
                user: {
                    id: user.id,
                    email: user.email,
                    userType: user.userType
                }
            },
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
}

export default authController;