
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
    const r = 'mock execute '+ request
    return Promise.resolve(r)
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

            // Test exchange listener
            this.ipcMain.on('testXchg', (event: any, ...args: any) => {
                console.log('testXchg listener event  #C-', args) // #1
                const data = args[0]
                const id = data.id

                let response, error;
                try {
                    response = callTestHandler(data.request, data.params)
                    if (response.then) {
                        response.then((presp: any) => {
                            console.log('sending resolved result of response #C-2a > ', id, presp) // #2
                            event.sender.send('testXchg', {id, response: presp})
                        })
                        return
                    }
                } catch (e) {
                    error = e;
                }
                console.log("sending raw response #C-2b >", id, response || error)
                event.sender.send('testXchg', {id, response, error})
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

        console.log('#A sending testXchg message', request, params)
        AppGateway.sendMessage('testXchg', {request, params})
    }
}
//
// const responders:any = {}
// let nextId = 1
//
// class Responder {
//     id: number;
//     promise:Promise<any>
//     resolve:any
//     reject:any
//     constructor() {
//         this.id = nextId++
//         this.promise = new Promise((resolve, reject) => {
//             this.resolve = resolve;
//             this.reject = reject;
//             responders[this.id] = this;
//         })
//     }
//     respond(value:any) {
//         delete responders[this.id]
//         this.resolve(value)
//     }
//     error(e:Error) {
//         delete responders[this.id]
//         // console.error(e.stack)
//         this.reject(e)
//     }
// }


