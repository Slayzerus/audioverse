// Utility to load FBX models using Three.js
import * as THREE from 'three';
// @ts-expect-error — three/examples/jsm has no type declarations
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

export function loadFBXModel(path: string): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    const loader = new FBXLoader();
    loader.load(path, resolve, undefined, reject);
  });
}

// Utility to load OBJ models
// @ts-expect-error — three/examples/jsm has no type declarations
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
export function loadOBJModel(path: string): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    const loader = new OBJLoader();
    loader.load(path, resolve, undefined, reject);
  });
}

// Utility to load textures
export function loadTexture(path: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load(path, resolve, undefined, reject);
  });
}
