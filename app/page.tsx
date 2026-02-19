"use client"

import React, { useState, useCallback, useRef, useEffect } from "react"
import gsap from "gsap"
import { mm1Simulation, mmsSSimulation, mg1Simulation, mgsSSimulation } from "@/lib/simulation"
import type { SimulationResult, ServiceDistribution, MGDistParams } from "@/lib/simulation"
import { SimulationResults } from "@/components/simulation-results"
import { ParticleBackground } from "@/components/particle-background"
import { SplashScreen } from "@/components/splash-screen"
import { SimulationHistory, type HistoryEntry } from "@/components/simulation-history"
import { ModelSelection } from "@/components/model-selection"
import { QueuingHome } from "@/components/queuing-home"
import {
  type QueuingModel as QModelType,
  type QueuingInput as QInput,
  type QueuingResults as QResults,
  calculateQueuingMetrics,
  getModelDisplayName,
  getRequiredInputs,
} from "@/lib/queuing-calculations"
import { Server, Users, ArrowRight, ArrowLeft, AlertCircle, Zap, Activity, Shuffle, Clock, BarChart3, Trash2 } from "lucide-react"

type View = "home" | "mm1" | "mms" | "mg1" | "mgs" | "results" | "history" | "modelSelection" | "queuingHome" | "queuingInput" | "queuingResults" | "queuingHistory"

interface QueuingHistoryEntry {
  id: string
  timestamp: number
  model: QModelType
  input: QInput
  results: QResults
}

const HISTORY_KEY = "queue-sim-history"

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    return JSON.parse(raw) as HistoryEntry[]
  } catch {
    return []
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries))
  } catch {
    // storage full or unavailable
  }
}

