import * as THREE from 'three';
import Experience from "../Experience";

import Helpers from './Helpers';

import HexGrid from './HexGrid';
import Player from './Player';

import Trajectory from './Trajectory';

import gsap from 'gsap';

import EventEmitter from '../Utils/EventEmitter';

export default class World {
    constructor() {
        this.experience = new Experience();

        this.scene = this.experience.scene;
        this.sizes = this.experience.sizes;
        this.camera = this.experience.camera;

        this.helpers = new Helpers();

        this.players = [];
        this.currentPlayer = null;

        this.hexGrid = new HexGrid();

        this.gameObj = null;

        //Player only features
        this.hAngle = null;
        this.vAngle = null;

        this.fireVisualPath = null;

        this.trajectories = [];
        this.roundFinished = false

        this.eventsDoneEvent = new Event('eventsDone');
        this.defeatedEvent = new Event('defeated')
    }

    //HOST: initialize game with map and players
    initializeGame(game) {
        this.gameObj = JSON.parse(JSON.stringify(game));

        this.hexGrid = new HexGrid();
        this.hexGrid.initInstance();
        
        let hexagons = this.hexGrid.hexagons;
        for (let hex in hexagons) {
            this.gameObj.map.push({cubePos: hexagons[hex].cubePos,terrain: hexagons[hex].terrain, height: hexagons[hex].height})
        }

        for (let i=0; i < game.players.length; i++) {
            if (this.hexGrid) {
                let pos;

                
                while (true) {
                    pos = this.hexGrid.generatePlayerPos();
                    let takenPos = false
    
                    for (let j=0; j < this.players.length; j++) {
                        if (pos.q == this.players[j].hexPos.q && pos.r == this.players[j].hexPos.r && pos.s == this.players[j].hexPos.s) {
                            takenPos = true
                        }
                    }
    
                    if (!takenPos) {
                        break
                    }
                } 
                
                /*
                if (i == 0) {  
                    pos = {r: 1, s: 1, q: -2}
                } else {
                    pos = {r: 2, s: 1, q: -3}
                }
                */
                this.players.push(new Player(pos, game.players[i].id, game.players[i].name));
                this.gameObj.players[i].pos = pos;
            }
        }
    }
    
    //PLAYER: replicate game recieved from server
    replicateGame(game, name) {
        this.hexGrid = new HexGrid();
        this.hexGrid.replicateInstance(game.map);

        for (let i=0; i<game.players.length; i++) {
            if (game.players[i].name == name) {
                this.currentPlayer = new Player(game.players[i].pos, game.players[i].id, game.players[i].name, true);
                this.players.push(this.currentPlayer)
            } else {
                this.players.push(new Player(game.players[i].pos, game.players[i].id, game.players[i].name));
            }
        }

        if (this.currentPlayer) {
            this.camera.controls.target = new THREE.Vector3(this.currentPlayer.mesh.position.x, this.currentPlayer.mesh.position.y, this.currentPlayer.mesh.position.z);
            this.camera.controls.enablePan = false;
            this.camera.controls.maxDistance = 35;
            this.camera.controls.minDistance = 8;
        }
    }

    //HOST: at the end of turn, process player selected actions
    processActions(game) {
        this.gameObj = JSON.parse(JSON.stringify(game));
        this.gameObj.events = [];

        this.processMoves(game);
        this.processHits(game);

        this.gameObj.round = this.gameObj.round + 1;
    }

    processMoves(game) {
        let moveConflictedIndex = new Set();

        for (let i=0; i<game.players.length; i++) {
            if (game.players[i].action && game.players[i].action.move) {
                for (let j=0; j<game.players.length; j++) {
                    if (game.players[j].action && game.players[j].action.move) {
                        if (i != j && game.players[i].action.move.q == game.players[j].action.move.q && game.players[i].action.move.r == game.players[j].action.move.r && game.players[i].action.move.s == game.players[j].action.move.s) {
                            moveConflictedIndex.add(i);
                            moveConflictedIndex.add(j);
                        }
                    }
                }
            }
        }

        for (let i=0; i<game.players.length; i++) {
            if (game.players[i].action && game.players[i].action.move) {
                if (!moveConflictedIndex.has(i)) {
                    let alreadyThere = false;

                    for (let j=0; j<game.players.length; j++) {
                        if (game.players[j].pos.r == game.players[i].action.move.r && game.players[j].pos.q == game.players[i].action.move.q && game.players[j].pos.s == game.players[i].action.move.s) {
                            alreadyThere = true;
                        }
                    }

                    if (!alreadyThere) this.gameObj.players[i].pos = game.players[i].action.move;
                }
                
                this.gameObj.players[i].action = null;
            }
        }
    }

