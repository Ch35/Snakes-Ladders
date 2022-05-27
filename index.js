const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const User = require('./modules/user.js');

const cfg = {
    public: __dirname + '/public',
    port: 80,
};

var messages = {};

// Make public files available
app.use(express.static(cfg.public));

app.get('/', (req, res) => {
    res.sendFile(cfg.public + '/index.html');
});

server.listen(cfg.port, '0.0.0.0', () => {
    console.log('listening on *:', cfg.port);
});

io.on('connection', (socket) => {
    console.log(socket.id, 'initializing');

    // Login
    socket.on('login', (username) => {
        const users = User.list();

        // username taken
        if(Object.values(users).indexOf(username) > -1){
            for(var socketid in users){
                const user = users[socketid];

                // username already in use
                if(user.name === username){
                    // user online - cannot take their name
                    if(user.disconnected === false){
                        io.to(socket.id).emit('login', {error: 'Username already in use'});
                        return;

                    // user offline - login as them
                    // TODO: we should have preserved this user
                    } else{
                        users[socketid].reconnect();
                        users[socket.id] = users[socketid];
                        delete users[socketid]; // replace socket ID

                        console.log(username, 'logged in again');
                    }
                }
            }

        } else{
            users[socket.id] = new User(username);
            console.log(username, 'logged in for the first time');
        }


        // Send event to load messages
        io.to(socket.id).emit('loadMessages', User.messages(true));
        io.to(socket.id).emit('login', true);
    })

    // disconnect
    socket.on('disconnect', () => {
        const users = User.list();
        var username;
        
        // user not logged in
        if(typeof users[socket.id] === 'undefined'){
            username = socket.id;

        // user logged in
        } else{
            var user = users[socket.id];
            username = user.name;
            user.disconnect();
        }

        console.log(username, 'disconnected');
    });

    // received message
    socket.on('message', (msg) => {
        const users = User.list();

        // check if user exists
        if(typeof users[socket.id] === 'undefined'){
            console.error('User does not exist');
            return;
        }

        const user = users[socket.id];

        if(user.sendMessage(msg)){
            io.emit('message', msg, user.name);
        }
    });

    // user rolling
    socket.on('roll', () => {
        var num = Math.floor(Math.random() * (6 - 1 + 1) + 1);
        
        // TODO: move user `num` units

        io.to(socket.id).emit('roll', num);
    });
});