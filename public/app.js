const Socket = io();

// Login
var loginBox = document.getElementById('loginBox');
var loginBtn = document.getElementById('login');
var username = document.getElementById('username');

// Chat
var chatbox = document.getElementById('chatbox');
var sendBox = document.getElementById('sendBox');
var sendBtn = document.getElementById('send');

// Gameplay
var rollBtn = document.getElementById('roll');
var dice = document.getElementById('die');

loginBtn.addEventListener('click', () => {
    if(username.length <= 0){
        alert('Username cannot be blank');
        return;
    }

    Socket.emit('login', username.value);
});

sendBox.addEventListener('keypress', (e)=>{
    if(e.key === 'Enter'){
        sendMessage();
    }
});

sendBtn.addEventListener('click', sendMessage);

rollBtn.addEventListener('click', () => {
    Socket.emit('roll');
});


/**
 * Received login response
 */
Socket.on('login', (resp) => {
    if(resp.hasOwnProperty('error')){
        alert(resp.error);
        return;
    }

    if(resp){
        loginBox.style.display = 'none';

    } else{
        alert('Something went wrong..');
    }
});

/**
 * Received a roll req
 */
Socket.on('roll', (num)=>{
    dice.textContent = num;
});

/**
 * Receiving a message
 */
Socket.on('message', appendMessage);

/**
 * Loading the page for the first time. Receiving server cached messages
 */
Socket.on('loadMessages', (msgList) => {
    console.log('Loading Messages', msgList); //! d

    for (var user in msgList) {
        const msgs = msgList[user];

        for (var timestamp in msgs){
            const msg = msgs[timestamp];
    
            appendMessage(msg, user, timestamp);
        }
    }
})

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
 * @param {string} msg
 * @param {string} username
 * @param {int} timestamp
 */
function appendMessage(msg, username, timestamp = null){
    var item = document.createElement('li');
    var d = timestamp ? new Date(parseInt(timestamp)) : new Date();

    item.innerHTML = `<small>${d.toLocaleTimeString()}</small> ${username}: ${msg}`;

    chatbox.appendChild(item);
}