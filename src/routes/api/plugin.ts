import express from 'express'
import pluginController from '../../controllers/pluginController'
import { UserType } from '../../types/appScopeTypes'
import verifyRoles from '../../middleware/verifyRoles'
const router = express.Router()

router.route('/createplugin')
.post(verifyRoles(UserType.ADMIN), pluginController.createPlugin)

router.route('/updateplugin')
.post(verifyRoles(UserType.ADMIN), pluginController.updatePlugin)

router.route('/getallplugins')
.get(pluginController.getAllPlugins)

export default router