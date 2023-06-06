import * as THREE from 'three';
import Experience from "../Experience";

export default class Helpers {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;

        this.setInstance();
    }

    setInstance() {
        //this.axesInstance = new THREE.AxesHelper(10);
        //this.scene.add(this.axesInstance);
    }
}