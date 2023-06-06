import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom';
import { GamePinContext, GameContext, StartContext, ExperienceContext } from './Contexts/Contexts';

import HostLanding from './Landing/HostLanding';
import HostGame from './Game/HostGame';
import { SocketContext } from './Contexts/Socket';

import { useToast, Box, Text } from '@chakra-ui/react'

export default function Host() {
    const {gamePin, updateGamePin} = useContext(GamePinContext);
    const {game, updateGame} = useContext(GameContext);
    const {start, setStart} = useContext(StartContext);

    const {experience, updateExperience} = useContext(ExperienceContext);

    const socket = useContext(SocketContext).socket;
    const toast = useToast();

    //Prevents useEffect from triggering when retreiving start context
    const [startCounter, setStartCounter] = useState(0);
    const [started, setStarted] = useState(false)

    const [atLanding, updateAtLanding] = useState(true); 

    const navigate = useNavigate();

    function initLandingSockets() {
        socket.emit('hostJoin')

        socket.on('updateGameState', (data) => {
            updateGame(data.game)
        })

        socket.on('gameInitialized', (data) => {
            updateAtLanding(false);
            experience.world.startGame();
        })
    }

    useEffect(() => {
        try {
            initLandingSockets()
            toast({
                title: "Game created",
                status: "success",
                duration: 3000,
                position: "top"
            })
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

    useEffect(() => {
        if (startCounter > 0) {
            if (experience) {
                experience.world.initializeGame(game);
                updateGame(experience.world.gameObj);
            }
        } else {
            setStartCounter(startCounter + 1)
        }
    }, [start]);

    useEffect(() => {
        if (start && !started) {
            socket.emit('initializeGame', {game: game})
            setStarted(true);
        }
    }, [game])

    return (
        <div>
            {atLanding ? <HostLanding/> : <HostGame/>}
        </div>
    )
}
