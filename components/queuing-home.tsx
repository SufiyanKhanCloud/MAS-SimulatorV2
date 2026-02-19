"use client"

import { useRef, useEffect } from "react"
import gsap from "gsap"
import { ArrowLeft, ArrowRight, Activity, Clock } from "lucide-react"

type QueuingModel = "MM1" | "MMS" | "MG1" | "MGS" | "GG1" | "GGS"

interface QueuingHomeProps {
  onSelectModel: (model: QueuingModel | "HISTORY") => void
  historyCount: number
  onBack?: () => void
}

const MODELS: { name: QueuingModel; label: string; description: string; color: string }[] = [
  { name: "MM1", label: "M/M/1", description: "Single server, exponential arrivals & service", color: "#00ff88" },
  { name: "MMS", label: "M/M/S", description: "Multiple servers, exponential arrivals & service", color: "#00d4ff" },
  { name: "MG1", label: "M/G/1", description: "Single server, general service distribution", color: "#a855f7" },
  { name: "MGS", label: "M/G/S", description: "Multiple servers, general service distribution", color: "#fbbf24" },
  { name: "GG1", label: "G/G/1", description: "General arrivals & service (single server)", color: "#ff6b6b" },
  { name: "GGS", label: "G/G/S", description: "General arrivals & service (multiple servers)", color: "#ffa726" },
]

export function QueuingHome({ onSelectModel, historyCount, onBack }: QueuingHomeProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const badgeRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)
  const historyBtnRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } })

    tl.fromTo(
      badgeRef.current,
      { opacity: 0, y: 20, scale: 0.8 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6 }
    )
      .fromTo(
        titleRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8 },
        "-=0.3"
      )
      .fromTo(
        subtitleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6 },
        "-=0.4"
      )
      .fromTo(
        cardsRef.current?.children ? Array.from(cardsRef.current.children) : [],
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" },
        "-=0.3"
      )

    if (historyBtnRef.current) {
      tl.fromTo(
        historyBtnRef.current,
        { opacity: 0, y: 20, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power2.out" },
        "-=0.2"
      )
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 p-2 rounded-lg transition-colors hover:bg-white/10"
          style={{ color: "rgba(0, 212, 255, 0.7)" }}
          title="Back to model selection"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      <div className="text-center mb-16">
        <div
          ref={badgeRef}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium mb-8 neon-pulse"
          style={{
            color: "#00d4ff",
            background: "rgba(0, 212, 255, 0.05)",
            borderColor: "rgba(0, 212, 255, 0.25)",
          }}
        >
          <Activity className="w-3.5 h-3.5" />
          Queuing Analysis
        </div>
        <h1
          ref={titleRef}
          className="text-5xl md:text-7xl font-bold mb-6 text-balance tracking-tight"
          style={{ color: "#00d4ff", textShadow: "0 0 20px rgba(0, 212, 255, 0.3)" }}
        >
          Queue Models
        </h1>
        <p
          ref={subtitleRef}
          className="text-muted-foreground text-lg md:text-xl max-w-lg mx-auto leading-relaxed"
        >
          Select a queuing model to analyze performance metrics
        </p>
      </div>

      {/* Model cards grid */}
      <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl mb-12">
        {MODELS.map((model) => (
          <QueueModelCard key={model.name} model={model} onSelect={onSelectModel} />
        ))}
      </div>

      {/* History button */}
      <div ref={historyBtnRef} className="w-full max-w-4xl">
        <button
          onClick={() => onSelectModel("HISTORY")}
          className="group relative w-full rounded-2xl p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring overflow-hidden"
          style={{
            borderColor: "rgba(139, 92, 246, 0.2)",
            background: "rgba(8, 12, 20, 0.7)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(139, 92, 246, 0.2)",
            boxShadow: "0 0 20px rgba(139, 92, 246, 0.05)",
          }}
          onMouseEnter={(e) => {
            gsap.to(e.currentTarget, { scale: 1.02, duration: 0.3, ease: "power2.out" })
          }}
          onMouseLeave={(e) => {
            gsap.to(e.currentTarget, { scale: 1, duration: 0.3, ease: "power2.out" })
          }}
        >
          {/* Top accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-px opacity-60"
            style={{
              background: "linear-gradient(90deg, transparent, #8b5cf6, transparent)",
            }}
          />
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "rgba(139, 92, 246, 0.08)",
                border: "1px solid rgba(139, 92, 246, 0.3)",
              }}
            >
              <Clock
                className="w-6 h-6"
                style={{
                  color: "#8b5cf6",
                  filter: "drop-shadow(0 0 4px #8b5cf6)",
                }}
              />
            </div>
            <div className="flex-1">
              <h2
                className="text-xl font-bold"
                style={{ color: "#8b5cf6", textShadow: "0 0 10px rgba(139,92,246,0.4)" }}
              >
                Queuing Activity Log
              </h2>
              <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                View history of all past queuing analyses with their parameters and results.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {historyCount > 0 && (
                <span
                  className="text-xs font-bold font-mono px-3 py-1.5 rounded-lg"
                  style={{
                    color: "#8b5cf6",
                    background: "rgba(139, 92, 246, 0.1)",
                    border: "1px solid rgba(139, 92, 246, 0.25)",
                  }}
                >
                  {historyCount}
                </span>
              )}
              <ArrowRight
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                style={{ color: "#8b5cf6" }}
              />
            </div>
          </div>
          {/* Corner glow */}
          <div
            className="absolute top-0 right-0 w-24 h-24 opacity-10 rounded-tr-2xl pointer-events-none"
            style={{
              background: "radial-gradient(circle at top right, #8b5cf6, transparent 70%)",
            }}
          />
        </button>
      </div>
    </div>
  )
}

function QueueModelCard({
  model,
  onSelect,
}: {
  model: { name: QueuingModel; label: string; description: string; color: string }
  onSelect: (model: QueuingModel) => void
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
      onClick={() => onSelect(model.name)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative rounded-2xl p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{
        borderColor: `${model.color}30`,
        background: "rgba(8, 12, 20, 0.7)",
        backdropFilter: "blur(20px)",
        border: `1px solid ${model.color}30`,
        boxShadow: `0 0 20px ${model.color}08`,
      }}
    >
      <div className="relative z-10">
        <div className="mb-3 flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ background: `${model.color}20`, color: model.color }}
          >
            {model.label.split("/")[0]}
          </div>
          <h3 className="text-xl font-bold" style={{ color: model.color }}>
            {model.label}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground leading-snug mb-3">{model.description}</p>
        <div className="flex items-center gap-1.5 text-xs font-semibold transition-all group-hover:gap-3" style={{ color: model.color }}>
          Analyze
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>
      {/* Corner glow */}
      <div
        className="absolute top-0 right-0 w-20 h-20 opacity-15 rounded-tr-2xl pointer-events-none"
        style={{
          background: `radial-gradient(circle at top right, ${model.color}, transparent 70%)`,
        }}
      />
    </button>
  )
}
