const express = require('express');
const WebSocket = require('ws');
const app = express();

const PORT = process.env.PORT || 10000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const wss = new WebSocket.Server({ server });

const players = new Map();

wss.on('connection', (ws) => {
  let playerId;
  
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      
      if (msg.type === 'join') {
        playerId = msg.name;
        players.set(playerId, { ws, data: msg });
        broadcast({ type: 'playerJoined', player: msg }, ws);
      }
      
      if (msg.type === 'update') {
        if (playerId) {
          players.set(playerId, { ws, data: msg });
          broadcast({ type: 'playerUpdate', player: msg }, ws);
        }
      }
    } catch (e) {
      console.error('Error:', e);
    }
  });
  
  ws.on('close', () => {
    if (playerId) {
      players.delete(playerId);
      broadcast({ type: 'playerLeft', name: playerId });
    }
  });
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data);
    
    if (msg.type === 'join') {
      playerId = msg.name;
      players.set(playerId, { ws, data: msg });
      broadcast({ type: 'playerJoined', player: msg }, ws);
    }
    
    if (msg.type === 'update') {
      if (playerId) {
        players.set(playerId, { ws, data: msg });
        broadcast({ type: 'playerUpdate', player: msg }, ws);
      }
    }
    
    // NEW: Broadcast secret mode
    if (msg.type === 'secretMode') {
      broadcast({ type: 'secretMode', name: msg.name, active: msg.active }, null);
    }
    
  } catch (e) {
    console.error('Error:', e);
  }
});

function broadcast(msg, sender) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client !== sender) {
      client.send(JSON.stringify(msg));
    }
  });
}
