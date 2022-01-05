
import WebSocket from 'ws'
import {executeDirective, getReport} from "./PoCActions";
export type ClientEventHandler = (data:any) => void

export class WSClient {
    ws:WebSocket = (null as unknown as WebSocket)
    eventMap:any = {}

    connect(serviceUrl:string) {
        this.ws = new WebSocket(serviceUrl)
        this.ws.on('open', () => {
            console.log('opened -- connected')
            this.handleEvent('connect', serviceUrl)
        })
        this.ws.on('message', (message:string) => {
            console.log('\n>>>>>>>>>>>>>>>>>>>>>>>>>>  WSCLIENT message', message.toString())
            this.handleEvent('data', message)
        })
    }
    send(data:any) {
        console.log('<<<<<<<<<<<<<<<<<<<<<\n')
        console.log(">>WSCLIENT sending", data.toString())
        this.ws.send(data)
    }

    end(code:number = 1000) {
        console.log('client ending with code ', code)
        this.ws?.close(code)
    }

    on(event:string, handler:ClientEventHandler) {
        this.eventMap[event] = handler
    }
    handleEvent(event:string, data:any) {
        console.log("WSCLIENT on", event)
        const fn = this.eventMap[event]
        if(fn) {
            console.log("WSCLIENT executing", fn)
            try {
                fn(data)
            } catch(e) {
                console.error(e)
            }
        }
    }
}

export async function connectClient(service:string):Promise<WSClient> {
    console.log('connecting to', service)
    const client = new WSClient()
    return new Promise(resolve => {
        client.on('connect', (data:any) => {
            console.log('connected to ', service)
            resolve(client)
        })
        client.connect(service)
    })
}

let rcount = 1
let code = 1000
export function clientTest(service:string):Promise<number> {
    return new Promise(resolve => {
        console.log('starting client test')
        connectClient(service).then((client:any) => {
            client.on('close', (data:any) => {
                if(data.code === 1000) {// normal close
                    console.log('client closed normally', data.reason)
                } else {
                    console.warn('client closed abnormally', code, data.reason)
                }
            })
            client.on('data', (data:any) => {
                const directive = data.toString()

                const reply = executeDirective(directive)
                Promise.resolve(reply).then((res:string) => {
                    const srep = `${rcount}:${directive}=${res}`
                    rcount++
                    console.log('replying ', srep.substring(0, 80))
                    client.send(srep)
                    if(directive === 'end') {
                        console.log("detecting end in clientTest, so ending")
                        client.end()
                        resolve(code)
                    }
                })
            })
        })
    })
}

