import * as THREE from "three";

import Sizes from "./Utils/Sizes";
import Time from "./Utils/Time";
import Camera from "./Camera";
import Renderer from './Renderer'

import World from './World/World';

let instance = null;

export default class Experience {
    constructor(containerRef, canvas) {

        if (instance) {
            return instance;
        }
        instance = this;
        
        this.canvas = canvas
        this.containerRef = containerRef;

        this.sizes = new Sizes();
        this.time = new Time();

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0xffe8d6 );

        this.camera = new Camera();
        this.renderer = new Renderer();

        this.containerRef.current.appendChild(this.renderer.instance.domElement);

        this.world = new World();
        
        this.sizes.on('resize', () => {
            this.resize();
        });

        this.time.on('tick', () => {
            this.update();
        });

        this.initListeners()
    }

    initListeners() {
        document.addEventListener("mousedown", (e) => {
            if (this.world.currentPlayer) this.world.currentPlayer.mouseFunc(e);
        });
    }

    resize() {
        this.camera.resize();
        this.renderer.resize();
    }

    update() {
        this.world.update();
        this.camera.update();
        this.renderer.render();
    }
}
