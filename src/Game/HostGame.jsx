import React, { useState, useEffect, useContext } from 'react'
import { SocketContext } from '../Contexts/Socket';

import { GamePinContext, TimerContext, GameContext, ExperienceContext } from '../Contexts/Contexts'; 

import { Flex, Text, VStack, Button } from '@chakra-ui/react'

export default function HostGame() {
  const {game, updateGame} = useContext(GameContext)
  const {timer, updateTimer} = useContext(TimerContext);
  
  const {gamePin, updateGamePin} = useContext(GamePinContext);
  const {experience, updateExperience} = useContext(ExperienceContext);

  const [actionsProcessed, updateActionsProcessed] = useState(false)
  const [gameOngoing, updateGameOngoing] = useState(true)

  const [eventsDone, updateEventsDone] = useState(false)
  const [round, updateRound] = useState(1);

  const [playersLeft, updatePlayersLeft] = useState(null);
  const [winner, setWinner] = useState(null);
  const socket = useContext(SocketContext).socket;

  const [resultsTime, setResultsTime] = useState(false);
  const [displayEvents, updateDisplayEvents] = useState([])

  function initializeTurn() {
    socket.emit('nextTurn', {game: game})
  }

  useEffect(() => {
    initializeTurn();

    socket.on('updateTimer', (data) => {
      updateTimer(data.time)
    })

    socket.on('processActions', (data) => {
      experience.world.processActions(data.game);      
      updateGame(experience.world.gameObj);
      updateActionsProcessed(true);
    })

    socket.on('sendTurnEvents', (data) => {
      updateDisplayEvents(data.game.displayEvents)
      
      if (experience) {
        experience.world.updateEvent(data.game);
      }

      setTimeout(() => {
        setResultsTime(true)
      }, 3000)
    })
    
    socket.on('gameOver', (data) => {
      updateGame(data.game)
      updateGameOngoing(false)
    })

    socket.on('acknowledgeNext', (data) => {
      if (experience) experience.world.nextTurn(data.game);
      updatePlayersLeft(data.game.players.filter((player) => {
        return player.health > 0
      }).length)
      
      updateRound(data.game.round)
    })

    socket.on('gameOverReturn', (data) => {
      updateGameOngoing(false)
      setWinner(data.winner)
      if (experience) experience.world.gameOver(data.game);
    })

    document.addEventListener('eventsDone', () => {
      updateEventsDone(true)
    })


  }, [])

  useEffect(() => {
    if (actionsProcessed) {
      socket.emit('actionsProcessed', {game: game})
      updateActionsProcessed(false)
    }
  }, [game])

  function nextTurn() {
    updateEventsDone(false);
    setResultsTime(false);

    let playerLeft = game.players.filter((player) => {
      return player.health > 0
    }).length
    
    if (playerLeft <= 1) {
      socket.emit('gameOver', {game: game})
    } else {
      socket.emit('nextTurn', {game: game});
    }
  }

  return (
    <Flex
      style={{width: window.innerWidth, height: window.innerHeight, position: "fixed", left: "0px", top: "0px", userSelect: "none"}}
      flexDirection="row"
      justifyContent="center"
      alignItems="flexStart"
      position={"fixed"}
      pointerEvents={"none"}
      zIndex={1}
      mt="5px"
    >
      { winner ? <Text fontSize={"30px"} userSelect={"none"} position="absolute" top="4%" fontWeight={"bold"}>{winner} has won!</Text> : null }
      
      { eventsDone && resultsTime ? 
      <VStack position="absolute" top="10%" left="1%" userSelect={"none"}>
        <Text fontSize={"15px"} fontWeight={"semibold"}>Round results: </Text>
        {displayEvents.map((event) => {
          return <Text fontSize={"14px"} userSelect={"none"}>{event}</Text>
        })}
      </VStack>
      : null }

      { gameOngoing ? <VStack>
        <Text fontSize={"14px"} userSelect={"none"} position="absolute" right="1%" fontWeight="bold">GAME PIN: {gamePin}</Text>
        <Text fontSize={"14px"} userSelect={"none"} position="absolute" left="1%" fontWeight="bold">PLAYERS LEFT: {playersLeft}</Text>
        <Text fontSize={"14px"} userSelect={"none"} fontWeight="bold">ROUND {round}</Text>
        <Text fontSize={"14px"} userSelect={"none"} fontWeight="bold">{timer != 0 ? "Time Left: " : null}</Text>
        <Text fontSize={"30px"} userSelect={"none"} fontWeight={"bold"}>{timer != 0 ?  timer : null}</Text>
      </VStack> :
      null }
      { eventsDone && resultsTime ?
        <Button onClick={nextTurn} pointerEvents={"all"} position="absolute" bottom="3%">Next Turn</Button>
      : null}
    </Flex>
  ) 
}

/*
<div>Game Pin: {game.gamePin}</div>
      {gameOngoing ?
        <div>
        <br/>
        {timer != 0 ? "Time Left: " + timer : null}
        <br/>
        {timer == 0 ? 
          <div>Event:
            {game.events ? game.events.map((event) => {
                return <div>{event}</div>
            }) : null}
          </div>
        : null}
          <div>Players:
            {game.players ? game.players.map((player) => {
                return <div>
                          {player.name} : {player.health} health
                      </div>
            }) : null}
          </div>
        </div>
      : <div>Game Over</div>}
      {timer == 0?
        <button onClick={nextTurn}>Next Turn</button>
      : null}
    </div>
*/