export default function QueueSimulator() {
  const [showSplash, setShowSplash] = useState(true)
  const [view, setView] = useState<View>("modelSelection")
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [params, setParams] = useState({ lambda: 0, mu: 0, servers: 1, usePriority: false })
  const [distParams, setDistParams] = useState<{ distribution: "normal" | "uniform"; mu?: number; sigma?: number; a?: number; b?: number } | undefined>(undefined)
  const [queueTypeLabel, setQueueTypeLabel] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const contentRef = useRef<HTMLDivElement>(null)

  // Queuing model state
  const [selectedQModel, setSelectedQModel] = useState<QModelType>("MM1")
  const [qResults, setQResults] = useState<QResults | null>(null)
  const [qInput, setQInput] = useState<QInput | null>(null)
  const [queuingHistory, setQueuingHistory] = useState<QueuingHistoryEntry[]>([])

  // Load queuing history
  useEffect(() => {
    try {
      const raw = localStorage.getItem("queuingHistory")
      if (raw) setQueuingHistory(JSON.parse(raw))
    } catch {}
  }, [])

  const saveQueuingHistory = useCallback((entries: QueuingHistoryEntry[]) => {
    localStorage.setItem("queuingHistory", JSON.stringify(entries))
  }, [])

  const addQueuingHistoryEntry = useCallback((model: QModelType, input: QInput, results: QResults) => {
    const entry: QueuingHistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      model,
      input,
      results,
    }
    setQueuingHistory((prev) => {
      const updated = [entry, ...prev].slice(0, 50)
      saveQueuingHistory(updated)
      return updated
    })
  }, [saveQueuingHistory])

  const deleteQueuingHistoryEntry = useCallback((id: string) => {
    setQueuingHistory((prev) => {
      const updated = prev.filter((e) => e.id !== id)
      saveQueuingHistory(updated)
      return updated
    })
  }, [saveQueuingHistory])

  const clearQueuingHistory = useCallback(() => {
    setQueuingHistory([])
    saveQueuingHistory([])
  }, [saveQueuingHistory])



  // Load history from localStorage on mount
  useEffect(() => {
    setHistory(loadHistory())
  }, [])

  const addHistoryEntry = useCallback(
    (type: string, lam: number, mu: number, servers: number, usePriority: boolean, res: SimulationResult, dp?: typeof distParams, label?: string) => {
      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        type: label || (servers > 1 ? `M/M/${servers}` : "M/M/1"),
        lambda: lam,
        mu,
        servers,
        usePriority,
        distParams: dp,
        queueTypeLabel: label,
        result: res,
      }
      setHistory((prev) => {
        const updated = [entry, ...prev].slice(0, 50) // keep max 50 entries
        saveHistory(updated)
        return updated
      })
    },
    []
  )

  const deleteHistoryEntry = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((e) => e.id !== id)
      saveHistory(updated)
      return updated
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    saveHistory([])
  }, [])

  const animateTransition = useCallback(
    (nextView: View, callback?: () => void) => {
      if (transitioning) return
      setTransitioning(true)

      const tl = gsap.timeline({
        onComplete: () => {
          setView(nextView)
          callback?.()
          gsap.fromTo(
            contentRef.current,
            { opacity: 0, y: 40, scale: 0.97 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.6,
              ease: "power3.out",
              onComplete: () => setTransitioning(false),
            }
          )
        },
      })

      tl.to(contentRef.current, {
        opacity: 0,
        y: -30,
        scale: 0.97,
        duration: 0.35,
        ease: "power2.in",
      })
    },
    [transitioning]
  )

  const [lastInputView, setLastInputView] = useState<View>("mm1")

  const handleBack = useCallback(() => {
    if (view === "results") {
      animateTransition(lastInputView)
    } else if (view === "home") {
      animateTransition("modelSelection")
    } else if (view === "queuingHome") {
      animateTransition("modelSelection")
    } else if (view === "queuingInput") {
      animateTransition("queuingHome")
    } else if (view === "queuingResults") {
      animateTransition("queuingInput")
    } else if (view === "queuingHistory") {
      animateTransition("queuingHome")
    } else if (view === "mm1" || view === "mms" || view === "mg1" || view === "mgs") {
      animateTransition("home")
    } else {
      animateTransition("modelSelection")
    }
    setError(null)
  }, [view, lastInputView, animateTransition])

  const handleHistorySelect = useCallback(
    (entry: HistoryEntry) => {
      setResult(entry.result)
      setParams({
        lambda: entry.lambda,
        mu: entry.mu,
        servers: entry.servers,
        usePriority: entry.usePriority,
      })
      setDistParams(entry.distParams)
      setQueueTypeLabel(entry.queueTypeLabel)
      setLastInputView("home")
      animateTransition("results")
    },
    [animateTransition]
  )

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      <ParticleBackground />
      {/* Floating math formulas overlay */}
      <FloatingMathOverlay />
      <div className="relative z-10 grid-bg min-h-screen scanlines">
        <div ref={contentRef}>
          {view === "modelSelection" && (
            <ModelSelection
              onSelectSimulation={() => {
                setError(null)
                animateTransition("home")
              }}
              onSelectQueuing={() => {
                setError(null)
                animateTransition("queuingHome")
              }}
            />
          )}

          {view === "queuingHome" && (
            <QueuingHome
              onSelectModel={(model) => {
                if (model === "HISTORY") {
                  setError(null)
                  animateTransition("queuingHistory")
                  return
                }
                setSelectedQModel(model as QModelType)
                setError(null)
                setQResults(null)
                setQInput(null)
                animateTransition("queuingInput")
              }}
              historyCount={queuingHistory.length}
              onBack={() => {
                setError(null)
                animateTransition("modelSelection")
              }}
            />
          )}

          {view === "queuingInput" && (
            <QueuingInputPage
              model={selectedQModel}
              error={error}
              isRunning={isRunning}
              onBack={() => {
                setError(null)
                animateTransition("queuingHome")
              }}
              onCalculate={(input: QInput) => {
                setError(null)
                const results = calculateQueuingMetrics(selectedQModel, input)
                if (results.error) {
                  setError(results.error)
                  return
                }
                if (!results.stable) {
                  setError("System is unstable: utilization (\u03C1) must be less than 1. Please adjust your parameters.")
                  return
                }
                setIsRunning(true)
                setQInput(input)
                setTimeout(() => {
                  setQResults(results)
                  setIsRunning(false)
                  addQueuingHistoryEntry(selectedQModel, input, results)
                  animateTransition("queuingResults")
                }, 600)
              }}
            />
          )}

          {view === "queuingResults" && qResults && qInput && (
            <QueuingResultsPage
              model={selectedQModel}
              results={qResults}
              input={qInput}
              onBack={() => {
                setError(null)
                animateTransition("queuingInput")
              }}
              onBackToModels={() => {
                setError(null)
                animateTransition("queuingHome")
              }}
            />
          )}

          {view === "queuingHistory" && (
            <QueuingHistoryPage
              entries={queuingHistory}
              onBack={() => animateTransition("queuingHome")}
              onSelect={(entry) => {
                setSelectedQModel(entry.model)
                setQInput(entry.input)
                setQResults(entry.results)
                animateTransition("queuingResults")
              }}
              onDelete={deleteQueuingHistoryEntry}
              onClearAll={clearQueuingHistory}
            />
          )}

          {view === "home" && (
            <HomePage
              onSelect={(v) => {
                setError(null)
                animateTransition(v)
              }}
              historyCount={history.length}
              onBack={() => {
                setError(null)
                animateTransition("modelSelection")
              }}
            />
          )}
          {view === "mm1" && (
            <InputPage
              type="mm1"
              error={error}
              isRunning={isRunning}
              onBack={handleBack}
              onSimulate={(lam, mu, priority) => {
                setError(null)
                if (lam <= 0) {
                  setError("Arrival rate must be greater than 0.")
                  return
                }
                if (mu <= 0) {
                  setError("Service rate must be greater than 0.")
                  return
                }
                if (lam >= mu) {
                  setError("System unstable: arrival rate must be less than service rate.")
                  return
                }
                setIsRunning(true)
                setLastInputView("mm1")
                setQueueTypeLabel(undefined)
                setTimeout(() => {
                  const res = mm1Simulation(lam, mu, priority)
                  setResult(res)
                  setParams({ lambda: lam, mu, servers: 1, usePriority: priority })
                  addHistoryEntry("M/M/1", lam, mu, 1, priority, res)
                  setIsRunning(false)
                  animateTransition("results")
                }, 600)
              }}
            />
          )}
          {view === "mms" && (
            <InputPage
              type="mms"
              error={error}
              isRunning={isRunning}
              onBack={handleBack}
              onSimulate={(lam, mu, priority, servers) => {
                setError(null)
                const s = servers || 2
                if (lam <= 0) {
                  setError("Arrival rate must be greater than 0.")
                  return
                }
                if (mu <= 0) {
                  setError("Service rate must be greater than 0.")
                  return
                }
                if (s <= 0) {
                  setError("Number of servers must be greater than 0.")
                  return
                }
                if (lam >= s * mu) {
                  setError(
                    `System unstable: arrival rate must be less than ${s} x service rate.`
                  )
                  return
                }
                setIsRunning(true)
                setLastInputView("mms")
                setQueueTypeLabel(undefined)
                setTimeout(() => {
                  const res = mmsSSimulation(lam, mu, s, priority)
                  setResult(res)
                  setParams({ lambda: lam, mu, servers: s, usePriority: priority })
                  addHistoryEntry(`M/M/${s}`, lam, mu, s, priority, res, undefined, undefined)
                  setIsRunning(false)
                  animateTransition("results")
                }, 600)
              }}
            />
          )}
          {view === "mg1" && (
            <MGInputPage
              type="mg1"
              error={error}
              isRunning={isRunning}
              onBack={handleBack}
              onSimulate={(lam, distParams, priority) => {
                setError(null)
                if (lam <= 0) {
                  setError("Arrival rate must be greater than 0.")
                  return
                }
                if (distParams.distribution === "uniform") {
                  if (distParams.a === undefined || distParams.b === undefined || distParams.a < 0 || distParams.b <= distParams.a) {
                    setError("For uniform distribution, b must be greater than a and both must be non-negative.")
                    return
                  }
                } else {
                  if (distParams.mu === undefined || distParams.sigma === undefined || distParams.mu <= 0 || distParams.sigma <= 0) {
                    setError("For normal distribution, both mean and std deviation must be greater than 0.")
                    return
                  }
                }
                setIsRunning(true)
                setLastInputView("mg1")
                setQueueTypeLabel("M/G/1")
                setTimeout(() => {
                  const res = mg1Simulation(lam, distParams, priority)
                  setResult(res)
                  setParams({ lambda: lam, mu: 0, servers: 1, usePriority: priority })
                  setDistParams(distParams)
                  addHistoryEntry("M/G/1", lam, 0, 1, priority, res, distParams, "M/G/1")
                  setIsRunning(false)
                  animateTransition("results")
                }, 600)
              }}
            />
          )}
          {view === "mgs" && (
            <MGInputPage
              type="mgs"
              error={error}
              isRunning={isRunning}
              onBack={handleBack}
              onSimulate={(lam, distParams, priority, servers) => {
                setError(null)
                const s = servers || 2
                if (lam <= 0) {
                  setError("Arrival rate must be greater than 0.")
                  return
                }
                if (distParams.distribution === "uniform") {
                  if (distParams.a === undefined || distParams.b === undefined || distParams.a < 0 || distParams.b <= distParams.a) {
                    setError("For uniform distribution, b must be greater than a and both must be non-negative.")
                    return
                  }
                } else {
                  if (distParams.mu === undefined || distParams.sigma === undefined || distParams.mu <= 0 || distParams.sigma <= 0) {
                    setError("For normal distribution, both mean and std deviation must be greater than 0.")
                    return
                  }
                }
                if (s <= 0) {
                  setError("Number of servers must be greater than 0.")
                  return
                }
                setIsRunning(true)
                setLastInputView("mgs")
                setQueueTypeLabel(`M/G/${s}`)
                setTimeout(() => {
                  const res = mgsSSimulation(lam, distParams, s, priority)
                  setResult(res)
                  setParams({ lambda: lam, mu: 0, servers: s, usePriority: priority })
                  setDistParams(distParams)
                  addHistoryEntry(`M/G/${s}`, lam, 0, s, priority, res, distParams, `M/G/${s}`)
                  setIsRunning(false)
                  animateTransition("results")
                }, 600)
              }}
            />
          )}
          {view === "history" && (
            <SimulationHistory
              entries={history}
              onBack={() => animateTransition("home")}
              onSelect={handleHistorySelect}
              onDelete={deleteHistoryEntry}
              onClearAll={clearHistory}
            />
          )}
          {view === "results" && result && (
            <SimulationResults
              result={result}
              lambda={params.lambda}
              mu={params.mu}
              servers={params.servers}
              usePriority={params.usePriority}
              onBack={handleBack}
              queueTypeLabel={queueTypeLabel}
              distParams={distParams}
            />
          )}
        </div>
      </div>


    </main>
  )
}

// --- Persistent Animated Math Background (carries splash aesthetic into main app) ---
const BG_FORMULAS = [
  "P(X=k) = e^{-\u03BB} \u00B7 \u03BB^k / k!",
  "\u03C1 = \u03BB / (s\u03BC)",
  "L_q = \u03BB\u00B2 / \u03BC(\u03BC-\u03BB)",
  "W = 1 / (\u03BC - \u03BB)",
  "W_q = \u03BB / \u03BC(\u03BC-\u03BB)",
  "\u03C0_0 = 1 - \u03C1",
  "L_s = \u03BB / (\u03BC - \u03BB)",
  "P_n = (1-\u03C1)\u03C1^n",
  "\u2211 P(n) = 1",
  "E[N] = \u03BB \u00B7 W",
  "\u03BC > \u03BB",
  "f(t) = \u03BBe^{-\u03BBt}",
  "P(W>t) = e^{-\u03BCt}",
  "\u03C3\u00B2 = \u03BB",
  "L = \u03BBW",
  "\u03C1 = \u03BB/\u03BC < 1",
  "Erlang C",
  "\u03BB^s / s!",
  "M/M/1",
  "M/M/S",
]

