/** Audio API for Jove */

const audioPlay = require('audio-play')
const audioLoad = require('audio-loader')
import {getUserAndPathInfo} from "./FileAPI";
import {AppGateway} from "../AppGateway";

// const audioRegistry:any = {}
const channelRegistry:any = {}

// Attribute options affecting the audio buffer to be played
export class
AudioAttributes {
    rateMultiplier ?: number = 1 // <positive, float> playback speed adjust. defaults to 1.
    startOffset ?: number = 100// offset (in samples) into the buffer playback starts (default 0)
    endOffset ?: number = -100 // offset (in samples) into the buffer playback ends. default to buffer end.
}

class AudioRegistryEntry {
    name ?:string
    path ?:string
    attributes ?: AudioAttributes
    buffer ?: AudioBuffer
}

class ChannelOptions { // TODO: ChannelOptions
    start = 0
    end  = 0
    loop = false
    rate = 1
    detune = 0
    volume =  1.0
    device =  'hw:1,0'
    autoplay =  false
}

class ChannelEntry {
    name ?: string
    audioName ?: string
    playlist : AudioRegistryEntry[] = [];
    playlistMap: number[] = [];
    playlistIndex = 0;
    loopPlaylist = false;
    playlistAdvances = false;
    status ?: AudioStatus
    playback ?: any // .play(), .pause()
    options = new ChannelOptions()
    eventCallbacks : any = {}
}

// Throw for when a named audio is not in the registration set
export class
AudioDoesNotExist extends Error {
    public constructor(message ?: string) {
        super(message ?? "Audio does not exist");
    }
}
// Throw for when a named channel is not in the registration set
export class ChannelDoesNotExist extends Error {
    public constructor(message ?: string) {
        super(message ?? "Channel does not exist");
    }
}
// Throw for when a named channel already exists and will not be replaced
export class ChannelExists extends Error {
    public constructor(message ?: string) {
        super(message ?? "Channel already exists");
    }
}
// Throw for when the channel is not in a state receptive of the requested action.
// for example, trying to pause a stopped channel
// May not be thrown for a redundant request (e.g. play on a playing channel, pause when paused, etc).
export class InvalidState extends Error {
    public constructor(message ?: string) {
        super(message ?? "Channel already exists");
    }
}

// Status of audio playback
export enum AudioStatus {
    Empty,
    Stopped,
    Playing,
    Paused,
    Error
}

// Type of events we can listen to with onPlayEvent
export enum PlayEvent {
    PlaybackEnds,
    PlaybackStarts,
    PlaybackPaused,
    PlaybackResumes,
    PlaylistEnds
}

// Callback function for onPlayEvent
// *also defines Promise resolve object for onPlayEventPromise)
export type PlayEventCallback = (
    eventType:PlayEvent,
    channelName: string,
    audioName: string
) => void;

// creates and registers a playback channel by name
export function
createChannel(
    name: string  // name of the channel to register

)
// throws ChannelExists Exception
{
    if(channelRegistry[name]) throw new ChannelExists();
    channelRegistry[name] = new ChannelEntry();
    channelRegistry[name].name = name;
    channelRegistry[name].status = AudioStatus.Stopped;
}

function getChannel(name:string):ChannelEntry
{
    if(!channelRegistry[name]) throw new ChannelDoesNotExist();
    return channelRegistry[name]
}

// Loads one or more audio files that become the playlist for this channel.
export function
loadChannelAudio(
    channelName: string,    // name of the channel to load sudio file(s) into
    audioFilePaths: string|string[] // file path, comma-separated file paths, or an array of file paths

) : Promise<any>
// throws ChannelDoesNotExist Exception
// throws AudioDoesNotExist Exception
{
    const channel = getChannel(channelName)
    const paths = Array.isArray(audioFilePaths) ? audioFilePaths : audioFilePaths.split(',');
    const userPaths = getUserAndPathInfo("audioApi");
    const all = [];
    channel.playlist = [];
    channel.playlistIndex = 0;
    for (let path of paths) {
        if(path.charAt(0) != '/') {
            let nv = userPaths.assets;
            if (nv.charAt(nv.length - 1) !== '/') nv += '/'
            path = nv + path
        }
        try {
            let mapIndex = 0;
            all.push(audioLoad(path).then((buf: AudioBuffer) => {
                const entry = new AudioRegistryEntry();
                entry.name = path.substring(path.lastIndexOf('/') + 1);
                entry.path = path;
                entry.attributes = new AudioAttributes()
                entry.buffer = buf;
                channel.playlist.push(entry)
                channel.playlistMap.push(mapIndex++);
                channel.status = AudioStatus.Stopped;
            }))
        } catch(e:any) {
            // file not found
            console.error("Error loading audio: ", e.message);
        }
    }

    return Promise.all(all);
}

