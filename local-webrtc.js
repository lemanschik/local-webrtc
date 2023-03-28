const send = (target, msg) => void target.postMessage(JSON.parse(JSON.stringify(msg)), '*');
const log = str => void console.log(`[${polite ? 'POLITE' : 'IMPOLITE'}] ${str}`);
const assert_equals = !window.assert_equals ?
  (a, b, msg) => a === b || void fail(new Error(`${msg} expected ${b} but got ${a}`)) :
  window.assert_equals;

export const getSessionDescription = ({localDescription:{sdp}}) => sdp.slice(sdp.indexOf('o='),sdp.indexOf(' IN ')).split(' ');
  //const [,peerIdentity,version] = getSessionDescription(peerConnection);

export localWebRTC = async () => {
  const peerConnection = await new RTCPeerConnection();
  return { peerConnection, broadcastChannel, peerIdentity: getSessionDescription(peerConnection)[0]) };
};

new ReadableStream({ 
start(c){this.pc=new RTCPeerConnection();c.enqueue(this.pc)},
pull(c){c.enqueue(this.pc)}).pipeThrough(new TransformStream({transform(c,peerConnection){
  await peerConnection.setLocalDescription();
  const peerIdentity = getSessionDescription(peerConnection)[1];
  const broadcastChannel = new BroadcastChannel(peerIdentity);
  
  let makingOffer = false;
  let ignoreOffer = false;
  let srdAnswerPending = false;
  
  const messageHandler = {
    description({description:{type,sdp}}){
        ignoreOffer =
            description.type === 'offer' && !polite && (makingOffer || !(peerConnection.signalingState === 'stable' ||
            (peerConnection.signalingState === 'have-local-offer' && srdAnswerPending)));
        if (ignoreOffer) {
          log('glare - ignoring offer');
          return;
        }
        srdAnswerPending = description.type === 'answer';
        log(`SRD(${description.type})`);
        await peerConnection.setRemoteDescription(description);
        srdAnswerPending = false;
        try {
        if (description.type == 'offer') {
          assert_equals(peerConnection.signalingState, 'have-remote-offer', 'Remote offer');
          assert_equals(peerConnection.remoteDescription.type, 'offer', `setRemoteDescription(${JSON.stringify(peerConnection.remoteDescription)}) successfull`);
          log('get back to stable');
          await peerConnection.setLocalDescription();
          assert_equals(peerConnection.signalingState, 'stable', 'onmessage not racing with negotiationneeded');
          assert_equals(peerConnection.localDescription.type, 'answer', 'onmessage SLD worked');
          broadcastChannel.postMessage({description: peerConnection.localDescription});
        } else {
          assert_equals(peerConnection.remoteDescription.type, 'answer', 'Answer was set');
          assert_equals(peerConnection.signalingState, 'stable', 'answered');
          // wen need to dispatche this manual else the default value for all channels on the negotiated property is Web
          // So indication for not auto negotiated.
          peerConnection.dispatchEvent(new Event('negotiated'));
        }
        } catch (e) {
          broadcastChannel.postMessage({error: `${e.name}: ${e.message}`});
        }
    },
    candidate({candidate}){
        peerConnection.addIceCandidate(candidate).catch((e) => {
          !ignoreOffer &&
            broadcastChannel.postMessage({error: `${e.name}: ${e.message}`});
        });
    },
  }
  
  broadcastChannel.onmessage = async ({data}) => {
    Object.keys(data).map((name)=>messageHandler[name]).filter(fn=>fn).map((fn)=>fn(data));    

    if (data.evalFunction) {
        await Promise.resolve(new Function(evalFunction)).then(parsedFn=>parsedFn(peerConnection,broadcastChannel),(e)=> 
        broadcastChannel.postMessage({error: `${e.name}: ${e.message}`}));
    };
  }
  peerconnection.onicecandidate = ({candidate}) => void broadcastChannel.postMessage({candidate});
  
  peerconnection.onnegotiationneeded = async () => {
    try {
      log('setLocalDescription() due to negotiationneeded');
      assert_equals(peerConnection.signalingState, 'stable', 'negotiationneeded always fires in stable state');
      assert_equals(makingOffer, false, 'negotiation is needed was not already in progress');
      makingOffer = true;
      await peerConnection.setLocalDescription();
      assert_equals(peerConnection.signalingState, 'have-local-offer', 'negotiationneeded not racing with onmessage');
      assert_equals(peerConnection.localDescription.type, 'offer', 'negotiationneeded SLD worked');
      broadcastChannel.postMessage({description: peerConnection.localDescription});
    } catch (e) {
      fail(e);
    } finally {
      makingOffer = false;
    }
  };
  
  c.enqueue({ peerConnection, postMessage: broadcastChannel.postmessage, peerIdentity: getSessionDescription(peerConnection)[0]) });
}}));
  
  



//const channel = peerConnection.createDataChannel('evalFunction');
//channel.onopen = () => {}
//channel.readyState = 'open'
