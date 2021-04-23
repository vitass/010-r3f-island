import React, { Suspense } from "react";
import { EffectComposer, DepthOfField } from "@react-three/postprocessing";
import { TextureLoader } from "three";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Html, Sky } from "@react-three/drei";

import "wipe.css";
import "./App.css";

const Terrain = () => {
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
        attach="material"
        color="white"
        metalness={0.05}
        roughness={0.55}
        displacementMap={elevationTexture}
        normalMap={normalsTexture}
        map={colorsTexture}
      />
    </mesh>
  );
};

function App() {
  return (
    <div className="App">
      <Canvas colorManagement camera={{ position: [0, 4, -22] }}>
        <fog attach="fog" args={["#cecece", 10, 70]} />
        <color attach="background" args={["#465ca1"]} />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 1]} intensity={0.8} />
        <Suspense fallback={<Html center>Loading</Html>}>
          <Terrain />
        </Suspense>
        <Sky sunPosition={[1, 1, 1]} />
        <OrbitControls
          autoRotate
          minDistance={12}
          maxDistance={20}
          maxPolarAngle={Math.PI * 0.5}
        />
        <EffectComposer>
          <DepthOfField
            focusDistance={0}
            focalLength={0.08}
            bokehScale={3}
            height={512}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

export default App;
