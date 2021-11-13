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
    // console.log('websend preparing', request.method+' '+request.endpoint)
    uni = uni[request.method](request.endpoint)
    uni=uni.headers(request.headers)
    // possible todo: format parameters into body for a form post instead of query line, and/or use some other semantic (options?) in case we want both.
    uni=uni.query(request.parameters)
    uni=uni.type(request.type)
    // console.log('websend sending ')
    return uni.send(request.body).then((result:any) => {
        resp.code = result.code
        resp.statusType = result.statusType
        resp.headers = result.headers
        resp.body = result.body
        // console.log('returning resp', resp)
        return resp
    })
}
