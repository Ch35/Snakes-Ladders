'use strict';

const maxBlocks = 100;
const minBlocks = 30;

module.exports = class Board{
    static instance;

    /**
     * @param {int} blocks 
     */
    constructor(blocks){
        this.setBlocks(blocks);
        this.players = {};
        this.positions = {};
        this.winner = false;
        this.turn = null;
    }

    /**
     * Instantiates board instance
     * Quite silly to use singleton instance with JS :)
     * @returns {Board}
     */
    static getInstance(){
        if(!Board.instance){
            Board.instance = new Board(100);
        }

        return Board.instance;
    }

    /**
     * Resets board status
     * @param {int} blocks
     */
    reset(blocks = null){
        if(blocks !== null){
            this.setBlocks(blocks);
        }

        for(var id in this.positions){
            this.positions[id] = 0;
        }

        this.cycleTurn();
        this.winner = false;
    }

    /**
     * @param {string} id 
     * @param {int} blocks
     * @return {mixed}
     */
    playerMove(id, blocks){

        // already have a winner
        if(this.winner){
            return null;
        }

        // not players turn to move
        if(this.turn !== id){
            console.error('Not your turn to move');
            return false;
        }

        // User not joined
        if(this.players.hasOwnProperty(id) === false){
            console.error('User not joined game');
            return null;
        }

        // switch to next player
        this.cycleTurn();

        this.positions[id] += blocks;
        var block = this.positions[id];

        // user on snake
        if(this.snakes.hasOwnProperty(block)){
            let distance = this.snakes[block] - block;

            // move backwards
            return this.playerMove(id, distance);
        }

        // user on ladder
        if(this.ladders.hasOwnProperty(block)){
            let distance = this.ladders[block] - block;

            // move forwards
            return this.playerMove(id, distance);
        }

        // player has won
        if(block >= this.blocks){
            block = this.blocks - 1; // since we start at 0 we need to add an offset
            this.winner = id;
        }

        return block;
    }

    /**
     * Deinitializes player
     * @param {int} id 
     */
    playerLeave(id){
        delete this.positions[id];
        delete this.players[id];

        // cycle to next available player
        if(id === this.turn){
            this.cycleTurn();
        }
    }

    /**
     * Initializes player
     * @param {User} player
     */
    playerJoin(player){

        // first player to join
        if(Object.keys(this.players).length === 0){
            this.turn = player.id;
        }

        this.positions[player.id] = 0;
        this.players[player.id] = player;
    }

    /**
     * Sets number of blocks
     * @param {int} blocks 
     */
    setBlocks(blocks){
        if(blocks > maxBlocks){
            blocks = maxBlocks;

        } else if(blocks < minBlocks){
            blocks = minBlocks;
        }

        this.blocks = blocks;

        // TODO: this needs to be more dynamic - based on the number of blocks
        const minPortals = 2;
        const maxPortals = 5;
        const countPortals = random(minPortals, maxPortals);

        this.snakes = {};
        this.ladders = {};

        for(var i = 0; i < countPortals; i++) {

            // Snake
            const snakeStart = this.availableBlock(2, false);

            this.snakes[snakeStart] = random(1, snakeStart - 1);

            // Ladder
            const ladderStart = this.availableBlock(this.blocks - 2, true);

            this.ladders[ladderStart] = random(ladderStart + 1, this.blocks);
        }
    }

    /**
     * Cycles turn to the next available person
     */
    cycleTurn(){
        const keys = Object.keys(this.players);

        if(keys.length > 1){
            const tempTurn = this.turn;
            var index = keys.findIndex(i => i == tempTurn);

            // start from beginning
            if(index === keys.length - 1){
                this.turn = keys[0];

            // use next user
            } else{
                this.turn = keys[index + 1];
            }

        } else{
            this.turn = keys[0];
        }
    }

    /**
     * Generates a random integer from the number of blocks on the board.
     * Recursively generates a random number until it finds one that is not used
     * @param {int} limit
     * @param {bool} moreThan
     * @returns {int}
     */
    availableBlock(limit, moreThan){
        const num = random(1, this.blocks);
        var comparison = moreThan ? num > limit : num < limit;

        return comparison || this.snakes.hasOwnProperty(num) || this.ladders.hasOwnProperty(num) 
            ? this.availableBlock(limit, moreThan) : num;
    }
}

/**
 * Returns a random integer between max and min
 * Both min and max are inclusive
 * @param {int} min 
 * @param {int} max 
 * @returns {int}
 */
function random(min, max){
    return Math.floor(Math.random() * (max - min) + min);
}