const BG_STAT_CARDS = [
  { label: "Poisson Distribution", value: "P(X=k) = e^{-\u03BB}\u03BB^k/k!", color: "#00ff88" },
  { label: "Little's Law", value: "L = \u03BBW", color: "#00d4ff" },
  { label: "Utilization", value: "\u03C1 = \u03BB/\u03BC", color: "#a855f7" },
  { label: "Stability", value: "\u03C1 < 1", color: "#00ff88" },
  { label: "Avg Wait Time", value: "W_q = \u03BB / \u03BC(\u03BC-\u03BB)", color: "#00d4ff" },
  { label: "Queue Length", value: "L_q = \u03C1\u00B2/(1-\u03C1)", color: "#a855f7" },
]

// Deterministic layout
const BG_POSITIONS = BG_FORMULAS.map((_, i) => ({
  left: 2 + (i % 5) * 19 + ((i * 7 + 2) % 6),
  top: 3 + Math.floor(i / 5) * 22 + ((i * 3 + 1) % 8),
  fontSize: 14 + ((i * 3 + 2) % 10),
}))

const STAT_CARD_POSITIONS = BG_STAT_CARDS.map((_, i) => ({
  left: 5 + (i % 3) * 32 + ((i * 11 + 3) % 5),
  top: 10 + Math.floor(i / 3) * 45 + ((i * 7 + 2) % 10),
}))

function FloatingMathOverlay() {
  const formulasRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Animate formulas floating
    if (formulasRef.current) {
      const formulas = Array.from(formulasRef.current.children) as HTMLElement[]
      formulas.forEach((f, i) => {
        // Entrance fade-in
        gsap.fromTo(
          f,
          { opacity: 0, y: -30 },
          {
            opacity: 1,
            y: 0,
            duration: 1.5,
            delay: i * 0.12,
            ease: "power2.out",
          }
        )
        // Continuous drift
        gsap.to(f, {
          y: `+=${18 + ((i * 11 + 3) % 35)}`,
          x: `+=${((i * 9) % 25) - 12}`,
          duration: 5 + ((i * 3) % 5),
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.3,
        })
        // Pulsing glow
        gsap.to(f, {
          opacity: 0.08 + ((i * 3) % 5) * 0.015,
          duration: 3 + ((i * 2) % 4),
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.2,
        })
      })
    }
    // Animate stat cards
    if (statsRef.current) {
      const cards = Array.from(statsRef.current.children) as HTMLElement[]
      cards.forEach((c, i) => {
        // Entrance
        gsap.fromTo(
          c,
          { opacity: 0, scale: 0.8, y: 20 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 1.2,
            delay: 0.5 + i * 0.2,
            ease: "back.out(1.5)",
          }
        )
        // Slow float
        gsap.to(c, {
          y: `+=${8 + ((i * 5) % 12)}`,
          x: `+=${((i * 3) % 8) - 4}`,
          duration: 7 + ((i * 2) % 4),
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.5,
        })
        // Pulse opacity
        gsap.to(c, {
          opacity: 0.06 + ((i * 2) % 3) * 0.02,
          duration: 4 + ((i * 3) % 3),
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.4,
        })
      })
    }
  }, [])

  return (
    <>
      {/* Floating math formulas - more visible, larger */}
      <div ref={formulasRef} className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
        {BG_FORMULAS.map((formula, i) => {
          const pos = BG_POSITIONS[i]
          return (
            <div
              key={`bg-formula-${i}`}
              className="absolute font-mono select-none whitespace-nowrap"
              style={{
                left: `${pos.left}%`,
                top: `${pos.top}%`,
                fontSize: `${pos.fontSize}px`,
                color:
                  i % 3 === 0
                    ? "rgba(0, 255, 136, 0.14)"
                    : i % 3 === 1
                      ? "rgba(0, 212, 255, 0.12)"
                      : "rgba(168, 85, 247, 0.10)",
                opacity: 0,
                textShadow:
                  i % 3 === 0
                    ? "0 0 8px rgba(0,255,136,0.15)"
                    : i % 3 === 1
                      ? "0 0 8px rgba(0,212,255,0.12)"
                      : "0 0 8px rgba(168,85,247,0.10)",
              }}
            >
              {formula}
            </div>
          )
        })}
      </div>

      {/* Floating stat cards in the background */}
      <div ref={statsRef} className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
        {BG_STAT_CARDS.map((stat, i) => {
          const pos = STAT_CARD_POSITIONS[i]
          return (
            <div
              key={`bg-stat-${i}`}
              className="absolute rounded-lg px-4 py-3 text-center select-none"
              style={{
                left: `${pos.left}%`,
                top: `${pos.top}%`,
                opacity: 0,
                background: "rgba(8, 12, 20, 0.35)",
                border: `1px solid ${stat.color}15`,
                backdropFilter: "blur(4px)",
                minWidth: "140px",
              }}
            >
              <div
                className="font-mono text-sm font-bold mb-0.5 whitespace-nowrap"
                style={{
                  color: stat.color,
                  opacity: 0.55,
                  textShadow: `0 0 8px ${stat.color}40`,
                }}
              >
                {stat.value}
              </div>
              <div
                className="text-[9px] font-semibold uppercase tracking-wider"
                style={{ color: "rgba(200, 210, 220, 0.35)" }}
              >
                {stat.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* Corner bracket decorations (same as splash) */}
      <div className="fixed top-4 left-4 w-8 h-8 z-[2] pointer-events-none" style={{ borderTop: "2px solid rgba(0,255,136,0.15)", borderLeft: "2px solid rgba(0,255,136,0.15)" }} />
      <div className="fixed top-4 right-4 w-8 h-8 z-[2] pointer-events-none" style={{ borderTop: "2px solid rgba(0,212,255,0.15)", borderRight: "2px solid rgba(0,212,255,0.15)" }} />
      <div className="fixed bottom-4 left-4 w-8 h-8 z-[2] pointer-events-none" style={{ borderBottom: "2px solid rgba(0,255,136,0.15)", borderLeft: "2px solid rgba(0,255,136,0.15)" }} />
      <div className="fixed bottom-4 right-4 w-8 h-8 z-[2] pointer-events-none" style={{ borderBottom: "2px solid rgba(0,212,255,0.15)", borderRight: "2px solid rgba(0,212,255,0.15)" }} />

      {/* Corner terminal text */}
      <div className="fixed top-6 left-6 font-mono text-[10px] z-[2] pointer-events-none" style={{ color: "rgba(0,255,136,0.2)" }}>
        {">"} QUEUE_SIM::ACTIVE
      </div>
      <div className="fixed top-6 right-6 font-mono text-[10px] z-[2] pointer-events-none text-right" style={{ color: "rgba(0,212,255,0.2)" }}>
        v2.0
      </div>
      <div className="fixed bottom-6 left-6 font-mono text-[10px] z-[2] pointer-events-none" style={{ color: "rgba(0,255,136,0.15)" }}>
        [ENGINE::READY]
      </div>
      <div className="fixed bottom-6 right-6 font-mono text-[10px] z-[2] pointer-events-none" style={{ color: "rgba(0,212,255,0.15)" }}>
        THREADS: ACTIVE
      </div>
    </>
  )
}

// --- Home Page ---
function HomePage({ onSelect, historyCount, onBack }: { onSelect: (view: View) => void; historyCount: number; onBack?: () => void }) {
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
        { opacity: 0, y: 40, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.15 },
        "-=0.3"
      )

    if (historyBtnRef.current) {
      tl.fromTo(
        historyBtnRef.current,
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6 },
        "-=0.3"
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
            color: "#00ff88",
            background: "rgba(0, 255, 136, 0.05)",
            borderColor: "rgba(0, 255, 136, 0.25)",
          }}
        >
          <Activity className="w-3.5 h-3.5" />
          Queue Theory Simulator
        </div>
        <h1
          ref={titleRef}
          className="text-5xl md:text-7xl font-bold mb-6 text-balance tracking-tight"
          style={{ color: "hsl(var(--foreground))" }}
        >
          <span style={{ color: "#00ff88", textShadow: "0 0 15px rgba(0,255,136,0.5), 0 0 40px rgba(0,255,136,0.2)" }}>
            Simulate
          </span>{" "}
          Queues
          <br />
          <span style={{ color: "#00d4ff", textShadow: "0 0 15px rgba(0,212,255,0.5), 0 0 40px rgba(0,212,255,0.2)" }}>
            Visualize
          </span>{" "}
          Performance
        </h1>
        <p
          ref={subtitleRef}
          className="text-muted-foreground text-lg md:text-xl max-w-lg mx-auto leading-relaxed"
        >
          M/M/1, M/M/S, M/G/1 and M/G/S queueing models with Poisson arrivals,
          exponential, uniform and normal service distributions, and priority scheduling.
        </p>
      </div>

      <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
        <ModelCard
          title="M/M/1"
          description="Single server queue with exponential service distribution."
          icon={Server}
          color="#00ff88"
          onClick={() => onSelect("mm1")}
        />
        <ModelCard
          title="M/M/S"
          description="Multi-server queue with exponential service distribution."
          icon={Users}
          color="#00d4ff"
          onClick={() => onSelect("mms")}
        />
        <ModelCard
          title="M/G/1"
          description="Single server queue with general service distribution."
          icon={Shuffle}
          color="#a855f7"
          onClick={() => onSelect("mg1")}
        />
        <ModelCard
          title="M/G/S"
          description="Multi-server queue with general service distribution."
          icon={Shuffle}
          color="#fbbf24"
          onClick={() => onSelect("mgs")}
        />
      </div>

      {/* Simulation Activity Log Button */}
      <div ref={historyBtnRef} className="mt-8 w-full max-w-4xl">
        <button
          onClick={() => onSelect("history")}
          className="group relative w-full rounded-2xl p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring overflow-hidden"
          style={{
            background: "rgba(8, 12, 20, 0.7)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 107, 107, 0.2)",
            boxShadow: "0 0 20px rgba(255, 107, 107, 0.05)",
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
              background: "linear-gradient(90deg, transparent, #ff6b6b, transparent)",
            }}
          />
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "rgba(255, 107, 107, 0.08)",
                border: "1px solid rgba(255, 107, 107, 0.3)",
              }}
            >
              <Clock
                className="w-6 h-6"
                style={{
                  color: "#ff6b6b",
                  filter: "drop-shadow(0 0 4px #ff6b6b)",
                }}
              />
            </div>
            <div className="flex-1">
              <h2
                className="text-xl font-bold"
                style={{ color: "#ff6b6b", textShadow: "0 0 10px rgba(255,107,107,0.4)" }}
              >
                Simulation Activity Log
              </h2>
              <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                View history of all past simulations with their parameters and results.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {historyCount > 0 && (
                <span
                  className="text-xs font-bold font-mono px-3 py-1.5 rounded-lg"
                  style={{
                    color: "#ff6b6b",
                    background: "rgba(255, 107, 107, 0.1)",
                    border: "1px solid rgba(255, 107, 107, 0.25)",
                  }}
                >
                  {historyCount}
                </span>
              )}
              <ArrowRight
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                style={{ color: "#ff6b6b" }}
              />
            </div>
          </div>
          {/* Corner glow */}
          <div
            className="absolute top-0 right-0 w-24 h-24 opacity-10 rounded-tr-2xl pointer-events-none"
            style={{
              background: "radial-gradient(circle at top right, #ff6b6b, transparent 70%)",
            }}
          />
        </button>
      </div>
    </div>
  )
}

