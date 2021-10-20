
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

async function sendTestRequest(request:string, params:string[]) {
    const resp = await AppGateway.sendTestRequest(request, params)
    return resp

}

export async function readModelValue(modelPath:string) {
    const resp = await sendTestRequest('readModelValue', [modelPath])
    console.log('test response: ', resp)
    return resp
}