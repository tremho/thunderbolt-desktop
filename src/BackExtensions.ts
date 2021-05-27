import {ipcMain} from 'electron'

const registeredModules:any = {}


// back side listener to dispatch to functions registered
ipcMain.on('extApi', (event, msg) => {
    // console.log('>>> See message for extApi call', msg)
    const {moduleName, functionName, id, args} = msg
    const module = registeredModules[moduleName]
    // console.log('module for '+moduleName, module)
    // @ts-ignore
    const fn = module[functionName]
    // console.log('function for '+functionName, fn)
    let response, error;
    if(!fn) {
        error = 'Function '+functionName+' does not exist in module "'+moduleName+'"'
    } else {
        try {
            response = fn(...args)
        } catch (e) {
            error = e;
        }
    }
    // console.log('extApi return', id, response, error)
    event.sender.send('extApi', {id, response, error})
})

export function registerExtensionModule(moduleName:string, module:any) {
    registeredModules[moduleName] = module
    // console.log('registered modules', registeredModules)
}