
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

export async function readModelValue(modelPath:string) {
    // console.log('TestActions readModelValue is calling AppGateway to relay to front')
    const resp = await AppGateway.sendTestRequest('readModelValue', [modelPath])
    // console.log('response from AppGateway is', resp)
    return resp
}