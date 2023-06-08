import React, { useState, useEffect, useContext } from 'react'
import { SocketContext } from '../Contexts/Socket';

import { GameContext, TimerContext, NameContext, GamePinContext, ExperienceContext } from '../Contexts/Contexts';

import { Flex, Tooltip, Text, VStack, HStack, Button, Input } from '@chakra-ui/react'

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

  const [percentage, setPercentage] = useState(0);

  const [resultsTime, setResultsTime] = useState(false);
  const [displayEvents, updateDisplayEvents] = useState([])

  const [hAngle, setHAngle] = useState("0");
  const [vAngle, setVAngle] = useState("45");

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

  useEffect(() => {
    console.log("updating percentage", percentage)
  }, [percentage])

  function toggleFire() {
    if (experience.world) {
      experience.world.updateTrajectory(true);
      experience.world.updateVAngle(Number(vAngle));
      experience.world.updateHAngle(Number(hAngle));
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

  function updateHAngle() {
    if (experience.world) {
      if (!isNaN(hAngle)) {
        if (Number(hAngle) > 359) setHAngle(359)
        if (Number(hAngle) < 0) setHAngle(0)
        experience.world.updateHAngle(Number(hAngle));
      } else {
        experience.world.updateHAngle(null);
        setHAngle("");
      }
    }
  }

  function updateVAngle() {
    if (experience.world) {
      if (!isNaN(vAngle)) {
        if (Number(vAngle) > 89) setVAngle(89)
        if (Number(vAngle) < 0) setVAngle(0)
        experience.world.updateVAngle(Number(vAngle));
      } else {
        experience.world.updateVAngle(null);
        setVAngle("");
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
      setResultsTime(false);

      if (experience) {
        for (let i=0; i<data.game.players.length; i++) {
          if (experience.world.currentPlayer && experience.world.currentPlayer.id == data.game.players[i].id) {
            setPercentage(data.game.players[i].landMinePercentage)
          }
        }
      }

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
        updateDisplayEvents(data.game.displayEvents)
        setTimeout(() => {
          setResultsTime(true)
        }, 5000)
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

      { resultsTime ? 
      <VStack position="absolute" top="10%" left="1%" userSelect={"none"}>
        <Text fontSize={"15px"} fontWeight={"semibold"}>Round results: </Text>
        {displayEvents.map((event) => {
          return <Text fontSize={"14px"} userSelect={"none"}>{event}</Text>
        })}
      </VStack>
      : null }

      {alive ? null : 
          <Flex position="absolute" top="30%" flexDirection="column" textAlign={"center"}>
            <Text fontSize={"30px"} userSelect={"none"} fontWeight={"bold"}>You have been defeated</Text>
            <Text fontSize={"12px"} userSelect={"none"}>You are now spectating.</Text>
          </Flex>
        }
      
      { alive && !moveToggled && !fireToggled && !fireSubmitted && timer != 0 ?
        <Flex alignSelf={"flex-start"} position="absolute" mt="22%" right="30%">
              <Flex pointerEvents={"all"} flexDirection={"column"}>
                <Text fontSize={"12px"} fontWeight={"semibold"}>PERCENTAGE OF HITTING LANDMINE: </Text>
                {percentage < 10 ? <Text fontSize={"30px"} fontWeight={"bold"} color={"green"}>{percentage}%</Text> : null}
                {percentage >= 10 && percentage <= 20 ? <Text fontSize={"30px"} fontWeight={"bold"} color={"orange"}>{percentage}%</Text> : null}
                {percentage > 20 ? <Text fontSize={"30px"} fontWeight={"bold"} color={"red.700"}>{percentage}%</Text> : null}
                <Tooltip label='Everytime the player moves to a new location, they have a chance of hitting a landmine, the chance increases when the player moves and decreases when the player does not move.' placement='bottom'>
                  <Text fontSize="12px">(Hover for More Info)</Text>
                </Tooltip>  
              </Flex>
        </Flex>
      : null }
  
      <Flex alignSelf="flex-end" position="absolute" mb="20%">
        {alive && !moveToggled && !fireToggled && !fireSubmitted && timer != 0 ?
          <VStack alignSelf="flex-end" pointerEvents={"all"}>
            <HStack>
              <Button onClick={toggleMove}>Move</Button>
              <Button onClick={toggleFire}>Fire</Button>
            </HStack>
          </VStack>
        : null}

        {alive && moveToggled && timer != 0 ?
            <HStack alignSelf="flex-end" pointerEvents={"all"}>
              <Button onClick={toggleMove}>Cancel</Button>
            </HStack>
        : null}

        {alive && fireToggled && timer != 0 ?
            <HStack alignSelf="flex-end" pointerEvents={"all"}>
              <Input color="white"  _placeholder={{ color: 'white' }} value={hAngle} onChange={(event) => setHAngle(event.target.value)} placeholder="Turn Angle (0-359)" onBlur={updateHAngle}/>
              <Input color="white"_placeholder={{ color: 'white' }} value={vAngle} onChange={(event) => setVAngle(event.target.value)} placeholder="Vertical Angle (0-89)" onBlur={updateVAngle}/>
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