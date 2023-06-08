import * as THREE from 'three';
import Experience from "../Experience";

import HexGrid from './HexGrid';
import Hexagon from './Hexagon';

import createText from '../Utils/Text'

import { gsap } from 'gsap';

export default class Player {
    constructor(hexPos, id, name, currentPlayer = false) {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.camera = this.experience.camera;
        this.sizes = this.experience.sizes;
        this.gltfLoader = this.experience.world.gltfLoader;

        this.hexGrid = new HexGrid();
        this.hexagons = this.hexGrid.hexagons;
        this.name = name;
        this.id = id;

        this.hexPos = hexPos;
        
        this.currentPlayer = currentPlayer;
        this.alive = true;

        this.width = 0.5;

        this.health = 3;
        
        this.nearby = [];
        this.nearToggled = false;

        this.selectedHex = null;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        if (!this.hexPos.s) this.hexPos.s = -this.hexPos.q - this.hexPos.r;

        this.initInstance();
        this.initText();
        this.moveEvent = new Event('move')
    }

    initInstance() {
        let height = this.hexagons[`${this.hexPos.q}${this.hexPos.r}${this.hexPos.s}`].height;

        let geometry = new THREE.BoxGeometry(this.width, this.width, this.width);
        
        var clonedGeometry = geometry.clone();

        clonedGeometry.rotateY(0);

        let materials;

        if (this.currentPlayer) {
            materials = [
                new THREE.MeshBasicMaterial({ color: 0x1d3557 }),
                new THREE.MeshBasicMaterial({ color: 0x457b9d }), 
                new THREE.MeshBasicMaterial({ color: 0x457b9d }), 
                new THREE.MeshBasicMaterial({ color: 0x457b9d }),
                new THREE.MeshBasicMaterial({ color: 0x457b9d }), 
                new THREE.MeshBasicMaterial({ color: 0x457b9d })  
            ];
        } else {
            materials = [
                new THREE.MeshBasicMaterial({ color: 0xba181b }),
                new THREE.MeshBasicMaterial({ color: 0xe5383b }), 
                new THREE.MeshBasicMaterial({ color: 0xe5383b }), 
                new THREE.MeshBasicMaterial({ color: 0xe5383b }),
                new THREE.MeshBasicMaterial({ color: 0xe5383b }), 
                new THREE.MeshBasicMaterial({ color: 0xe5383b })  
            ]
        }
        
        let edges = new THREE.EdgesGeometry( clonedGeometry );
        this.line = new THREE.LineSegments( edges, new THREE.LineBasicMaterial( { color: 0x22223b } ) );
        this.mesh = new THREE.Mesh(geometry, materials);
        this.mesh.geometry = clonedGeometry;
        
        this.mesh.position.x = this.hexagons[`${this.hexPos.q}${this.hexPos.r}${this.hexPos.s}`].pos.x;
        this.mesh.position.z = this.hexagons[`${this.hexPos.q}${this.hexPos.r}${this.hexPos.s}`].pos.z;
        this.mesh.position.y = height + this.width/2 + 0.01;

        this.line.position.copy(this.mesh.position)
        this.scene.add(this.mesh);
        this.scene.add(this.line);

        this.movePos = null;
    }

    initText() {
        this.nameText = createText(this.name, 0.3, 0x414141);
        this.healthText = createText("HEATH: " + this.health, 0.15, 0x414141);

        this.healthText.position.copy(this.mesh.position);
        this.nameText.position.copy(this.mesh.position);

        this.nameText.position.y += 0.8;
        this.healthText.position.y += 0.5;

        this.scene.add(this.nameText);
        this.scene.add(this.healthText);
    }

    updateText() {
        if (this.mesh && this.nameText && this.camera.instance) {
            this.nameText.position.copy(this.mesh.position);
            this.nameText.position.y += 0.8;
            this.nameText.lookAt(this.camera.instance.position);

            this.healthText.position.copy(this.mesh.position);
            this.healthText.position.y += 0.5;
            this.healthText.lookAt(this.camera.instance.position);
            this.healthText.text = "HEALTH: " + this.health;

            if (this.health == 1) {
                this.healthText.color = 0xd00000;
            } else if (this.health == 2) {
                this.healthText.color = 0xf6aa1c;
            } else if (this.health == 3) {
                this.healthText.color = 0x80b918;
            }

        }
    }

    destroy() {
        this.scene.remove(this.mesh);
        this.scene.remove(this.line);
        this.scene.remove(this.nameText);
        this.scene.remove(this.healthText);
    }

    //Toggle nearby hexes
    toggleNear(off = false) {
        if (this.currentPlayer) {
            if (!this.nearToggled && !off) {
                this.updateNear();
    
                for (let i=0; i<this.nearby.length; i++) {
                    this.nearby[i].mesh.material.color.setHex(0xb5838d)
                }

                this.nearToggled = true;
            } else {
                this.hexGrid.resetColor();
                this.nearToggled = false;
            }
        }
    }

    updateNear() {
        this.nearby = this.hexGrid.near(this.hexPos);
    }
    
    clearSelectedHex() {
        if (this.selectedHex) this.hexGrid.resetColorSingle(`${this.selectedHex.q}${this.selectedHex.r}${this.selectedHex.s}`);
    }

    mouseFunc(event) {
        this.mouse.x = (event.clientX / this.sizes.width)*2 - 1;
        this.mouse.y = -(event.clientY / this.sizes.height)*2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera.instance);

        let objects = Object.values(this.hexagons).map(hex => hex.mesh);

        this.intersects = this.raycaster.intersectObjects(objects);

        if (this.intersects.length > 0) {
            console.log("Clicked on", this.intersects[0].object.position)
            this.setMove()
        }
    }

    setMove() {
        if (this.nearToggled) {
            let validIndex = -1

            for (let i=0; i<this.nearby.length; i++) {
                if (this.nearby[i].mesh.uuid == this.intersects[0].object.uuid) {
                    validIndex = i;
                    break;
                }
            }

            if (validIndex != -1) {
                this.toggleNear(true);
                this.movePos = this.nearby[validIndex].cubePos

                this.clearSelectedHex();
                this.selectedHex = this.nearby[validIndex].cubePos;
                this.hexagons[`${this.selectedHex.q}${this.selectedHex.r}${this.selectedHex.s}`].mesh.material.color.setHex(0x22223b);
                document.dispatchEvent(this.moveEvent);
            }
        }
    }

    //Retrieved from server
    updatePos(hex, currentPlayer=false) {
        this.hexPos = hex;
        let newHex = this.hexagons[`${this.hexPos.q}${this.hexPos.r}${this.hexPos.s}`];
        let height = newHex.height;

        gsap.to(this.mesh.position, {
            x: newHex.pos.x,
            z: newHex.pos.z,
            y: height + this.width / 2 + 0.01,
            duration: 1,
            ease: "expo",
            onUpdate: () => {
                this.line.position.copy(this.mesh.position);
                if (currentPlayer) this.camera.controls.target.copy(this.mesh.position);
            }
        });
    }

    update() {
        this.updateText();
    }
}