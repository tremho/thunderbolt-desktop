
import * as electron from 'electron'

import * as path from 'path'

// import {AppGateway} from './src/AppGateway'
// import {registerExtensionModule} from "./src/BackExtensions";

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'YES'

const preloadPath = path.join(__dirname, 'src', 'preload.js')

export default {
    electronApp: electron.app,
    BrowserWindow: electron.BrowserWindow,
    ipcMain: electron.ipcMain,
    // AppGateway,
    preloadPath,
    // registerExtensionModule
}
