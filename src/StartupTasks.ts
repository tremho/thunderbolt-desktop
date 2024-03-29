
/*
Startup tasks invoked via common/index for Desktop
prepare environment info
 */

import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

import {AppGateway} from "./AppGateway";

let passedEnvironment = {}

export function readBuildEnvironment() {
    let be = {}

    console.log('>>$$$$ in readBuildEnvironment ')

    // get the native launch directory
    let nld = process.cwd()
    console.log('-------------------------')
    console.log('starting path conditions')
    console.log('current', process.cwd())
    console.log('argv', process.argv)
    console.log('argv0', process.argv0)
    let startPath = process.argv[0]
    if(startPath.indexOf('.app/Contents/MacOS/') !== -1) {
        startPath = path.join(startPath.substring(0, startPath.lastIndexOf('/')), '..', 'Resources')
        startPath = path.normalize(startPath)
        console.log('startPath ', startPath)
        if(fs.existsSync(path.join(startPath, 'app.asar.unpacked'))) {
            console.log('found our way to app.asar.unpacked')
            process.chdir(path.join(startPath, 'app.asar.unpacked'))
        }
    }
    console.log('=========================')


    // determine our launchDir based on this path
    let scriptPath = __dirname
    // find ourselves in this path
    let n = scriptPath.indexOf('/node_modules/@tremho/jove-common')
    let launchDir;
    if (n !== -1) {
        launchDir = scriptPath.substring(0, n)
    }
    // read BuildEnvironment.json from launchDir
    if (!launchDir) {
        // assume we were launched from the current directory
        launchDir = '.'
    }
    launchDir = path.resolve(launchDir)
    console.log('>>>>>>>>>> LaunchDir determined to be ', launchDir)
    if (launchDir.substring(launchDir.length - 5) === '.asar') {
        launchDir += '.unpacked'
        console.log('>>>>>>>>>> LaunchDir determined to be ', launchDir)

        process.chdir(launchDir) // so we are in sync from now on
        console.log('>>>>>>>>>> reset cwd', process.cwd())
    } else {
        const lookFor = path.join(launchDir, 'resources', 'app.asar.unpacked')
        if (fs.existsSync(lookFor)) {
            // this will be a case on Windows
            launchDir = lookFor
            console.log('>>>>>>>>>> cwd moving to ', launchDir)
            process.chdir(launchDir) // so we are in sync from now on
        } else {
            console.log('>>>>>>>> Not changing cwd', process.cwd())
        }
    }

    let beFile ='BuildEnvironment.json'
    let text = ''

    let exists = fs.existsSync(beFile)
    console.log(beFile + ' exists? ', exists)
    if(exists) {
        try {
            text = fs.readFileSync(beFile).toString()
            if (text) {
                be = JSON.parse(text)
            } else {
                console.error(beFile + ' Does not exist')
                be = {
                    error: "Unable to locate " + beFile,
                }
            }
        } catch (e:any) {
            console.error('Unable to read ' + beFile, e)
            be = {
                error: "Unable to read " + beFile,
                errMsg: e.message
            }
        }
    }
    console.log('returning build environment data as ', be)
    return mergeRuntimeInformation(be)
}
function mergeRuntimeInformation(buildEnv:any) {
    let platName = process.platform
    let platVersion = os.version()
    let platType = 'Computer'
    let platMan
    let platHost
    let platHostVersion

    const env = {
        build: buildEnv,
        runtime: {
            framework: {
                node:  process.versions.node,
                electron: process.versions.electron
                // riot: 5.1.4 --> filled in next phase
            },
            platform: {
                type: platType,
                name: platName, // darwin, win32, etc (or NativeScript)
                version: platVersion, // version of os (not defined for NS)
            }
        }
    }
    passedEnvironment = env
    return env
}

export function passEnvironmentAndGetTitles(): { appName:string, title:string } {
    console.log('passedEnvironment', passedEnvironment)
    AppGateway.sendMessage('EV', {subject:'envInfo', data:passedEnvironment})

    let env:any = passedEnvironment
    if(!env.build || !env.build.app) {
        throw Error('missing build environment data')
    }
    let appName = (env.build.app && env.build.app.name) || 'jove-app'
    let title = env.build.app.displayName || appName
    console.log('... appName, title', appName, title)
    return {appName, title}
}

