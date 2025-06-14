import express from 'express'
import pluginController from '../../controllers/pluginController'
const router = express.Router()

router.route('/createplugin')
.post(pluginController.createPlugin)

export default router