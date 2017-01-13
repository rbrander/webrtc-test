// Signalling server for WebRTC using WebSockets

// websocket docs at https://github.com/websockets/ws/blob/master/doc/ws.md
const PORT = process.env.PORT || 9090;
const WebSocket = require('ws');
const WebSocketServer = new WebSocket.Server({port: PORT});
const onConnect = require('./handlers');

// Clear the console and position the cursor at the top
console.log("\u001b[2J\u001b[0;0H");
console.log('Waiting for connections...');
WebSocketServer.on('connection', onConnect);
