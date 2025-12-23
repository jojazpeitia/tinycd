'use client'
import * as THREE from 'three'
import { Suspense, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import {
  OrbitControls,
  useGLTF,
  Center,
  useTexture
} from '@react-three/drei'


function JewelCase({ coverUrl }: { coverUrl: string }) {
  const { scene } = useGLTF('/models/jewelcase.glb')

  // Load replacement texture
  const coverTex = useTexture(coverUrl)

  useEffect(() => {
    coverTex.flipY = false
    coverTex.colorSpace = THREE.SRGBColorSpace
    coverTex.needsUpdate = true

    scene.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return
      const mesh = obj as THREE.Mesh
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]

      mats.forEach((m) => {
        if (m?.name === 'cover.001') {
          const mat = m as THREE.MeshStandardMaterial
          mat.map = coverTex
          mat.needsUpdate = true
        }
      })
    })
  }, [scene, coverTex])

  useEffect(() => {
    scene.traverse((o) => {
      if ((o as any).isMesh) console.log('MESH:', o.name)
    })
  }, [scene])

  return <primitive object={scene} scale={10} position={[0.5, 0, 0]}/>
}

function Shelf() {
  const { scene } = useGLTF('/models/shelf.glb')
  return <primitive object={scene} scale={10}/>
}

function ResponsiveCamera() {
  const { camera, size } = useThree()

  useEffect(() => {
    const isMobile = size.width < 768

    if (isMobile) {
      camera.position.set(0, 0, 4) 
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = 90
      }
    } else {
      camera.position.set(0, 0, 4)
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = 75
      }
    }

    camera.updateProjectionMatrix()
  }, [camera, size])

  return null
}

export default function Scene() {
  return (
    <Canvas>
        <ResponsiveCamera />

        <ambientLight intensity={0.4} />

        {/* Key light - main light from top-front */}
        <directionalLight position={[5, 5, 5]} intensity={2.5} castShadow/>

        {/* Fill light - softer light from the side */}
        <directionalLight position={[-5, 3, 2]} intensity={0.5}/>

        {/* Rim light - from behind */}
        <directionalLight position={[0, -5, -5]} intensity={1.5}/>
        
        {/* Left directional light */}
        <directionalLight position={[-6, 2, 3]} intensity={1.5}/>

        <Suspense fallback={null}>
            <Center>
                <JewelCase coverUrl='/textures/front_discovery.png' />
                <Shelf />
            </Center>
        </Suspense>

        <OrbitControls rotateSpeed={1.5} enableZoom={false} />
    </Canvas>
  )
}

// useGLTF.preload('/models/jewelcase.glb')
useGLTF.preload('/models/shelf.glb')
