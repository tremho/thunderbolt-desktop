import {ipcMain} from 'electron'

const registeredModules:any = {}


// back side listener to dispatch to functions registered
ipcMain.on('extApi', (event, msg) => {
    console.log('>>> See message for extApi call', msg)
    const {moduleName, functionName, id, args} = msg
    console.log('module for '+moduleName, module)
    // @ts-ignore
    const fn = module[functionName]
    console.log('function for '+functionName)
    let response, error;
    try {
        response = fn(...args)
    } catch (e) {
        error = e;
    }
    event.sender.send('extApi', {id, response, error})
})

export function registerExtensionModule(moduleName:string, module:any) {
    registeredModules[moduleName] = module
}