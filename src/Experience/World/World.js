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
        this.roundFinished = false;

        this.eventsDoneEvent = new Event('eventsDone');
        this.defeatedEvent = new Event('defeated');
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
        this.gameObj.displayEvents = [];

        this.processMoves(game);
        this.processHits(game);

        this.gameObj.round = this.gameObj.round + 1;

        this.processStorm(game);
    }

    processStorm(game) {
        if (this.gameObj.round % 6 == 0 && this.gameObj.currentDist > 6) {
            this.gameObj.currentDist = this.gameObj.currentDist - 1;
        }

        for (let i=0; i<this.gameObj.players.length; i++) {
            if (this.gameObj.players[i].health == 0) continue;
            let player = this.gameObj.players[i];

            if (this.gameObj.currentDist < Math.abs(player.pos.r)-1 || this.gameObj.currentDist < Math.abs(player.pos.q)-1 || this.gameObj.currentDist < Math.abs(player.pos.s)-1) {
                this.gameObj.players[i].health -= 1;
                this.gameObj.events.push({type: "storm", player: player})

                if (this.gameObj.players[i].health == 0) {
                    this.gameObj.displayEvents.push(`${player.name} was outside the zone! They are now eliminated from the game.`)
                } else {
                    this.gameObj.displayEvents.push(`${player.name} was outside the zone! Their health is now ${this.gameObj.players[i].health}.`)
                }
                

                if (this.gameObj.players[i].health == 0) {
                    this.gameObj.players[i].alive = false;
                }
            }
        }


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
            if (game.players[i].action && !game.players[i].action.move) {
                if (this.gameObj.players[i].landMinePercentage > 0) {
                    this.gameObj.players[i].landMinePercentage = Math.round(this.gameObj.players[i].landMinePercentage/3)
                }
            }

            if (game.players[i].action && game.players[i].action.move) {
                if (!moveConflictedIndex.has(i)) {
                    let alreadyThere = false;

                    for (let j=0; j<game.players.length; j++) {
                        if (game.players[j].pos.r == game.players[i].action.move.r && game.players[j].pos.q == game.players[i].action.move.q && game.players[j].pos.s == game.players[i].action.move.s) {
                            alreadyThere = true;
                        }
                    }

                    //move
                    if (!alreadyThere) this.gameObj.players[i].pos = game.players[i].action.move;
                    
                    let hitLM = false;

                    //landmine
                    if (Math.floor(Math.random() * 100) + 1 < this.gameObj.players[i].landMinePercentage && this.gameObj.players[i].landMinePercentage > 8) {
                        this.gameObj.players[i].health -= 1;
                        hitLM = true;
                        this.gameObj.events.push({type: "landMine", player: game.players[i]})

                        if (this.gameObj.players[i].health == 0) {
                            this.gameObj.displayEvents.push(`${this.gameObj.players[i].name} encountered a landmine! They are now eliminated from the game.`)
                        } else {
                            this.gameObj.displayEvents.push(`${this.gameObj.players[i].name} encountered a landmine!Their health is now ${this.gameObj.players[i].health}.`)
                        }
                        
                        if (this.gameObj.players[i].health == 0) {
                            this.gameObj.players[i].alive = false;
                        }
                    }

                    if (hitLM) {
                        this.gameObj.players[i].landMinePercentage = 0;
                    } else {
                        if (game.players[i].landMinePercentage == 0) {
                            this.gameObj.players[i].landMinePercentage = 2;
                        } else {
                            this.gameObj.players[i].landMinePercentage = Math.round(this.gameObj.players[i].landMinePercentage*2)
                            if (this.gameObj.players[i].landMinePercentage > 32) {
                                this.gameObj.players[i].landMinePercentage = 32;
                            }
                        }
                    }
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
                    .log(hexHit.hex.mesh.position)
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
                
                if (hitIndex != -1) {
                    if (this.gameObj.players[hitIndex].health == 0) {
                        this.gameObj.displayEvents.push(`${game.players[hitIndex].name} was hit by ${game.players[i].name}'s projectile! They are now elimated from the game.`)
                    } else {
                        this.gameObj.displayEvents.push(`${game.players[hitIndex].name} was hit by ${game.players[i].name}'s projectile! Their health is now ${this.gameObj.players[hitIndex].health}.`)
                    }
                }

                this.gameObj.players[i].action = null;
            }
        }
    }

    //PLAYER & HOST: update game visual state
    updateEvent(game) {
        this.roundFinished = false

        this.updateMove(game);
        this.updateFire(game);
        this.updateStorm(game);
    }

    updateStorm(game) {
        for (let hex in this.hexGrid.hexagons) {
            if (this.hexGrid.hexagons[hex].cubePos.r > game.currentDist || this.hexGrid.hexagons[hex].cubePos.q > game.currentDist || this.hexGrid.hexagons[hex].cubePos.s > game.currentDist) {
                this.hexGrid.hexagons[hex].mesh.material.color.setHex(0x8B0000);
            }
        }

    }

    sync(game) {
        console.log(game)

        for (let i=0; i<this.players.length; i++) {
            let currentPlayer;

            for (let j=0; j<game.players.length; j++) {
                if (this.players[i].id == game.players[j].id) {
                    currentPlayer = this.players[i];
                }
            }

            let currentAlive = currentPlayer.alive

            currentPlayer.health = game.players[i].health;
            currentPlayer.alive = game.players[i].alive;

            if (currentAlive != currentPlayer.alive) {
                this.playerDied(currentPlayer.id);
            }
        }
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

        for (let i=0; i<game.events.length; i++) {
            if (game.events[i].type == "fire") {
                let fireEvent = game.events[i];
                let firingPlayerServerRef = fireEvent.player;
                let firingPlayerIndex = -1;

                for (let j=0; j<this.players.length; j++) {
                    if (this.players[j].id == firingPlayerServerRef.id) {
                        firingPlayerIndex = j;
                    }
                }

                let originalY = this.players[firingPlayerIndex].mesh.position.y;

                gsap.to(this.players[firingPlayerIndex].mesh.rotation, { duration: 0.8, y: -fireEvent.hAngle * Math.PI/180, ease: "elastic", onUpdate: () => {
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
            } else if (game.events[i].type == "landMine") {
                let lmEvent = game.events[i];
                let lmPlayerServerRef = lmEvent.player;
                let lmPlayerIndex = -1;

                for (let j=0; j<this.players.length; j++) {
                    if (this.players[j].id == lmPlayerServerRef.id) {
                        lmPlayerIndex = j;
                    }
                }
                
                let originalY = this.players[lmPlayerIndex].mesh.position.y;

                gsap.to(this.players[lmPlayerIndex].mesh.position, {
                    duration: 0.05,
                    y: originalY - 0.08,
                    ease: "power2.inOut",
                    onUpdate: () => {
                        this.players[lmPlayerIndex].line.position.copy(this.players[lmPlayerIndex].mesh.position);
                    },
                    onComplete: () => {
                        this.players[lmPlayerIndex].health -= 1;

                        if (this.players[lmPlayerIndex].health <= 0) {
                            this.playerDied(this.players[lmPlayerIndex].id)
                        }

                        gsap.to(this.players[lmPlayerIndex].mesh.position, {
                            duration: 0.05,
                            y: originalY,
                            ease: "power2.inOut",
                            onUpdate: () => {
                                this.players[lmPlayerIndex].line.position.copy(this.players[lmPlayerIndex].mesh.position);
                            },
                        });
                    },
                });
                    
            } else if (game.events[i].type == "storm") {
                let lmEvent = game.events[i];
                let lmPlayerServerRef = lmEvent.player;
                let lmPlayerIndex = -1;

                for (let j=0; j<this.players.length; j++) {
                    if (this.players[j].id == lmPlayerServerRef.id) {
                        lmPlayerIndex = j;
                    }
                }
                
                let originalY = this.players[lmPlayerIndex].mesh.position.y;

                gsap.to(this.players[lmPlayerIndex].mesh.position, {
                    duration: 0.05,
                    y: originalY - 0.08,
                    ease: "power2.inOut",
                    onUpdate: () => {
                        this.players[lmPlayerIndex].line.position.copy(this.players[lmPlayerIndex].mesh.position);
                    },
                    onComplete: () => {
                        this.players[lmPlayerIndex].health -= 1;

                        if (this.players[lmPlayerIndex].health <= 0) {
                            console.log("died by storm")
                            this.playerDied(this.players[lmPlayerIndex].id)
                        }

                        gsap.to(this.players[lmPlayerIndex].mesh.position, {
                            duration: 0.05,
                            y: originalY,
                            ease: "power2.inOut",
                            onUpdate: () => {
                                this.players[lmPlayerIndex].line.position.copy(this.players[lmPlayerIndex].mesh.position);
                            },
                        });
                    },
                });
            }
            
        }
    }

    playerDied(playerId) {
        console.log("died")
        for (let i=0; i<this.players.length; i++) {
            if (this.players[i].id == playerId) {
                this.players[i].destroy();

                if (this.currentPlayer && this.currentPlayer.id == playerId) {
                    document.dispatchEvent(this.defeatedEvent);
                    this.camera.controls.enablePan = true;
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

    nextTurn(game) {
        //this.sync(game)

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