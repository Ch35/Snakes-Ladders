'use strict';

var users = {};

module.exports = class User{
    constructor(id, name, colour = '#FFF'){
        this.id = id;
        this.name = name;
        this.colour = colour;
        this.disconnected = false;
        this.messages = {};

        // append user
        users[id] = this;
    }

    /**
     * Send a message
     * @param {string} msg 
     * @return {bool}
     */
    sendMessage(msg){
        if(msg.length <= 0){
            return false;
        }

        this.messages[Date.now()] = msg;
        return true;
    }

    /**
     * Number of blocks to move
     * @param {int} blocks 
     */
    move(blocks){
        if(this.position === null){
            console.error('Position not initialized');
        }

        this.position += blocks;
    }

    /**
     * Reconnects user
     * @param {int} newId
     */
    reconnect(newId){
        // replace index ID
        delete users[this.id];

        this.disconnected = false;
        this.id = newId;
        
        users[newId] = this;
    }

    /**
     * Disconnects user
     * @param {Board} board
     */
    disconnect(board){
        this.disconnected = true;

        board.playerLeave(this.id);
    }

    /**
     * Returns a list of users
     * @returns {object}
     */
    static list(){
        return users;
    }

    /**
     * Returns a list of messages from all users
     * @param {bool} usernameKey
     * @returns {object}
     */
    static messages(usernameKey = false){
        var messages = {};

        for (var socketid in users){
            const user = users[socketid];
            const key = usernameKey ? user.name : socketid;

            // generate list of temporary messages with the user's colour
            var tempMsgs = {};
            for(var timestamp in user.messages){
                tempMsgs[timestamp] = {
                    text: user.messages[timestamp],
                    colour: user.colour,
                };
            }

            messages[key] = tempMsgs;
        }

        return messages;
    }

    /**
     * Finds user with specific username
     * @param {string} username 
     * @returns {object}
     */
    static find(username){
        return Object.values(users).find((usr)=>{
            return usr.name === username
        });
    }

    /**
     * Returns user
     * @param {int} id 
     * @returns {User}
     */
    static get(id){
        if(users.hasOwnProperty(id)){
            return users[id];
        }

        return null;
    }

    /**
     * Deletes user
     * @param {int} id 
     */
    static delete(id){
        if(users.hasOwnProperty(id)){
            delete users[id];

        } else{
            console.error('Missing user');
        }
    }
}