function ModelCard({
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
        Configure
        <ArrowRight className="w-3 h-3" />
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

// --- Input Page ---
function InputPage({
  type,
  error,
  isRunning,
  onBack,
  onSimulate,
}: {
  type: "mm1" | "mms"
  error: string | null
  isRunning: boolean
  onBack: () => void
  onSimulate: (lambda: number, mu: number, priority: boolean, servers?: number) => void
}) {
  const [lambda, setLambda] = useState("")
  const [mu, setMu] = useState("")
  const [servers, setServers] = useState("")
  const [priority, setPriority] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)
  const fieldsRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
    tl.fromTo(
      formRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5 }
    )
    if (fieldsRef.current) {
      tl.fromTo(
        Array.from(fieldsRef.current.children),
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.08 },
        "-=0.2"
      )
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const lam = parseFloat(lambda)
    const m = parseFloat(mu)
    if (isNaN(lam) || isNaN(m)) return
    if (type === "mms") {
      const s = parseInt(servers)
      if (isNaN(s)) return
      onSimulate(lam, m, priority, s)
    } else {
      onSimulate(lam, m, priority)
    }
  }

  const neonColor = type === "mm1" ? "#00ff88" : "#00d4ff"

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div ref={formRef} className="w-full max-w-md">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Models
        </button>

        <div
          className="rounded-2xl p-8 relative overflow-hidden"
          style={{
            background: "rgba(8, 12, 20, 0.8)",
            backdropFilter: "blur(20px)",
            border: `1px solid ${neonColor}25`,
            boxShadow: `0 0 30px ${neonColor}08`,
          }}
        >
          {/* Top neon line */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${neonColor}, transparent)`,
              boxShadow: `0 0 10px ${neonColor}60`,
            }}
          />

          <div className="flex items-center gap-3 mb-8">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: `${neonColor}15`, border: `1px solid ${neonColor}40` }}
            >
              {type === "mm1" ? (
                <Server className="w-6 h-6" style={{ color: neonColor, filter: `drop-shadow(0 0 4px ${neonColor})` }} />
              ) : (
                <Users className="w-6 h-6" style={{ color: neonColor, filter: `drop-shadow(0 0 4px ${neonColor})` }} />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "hsl(var(--foreground))" }}>
                {type === "mm1" ? "M/M/1" : "M/M/S"} Parameters
              </h2>
              <p className="text-xs text-muted-foreground">
                {type === "mm1" ? "Single server queue" : "Multi-server queue"}
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-4 mb-6 rounded-xl border border-destructive/30 bg-destructive/5">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form ref={fieldsRef} onSubmit={handleSubmit} className="flex flex-col gap-6">
            <NeonInput
              id="lambda"
              label={`Lambda (\u03BB) \u2014 Arrival Rate`}
              value={lambda}
              onChange={setLambda}
              placeholder="e.g. 3"
              color={neonColor}
            />

            <NeonInput
              id="mu"
              label={`Mu (\u03BC) \u2014 Service Rate`}
              value={mu}
              onChange={setMu}
              placeholder="e.g. 5"
              color={neonColor}
            />

            {type === "mms" && (
              <NeonInput
                id="servers"
                label="Number of Servers"
                value={servers}
                onChange={setServers}
                placeholder="e.g. 3"
                color={neonColor}
                isInt
              />
            )}

            <label className="flex items-center gap-3 cursor-pointer select-none py-1">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={priority}
                  onChange={(e) => setPriority(e.target.checked)}
                  className="sr-only peer"
                />
                <div
                  className="w-11 h-6 rounded-full transition-colors border"
                  style={{
                    background: priority ? `${neonColor}30` : "rgba(30, 41, 59, 0.8)",
                    borderColor: priority ? neonColor : "rgba(51, 65, 85, 0.5)",
                    boxShadow: priority ? `0 0 12px ${neonColor}50` : "none",
                  }}
                />
                <div
                  className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all"
                  style={{
                    background: priority ? neonColor : "#475569",
                    transform: priority ? "translateX(20px)" : "translateX(0)",
                    boxShadow: priority ? `0 0 10px ${neonColor}` : "none",
                  }}
                />
              </div>
              <span className="text-sm" style={{ color: "hsl(var(--foreground))" }}>Enable Priority Scheduling</span>
            </label>

            <NeonButton
              isRunning={isRunning}
              color={neonColor}
            />
          </form>
        </div>
      </div>
    </div>
  )
}

// --- M/G Input Page ---
function MGInputPage({
  type,
  error,
  isRunning,
  onBack,
  onSimulate,
}: {
  type: "mg1" | "mgs"
  error: string | null
  isRunning: boolean
  onBack: () => void
  onSimulate: (lambda: number, distParams: MGDistParams, priority: boolean, servers?: number) => void
}) {
  const [lambda, setLambda] = useState("")
  const [distribution, setDistribution] = useState<ServiceDistribution>("normal")
  const [paramA, setParamA] = useState("")
  const [paramB, setParamB] = useState("")
  const [muService, setMuService] = useState("")
  const [sigmaService, setSigmaService] = useState("")
  const [servers, setServers] = useState("")
  const [priority, setPriority] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)
  const fieldsRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
    tl.fromTo(
      formRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5 }
    )
    if (fieldsRef.current) {
      tl.fromTo(
        Array.from(fieldsRef.current.children),
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.08 },
        "-=0.2"
      )
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const lam = parseFloat(lambda)
    if (isNaN(lam)) return

    let distParams: MGDistParams
    if (distribution === "uniform") {
      const a = parseFloat(paramA)
      const b = parseFloat(paramB)
      if (isNaN(a) || isNaN(b)) return
      distParams = { distribution: "uniform", a, b }
    } else {
      const mu = parseFloat(muService)
      const sigma = parseFloat(sigmaService)
      if (isNaN(mu) || isNaN(sigma)) return
      distParams = { distribution: "normal", mu, sigma }
    }

    if (type === "mgs") {
      const s = parseInt(servers)
      if (isNaN(s)) return
      onSimulate(lam, distParams, priority, s)
    } else {
      onSimulate(lam, distParams, priority)
    }
  }

  const neonColor = type === "mg1" ? "#a855f7" : "#fbbf24"

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div ref={formRef} className="w-full max-w-md">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Models
        </button>

        <div
          className="rounded-2xl p-8 relative overflow-hidden"
          style={{
            background: "rgba(8, 12, 20, 0.8)",
            backdropFilter: "blur(20px)",
            border: `1px solid ${neonColor}25`,
            boxShadow: `0 0 30px ${neonColor}08`,
          }}
        >
          {/* Top neon line */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${neonColor}, transparent)`,
              boxShadow: `0 0 10px ${neonColor}60`,
            }}
          />

          <div className="flex items-center gap-3 mb-8">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: `${neonColor}15`, border: `1px solid ${neonColor}40` }}
            >
              <Shuffle className="w-6 h-6" style={{ color: neonColor, filter: `drop-shadow(0 0 4px ${neonColor})` }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "hsl(var(--foreground))" }}>
                {type === "mg1" ? "M/G/1" : "M/G/S"} Parameters
              </h2>
              <p className="text-xs text-muted-foreground">
                {type === "mg1" ? "Single server, general service" : "Multi-server, general service"}
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-4 mb-6 rounded-xl border border-destructive/30 bg-destructive/5">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form ref={fieldsRef} onSubmit={handleSubmit} className="flex flex-col gap-6">
            <NeonInput
              id="mg-lambda"
              label={`Lambda (\u03BB) \u2014 Arrival Rate`}
              value={lambda}
              onChange={setLambda}
              placeholder="e.g. 3"
              color={neonColor}
            />

            {/* Service Time Distribution Radio Buttons */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: "hsl(var(--foreground))" }}>
                Service Time Distribution
              </label>
              <div className="flex gap-3">
                <label
                  className="flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl cursor-pointer transition-all"
                  style={{
                    background: distribution === "normal" ? `${neonColor}15` : "rgba(8, 12, 20, 0.9)",
                    border: `1px solid ${distribution === "normal" ? neonColor : "rgba(51, 65, 85, 0.5)"}`,
                    boxShadow: distribution === "normal" ? `0 0 12px ${neonColor}25` : "none",
                  }}
                >
                  <input
                    type="radio"
                    name="distribution"
                    value="normal"
                    checked={distribution === "normal"}
                    onChange={() => setDistribution("normal")}
                    className="sr-only"
                  />
                  <div
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={{
                      borderColor: distribution === "normal" ? neonColor : "rgba(100, 116, 139, 0.6)",
                      boxShadow: distribution === "normal" ? `0 0 8px ${neonColor}60` : "none",
                    }}
                  >
                    {distribution === "normal" && (
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: neonColor, boxShadow: `0 0 6px ${neonColor}` }}
                      />
                    )}
                  </div>
                  <span className="text-sm font-medium" style={{ color: distribution === "normal" ? neonColor : "rgba(200, 210, 220, 0.7)" }}>
                    Normal
                  </span>
                </label>

                <label
                  className="flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl cursor-pointer transition-all"
                  style={{
                    background: distribution === "uniform" ? `${neonColor}15` : "rgba(8, 12, 20, 0.9)",
                    border: `1px solid ${distribution === "uniform" ? neonColor : "rgba(51, 65, 85, 0.5)"}`,
                    boxShadow: distribution === "uniform" ? `0 0 12px ${neonColor}25` : "none",
                  }}
                >
                  <input
                    type="radio"
                    name="distribution"
                    value="uniform"
                    checked={distribution === "uniform"}
                    onChange={() => setDistribution("uniform")}
                    className="sr-only"
                  />
                  <div
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={{
                      borderColor: distribution === "uniform" ? neonColor : "rgba(100, 116, 139, 0.6)",
                      boxShadow: distribution === "uniform" ? `0 0 8px ${neonColor}60` : "none",
                    }}
                  >
                    {distribution === "uniform" && (
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: neonColor, boxShadow: `0 0 6px ${neonColor}` }}
                      />
                    )}
                  </div>
                  <span className="text-sm font-medium" style={{ color: distribution === "uniform" ? neonColor : "rgba(200, 210, 220, 0.7)" }}>
                    Uniform
                  </span>
                </label>
              </div>
            </div>

            {/* Distribution-specific inputs */}
            {distribution === "uniform" ? (
              <>
                <NeonInput
                  id="mg-a"
                  label="a - Lower Bound"
                  value={paramA}
                  onChange={setParamA}
                  placeholder="e.g. 1"
                  color={neonColor}
                />
                <NeonInput
                  id="mg-b"
                  label="b - Upper Bound"
                  value={paramB}
                  onChange={setParamB}
                  placeholder="e.g. 5"
                  color={neonColor}
                />
              </>
            ) : (
              <>
                <NeonInput
                  id="mg-mu"
                  label={`\u03BC (Mean) \u2014 Service Time Mean`}
                  value={muService}
                  onChange={setMuService}
                  placeholder="e.g. 4"
                  color={neonColor}
                />
                <NeonInput
                  id="mg-sigma"
                  label={`\u03C3s (Std Dev) \u2014 Service Time Std Deviation`}
                  value={sigmaService}
                  onChange={setSigmaService}
                  placeholder="e.g. 1"
                  color={neonColor}
                />
              </>
            )}

            {type === "mgs" && (
              <NeonInput
                id="mg-servers"
                label="Number of Servers"
                value={servers}
                onChange={setServers}
                placeholder="e.g. 3"
                color={neonColor}
                isInt
              />
            )}

            <label className="flex items-center gap-3 cursor-pointer select-none py-1">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={priority}
                  onChange={(e) => setPriority(e.target.checked)}
                  className="sr-only peer"
                />
                <div
                  className="w-11 h-6 rounded-full transition-colors border"
                  style={{
                    background: priority ? `${neonColor}30` : "rgba(30, 41, 59, 0.8)",
                    borderColor: priority ? neonColor : "rgba(51, 65, 85, 0.5)",
                    boxShadow: priority ? `0 0 12px ${neonColor}50` : "none",
                  }}
                />
                <div
                  className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all"
                  style={{
                    background: priority ? neonColor : "#475569",
                    transform: priority ? "translateX(20px)" : "translateX(0)",
                    boxShadow: priority ? `0 0 10px ${neonColor}` : "none",
                  }}
                />
              </div>
              <span className="text-sm" style={{ color: "hsl(var(--foreground))" }}>Enable Priority Scheduling</span>
            </label>

            <NeonButton
              isRunning={isRunning}
              color={neonColor}
            />
          </form>
        </div>
      </div>
    </div>
  )
}

function NeonInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  color,
  isInt,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  color: string
  isInt?: boolean
}) {
  const [focused, setFocused] = useState(false)
  const numValue = parseFloat(value) || 0
  const min = isInt ? 1 : 0.1
  const max = isInt ? 50 : 50
  const step = isInt ? 1 : 0.1
  const percentage = ((numValue - min) / (max - min)) * 100

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value
    if (newValue === "") {
      onChange("")
    } else {
      const num = parseFloat(newValue)
      if (!isNaN(num)) {
        const clamped = Math.max(min, Math.min(max, num))
        onChange(clamped.toString())
      }
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label htmlFor={id} className="block text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
          {label}
        </label>
        <span
          className="text-sm font-semibold px-3 py-1 rounded-lg"
          style={{
            color: color,
            background: `${color}15`,
            border: `1px solid ${color}40`,
            boxShadow: `0 0 8px ${color}30`,
          }}
        >
          {numValue.toFixed(isInt ? 0 : 2)}
        </span>
      </div>

      {/* Slider container */}
      <div className="relative mb-4">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value || min}
          onChange={handleSliderChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer transition-all"
          style={{
            background: `linear-gradient(to right, ${color}60 0%, ${color}60 ${percentage}%, rgba(51, 65, 85, 0.5) ${percentage}%, rgba(51, 65, 85, 0.5) 100%)`,
            WebkitAppearance: "none",
          } as any}
        />
        <style>{`
          #${id}::-webkit-slider-thumb {
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: ${color};
            cursor: pointer;
            box-shadow: 0 0 12px ${color}80, 0 0 20px ${color}40;
            border: 2px solid ${color};
            transition: all 0.3s ease;
          }
          #${id}::-webkit-slider-thumb:hover {
            width: 24px;
            height: 24px;
            box-shadow: 0 0 20px ${color}90, 0 0 30px ${color}60;
          }
          #${id}::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: ${color};
            cursor: pointer;
            box-shadow: 0 0 12px ${color}80, 0 0 20px ${color}40;
            border: 2px solid ${color};
            transition: all 0.3s ease;
          }
          #${id}::-moz-range-thumb:hover {
            width: 24px;
            height: 24px;
            box-shadow: 0 0 20px ${color}90, 0 0 30px ${color}60;
          }
        `}</style>
      </div>

      {/* Optional: Manual input field */}
      <input
        type="number"
        step={isInt ? "1" : "any"}
        min={min}
        max={max}
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="w-full rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none transition-all font-mono text-center"
        style={{
          background: "rgba(30, 41, 59, 0.6)",
          color: "hsl(var(--foreground))",
          border: `1px solid ${focused ? color : "rgba(51, 65, 85, 0.5)"}`,
          boxShadow: focused ? `0 0 12px ${color}30, inset 0 0 12px ${color}08` : "none",
          fontSize: "0.875rem",
        }}
      />
    </div>
  )
}

