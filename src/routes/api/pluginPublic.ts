import express from 'express'
import pluginController from '../../controllers/pluginController'
const router = express.Router()

router.route('/getallplugins')
.get(pluginController.getAllPlugins)

router.route('/getPluginWithVersions/:id')
.get(pluginController.getPluginWithVersions)

export default router