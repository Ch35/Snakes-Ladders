# Snakes & Ladders [0.2]
This project was made in a weekend while I had covid. Functionally, it did not turn out too bad.
The server backend was built with Socket IO in NodeJS.

## Features
Players have the ability to:
- Choose a username and colour
- Send messages
- Join in progress game

> Only game runs at a time. Nothing is saved, so once the server is shutdown everything is lost.
> Once you login, your *colour* and *username* are saved in the browser cookies. 
> To change your username/colour, simply delete the respective cookie(s) under `Application => Cookies`, or open the page in an incognito window.

## Setup
To run the project, install all [dependencies](#dependencies) and type `node index.js`.
The server runs on port 80, simply navigate to [localhost](http://localhost/).
> If you port forward on port 80 and you share your public IP, your friends over the internet can join. ***I would NOT recommend leaving your port open though.**

## Dependencies: 
- Socket.io 4.5.1
- Express 4.18.1