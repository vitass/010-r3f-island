import React, { Suspense, useEffect, useRef } from "react";
import { TextureLoader } from "three";
import { Canvas, useLoader, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Sky } from "@react-three/drei";

import "wipe.css";
import "./App.css";

const customUniforms = {
  uTime: { value: 0 },
  heightMap: {value: null}
};

const Terrain = () => {
  const material = useRef();

  useEffect(() => {
    customUniforms.heightMap.value = elevationTexture;

    material.current.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = customUniforms.uTime;
      shader.uniforms.heightMap = customUniforms.heightMap;

      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        `
          #include <common>
          uniform float uTime;
          uniform sampler2D heightMap;
          mat2 get2dRotateMatrix(float _angle) {
              return mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle));
          }
        `
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `
          #include <begin_vertex>
          float h = texture2D(heightMap, vUv).y;
          float angle = sin(position.y + uTime * .4) * .01;
          mat2 rotateMatrix = get2dRotateMatrix(h < .02 ? angle : 0.);
          transformed.xz = transformed.xz * rotateMatrix;
        `
      );
    };
  }, [material]);

  useFrame(() => {
    customUniforms.uTime.value += .1
    material.current.needsUpdate = true;
  });

  const elevationTexture = useLoader(
    TextureLoader,
    "textures/iceland_height_map.png"
  );
  const normalsTexture = useLoader(
    TextureLoader,
    "textures/iceland_normal_map_invert.png"
  );
  const colorsTexture = useLoader(
    TextureLoader,
    "textures/iceland_height_map_color.png"
  );
  return (
    <mesh rotation={[-Math.PI * 0.5, 0, 0]} position={[0, -3, 0]}>
      <planeBufferGeometry attach="geometry" args={[32, 32, 512, 512]} />
      <meshStandardMaterial
        ref={material}
        attach="material"
        color="white"
        roughness={0.55}
        displacementMap={elevationTexture}
        displacementScale={1.2}
        normalMap={normalsTexture}
        map={colorsTexture}
      />
    </mesh>
  );
};

function App() {
  return (
    <div className="App">
      <Canvas
        concurrent
        camera={{ position: [-30, 20.2, -30] }}
        pixelRatio={[1, 1.33]}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 1]} intensity={0.8} />
        <Suspense fallback={<Html center>Loading</Html>}>
          <Terrain />
        </Suspense>
        <Sky sunPosition={[10, 10, 1]} />
        <OrbitControls
          autoRotate
          autoRotateSpeed={1}
          minDistance={12}
          maxDistance={20}
          maxPolarAngle={Math.PI * 0.5}
          enablePan={false}
          enableRotate={true}
          enableZoom={false}
        />
      </Canvas>
    </div>
  );
}

export default App;
