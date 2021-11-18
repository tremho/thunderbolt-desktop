
import * as testActions from './TestActions'
import {readModelValue} from "./TestActions";

function add(num1:number, num2:number) {
    return num1+num2
}

function subtract(num1:number, num2:number) {
    return num1-num2
}

function multiply(num1:number, num2:number) {
    return num1*num2
}

function divide(num1:number, num2:number) {
    return num1/num2
}

function sayHello(to:string) {
    return "hello, "+to
}
async function doSomethingAsync():Promise<string> {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve('Okay, here I am')
        }, 2500)
    })
}

let report = ''
let rptStart = 0
function record(action:string, result:any) {

    let secs = Math.floor((Date.now() - rptStart)/1000)
    let min = Math.floor(secs/60)
    secs = secs % 60;

    report += min+':'+secs+'  '+action + ' = ' + result + '\n'
}

export function getReport() {
    const rpt = report
    report = ''
    rptStart = 0
    console.log("getReport returns", rpt)
    return rpt
}

export async function executeDirective(action:string):Promise<string> {
    if(!rptStart) rptStart = Date.now()
    // console.log('executeDirective', action)
    const parts = action.split(' ')
    const cmd = parts[0]
    const arg1 = parts[1]
    const arg2 = parts[2]
    const arg3 = parts[3]
    let res:any = ''
    switch(cmd) {
        case 'add': {
            res = add(Number(arg1), Number(arg2))
        }
        break
        case 'subtract': {
            res = subtract(Number(arg1), Number(arg2))
        }
        break
        case 'multiply': {
            res = multiply(Number(arg1), Number(arg2))
        }
        break
        case 'divide': {
            res = divide(Number(arg1), Number(arg2))
        }
        break
        case 'greet': {
            res = sayHello(arg1)
        }
        break
        case 'fetch': {
            res = await doSomethingAsync()
        }
        break;
        case 'end': {
            res = 1000
        }
        break;
        default: {
            const tactany:any = testActions
            const ta = tactany[cmd]
            // console.log('looking for testAction', cmd)
            if(typeof ta === 'function') {
                // console.log('found', cmd, ...parts.slice(1))
                res = await ta(...parts.slice(1))
                // console.log('result is ', res)
            }
        }
        break
    }
    return Promise.resolve(res).then((rec) => {
        rec = typeof rec === 'object' ? JSON.stringify(rec) : ''+rec
        record(action, rec)
        // console.log('directive returns', rec)
        return rec
    })
}
