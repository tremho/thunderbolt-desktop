
import WebSocket from 'ws'
import {executeDirective, getReport} from "./PoCActions";
export type ClientEventHandler = (data:any) => void

export class WSClient {
    ws:WebSocket = (null as unknown as WebSocket)
    eventMap:any = {}

    connect(serviceUrl:string) {
        this.ws = new WebSocket(serviceUrl)
        this.ws.on('open', () => {
            this.handleEvent('connect', serviceUrl)
        })
        this.ws.on('message', (message:string) => {
            this.handleEvent('data', message)
        })
    }
    send(data:any) {
        this.ws.send(data)
    }

    end(code:number = 1000) {
        this.ws?.close(code)
    }

    on(event:string, handler:ClientEventHandler) {
        this.eventMap[event] = handler
    }
    handleEvent(event:string, data:any) {
        const fn = this.eventMap[event]
        if(fn) {
            fn(data)
        }
    }
}

export async function connectClient(service:string):Promise<WSClient> {
    console.log('connecting to', service)
    const client = new WSClient()
    return new Promise(resolve => {
        client.on('connect', (data:any) => {
            resolve(client)
        })
        client.connect(service)
    })
}

let rcount = 1
let code = 1000
export async function clientTest(service:string):Promise<number> {
    return new Promise(resolve => {
        console.log('starting client test')
        connectClient(service).then((client:any) => {
            client.on('data', (data:any) => {
                const directive = data.toString()
                console.log('received directive', directive)
                if(directive === 'end')  {
                    // todo: we should get an overall test report and a code from this end and report it.
                    client.send(`${rcount}:${directive}=${code}`)
                    client.end(code)
                    resolve(code)
                }
                const reply = executeDirective(directive)
                Promise.resolve(reply).then((res:string) => {
                    const srep = `${rcount}:${directive}=${res}`
                    rcount++
                    console.log('replying ', srep)
                    client.send(srep)
                })
            })
        })
    })
}

