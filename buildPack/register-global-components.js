
import { register } from 'riot'

const frameworkComponentsContext = require.context('FrameworkComponents', true, /[a-zA-Z0-9-]+\.riot/)
const appComponentsContext = require.context('Generated/components', true, /[a-zA-Z0-9-]+\.riot/)
const appPagesContext = require.context('Generated/Pages', true, /[a-zA-Z0-9-]+\.riot/)

function basename(path) {
  let n = path.lastIndexOf('.')
  let bp = path.substring(0, n)
  n = bp.lastIndexOf('/')
  return bp.substring(n+1)
}

export default () => {

  // console.log('>>>> REGISTER GLOBAL COMPONENTS <<<<')

  // console.log(frameworkComponentsContext)
  frameworkComponentsContext.keys().map(path => {
    // console.log(path)
    const name = basename(path, '.riot')
    const component = frameworkComponentsContext(path)

    try {
      register(name, component.default)
    } catch(e) {}

    return {
      name,
      component
    }
  })
  // console.log(appComponentsContext)
  appComponentsContext.keys().map(path => {
    // console.log(path)
    const name = basename(path, '.riot')
    const component = appComponentsContext(path)

    // we get an already registered for some reason, but can't find where else it occurs...
    // and this must be here
    try {
      // console.log('register', name, component.default)
      register(name, component.default)
    } catch(e) {}

    return {
      name,
      component
    }
  })
  // console.log(appPagesContext)
  appPagesContext.keys().map(path => {
    // console.log(path)
    const name = basename(path, '.riot')
    const component = appPagesContext(path)

    // we get an already registered for some reason, but can't find where else it occurs...
    // and this must be here or else main-page is never found.
    try {
      register(name, component.default)
    } catch(e) {}

    return {
      name,
      component
    }
  })
}
