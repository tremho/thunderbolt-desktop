
import {AppGateway} from "../../AppGateway";

/**
 * Reads the value in the app model at the given model path
 * @param modelPath
 */
export async function readModelValue(modelPath:string) {
    // console.log('TestActions readModelValue is calling AppGateway to relay to front')
    const resp = await AppGateway.sendTestRequest('readModelValue', [modelPath])
    // console.log('response from AppGateway is', resp)
    return resp
}

/**
 * Sets a value in the model at the given model path
 * @param modelPath
 * @param value
 */
export async function setModelValue(modelPath:string, value:any) {
    return await AppGateway.sendTestRequest('setModelValue', [modelPath, value])
}

/**
 * Selects a component on the page via a selector and assigns it to a name we can reference later
 *
 * @param name Name to assign to the component
 * @param tagName tag name of the component (e.g. simple-label)
 * @param [prop] optional name of a property to check on this component
 * @param [propValue] optional if prop given, this is the value to match
 */
export async function assignComponent(name:string, tagName:string, prop?:string, propValue?:string) {
    // console.log('assignComponent', name, tagName, prop, propValue)
    const resp =  await AppGateway.sendTestRequest('assignComponent', [name, tagName, prop || '', propValue || ''])
    // console.log('assignComponent response', resp)
    return resp
}

/**
 * Reads the value of a property of the named component
 *
 * @param componentName
 * @param propName
 */
export async function readComponentProperty(componentName:string, propName:string) {
    // console.log('readComponentProperty ', componentName, propName)
    const resp =  await AppGateway.sendTestRequest('readComponentProperty', [componentName, propName])
    // console.log('     response:', resp)
    return resp
}

/**
 * Sets the  property of a named component to the given value
 *
 * @param componentName
 * @param propName
 * @param propValue
 */
export async function setComponentProperty(componentName:string, propName:string, propValue:string) {
    return await AppGateway.sendTestRequest('setComponentProperty', [componentName, propName, propValue])
}

/**
 * Triggers the named action on the named component.
 * Actions are psuedo-actions, such as "press" (alias for click or tap)
 * @param componentName
 * @param action
 */
export async function triggerAction(componentName:string, action:string) {
    // console.log('triggerAction', componentName, action)
    return await AppGateway.sendTestRequest('triggerAction', [componentName, action])
}

/**
 * Navigate to the given page, optionally passing a context object
 * @param pageName
 * @param context
 */
export async function goToPage(pageName:string, context?:any) {
    return await AppGateway.sendTestRequest('goToPage', [pageName, context])
}

/**
 * Call a function of a given name on the current page, passing optional parameters
 * @param funcName  Name of exported function found on current page logic
 * @param [parameters]  Array of optional parameters to pass
 */
export async function callPageFunction(funcName:string, parameters:string[] = []) {
    return await AppGateway.sendTestRequest('callPageFunction', [funcName, ...parameters])
}

/**
 * wait for a given number of milliseconds
 * @param delay
 */
export async function wait(delay:number) {
    // console.log('waiting for '+delay/1000+' seconds')
    return new Promise(resolve => { setTimeout(resolve, delay)})
}

// perform a menu action
// perform a tool action
//
// take + record screenshot

export async function time() {
    console.log('returning current time')
    return Date.now()
}

export async function tree() {
    console.log('calling TestOps.tree in common')
    return await AppGateway.sendTestRequest('tree')
}

import * as electron from 'electron'
import path from 'path'
import fs, {mkdir} from 'fs'

export async function screenshot(name:string) {
    const ni = await electron.BrowserWindow.getAllWindows()[0].webContents.capturePage()
    if(ni) {
        const rootPath = path.resolve('..')
        if(fs.existsSync(path.join(rootPath, 'package.json'))) {
            const dtf = "current"
            const rptImgPath = path.join(getCurrentReportFolder(rootPath), 'electron', 'images')
            fs.mkdirSync(rptImgPath, {recursive:true})
            const imgPath = path.join(rptImgPath, name+'.png')
            const buffer = ni.toPNG()
            fs.writeFileSync(imgPath, buffer)
            return imgPath
        } else {
            console.error('Root path not detected at ', rootPath)
        }
    } else {
        console.error('screenshot failed!')
    }

}

function getCurrentReportFolder(rootPath:string) {
    const month = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    let dt = new Date()
    let nm = `${month[dt.getMonth()]}-${dt.getDate()}`
    let ordinal = 0
    let cpth = path.join(rootPath, 'report', nm, '' + ordinal)
    while (++ordinal) {
        if (!fs.existsSync(cpth)) {
            fs.mkdirSync(cpth, {recursive: true})
            break;
        }
    }
    let lnpth = path.join(rootPath, 'latest')
    if(fs.existsSync(lnpth)) fs.unlinkSync(lnpth)
    fs.linkSync(cpth, lnpth)
    return cpth
}
