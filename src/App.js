import React, { Suspense, useEffect, useRef } from "react";
import { TextureLoader } from "three";
import { Canvas, useLoader, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Sky } from "@react-three/drei";

import "wipe.css";
import "./App.css";

const customUniforms = {
  uTime: { value: 0 },
  heightMap: { value: null },
};

const Terrain = () => {
  const material = useRef();

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

  useEffect(() => {
    customUniforms.heightMap.value = elevationTexture;

    material.current.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = customUniforms.uTime;
      shader.uniforms.heightMap = customUniforms.heightMap;

      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        `
          #include <common>
          vec4 permute(vec4 x)
          {
              return mod(((x*34.0)+1.0)*x, 289.0);
          }
          vec4 taylorInvSqrt(vec4 r)
          {
              return 1.79284291400159 - 0.85373472095314 * r;
          }
          vec3 fade(vec3 t)
          {
              return t*t*t*(t*(t*6.0-15.0)+10.0);
          }

          float cnoise(vec3 P)
          {
              vec3 Pi0 = floor(P); // Integer part for indexing
              vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
              Pi0 = mod(Pi0, 289.0);
              Pi1 = mod(Pi1, 289.0);
              vec3 Pf0 = fract(P); // Fractional part for interpolation
              vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
              vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
              vec4 iy = vec4(Pi0.yy, Pi1.yy);
              vec4 iz0 = Pi0.zzzz;
              vec4 iz1 = Pi1.zzzz;

              vec4 ixy = permute(permute(ix) + iy);
              vec4 ixy0 = permute(ixy + iz0);
              vec4 ixy1 = permute(ixy + iz1);

              vec4 gx0 = ixy0 / 7.0;
              vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
              gx0 = fract(gx0);
              vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
              vec4 sz0 = step(gz0, vec4(0.0));
              gx0 -= sz0 * (step(0.0, gx0) - 0.5);
              gy0 -= sz0 * (step(0.0, gy0) - 0.5);

              vec4 gx1 = ixy1 / 7.0;
              vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
              gx1 = fract(gx1);
              vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
              vec4 sz1 = step(gz1, vec4(0.0));
              gx1 -= sz1 * (step(0.0, gx1) - 0.5);
              gy1 -= sz1 * (step(0.0, gy1) - 0.5);

              vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
              vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
              vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
              vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
              vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
              vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
              vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
              vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

              vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
              g000 *= norm0.x;
              g010 *= norm0.y;
              g100 *= norm0.z;
              g110 *= norm0.w;
              vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
              g001 *= norm1.x;
              g011 *= norm1.y;
              g101 *= norm1.z;
              g111 *= norm1.w;

              float n000 = dot(g000, Pf0);
              float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
              float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
              float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
              float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
              float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
              float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
              float n111 = dot(g111, Pf1);

              vec3 fade_xyz = fade(Pf0);
              vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
              vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
              float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
              return 2.2 * n_xyz;
          }

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
          vec4 modelPosition = modelMatrix * vec4(position, 1.);
          float angle1 = sin(position.y + uTime * .45) * .01;
          
          for(float i = 1.0; i <= 2.; i++) {
            angle1 -= abs(cnoise(vec3(modelPosition.xz * 2.267 * i, uTime * .302)) * .006 / i);
          }


          mat2 rotateMatrix = get2dRotateMatrix(h < .02 ? angle1 : 0.);
          transformed.xz = transformed.xz * rotateMatrix;

          float dx = position.x;
          float dy = position.y;
          float freq = -sqrt(dx*dx + dy*dy) * .25;
          float amp = .2;
          float angle2 = h < .001 ? -uTime * .2 + freq * 4.2 : 0.;
          transformed.z += cnoise(vec3(0., step(.5, distance(vUv, vec2(.5))) * amp, 1.));

          for(float i = 1.0; i <= 4.; i++) {
            angle2 -= abs(cnoise(vec3(modelPosition.xz * i, uTime * 3.02)) * .06 / i);
          }

          objectNormal = normalize(vec3(0.0, -amp * freq * cos(angle2),1.0));
          vNormal = normalMatrix * objectNormal;
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <common>",
        `
          #include <common>
        `
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <tonemapping_fragment>",
        `
          #include <tonemapping_fragment>
          // float strength = smoothstep(.49, .5, distance(vUv, vec2(.5)));
          // gl_FragColor = vec4(gl_FragColor.rgb, 1. - strength);
        `
      );
    };
  }, [material, elevationTexture]);

  useFrame(() => {
    customUniforms.uTime.value += 0.1;
    material.current.needsUpdate = true;
  });

  return (
    <mesh rotation={[-Math.PI * 0.5, 0, 0]} position={[0, -3, 0]}>
      <planeBufferGeometry attach="geometry" args={[32, 32, 1024, 1024]} />
      <meshStandardMaterial
        ref={material}
        attach="material"
        color="white"
        roughness={0.85}
        displacementMap={elevationTexture}
        displacementScale={1.21}
        normalMap={normalsTexture}
        map={colorsTexture}
        transparent={true}
      />
    </mesh>
  );
};

function App() {
  return (
    <div className="App">
      <Canvas
        camera={{ position: [-30, 20.2, -30] }}
        colorManagement
        dpr={[1, 2]}
      >
        <color attach="background" args={"#dedede"} />
        <fog attach="fog" args={["#dedede", 35, 45]} />
        <Sky sunPosition={[12, 12, 3]} />
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[12, 12, 3]}
          intensity={0.88}
          color="#fdfbd3"
        />
        <Suspense fallback={<Html center>Loading</Html>}>
          <Terrain />
        </Suspense>
        <OrbitControls
          autoRotate
          autoRotateSpeed={1}
          minDistance={16}
          maxDistance={24}
          maxPolarAngle={Math.PI * 0.5}
          enablePan={false}
          enableRotate={true}
        />
      </Canvas>
    </div>
  );
}

export default App;
