import { motion, useAnimationControls } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { EASE_OUT, EASE_FADE, prefersReducedMotion } from "./motion";

// ─── Count-up hook ────────────────────────────────────────────────────────────
function useCountUp(target: number, duration: number, delay: number, run: boolean) {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (!run) return;
    const timeout = setTimeout(() => {
      const start = performance.now();
      function tick(now: number) {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setValue(Math.round(eased * target));
        if (t < 1) raf.current = requestAnimationFrame(tick);
        else setValue(target);
      }
      raf.current = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(raf.current);
    };
  }, [run, target, duration, delay]);

  return value;
}

// ─── AllocationBar ────────────────────────────────────────────────────────────
interface AllocationBarProps {
  label: string;
  pct: number;
  color: string;
  index: number;
  inView: boolean;
}

const BAR_DURATION   = 900;  // ms — was 1200, tighter
const STAGGER_MS     = 90;   // was 120
const SHIMMER_OFFSET = 140;  // ms after bar finishes

export function AllocationBar({ label, pct, color, index, inView }: AllocationBarProps) {
  const noMotion     = prefersReducedMotion();
  const barDelaySec  = noMotion ? 0 : (index * STAGGER_MS) / 1000;
  const countDelayMs = noMotion ? 0 : index * STAGGER_MS;
  const shimmerMs    = BAR_DURATION + countDelayMs + SHIMMER_OFFSET;

  const count       = useCountUp(pct, BAR_DURATION, countDelayMs, inView);
  const shimmerCtrl = useAnimationControls();
  const hasFired    = useRef(false);

  useEffect(() => {
    if (!inView || hasFired.current || noMotion) return;
    hasFired.current = true;
    const t = setTimeout(() => {
      shimmerCtrl.start({
        x: ["-100%", "200%"],
        transition: {
          duration: 0.38,
          ease: EASE_FADE,
        },
      });
    }, shimmerMs);
    return () => clearTimeout(t);
  }, [inView, shimmerCtrl, shimmerMs, noMotion]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: "0.8rem", color: "#3d4d5c", fontWeight: 400 }}>
          {label}
        </span>
        <span style={{
          fontSize: "0.8rem", color: "#6a7a88", fontWeight: 500,
          fontVariantNumeric: "tabular-nums",
          minWidth: "2.5ch", textAlign: "right",
        }}>
          {count}%
        </span>
      </div>

      {/* Track */}
      <div style={{
        height: 3,
        background: "rgba(255,255,255,0.04)",
        borderRadius: 100,
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Fill */}
        <motion.div
          initial={{ width: noMotion ? `${pct}%` : 0 }}
          animate={inView ? { width: `${pct}%` } : {}}
          transition={{ duration: BAR_DURATION / 1000, delay: barDelaySec, ease: EASE_OUT }}
          style={{
            height: "100%",
            background: color,
            borderRadius: 100,
            opacity: 0.7,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Shimmer — reduced opacity, stays subtle */}
          {!noMotion && (
            <motion.div
              initial={{ x: "-100%" }}
              animate={shimmerCtrl}
              style={{
                position: "absolute",
                top: 0, bottom: 0, left: 0,
                width: "60%",
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
                borderRadius: 100,
              }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
