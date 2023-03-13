const play = require('audio-play')
const load = require('audio-loader')
import {getUserAndPathInfo} from "./FileAPI";

const soundSets:any = {}

/**
 * Loads a set of sound files from a simple object where object keys and values
 * hold identifiers and pathnames respectively
 * The resulting audio buffers are stored under "name".
 * In return, an object with the same keys, but with the path values having been
 * replaced by AudioBuffer data from the file path or url the path represented
 * instead of the strings of the path / url of the incoming set.
 * @param name Name to store the set buffers and refer to the set by
 * @param set A set of identifiers:pathnames as a simple prop:value object
 * @return Promise<any> Resolving to a set of identifiers/buffers.
 */
export function createSoundSet(name:string, set:object):Promise<any> {
    console.log(">> audio createSoundSet", {name, set})
    const userPaths = getUserAndPathInfo("audioApi");
    const aset = set as any;
    for(let prop of Object.getOwnPropertyNames(aset)) {
       let v = aset[prop];
        if(v.charAt(0) !== '/') {
            let nv = userPaths.assets;
            if(nv.charAt(nv.length-1) !== '/') nv += '/'
            aset[prop] = nv + v;
        }
    }
    console.log("extended set", set);
    return load(set).then((bufs: any) => {
        soundSets[name] = bufs;
        console.log("soundSets", soundSets);
    })
}

/**
 * Plays an item by name from the set of stashed buffers.
 * Returns a {promise, pause} object whose promise will resolve at end of play
 * and pause can be used as a call to pause the playback.
 * When pause is called, it returns a call for a resume() function that
 * can resume playback, which in turn returns another pause() function.
 * @param setName
 * @param itemName
 * @param [volume] defaults to 1.0
 * @param [loop] defaults to false
 */
export function playSoundItem(setName:string, itemName:string, volume = 1, loop = false):{promise:Promise<any>, pause:any} {
    console.log(">> audio playSoundItem", {setName, itemName, volume, loop})
    let pause
    const setBufs = soundSets[setName];
    const buffer = setBufs ? setBufs[itemName] : null;
    console.log("setbuffers from soundsets ", setBufs)
    if(!buffer) {
        console.log("throwing...");
        throw "Buffer not found in audio set for "+setName+":"+itemName;
    }
    console.log("continuing...");
    buffer.sampleRate = buffer.sampleRate * buffer.numberOfChannels
    const opts = {
        start: 0,
        end: buffer.duration,
        loop: loop,
        rate: 1,
        detune: 0,
        volume: volume,
        device: 'hw:1,0',
        autoplay: true
    }

    let resolver:any;
    const promise =  new Promise(resolve => {
        resolver = resolve;
    });
    console.log("Audio Playing:", {itemName, length:opts.end, volume, loop})
    try {
        pause = play(buffer, opts, () => {
            console.log("play is done, resolving");
            resolver();
        });
    }
    catch(e) {
        console.error("Audio Play exception", e);
    }
    // pause = null; // perhaps we can't do it this way.
    return {promise, pause}
}
