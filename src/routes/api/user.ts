import express from 'express';
const router = express.Router();
import authController from '../../controllers/userController';
import testController from '../../controllers/testController';
import verifyRoles from '../../middleware/verifyRoles';
import { UserType } from '../../types/appScopeTypes';

router.route('/create')
    .post(authController.createUser);

router.route('/test')
    .get(verifyRoles(UserType.USER), testController.testEndpoint);


    export default router;