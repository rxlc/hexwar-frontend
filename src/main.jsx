import React from 'react'
import ReactDOM from 'react-dom/client'

import Landing from './Landing'
import Host from './Host'
import Player from './Player'

import { ContextProvider } from './Contexts/Contexts'
import { SocketProvider } from './Contexts/Socket'
import { ChakraProvider } from '@chakra-ui/react'

import ThreeScene from './ThreeScene'

import { createBrowserRouter, RouterProvider } from 'react-router-dom'

const router = createBrowserRouter([
    {
        path: "/",
        element: <Landing/>
    },
    {
        path: "/host",
        element: <Host/>
    },
    {
        path: "/game",
        element: <Player/>
    },
])

ReactDOM.createRoot(document.getElementById('root')).render(
    <ChakraProvider>
        <ContextProvider>
            <SocketProvider>
                <RouterProvider router={router}/>
                <ThreeScene/>
            </SocketProvider>
        </ContextProvider>
    </ChakraProvider>
)
