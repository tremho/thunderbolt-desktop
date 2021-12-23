
// import {MenuItem} from './application/MenuApi'
class MenuItem {
    public label:string = ''
    public id:string = ''
}

import * as electron from 'electron'
const Menu = electron.Menu;
const EMenuItem = electron.MenuItem
import {AppGateway} from "../AppGateway";

const nativeImage = require('electron').nativeImage;

let menus = {}

export function resetMenu() {
    menus = {}
}

export function openDevTools() {
    electron.BrowserWindow.getAllWindows()[0].webContents.openDevTools()
}

export function addMenuItem(menuId:string, item:MenuItem, position?:number) {

    let n = menuId.indexOf('-')
    if (n === -1) n = menuId.length;
    const menuName = menuId.substring(0, n)
    try {
        // @ts-ignore
        if (!menus[menuName]) {
            // @ts-ignore
            menus[menuName] = Menu.buildFromTemplate([]) // create a new menu of this name
        }
        const parentItem = getSubmenuFromId(menuId)
        const curMenu = parentItem.submenu || parentItem
        if (curMenu) {
            const emi = convertMenuItem(item)

            if (position === undefined) {
                curMenu.append(emi)
            } else {
                curMenu.insert(position, emi)
            }
        }
        setToMenuBar(menuName)

    } catch(e) {
        console.error("Unable to create menu bar menu "+menuName, e)
    }

}
function convertMenuItem(item:any) {
    const dmi:any =  {
        label: item.label,
        role: item.role,
        id: item.id,
        type: item.type,
        sublabel: item.sublabel,
        tooltip: item.tooltip, // only for mac, but I'm not seeing evidence of it working!
        enabled: !item.disabled,
        checked: item.checked,
        accelerator: item.accelerator,
        click: onMenuItem
    }
    dmi.tooltip = 'this is a tooltip' // todo: tooltip is not really supported. Drop from documented features and API exposure.
    if(item.icon) {
        // console.log('setting icon to ',item)
        try {
            let width = 16
            let height = 16
            if(item.iconSize && Array.isArray(item.iconSize)) {
                width = item.iconSize[0] || width
                height = item.iconSize[1] || width
            }
            // for web-context, assets always come from front/assets (use getUserPathInfo('').assets for back process contexts)
            let path = 'front/assets/'+item.icon
            dmi.icon = nativeImage.createFromPath(path).resize({width, height})
        } catch(e) {
            console.error("Unable to apply icon "+item.icon, e)
        }
    }
    if(item.label === '--') {
        dmi.type = 'separator'
        delete dmi.label
    }
    if(item.children) {
        dmi.type = 'submenu'
        let smpath = item.path;
        const submenu:any = []
        item.children.forEach((smi:any) => {
            submenu.push(convertMenuItem(smi))
        })
        dmi.submenu = submenu
    }
    let rt
    try {
        rt = new EMenuItem(dmi)
    }
    catch(e) {
        console.error("Error converting menu item", item, e)
    }
    return rt
}
function getSubmenuFromId(menuId:string) {
    let n = menuId.indexOf('-')
    if(n === -1) n = menuId.length
    let menuName = menuId.substring(0, n)
    // @ts-ignore
    let topItem = menus[menuName]
    if(!topItem) {
        console.error('menuId may not be complete ', menuId)
        throw Error('MENU NOT FOUND: '+menuName)
    }
    const parts = menuId.split('-');
    if(!topItem.items) topItem.items = []
    let curMenu = topItem.items
    let parentItem = topItem;
    let pid = menuName
    for(let i=1; i<parts.length; i++) {
        pid = parts[i]
        for (let c = 0; c < curMenu.length; c++) {
            let cmitem = curMenu[c]
            if (cmitem.id === pid) {
                parentItem = cmitem;
                curMenu = (cmitem.submenu && cmitem.submenu.items) || cmitem.items
                break;
            }
        }
    }
    return parentItem
}

export function getMenuItem(itemId:string) {
    // @ts-ignore
    let topItem = menus['main']
    if(!topItem) {
        throw Error('MENU NOT FOUND')
    }
    const findItem = (children:any[]):MenuItem|undefined => {
        for (let ch of children) {
            if (ch.id === itemId) {
                return ch
            }
            if (ch.children?.length) {
                let rt: MenuItem | undefined = findItem(ch.children)
                if (rt) return rt;
            }
        }
    }
    return findItem(topItem.children || [])

}

export function enableMenuItem(menuId:string, itemId:string, enabled: boolean) {
    const parentItem = getSubmenuFromId(menuId)
    const children = (parentItem.submenu && parentItem.submenu.items) || parentItem.items || []
    for(let i=0; i< children.length; i++) {
        let item = children[i]
        if(item.id === itemId) {
            item.enabled = enabled
            break;
        }
    }
}

export function checkMenuItem(itemId:string, checked: boolean) {
    const item:any = getMenuItem(itemId)
    if(item) {
        if(item.id === itemId) {
            item.checked = checked
        }
    }
}

export function deleteMenuItem(menuId:string, itemId:string) {
    const parentItem = getSubmenuFromId(menuId)
    const children = (parentItem.submenu && parentItem.submenu.items) || parentItem.items
    for(let i=0; i< children.length; i++) {
        let item = children[i]
        if(item.id === itemId) {
            item.id = '' // can't actually remove, just hide and take away it's identifier
            item.visible = false
            break;
        }
    }
}

export function changeMenuItem(menuId:string, itemId:string, updatedItem:MenuItem) {
    const parentItem = getSubmenuFromId(menuId)
    const children = (parentItem.submenu && parentItem.submenu.items) || parentItem.items || []
    for(let i=0; i< children.length; i++) {
        let item = children[i]
        if(item.id === itemId) {
            item.label = updatedItem.label
            item.id = updatedItem.id
            item.visible = true
            break;
        }
    }
}

export function clearMenu(menuId:string) {
    const parentItem = getSubmenuFromId(menuId)
    const children = (parentItem.submenu && parentItem.submenu.items) || parentItem.items
    for(let i=0; i< children.length; i++) {
        let item = children[i]
        item.id = '' // can't actually remove, just hide and take away it's identifier
        item.visible = false
    }
}

function onMenuItem(item:MenuItem, browserWindow:any, event:any) {
    let id = item.id
    // console.log('Clicked on Desktop menu item '+id)
    AppGateway.sendMessage('EV', {subject: 'menuAction', data: id})
}

/**
 * When all items have been added to menu template, this
 * realizes it into the menu bar
 *
 * Note: Node will issue a warning about more then 10 listeners with scary references to a memory leak.
 * This can be ignored; it is just a warning about what might otherwise be a clue to uncleared listeners.
 * We can't mitigate this without access to the Emitter object used by Electron, so I think we are out of luck there.
 * It's just a warning; deal with it in documentation (not happy)
 */
export function setToMenuBar(menuName:string) {
    // @ts-ignore
    const menu = menus[menuName]
    Menu.setApplicationMenu(menu)
}

