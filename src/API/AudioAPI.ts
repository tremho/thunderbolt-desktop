// const play = require('audio-play')
// const load = require('audio-loader')
//
// /**
//  * Loads a set of sound files from a simple object where object keys and values
//  * hold identifiers and pathnames respectively.
//  * In return, an object with the same keys, but with the path values having been
//  * replaced by AudioBuffer data from the file path or url the path represented
//  * instead of the strings of the path / url of the incoming set.
//  * @param set A se of identifiers/pathnames.
//  * @return Promise<any> Resolving to a set of identifiers/buffers.
//  */
// export function aLoadSoundSet(set:any):Promise<any> {
//     return load(set).then((bufs:any) => {
//         return bufs;
//     })
// }
//
// /**
//  * Plays an item by name from the set of stashed buffers.
//  * Returns a {promise, pause} object whose promise will resolve at end of play
//  * and pause can be used as a call to pause the playback.
//  * When pause is called, it returns a call for a resume() function that
//  * can resume playback, which in turn returns another pause() function.
//  * @param setBufs
//  * @param itemName
//  * @param [volume] defaults to 1.0
//  * @param [loop] defaults to false
//  */
// export function playSetItem(setBufs:any, itemName:string, volume = 1, loop = false):{promise:Promise<any>, pause:any} {
//     let pause
//     const buffer = setBufs[itemName];
//     if(!buffer) {
//         throw "Buffer not found in audio set for "+itemName;
//     }
//     buffer.sampleRate = buffer.sampleRate * buffer.numberOfChannels
//     const opts = {
//         start: 0,
//         end: buffer.duration,
//         loop: loop,
//         rate: 1,
//         detune: 0,
//         volume: volume,
//         device: 'hw:1,0',
//         autoplay: true
//     }
//
//     let resolver;
//     const promise =  new Promise(resolve => {
//         resolver = resolve;
//     });
//     pause = play(buffer, opts, resolver);
//     return {promise, pause}
// }
export function NothingToSeeHereFolks() {
    // need something to replace former version though
}