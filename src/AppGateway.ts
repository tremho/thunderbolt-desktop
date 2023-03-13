
import * as fileApi from "./API/FileAPI"
import * as menuApi from "./API/DesktopMenu";
import * as dialogApi from "./API/DialogAPI"
import * as webApi from "./API/WebAPI"
import * as settingsApi from './API/SettingsAPI'
import * as testApi from "./API/TestAPI/testApi"
import * as audioApi from "./API/AudioAPI"

import {passEnvironmentAndGetTitles} from "./StartupTasks";

import {BrowserWindow} from 'electron'

const exportedFunctions = {
    messageInit: () => { /*console.log('message init stub hit')*/ },

    requestEnvironment: () => {passEnvironmentAndGetTitles()},

    appExit: (code:number) => {process.exit(code)},

    ...menuApi,
    ...fileApi,
    ...dialogApi,
    ...webApi,
    ...settingsApi,
    ...audioApi,
    ...testApi
}

/**
 * Inter-Process Communication support for Electron
 * Supports Remote Procedure calls and messaging
 */
export class AppGateway {

    private ipcMain: any;
    private static ipcMessageSender = null;

    constructor(ipcMainIn: any) {
        this.ipcMain = ipcMainIn;
        this.attach();
    }

    public static getFunctionNames() {
        return Object.getOwnPropertyNames(exportedFunctions);
    }

    private attach() {
        Object.getOwnPropertyNames(exportedFunctions).forEach(fname => {
            // @ts-ignore
            const fn = exportedFunctions[fname]
            this.ipcMain.on(fname, (event: any, ...args: any) => {
                const data = args[0]
                const id = data.id
                const callArgs = data.args || []

                let response, error;
                try {
                    response = fn(...callArgs)
                    console.log(`ApiGateway: response direct:`, response);
                    Promise.resolve(response).then((presp: any) => {
                        console.log("ApiGateway: resolved response", presp);
                        event.sender.send(fname, {id, response: presp})
                        console.log("sender sent response for", {fname, id})
                    })
                    return
                } catch (e) {
                    console.error("ApiGateway: exception direct", e);
                    error = e;
                }
                if (fname === 'messageInit') {
                    AppGateway.ipcMessageSender = event.sender;
                    // console.log('set ipcMessageSender to ', AppGateway.ipcMessageSender)
                    // console.log(fname, id)
                }
                console.log("ApiGateway, serializing response", {id,response,error})
                event.sender.send(fname, {id, response, error})
            })
        })
    }

    public static sendMessage(name: string, data: any) {
        // console.log('sending ipc message', name, data)
        if (AppGateway.ipcMessageSender) {
            // @ts-ignore
            AppGateway.ipcMessageSender.send('message', {name, data})
        } else {
            // console.error('no ipcMessageSender')
            setTimeout(() => {
                AppGateway.sendMessage(name, data)
            }, 1000)
        }
    }


    public static sendTestRequest(request: string, params: string[] = [], cb?:any) {

        return new Promise(resolve => {
            // console.log('calling testOp method in Main World #A', request)
            let tparams = '['
            if(params.length) {
                params.forEach(p => {tparams += ` "${p}",`})
                tparams = tparams.substring(0, tparams.length-1) + ']'
            } else {
                tparams = '[]'
            }
            const ex = `callTestRequest("${request}", ${tparams})`
            // console.log('execute', ex)
            BrowserWindow.getAllWindows()[0].webContents.executeJavaScript(ex).then(rv => {
                // console.log('>> then resolution of BrowserWindow call results in ', typeof rv, rv)
                resolve(rv)
            })
        })
    }
}
