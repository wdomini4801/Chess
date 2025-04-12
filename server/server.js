const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { Chess } = require('chess.js');

const app = express();
const httpServer = http.createServer(app);

const PORT = process.env.PORT || 3001;

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

let waitingPlayer = null;
const games = {};

io.on('connection', (socket) => {
    console.log('✅ Użytkownik połączony:', socket.id);

    socket.on('findGame', () => {
        console.log(`🔎 Gracz ${socket.id} szuka gry...`);
        if (waitingPlayer) {
            // znaleziono przeciwnika
            const player1 = waitingPlayer;
            const player2 = socket;
            waitingPlayer = null;

            const gameId = `game_${player1.id}_${player2.id}`;
            console.log(`🤝 Tworzenie gry ${gameId} dla ${player1.id} i ${player2.id}`);

            // pierwszy czekający dostaje białe
            const player1Color = 'w';
            const player2Color = 'b';

            games[gameId] = {
                id: gameId,
                players: {
                    [player1.id]: { socket: player1, color: player1Color },
                    [player2.id]: { socket: player2, color: player2Color },
                },
                board: new Chess(),
                startTime: Date.now(),
            };

            player1.join(gameId);
            player2.join(gameId);

            player1.emit('assignColor', player1Color);
            player2.emit('assignColor', player2Color);

            player1.emit('gameStart', { gameId, opponentId: player2.id });
            player2.emit('gameStart', { gameId, opponentId: player1.id });

            console.log(`▶️ Gra ${gameId} rozpoczęta.`);

        } else {
            waitingPlayer = socket;
            console.log(`⏳ Gracz ${socket.id} oczekuje na przeciwnika.`);
            socket.emit('waitingForOpponent');
        }
    });

    socket.on('disconnect', (reason) => {
        console.log(`❌ Użytkownik rozłączony: ${socket.id}, powód: ${reason}`);
        if (waitingPlayer === socket) {
            waitingPlayer = null;
            console.log(`💔 Gracz ${socket.id} przestał oczekiwać.`);
        }
    });
});

app.get('/', (req, res) => {
    res.send('Serwer szachów działa jak szalony! Nasłuchuje na WebSocket.');
});

httpServer.listen(PORT, () => {
    console.log(`🚀 Serwer nasłuchuje na porcie ${PORT}`);
    console.log(`   Otwórz frontend (http://localhost:5173) aby się połączyć.`);
    console.log(`   Test serwera: http://localhost:${PORT}`);
});
