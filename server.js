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
  console.log('New client connected');
  
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      
      if (msg.type === 'join') {
        playerId = msg.name;
        players.set(playerId, { ws, data: msg });
        console.log(`Player joined: ${playerId}`);
        broadcast({ type: 'playerJoined', player: msg }, ws);
      }
      
      if (msg.type === 'update') {
        if (playerId) {
          players.set(playerId, { ws, data: msg });
          broadcast({ type: 'playerUpdate', player: msg }, ws);
        }
      }
      
      if (msg.type === 'secretMode') {
        console.log(`Secret mode from ${msg.name}: ${msg.active}`);
        broadcast({ type: 'secretMode', name: msg.name, active: msg.active }, null);
      }
      
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  });
  
  ws.on('close', () => {
    if (playerId) {
      console.log(`Player left: ${playerId}`);
      players.delete(playerId);
      broadcast({ type: 'playerLeft', name: playerId });
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function broadcast(msg, sender) {
  const msgStr = JSON.stringify(msg);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client !== sender) {
      client.send(msgStr);
    }
  });
}

console.log('WebSocket server ready');
