const Socket = io();

const cfg = {
    snakeColour: '#79d777',
    ladderColour: '#e1c08f',
};

// Login
var loginBox = document.getElementById('loginBox');
var loginBtn = document.getElementById('login');
var username = document.getElementById('username');
var colour = document.getElementById('colour');

// Chat
var chatbox = document.getElementById('chatbox');
var sendBox = document.getElementById('sendBox');
var sendBtn = document.getElementById('send');

// Gameplay
var rollBtn = document.getElementById('roll');
var joinBtn = document.getElementById('join');
var dice = document.getElementById('die');
var boardBox = document.getElementById('board');
var lineBox = document.getElementById('lineBox');
var resetBtn = document.getElementById('reset');


// auto login
const cookieUsername = getCookie('username');
if(cookieUsername){
    Socket.emit('login', cookieUsername, getCookie('colour'));

} else{
    username.focus();
    loginBox.classList.add('hidden');
}

// Logging in
loginBtn.addEventListener('click', () => {
    var colourStr = colour.value;

    if(!colourStr){
        alert('Please enter a valid colour');
        return;
    }

    Socket.emit('login', username.value, colourStr);
});

// sending message
sendBox.addEventListener('keypress', (e)=>{
    if(e.key === 'Enter'){
        sendMessage();
    }
});
sendBtn.addEventListener('click', sendMessage);

// rolling
rollBtn.addEventListener('click', () => {
    rollBtn.classList.add('hidden');
    Socket.emit('roll');
});

// resetting board
resetBtn.addEventListener('click', () => {
    Socket.emit('reset');
});

// joining
joinBtn.addEventListener('click', ()=>{
    Socket.emit('join');
});


/**
 * Received login response
 */
Socket.on('login', (user, error) => {
    if(error){
        alert(resp.error);
        return;
    }

    if(user){
        if(user.id === Socket.id){
            loginBox.style.display = 'none';
            document.cookie = 'username=' + user.name;
            document.cookie = 'colour=' + user.colour;

        } else{
            appendMessage({text: user.name + ' has connected', colour: 'white'}, 'SERVER', + new Date());
        }

    } else{
        alert('Something went wrong..');
    }
});

/**
 * New player joined
 */
Socket.on('playerJoin', (player) => {
    document.getElementById('block0').appendChild(createPlayer(player.id, player.colour));
});

/**
 * Player left
 */
Socket.on('playerLeave', (player) => {
    document.getElementById(player.id).remove();
});

/**
 * Player won
 */
Socket.on('winner', player => {
    rollBtn.classList.add('hidden');

    if(Socket.id == player.id){
        alert('You have won! Here\'s a piece of cheese 🧀');
        resetBtn.classList.remove('hidden');

    } else{
        alert('You have lost!');
        window.location.href = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=RickAstley';
    }
});

/**
 * Message specifically for non winner attempting to reset
 */
Socket.on('reset', msg => {
    alert(msg);
});

/**
 * Joined game
 * @param {object} board
 */
