'use client'

import { useEffect, useRef } from 'react'

export default function HeroBanner({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = []

    function resize() {
      canvas!.width = canvas!.offsetWidth * window.devicePixelRatio
      canvas!.height = canvas!.offsetHeight * window.devicePixelRatio
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
      })
    }

    function draw() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = canvas!.offsetWidth
        if (p.x > canvas!.offsetWidth) p.x = 0
        if (p.y < 0) p.y = canvas!.offsetHeight
        if (p.y > canvas!.offsetHeight) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 215, 0, ${p.opacity})`
        ctx.fill()
      })

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(255, 215, 0, ${0.06 * (1 - dist / 100)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <section className="relative w-full overflow-hidden min-h-[500px] lg:min-h-[800px] flex items-center">
      {/* Full background image */}
      <img
        src="/photos/hero-banner.jpeg"
        alt="MySmartCard Designs"
        className="absolute inset-0 w-full h-full object-contain object-center"
      />

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/15" />

      {/* Gradient overlay from left for text */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />

      {/* Gold particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-[3]"
      />

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent z-[3]" />

      {/* Content */}
      <div className="relative z-[5] w-full">
        {children}
      </div>
    </section>
  )
}