function NeonButton({ isRunning, color }: { isRunning: boolean; color: string }) {
  const btnRef = useRef<HTMLButtonElement>(null)

  const handleMouseEnter = () => {
    if (!isRunning) {
      gsap.to(btnRef.current, {
        scale: 1.02,
        duration: 0.2,
        ease: "power2.out",
      })
    }
  }

  const handleMouseLeave = () => {
    gsap.to(btnRef.current, {
      scale: 1,
      duration: 0.2,
      ease: "power2.out",
    })
  }

  return (
    <button
      ref={btnRef}
      type="submit"
      disabled={isRunning}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full py-4 rounded-xl font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden"
      style={{
        background: isRunning ? `${color}30` : color,
        color: "#080c14",
        boxShadow: isRunning
          ? "none"
          : `0 0 20px ${color}60, 0 0 50px ${color}25, inset 0 1px 0 rgba(255,255,255,0.15)`,
      }}
    >
      {/* Animated shine overlay */}
      {!isRunning && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 45%, rgba(255,255,255,0.4) 50%, transparent 55%)",
            animation: "shine 3s ease-in-out infinite",
          }}
        />
      )}
      {isRunning ? (
        <>
          <div
            className="w-4 h-4 border-2 rounded-full animate-spin"
            style={{
              borderColor: `${color}40`,
              borderTopColor: color,
            }}
          />
          <span style={{ color }}>Running Simulation...</span>
        </>
      ) : (
        <>
          <Zap className="w-4 h-4" />
          Run Simulation
        </>
      )}
      <style>{`
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </button>
  )
}

// --- Queuing Input Page (matches simulation InputPage pattern exactly) ---
const QUEUING_COLORS: Record<QModelType, string> = {
  MM1: "#00ff88",
  MMS: "#00d4ff",
  MG1: "#a855f7",
  MGS: "#fbbf24",
  GG1: "#ff6b6b",
  GGS: "#ffa726",
}

const QUEUING_DESCRIPTIONS: Record<QModelType, string> = {
  MM1: "Single server, exponential arrivals & service",
  MMS: "Multiple servers, exponential arrivals & service",
  MG1: "Single server, general service distribution",
  MGS: "Multiple servers, general service distribution",
  GG1: "General arrivals & service, single server",
  GGS: "General arrivals & service, multiple servers",
}

function QueuingInputPage({
  model,
  error,
  isRunning,
  onBack,
  onCalculate,
}: {
  model: QModelType
  error: string | null
  isRunning: boolean
  onBack: () => void
  onCalculate: (input: QInput) => void
}) {
  const [lambda, setLambda] = useState("")
  const [mu, setMu] = useState("")
  const [servers, setServers] = useState("")
  const [sigma, setSigma] = useState("")
  const [ca, setCa] = useState("")
  const [cs, setCs] = useState("")
  const formRef = useRef<HTMLDivElement>(null)
  const fieldsRef = useRef<HTMLFormElement>(null)

  const neonColor = QUEUING_COLORS[model]
  const requiredInputs = getRequiredInputs(model)

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
    tl.fromTo(
      formRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5 }
    )
    if (fieldsRef.current) {
      tl.fromTo(
        Array.from(fieldsRef.current.children),
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.08 },
        "-=0.2"
      )
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const lam = parseFloat(lambda)
    const m = parseFloat(mu)
    if (isNaN(lam) || isNaN(m)) return

    const input: QInput = { lambda: lam, mu: m }

    if (requiredInputs.includes("s")) {
      const s = parseInt(servers)
      if (isNaN(s)) return
      input.s = s
    }
    if (requiredInputs.includes("sigma")) {
      const sig = parseFloat(sigma)
      if (isNaN(sig)) return
      input.sigma = sig
    }
    if (requiredInputs.includes("ca")) {
      const caVal = parseFloat(ca)
      if (isNaN(caVal)) return
      input.ca = caVal
    }
    if (requiredInputs.includes("cs")) {
      const csVal = parseFloat(cs)
      if (isNaN(csVal)) return
      input.cs = csVal
    }

    onCalculate(input)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div ref={formRef} className="w-full max-w-md">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Queue Models
        </button>

        <div
          className="rounded-2xl p-8 relative overflow-hidden"
          style={{
            background: "rgba(8, 12, 20, 0.8)",
            backdropFilter: "blur(20px)",
            border: `1px solid ${neonColor}25`,
            boxShadow: `0 0 30px ${neonColor}08`,
          }}
        >
          {/* Top neon line */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${neonColor}, transparent)`,
              boxShadow: `0 0 10px ${neonColor}60`,
            }}
          />

          <div className="flex items-center gap-3 mb-8">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: `${neonColor}15`, border: `1px solid ${neonColor}40` }}
            >
              <BarChart3 className="w-6 h-6" style={{ color: neonColor, filter: `drop-shadow(0 0 4px ${neonColor})` }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "hsl(var(--foreground))" }}>
                {getModelDisplayName(model)} Parameters
              </h2>
              <p className="text-xs text-muted-foreground">
                {QUEUING_DESCRIPTIONS[model]}
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-4 mb-6 rounded-xl border border-destructive/30 bg-destructive/5">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form ref={fieldsRef} onSubmit={handleSubmit} className="flex flex-col gap-6">
            <NeonInput
              id="q-lambda"
              label={`Lambda (\u03BB) \u2014 Arrival Rate`}
              value={lambda}
              onChange={setLambda}
              placeholder="e.g. 3"
              color={neonColor}
            />

            <NeonInput
              id="q-mu"
              label={`Mu (\u03BC) \u2014 Service Rate`}
              value={mu}
              onChange={setMu}
              placeholder="e.g. 5"
              color={neonColor}
            />

            {requiredInputs.includes("s") && (
              <NeonInput
                id="q-servers"
                label="Number of Servers (s)"
                value={servers}
                onChange={setServers}
                placeholder="e.g. 3"
                color={neonColor}
                isInt
              />
            )}

            {requiredInputs.includes("sigma") && (
              <NeonInput
                id="q-sigma"
                label={`Sigma (\u03C3) \u2014 Service Time Std Deviation`}
                value={sigma}
                onChange={setSigma}
                placeholder="e.g. 0.5"
                color={neonColor}
              />
            )}

            {requiredInputs.includes("ca") && (
              <NeonInput
                id="q-ca"
                label="Ca (Coefficient of Arrival Variation)"
                value={ca}
                onChange={setCa}
                placeholder="e.g. 1"
                color={neonColor}
              />
            )}

            {requiredInputs.includes("cs") && (
              <NeonInput
                id="q-cs"
                label="Cs (Coefficient of Service Variation)"
                value={cs}
                onChange={setCs}
                placeholder="e.g. 1"
                color={neonColor}
              />
            )}

            <QueuingCalcButton isRunning={isRunning} color={neonColor} />
          </form>
        </div>
      </div>
    </div>
  )
}

