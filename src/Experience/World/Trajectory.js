import * as THREE from 'three';
import Experience from "../Experience";

import { MeshLine, MeshLineMaterial, MeshLineRaycast } from 'three.meshline';

import gsap from 'gsap';

import EventEmitter from '../Utils/EventEmitter';

export default class Trajectory {
    constructor(position, hAngle, vAngle, hit=null) {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.world = this.experience.world;
        this.players = this.world.players;

        this.initPos = position
        this.hAngle = hAngle * (Math.PI/180)
        this.vAngle = vAngle * (Math.PI/180)

        this.initVel = 4
        this.gravity = 1

        this.hexGrid = this.experience.world.hexGrid;

        this.animate = false;
        this.animateCounter = 0;

        this.initInstance();

        
        this.known = false;
        this.hitPlayer = false;
        this.hit = hit;
        if (this.hit) this.known = true;
        if (this.known && this.hit.player) this.hitPlayer = true;
        
    }

    initInstance() {
        this.initPoints()
    }

    initPoints() {
        this.pathPoints = [];

        this.vel = {
            x: this.initVel * Math.cos(this.vAngle) * Math.cos(this.hAngle),
            y: this.initVel * Math.sin(this.vAngle),
            z: this.initVel * Math.cos(this.vAngle) * Math.sin(this.hAngle)
        }

        this.pos = {
            x: this.initPos.x,
            y: this.initPos.y,
            z: this.initPos.z
        }

        let i = 0;

        let highestReached = false;

        while (this.pos.y > 0) {
            i+=0.05;

            this.pathPoints.push(this.pos.x,this.pos.y,this.pos.z);

            this.pos.x = this.initPos.x + (this.vel.x * i);
            this.pos.y = this.initPos.y + (this.vel.y * i) + (-this.gravity*Math.pow(i,2))/2;
            this.pos.z = this.initPos.z + (this.vel.z * i);
            
            if (!highestReached) {
                if (this.pos.y < this.pathPoints[this.pathPoints.length-3]) {
                    highestReached = true;
                }
            }

            if (this.known) {
                if (highestReached && this.pos.y < this.hit.point.y) {
                    this.pathPoints.push(this.hit.point.x,this.hit.point.y,this.hit.point.z);
                    break;
                }
            }
            
        }
    }

    hexHit() {
        for (let i=0; i<this.pathPoints.length; i+=9) {
            for (let hex in this.hexGrid.hexagons) {
                let inside = this.insideHex(this.hexGrid.hexagons[hex].mesh, new THREE.Vector3(this.pathPoints[i], this.pathPoints[i+1], this.pathPoints[i+2]))
                if (inside) {
                    return {hex: this.hexGrid.hexagons[hex], point: new THREE.Vector3(this.pathPoints[i], this.getTopVerticies(this.hexGrid.hexagons[hex].mesh)[0].y, this.pathPoints[i+2])};
                }
            }
        }
        
        return null;
    }

    insideHex(hexMesh, point) {
        const vertices = this.getTopVerticies(hexMesh);

        const { x, z } = point;

        let isInside = false;
      
        for (let i = 0; i < vertices.length; i++) {
          const vertex1 = vertices[i];
          const vertex2 = vertices[(i + 1) % vertices.length];
      
          if (
            ((vertex1.z > z) !== (vertex2.z > z)) &&
            (x < ((vertex2.x - vertex1.x) * (z - vertex1.z)) / (vertex2.z - vertex1.z) + vertex1.x)
          ) {
            isInside = !isInside;
          }
        }

        if (isInside && vertices[0].y < point.y) {
            isInside = false;
        }
      
        return isInside;
      }

