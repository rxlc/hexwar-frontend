import React, { memo } from 'react'

import { Flex, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'

const PlayerCard = memo(({player}) => {
    const MotionFlex = motion(Flex);

    return(
        <MotionFlex bg="gray" boxShadow="sm" color="white" key={player.id} display="flex" flexDirection={'row'} alignSelf="flex-start" p="12px" borderRadius={"4px"} whileHover={{ opacity: 0.7}}
                initial={{opacity: 0, scale: 0}}
                animate={{opacity: 1, scale: 1}}
                exit={{ opacity: 0, y: 50 }}  
                layout              
        >
            <Text fontSize={'16px'} fontWeight={"semibold"} color="teal.400">{player.name}</Text>
        </MotionFlex>
    )
    },
    (next, prev) => next.player.id === prev.player.id
);

export default PlayerCard
