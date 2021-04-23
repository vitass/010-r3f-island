import React, { Suspense } from "react";
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
      <planeBufferGeometry attach="geometry" args={[32, 32, 1024, 1024]} />
      <meshStandardMaterial
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
        // colorManagement
        concurrent
        camera={{ position: [30, 2, -30] }}
        pixelRatio={[1, 1.33]}
      >
        {/* <fog attach="fog" args={["#cecece", 10, 70]} /> */}
        <color attach="background" args={["#465ca1"]} />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 1]} intensity={0.8} />
        <Suspense fallback={<Html center>Loading</Html>}>
          <Terrain />
        </Suspense>
        <Sky sunPosition={[10, 10, 1]} />
        <OrbitControls
          autoRotate
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
