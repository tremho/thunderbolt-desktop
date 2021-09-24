import {ipcMain} from 'electron'

import AppBackRequirements from "./AppBackRequirements";

const registeredModules:any = {}

// back side listener to dispatch to functions registered
ipcMain.on('extApi', (event, msg) => {
    console.log('>>> See message for extApi call', msg)
    const {moduleName, functionName, id, args} = msg
    const module = registeredModules[moduleName]
    // console.log('module for '+moduleName, module)

    let response, error;
    if(!module.contextSent) {
        if(typeof module.initContext === 'function') {
            try {
                module.initContext(AppBackRequirements)
                module.contextSent = true
            } catch(e) {
                error = e
            }
        }
    }
    const fn = module[functionName]

    if(!fn) {
        error = 'Function '+functionName+' does not exist in module "'+moduleName+'"'
    }
    if(!error) {
        try {
            response = fn(...args)
        } catch (e) {
            error = e;
        }
    }
    console.log('extApi return', id, response, error)
    event.sender.send('extApi', {id, response, error})
})

export function registerExtensionModule(moduleName:string, module:any) {
    registeredModules[moduleName] = module
}