import {BrowserWindow} from "electron";

import appConfig from 'electron-settings';

class WindowState {
    public x?: number;
    public y?: number;
    public width: number = 800;
    public height: number = 600;
    public isMaximized? : boolean;
}

export class WindowStatePersist {
    private windowName:string;
    private window?:BrowserWindow
    private windowState;

    constructor(name:string, width?:number, height?:number) {
        this.windowName = name;
        this.windowState = new WindowState()
        if(width) this.windowState.width = width;
        if(height) this.windowState.height = height;

        // console.log(">>>>>$$ Window State created $$<<<<<<")
    }

    get x() {
        return (this.windowState && this.windowState.x)
    }
    get y() {
        return (this.windowState && this.windowState.y)
    }
    get width() {
        return (this.windowState && this.windowState.width)
    }
    get height() {
        return (this.windowState && this.windowState.height)
    }

    saveState() {
        if(this.windowState && this.window) {
            if (!this.windowState.isMaximized) {
                this.windowState = this.window.getBounds()
            }
            this.windowState.isMaximized = this.window.isMaximized()
            try {
                // @ts-ignore
                appConfig.set(`windowState.${this.windowName}`, this.windowState).catch(e =>{})
            } catch(e) {
                console.warn(e.message)
            }
        }
    }

    restore():Promise<unknown> {
        return new Promise(resolve => {
            // Restore from appConfig
            let oldState = this.windowState // in case we haven't saved before
            try {
                appConfig.get(`windowState.${this.windowName}`).catch(e => {throw e}).then(ws => {
                    // console.log('data from appConfig', ws)
                    this.windowState = (ws as unknown as WindowState) || oldState
                    resolve(undefined)
                }) // avoid unhandled catch in promise
            } catch(e) {
                console.warn(e.message)
                resolve(undefined)
            }
        }).catch(e => {
            console.warn(e.message)
        })
    }

    track(window:BrowserWindow) {
        this.window = window;
        const boundSave = this.saveState.bind(this)
        window.on('resize', boundSave);
        window.on('move', boundSave);
        window.on('close', boundSave);
    }
}