const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const net = require('net');

const port = 3000;
const cppPort = 8080;

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
    },
});

let playerPositions = {};

const cppClient = new net.Socket();
cppClient.connect(cppPort, 'xevo-game-server', function() {
    console.log('Successfully connected to C++ service');
});

cppClient.on('error', (error) => {
    console.error('Connection to C++ service failed:', error);
});

io.on('connection', (socket) => {
    console.log('A new client has connected');
    socket.emit('updatePositions', playerPositions);

    socket.on('move', (data) => {
        if (data && typeof data.x === "number" && typeof data.y === "number") {
            data.x = Math.min(data.x, 0.5);
            data.y = Math.min(data.y, 0.5);
            const payload = {
                id: socket.id,
                ...data,
            };
            cppClient.write(JSON.stringify(payload));
        }
    });

    socket.on('init', (data) => {
        if (data) {
            cppClient.write(JSON.stringify(data));
        }
    });

    socket.on('disconnect', () => {
        cppClient.write(JSON.stringify({ action: 'disconnect', id: socket.id }));
    });
});

cppClient.on('data', (data) => {
    const dataStr = data.toString();
    try {
        const parsedData = JSON.parse(dataStr);
        
        if (parsedData.id && typeof parsedData.x === "number" && typeof parsedData.y === "number") {
            playerPositions[parsedData.id] = { x: parsedData.x, y: parsedData.y };
            io.emit('updatePositions', playerPositions);
        }
    } catch (err) {
        console.error('JSON parse error:', err);
    }
});

server.listen(port, () => console.log(`Server listening on port ${port}`));