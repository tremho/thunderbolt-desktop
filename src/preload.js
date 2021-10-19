
// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})


const {
  contextBridge,
  ipcRenderer
} = require("electron");


const {AppGateway} = require('./AppGateway')

const extResponders = {}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object

const fnames = AppGateway.getFunctionNames()
const api = {}
let nextId = 1;
const responders = {}
let nextMessageListenerId = 1;
const messageListeners = {};

class Responder {
  constructor() {
    this.id = nextId++
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      responders[this.id] = this;
    })
  }
  respond(value) {
    delete responders[this.id]
    this.resolve(value)
  }
  error(e) {
    delete responders[this.id]
    // console.error(e.stack)
    this.reject(e)
  }
}

fnames.forEach(fname => {
  api[fname] = function (...args) {

    const resp = new Responder()
    const data = {
      id: resp.id,
      args
    }
    ipcRenderer.send(fname, data)
    ipcRenderer.on(fname, (event, data) => {
      // console.log(`in response handler for ${fname} ${data.id}`)
      const respIn = responders[data.id]
      if(respIn) {
        if (data.error) {
          respIn.error(data.error)
        } else {
          respIn.respond(data.response)
        }
      }
    })
    return resp.promise.catch(e => {
      const respIn = responders[data.id]
      if(respIn) respIn.error(e)
    })
  }
})

ipcRenderer.on('message', (event, data) => {
  const msgName = data.name
  const msg = data.data
  // console.log('ipcRenderer hears message ', msgName, msg)
  const lsts = messageListeners[msgName] || []
  for(let i=0; i<lsts.length; i++) {
    try {
      lsts[i].callback(msg)
    } catch(e) {
      console.error(`Error processing ${msgName}, `, msg ,e)
    }
  }
})

/**
 * Add a message listener.  Returns an Id used to unlisten.
 * @param msgName
 * @param callback
 * @returns {number}
 */
api.addMessageListener = (msgName, callback) => {
  if(!messageListeners[msgName]) messageListeners[msgName] = []
  const id = nextMessageListenerId++
  messageListeners[msgName].push({id, callback})
  return id;
}

/**
 * Remove a message listener. Must supply message name and listener id.
 * @param msgName
 * @param id
 * @returns {boolean} true if successfully removed.
 */
api.removeMessageListener = (msgName, id) => {
  let lsts = messageListeners[msgName] | []
  for(let i=0; i< lsts.length; i++) {
    if(lsts[i].id === id) {
      messageListeners[msgName] = lsts.splice(i,1)
      return true;
    }
  }
  return false;
}

// BackExtensions listener
ipcRenderer.on('extApi', (event, data) => {
  const {id, response, error} = data
  // console.log(`in BackExtensions response handler for id ${id}`)
  const respIn = extResponders[id]
  if(respIn) {
    // console.log(respIn)
    if (error) {
      respIn.reject(error)
    } else {
      respIn.resolve(response)
    }
  }
})

const extAccess = {
  getExtResponders() { return extResponders},
  addResponder(id, resp) { extResponders[id] = resp},
  getResponder(id) { return extResponders[id] },
  removeResponder(id) { delete extResponders[id]}
}

/*
TestXchg -- test api calls from back end to app and gets responses
 */

// Test exchange response listener #B
ipcRenderer.on('testXchg', (event, data) => {
  const {id, request, params} = data
  console.log('testXchg B: ', id, request, params)

  let response, error;z
  try {
    response = callTestExchange(request, params)
    if(response.then) {
      response.then((presp) => {
        event.sender.send('testXchg', {id, response: presp})
      })
      return
    }
  } catch (e) {
    error = e;
  }
  event.sender.send('testXchg', {id, response, error})
})

contextBridge.exposeInMainWorld("api", api);
contextBridge.exposeInMainWorld('ipcRenderer', ipcRenderer)
contextBridge.exposeInMainWorld('extAccess', extAccess)

function callTestExchange(request, params) {
  console.log('>>>> preload stub callTestExchange', request, params)
  return 'echo back '+request
}

// console.log('preload loaded successfully')

