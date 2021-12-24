
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

/**
 * Resets teh reference container for named menus
 * internal use only.
 */
export function resetMenu() {
    menus = {}
}

/**
 * Opens the Chrome Developer Tools Window for Electron
 */
export function openDevTools() {
    electron.BrowserWindow.getAllWindows()[0].webContents.openDevTools()
}

/**
 * Adds or inserts a menu item to the system menu. Normally called from MenuAPI.
 *
 * @param {string} menuPath 'path using '-' to separate menu id's describing a positional hierarchy to a submenu location
 * @param {MenuItem} item   Item to add
 * @param {number} [position]  Optional position, if inserting an item
 */
export function addMenuItem(menuPath:string, item:MenuItem, position?:number) {

    let n = menuPath.indexOf('-')
    if (n === -1) n = menuPath.length;
    const menuName = menuPath.substring(0, n)
    try {
        // @ts-ignore
        if (!menus[menuName]) {
            // @ts-ignore
            menus[menuName] = Menu.buildFromTemplate([]) // create a new menu of this name
        }
        const parentItem = getSubmenuFromPath(menuPath)
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

/**
 * Internal function to convert a MenuItem definition into an Electron menu item
 * @param item
 */
function convertMenuItem(item:any) {
    const dmi:any =  {
        label: item.label,
        role: item.role,
        id: item.id,
        type: item.type,
        sublabel: item.sublabel,
        toolTip: item.tooltip,  // only valid for mac, and it's kinda weird. supplied via a bracket option if used.
        enabled: !item.disabled,
        checked: item.checked,
        accelerator: item.accelerator,
        click: onMenuItem
    }
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

/**
 * Locates a submenu by its path
 * @param {string} menuPath 'path using '-' to separate menu id's describing a positional hierarchy to a submenu location
 */
function getSubmenuFromPath(menuPath:string) {
    // @ts-ignore
    let topItem = menus['main']
    if(!topItem) {
        throw Error('MENU NOT FOUND')
    }
    const parts = menuPath.split('-');
    if(!topItem.items) topItem.items = []
    let curMenu = topItem.items
    let parentItem = topItem;
    let pid = 'main'
    for(let i=0; i<parts.length; i++) {
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

/**
 * Locate a menu item in the desktop menu by its unique id.
 * @param {string} itemId The menu item identifier
 *
 * @return {EMenuItem} Electron menu item
 */
export function getMenuItem(itemId:string) {
    // @ts-ignore
    let topItem = menus['main']
    if(!topItem) {
        throw Error('MENU NOT FOUND')
    }
    let found;
    const recurse = (mn:any) => {
        if(Array.isArray(mn.items)) {
            for (let m of mn.items) {
                if(m.id === itemId) {
                    found = m;
                    break;
                }
                if (m.submenu) {
                    recurse(m.submenu)
                }
            }
        }
    }
    recurse(topItem)
    return found

}

/**
 * Enables or disables a menu item.
 * Disabled items appear grayed out and cannot be selected.
 *
 * @param {string} itemId   The menu identifier to enable/disable
 * @param {boolean} enabled  `true` to enable, `false` to disable.
 */
export function enableMenuItem(menuId:string, itemId:string, enabled: boolean) {
    const item:any = getMenuItem(itemId)
    if(item) {
        if(item.id === itemId) {
            item.enabled = enabled
        }
    }
}

/**
 * Sets or unsets the checkmark for a checkbox item
 * Menu Item must be a checkbox type.
 *
 * @param {string} itemId   The menu identifier to check or uncheck.
 * @param {boolean} checked  `true` to check, `false` to uncheck.
 */
export function checkMenuItem(itemId:string, checked: boolean) {
    const item:any = getMenuItem(itemId)
    if(item) {
        if(item.id === itemId) {
            item.checked = checked
        }
    }
}

/**
 * Removes a menu item from a menu or submenu
 * @param {string} menuPath menu Path describing the submenu where the item resides
 * @param {string} itemId  the identifier of the item to be removed
 */
export function deleteMenuItem(menuPath:string, itemId:string) {
    const parentItem = getSubmenuFromPath(menuPath)
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

/**
 * Replaces a menu item with another
 * @param {string} menuPath menu Path describing the submenu where the item resides
 * @param {string} itemId  the identifier of the item to be replaced
 * @param {MenuItem} updatedItem  Defines the replacement item
 */
export function changeMenuItem(menuId:string, itemId:string, updatedItem:MenuItem) {
    const parentItem = getSubmenuFromPath(menuId)
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

/**
 * Remove a menu or submenu
 * @param {string} menuPath  The path describing the submenu location
 */
export function clearMenu(menuPath:string) {
    const parentItem = getSubmenuFromPath(menuPath)
    const children = (parentItem.submenu && parentItem.submenu.items) || parentItem.items
    for(let i=0; i< children.length; i++) {
        let item = children[i]
        item.id = '' // can't actually remove, just hide and take away it's identifier
        item.visible = false
    }
}

/**
 * This function is called internally when an item is selected from the system menu
 * @param {MenuItem} item   The item selected
 * @param {*} browserWindow Electron BrowserWindow object
 * @param {*} event Event structure
 */
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

