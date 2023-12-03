const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const net = require('net');
var path = require('path');

const port = 5566;
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
cppClient.connect(cppPort, 'xevo-cpp-server', function() {
    console.log('Successfully connected to C++ service');
});

cppClient.on('error', (error) => {
    console.error('Connection to C++ service failed:', error);
});


app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
    res.set('Content-Type', 'text/html');
    res.set('Content-Type', 'application/javascript');
    res.set('Content-Type', 'text/css');
    return res.sendFile(path.join(__dirname, 'public/index.html'));
});


io.on('connection', (socket) => {
    console.log('A new client has connected');
    socket.emit('updatePositions', playerPositions);

    socket.on('move', (data) => {
        if (data && typeof data.x === "number" && typeof data.z === "number") { 
            data.x = Math.min(data.x, 0.5);
            data.z = Math.min(data.z, 0.5); 
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
        console.log(`Player ${socket.id} has disconnected`);
        cppClient.write(JSON.stringify({ action: 'disconnect', id: socket.id }));
 
        delete playerPositions[socket.id];
        io.emit('updatePositions', playerPositions);
      });
});

cppClient.on('data', (data) => {
    const dataStr = data.toString();
    try {
        const parsedData = JSON.parse(dataStr);
        
        if (parsedData.id && typeof parsedData.x === "number" && typeof parsedData.z === "number") { 
            playerPositions[parsedData.id] = { x: parsedData.x, z: parsedData.z }; 
            io.emit('updatePositions', playerPositions);
        }
    } catch (err) {
        console.error('JSON parse error:', err);
    }
});

server.listen(port, () => console.log(`Server listening on port ${port}`));
