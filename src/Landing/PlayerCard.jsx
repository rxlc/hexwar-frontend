import React, { memo } from 'react'

import { Flex, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'

const PlayerCard = memo(({player}) => {
    const MotionFlex = motion(Flex);

    return(
        <MotionFlex bg="#8e9aaf" boxShadow="sm" color="white" key={player.id} minW="100px" display="flex" alignSelf="flex-start" justifyContent="center" p="12px" borderRadius={"4px"} m="10px" whileHover={{ opacity: 0.7}}
                initial={{opacity: 0, scale: 0}}
                animate={{opacity: 1, scale: 1}}
                exit={{ opacity: 0, y: 50 }}  
                layout              
        >
            <Text fontSize={'16px'} fontWeight={"semibold"} color="#cbc0d3">{player.name}</Text>
        </MotionFlex>
    )
    },
    (next, prev) => next.player.id === prev.player.id
);

export default PlayerCard
