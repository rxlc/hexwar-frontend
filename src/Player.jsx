import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom';

import { useToast, Box, Text } from '@chakra-ui/react'

import { GamePinContext, NameContext, GameContext } from './Contexts/Contexts';

import PlayerLanding from './Landing/PlayerLanding';
import PlayerGame from './Game/PlayerGame';

import { SocketContext } from './Contexts/Socket';

export default function Player() {
    const navigate = useNavigate();
    const {game, updateGame} = useContext(GameContext);
    const {gamePin, updateGamePin} = useContext(GamePinContext)
    const {name, updateName} = useContext(NameContext);

    const toast = useToast();

    const [atLanding, updateAtLanding] = useState(true); 

    const socket = useContext(SocketContext).socket;

    function initLandingSockets() {
        socket.emit('playerJoin', {gamePin: gamePin, name: name});

        socket.on('gameNotFound', () => {
            toast({
                title: `Invalid room pin`,
                status: "error",
                duration: 2000,
                position: "top"
            })
            navigate('/');
        })

        socket.on('updateGameState', (data) => {
            updateGame(data.game);
        })

        socket.on('gameInitialized', (data) => {
            updateAtLanding(false);
        })
    }

    useEffect(() => {        
        try {
            initLandingSockets()
        } catch (error) {
            toast({
                title: `Invalid room`,
                status: "error",
                duration: 2000,
                position: "top"
            })
            navigate('/');
        }
    }, []);

    return (
        <div>
            {atLanding ? <PlayerLanding/> : <PlayerGame/>}
        </div>
    )
}
