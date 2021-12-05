
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

function PathNotFound(path:string) {
    class PathNotFound extends Error {
        constructor(path:string) {
            super(`Path ${path} does not exist`)
        }
    }
    return new PathNotFound(path)
}

export function getAppPath():string {
    let appPath = process.cwd()
    if(!appPath) {
        return './'
    }
    return appPath.substring(0, appPath.lastIndexOf('/'))
}



export function readFileText(pathName:string):string {
    try {
        return fs.readFileSync(pathName).toString()
    } catch(e:any) {
        console.error(e.message)
        throw e
    }
}
export function readFileJson(pathName:string):string {
    let out:string = readFileText(pathName)
    try {
         out = JSON.parse(out)
    } catch(e:any) {}
    return out
}

export function fileExists(pathName:string):boolean {
    return fs.existsSync(pathName)
}

export function readFileArrayBuffer(pathName:string):ArrayBuffer {
    return fs.readFileSync(pathName).buffer
}

export function writeFileText(pathName:string, text:string) {
    try {
        fs.writeFileSync(pathName, text)
    } catch(e:any) {
        console.error(e.message)
        throw e
    }
}

export function writeFileArrayBuffer(pathName:string, data:ArrayBuffer) {
    try {
        fs.writeFileSync(pathName, new Uint8Array(data))
    } catch(e:any) {
        console.error(e.message)
        throw e
    }
}

export function fileDelete(pathName:string) {
    try {
        fs.unlinkSync(pathName)
    } catch(e:any) {
        console.error(e.message)
        throw e
    }
}

export function fileMove(pathName:string, newPathName:string) {
    try {
        fs.renameSync(pathName, newPathName)
    } catch(e:any) {
        console.error(e.message)
        throw e
    }
}

export function fileRename(pathName:string, newBase:string) {
    newBase = newBase.substring(newBase.lastIndexOf(path.sep)+1)
    const atPath = pathName.substring(0, pathName.lastIndexOf(path.sep)+1)
    const newPath = path.join(atPath, newBase)
    fileMove(pathName, newPath)
}

export function fileCopy(pathName:string, toPathName:string) {
    try {
        fs.copyFileSync(pathName, toPathName)
    } catch(e:any) {
        console.error(e.message)
        throw e
    }
}

export class FileDetails  {
    parentPath: string = ''
    fileName:string = ''
    mtimeMs:number = 0
    size:number = 0
    type:string = '' // file|folder|pipe|socket|blkdevice|chrdevice|symlink
}

export function fileStats(pathName:string) : FileDetails {
    try {
        const fd = new FileDetails()
        const stats = fs.lstatSync(pathName)
        fd.fileName = pathName.substring(pathName.lastIndexOf('/')+1)
        fd.parentPath = pathName.substring(0, pathName.lastIndexOf('/'))
        fd.size = stats.size
        fd.mtimeMs = stats.mtimeMs
        if(stats.isFile()) fd.type = 'file'
        if(stats.isDirectory()) fd.type = 'folder'
        if(stats.isFIFO()) fd.type = 'pipe'
        if(stats.isSocket()) fd.type = 'socket'
        if(stats.isBlockDevice()) fd.type = 'blkdevice'
        if(stats.isCharacterDevice()) fd.type = 'chrdevice'
        if(stats.isSymbolicLink()) fd.type = 'symlink'
        return fd
    } catch(e:any) {
        console.error(e.message)
        throw e
    }
}

export function createFolder(pathName:string) {
    try {
        fs.mkdirSync(pathName, {recursive: true})
    } catch(e:any) {
        console.error(e.message)
        throw e
    }
}

export function removeFolder(pathName:string, andClear:boolean) {

    try {
        fs.rmSync(pathName, {recursive:andClear})
    } catch(e:any) {
        console.error(e.message)
        throw e
    }
}

export function readFolder(pathName:string):FileDetails[] {
    const details:FileDetails[] = []

    const entries = fs.readdirSync(pathName)
    entries.forEach((name:string) => {
        const det = new FileDetails()
        det.parentPath = pathName
        det.fileName = name
        const entry = fs.lstatSync(path.join(pathName, name))
        det.size = entry.size
        det.mtimeMs = entry.mtimeMs
        if(entry.isFile()) det.type = 'file'
        if(entry.isDirectory()) det.type = 'folder'
        if(entry.isFIFO()) det.type = 'pipe'
        if(entry.isSocket()) det.type = 'socket'
        if(entry.isBlockDevice()) det.type = 'blkdevice'
        if(entry.isCharacterDevice()) det.type = 'chrdevice'
        if(entry.isSymbolicLink()) det.type = 'symlink'
        details.push(det)
    })
    return details
}

class UserPathInfo {
    home:string = ''
    cwd:string = ''
    assets:string = ''
    appData:string = ''
    documents:string = ''
    downloads:string = ''
    desktop:string = ''
    userName:string = ''
    uid:Number | undefined
    gid:Number | undefined
}
export function getUserAndPathInfo(appName:string): UserPathInfo {
    const userInfo = os.userInfo()
    const out = new UserPathInfo()
    out.home = userInfo.homedir
    out.cwd =  process.cwd()
    let res = path.join(out.cwd, 'resources', 'app.asar.unpacked') // if we are packaged
    if(!fs.existsSync(res)) {
        res = path.join(out.cwd, 'front') // if we aren't packaged
    }
    res = path.join(res, 'assets')
    if(fs.existsSync(res)) {
        out.assets = res  // out.assets will be undefined if we can't locate assets folder
    }
    out.userName = userInfo.username
    out.uid = userInfo.uid
    out.gid = userInfo.gid

    if(appName) {
        if (os.platform() === 'win32') {
            let appData = path.join(out.home, 'appData', 'Roaming', appName)
            if(fs.existsSync(appData)) {
                out.appData = appData
            }
            let documents = path.join(out.home, 'Documents')
            if(fs.existsSync(documents)) {
                out.documents = documents
            }
            let downloads = path.join(out.home, 'Downloads')
            if(fs.existsSync(downloads)) {
                out.downloads = downloads
            }
            let desktop = '\\Users\\Public\\Desktop'
            if(fs.existsSync(desktop)) {
                out.desktop = desktop
            }
        } else if (os.platform() === 'darwin') {
            let appData = path.join(out.home, 'Library', 'Application Support', appName)
            if(fs.existsSync(appData)) {
                out.appData = appData
            }
            let documents = path.join(out.home, 'Documents')
            if(fs.existsSync(documents)) {
                out.documents = documents
            }
            let downloads = path.join(out.home, 'Downloads')
            if(fs.existsSync(downloads)) {
                out.downloads = downloads
            }
            let desktop = path.join(out.home, 'Desktop')
            if(fs.existsSync(desktop)) {
                out.desktop = desktop
            }
        }

    }

    return out
}