    processHits(game) {
        //Get player positions
        let playerPositions = [];

        for (let i=0; i<this.gameObj.players.length; i++) {
            playerPositions.push(this.gameObj.players[i].pos);
        }

        //Fire
        for (let i=0; i<game.players.length; i++) {
            if (game.players[i].action && game.players[i].action.fire) {
                let trajParam = game.players[i].action.fire
                let traj = new Trajectory(trajParam.position, trajParam.hAngle, trajParam.vAngle)
                let hexHit = traj.hexHit();

                /*
                if (hexHit) {
                    console.log(hexHit.hex.mesh.position)
                } else {
                    console.log("miss")
                }
                */

                //game processing
                let hitIndex = -1;

                for (let i=0; i<playerPositions.length; i++) {
                    if (hexHit && playerPositions[i].q == hexHit.hex.cubePos.q && playerPositions[i].r == hexHit.hex.cubePos.r && playerPositions[i].s == hexHit.hex.cubePos.s) {
                        this.gameObj.players[i].health -= 1; //hit player
                        hitIndex = i;
                    }
                }

                if (hitIndex != -1) {
                    if (this.gameObj.players[hitIndex].health == 0) {
                        this.gameObj.players[hitIndex].alive = false;
                    }
                }

                this.gameObj.events.push({type: "fire", player: game.players[i], position: trajParam.position, hAngle: trajParam.hAngle, vAngle: trajParam.vAngle, hit: (hexHit ? {player: (hitIndex != -1 ? game.players[hitIndex] : null), point: hexHit.point} : null)})

                this.gameObj.players[i].action = null;
            }
        }
    }

    //PLAYER & HOST: update game visual state
    updateEvent(game) {
        this.roundFinished = false

        this.updateMove(game);
        this.updateFire(game);

        console.log('sync')
    }

    updateMove(game) {
        for (let i=0; i<game.players.length; i++) {
            let worldPlayer = null;

            for (let j=0; j<this.players.length; j++) {
                if (this.players[j].id == game.players[i].id) {
                    worldPlayer = this.players[j];
                }
            }

            if (this.currentPlayer && this.currentPlayer.id == game.players[i].id) {
                worldPlayer = this.currentPlayer;
                this.currentPlayer.clearSelectedHex();
            }

            if (worldPlayer) {
                if (this.currentPlayer && this.currentPlayer.id == game.players[i].id) {
                    worldPlayer.updatePos(game.players[i].pos, true);
                } else {
                    worldPlayer.updatePos(game.players[i].pos);
                }
            }
        }
    }

    updateFire(game) {
        this.updateTrajectory(true);

        console.log(game.events);

        for (let i=0; i<game.events.length; i++) {
            let fireEvent = game.events[i];
            let firingPlayerServerRef = fireEvent.player;
            let firingPlayerIndex = -1;

            for (let j=0; j<this.players.length; j++) {
                if (this.players[j].id == firingPlayerServerRef.id) {
                    firingPlayerIndex = j;
                }
            }

            let originalY = this.players[firingPlayerIndex].mesh.position.y;

            gsap.to(this.players[firingPlayerIndex].mesh.rotation, { duration: 0.8, y: fireEvent.hAngle * Math.PI/180, ease: "elastic", onUpdate: () => {
                this.players[firingPlayerIndex].line.rotation.copy(this.players[firingPlayerIndex].mesh.rotation);
            
            },
            onComplete: () => {
                gsap.to(this.players[firingPlayerIndex].mesh.position, {
                    duration: 0.05,
                    y: originalY - 0.08,
                    ease: "power2.inOut",
                    onUpdate: () => {
                        this.players[firingPlayerIndex].line.position.copy(this.players[firingPlayerIndex].mesh.position);
                    },
                    onComplete: () => {
                        gsap.to(this.players[firingPlayerIndex].mesh.position, {
                            duration: 0.05,
                            y: originalY,
                            ease: "power2.inOut",
                            onUpdate: () => {
                              this.players[firingPlayerIndex].line.position.copy(this.players[firingPlayerIndex].mesh.position);
                            },
                        });
                    },
                });
                let playerTraj = new Trajectory(fireEvent.position, fireEvent.hAngle, fireEvent.vAngle, fireEvent.hit);
                playerTraj.initAnimation();
            
                this.trajectories.push(playerTraj);
             },});
        }
    }

    playerDied(playerId) {
        for (let i=0; i<this.players.length; i++) {
            if (this.players[i].id == playerId) {
                this.players[i].destroy();

                if (this.currentPlayer && this.currentPlayer.id == playerId) {
                    document.dispatchEvent(this.defeatedEvent);
                }
            }
        }
    }

