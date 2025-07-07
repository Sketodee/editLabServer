import express from 'express';
const router = express.Router();
import userController from '../../controllers/userController';
import testController from '../../controllers/testController';

router.use(express.json());

router.route('/create')
    .post(userController.createUser);

router.route('/test')
    .post(testController.testEndpoint);
    // .post(testController.testEndpoint);


    export default router;