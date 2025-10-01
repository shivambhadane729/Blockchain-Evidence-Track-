import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Lock } from "lucide-react";

function Corner({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute h-8 w-8 border-2 border-red-500/70 ${className}`} />
  );
}

export default function EvidenceAnimation() {
  const controls = useAnimation();
  const [phase, setPhase] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timersRef = useRef<number[]>([]);
  const runningRef = useRef(false);
  const visibleRef = useRef(false);

  const clearTimers = () => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  };

  const schedule = () => {
    clearTimers();
    setPhase(0);
    const t1 = window.setTimeout(() => setPhase(1), 800);
    const t2 = window.setTimeout(() => setPhase(2), 1500);
    const t3 = window.setTimeout(() => setPhase(3), 2600);
    const t4 = window.setTimeout(() => setPhase(4), 4200);
    const t5 = window.setTimeout(() => {
      if (visibleRef.current) {
        schedule();
      } else {
        runningRef.current = false;
      }
    }, 6000);
    timersRef.current.push(t1, t2, t3, t4, t5);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const inter = !!entries[0]?.isIntersecting;
        visibleRef.current = inter;
        if (inter && !runningRef.current) {
          runningRef.current = true;
          schedule();
        }
        if (!inter) {
          clearTimers();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimers();
      runningRef.current = false;
      visibleRef.current = false;
    };
  }, []);

  const nodes = useMemo(() => {
    return Array.from({ length: 9 }).map((_, i) => {
      const angle = (i / 9) * Math.PI * 2;
      const r = 120 + (i % 3) * 14;
      return {
        x: 200 + Math.cos(angle) * r,
        y: 120 + Math.sin(angle) * r,
        d: 0.6 + ((i * 137) % 10) / 20,
      };
    });
  }, []);

  return (
    <Card className="relative overflow-hidden rounded-2xl border bg-black text-white shadow-xl">
      <div ref={containerRef} className="relative h-[380px] w-full">
        {/* REC and frame */}
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            className="absolute left-4 top-4 flex items-center gap-2 text-xs font-semibold"
            animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity }}
          >
            <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_10px_theme(colors.red.500)]" />
            <span className="text-red-500">REC</span>
          </motion.div>
          <Corner className="left-4 top-4" />
          <Corner className="right-4 top-4" />
          <Corner className="left-4 bottom-4" />
          <Corner className="right-4 bottom-4" />
        </div>

        {/* City silhouette + actors */}
        <svg viewBox="0 0 400 220" className="absolute inset-x-0 bottom-0 mx-auto h-[240px] w-full">
          <defs>
            <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0b1220" />
              <stop offset="100%" stopColor="#000000" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="400" height="220" fill="url(#g1)" />
          {/* buildings */}
          <g fill="#0a0f18">
            <rect x="5" y="80" width="36" height="140" />
            <rect x="50" y="60" width="28" height="160" />
            <rect x="88" y="100" width="40" height="120" />
            <rect x="136" y="70" width="32" height="150" />
            <rect x="176" y="110" width="28" height="110" />
            <rect x="210" y="90" width="34" height="130" />
            <rect x="252" y="60" width="26" height="160" />
            <rect x="284" y="105" width="36" height="115" />
            <rect x="326" y="85" width="28" height="135" />
          </g>
          {/* street */}
          <rect x="0" y="200" width="400" height="20" fill="#03060a" />

          {/* stick figures */}
          <g stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#none)">
            {/* left figure with gun */}
            <motion.g initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.8 }}>
              <circle cx="120" cy="155" r="6" fill="none" />
              <line x1="120" y1="161" x2="120" y2="188" />
              <line x1="120" y1="168" x2="110" y2="180" />
              <line x1="120" y1="168" x2={phase >= 1 ? 145 : 130} y2={phase >= 1 ? 170 : 175} />
              {/* pistol silhouette */}
              <g transform={`translate(${phase >= 1 ? 145 : 130} ${phase >= 1 ? 168 : 173}) rotate(${phase >= 1 ? -10 : -12})`} stroke="none" fill="#0ea5e9">
                <path d="M0 0 h14 v3 h-6 v6 h-3 v-6 h-5 z" opacity="0.9" />
              </g>
              {/* legs */}
              <line x1="120" y1="188" x2="112" y2="204" />
              <line x1="120" y1="188" x2="128" y2="204" />
            </motion.g>

            {/* right figure */}
            <motion.g initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.8 }}>
              <circle cx="250" cy="155" r="6" fill="none" />
              <line x1="250" y1="161" x2="250" y2="188" />
              <line x1="250" y1="168" x2="240" y2="180" />
              <line x1="250" y1="168" x2="262" y2="178" />
              <line x1="250" y1="188" x2="242" y2="204" />
              <line x1="250" y1="188" x2="258" y2="204" />
            </motion.g>

            {/* muzzle flash */}
            {phase >= 2 && (
              <motion.circle
                cx="160"
                cy="166"
                r={6}
                fill="#fde68a"
                stroke="#f59e0b"
                strokeWidth="2"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.6, 0.4, 0], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 0.5 }}
              />
            )}
          </g>
        </svg>

        {/* File to evidence card */}
        <div className="absolute inset-0 flex items-center justify-center">
          {phase >= 2 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: phase >= 3 ? 1.05 : 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="rounded-lg border border-cyan-400/30 bg-white/5 p-4 text-left shadow-[0_0_30px_0_rgba(34,211,238,0.25)] backdrop-blur"
            >
              <div className="text-xs text-cyan-300">VIDEO FILE</div>
              <div className="mt-1 h-4 w-40 rounded bg-cyan-500/20" />
              {phase >= 3 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-3 rounded-md border border-emerald-400/40 bg-emerald-500/10 p-3 shadow-[0_0_25px_rgba(16,185,129,0.25)]"
                >
                  <div className="text-xs text-emerald-300">EVIDENCE CARD</div>
                  <div className="mt-1 text-[10px] text-emerald-200/80">Hash: 91e3a...f52 • Status: Sealed</div>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>

        {/* Network nodes locking */}
        {phase >= 3 && (
          <svg viewBox="0 0 400 240" className="pointer-events-none absolute inset-0 h-full w-full">
            {nodes.map((n, idx) => (
              <g key={idx}>
                <motion.circle
                  cx={n.x}
                  cy={n.y}
                  r={4}
                  fill="#22d3ee"
                  className="drop-shadow-[0_0_8px_rgba(34,211,238,0.9)]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  transition={{ delay: 0.1 * idx }}
                />
                <motion.line
                  x1={200}
                  y1={120}
                  x2={n.x}
                  y2={n.y}
                  stroke="#22d3ee"
                  strokeOpacity={0.25}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, delay: 0.1 * idx }}
                />
              </g>
            ))}
          </svg>
        )}

        {/* Locks closing */}
        {phase >= 3 && (
          <div className="pointer-events-none absolute inset-0">
            {nodes.slice(0, 6).map((n, i) => (
              <motion.div
                key={i}
                className="absolute -translate-x-1/2 -translate-y-1/2 text-emerald-300"
                style={{ left: n.x, top: n.y }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15 * i + 0.4 }}
              >
                <Lock className="h-3.5 w-3.5 drop-shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="border-t border-white/10 bg-black/40 px-4 py-3">
        <div className="mx-auto max-w-3xl">
          <div className="mb-2 text-xs font-medium tracking-wide text-white/70">Chain of Custody</div>
          <div className="grid gap-2 text-xs md:grid-cols-3">
            {[
              { k: "Investigator", c: "text-cyan-300" },
              { k: "Lab", c: "text-emerald-300" },
              { k: "Court", c: "text-white" },
            ].map((s, i) => (
              <motion.div
                key={s.k}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: phase >= 4 ? 1 : 0.3, y: phase >= 4 ? 0 : 6 }}
                transition={{ delay: 0.05 * i + 0.1 }}
                className={`rounded-md border border-white/10 bg-white/5 p-2 ${s.c}`}
              >
                <div className="font-semibold">{s.k}</div>
                <div className="mt-0.5 text-[10px] text-white/70">Secure transfer recorded on-chain</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
