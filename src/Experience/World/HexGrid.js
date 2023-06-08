import * as THREE from 'three';
import Experience from "../Experience";
import Hexagon from './Hexagon';
import { createNoise2D } from 'simplex-noise';

import alea from 'alea';

let instance = null;

export default class HexGrid {
    constructor() {
        if (instance) {
            return instance;
        }
        instance = this;

        this.experience = new Experience();
        this.scene = this.experience.scene;
        const prng = alea('seed');
        this.noise2D = createNoise2D(prng);
        this.size = 20
        this.hexSize = 1.2

        this.hexagons = {}

        this.terrainHeights = {
            DEEPWATER: 3,
            WATER: 3.6,
            SAND: 4,
            GRASS: 5,
            FOREST: 6.8
        }

        this.terrainColors = {
            DEEPWATER: 0x1985a1,
            WATER: 0x53b3cb,
            SAND: 0xffcb69,
            GRASS: 0x5c9a55,
            FOREST: 0x3f6b1e,
            SNOW: 0xedf6f9
        }

        this.terrains = {
            DEEPWATER: "DEEPWATER",
            WATER: "WATER",
            SAND: "SAND",
            GRASS: "GRASS",
            FOREST: "FOREST",
            SNOW: "SNOW"
        }
    }

    //Host only:
    initInstance() {
        //Clear previous hexes
        for (let hex in this.hexagons) {
            this.scene.remove(this.hexagons[hex].mesh)
            this.scene.remove(this.hexagons[hex].line)
        }
        this.hexagons = {}

        //Hexgrid & Terrain Generation
        for (let i = -this.size; i <= this.size+1; i++) {
            for (let j = -this.size; j <= this.size+1; j++) {
                let k = -i-j
                if (Math.abs(i) <= this.size && Math.abs(j) <= this.size && Math.abs(k) <= this.size) {
                    let height = Math.pow((this.noise2D(i * 0.1, j * 0.1) + 1.75) * 1.85, 1.25)
                    let terrain;

                    if (height < this.terrainHeights.WATER) {
                        terrain = this.terrains.WATER
                        if (height < this.terrainHeights.DEEPWATER) terrain = this.terrains.DEEPWATER
                        height = this.terrainHeights.WATER

                    } else if (height < this.terrainHeights.SAND) {
                        terrain = this.terrains.SAND
                    } else if (height < this.terrainHeights.GRASS) {
                        terrain = this.terrains.GRASS
                    } else if (height < this.terrainHeights.FOREST) {
                        terrain = this.terrains.FOREST
                    } else {
                        terrain = this.terrains.SNOW
                    }
                    let distOrigin = Math.max(Math.abs(i), Math.abs(j), Math.abs(k));
                    this.hexagons[`${i}${j}${k}`] = new Hexagon({q: i, r: j, s: k}, this.hexSize, height, terrain, distOrigin)
                }
            }
        }
    }

    //Generate random player positions
    generatePlayerPos() {
        if (Object.keys(this.hexagons).length != 0) {
            let keys = Object.keys(this.hexagons)
            return this.hexagons[keys[Math.floor(keys.length * Math.random())]].cubePos
        }
    }

    //Player only:
    replicateInstance(hexagons) {
        for (let hex in this.hexagons) {
            this.scene.remove(this.hexagons[hex].mesh)
            this.scene.remove(this.hexagons[hex].line)
        }
        this.hexagons = {}

        for (let i=0; i<hexagons.length; i++) {
            this.hexagons[`${hexagons[i].cubePos.q}${hexagons[i].cubePos.r}${hexagons[i].cubePos.s}`] = new Hexagon(hexagons[i].cubePos, this.hexSize, hexagons[i].height, hexagons[i].terrain, hexagons[i].distOrigin)
        }
    }

    toStringHexPos(hex) {
        return `${hex.q}${hex.r}${hex.s}`
    } 

    hexToXZ(hex) {
        return {
            x: (hex.q + hex.s/2) * this.radius * Math.sqrt(3),
            z: hex.s * this.radius * 1.5    
        }
    }

    //Reset hex to its original color
    resetColor() {
        for (let hex in this.hexagons) {
            if (this.hexagons[hex].mesh.material.color != 0x8B0000) this.hexagons[hex].mesh.material.color.setHex(this.terrainColors[this.hexagons[hex].terrain])
        }
    }

    resetColorSingle(hex) {
        this.hexagons[hex].mesh.material.color.setHex(this.terrainColors[this.hexagons[hex].terrain])
    }

    //Returns nearby hexagon coordinates
    near(hexPos) {
        let nearHexs = []

        let nearVectors = [[1,0], [1,-1], [0, -1], [-1,0], [-1,1], [0,1]]

        for (let i = 0; i < nearVectors.length; i++) {
            let newHexPos = `${hexPos.q + nearVectors[i][0]}${hexPos.r + nearVectors[i][1]}${hexPos.s - nearVectors[i][0] - nearVectors[i][1]}`

            if (this.hexagons[newHexPos]) nearHexs.push(this.hexagons[newHexPos]);
        }

        return nearHexs
    }
}