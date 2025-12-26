'use client'
import * as THREE from 'three'
import { Suspense, useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react'
import { Canvas, useThree, ThreeEvent, useFrame } from '@react-three/fiber'
import { SkeletonUtils } from 'three-stdlib'
import {
  OrbitControls,
  useGLTF,
  Center,
  useTexture,
  Environment,
  useProgress
} from '@react-three/drei'

import Hint from './Hint'
import SignUp from './SignUp'

// prototype array structure for albums
type Album = {
  id: string
  artist: string
  title: string
  upc: string
  bookletUrl: string // <— used for BOTH booklet front + back
}

const albums: Album[] = [
  { id: '1', artist: 'Cap\'n Jazz', title: 'Analphabetapolothology', upc: '1', bookletUrl: '/textures/analphabetapolothology_uv_grid_booklet.png' },
  { id: '2', artist: 'Daft Punk', title: 'Discovery', upc: '2', bookletUrl: '/textures/discovery_uv_grid_booklet.png' },
  { id: '3', artist: 'Descendents', title: 'Milo Goes To College', upc: '3', bookletUrl: '/textures/milo_uv_grid_booklet.png' },
  { id: '4', artist: "Flipper's Guitar", title: 'Three Cheers For Our Side', upc: '4', bookletUrl: '/textures/three_cheer_uv_grid_booklet.png' },
  { id: '5', artist: "Justice", title: 'Cross', upc: '5', bookletUrl: '/textures/cross_uv_grid_booklet.png' },
]

function RenderGate({ onReady }: { onReady: () => void }) {
  const fired = useRef(false)

  useFrame(() => {
    if (fired.current) return
    fired.current = true
    onReady()
  })

  return null
}

function LoadingOverlay({
  renderReady,
  onDone,
}: {
  renderReady: boolean
  onDone: () => void
}) {
  const { active, progress, loaded, total, item } = useProgress()

  const [shown, setShown] = useState(0)
  const maxTarget = useRef(0)
  const doneCalled = useRef(false)
  const finalizedAt = useRef<number | null>(null)

  // record the moment assets finish
  useEffect(() => {
    if (!active && progress >= 100 && finalizedAt.current == null) {
      finalizedAt.current = performance.now()
    }
  }, [active, progress])

  // compute a target that keeps moving while we wait for first render
  const target = useMemo(() => {
    const p = Math.min(100, progress || 0)

    // While loading assets, cap at 95 so we have room to "finalize"
    if (active) return p * 0.95

    // Assets loaded but not rendered yet: creep from 95 → 99.5 over ~500ms
    if (!renderReady) {
      const t0 = finalizedAt.current ?? performance.now()
      const t = Math.min(1, (performance.now() - t0) / 500)
      return 95 + t * 4.5
    }

    // Render happened: finish to 100
    return 100
  }, [active, progress, renderReady])

  // keep target monotonic
  useEffect(() => {
    maxTarget.current = Math.max(maxTarget.current, target)
  }, [target])

  // smooth shown -> target
  useEffect(() => {
    let raf = 0
    const tick = () => {
      setShown((p) => p + (maxTarget.current - p) * 0.12)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // only complete when BOTH: assets are done AND we've rendered at least one frame
  useEffect(() => {
    const assetsDone = !active && progress >= 100
    const ready = assetsDone && renderReady

    if (!ready || doneCalled.current) return
    doneCalled.current = true

    // tiny delay so user sees 100% briefly
    const t = window.setTimeout(onDone, 180)
    return () => window.clearTimeout(t)
  }, [active, progress, renderReady, onDone])

  const pct = Math.min(100, Math.round(shown))

  return (
    <div className="loadingOverlay">
      <div className="loadingCard">
        <div className="loadingPct">{pct}%</div>
        <div className="loadingMeta">
          <span>{loaded}/{total}</span>
          <span className="loadingDot">•</span>
          <span className="loadingItem">
            {active ? (item ? `Loading: ${item}` : 'Loading assets…') : (renderReady ? 'Ready' : 'Finalizing…')}
          </span>
        </div>
      </div>
    </div>
  )
}

function Shelf() {
  const { scene } = useGLTF('/models/shelf.glb')
  
  return <primitive object={scene} scale={10}/>
}

function TurboJewelCaseItem({
  album,
  position,
  onSelect,
}: {
  album: Album
  position: [number, number, number]
  onSelect: (album: Album) => void
}) {
  const gltf = useGLTF('/models/turbo_jewelcase.glb')

  // ONE texture used by BOTH booklet front/back
  const bookletTex = useTexture(album.bookletUrl)

  useMemo(() => {
    bookletTex.flipY = false
    bookletTex.colorSpace = THREE.SRGBColorSpace
    bookletTex.needsUpdate = true
  }, [bookletTex])

  // clone per item
  const scene = useMemo(
    () => SkeletonUtils.clone(gltf.scene) as THREE.Object3D,
    [gltf.scene]
  )

  useLayoutEffect(() => {
    scene.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return
      const mesh = obj as THREE.Mesh

      // IMPORTANT: avoid shared materials between instances
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map((m) => m.clone())
        return
      }

      const mat = mesh.material as THREE.MeshStandardMaterial
      const name = mat?.name ?? ''

      // --- CLEAR PLASTIC (jewel case) ---
      if (name === 'Standard_CD_Jewel_Case_A_LP.001') {
        mesh.material = mat.clone()
        const m = mesh.material as THREE.MeshStandardMaterial

        m.transparent = true
        m.opacity = 0.18
        m.roughness = 0.04
        m.metalness = 0
        m.envMapIntensity = 1.1

        // helps glass sorting; if you see weird “everything turns transparent”
        // keep this ONLY on the plastic meshes
        m.depthWrite = false
        mesh.renderOrder = 2

        m.needsUpdate = true
        return
      }

      // --- BOOKLET (opaque paper/card) ---
      if (name === 'Standard_CD_Jewel_Case_Booklet.001') {
        mesh.material = mat.clone()
        const m = mesh.material as THREE.MeshStandardMaterial

        // Replace base color map (affects both booklet front/back meshes,
        // because they share this SAME material name)
        m.map = bookletTex

        // Make it feel like paper (NOT plastic)
        m.transparent = false
        m.opacity = 1
        m.roughness = 0.85
        m.metalness = 0
        m.envMapIntensity = 0.15

        // booklet should write depth normally
        m.depthWrite = true
        mesh.renderOrder = 1

        m.needsUpdate = true
        return
      }

      // (Optional) stop environment reflections on everything else in this model
      // mat.envMapIntensity = 0
    })
  }, [scene, bookletTex])

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    document.body.style.cursor = 'pointer'
  }

  const handlePointerOut = () => {
    document.body.style.cursor = 'default'
  }  

  const handleClick = (e: ThreeEvent<PointerEvent>) => {
    if (e.intersections[0]?.object === e.object) {
      e.stopPropagation()
      onSelect(album)
    }
  }

  return ( 
    <primitive
      object={scene} 
      scale={10} 
      position={position} 
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut} 
    />
  )
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
      <Environment preset="lobby" />

      <Suspense fallback={null}>
        <Center>
          <TurboJewelCaseItem album={album} position={[0, 0, 0]} onSelect={() => {}} />
        </Center>
      </Suspense>

      <OrbitControls rotateSpeed={1.2} enableZoom enablePan />
    </Canvas>
  )
}

