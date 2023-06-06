import React, { useContext, useEffect } from 'react'
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

  const toast = useToast();

  function startGame() {
    setStart(true);
  }

  useEffect(() => {

  }, [])

  return (
    <Flex
      style={{width: window.innerWidth, height: window.innerHeight, position: "fixed", left: "0px", top: "0px"}}
      flexDirection="row"
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
        mb="8%"
        justifyContent="center"
        alignItems="center"
        padding="4px"
        pointerEvents={"all"}
      >
        <Text fontSize={'20px'} fontWeight={"semibold"} color="teal.400">Players</Text>
        <Stack flexDir="column" w={400} spacing={3} mt="4px" width="100%" height="200px">
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
        flexDir="column"
        mb="8%"
        justifyContent="center"
        alignItems="center"
        padding="4px"
        pointerEvents={"all"}
      >
        <Text fontSize={'18px'} fontWeight={"bold"} color="teal.400">Game Pin:</Text>
        <Text fontSize={'40px'} fontWeight={"normal"} color="teal.400">{game.gamePin}</Text>
      </Stack>
      <Stack
        flexDir="column"
        mb="8%"
        justifyContent="center"
        alignItems="center"
        padding="4px"
        pointerEvents={"all"}
      >
        <Text color="teal.400">Host Panel</Text>
        <Button onClick={startGame}>Start Game</Button>
      </Stack>
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