function QueuingCalcButton({ isRunning, color }: { isRunning: boolean; color: string }) {
  const btnRef = useRef<HTMLButtonElement>(null)

  return (
    <button
      ref={btnRef}
      type="submit"
      disabled={isRunning}
      onMouseEnter={() => {
        if (!isRunning) gsap.to(btnRef.current, { scale: 1.02, duration: 0.2, ease: "power2.out" })
      }}
      onMouseLeave={() => {
        gsap.to(btnRef.current, { scale: 1, duration: 0.2, ease: "power2.out" })
      }}
      className="relative w-full py-4 rounded-xl font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden"
      style={{
        background: isRunning ? `${color}30` : color,
        color: "#080c14",
        boxShadow: isRunning
          ? "none"
          : `0 0 20px ${color}60, 0 0 50px ${color}25, inset 0 1px 0 rgba(255,255,255,0.15)`,
      }}
    >
      {!isRunning && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 45%, rgba(255,255,255,0.4) 50%, transparent 55%)",
            animation: "shine 3s ease-in-out infinite",
          }}
        />
      )}
      {isRunning ? (
        <>
          <div
            className="w-4 h-4 border-2 rounded-full animate-spin"
            style={{ borderColor: `${color}40`, borderTopColor: color }}
          />
          <span style={{ color }}>Calculating...</span>
        </>
      ) : (
        <>
          <Zap className="w-4 h-4" />
          Calculate Metrics
        </>
      )}
    </button>
  )
}

