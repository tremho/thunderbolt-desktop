/*
The Settings API provides a cross-platform way of storing name/value data persistently.
Ideal for system configuration style scenarios.
Not ideal for large data or user documents.
 */

// @ts-ignore
import appConfig from 'electron-settings';


let prefix = 'settings'


// Returns the currently set namespace prefix for data keys
export function getSettingsPrefix() {
    return prefix
}

// Sets a new prefix to be used as a namespace for data keys
export function setSettingsPrefix(aprefix:string) {
    prefix = prefix
}

// Returns true if the requested key exists in settings
export function hasSettingsKey(
    key:string
) {
    return appConfig.hasSync(prefix+'.'+key)
}

// gets the type of the value recorded at the given key
export async function getSettingsType(key:string):Promise<string> {
    return appConfig.get('type.'+prefix+'.'+key).then(value => {
       return (value?.toString() || 'string')
    })
}

// gets the value recorded for the given key
export async function getSettingsValue(key:string):Promise<any> {
    return appConfig.get(prefix+'.'+key).then(value => {
        return getSettingsType(key).then(type => {
            if(type === 'number') {
                return Number(value)
            }
            if(type === 'boolean') {
                return value === 'true'
            }
            if(type === 'object') {
                try {
                    let obj = JSON.parse(value?.toString() || '')
                    return obj
                } catch(e) {
                    console.error('failed to retrieve object from settings '+key, e)
                    return null
                }
            }
            return (value?.toString() || '')
        })
    })
}

// records the given key and value
export async function setSettingsValue(key:string, value:any) {
    let type = typeof value
    return appConfig.set('type.'+prefix+'.'+key, type).then(() => {
        let v = ''+value
        if(type === 'object') {
            try {
                v = JSON.stringify(value)
            } catch(e) {
                console.error('failed to save object to settings '+key, e)
            }
        }
        return appConfig.set(prefix+'.'+key, v)
    })
}

// removes the record for the given key
export async function removeSettingsKey(key:string) {
    return appConfig.unset('type.'+prefix+'.'+key).then(()=> {
        return appConfig.unset(prefix+'.'+key)
    })
}

// forces a write to persistence
export async function flushSettings() {
    // electron does this automatically
}
