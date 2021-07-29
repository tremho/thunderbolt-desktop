
import * as electron from 'electron'

import * as path from 'path'

import {AppGateway} from './AppGateway'
import {registerExtensionModule} from "./BackExtensions";
import {WindowStatePersist} from "./WindowStatePersist";

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'YES'

const preloadPath = path.join(__dirname, 'preload.js')

function makeWindowStatePersist(name:string, width?:number, height?:number) {
    return new WindowStatePersist(name, width, height)
}

export default {
    electronApp: electron.app,
    BrowserWindow: electron.BrowserWindow,
    ipcMain: electron.ipcMain,
    makeWindowStatePersist: makeWindowStatePersist,
    AppGateway,
    preloadPath,
    registerExtensionModule
}
