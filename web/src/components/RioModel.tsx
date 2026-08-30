import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF, OrbitControls, Environment } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'

function GhostModel() {
  const group = useRef<THREE.Group>(null)
  const { scene } = useGLTF('/ghost-model.glb')

  return (
    <group ref={group}>
      <primitive object={scene} scale={1.5} position={[0, -0.5, 0]} />
    </group>
  )
}

function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial color="#10B981" wireframe />
    </mesh>
  )
}

interface RioModelProps {
  className?: string
}

export default function RioModel({ className = '' }: RioModelProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Suspense fallback={<LoadingFallback />}>
          <GhostModel />
          <Environment preset="studio" />
        </Suspense>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={2}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  )
}

useGLTF.preload('/ghost-model.glb')
