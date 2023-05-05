// Simple implementation
// on invocation returns channel sdp 
// designed to start indipendent instances
// // ondatachannel ()=> ReadableStream(definition)
// Advanced Implementation
// Single running instance that keeps track of running jobs

// Takes readableStreamDeclaration including any optional retry logic.
let id = 0;
const getId = ()=> {
  id++ // 0 to 65534.
  id === 65535 && (id=0);
  return id;
}

//const exampleNodeReplStream = new Repl().pipeTo(datachannel)

// if user supplyed id exists the taskId is optional as the user knows his id already.
// message readable: (channel,taskId)=>({start(c)=>c.enqueue("Hello World")})
// new ReadableStream(new Function(readable)(channel,taskId))


function looseJsonParse(obj) {
  return eval?.(`"use strict";(${obj})`);
}
// console.log(looseJsonParse("{ a: 4 - 1, b: function () {}, c: new Date() }"));

const extension = () => {
  
function injectedFunction() {
  //document.body.style.backgroundColor = "orange";
  window.stdio = new TransformStream({transform(input,output){output.enqueue(input)}});
  
  function createRepl(env,cb,useGlobal,ignoreUndefined) {
  const opts = {
    ignoreUndefined: false,
    useGlobal: true,
    breakEvalOnSigint: true, // always true in our case
    // replMode = 'sloppy' 'strict':,
  };
  const historySize = 1000
  const repl = new TransformStream({ transform(line,controller){
    try {
      new Function(line)
    } catch {
      
    }
    
  }});
  
}
}

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target : {tabId : tab.id},
    func : injectedFunction,
  });
});
  const taskId = getId();
  
  
  var port = chrome.runtime.connectNative('eu.dspeed.webrtc');
  port.onMessage.addListener(function({ taskId, chunk }) {
      
  id = typoeof id !== 'undefined' ? id : taskId;
  // new Connection
  // return connection sdp and taskId, id 
  new ReadableStream(readable||{ start:(c)=>c.close()}).pipeTo(new WriteableStream({ write(cunks){ datachannel.postMessage(chunk) }}));

    // in client // new dataChannel with id ? { id, taskId };
    port.postMessage({ id, taskId, icecandidate });
  });
  port.onDisconnect.addListener(function() {
    console.log("Disconnected everything is over the extension crashed this is not expected");
  });
  port.postMessage({ text: "Hello, my_application" });
}

const host = ()=>{

  const onmessage = ({ id, taskId, icecandidate }) => {
  
  }
  
}
