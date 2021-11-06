
import WebSocket from 'ws'
import {executeDirective, getReport} from "./PoCActions";

console.log('hello client')


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
        this.ws.close(code)
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
export async function clientTest(service:string) {
    let sessionResolve:any
    console.log('starting client test')
    const client = await connectClient(service)
    client.on('data', (data:any) => {
        const directive = data.toString()
        console.log('received directive', directive)
        if(directive === 'end')  {
            // todo: we should get an overall test report and a code from this end and report it.
            client.send(`${rcount}:${directive}=${code}`)
            client.end(code)
            if(sessionResolve) sessionResolve(code)
        }
        const reply = executeDirective(directive)
        Promise.resolve(reply).then((res:string) => {
            if( (res.charAt(0) === '{' && res.charAt(res.length-1) === '}')
             || (res.charAt(0) === '[' && res.charAt(res.length-1) === ']')) {
                try {
                    res = JSON.parse(res)
                } catch(e) {
                    console.warn(e)
                }
            }
            const srep = `${rcount}:${directive}=${res}`
            rcount++
            console.log('replying ', srep)
            client.send(srep)
        })
    })
    return new Promise(resolve => {
        sessionResolve = resolve
        console.log('client connected')
    })
}

