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

// implemented with nom unirest module
const unirest = require('unirest')

export function webSend(request:WebRequest) : Promise<WebResponse> {
    const resp = new WebResponse()
    let uni = unirest
    uni = uni[request.method](request.endpoint)
    uni=uni.headers(request.headers)
    for(let i=0; i<request.parameters.length; i++) {
        const param = request.parameters[i]
        const uq:any = {}
        uq[param.name] = param.value
        uni=uni.query(uq)
    }
    uni=uni.type(request.type)
    return uni.send(request.body).then((result:any) => {
        resp.code = result.code
        resp.statusType = result.statusType
        resp.headers = result.headers
        resp.body = result.body
        return resp
    })
}
