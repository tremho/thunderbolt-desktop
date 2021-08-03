
import * as electron from 'electron'

import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'

import {AppGateway} from './AppGateway'
import {registerExtensionModule} from "./BackExtensions";
import {WindowStatePersist} from "./WindowStatePersist";

const nodeParts = {fs, os, path}

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
    registerExtensionModule,
    nodeParts
}
