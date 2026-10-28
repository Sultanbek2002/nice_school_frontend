'use client'

import { Suspense, useEffect, useMemo } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Center, OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

export const CAMPUS_MODEL_URL = '/3d/nice_campus.glb'

// The model is meshopt-compressed. drei's meshopt decoder is bundled (inline
// wasm); Draco is turned off so nothing is fetched from gstatic — the site's
// CSP only allows same-origin requests.
function Campus() {
  const { scene } = useGLTF(CAMPUS_MODEL_URL, false, true)
  useMemo(() => {
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })
  }, [scene])
  return (
    <Center>
      <primitive object={scene} />
    </Center>
  )
}

// OrbitControls sets touch-action: none on the canvas, which traps the page on
// phones. pan-y hands vertical swipes back to the browser so the page still
// scrolls; horizontal swipes keep rotating the model.
function AllowPageScroll() {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    const id = requestAnimationFrame(() => { gl.domElement.style.touchAction = 'pan-y' })
    return () => cancelAnimationFrame(id)
  }, [gl])
  return null
}

const deg = THREE.MathUtils.degToRad
// Same starting view as the model author's viewer: orbit 155°, tilt 60°, 200 m.
const START = new THREE.Vector3().setFromSphericalCoords(200, deg(60), deg(155))

export default function CampusModelCanvas({ onLoaded }: { onLoaded?: () => void }) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: START.toArray(), fov: 30, near: 1, far: 2000 }}
      onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05 }}
    >
      <color attach="background" args={['#dfe9f5']} />
      <hemisphereLight args={['#ffffff', '#8aa0b8', 1.4]} />
      <directionalLight
        position={[80, 140, 60]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
        shadow-bias={-0.0005}
      />
      <Suspense fallback={null}>
        <Campus />
        <Loaded onLoaded={onLoaded} />
      </Suspense>
      <OrbitControls
        makeDefault
        enableDamping
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.6}
        minDistance={25}
        maxDistance={320}
        minPolarAngle={deg(5)}
        maxPolarAngle={deg(88)}
      />
      <AllowPageScroll />
    </Canvas>
  )
}

function Loaded({ onLoaded }: { onLoaded?: () => void }) {
  useEffect(() => { onLoaded?.() }, [onLoaded])
  return null
}
