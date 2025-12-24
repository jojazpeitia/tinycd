'use client'
import * as THREE from 'three'
import { Suspense, useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react'
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber'
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
  { id: '1',artist: 'Artist', title: 'Album', upc: '1', coverUrl: '/textures/front_col.png'},
  { id: '2', artist: 'Flippers', title: 'Three Cheers For Our Side', upc: '2', coverUrl: '/textures/front_three.jpg'},
  { id: '3', artist: 'Daft Punk', title: 'Discovery', upc: '3', coverUrl: '/textures/front_discovery.png' },
]


function JewelCaseItem({ album, position, onSelect }: { album: Album, position: [number, number, number], onSelect: (album: Album) => void }) {
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

  const handleClick = (e: ThreeEvent<PointerEvent>) => {
    // Only respond if this object is the first intersection
    if (e.intersections[0]?.object === e.object) {
      e.stopPropagation()
      onSelect(album)
    }
  }

  return <primitive object={scene} scale={10} position={position} onClick={handleClick}/>
}

function Shelf() {
  const { scene } = useGLTF('/models/shelf.glb')
  
  return <primitive object={scene} scale={10}/>
}

function ResponsiveCamera() {
  const { camera, size } = useThree()

  useEffect(() => {
    const isMobile = size.width < 768

    camera.position.set(0, 0, 4)

    if (camera instanceof THREE.PerspectiveCamera) camera.fov = isMobile ? 90 : 75

    camera.updateProjectionMatrix()

  }, [camera, size])

  return null
}

function InspectScene({ album }: { album: Album }) {
  return (
    <Canvas camera={{ position: [0, 0, 3.2], fov: 45 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={2.2} />
      <directionalLight position={[-5, 2, 2]} intensity={0.8} />

      <Suspense fallback={null}>
        <Center>
          <JewelCaseItem album={album} position={[0, 0, 0]} onSelect={() => {}} />
        </Center>
      </Suspense>

      <OrbitControls rotateSpeed={1.2} enableZoom enablePan />
    </Canvas>
  )
}

function InspectModal({album, onClose, }: { album: Album, onClose: () => void }) {

  // esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
      }}
      // click outside closes
      onPointerDown={onClose} 
    >
      {/* blur + dim layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          background: 'rgba(0,0,0,0.35)',
        }}
      />

      {/* modal card */}
      <div
        onPointerDown={(e) => e.stopPropagation()} // prevent close when interacting inside
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(900px, 92vw)',
          height: 'min(620px, 82vh)',
          borderRadius: 18,
          overflow: 'hidden',
          background: 'rgba(15,15,18,0.75)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 20px 80px rgba(0,0,0,0.45)',
        }}
      >
        {/* header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.10)',
            color: 'white',
            fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {album.artist}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {album.title}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(255,255,255,0.06)',
              color: 'white',
              padding: '8px 10px',
              borderRadius: 10,
            }}
          >
            Close ✕
          </button>
        </div>

        {/* viewer */}
        <div style={{ width: '100%', height: 'calc(100% - 54px)' }}>
          <InspectScene album={album} />
        </div>
      </div>
    </div>
  )
}

export default function Scene() {
  const spacing = 0.2
  const startX = 0.6
  const [selected, setSelected] = useState<Album | null>(null)

  // lock scroll while modal open
  useEffect(() => {
    if (!selected) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [selected])  

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      {/* background shelf scene */}
      <div style={{ width: '100%', height: '100%', filter: selected ? 'blur(6px)' : 'none', transition: 'filter 180ms ease' }}>
        <Canvas>
          <ResponsiveCamera />

          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={2.5} />
          <directionalLight position={[-5, 3, 2]} intensity={0.5} />
          <directionalLight position={[0, -5, -5]} intensity={1.5} />
          <directionalLight position={[-6, 2, 3]} intensity={1.5} />

          <Suspense fallback={null}>
            <Center>
              {albums.map((album, i) => (
                <JewelCaseItem
                  key={album.id}
                  album={album}
                  position={[startX + i * spacing, 0, 0]}
                  onSelect={setSelected}
                />
              ))}
              <Shelf />
            </Center>
          </Suspense>

          <OrbitControls rotateSpeed={1.5} enableZoom={false} enablePan={false} />
        </Canvas>
      </div>

      {/* overlay inspection */}
      {selected && <InspectModal album={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
useGLTF.preload('/models/jewelcase.glb')
useGLTF.preload('/models/shelf.glb')