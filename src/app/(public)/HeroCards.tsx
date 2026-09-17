'use client'

import { useCallback, useRef } from 'react'

interface CardImage {
  src: string
  alt: string
}

interface CardColumn {
  images: CardImage[]
  label: string
  glowColor: string
  floatClass: string
}

const columns: CardColumn[] = [
  {
    images: [
      { src: '/photos/diamond-front.jpeg', alt: 'Diamond Front' },
      { src: '/photos/diamond-back.jpeg', alt: 'Diamond Back' },
    ],
    label: 'LUXURY DIAMOND',
    glowColor: 'rgba(212, 175, 55, 0.25)',
    floatClass: 'animate-float-hero-col-1',
  },
  {
    images: [
      { src: '/photos/glass-transparent-front.jpeg', alt: 'Glass Front' },
      { src: '/photos/glass-transparent-back.jpeg', alt: 'Glass Back' },
    ],
    label: 'MODERN GLASS',
    glowColor: 'rgba(212, 175, 55, 0.18)',
    floatClass: 'animate-float-hero-col-2',
  },
  {
    images: [
      { src: '/photos/silver-front.jpeg', alt: 'Silver Front' },
      { src: '/photos/silver-back.jpeg', alt: 'Silver Back' },
    ],
    label: 'PROFESSIONAL SILVER',
    glowColor: 'rgba(212, 175, 55, 0.2)',
    floatClass: 'animate-float-hero-col-3',
  },
]

function TiltCard({ src, alt }: { src: string; alt: string }) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * -10
    const rotateY = ((x - centerX) / centerX) * 10
    const glareX = (x / rect.width) * 100
    const glareY = (y / rect.height) * 100
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.06)`
    card.style.setProperty('--glare-x', `${glareX}%`)
    card.style.setProperty('--glare-y', `${glareY}%`)
  }, [])

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current
    if (!card) return
    card.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)'
  }, [])

  return (
    <div className="hero-card-wrap">
      <div
        ref={cardRef}
        className="hero-card relative rounded-2xl overflow-hidden cursor-pointer"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ boxShadow: '0 8px 40px -8px rgba(0,0,0,0.25)' }}
      >
        <img src={src} alt={alt} className="w-full h-auto block rounded-2xl" loading="lazy" style={{
          boxShadow: '0 8px 40px -8px rgba(212, 175, 55, 0.2), 0 0 80px -20px rgba(212, 175, 55, 0.1), 0 20px 50px -10px rgba(0,0,0,0.4)',
          border: '1px solid rgba(212, 175, 55, 0.15)'
        }} />
        <div className="card-glare rounded-2xl" />
      </div>
    </div>
  )
}

export default function HeroCards({ desktop = true }: { desktop?: boolean }) {
  return (
    <>
      {/* Desktop & Tablet: 3 columns */}
      <div className={`${desktop ? 'hidden sm:grid' : 'sm:hidden'} grid-cols-3 gap-5 sm:gap-6 lg:gap-8`}>
        {columns.map((col) => (
          <div key={col.label} className={`flex flex-col items-center gap-3 sm:gap-4 ${col.floatClass}`}>
            <div className="relative">
              <div className="hero-col-glow animate-hero-glow" style={{ background: col.glowColor }} />
              {col.images.map((img) => (
                <div key={img.src} className="mb-3 sm:mb-4">
                  <TiltCard src={img.src} alt={img.alt} />
                </div>
              ))}
            </div>
            <span className="hero-label text-[10px] sm:text-[11px] lg:text-xs font-bold tracking-[0.18em] uppercase text-amber-400/60" style={{ animationDelay: '0.8s' }}>
              {col.label}
            </span>
          </div>
        ))}
      </div>

      {/* Mobile: 2-col grid */}
      {!desktop && (
        <div className="sm:hidden grid grid-cols-2 gap-3 max-w-[340px] mx-auto">
          {columns.slice(0, 2).map((col) => (
            <div key={col.label} className="flex flex-col items-center gap-2">
              {col.images.map((img) => (
                <div key={img.src} className="w-full rounded-xl overflow-hidden transition-transform duration-300 active:scale-95" style={{ boxShadow: '0 4px 20px rgba(212, 175, 55, 0.15), 0 8px 30px rgba(0,0,0,0.3)' }}>
                  <img src={img.src} alt={img.alt} className="w-full h-auto block" loading="lazy" />
                </div>
              ))}
              <span className="text-[8px] font-semibold tracking-[0.12em] uppercase text-amber-400/50">{col.label}</span>
            </div>
          ))}
          <div className="flex flex-col items-center gap-2 col-span-2">
            <div className="flex gap-3 justify-center">
              {columns[2].images.map((img) => (
                <div key={img.src} className="w-[48%] rounded-xl overflow-hidden transition-transform duration-300 active:scale-95" style={{ boxShadow: '0 4px 20px rgba(212, 175, 55, 0.15), 0 8px 30px rgba(0,0,0,0.3)' }}>
                  <img src={img.src} alt={img.alt} className="w-full h-auto block" loading="lazy" />
                </div>
              ))}
            </div>
            <span className="text-[8px] font-semibold tracking-[0.12em] uppercase text-amber-400/50">{columns[2].label}</span>
          </div>
        </div>
      )}
    </>
  )
}
