import React, { useState, useEffect, useContext } from 'react'
import { SocketContext } from '../Contexts/Socket';

import { GameContext, TimerContext, NameContext, GamePinContext, ExperienceContext } from '../Contexts/Contexts';

import { Flex, Text, VStack, HStack, Button, Input } from '@chakra-ui/react'

export default function PlayerGame() {
  const socket = useContext(SocketContext).socket;
  const {game, updateGame} = useContext(GameContext);
  const {timer, updateTimer} = useContext(TimerContext);
  const {name, updateName} = useContext(NameContext);
  const {gamePin, updateGamePin} = useContext(GamePinContext);
  const {experience, updateExperience} = useContext(ExperienceContext);
  const [moveToggled, setMoveToggled] = useState(false);
  const [fireToggled, setFireToggled] = useState(false);
  const [fireSubmitted, setFireSubmitted] = useState(false);
  const [playersLeft, updatePlayersLeft] = useState(null);
  const [winner, setWinner] = useState(null);

  const [alive, setAlive] = useState(true);

  const [gameOngoing, setGameOngoing] = useState(true);
  const [round, updateRound] = useState(1);

  function initializeScene() {
    experience.world.startGame();
    experience.world.replicateGame(game, name);
  }

  function toggleMove() {
    if (experience.world) {
      experience.world.toggleMove(moveToggled);
      setMoveToggled(!moveToggled);
    }
  }

  function toggleFire() {
    if (experience.world) {
      experience.world.updateTrajectory(true);
      setFireToggled(!fireToggled);
    }
  }

  function submitFire() {
    if (experience.world) {
      if (fireToggled) setFireToggled(!fireToggled)
      if (!fireSubmitted) setFireSubmitted(true)

      socket.emit('sendAction', {playerName: name, game: game, action: {move: null, fire: experience.world.returnTrajInfo()}})
    }
  }

  function cancelFireSubmit() {
    experience.world.updateTrajectory(true);
    setFireSubmitted(!fireSubmitted)
  }

  function updateHAngle(event) {
    if (experience.world) {
      if (!isNaN(event.target.value)) {
        if (Number(event.target.value) > 359) event.target.value = 359;
        if (Number(event.target.value) < 0) event.target.value = 0;
        experience.world.updateHAngle(Number(event.target.value));
      } else {
        experience.world.updateHAngle(null);
        event.target.value = "";
      }
    }
  }

  function updateVAngle(event) {
    if (experience.world) {
      if (!isNaN(event.target.value)) {
        if (Number(event.target.value) > 89) event.target.value = 89;
        if (Number(event.target.value) < 0) event.target.value = 0;
        experience.world.updateVAngle(Number(event.target.value));
      } else {
        experience.world.updateVAngle(null);
        event.target.value = "";
      }
    }
  }

  useEffect(() => {
    initializeScene();
  
    socket.on('updateTimer', (data) => {
      updateTimer(data.time)
    })

    socket.on('actionsProcessed', (data) => {
      updateGame(data.game)
    })

    socket.on('gameOverReturn', (data) => {
      setGameOngoing(false)
      setWinner(data.winner)
      if (experience) experience.world.gameOver(data.game);
    })

    socket.on('acknowledgeNext', (data) => {
      updateRound(data.game.round)
      updatePlayersLeft(data.game.players.filter((player) => {
        return player.health > 0
      }).length)

      if (experience) experience.world.nextTurn();
      setFireSubmitted(false);
      setMoveToggled(false);
      setFireToggled(false);
    })

    socket.on('sendTurnEvents', (data) => {
      if (experience) {
        experience.world.updateEvent(data.game);
        setMoveToggled(false);
      }
    })

    socket.on('gameOver', (data) => {
      updateGame(data.game)
      setGameOngoing(false)
    })

    socket.on('updateGameState', (data) => {
      updateGame(data.game);
    })

    document.addEventListener('move', () => {
      if (experience.world.currentPlayer) {
        let movePos = experience.world.currentPlayer.movePos;
        socket.emit('sendAction', {playerName: name, game: game, action: {move: movePos, fire: null}})
      }
    })

    document.addEventListener('defeated', () => {
      setAlive(false);
    })
  }, [])

  return (
    <Flex
      style={{width: window.innerWidth, height: window.innerHeight, position: "fixed", left: "0px", top: "0px"}}
      flexDirection="row"
      justifyContent="center"
      alignItems="flexStart"
      position={"fixed"}
      pointerEvents={"none"}
      zIndex={1}
      mt="5px"
    >
      { winner ? <Text fontSize={"30px"} userSelect={"none"} position="absolute" top="4%" fontWeight={"bold"}>{winner} has won!</Text> : null }
      { gameOngoing ? <VStack>
        <Text fontSize={"14px"} userSelect={"none"} position="absolute" right="1%" fontWeight="bold">GAME PIN: {gamePin}</Text>
        <Text fontSize={"14px"} userSelect={"none"} position="absolute" left="1%" fontWeight="bold">PLAYERS LEFT: {playersLeft}</Text>
        <Text fontSize={"14px"} userSelect={"none"} fontWeight="bold">ROUND {round}</Text>
        <Text fontSize={"14px"} userSelect={"none"} fontWeight="bold">{timer != 0 ? "Time Left: " : null}</Text>
        <Text fontSize={"30px"} userSelect={"none"} fontWeight={"bold"}>{timer != 0 ?  timer : null}</Text>
      </VStack> :
      null }
  
      <Flex alignSelf="flex-end" position="absolute" mb="20%">
        {alive ? null : 
          <Flex position="absolute" top="30%">
            <Text fontSize={"30px"} userSelect={"none"} fontWeight={"bold"}>You have been defeated</Text>
            <Text fontSize={"12px"} userSelect={"none"}>You are now spectating.</Text>
          </Flex>
        }

        {alive && !moveToggled && !fireToggled && !fireSubmitted && timer != 0 ?
          <HStack alignSelf="flex-end" pointerEvents={"all"}>
            <Button onClick={toggleMove}>Move</Button>
            <Button onClick={toggleFire}>Fire</Button>
          </HStack>
        : null}

        {alive && moveToggled && timer != 0 ?
            <HStack alignSelf="flex-end" pointerEvents={"all"}>
              <Button onClick={toggleMove}>Cancel</Button>
            </HStack>
        : null}

        {alive && fireToggled && timer != 0 ?
            <HStack alignSelf="flex-end" pointerEvents={"all"}>
              <Input color="white"  _placeholder={{ color: 'white' }}placeholder="Turn Angle (0-359)" onBlur={updateHAngle}/>
              <Input color="white"_placeholder={{ color: 'white' }} placeholder="Vertical Angle (0-89)" onBlur={updateVAngle}/>
              <Button onClick={submitFire}>Submit</Button>
              <Button onClick={toggleFire}>Cancel</Button>
            </HStack>
        : null}

        {alive && fireSubmitted && timer != 0 ? 
          <HStack alignSelf="flex-end" pointerEvents={"all"}>
            <Button onClick={cancelFireSubmit}>Cancel</Button>
          </HStack>
        : null}
      </Flex>
    </Flex>
  )
}

/*        
<div>PlayerGame
      {gameOngoing ?
      <div>
        <br/>
        {game.map ? "Map: " + game.map : null}
        <br/>
        {timer != 0 ? "Time Left: " + timer : null}
        <br/>
        {timer != 0 ?
          <div>Action:        
            {game.players ? game.players.map((player) => {
                return <button onClick={() => {
                  socket.emit('sendAction', {playerName: name, gamePin: game.gamePin, actionTarget: player.name})
                }}>{player.name}</button>
            }) : null}
          </div>
        : null}
        {timer == 0 ?
          <div>Event:
            {game.events ? game.events.map((event) => {
                return <div>{event}</div>
            }) : null}
          </div>
        : null }
        <div>Players:
          {game.players ? game.players.map((player) => {
              return <div>
                        {player.name} : {player.health} health
                    </div>
          }) : null}
        </div>
      </div>
    : <div>Game Over</div>}
    </div>
*/