function InspectModal({ album, onClose }: { album: Album; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="inspectOverlay" onPointerDown={onClose}>
      <div className="inspectBackdrop" />

      <div className="inspectCard" onPointerDown={(e) => e.stopPropagation()}>
        <div className="inspectHeader">
          <div className="inspectHeaderLeft">
            <div className="inspectArtist">{album.artist}</div>
            <div className="inspectDash">—</div>
            <div className="inspectTitle">{album.title}</div>
          </div>

          <button className="inspectCloseBtn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="inspectViewer">
          <InspectScene album={album} />
        </div>
      </div>
    </div>
  )
}

export default function Scene() {
  const spacing = 0.1
  const startX = 0.1
  const [selected, setSelected] = useState<Album | null>(null)

  const [renderReady, setRenderReady] = useState(false)
  const [booted, setBooted] = useState(false)

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

      {!booted && (
        <LoadingOverlay
          renderReady={renderReady}
          onDone={() => setBooted(true)}
        />
      )}

      {/* background shelf scene */}
      <div style={{ width: '100%', height: '100%', filter: selected ? 'blur(6px)' : 'none', transition: 'filter 180ms ease' }}>
        <Hint />

        <SignUp onContinue={() => console.log('open auth later')} />

        <Canvas>
          <ResponsiveCamera />

          <Environment preset="lobby" />

          <Suspense fallback={null}>
            <Center>
              {albums.map((album, i) => (
                <TurboJewelCaseItem
                  key={album.id}
                  album={album}
                  position={[startX + i * spacing, 0, 0]}
                  onSelect={setSelected}
                />
              ))}
              <Shelf />
            </Center>
            <RenderGate onReady={() => setRenderReady(true)} />
          </Suspense>

          <OrbitControls rotateSpeed={1.5} enableZoom={true} enablePan={false} />
        </Canvas>
      </div>

      {/* overlay inspection */}
      {selected && <InspectModal album={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
useGLTF.preload('/models/turbo_jewelcase.glb')
useGLTF.preload('/models/shelf.glb')