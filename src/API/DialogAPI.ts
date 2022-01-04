
import {dialog, BrowserWindow, MessageBoxOptions, MessageBoxReturnValue, nativeImage} from "electron"

export class DialogOptions {
    title?:string       // Does not display on Mac
    message?:string     // bold text
    detail?:string      // small normal text (message and detail merge as single text block on Nativescript)
    type:string = 'none' // none, info, error, question, warning
    buttons?:string[]  // up to 3 is supportable on NS, beyond that will be ignored.
    selectedButtonIndex?:number
}


export function openDialog(dialogOptions:DialogOptions):Promise<number> {

    const electronOptions:MessageBoxOptions =  {
        title: dialogOptions.title || '',
        message: dialogOptions.message || '',
        detail: dialogOptions.detail || '',
        type: dialogOptions.type || 'none', // TODO: Map to our supported types
        buttons: dialogOptions.buttons || ['Okay', 'Cancel'],
        defaultId: dialogOptions.selectedButtonIndex || 0,
        normalizeAccessKeys: true
    }

    return dialog.showMessageBox(electronOptions).then((result:MessageBoxReturnValue) => {
        return result.response
    })
}

// Message box with a timeout
export async function timeoutBox(dialogOptions:DialogOptions, timeoutSeconds:number){
    console.log('timeoutBox', dialogOptions, timeoutSeconds)
    return new CancellablePopup(dialogOptions, timeoutSeconds*1000).promise
}
class CancellablePopup {
    promise:Promise<any>|null
    promiseReject:any
    abortController:any
    boxTimer:any
    constructor (options:any, timeout:number) {

        

        this.promise        = null
        this.promiseReject  = null
        this.abortController = new AbortController()
        this.boxTimer       = null

        // This is how to link the popup to the signal of AbortController
        options.signal = this.abortController.signal

        this.promise = new Promise ( ( resolve, reject ) => {
            console.log ( "Opening popup ..." )
            this.promiseReject = reject
            let dummyWindow = new BrowserWindow({ width: 0, height: 0, show: false })
            dialog.showMessageBox ( dummyWindow, options ).then ( (result) => {
                clearTimeout ( this.boxTimer )
                resolve ( result )
            })

            if ( timeout ) {
                this.boxTimer = setTimeout ( () => {
                    console.log ( "Popup has timed out!" )
                    this.hide('timeout')
                }, timeout )
            }
        })
    }

    hide( reason:string ) {
        console.log ( "Hiding popup ..." )
        this.abortController.abort()
        this.promiseReject ( reason )
    }
}

// Dialog types from Nativescript (standard)
// Alert, Action, Confirm, Login, Prompt

// any others need to be custom

// we can support up to 3 buttons with Alert (1 button) and Confirm (2-3 buttons)
// we can't support checkbox on Nativescript
// we can't support icon on Nativescript

// electron supports File dialogs. No real reason for this on mobile. same with cert trust.
// I think we can ignore these. Maybe connect file dialogs later, but only for desktop. no-op or throw on mobile