Socket.on('join', (board) => {
    
    // disable resetting for previous winner
    resetBtn.classList.add('hidden');

    // Deleting existing board
    boardBox.innerHTML = '<svg id="lineBox"></svg>';

    if(board.turn === Socket.id){
        rollBtn.classList.remove('hidden');
    }

    for(var i = board.blocks - 1; i >= 0; i--){
        var block = document.createElement('div');
        var playersInBlock = [];

        block.innerHTML = i;
        block.id = 'block'+i;
        block.classList.add('block');

        // iterate through players finding ones in this block
        for(var id in board.positions){
            const position = board.positions[id];

            if(position == i){
                playersInBlock.push(board.players[id]);
            }
        }

        // add players to block
        for(const player of playersInBlock){

            // block.setAttribute(player.id, true);
            block.appendChild(createPlayer(player.id, player.colour));
        }

        // mark as snake
        if(board.snakes.hasOwnProperty(i)){
            block.setAttribute('end', 'block'+board.snakes[i]);
            block.setAttribute('snake', true);
            block.setAttribute('portal', true);
            block.style.backgroundColor = cfg.snakeColour;
        }

        // mark as ladder
        if(board.ladders.hasOwnProperty(i)){
            block.setAttribute('end', 'block'+board.ladders[i]);
            block.setAttribute('ladder', true);
            block.setAttribute('portal', true);
            block.style.backgroundColor = cfg.ladderColour;
        }

        boardBox.appendChild(block);
    }

    joinBtn.classList.add('hidden');
    boardBox.classList.remove('hidden');
    document.getElementById('play').classList.remove('hidden');

    // add portal lines
    const boardBoxCoords = boardBox.getBoundingClientRect();
    lineBox.setAttribute('width', boardBoxCoords.width);
    lineBox.setAttribute('height', boardBoxCoords.height);

    const portals = document.querySelectorAll('[portal=true]');
    for(const portal of portals){
        const portalEnd = document.getElementById(portal.getAttribute('end'));

        const colour = portal.getAttribute('ladder') ? cfg.ladderColour : cfg.snakeColour;
        
        var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', portal.offsetLeft + 35);
        line.setAttribute('y1', portal.offsetTop + 35);
        line.setAttribute('x2', portalEnd.offsetLeft + 35);
        line.setAttribute('y2', portalEnd.offsetTop + 35);
        line.setAttribute('stroke', colour);
        line.setAttribute('stroke-width', 5);
        line.setAttribute('stroke-linecap', 'round');
        line.setAttribute('vector-effect', 'non-scaling-stroke');
        lineBox.appendChild(line);

        // add svg line to boardBox
        boardBox.appendChild(lineBox);
    }
});

/**
 * Received a movement req
 */
Socket.on('movePlayer', (num, position, player, turn)=>{
    console.log({
        num: num, 
        position: position,
        player: player,
        turn: turn,
    }); //! d

    if(position === false){
        if(player.id == Socket.id) {
            alert('It is not your turn to play');
        }

        return;
    }

    if(turn === Socket.id){
        rollBtn.classList.remove('hidden');
    }

    // remove last position
    document.getElementById(player.id).remove();

    // set new position
    let block = document.getElementById('block' + position);
    block.appendChild(createPlayer(player.id, player.colour))
    
    // update dice context
    if(player.id == Socket.id){
        dice.textContent = num;
    }
});

/**
 * Receiving a message
 */
Socket.on('message', appendMessage);

/**
 * Loading the page for the first time. Receiving server cached messages
 */
Socket.on('loadMessages', (msgList) => {
    for (var user in msgList) {
        const msgs = msgList[user];

        for (var timestamp in msgs){
            const msg = msgs[timestamp];

            console.log(msg); //! d
    
            appendMessage(msg, user, timestamp);
        }
    }
})

/**
 * Creates player element <div> block
 * @param {int} id 
 * @param {string} colour 
 * @returns {HTMLDivElement}
 */
function createPlayer(id, colour){
    let playerBlock = document.createElement('div');
    playerBlock.style.backgroundColor = colour;
    playerBlock.classList.add('player');
    playerBlock.id = id;

    return playerBlock;
}

/**
 * Emits message socket with the text within 'sendBox'
 */
function sendMessage(){
    const msg = sendBox.value;

    if(msg.length <= 0) {
        return;
    }

    Socket.emit('message', msg);
    sendBox.value = '';
}

/**
 * Appends message to chatBox list
 * @param {object} msg
 * @param {string} username
 * @param {int} timestamp
 */
function appendMessage(msg, username, timestamp = null){
    var item = document.createElement('li');
    var d = timestamp ? new Date(parseInt(timestamp)) : new Date();

    item.innerHTML = `<span style="color: ${msg.colour}"><small>${d.toLocaleTimeString()}</small> ${username}: ${msg.text}</span>`;

    chatbox.appendChild(item);
}

/**
 * Returns cookie value
 * @param {string} cname 
 * @returns {string}
 */
function getCookie(cname) {
    let name = cname + '=';
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    
    for(let i = 0; i <ca.length; i++) {
        let c = ca[i];
        
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }

        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }

    return '';
}