const express = require('express');

const app = express();

const PORT = process.env.PORT || 3001;

app.get('/', (req, res) => {
    res.send('Witaj! Serwer Express działa jak szalony.');
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Open in browser: http://localhost:${PORT}`);
});

try {
    const { Chess } = require('chess.js');
    const game = new Chess();
    console.log('Biblioteka chess.js załadowana poprawnie. Początkowy FEN:', game.fen());
} catch (error) {
    console.error('Nie udało się załadować biblioteki chess.js:', error);
}
