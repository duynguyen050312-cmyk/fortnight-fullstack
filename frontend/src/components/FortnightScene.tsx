import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

// A1 tokens, mirrored from tailwind.config.js (three.js needs raw colour values).
const PAPER = 0xf7f5f1
const INK_900 = 0x14171c
const INK_600 = 0x5a6270

// Sample hours per day (not user data). Zero days show as a thin empty tick.
const SAMPLE_HOURS = [0, 4, 6, 0, 8, 5, 0, 3, 7, 4, 0, 6, 8, 5]
const SCALE_HOURS = 12
const MAX_BAR_HEIGHT = 3
const BAR_WIDTH = 0.42
const BAR_SPACING = 0.8
const ROW_WIDTH = (SAMPLE_HOURS.length - 1) * BAR_SPACING
const WINDOW_WIDTH = BAR_SPACING * 4.5
const SWEEP_SECONDS = 12
const MAX_TILT_Y = 0.28
const MAX_TILT_X = 0.1

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')))
  } catch {
    return false
  }
}

export default function FortnightScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [available, setAvailable] = useState(true)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (!supportsWebGL()) { setAvailable(false); return }

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true })
    } catch {
      setAvailable(false)
      return
    }
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.domElement.style.display = 'block'
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(PAPER)
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
    scene.add(new THREE.AmbientLight(0xffffff, 1.6))
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4)
    keyLight.position.set(4, 8, 6)
    scene.add(keyLight)

    // Everything that tilts with the pointer lives in one group.
    const group = new THREE.Group()
    scene.add(group)

    const ink = new THREE.Color(INK_900)
    const inkLight = new THREE.Color(INK_600)
    const barGeometry = new THREE.BoxGeometry(BAR_WIDTH, 1, BAR_WIDTH)
    barGeometry.translate(0, 0.5, 0) // grow from the floor when scaled
    const bars = SAMPLE_HOURS.map((hours, index) => {
      const material = new THREE.MeshLambertMaterial({ color: ink })
      const mesh = new THREE.Mesh(barGeometry, material)
      mesh.position.x = index * BAR_SPACING - ROW_WIDTH / 2
      mesh.scale.y = Math.max((hours / SCALE_HOURS) * MAX_BAR_HEIGHT, 0.04)
      group.add(mesh)
      return { mesh, material }
    })

    // The rolling window: a translucent volume with crisp outline edges.
    const windowHeight = MAX_BAR_HEIGHT + 0.5
    const windowGeometry = new THREE.BoxGeometry(WINDOW_WIDTH, windowHeight, BAR_WIDTH + 0.5)
    const windowMaterial = new THREE.MeshBasicMaterial({ color: INK_600, transparent: true, opacity: 0.1, depthWrite: false })
    const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial)
    const edgesGeometry = new THREE.EdgesGeometry(windowGeometry)
    const edgesMaterial = new THREE.LineBasicMaterial({ color: INK_600, transparent: true, opacity: 0.5 })
    windowMesh.add(new THREE.LineSegments(edgesGeometry, edgesMaterial))
    windowMesh.position.y = windowHeight / 2 - 0.05
    windowMesh.renderOrder = 1
    group.add(windowMesh)

    const sweepStart = -ROW_WIDTH / 2 - WINDOW_WIDTH
    const sweepEnd = ROW_WIDTH / 2 + WINDOW_WIDTH

    const placeWindow = (progress: number) => {
      windowMesh.position.x = sweepStart + (sweepEnd - sweepStart) * progress
      for (const { mesh, material } of bars) {
        // 1 inside the window, easing to 0 over half a bar past its edges.
        const distance = Math.abs(mesh.position.x - windowMesh.position.x) - WINDOW_WIDTH / 2
        const coverage = THREE.MathUtils.clamp(0.5 - distance / BAR_SPACING, 0, 1)
        material.color.copy(ink).lerp(inkLight, coverage * 0.75)
      }
    }

    const resize = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      if (!width || !height) return
      renderer.setSize(width, height, false)
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'
      camera.aspect = width / height
      // Pull the camera back until the whole row fits horizontally.
      const halfFov = THREE.MathUtils.degToRad(camera.fov / 2)
      const fitDistance = (ROW_WIDTH / 2 + 1.1) / (Math.tan(halfFov) * camera.aspect)
      const distance = Math.max(fitDistance, 9)
      camera.position.set(0, distance * 0.32, distance)
      camera.lookAt(0, MAX_BAR_HEIGHT * 0.35, 0)
      camera.updateProjectionMatrix()
      renderer.render(scene, camera)
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)

    if (reducedMotion) {
      // One static frame: the window resting over the most recent days.
      placeWindow(0.62)
      resize()
      return () => {
        resizeObserver.disconnect()
        dispose()
      }
    }

    const targetTilt = { x: 0, y: 0 }
    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1
      targetTilt.y = THREE.MathUtils.clamp(nx, -1, 1) * MAX_TILT_Y
      targetTilt.x = THREE.MathUtils.clamp(ny, -1, 1) * MAX_TILT_X
    }
    const onPointerLeave = () => { targetTilt.x = 0; targetTilt.y = 0 }
    container.addEventListener('pointermove', onPointerMove)
    container.addEventListener('pointerleave', onPointerLeave)

    const timer = new THREE.Timer()
    let elapsed = 0
    let frame = 0
    const tick = (time: number) => {
      timer.update(time)
      elapsed += Math.min(timer.getDelta(), 0.1) // no jump after a long frame
      placeWindow((elapsed % SWEEP_SECONDS) / SWEEP_SECONDS)
      group.rotation.y += (targetTilt.y - group.rotation.y) * 0.06
      group.rotation.x += (targetTilt.x - group.rotation.x) * 0.06
      renderer.render(scene, camera)
      frame = requestAnimationFrame(tick)
    }
    const start = () => { if (!frame) { timer.reset(); frame = requestAnimationFrame(tick) } }
    const stop = () => { cancelAnimationFrame(frame); frame = 0 }
    const onVisibilityChange = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVisibilityChange)
    resize()
    if (!document.hidden) start()

    function dispose() {
      barGeometry.dispose()
      bars.forEach(({ material }) => material.dispose())
      windowGeometry.dispose()
      windowMaterial.dispose()
      edgesGeometry.dispose()
      edgesMaterial.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      container.removeEventListener('pointermove', onPointerMove)
      container.removeEventListener('pointerleave', onPointerLeave)
      resizeObserver.disconnect()
      timer.dispose()
      dispose()
    }
  }, [])

  if (!available) return null
  return <div ref={containerRef} className="h-[240px] w-full overflow-hidden border border-ink-300 sm:h-[400px]" role="img" aria-label="Fourteen daily work-hour bars with a rolling window sliding across them" />
}
