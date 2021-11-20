
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
let rptStart = Date.now()
function record(action:string, result:any) {

    let raw = Date.now() - rptStart;
    let ms:any = raw % 1000
    let secs:any = Math.floor(raw/1000)
    let min:any = '' + Math.floor(secs/60)
    secs = '' + (secs % 60)
    ms = ''+ms
    while(ms.length < 3) {
        ms = '0'+ms
    }
    while(secs.length < 2) {
        secs = '0' + secs
    }
    while(min.length < 3) {
        min = '\u00A0'+min
    }
    let ts = `${min}:${secs}:${ms}`
    ts = ts.trim();
    let rline = `        <li class--"rline">`
    rline += `<span class--"ts">${ts}</span><span class--"act">${action}</span>`
    if(action.substring(0,10) === 'screenshot') {
        let name = result.substring(result.lastIndexOf('/')+1, result.lastIndexOf('.'))
        rline += `<div><img src--"${result}" height="100px"><p class--"cap">${name}</p></div>`
    } else {
        rline += `<span class--"res">${result}</span>`
    }
    rline += '</li>'

    report += rline
    console.log('report line', rline)
}

function startReport(title:string, ordinal:number) {
    let ddt = new Date().toLocaleString()

    console.log('------ starting report')

    if(!ordinal) {
        console.log('sanity check: report should be empty', report === '')
    }

    if(!ordinal) report = `
<html>
    <head>
    <title>Test Report ${ddt}</title>
    <style>
        .ts {
            background-color: gold;
            color: black;
            font-family: monospace;
        }
        .act {
            padding-left: 1em;
            padding-right: 1em;
        }
        .res {
            color:green;
        }
    </style>
    </head>
    <body>
`
    if(ordinal) endReportSection()
    startReportSection(ordinal, title)
}

function startReportSection(ordinal:number, title:string) {

    console.log('-------starting report section for '+title)

    report += `
    <hr>
    <h3>${ordinal+1}) ${title}</h3>
    <ul>        
`

}
function endReportSection() {
    console.log('---- ending report section')
    report += `
    </ul>
    <br/>    
    `
}

function endReport() {
    console.log('---- ending report')
    if(report) {
        endReportSection()
        report += `
    </body>
    </html>
`
    }
}

export function getReport() {
    endReport()
    const rpt = report
    report = ''
    rptStart = Date.now()
    console.log('returning report', rpt)
    return rpt
}

export async function executeDirective(action:string):Promise<string> {
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
        case 'startReport': {
            const count = Number(arg1)
            const title = parts.slice(2).join(' ')
            res = startReport(title, count)
        }
        return Promise.resolve(res)
        case 'getReport': {
            res = getReport()
        }
        return Promise.resolve(res)
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
