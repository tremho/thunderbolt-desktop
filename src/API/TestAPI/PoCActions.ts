
import * as testActions from './TestActions'
import path from 'path'

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
    rline += `<span class="ts">${ts}</span><span class="act">${action}</span>`
    if(action.substring(0,10) === 'screenshot') {
        let name = result.substring(result.lastIndexOf('/') + 1, result.lastIndexOf('.'))
        rline += `<div><img class="ss" src="${result}"><p class="cap">${name}</p></div>`
    } else if(action === 'compareReport') {
        // TODO: Format an rline of 2 imgs: comp, diff with a stats line underneath
        // send compareReport with a formatted result line
        let [imgName, pctDiff] = result.split(',')
        let plat = 'electron'
        let cpath = path.join('report', 'comp', plat, imgName+'.png')
        let dpath = path.join('report', 'latest', plat, 'images', imgName+'-diff.png')
        let stats = `Image ${imgName} differs ${pctDiff}% from comp`
        rline += `<div><img class="cs" src="${cpath}"><img class="df" src="${dpath}><p class="cap">${stats}</p></div>"`
    } else {
        rline += `<span class="res">${result}</span>`
    }
    rline += '</li>'

    report += rline
    // console.log('report line', rline)
}

function startReport(title:string) {
    let ddt = new Date().toLocaleString()

    // console.log('------ starting report')

    if(!report) report = `
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
        .ss {
            width: 50%;
            margin-left: 20%;            
        }
        .cap {
            font-style: italic;
            color: gray;
        }
    </style>
    </head>
    <body>
`
    startReportSection(title)
}

function startReportSection(title:string) {

    // console.log('-------starting report section for '+title)

    report += `
    <hr>
    <h3>${title}</h3>
    <ul>        
`

}
function endReportSection() {
    // console.log('---- ending report section')
    report += `
    </ul>
    <br/>    
    `
}

function endReport() {
    // console.log('---- ending report')
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
    const rpt = report.replace(/=/g, '--') // change equal sign in flight to avoid parse issues on other side; reconstruct on receipt
    report = ''
    rptStart = Date.now()
    // console.log('returning report', rpt)
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
            const title = parts.slice(2).join(' ')
            res = startReport(title)
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
        console.log(action + ' directive returns', rec)
        return rec
    })
}