function callbackEvent(eventType:PlayEvent, channel:ChannelEntry) {
    console.log('... callbackEvent', {eventType, channelName: channel.name});
    if(channel.eventCallbacks[eventType]) {
        console.log('... found, calling', channel.eventCallbacks[eventType]);
        channel.eventCallbacks[eventType](eventType, channel.name, channel.audioName)
    } else {
        console.log("-<-<-<-<-<-<>->->->->-")
        console.log('no callback event found for', {eventType})
        console.log(channel.eventCallbacks)
        console.log("-<-<-<-<-<-<>->->->->-")
    }

}
// begins play at the start of the channel
export function
play(
    channelName: string // channel to start playing

)
// throws ChannelDoesNotExist Exception
// throws InvalidState Exception
{
    const channel:ChannelEntry = getChannel(channelName)
    if(channel.status !== AudioStatus.Stopped) throw new InvalidState("Channel must be stopped to set audio")
    const indexToPlay = channel.playlistMap[channel.playlistIndex]
    const entry = channel.playlist[indexToPlay]
    console.log(`playlist item ${channel.playlistIndex}:${indexToPlay} = ${entry.name}`)
    if(entry) {
        channel.options.loop = false;
        channel.options.end = entry.buffer?.duration ?? 0;
        channel.playback = audioPlay(entry.buffer, channel.options, () => {
            console.log("playback ends trapped...")
            stop(channelName);
            console.log('calling event listener for PlaybackEnds')
            callbackEvent(PlayEvent.PlaybackEnds, channel);
            if(channel.playlistAdvances) {
                if (channel.status !== AudioStatus.Paused) {
                    if (++channel.playlistIndex < channel.playlist.length) {
                        play(channelName)
                    } else {
                        if (channel.loopPlaylist) {
                            channel.playlistIndex = 0;
                            play(channelName);
                        } else {
                            callbackEvent(PlayEvent.PlaylistEnds, channel)
                        }
                    }
                }
            }
        });
        channel.playback.play(); // we started off paused
        channel.status = AudioStatus.Playing;
        callbackEvent(PlayEvent.PlaybackStarts, channel);
    }
}

// turn looping of playlist on/off
export function
setPlaylistLooping(
    channelName: string,
    looping: boolean
)
// throws ChannelDoesNotExist Exception
{
    const channel = getChannel(channelName)
    channel.loopPlaylist = looping
}

// Sets the current playlist index
export function
setPlaylistIndex(
    channelName: string,
    index: number,
    syncMap = true
)
// throws ChannelDoesNotExist Exception
{
    const channel = getChannel(channelName)
    channel.playlistIndex = index
    if(syncMap) channel.playlistMap[index] = index
    console.log(`playlist index for ${channelName} is now ${index}:${channel.playlistMap[index]}`)
}

// set the playlist items to play after the current one ends, and optionally force current to end
export function
setPlaylistMapAhead(
    channelName:string,
    selections:number[],
    force = false
)
// throws ChannelDoesNotExist Exception
{
    const channel = getChannel(channelName)
    let plindex = channel.playlistIndex;
    let max = channel.playlist.length;
    for(let selection of selections) {
        if (++plindex >= max) plindex = 0
        channel.playlistMap[plindex] = selection;
    }
    if(force) {
        channel.playback.pause();
    }

}
// Sets the current playlist index
export function
setPlaylistAdvances(
    channelName: string,
    advances: boolean
)
// throws ChannelDoesNotExist Exception
{
    const channel = getChannel(channelName)
    channel.playlistAdvances = advances
}


// Pauses playback of a channel
export function
pause(
    channelName: string

)
// throws ChannelDoesNotExist Exception
// throws InvalidState Exception
{
    const channel = getChannel(channelName)
    if(
        channel.status !== AudioStatus.Playing &&
        channel.status !== AudioStatus.Paused
    ) throw new InvalidState("Channel not playing or paused")
    channel.status = AudioStatus.Paused;
    channel.playback.pause();
    callbackEvent(PlayEvent.PlaybackPaused, channel);

}

// resumes paused playback of a channel
function
resume(
    channelName: string

)
// throws ChannelDoesNotExist Exception
// throws InvalidState Exception
{
    const channel = getChannel(channelName)
    if( !channel.playback) throw new InvalidState("Channel not paused")
    channel.playback.play();
    channel.status = AudioStatus.Playing;
    callbackEvent(PlayEvent.PlaybackResumes, channel);
}

// stops all playback on the given channel
export function
stop(
    channelName: string

)
// throws ChannelDoesNotExist Exception
{
    const channel = getChannel(channelName)
    if(channel.status == AudioStatus.Stopped) return;
    // pause,
    pause(channelName)
    //  then reset to starting state
    channel.status = AudioStatus.Stopped;
    channel.playback = null

}

// Sets a listening callback for a play event on a channel
function
onPlayEvent(
    channelName: string,
    playEvent:PlayEvent,
    callback:PlayEventCallback

)
// throws ChannelDoesNotExist Exception
{
    const channel = getChannel(channelName)
    channel.eventCallbacks[playEvent] = callback;
}

// Creates a promise return for a listening callback.
// Must call again to listen again.
export function
onPlayEventReport(
    channelName: string,
    playEvent: PlayEvent,
    messageName: string
)
// throws ChannelDoesNotExist Exception
{
    console.log(`registering to send message ${messageName} on PlayEvent ${playEvent} for channel ${channelName}`)
    onPlayEvent(channelName, playEvent, (playEvent:PlayEvent, channelName:string, audioName:string) => {
        console.log(">>> messaging playEvent",{playEvent, channelName, audioName});
        AppGateway.sendMessage(messageName, {playEvent, channelName, audioName})
    })
}