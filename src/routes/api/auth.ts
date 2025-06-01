import express from 'express';
import authController from '../../controllers/authController';
const router = express.Router();


router.route('/login')
    .post(authController.login);

    router.route('/loginwithgoogle')
    .post(authController.loginWithGoogle);

router.route('generaterefreshtoken')
    .post(authController.generateRefreshToken); 


router.route('/generateotp')
    .post(authController.generateOtp);  

    export default router;  
