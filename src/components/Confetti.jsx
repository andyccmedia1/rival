import { useEffect, useRef } from 'react'

const COLORS = ['#FF6B9D', '#FFD93D', '#7B68EE', '#26C9A4', '#FF7F6B']

export default function Confetti() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const pieces = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: -20,
      w: 8 + Math.random() * 8,
      h: 5 + Math.random() * 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * Math.PI * 2,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 3,
      vr: (Math.random() - 0.5) * 0.15,
    }))

    let frame
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      pieces.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vr
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      })
      if (pieces.some(p => p.y < canvas.height + 20)) {
        frame = requestAnimationFrame(animate)
      }
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <canvas ref={ref} style={{
      position: 'fixed', top: 0, left: 0,
      width: '100vw', height: '100vh',
      pointerEvents: 'none', zIndex: 999,
    }} />
  )
}
