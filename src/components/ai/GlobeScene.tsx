import { useRef, useMemo, useState, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

/** Generate lat/lng dot positions on a sphere */
function generateGlobePoints(count: number, radius: number) {
  const positions: number[] = []
  const goldenRatio = (1 + Math.sqrt(5)) / 2
  for (let i = 0; i < count; i++) {
    const theta = Math.acos(1 - (2 * (i + 0.5)) / count)
    const phi = (2 * Math.PI * i) / goldenRatio
    const x = radius * Math.sin(theta) * Math.cos(phi)
    const y = radius * Math.sin(theta) * Math.sin(phi)
    const z = radius * Math.cos(theta)
    positions.push(x, y, z)
  }
  return new Float32Array(positions)
}

function Globe({ color }: { color: string }) {
  const meshRef = useRef<THREE.Points>(null)
  const positions = useMemo(() => generateGlobePoints(4000, 2), [])

  useFrame((_, delta) => {
    const mesh = meshRef.current
    if (!mesh) return
    mesh.rotation.y += delta * 0.08
    mesh.rotation.x = Math.sin(Date.now() * 0.0001) * 0.1
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.02}
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

/** Inner glow sphere to add atmosphere */
function GlobeGlow({ color }: { color: string }) {
  return (
    <mesh>
      <sphereGeometry args={[2.02, 64, 64]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.04}
        side={THREE.BackSide}
      />
    </mesh>
  )
}

/**
 * Three.js WebGL interactive 3D globe with dot-matrix surface.
 * Reads the CSS --foreground color so dots adapt to light/dark mode.
 */
export default function GlobeScene({ className }: { className?: string }) {
  const [dotColor, setDotColor] = useState('#ededed')
  const observerRef = useRef<MutationObserver | null>(null)

  const wrapperRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }
    if (!node) return

    const readColor = () => {
      const c = getComputedStyle(node).getPropertyValue('color')
      if (c) setDotColor(c)
    }

    readColor()

    const observer = new MutationObserver(readColor)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    observerRef.current = observer
  }, [])

  return (
    <div ref={wrapperRef} className={`text-foreground ${className ?? ''}`}>
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        style={{ touchAction: 'none', cursor: 'auto' }}
        onCreated={({ gl }) => {
          const canvas = gl.domElement
          canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault() })
        }}
      >
        <ambientLight intensity={0.5} />
        <Globe color={dotColor} />
        <GlobeGlow color={dotColor} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.4}
          autoRotate
          autoRotateSpeed={0.3}
          minPolarAngle={Math.PI * 0.3}
          maxPolarAngle={Math.PI * 0.7}
        />
      </Canvas>
    </div>
  )
}