    getTopVerticies(hexMesh) {
        const hexagonGeometry = hexMesh.geometry;
        const positionAttribute = hexagonGeometry.attributes.position;
        const positionArray = positionAttribute.array;
        const worldMatrix = hexMesh.matrixWorld;
        
        const topHexagonVertices = [];
        
        // Assuming the hexagon is centered at the origin
        const segments = hexagonGeometry.parameters.radialSegments;
        
        for (let i = 0; i < segments; i++) {
            const xIndex = i * 3; // Index of x coordinate in positionArray
            const yIndex = xIndex + 1; // Index of y coordinate in positionArray
            const zIndex = xIndex + 2; // Index of z coordinate in positionArray
          
            const x = positionArray[xIndex];
            const y = positionArray[yIndex];
            const z = positionArray[zIndex];
          
            const vertex = new THREE.Vector3(x, y, z);
            vertex.applyMatrix4(worldMatrix);
            topHexagonVertices.push(vertex);
          }
        
        return topHexagonVertices;
    }

    initVisualPath() {
        this.pathPoints = this.pathPoints.slice(0, Math.floor(this.pathPoints.length/5));
        const pathGeom = new MeshLine();
        pathGeom.setPoints(this.pathPoints.flat());

        const material = new MeshLineMaterial({lineWidth: 0.06, color: 0xdc2f02});

        this.path = new THREE.Mesh(pathGeom, material);
        this.scene.add(this.path);
    }

    initAnimation() {
        this.animate = true;
        this.animateCounter = 0;
    }

    removeVisualPath() {
        if (this.path) {
            this.scene.remove(this.path);
        }
    }

    update() {
        if (this.animate) {
            if (this.animateCounter == 0) {
                this.animatedPathPoints = [];

                let hexHit = this.hexHit()
                let hitHex = null;

                if (hexHit) {
                    hitHex = hexHit.hex;
                }

                if (hitHex) {
                    for (let i=0; i<this.pathPoints.length; i+=3) {
                        if (this.insideHex(hitHex.mesh, new THREE.Vector3(this.pathPoints[i], this.pathPoints[i+1], this.pathPoints[i+2]))) {
                            if (i+3 < this.pathPoints.length) {
                                this.pathPoints = this.pathPoints.slice(0,i);
                            } else {
                                this.pathPoints = this.pathPoints.slice(0,i+3);
                            }
                            break;
                        }
                    }
                }

                const pathGeom = new MeshLine();
                pathGeom.setPoints(this.animatedPathPoints.flat());

                const material = new MeshLineMaterial({lineWidth: 0.06, color: 0xE7622F});

                this.path = new THREE.Mesh(pathGeom, material);
                this.scene.add(this.path);
            }

            if (this.animateCounter <= this.pathPoints.length) {
                this.animatedPathPoints = this.pathPoints.slice(0,this.animateCounter);
                this.path.geometry.setPoints(this.animatedPathPoints.flat());

                this.animateCounter += 3;
            } else if (this.animateCounter >= this.pathPoints.length) {
                this.vertexCounter = 0;
                this.animate = false;

                if (this.hitPlayer) {
                    let hitPlayerIndex = -1;

                    for (let i=0; i< this.players.length; i++) {
                        if (this.players[i].id == this.hit.player.id) {
                            hitPlayerIndex = i;
                        }
                    }
                    
                    if (hitPlayerIndex != -1) {
                        let originalY = this.players[hitPlayerIndex].mesh.position.y;

                        gsap.to(this.players[hitPlayerIndex].mesh.position, {
                            duration: 0.05,
                            y: originalY + Math.random() * 0.05-0.1,
                            repeat: 2,
                            yoyo: true,
                            ease: "power2.inOut",
                            onUpdate: () => {
                                this.players[hitPlayerIndex].line.position.copy(this.players[hitPlayerIndex].mesh.position);
                            },
                            onComplete: () => {
                                this.players[hitPlayerIndex].health -= 1;

                                if (this.players[hitPlayerIndex].health <= 0) {
                                    this.world.playerDied(this.players[hitPlayerIndex].id)
                                }

                                gsap.to(this.players[hitPlayerIndex].mesh.position, {
                                    duration: 0.05,
                                    y: originalY,
                                    ease: "power2.inOut",
                                    onUpdate: () => {
                                      this.players[hitPlayerIndex].line.position.copy(this.players[hitPlayerIndex].mesh.position);
                                    },
                                });
                            },
                        });
                    }
                }
            }
        }
    }

}