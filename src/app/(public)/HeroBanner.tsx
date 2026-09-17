'use client'

import { useEffect, useRef } from 'react'

const cardImages = [
  { src: '/photos/golden-lion-front.jpeg', alt: 'Golden Lion' },
  { src: '/photos/velvet-front.jpeg', alt: 'Velvet Red' },
  { src: '/photos/silver-front.jpeg', alt: 'Silver' },
  { src: '/photos/fire-lion-front.jpeg', alt: 'Fire Lion' },
  { src: '/photos/diamond-front.jpeg', alt: 'Diamond' },
  { src: '/photos/wooden-front.jpeg', alt: 'Wooden' },
  { src: '/photos/glass-transparent-front.jpeg', alt: 'Glass' },
  { src: '/photos/fish-aquarium-front.jpeg', alt: 'Aquarium' },
]

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

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
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
        ctx.fillStyle = `rgba(212, 175, 55, ${p.opacity})`
        ctx.fill()
      })

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(212, 175, 55, ${0.08 * (1 - dist / 120)})`
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
    <section className="hero-banner-section relative w-full overflow-hidden min-h-[700px] lg:min-h-[780px] flex items-center">
      {/* Dark premium background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />

      {/* Animated mesh gradient */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-500/15 rounded-full blur-[120px] animate-hero-glow" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[100px] animate-hero-glow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-amber-500/8 via-transparent to-amber-500/8 rounded-full blur-[80px]" />
      </div>

      {/* Gold particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
      />

      {/* Card collage background */}
      <div className="absolute inset-0 z-[2] overflow-hidden">
        {/* Top row - scattered cards */}
        <div className="hero-collage-row absolute top-[5%] left-0 w-full flex justify-around opacity-[0.07] pointer-events-none">
          {cardImages.slice(0, 4).map((img, i) => (
            <div
              key={img.src}
              className="hero-collage-card"
              style={{
                animationDelay: `${i * 0.5}s`,
                transform: `rotate(${-8 + i * 5}deg) translateY(${i % 2 === 0 ? -10 : 10}px)`,
              }}
            >
              <img src={img.src} alt={img.alt} className="w-[180px] lg:w-[220px] rounded-xl" />
            </div>
          ))}
        </div>

        {/* Bottom row - scattered cards */}
        <div className="hero-collage-row absolute bottom-[5%] left-0 w-full flex justify-around opacity-[0.06] pointer-events-none">
          {cardImages.slice(4, 8).map((img, i) => (
            <div
              key={img.src}
              className="hero-collage-card"
              style={{
                animationDelay: `${i * 0.7 + 1}s`,
                transform: `rotate(${5 - i * 4}deg) translateY(${i % 2 === 0 ? 8 : -8}px)`,
              }}
            >
              <img src={img.src} alt={img.alt} className="w-[160px] lg:w-[200px] rounded-xl" />
            </div>
          ))}
        </div>

        {/* Side cards */}
        <div className="hidden lg:block absolute left-[-40px] top-1/2 -translate-y-1/2 opacity-[0.05] pointer-events-none">
          <div className="hero-collage-card" style={{ transform: 'rotate(-12deg)' }}>
            <img src="/photos/golden-lion-front.jpeg" alt="" className="w-[200px] rounded-xl" />
          </div>
        </div>
        <div className="hidden lg:block absolute right-[-40px] top-1/2 -translate-y-1/2 opacity-[0.05] pointer-events-none">
          <div className="hero-collage-card" style={{ transform: 'rotate(12deg)' }}>
            <img src="/photos/fire-lion-front.jpeg" alt="" className="w-[200px] rounded-xl" />
          </div>
        </div>
      </div>

      {/* Noise texture overlay */}
      <div className="absolute inset-0 z-[3] noise" />

      {/* Gold shimmer lines */}
      <div className="absolute inset-0 z-[3] overflow-hidden pointer-events-none">
        <div className="hero-shimmer-line absolute top-[20%] left-[-100%] w-[200%] h-[1px] bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />
        <div className="hero-shimmer-line absolute top-[50%] left-[-100%] w-[200%] h-[1px] bg-gradient-to-r from-transparent via-amber-500/15 to-transparent" style={{ animationDelay: '3s' }} />
        <div className="hero-shimmer-line absolute top-[80%] left-[-100%] w-[200%] h-[1px] bg-gradient-to-r from-transparent via-amber-400/10 to-transparent" style={{ animationDelay: '6s' }} />
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 z-[4] pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)'
      }} />

      {/* Content */}
      <div className="relative z-[5] w-full">
        {children}
      </div>
    </section>
  )
}
