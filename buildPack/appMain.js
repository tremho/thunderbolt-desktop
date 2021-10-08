
import * as riot from 'riot'
import * as AppFront from 'Project/joveAppFront'
import App from 'RiotMain/app.riot'
import {AppCore, setTheApp} from '@tremho/jove-common'
import registerGlobalComponents from 'BuildPack/register-global-components'

// import * as MainPage from 'Pages/main-page'

console.log('Running under Riot', riot.version)
console.log(__dirname)

console.log('registering components...')
// register
registerGlobalComponents()

// console.log('mounting app...')

// mount all the global components found in this page
riot.mount('[data-riot-component]')
const mountApp = riot.component(App)
const coreApp = new AppCore()

// Add things from here to the environment. (required)
coreApp._riotVersion = riot.version
console.log('riot version communicated to  core as ', coreApp._riotVersion)

// console.log('starting app...')
coreApp.setupUIElements(AppFront).then(() => {

    console.log('now mounting and running Riot app UI')
    mountApp(document.getElementById('root'), { app: coreApp })
    // go to main page
    coreApp.navigateToPage('main')
})


