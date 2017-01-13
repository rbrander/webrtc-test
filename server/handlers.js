const uuid = require('uuid');

///////////////////////////////////////////////////////////////////////////////
///// Connection handling
const connections = {
  get count () { return Object.keys(connections).length - 1 /* -1 for count */; }
};

function addConnection(connection) {
  connection.id = uuid.v4();
  connections[connection.id] = connection;
}

function removeConnection(connection) {
  delete connections[connection.id];
}

function displayNumConnections() {
  console.log(`${connections.count} connection${connections.count === 1 ? '' : 's'}`);
}


///////////////////////////////////////////////////////////////////////////////
///// Web Socket Event Handlers

function onConnect(connection) {
  console.log("onConnect() - user connected");

  connection.on('message', onMessage);
  connection.on('close', onClose);
  
  // let the client know we've received their connection
  addConnection(connection);
  connection.send(JSON.stringify({ type: 'connected', ID: connection.id }));
  displayNumConnections();

  if (connections.count > 1) {
    // try to make a connection by triggering a request for offer
    const targetID = Object.keys(connections)
      .filter(function(key) { return key !== 'count' && key !== connection.id; })
      .reduce(function(id, curr) { return id.length > 0 ? id : curr; }, '');
    connection.send(JSON.stringify({ type: 'sendOffer', targetID: targetID }));
  }
}

// NOTE: 'this' is bound to the connection object that triggered this event
function onClose() {
  console.log('onClose() - user disconnected');
  removeConnection(this);
  displayNumConnections();
}

// NOTE: 'this' is bound to the connection object that triggered this event
function onMessage(message) {
  console.log('onMessage() - message from ' + this.id);
  // The message is expected to be a JSON string
  try {
    const data = JSON.parse(message);
    switch (data.type) {
      case 'offer':
        console.log('received offer, targetID:', data.targetID);
        // Forward the offer to the other client
        connections[data.targetID].send(JSON.stringify({
          type: 'offer',
          offer: data.offer,
          targetID: this.id
        }));
        break;
      case 'answer':
        console.log('received answer, targetID:', data.targetID);
        connections[data.targetID].send(JSON.stringify({
          type: 'answer',
          answer: data.answer,
          targetID: this.id
        }));
        break;
      case 'candidate':
        console.log('received candidate');
        connections[data.targetID].send(JSON.stringify({
          type: 'candidate',
          candidate: data.candidate,
          targetID: this.id
        }));
        break;
      default:
        console.error('unknown type:', data.type);
        break;
    }
  } catch (e) {
    console.error('Error parsing message:', message);
    console.error(e);
  }
}

///////////////////////////////////////////////////////////////////////////////
// NOTE: the only method that needs to be exported is the onConnect because all
// other event handlers are setup at the time of connection
module.exports = onConnect;
