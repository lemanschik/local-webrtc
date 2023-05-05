// The FileSystemDirectoryHandle interface of the File System Access API provides a handle to a file system directory.

// The interface can be accessed via the 


// SocketIO-Client
// Broardcast Channel Pattern
// WebRTC
// Devtools Protocol
// Handel Based RPC.
// Connection Helper Modules

// import { dirname } from './path.js';
export const protocol = 'memfs:/'
export const version = "0.0.0-performance.0";
// window.showDirectoryPicker(), StorageManager.getDirectory(), DataTransferItem.getAsFileSystemHandle(), and FileSystemDirectoryHandle.getDirectoryHandle() methods.
import { get, set, values } from './quarternion-idb.js';
export const QuarternionDirectoryHandle = (name='') =>name && /** @type {const} */  ({
  "kind": "directory",  name 
});

export const FileSystemDirectoryHandle = globalThis.FileSystemDirectoryHandle || class { constructor() { Object.assign(this,QuarternionDirectoryHandle) } };

export const QuarternionFileHandle = (name='') => name && /** @type {const} */ ({
    "kind": "file",  name 
});
export const FileSystemFileHandle = globalThis.FileSystemFileHandle || class { constructor() { Object.assign(this,QuarternionFileHandle) } };


export const ensureUrl = (url='') => new URL(url,protocol);
export const caches = globalThis.caches || ({
  async open(name) {
    const cache = (caches[name] = caches[name] || {});
    
    console.log('created',name, { caches })
    
    const match = async (matchUrl) => {
      const [resUrl,response] = Object.entries(cache).find(([url])=>url.indexOf(`${matchUrl}`) > -1) || [];
      return resUrl && (await response.clone());
    }
    
    const matchAll = async (matchUrl='') => Object.entries(cache)
      .filter(([url])=>url.indexOf(`${matchUrl}`) > -1)
      .map(async ([_url,response])=>(await response.clone()));
    
    return ({ cache, async put(dest,data) { cache[`${ensureUrl(dest)}`] = data; }, matchAll, match, })
  }
});

export const watchFiles = new BroadcastChannel(protocol);
export const cache = caches.open(protocol);

export async function mkdirpath(_path,_cbOrOpts={},_cb=()=>{}) {}
export async function mkdir(_path,_cbOrOpts={},_cb=()=>{}) {}

export const promises = {
  async readFile(path) {
    // console.log( 'readFile',{path},
    // await (await ((await cache).match(ensureUrl(path))) )?.text() )
    return (await ((await cache).match(ensureUrl(path))) )?.text();
  },
  async writeFile(dest, data) {
    const url = ensureUrl(dest);
    watchFiles.postMessage('writeFile', url);
    return (await cache).put(url,new Response(new Blob([data]), { url } ));
  },
  async readdir(dir) {
    return (await Promise.all([].concat(await (await cache).matchAll(ensureUrl(dir).pathname)))).map(res=>res.text());
  }
}

export const writeFile = promises
  .writeFile;
export const writeFileSync = promises
  .writeFile;

export const readFile = promises
  .readFile;
export const readFileSync = promises
  .readFile;

export const readDirSync = promises
  .readdir;
export const readdirSync = promises
  .readdir;
export const readdir = promises
  .readdir;

  document.body.innerHTML = `
  <button onclick="(this.files = window.showDirectoryPicker())">Pickme</button><br />
  <my-files></my-files>
`
async function verifyPermission(fileHandle, readWrite=false) {
    const options = { mode:  `read${readWrite || ''}`, };
    return ((await fileHandle.queryPermission(options)) === 'granted' || (await fileHandle.requestPermission(options)) === 'granted');
}

const logEnt = async ()=>{
    const fileSystemDirectoryHandle = document.querySelector('button').files
    if (fileSystemDirectoryHandle) {
        await verifyPermission(fileSystemDirectoryHandle);

        //(await get(fileSystemDirectoryHandle.name) || await set(fileSystemDirectoryHandle.name,fileSystemDirectoryHandle)) || await get(fileSystemDirectoryHandle.name);
        for await (const [name,fileHandle] of fileSystemDirectoryHandle.entries()) {
            document.querySelector('my-files').innerHTML += `<br />${name}<br />`;
            console.log(name,fileHandle);
        }
    }
    return true;
}

const update = (what) => document.querySelector('my-files').innerHTML !== what && (document.querySelector('my-files').innerHTML = what+'/<br />');
let openFolder = await (await values()).find(v=>v.toString() == '[object FileSystemDirectoryHandle]');
let inter = setInterval(async ()=>{
    if (openFolder && document.querySelector('my-files').innerHTML !== openFolder.name) {
        console.log('openFolder:',openFolder)
        update(openFolder.name)
        document.querySelector('button').files = openFolder;
    }
     await logEnt() && clearInterval(inter);
},4000)
