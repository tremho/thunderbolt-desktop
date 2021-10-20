
import * as fileApi from "./API/FileAPI"
import * as menuApi from "./API/DesktopMenu";
import * as dialogApi from "./API/DialogAPI"
import * as webApi from "./API/WebAPI"
import * as testApi from "./API/TestAPI/testApi"

import {passEnvironmentAndGetTitles} from "./StartupTasks";

import injections from './AppBackRequirements'

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
                    if (response.then) {
                        response.then((presp: any) => {
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

            // Test exchange response
            this.ipcMain.on('testXchg', (event: any, ...args: any) => {
                console.log('testXchg response #C', args)
                const data = args[0]
                let {id, response, error} = data
                console.log('>> Should resolve id with ', id,  response || error)
                const responder = responders[id]
                console.log('looking for responder ', id)
                console.log(' in ', JSON.stringify(responders))
                console.log( ' got ', responder)
                if(error) {
                    responder.reject(error)
                } else {
                    responder.resolve(response)
                }

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

        console.log('calling testOp method in Main World #A', request)
        injections.BrowserWindow.getAllWindows()[0].webContents.executeJavaScript('console.log("Wanna call ", request, params)')

        //
        //
        // console.log('#A sending testXchg message', request, params)
        // let r = new Responder()
        // let id = r.id
        // AppGateway.sendMessage('testXchg', {id, request, params})
        // return r.promise
    }
}

const responders:any = {}
let nextId = 1;
class Responder {
    id: number;
    promise:Promise<any>
    resolve:any
    reject:any
    constructor() {
        this.id = nextId++
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
            console.log('recording responder ', this.id)
            responders[this.id] = this;
        })
    }
    respond(value:any) {
        delete responders[this.id]
        this.resolve(value)
    }
    error(e:Error) {
        delete responders[this.id]
        // console.error(e.stack)
        this.reject(e)
    }
}

// let testRequestRelay:any
// export function setTestRequestRelay(trr:any) {
//     testRequestRelay = trr
//     console.log('testRequestRelay set', typeof testRequestRelay)
// }
// export function callTestRequest(request:string, params:string[]) {
//     console.log('testRequestRelay is', typeof testRequestRelay)
//     testRequestRelay(request, params)
// }