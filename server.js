const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const requestedPort = Number(process.env.PORT) || 3000;
let port = requestedPort;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Clean URL routing for mobile controller
app.get(['/phone', '/phone/*', '/phone/:room', '/pair', '/pair/*', '/pair/:room', '/remote', '/remote/*', '/remote/:room', '/join', '/join/*', '/join/:room'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'phone.html'));
});

// Endpoint to retrieve local network IP configuration
const os = require('os');
app.get('/api/config', (req, res) => {
  const networkInterfaces = os.networkInterfaces();
  let localIp = '127.0.0.1';
  
  for (const name of Object.keys(networkInterfaces)) {
    for (const net of networkInterfaces[name]) {
      const isIPv4 = net.family === 'IPv4' || net.family === 4;
      if (isIPv4 && !net.internal) {
        localIp = net.address;
        break;
      }
    }
    if (localIp !== '127.0.0.1') break;
  }
  
  res.json({ localIp, port });
});

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server attached to the HTTP server
const wss = new WebSocket.Server({ server });

// Room management
// Structure: { [roomId]: { desktops: Set<WebSocket>, phones: Set<WebSocket> } }
const rooms = {};

wss.on('connection', (ws) => {
  let currentRoom = null;
  let currentRole = null;

  console.log('New WebSocket connection established.');

  ws.on('message', (message, isBinary) => {
    // If the message is a binary buffer (screen share frame), relay it to paired desktops
    if (isBinary) {
      if (currentRoom && rooms[currentRoom]) {
        rooms[currentRoom].desktops.forEach((desktopSocket) => {
          if (desktopSocket.readyState === WebSocket.OPEN) {
            desktopSocket.send(message, { binary: true });
          }
        });
      }
      return;
    }

    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'join':
          const { room, role } = data;
          if (!room || !role) return;
          
          currentRoom = room;
          currentRole = role;

          // Initialize room if it doesn't exist
          if (!rooms[room]) {
            rooms[room] = { desktops: new Set(), phones: new Set() };
          }

          if (role === 'desktop') {
            rooms[room].desktops.add(ws);
            console.log(`Desktop joined room: ${room}. Total desktops in room: ${rooms[room].desktops.size}`);
            
            // Notify desktop if a phone is already in the room
            if (rooms[room].phones.size > 0) {
              ws.send(JSON.stringify({ type: 'status', message: 'Controller connected' }));
              
              // Also notify the phone(s) that a viewer is listening
              rooms[room].phones.forEach(phoneSocket => {
                if (phoneSocket.readyState === WebSocket.OPEN) {
                  phoneSocket.send(JSON.stringify({ type: 'status', message: 'Viewer connected' }));
                }
              });
            } else {
              ws.send(JSON.stringify({ type: 'status', message: 'Waiting for controller' }));
            }
          } else if (role === 'phone') {
            rooms[room].phones.add(ws);
            console.log(`Phone controller joined room: ${room}. Total controllers in room: ${rooms[room].phones.size}`);
            
            // Notify all desktops in the room
            rooms[room].desktops.forEach((desktopSocket) => {
              if (desktopSocket.readyState === WebSocket.OPEN) {
                desktopSocket.send(JSON.stringify({ type: 'status', message: 'Controller connected' }));
              }
            });
            
            // Notify the phone itself
            ws.send(JSON.stringify({ type: 'status', message: 'Connected to room. Ready to stream.' }));
          }
          break;

        case 'orientation':
          if (!currentRoom || !rooms[currentRoom]) return;
          
          // Broadcast orientation data to all desktop clients in the same room
          const payload = JSON.stringify({
            type: 'orientation',
            alpha: data.alpha,
            beta: data.beta,
            gamma: data.gamma
          });

          rooms[currentRoom].desktops.forEach((desktopSocket) => {
            if (desktopSocket.readyState === WebSocket.OPEN) {
              desktopSocket.send(payload);
            }
          });
          break;

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;

        default:
          console.log(`Unknown message type: ${data.type}`);
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    console.log(`Connection closed. Role: ${currentRole}, Room: ${currentRoom}`);
    
    if (currentRoom && rooms[currentRoom]) {
      const roomObj = rooms[currentRoom];

      if (currentRole === 'desktop') {
        roomObj.desktops.delete(ws);
        console.log(`Desktop left room: ${currentRoom}. Remaining desktops: ${roomObj.desktops.size}`);
      } else if (currentRole === 'phone') {
        roomObj.phones.delete(ws);
        console.log(`Phone left room: ${currentRoom}. Remaining phones: ${roomObj.phones.size}`);
        
        // Notify desktops that phone has disconnected
        roomObj.desktops.forEach((desktopSocket) => {
          if (desktopSocket.readyState === WebSocket.OPEN) {
            desktopSocket.send(JSON.stringify({ type: 'status', message: 'Controller disconnected' }));
          }
        });
      }

      // Cleanup room if completely empty
      if (roomObj.desktops.size === 0 && roomObj.phones.size === 0) {
        delete rooms[currentRoom];
        console.log(`Room ${currentRoom} is empty and has been removed.`);
      }
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket connection error:', err);
  });
});

function startServer() {
  server.listen(port, () => {
  const networkInterfaces = os.networkInterfaces();
  let localIp = 'localhost';
  for (const name of Object.keys(networkInterfaces)) {
    for (const net of networkInterfaces[name]) {
      const isIPv4 = net.family === 'IPv4' || net.family === 4;
      if (isIPv4 && !net.internal) {
        localIp = net.address;
        break;
      }
    }
    if (localIp !== 'localhost') break;
  }

  console.log(`=================================================`);
  console.log(`  OMGMimiq Server running on:`);
  console.log(`  - Local:   http://localhost:${port}`);
  if (localIp !== 'localhost') {
    console.log(`  - Network: http://${localIp}:${port}`);
  }
  console.log(`=================================================`);
  });
}

function handleStartupError(error) {
  if (error.code !== 'EADDRINUSE') {
    console.error('Unable to start server:', error.message);
    process.exitCode = 1;
    return;
  }

  if (process.env.PORT) {
    console.error(`Port ${port} is already in use. Set PORT to an available port and try again.`);
    process.exitCode = 1;
    return;
  }

  const unavailablePort = port;
  port += 1;
  console.warn(`Port ${unavailablePort} is already in use; trying port ${port}.`);
  server.close(() => startServer());
}

server.on('error', handleStartupError);
wss.on('error', handleStartupError);
startServer();
