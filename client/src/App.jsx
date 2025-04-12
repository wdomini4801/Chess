import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

const SERVER_URL = 'http://localhost:3001';

function App() {
    const [socket, setSocket] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [appState, setAppState] = useState('connecting');
    const [gameId, setGameId] = useState(null);
    const [playerColor, setPlayerColor] = useState(null);
    const [gameResult, setGameResult] = useState(null);

    useEffect(() => {
        const newSocket = io(SERVER_URL, {
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Połączono z serwerem WebSocket. ID:', newSocket.id);
            setConnectionStatus('connected');
            setAppState(prevState => (prevState === 'connecting' ? 'lobby' : prevState));
        });

        newSocket.on('disconnect', (reason) => {
            console.log('Rozłączono z serwerem WebSocket. Powód:', reason);
            setConnectionStatus('disconnected');
            setAppState('lobby');
            setGameId(null);
            setPlayerColor(null);
            setGameResult(null);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Błąd połączenia WebSocket:', error);
            setConnectionStatus('error');
            setAppState('connecting');
        });

        newSocket.on('assignColor', (assignedColor) => {
            console.log(`Serwer przypisał kolor: ${assignedColor}`);
            setPlayerColor(assignedColor);
        });

        newSocket.on('gameStart', ({ gameId: newGameId, opponentInfo }) => {
            console.log(`Start gry! ID: ${newGameId}`, opponentInfo ? `Przeciwnik: ${opponentInfo}` : '');
            setGameId(newGameId);
            setAppState('inGame');
            setGameResult(null);
        });

        newSocket.on('gameOver', ({ result, reason }) => {
            console.log(`Koniec gry! Wynik: ${result}, Powód: ${reason}`);
            setAppState('gameOver');
            setGameResult({ result, reason });
        });

        return () => {
            console.log('Rozłączanie WebSocket...');
            newSocket.disconnect();
        };
    }, []);

    const handleFindGame = useCallback(() => {
        if (socket && connectionStatus === 'connected' && appState === 'lobby') {
            console.log('Wysyłanie żądania znalezienia gry...');
            socket.emit('findGame');
            setAppState('findingGame');
        } else {
            console.warn('Nie można znaleźć gry - socket niepołączony lub nie w lobby.');
        }
    }, [socket, connectionStatus, appState]);

    const handlePlayAgain = useCallback(() => {
        setAppState('lobby');
        setGameId(null);
        setPlayerColor(null);
        setGameResult(null);
    }, [handleFindGame]);

    const renderContent = () => {
        if (connectionStatus !== 'connected' || !socket) {
            switch (connectionStatus) {
                case 'connecting':
                    return <div>Łączenie z serwerem...</div>;
                case 'disconnected':
                    return <div>Rozłączono. Próba ponownego połączenia... (lub przycisk "Połącz")</div>;
                case 'error':
                    return <div>Błąd połączenia z serwerem. Spróbuj odświeżyć stronę.</div>;
                default:
                    return <div>Inicjalizacja...</div>
            }
        }

        switch (appState) {
            case 'lobby':
                return (
                    <div>
                        <h2>Witaj w Lobby!</h2>
                        <button onClick={handleFindGame} disabled={connectionStatus !== 'connected'}>
                            Znajdź Grę Online
                        </button>
                    </div>
                );
            case 'findingGame':
                return <div>Oczekiwanie na przeciwnika...</div>;
            case 'inGame':
                if (!gameId || !playerColor) {
                    return <div>Błąd: Brak ID gry lub koloru gracza. Przechodzenie do lobby...</div>;
                }
                // return (
                //     <Game
                //         socket={socket}
                //         gameId={gameId}
                //         playerColor={playerColor}
                //         onGameOver={(resultData) => { // Opcjonalna funkcja zwrotna z Game, jeśli Game wykryje koniec gry
                //             setAppState('gameOver');
                //             setGameResult(resultData);
                //         }}
                //     />
                // );
            case 'gameOver':
                return (
                    <div>
                        <h2>Koniec Gry!</h2>
                        <p><strong>Wynik:</strong> {gameResult?.result || 'Nieznany'}</p>
                        {gameResult?.reason && <p><strong>Powód:</strong> {gameResult.reason}</p>}
                        <button onClick={handlePlayAgain}>Zagraj Ponownie</button>
                    </div>
                );
            case 'connecting':
            default:
                return <div>Ładowanie stanu aplikacji...</div>;
        }
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>Szachy Online (React + Socket.IO)</h1>
                <p>Status połączenia: {connectionStatus}</p>
                {socket && <p>Twoje ID: {socket.id}</p>}
            </header>
            <main className="App-content">
                {renderContent()}
            </main>
        </div>
    );
}

export default App;
