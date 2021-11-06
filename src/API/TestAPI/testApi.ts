
import {WSClient, clientTest} from "./WSClient"

export async function startTest() {
    const client = new WSClient()
    console.log('Client starting')

    let service = "ws://localhost:51610"

    const code = await clientTest(service)

    console.log('done', code)
    client.end()
    return code
}