    //PLAYER: toggle move visuals
    toggleMove(moveToggled) {
        if (this.currentPlayer) this.currentPlayer.toggleNear(moveToggled);
    }

    //PLAYER: update trajectory visuals
    updateHAngle(angle) {
        if (this.currentPlayer) {
            this.hAngle = angle
            this.updateTrajectory()
        }
    }

    updateVAngle(angle) {
        if (this.currentPlayer) {
            this.vAngle = angle
            this.updateTrajectory()
        }
    }

    updateTrajectory(remove=false) {
        if (remove) {
            if (this.fireVisualPath) {
                this.fireVisualPath.removeVisualPath()
                this.fireVisualPath = null;
            }
            return
        }

        if (this.currentPlayer && this.hAngle != null && this.vAngle != null) {
            if (this.fireVisualPath) {
                this.fireVisualPath.removeVisualPath();
                this.fireVisualPath = null;
            }

            this.fireVisualPath = new Trajectory({x: this.currentPlayer.mesh.position.x, y: this.currentPlayer.mesh.position.y, z: this.currentPlayer.mesh.position.z}, this.hAngle, this.vAngle);
            this.fireVisualPath.initVisualPath();
        }
    }

    //PLAYER: return trajectory info
    returnTrajInfo() {
        return {
            position: {x: this.currentPlayer.mesh.position.x, y: this.currentPlayer.mesh.position.y, z: this.currentPlayer.mesh.position.z}, 
            hAngle: (this.hAngle ? this.hAngle : 0),
            vAngle: (this.vAngle ? this.vAngle : 0)
        }
    }

    update() {
        for (let i=0; i<this.trajectories.length; i++) {
            this.trajectories[i].update();
        }

        for (let i=0; i<this.players.length; i++) {
            this.players[i].update();
        }

        if (!this.roundFinished) {
            let allTrajFinished = true;

            for (let i=0; i<this.trajectories.length; i++) {
                if (this.trajectories[i].finished == false) {
                    allTrajFinished = false;
                }
            }

            if (allTrajFinished) {
                this.roundFinished = true;
                document.dispatchEvent(this.eventsDoneEvent);
            }
        }

        
    }

    nextTurn() {
        for (let i=0; i<this.trajectories.length; i++) {
            this.trajectories[i].removeVisualPath();
        }

        this.trajectories = [];

        if (this.currentPlayer) {
            this.hAngle = null;
            this.vAngle = null;
        }
        
        if (this.currentPlayer) {
            this.camera.controls.target = new THREE.Vector3(this.currentPlayer.mesh.position.x, this.currentPlayer.mesh.position.y, this.currentPlayer.mesh.position.z);    
        }
    }

    gameOver(game) {
        for (let i=0; i<game.players.length; i++) {
            if (this.players[i].health > 0) {
                this.focus(this.players[i].mesh)
                break
            }
        }
    }

    focus(targetInstance) {
        let def = this;

        // Focus animation
        let aabb = new THREE.Box3().setFromObject(targetInstance);
        let center = aabb.getCenter(new THREE.Vector3());
        let size = aabb.getSize(new THREE.Vector3());
        let camPosition = this.camera.instance.position.clone();
        let targPosition = targetInstance.position.clone();
        let distance = camPosition.sub(targPosition);
        let direction = distance.normalize();

        let offset;
        let offsetY;

        if (targetInstance == this.centerObject) {
            let dist = this.launcher.instance.position.distanceTo(this.target.instance.position)
            
            offset = distance.clone().sub(direction.multiplyScalar(dist*1.4));
            offsetY = 1 + dist*0.2
        } else {
            offset = distance.clone().sub(direction.multiplyScalar(6));  
            offsetY = 2
        }

        

        let newPos = targetInstance.position.clone().sub(offset);
        newPos.y = this.camera.instance.position.y;

        // Rotate animation
        let rotDuration = 1;

        let pl = gsap.timeline();

        // Add focus animation to timeline

        // Add camera position animation to timeline
        pl.to(this.camera.instance.position, {
            duration: rotDuration,
            ease: "power4.out",
            x: newPos.x,
            y: center.y + offsetY,
            z: newPos.z,
            onUpdate: function() {
                def.camera.controls.update();
            },
        },0);

        pl.to(this.camera.controls.target, {
            duration: rotDuration,
            x: center.x,
            y: center.y,
            z: center.z,
            ease: "power4.out",
            onUpdate: function() {
                def.camera.controls.update();
            },
        },0);

        // Play all animations simultaneously
        pl.play(0);
    }

    startGame() {
        this.camera.controls.autoRotate = false;
        this.camera.controls.enabled = true;
    }
}