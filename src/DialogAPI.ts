
import {dialog, MessageBoxOptions, MessageBoxReturnValue, nativeImage} from "electron"

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

// Dialog types from Nativescript (standard)
// Alert, Action, Confirm, Login, Prompt

// any others need to be custom

// we can support up to 3 buttons with Alert (1 button) and Confirm (2-3 buttons)
// we can't support checkbox on Nativescript
// we can't support icon on Nativescript

// electron supports File dialogs. No real reason for this on mobile. same with cert trust.
// I think we can ignore these. Maybe connect file dialogs later, but only for desktop. no-op or throw on mobile