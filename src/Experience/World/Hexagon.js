import * as THREE from 'three';
import Experience from "../Experience";
import { CylinderGeometry } from 'three';

import HexGrid from './HexGrid';

export default class Hexagon {
    //Individual hexagon
    constructor(pos, radius, height, terrain) {
        this.experience = new Experience();
        this.scene = this.experience.scene;

        this.hexGrid = new HexGrid();
        this.terrains = this.hexGrid.terrains;
        this.terrainColors = this.hexGrid.terrainColors;

        this.terrain = terrain

        this.radius = radius
        this.height = height

        this.cubePos = pos;
        this.cubePos.r = -this.cubePos.q - this.cubePos.s;

        this.pos = {
            x: (this.cubePos.q + this.cubePos.s/2) * this.radius * Math.sqrt(3),
            z: this.cubePos.s * this.radius * 1.5    
        }

        this.initInstance();
    }

    
    initInstance() {
        let terrainColor = this.terrainColors[this.terrain]

        let geometry = new CylinderGeometry(this.radius-0.005, this.radius-0.005, this.height, 6 , 1, false)
        let material = new THREE.MeshBasicMaterial({color: terrainColor })
        
        let edges = new THREE.EdgesGeometry( geometry );

        this.line = new THREE.LineSegments( edges, new THREE.LineBasicMaterial( { color: 0x354334 } ) );
        this.mesh = new THREE.Mesh(geometry, material)

        this.mesh.position.x = this.pos.x
        this.mesh.position.z = this.pos.z
        this.line.position.copy(this.mesh.position)

        this.scaleOrigin(this.mesh)
        this.scaleOrigin(this.line)

        this.scene.add(this.line)
        this.scene.add(this.mesh)
    }

    scaleOrigin(mesh) {
        if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
        let shift = mesh.geometry.boundingBox.min.y;

        for (let i=1; i< mesh.geometry.attributes.position.array.length; i+=3) {
            mesh.geometry.attributes.position.array[i] -= shift;
        }
    }
}