const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const User = require('./modules/user.js');
const Board = require('./modules/board.js');

const cfg = {
    public: __dirname + '/public',
    port: 80,
};

const board = Board.getInstance();

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
    socket.on('login', (username, colour) => {
        if(username.length <= 0) {
            io.to(socket.id).emit('login', null, 'Username needs to be at least 1 character long');
            return;
        }

        const existing = User.find(username);

        // username taken
        if(existing){
            // user online - cannot take their name
            if(existing.disconnected === false){
                io.to(socket.id).emit('login', null, 'Username already in use');
                return;

            // user offline - login as them :^)
            } else{
                User.delete(existing.id);

                existing.reconnect(socket.id);
                existing.colour = colour;

                console.log(username, 'logged in again');
            }

        } else{
            new User(socket.id, username, colour);
            console.log(username, 'logged in for the first time');
        }

        // Let everyone know a new login
        io.emit('login', User.get(socket.id));

        // Send event to load messages
        io.to(socket.id).emit('loadMessages', User.messages(true));

        // Load the board
        io.to(socket.id).emit('loadGrid', board);
    });

    // Join game
    socket.on('join', () => {
        const user = User.get(socket.id);
        board.playerJoin(user);
        
        // let everyone else know a new player joined
        socket.broadcast.emit('playerJoin', user);

        // let the new player know the current board status
        io.to(socket.id).emit('join', board);
    });

    // disconnect
    socket.on('disconnect', () => {
        const user = User.get(socket.id);
        var username;

        // user logged in
        if(user){
            username = user.name;
            user.disconnect(board);

            // let everyone else know that we're gone
            socket.broadcast.emit('playerLeave', user);
            
        // user not logged in
        } else{
            username = socket.id;
        }

        // The winner has left, auto reset
        if(board.winner == socket.id){
            resetEvent();
        }

        console.log(username, 'disconnected');
    });

    // received message
    socket.on('message', (msg) => {
        const user = User.get(socket.id);

        // check if user exists
        if(user === null){
            console.error('User does not exist');
            return;
        }

        if(user.sendMessage(msg)){
            io.emit('message', {
                text: msg,
                colour: user.colour
            }, user.name);
        }
    });

    // user rolling
    socket.on('roll', () => {
        var num = Math.floor(Math.random() * (6 - 1) + 1);

        // move user `num` units
        var position = board.playerMove(socket.id, num);

        // we have a winner
        if(board.winner){
            io.emit('winner', User.get(board.winner));
        }

        if(position === null){
            return;
        }

        io.emit('movePlayer', num, position, User.get(socket.id), board.turn);
    });

    // Resetting the board
    socket.on('reset', (blocks) => {
        // only the winner may reset
        if(board.winner != socket.id){
            console.log('Non winner', socket.id, 'attempted to reset the board. Winner:', board.winner); //! d

            io.to(socket.id).emit('reset', 'Nice try loser');
            return;
        }

        resetEvent(blocks);
    });
});

/**
 * Reset interface method
 */
function resetEvent(blocks = null){
    board.reset(blocks);

    // gather list of players - emit join to all of them
    // In theory I should've just used rooms
    const players = Object.keys(board.players);

    for(var i in players){
        const id = players[i];
        io.to(id).emit('join', board);
    }
}