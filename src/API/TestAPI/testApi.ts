
import {WSClient, clientTest} from "./WSClient"

export async function startTest(host:string = 'localhost') {
    return new Promise(resolve => {
        let service = "ws://"+host+":51610"

        clientTest(service).then((code:number) => {
            console.log('done', code)
            resolve(code)
        })
    })
}
