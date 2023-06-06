import { useState, useEffect, useContext } from 'react'
import { GamePinContext, NameContext, ExperienceContext } from './Contexts/Contexts';
import { SocketContext } from './Contexts/Socket';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Flex, Stack, Input, Button, Heading, Text, Divider, useToast } from '@chakra-ui/react'

export default function Landing() {
  const {gamePin, updateGamePin} = useContext(GamePinContext)
  const {name, updateName} = useContext(NameContext)
  const {socket, setSocket} = useContext(SocketContext)
  const {experience, setExperience} = useContext(ExperienceContext)

  useEffect(() => {
    const newSocket = io('http://localhost:8080', {
      transports: ['websocket']
    });
    setSocket(newSocket)
  }, []);

  useEffect(() => {
    if (experience && experience.world && experience.world.hexGrid) {
      experience.world.hexGrid.initInstance()
    }
  }, [experience])

  const navigate = useNavigate();

  const handlePinChange = (event) => {
    updateGamePin(event.target.value);
  };

  const handleNameChange = (event) => {
    updateName(event.target.value);
  };

  const handleJoin = (event) => {
    navigate('/game')
  }

  const handleHost = (event) => {
    navigate('/host')
  }

  return (
    <Flex
      style={{width: window.innerWidth, height: window.innerHeight, position: "fixed", left: "0px", top: "0px"}}
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      position={"fixed"}
      pointerEvents={"none"}
      zIndex={1}
    >
      <Text fontSize={"10px"} color="gray.600" mb="30px">(Still in development, expect very bad ui and couple of bugs here and there)</Text> 
      <Stack
        flexDir="column"
        mb="8%"
        justifyContent="center"
        alignItems="center"
        padding="4px"
        pointerEvents={"all"}
      >
        <Heading color="teal.400">HexWars</Heading>
        <Text fontSize={"10px"} color="gray.600" mb="30px">A strategic turn-based projectile game</Text>
        <Input variant="outline" placeholder="Game Pin" value={gamePin} onChange={handlePinChange} border={"2px solid #9a8c98"} textAlign={"center"}/>
        <Input variant="outline" placeholder="Name" value={name} onChange={handleNameChange} border={"2px solid #9a8c98"} outline={"none"} textAlign={"center"}/>
        <Button
          borderRadius={3}
          type="submit"
          variant="solid"
          colorScheme="teal"
          width="100%"
          onClick={handleJoin}
        >
          Join
        </Button>
        <Flex align="center" width="100%">
          <Divider border={"1px solid gray"}/>
          <Text padding="2" fontSize={"sm"} color="gray.600">OR</Text>
          <Divider border={"1px solid gray"}/>
        </Flex>
        <Button
          borderRadius={3}
          type="submit"
          variant="solid"
          colorScheme="teal"
          width="100%"
          onClick={handleHost}
        >
          Host
        </Button>     
      </Stack>
    </Flex>
  )
}
