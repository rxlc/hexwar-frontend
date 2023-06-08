import React, { useContext, useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'

import { GamePinContext, GameContext, StartContext, ExperienceContext } from '../Contexts/Contexts'
import { SocketContext } from '../Contexts/Socket'

import { Flex, Stack, Text, Button, useToast } from '@chakra-ui/react'

import PlayerCard from './PlayerCard'

export default function HostLanding() {
  const {gamePin, updateGamePin} = useContext(GamePinContext)
  const {game, updateGame} = useContext(GameContext);
  const {start, setStart} = useContext(StartContext);
  const {experience, updateExperience} = useContext(ExperienceContext);
  const socket = useContext(SocketContext).socket;

  const [playerCount, setPlayerCount] = useState(0);

  const toast = useToast();

  function startGame() {
    setStart(true);
  }

  useEffect(() => {
    socket.on('updateGameState', (data) => {
      setPlayerCount(data.game.players.length)
    })
  }, [])

  return (
    <Flex
      style={{width: window.innerWidth, height: window.innerHeight, position: "fixed", left: "0px", top: "0px"}}
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      position={"fixed"}
      pointerEvents={"none"}
      zIndex={1}
      backdropFilter="auto" 
      backdropBlur="10px"
    >
      <Stack
        flexDir="column"
        justifyContent="center"
        alignItems="center"
        padding="4px"
        pointerEvents={"all"}
        mb="2%"
      >
        <Text fontSize={'18px'} fontWeight={"bold"} color="#cb997e">Game Pin:</Text>
        <Text fontSize={'40px'} fontWeight={"normal"} color="#ddbea9">{game.gamePin}</Text>
      </Stack>
      <Flex
        flexDir="row"
        height="70vh"
      >
        <Stack
          flexDir="column"
          mb="8%"
          justifyContent="flex-start"
          alignItems="center"
          padding="4px"
          pointerEvents={"all"}
          bg="#f8edeb"
          opacity={0.7}
          borderRadius={"8px"}
          boxShadow={"0px 0px 10px 5px rgba(0,0,0,0.2)"}
          width="60vw"
          mr="4%"
        >
          <Text fontSize={'20px'} mt="3%" fontWeight={"semibold"} color="#6d6875">Players ({playerCount})</Text>
          <Stack flexDir="row" mt="4px" width="100%" gap="15px" height="200px" p="10px">
              <AnimatePresence>
                {game.players ? game.players.slice().reverse().map((player) => {
                  return (
                    <PlayerCard key={player.id} player={player}/>
                  )
                }) : null}
              </AnimatePresence>
          </Stack>
        </Stack>
        <Stack
          borderRadius={"8px"}
          flexDir="column"
          mb="8%"
          width="40%"
          justifyContent="flex-start"
          alignItems="flex-start"
          padding="4px"
          bg="#f8edeb"
          opacity={0.7}
          pointerEvents={"all"}
          
          boxShadow={"0px 0px 10px 5px rgba(0,0,0,0.2)"}
        >
          <Text fontSize={'20px'} mt="3%" fontWeight={"semibold"} color="#6d6875" justifySelf={"flex-start"} alignSelf={"center"}>Game Settings</Text>
          <Button onClick={startGame} bg="#b5838d" color="#ffcdb2" width="100%">Start Game</Button>
        </Stack>
      </Flex>
    </Flex>
  )
}

/*
        <div>Host
            {game.gamePin ? <div>Game Pin: {game.gamePin}</div> : null}
        </div>
        <div>
            <div>Players:        
                {game.players ? game.players.map((player) => {
                    return <div>{player.name}</div>
                }) : null}
            </div>
        </div>
        <button onClick={startGame}>Start Game</button>
*/