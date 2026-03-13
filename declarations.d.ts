import * as THREE from 'three';

declare module 'three/addons/controls/OrbitControls.js' {
  export class OrbitControls extends THREE.EventDispatcher {
    constructor(object: THREE.Camera, domElement?: HTMLElement);
    object: THREE.Camera;
    domElement: HTMLElement;
    enabled: boolean;
    target: THREE.Vector3;
    minDistance: number;
    maxDistance: number;
    minZoom: number;
    maxZoom: number;
    minPolarAngle: number;
    maxPolarAngle: number;
    minAzimuthAngle: number;
    maxAzimuthAngle: number;
    enableDamping: boolean;
    dampingFactor: number;
    enableZoom: boolean;
    zoomSpeed: number;
    enableRotate: boolean;
    rotateSpeed: number;
    enablePan: boolean;
    panSpeed: number;
    keyPanSpeed: number;
    autoRotate: boolean;
    autoRotateSpeed: number;
    enableKeys: boolean;
    keys: { LEFT: string; UP: string; RIGHT: string; BOTTOM: string };
    mouseButtons: { LEFT?: THREE.MOUSE; MIDDLE?: THREE.MOUSE; RIGHT?: THREE.MOUSE };
    touches: { ONE?: THREE.TOUCH; TWO?: THREE.TOUCH };
    update(): boolean;
    saveState(): void;
    reset(): void;
    dispose(): void;
    getPolarAngle(): number;
    getAzimuthalAngle(): number;
    listenToKeyEvents(domElement: HTMLElement): void;
  }
}