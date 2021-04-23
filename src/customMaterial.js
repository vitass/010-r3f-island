import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";

const CustomMaterial = shaderMaterial(
  {
    time: undefined,
  },
  ` 
  varying vec2 vUv;
  uniform float time;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }`,
  `
  varying vec2 vUv;
  uniform float time;
  void main() {
    gl_FragColor = vec4(1., 1., 1., 1.);
  }`
);

extend({ CustomMaterial });
