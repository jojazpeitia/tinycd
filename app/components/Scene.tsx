'use client'
import * as THREE from 'three'
import { Suspense, useEffect, useMemo, useLayoutEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { SkeletonUtils } from 'three-stdlib'
import {
  OrbitControls,
  useGLTF,
  Center,
  useTexture
} from '@react-three/drei'

// prototype array structure for albums
type Album = {
  id: string
  artist: string
  title: string
  upc: string
  coverUrl: string // e.g. "/covers/album1.jpg" or remote URL
}

const albums: Album[] = [
  {
    id: '1',
    artist: 'Artist',
    title: 'Album',
    upc: '1',
    coverUrl: '/textures/front_col.png',
  },
  {
    id: '2',
    artist: 'Flippers',
    title: 'Three Cheers For Our Side',
    upc: '2',
    coverUrl: '/textures/front_three.jpg',
  },
  {
    id: '3',
    artist: 'Daft Punk',
    title: 'Discovery',
    upc: '3',
    coverUrl: '/textures/front_discovery.png',
  }
]


function JewelCaseItem({ album, position }: { album: Album, position: [number, number, number] }) {
  const gltf = useGLTF('/models/jewelcase.glb')

  // Load replacement texture
  const coverTex = useTexture(album.coverUrl)

  useMemo(() => {
    coverTex.flipY = false
    coverTex.colorSpace = THREE.SRGBColorSpace
    coverTex.needsUpdate = true
  }, [coverTex])

    // Clone per item so each can have its own material/texture
  const scene = useMemo(() => SkeletonUtils.clone(gltf.scene) as THREE.Object3D, [gltf.scene])

  useLayoutEffect(() => {
    scene.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return
      const mesh = obj as THREE.Mesh

      // Optional: make sure we can edit per-mesh materials safely
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map((m) => m.clone())
      } else {
        mesh.material = (mesh.material as THREE.Material).clone()
      }

      // 🔥 Target the cover material by name (yours is "cover.001")
      const mat = mesh.material as THREE.MeshStandardMaterial
      if (mat?.name === 'cover.001') {
        mat.map = coverTex
        mat.needsUpdate = true
      }
    })
  }, [scene, coverTex])

  return <primitive object={scene} scale={10} position={position}/>
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
  const spacing = 0.4
  const startX = 0.6

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
                {albums.map((album, i) => (
                  <JewelCaseItem
                    key={album.id}
                    album={album}
                    position={[startX + i * spacing, 0, 0]}
                  />
                ))}
                <Shelf />
            </Center>
        </Suspense>

        <OrbitControls rotateSpeed={1.5} enableZoom={false} enablePan={false} />
    </Canvas>
  )
}

// useGLTF.preload('/models/jewelcase.glb')
useGLTF.preload('/models/shelf.glb')
