'use strict';

var users = {};

module.exports = class User{
    constructor(name, colour = '#FFF'){
        this.name = name;
        this.colour = colour;
        this.position = null;
        this.disconnected = false;
        this.messages = {};
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
     */
    reconnect(){
        this.disconnected = false;
    }

    /**
     * Disconnects user
     */
    disconnect(){
        this.disconnected = true;
    }

    /**
     * Initializes block position
     * @param {int} pos
     */
    initPosition(pos = 0){
        this.position = pos;
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

        const users = this.list();

        for (var socketid in users){
            const user = users[socketid];
            const key = usernameKey ? user.name : socketid;

            messages[key] = user.messages;
        }

        return messages;
    }
}