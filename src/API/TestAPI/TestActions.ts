
/*
    THINGS TO DO IN TEST

 read value from model
 set a model value
 select a component on a page
  - and give it a variable name
  - reference by variable name
 read a property value from a component
 set the class for a component
 perform an action at a component
 call a function on the page
 navigate to a named page
 wait

 perform a menu action
 perform a tool action

 take + record screenshot

*/

import {AppGateway} from "../../AppGateway";
//
// function callTestRequest(request:string, params:string[]) {
//     console.log('able to call test from here', request, params)
//     if(request === 'readModelValue') {
//         return readModelValue(params[0])
//     }
// }
//
// async function sendTestRequest(request:string, params:string[]) {
//     setTestRequestRelay(callTestRequest)
//     const resp = await AppGateway.sendTestRequest(request, params)
//     return resp
//
// }

export async function readModelValue(modelPath:string) {
    console.log('TestActions readModelValue is calling AppGateway to relay to front')
    const resp = await AppGateway.sendTestRequest('readModelValue', [modelPath])
    console.log('response from AppGateway is', resp)
    return resp
}