// implemented with nom unirest module
const unirest = require('unirest')

/**
 * Structure of object for a Web Request
 */
class WebRequest {
    endpoint:string = ''
    method: string = ''
    headers: object = {} // key-value object
    parameters: Parameter[] = []
    body?: string;
    type: string = ''
}

/**
 * Structure of an object for a Parameter
 */
class Parameter {
    name:string = ''
    value: string = ''
}

/**
 * Status types enum
 * (a direct mapping of unirest statusType values)
 */
enum StatusType {
    None,
    Info,
    Ok,
    Misc,
    ClientError,
    ServerError
}

/**
 * Structure of object for a Web Response
 */
class WebResponse {
    code: number = 0
    statusType: StatusType = StatusType.None
    headers: object = {} // key value
    body: string = ''
}

/**
 * Send a request and get the response
 * @param request
 */
export function webSend(request:WebRequest) : Promise<WebResponse> {
    const resp = new WebResponse()
    let uni = unirest
    console.log('websend preparing')
    uni = uni[request.method](request.endpoint)
    uni=uni.headers(request.headers)
    if(request.parameters) {
        for (let i = 0; i < request.parameters.length; i++) {
            const param = request.parameters[i]
            const uq: any = {}
            uq[param.name] = param.value
            console.log('parameter '+i, uq)
            uni = uni.query(uq)
        }
    }
    uni=uni.type(request.type)
    console.log('websend sending ')
    return uni.send(request.body).then((result:any) => {
        console.log('result = ',result)
        resp.code = result.code
        resp.statusType = result.statusType
        resp.headers = result.headers
        resp.body = result.body
        console.log('returning resp', resp)
        return resp
    })
}