// --- Queuing Results Page (matches simulation results pattern) ---
function QueuingResultsPage({
  model,
  results,
  input,
  onBack,
  onBackToModels,
}: {
  model: QModelType
  results: QResults
  input: QInput
  onBack: () => void
  onBackToModels: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  const neonColor = QUEUING_COLORS[model]

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
    tl.fromTo(
      containerRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5 }
    )
    if (cardsRef.current) {
      tl.fromTo(
        Array.from(cardsRef.current.children),
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08 },
        "-=0.2"
      )
    }
  }, [])

  const formatValue = (value: number) => {
    if (!isFinite(value)) return "\u221E"
    if (value < 0.0001 && value !== 0) return value.toExponential(4)
    return value.toFixed(6)
  }

  const metrics = [
    { label: "\u03C1 (Utilization)", value: results.rho, unit: "ratio", description: "Server busy fraction" },
    { label: "L (Avg in System)", value: results.L, unit: "customers", description: "Average number in system" },
    { label: "Lq (Avg in Queue)", value: results.Lq, unit: "customers", description: "Average number waiting" },
    { label: "W (Avg Time in System)", value: results.W, unit: "time units", description: "Average total time" },
    { label: "Wq (Avg Wait in Queue)", value: results.Wq, unit: "time units", description: "Average wait time" },
  ]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div ref={containerRef} className="w-full max-w-2xl">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Input
        </button>

        <div
          className="rounded-2xl p-8 relative overflow-hidden"
          style={{
            background: "rgba(8, 12, 20, 0.8)",
            backdropFilter: "blur(20px)",
            border: `1px solid ${neonColor}25`,
            boxShadow: `0 0 30px ${neonColor}08`,
          }}
        >
          {/* Top neon line */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${neonColor}, transparent)`,
              boxShadow: `0 0 10px ${neonColor}60`,
            }}
          />

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: `${neonColor}15`, border: `1px solid ${neonColor}40` }}
            >
              <BarChart3 className="w-6 h-6" style={{ color: neonColor, filter: `drop-shadow(0 0 4px ${neonColor})` }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "hsl(var(--foreground))" }}>
                {getModelDisplayName(model)} Results
              </h2>
              <p className="text-xs text-muted-foreground">
                Performance Metrics
              </p>
            </div>
          </div>

          {/* Input summary */}
          <div
            className="rounded-xl p-4 mb-6 flex flex-wrap gap-4"
            style={{
              background: `${neonColor}08`,
              border: `1px solid ${neonColor}20`,
            }}
          >
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{'\u03BB (Arrival)'}</span>
              <span className="text-sm font-bold font-mono" style={{ color: neonColor }}>{input.lambda}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{'\u03BC (Service)'}</span>
              <span className="text-sm font-bold font-mono" style={{ color: neonColor }}>{input.mu}</span>
            </div>
            {input.s !== undefined && (
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Servers</span>
                <span className="text-sm font-bold font-mono" style={{ color: neonColor }}>{input.s}</span>
              </div>
            )}
            {input.sigma !== undefined && (
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{'\u03C3 (Std Dev)'}</span>
                <span className="text-sm font-bold font-mono" style={{ color: neonColor }}>{input.sigma}</span>
              </div>
            )}
            {input.ca !== undefined && (
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Ca</span>
                <span className="text-sm font-bold font-mono" style={{ color: neonColor }}>{input.ca}</span>
              </div>
            )}
            {input.cs !== undefined && (
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Cs</span>
                <span className="text-sm font-bold font-mono" style={{ color: neonColor }}>{input.cs}</span>
              </div>
            )}
          </div>

          {/* Stability status */}
          <div
            className="rounded-xl p-4 mb-6 flex items-center gap-3"
            style={{
              background: results.stable ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${results.stable ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
            }}
          >
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{
                background: results.stable ? "#22c55e" : "#ef4444",
                boxShadow: `0 0 10px ${results.stable ? "#22c55e" : "#ef4444"}`,
              }}
            />
            <div>
              <span className="font-bold text-sm" style={{ color: results.stable ? "#22c55e" : "#ef4444" }}>
                {results.stable ? "System Stable" : "System Unstable"}
              </span>
              <span className="text-xs text-muted-foreground ml-2">
                {'\u03C1'} = {formatValue(results.rho)}
              </span>
            </div>
          </div>

          {/* Metrics grid */}
          <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl p-4"
                style={{
                  background: "rgba(15, 23, 42, 0.5)",
                  border: `1px solid ${neonColor}20`,
                }}
              >
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                  {metric.label}
                </div>
                <div className="text-2xl font-bold font-mono" style={{ color: neonColor, textShadow: `0 0 10px ${neonColor}40` }}>
                  {formatValue(metric.value)}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {metric.unit}
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              style={{
                background: `${neonColor}10`,
                color: neonColor,
                border: `1px solid ${neonColor}30`,
              }}
              onMouseEnter={(e) => gsap.to(e.currentTarget, { scale: 1.02, duration: 0.2, ease: "power2.out" })}
              onMouseLeave={(e) => gsap.to(e.currentTarget, { scale: 1, duration: 0.2, ease: "power2.out" })}
            >
              <ArrowLeft className="w-4 h-4" />
              Recalculate
            </button>
            <button
              onClick={onBackToModels}
              className="flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              style={{
                background: neonColor,
                color: "#080c14",
                boxShadow: `0 0 20px ${neonColor}40`,
              }}
              onMouseEnter={(e) => gsap.to(e.currentTarget, { scale: 1.02, duration: 0.2, ease: "power2.out" })}
              onMouseLeave={(e) => gsap.to(e.currentTarget, { scale: 1, duration: 0.2, ease: "power2.out" })}
            >
              Try Another Model
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Queuing History Page (matches Simulation Activity Log pattern) ---
function QueuingHistoryPage({
  entries,
  onBack,
  onSelect,
  onDelete,
  onClearAll,
}: {
  entries: QueuingHistoryEntry[]
  onBack: () => void
  onSelect: (entry: QueuingHistoryEntry) => void
  onDelete: (id: string) => void
  onClearAll: () => void
}) {
  const headerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const emptyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
    tl.fromTo(
      headerRef.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.5 }
    )
    if (entries.length > 0 && listRef.current) {
      tl.fromTo(
        Array.from(listRef.current.children),
        { opacity: 0, y: 30, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.06 },
        "-=0.2"
      )
    }
    if (entries.length === 0 && emptyRef.current) {
      tl.fromTo(
        emptyRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.6 },
        "-=0.2"
      )
    }
  }, [entries.length])

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div ref={headerRef} className="mb-10">
          <button
            onClick={onBack}
            className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Queue Models
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(139, 92, 246, 0.1)",
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
              <div>
                <h1
                  className="text-2xl font-bold"
                  style={{
                    color: "#8b5cf6",
                    textShadow: "0 0 10px rgba(139,92,246,0.4)",
                  }}
                >
                  Queuing Activity Log
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {entries.length} analysis{entries.length !== 1 ? "es" : ""} recorded
                </p>
              </div>
            </div>

            {entries.length > 0 && (
              <button
                onClick={onClearAll}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                style={{
                  background: "rgba(239, 68, 68, 0.08)",
                  color: "#ef4444",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                }}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {entries.length === 0 && (
          <div
            ref={emptyRef}
            className="rounded-2xl p-12 text-center"
            style={{
              background: "rgba(8, 12, 20, 0.7)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(139, 92, 246, 0.12)",
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{
                background: "rgba(139, 92, 246, 0.06)",
                border: "1px solid rgba(139, 92, 246, 0.15)",
              }}
            >
              <BarChart3
                className="w-8 h-8"
                style={{ color: "rgba(139, 92, 246, 0.4)" }}
              />
            </div>
            <p
              className="text-lg font-semibold mb-2"
              style={{ color: "rgba(220, 230, 240, 0.7)" }}
            >
              No analyses yet
            </p>
            <p className="text-sm text-muted-foreground">
              Run a queuing model calculation to see it appear here.
            </p>
          </div>
        )}

        {/* History List */}
        {entries.length > 0 && (
          <div ref={listRef} className="flex flex-col gap-3">
            {entries.map((entry) => {
              const color = QUEUING_COLORS[entry.model]
              const date = new Date(entry.timestamp)

              return (
                <QueueHistoryCard
                  key={entry.id}
                  entry={entry}
                  color={color}
                  date={date}
                  onSelect={() => onSelect(entry)}
                  onDelete={() => onDelete(entry.id)}
                  formatDate={formatDate}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function QueueHistoryCard({
  entry,
  color,
  date,
  onSelect,
  onDelete,
  formatDate,
}: {
  entry: QueuingHistoryEntry
  color: string
  date: Date
  onSelect: () => void
  onDelete: () => void
  formatDate: (d: Date) => string
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => gsap.to(cardRef.current, { scale: 1.015, duration: 0.25, ease: "power2.out" })}
      onMouseLeave={() => gsap.to(cardRef.current, { scale: 1, duration: 0.25, ease: "power2.out" })}
      className="group rounded-xl p-4 cursor-pointer transition-colors relative overflow-hidden"
      style={{
        background: "rgba(8, 12, 20, 0.7)",
        backdropFilter: "blur(16px)",
        border: `1px solid ${color}20`,
        boxShadow: `0 0 15px ${color}06`,
      }}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-40"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        }}
      />

      <div className="flex items-center gap-4">
        {/* Type icon */}
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: `${color}10`,
            border: `1px solid ${color}30`,
          }}
        >
          <BarChart3
            className="w-5 h-5"
            style={{ color, filter: `drop-shadow(0 0 4px ${color})` }}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-base font-bold font-mono"
              style={{
                color,
                textShadow: `0 0 8px ${color}50`,
              }}
            >
              {getModelDisplayName(entry.model)}
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
              style={{
                color: entry.results.stable ? "#22c55e" : "#ef4444",
                background: entry.results.stable ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                border: `1px solid ${entry.results.stable ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
              }}
            >
              {entry.results.stable ? "Stable" : "Unstable"}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-mono">
              <span style={{ color: "#00ff88" }}>{"\u03BB"}</span>
              {"="}
              {entry.input.lambda}
            </span>
            <span className="font-mono">
              <span style={{ color: "#00d4ff" }}>{"\u03BC"}</span>
              {"="}
              {entry.input.mu}
            </span>
            {entry.input.s !== undefined && (
              <span className="font-mono">
                <span style={{ color: "#fbbf24" }}>S</span>
                {"="}
                {entry.input.s}
              </span>
            )}
            {entry.input.sigma !== undefined && (
              <span className="font-mono">
                <span style={{ color: "#a855f7" }}>{"\u03C3"}</span>
                {"="}
                {entry.input.sigma}
              </span>
            )}
            {entry.input.ca !== undefined && (
              <span className="font-mono">
                <span style={{ color: "#ff6b6b" }}>Ca</span>
                {"="}
                {entry.input.ca}
              </span>
            )}
            {entry.input.cs !== undefined && (
              <span className="font-mono">
                <span style={{ color: "#ffa726" }}>Cs</span>
                {"="}
                {entry.input.cs}
              </span>
            )}
            <span className="text-muted-foreground/50">|</span>
            <span>{"\u03C1"}={entry.results.rho.toFixed(4)}</span>
          </div>

          <div className="text-[10px] text-muted-foreground/50 mt-1 font-mono">
            {formatDate(date)}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
            style={{
              color: "rgba(239, 68, 68, 0.7)",
              background: "rgba(239, 68, 68, 0.06)",
            }}
            aria-label="Delete analysis"
          >
            <AlertCircle className="w-3.5 h-3.5" />
          </button>
          <ArrowRight
            className="w-4 h-4 transition-transform group-hover:translate-x-1"
            style={{ color: `${color}60` }}
          />
        </div>
      </div>
    </div>
  )
}
