# webrtc-test
This is a simple program to demonstrate the basics of the WebRTC communication.
---

## Installation

`npm install`
`npm run start-server`
`npm run start-client`

- The server hosts the web socket server on port 9090
- The client is hosted using http-server (not in package.json) and runs on port 8080

## Architecture

WebRTC offers Peer-to-Peer communication.  To make this happen, we need an intermediate server that can get the info of each client and tell them about each other.  This is call a signalling server.  In this example, a node websocket server is run to setup the signalling between the clients.  Once two clients connect, they will exchange RTC offer/answer packages (SDP), which will allow them to connect directly to each other.  Once a direct connection is made between each client, a data channel is created and used to send all further communications.

