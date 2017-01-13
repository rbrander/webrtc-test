// WebRTC test

// Using websocket docs from https://www.html5rocks.com/en/tutorials/websockets/basics/

// A simple RTCDataChannel sample
// https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Simple_RTCDataChannel_sample

// TODO: implement signalling server and web RTC
// just like in this doc: https://www.tutorialspoint.com/webrtc/webrtc_video_demo.htm

// TODO: create a send method to automatically JSON stringify and append targetID

let signallingServerConn = null; // web socket connection
let localConnection = null; // RTC local connection
let targetID = null;
let sendChannel = null, receiveChannel = null;

const RTCConfig = {
  'iceCandidatePoolSize': 10,
  'iceServers': [
    { 'url' : 'stun:stun.l.google.com:19302' },
    { 'url' : 'stun:stun1.l.google.com:19302' },
    { 'url' : 'stun:stun2.l.google.com:19302' },
    { 'url' : 'stun:stun3.l.google.com:19302' },
    { 'url' : 'stun:stun4.l.google.com:19302' },
    // TODO: add some TURN servers
    {
      url: 'turn:numb.viagenie.ca',
      credential: 'muazkh',
      username: 'webrtc@live.com'
    },
    {
      url: 'turn:192.158.29.39:3478?transport=udp',
      credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      username: '28224511:1379330808'
    },
    {
      url: 'turn:192.158.29.39:3478?transport=tcp',
      credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      username: '28224511:1379330808'
    }    
  ]  
};

////////////////////////////////////////////////

window.onload = function() {
  console.log('onLoad()');
  signallingServerConn = new WebSocket('ws://webrtc-signalling.herokuapp.com');
  signallingServerConn.onopen = webSocketHandlers.onOpen;
  signallingServerConn.onclose = webSocketHandlers.onClose;
  signallingServerConn.onerror = webSocketHandlers.onError;
  signallingServerConn.onmessage = webSocketHandlers.onMessage;
}

////////////////////////////////////////////////////////////////////////////////

function createRTCConnection() {
  console.log('createRTCConnection()');
  localConnection = new webkitRTCPeerConnection(RTCConfig);
  localConnection.onicecandidate = (e) => {
    if (e.candidate) {
      signallingServerConn.send(JSON.stringify({
        type: 'candidate',
        candidate: e.candidate,
        targetID: targetID
      }));
    }
  };
  // Create the data channel
  sendChannel = localConnection.createDataChannel('data');
  sendChannel.onopen = function() { console.log('sendChannel onOpen()'); };
  sendChannel.onclose = function() { console.log('sendChannel onClose()'); };
  localConnection.ondatachannel = function(e) {
    console.log('onDataChannel()');
    receiveChannel = e.channel;
    receiveChannel.onopen = function() {
      console.log('receiveChannel onOpen()');
      // At this point, the peer connection is established with a data channel
      sendChannel.send('This is a test message to ' + targetID);
      // the signallying server is no longer needed now that we have a peer connection
      signallingServerConn.close();
    };
    receiveChannel.onclose = function() { console.log('receiveChannel onClose()'); };
    receiveChannel.onmessage = function(e) { console.log('receiveChannel onMessage()', e); };
  }
}

function makeOffer(targetID) {
  console.log('makeOffer() - about to create offer');
  const onError = (e) => console.error('Error creating offer:', e);
  localConnection.createOffer(function(offer) {
    localConnection.setLocalDescription(offer);
    signallingServerConn.send(JSON.stringify({
      type: 'offer',
      offer: offer,
      targetID: targetID
    }));
  }, onError);
}

// when somebody sends us an offer 
function handleOffer(offer, targetID) {
  console.log('handleOffer()');
  localConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const onError = (e) => console.error('Error creating answer:', e);
  //create an answer to an offer 
  localConnection.createAnswer(function (answer) { 
    localConnection.setLocalDescription(answer); 
    signallingServerConn.send(JSON.stringify({
      type: 'answer',
      answer: answer,
      targetID: targetID
    })); 
   }, onError);
}

// when we got an answer from a remote user 
function handleAnswer(answer) {
  console.log('handleAnswer()');
  localConnection.setRemoteDescription(new RTCSessionDescription(answer));
}; 

// when we got an ice candidate from a remote user 
function handleCandidate(candidate) { 
  console.log('handleCandidate()');
  localConnection.addIceCandidate(new RTCIceCandidate(candidate)); 
};

////////////////////////////////////////////////////////////////////////
// Websocket Event Handlers

const webSocketHandlers = {
  onClose: function() { console.log('connection closed'); },
  onError: function(e) { console.error('error: ', e); },
  onOpen: function() { console.log('connection opened'); },
  onMessage: function(e) {
    // All messages received through web sockets are expected to be JSON strings
    var data = JSON.parse(e.data);
    switch (data.type) {
      case 'connected': // TODO: put strings into a constants file to share with server
        console.log('connected! ID = ' + data.ID);
        createRTCConnection();
        break;
      case 'sendOffer':
        console.log('sendOffer received; targetID = ' + data.targetID);
        targetID = data.targetID;
        makeOffer(data.targetID);
        break;
      case 'offer':
        console.log('offer received; targetID:', data.targetID);
        targetID = data.targetID;
        handleOffer(data.offer, data.targetID);
        break;
      case 'answer':
        console.log('answer received');
        handleAnswer(data.answer);
        break;
      case 'candidate':
        console.log('candidate received');
        handleCandidate(data.candidate);
        break;
      default:
        console.error('Unknown type: ' + data.type);
        break;
    }
  },
};

function sendMsg(msg) {
  if (sendChannel && sendChannel.readyState && sendChannel.readyState === 'open') {
    sendChannel.send(msg);
  }
}