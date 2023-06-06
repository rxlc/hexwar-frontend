import React, {useContext, useEffect} from 'react'

import { GamePinContext, GameContext } from '../Contexts/Contexts'

import { Flex, Text } from '@chakra-ui/react';

export default function PlayerLanding() {
    const {game, updateGame} = useContext(GameContext);

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
            <Text>Waiting for host to start...</Text>
        </Flex>
    )
}
