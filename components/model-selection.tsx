"use client"

import { useRef, useEffect } from "react"
import gsap from "gsap"
import { Play, Calculator } from "lucide-react"

interface ModelSelectionProps {
  onSelectSimulation: () => void
  onSelectQueuing: () => void
}

export function ModelSelection({ onSelectSimulation, onSelectQueuing }: ModelSelectionProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
    tl.fromTo(
      titleRef.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.6 }
    )
      .fromTo(subtitleRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.1)
      .fromTo(
        cardsRef.current?.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.15, duration: 0.6 },
        0.2
      )
  }, [])

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12">
      
      {/* Decorative corner brackets */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2" style={{ borderColor: "rgba(0,255,136,0.2)" }} />
        <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2" style={{ borderColor: "rgba(0,212,255,0.2)" }} />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2" style={{ borderColor: "rgba(0,255,136,0.2)" }} />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2" style={{ borderColor: "rgba(0,212,255,0.2)" }} />
      </div>

      <div className="relative z-10 text-center mb-12">
        <h1
          ref={titleRef}
          className="text-5xl sm:text-6xl font-bold mb-3 tracking-tight"
          style={{ color: "#00ff88", textShadow: "0 0 15px rgba(0,255,136,0.5)" }}
        >
          QUEUE SIM
        </h1>
        <p
          ref={subtitleRef}
          className="text-muted-foreground text-lg md:text-xl max-w-lg mx-auto leading-relaxed"
        >
          Choose your analysis mode to continue
        </p>
      </div>

      {/* Cards Grid */}
      <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl relative z-10">
        <ModelSelectionCard
          title="Simulation Models"
          description="Discrete-event simulation with visualized activity"
          icon={Play}
          color="#a855f7"
          onClick={onSelectSimulation}
        />
        <ModelSelectionCard
          title="Queuing Models"
          description="Analytical calculations for queue theory"
          icon={Calculator}
          color="#00d4ff"
          onClick={onSelectQueuing}
        />
      </div>
    </div>
  )
}

function ModelSelectionCard({
  title,
  description,
  icon: Icon,
  color,
  onClick,
}: {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color: string
  onClick: () => void
}) {
  const cardRef = useRef<HTMLButtonElement>(null)

  const handleMouseEnter = () => {
    gsap.to(cardRef.current, {
      scale: 1.04,
      duration: 0.3,
      ease: "power2.out",
    })
  }

  const handleMouseLeave = () => {
    gsap.to(cardRef.current, {
      scale: 1,
      duration: 0.3,
      ease: "power2.out",
    })
  }

  return (
    <button
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative rounded-2xl p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{
        background: "rgba(8, 12, 20, 0.7)",
        backdropFilter: "blur(20px)",
        border: `1px solid ${color}30`,
        boxShadow: `0 0 20px ${color}08`,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${color}15`, border: `1px solid ${color}40` }}
        >
          <Icon className="w-5 h-5" style={{ color, filter: `drop-shadow(0 0 4px ${color})` }} />
        </div>
        <h2 className="text-2xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{title}</h2>
      </div>
      <p className="text-xs text-muted-foreground leading-snug mb-4">{description}</p>
      <div
        className="flex items-center gap-1.5 text-xs font-semibold transition-all group-hover:gap-3"
        style={{ color }}
      >
        Continue
        <span style={{ fontSize: "0.75rem" }}>→</span>
      </div>
      {/* Corner glow */}
      <div
        className="absolute top-0 right-0 w-20 h-20 opacity-15 rounded-tr-2xl pointer-events-none"
        style={{
          background: `radial-gradient(circle at top right, ${color}, transparent 70%)`,
        }}
      />
    </button>
  )
}
