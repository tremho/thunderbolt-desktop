
import * as fileApi from "./API/FileAPI"
import * as menuApi from "./API/DesktopMenu";
import * as dialogApi from "./API/DialogAPI"
import * as webApi from "./API/WebAPI"
import * as testApi from "./API/TestAPI/testApi"

import {passEnvironmentAndGetTitles} from "./StartupTasks";

const exportedFunctions = {
    messageInit: () => { /*console.log('message init stub hit')*/ },

    requestEnvironment: () => {passEnvironmentAndGetTitles()},

    appExit: (code:number) => {process.exit(code)},

    ...menuApi,
    ...fileApi,
    ...dialogApi,
    ...webApi,
    ...testApi
}

function callTestHandler(request:string, params:string[]) {
    return new Promise(resolve => {
        resolve('mock execute '+ request) // just return the request string passed in for now
    })
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
            this.ipcMain.on(fname, (event:any, ...args:any) => {
                const data = args[0]
                const id = data.id
                const callArgs = data.args || []

                let response, error;
                try {
                    response = fn(...callArgs)
                    if(response.then) {
                        response.then((presp:any) => {
                            event.sender.send(fname, {id, response: presp})
                        })
                        return
                    }
                } catch (e) {
                    error = e;
                }
                if (fname === 'messageInit') {
                    AppGateway.ipcMessageSender = event.sender;
                    // console.log('set ipcMessageSender to ', AppGateway.ipcMessageSender)
                    // console.log(fname, id)
                }
                event.sender.send(fname, {id, response, error})
            })

            // Test exchange listener
            this.ipcMain.on('testXchg', (event:any, ...args:any) => {
                console.log('testXchg listener event', event, args)
                const data = args[0]
                const id = data.id

                let response, error;
                try {
                    response = callTestHandler(data.request, data.params)
                    if(response.then) {
                        response.then((presp:any) => {
                            event.sender.send(fname, {id, response: presp})
                        })
                        return
                    }
                } catch (e) {
                    error = e;
                }
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


    public static sendTestRequest(request: string, params: string[]) {
        const id = testRequestId++
        console.log('sending Test Request from AppGateway', id, request, params)
        if (AppGateway.ipcMessageSender) {
            // @ts-ignore
            AppGateway.ipcMessageSender.send('testXchg', {id, request, params})
        } else {
            console.error('no ipcMessageSender')
            setTimeout(() => {
                AppGateway.sendTestRequest(request, params)
            }, 1000)
        }
    }
}
let testRequestId = 1


