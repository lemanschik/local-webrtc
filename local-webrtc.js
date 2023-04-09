
const send = (target, msg) => void target.postMessage(JSON.parse(JSON.stringify(msg)), '*');
const log = str => void console.log(`[${polite ? 'POLITE' : 'IMPOLITE'}] ${str}`);
const assert_equals = window.assert_equals ||
  (a, b, msg) => a === b || void console.error(new Error(`${msg} expected ${b} but got ${a}`)) ;

export const getSessionDescription = ({localDescription:{sdp}}) => sdp.slice(sdp.indexOf('o='),sdp.indexOf(' IN ')).split(' ');
  //const [,peerIdentity,version] = getSessionDescription(peerConnection);

export const localWebRTC = async () => {
  const peerConnection = await new RTCPeerConnection();
  return { peerConnection, broadcastChannel, peerIdentity: getSessionDescription(peerConnection)[0] };
};

new ReadableStream({ 
start(c){this.pc=new RTCPeerConnection();c.enqueue(this.pc)},
pull(c){c.enqueue(this.pc)}}).pipeThrough(new TransformStream({async transform(c,peerConnection){
  await peerConnection.setLocalDescription();
  const peerIdentity = getSessionDescription(peerConnection)[1];
  const broadcastChannel = new BroadcastChannel(peerIdentity);
  const streamChannel = new BroadcastChannel(peerIdentity);
  
  const network = { makingOffer: false, ignoreOffer: false, srdAnswerPending: false };
  
  const messageHandler = {
    async protocol({id,method,params,result:{value,done}}){
        await Promise.resolve(new Function(`return ${method}`)).then(parsedFn=>parsedFn(peerConnection,broadcastChannel),(e)=> 
        broadcastChannel.postMessage({error: `${e.name}: ${e.message}`}));      
        c.enqueue({ protocol: { sessionId: peerIdentity, id: crypto.createRANDOMUUID(), method: "peerConnection.createDataChannel", params: [] } });
    },
    async ['peerConnection.ondescription'](description){ // onsignal;
      if (network.ignoreOffer = description.type === 'offer' && !polite && (
        makingOffer || !(peerConnection.signalingState === 'stable' ||
       (peerConnection.signalingState === 'have-local-offer' && network.srdAnswerPending)))
      ){ return broadcastChannel.postMessage({method: "peerconnection.ondescription",
      params: [{ result: { value: 'glare - ignoring offer' }}] }); };

      network.srdAnswerPending = description.type === 'answer';
        await peerConnection.setRemoteDescription(description);
        network.srdAnswerPending = false;
        try { if (network.srdAnswerPending) { // negotiated: true // auto negotiated
          assert_equals(peerConnection.remoteDescription.type, 'answer', 'peerConnection.setRemoteDescription answer');
          assert_equals(peerConnection.signalingState, 'stable', 'peerConnection.setRemoteDescription answered successfull');
          broadcastChannel.postMessage({method: "peerConnection.setRemoteDescription", params: [{ description }] });
          peerConnection.dispatchEvent(new Event('negotiated')); // negotiated: true || 'Web';
        } else { // negotiated: 'Web' // not auto negotiated.
          assert_equals(peerConnection.signalingState, 'have-remote-offer', 'Remote offer');
          assert_equals(peerConnection.remoteDescription.type, 'offer', `peerConnection.ondescription.setRemoteDescription successfull`);
          await peerConnection.setLocalDescription();
          assert_equals(peerConnection.signalingState, 'stable', 'peerConnection.ondescription.setLocalDescription is not racing');
          assert_equals(peerConnection.localDescription.type, 'answer', 'peerConnection.ondescription.setLocalDescription successfully');
          broadcastChannel.postMessage({method: "peerconnection.setLocalDescription",
          params: [{ ['peerconnection.localDescription']: peerConnection.localDescription }] });
         } } catch (e) {
          broadcastChannel.postMessage({method: "peerConnection.setRemoteDescription", params: [{error: `${e.name}: ${e.message}`}]});
        }
    },
  }
  
  broadcastChannel.onmessage = async ({data}) => messageHandler[`${data.method}`](...data.params);
  peerConnection.onicecandidate = ({candidate}) => { broadcastChannel.postMessage({ method: "peerconnection.onicecandidate", params: [candidate] });
    peerConnection.addIceCandidate(candidate).catch((e) => {
      !ignoreOffer &&
        broadcastChannel.postMessage({ method: "peerConnection.addIceCandidate", 
        params: [{ candidate, error: `${e.name}: ${e.message}`}] });
    });
  };
  peerConnection.onnegotiationneeded = async () => { broadcastChannel.postMessage({method: "peerconnection.onnegotiationneeded", params: [] });
    try {
      assert_equals(peerConnection.signalingState, 'stable', 'peerconnection.onnegotiationneeded peerConnection.signalingState === stable');
      assert_equals(makingOffer, false, 'peerconnection.onnegotiationneeded.makingOffer === false');
      network.makingOffer = true;
      await peerConnection.setLocalDescription();
      assert_equals(peerConnection.signalingState, 'have-local-offer', 'peerConnection.onnegotiationneeded.setLocalDescription is not racing');
      assert_equals(peerConnection.localDescription.type, 'offer', 'peerConnection.onnegotiationneeded.setLocalDescription successfully');
      broadcastChannel.postMessage({method: "peerconnection.setLocalDescription",
      params: [{ ['peerconnection.localDescription']: peerConnection.localDescription }] });
    } catch (error) {
      broadcastChannel.postMessage({method: "peerconnection.setLocalDescription", params: [{ error }] });
    } finally { network.makingOffer = false; }
  };
  
  streamChannel.onmessage = ({data}) => c.enqueue(data); 
  streamChannel.postMessage({ protocol: { id: crypto.createRANDOMUUID(), method: "peerConnection.createDataChannel", params: [] } })
  
  c.enqueue({ peerConnection, postMessage: broadcastChannel.postmessage, peerIdentity: getSessionDescription(peerConnection)[0] });
}}));
  
//const channel = peerConnection.createDataChannel('evalFunction');
//channel.onopen = () => {}
//channel.readyState = 'open'
