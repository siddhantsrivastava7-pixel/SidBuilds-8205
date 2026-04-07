import { motion } from "framer-motion";
import { useInView } from "./useInView";
import { MeraPolicyCard } from "./MeraPolicyCard";
import { SuperSaverCard } from "./SuperSaverCard";
import { DUR, EASE_OUT, prefersReducedMotion } from "./motion";
import { useRef, useCallback } from "react";

// Cursor-aware surface light for the products slab
function useSlabCursor() {
  const slabRef    = useRef<HTMLDivElement>(null);
  const lightRef   = useRef<HTMLDivElement>(null);
  const isHovering = useRef(false);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!slabRef.current || !lightRef.current) return;
    const rect = slabRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    lightRef.current.style.left    = `${x}px`;
    lightRef.current.style.top     = `${y}px`;
    lightRef.current.style.opacity = "1";
  }, []);

  const onMouseEnter = useCallback(() => {
    isHovering.current = true;
  }, []);

  const onMouseLeave = useCallback(() => {
    isHovering.current = false;
    if (lightRef.current) lightRef.current.style.opacity = "0";
  }, []);

  return { slabRef, lightRef, onMouseMove, onMouseEnter, onMouseLeave };
}

export function Products() {
  const { ref, inView } = useInView({ threshold: 0.08 });
  const reduced = prefersReducedMotion();
  const { slabRef, lightRef, onMouseMove, onMouseEnter, onMouseLeave } = useSlabCursor();

  return (
    <section id="products" style={{ padding: "0 2.5rem", marginTop: 180 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Heading */}
        <motion.div
          ref={ref as React.RefObject<HTMLDivElement>}
          initial={{ opacity: 0, y: reduced ? 0 : 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: DUR.reveal, ease: EASE_OUT }}
          style={{ marginBottom: "4rem" }}
        >
          <h2 style={{
            fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
            fontWeight: 700, color: "#e6eaf0",
            letterSpacing: "-0.035em", margin: 0, lineHeight: 1.15,
          }}>
            What I'm building now.
          </h2>
        </motion.div>

        {/* Showcase slab — with cursor surface light */}
        <div
          ref={slabRef}
          onMouseMove={reduced ? undefined : onMouseMove}
          onMouseEnter={reduced ? undefined : onMouseEnter}
          onMouseLeave={reduced ? undefined : onMouseLeave}
          style={{
            background: "linear-gradient(160deg, rgba(14,19,26,0.95) 0%, rgba(9,13,18,0.98) 100%)",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.04)",
            padding: "1.5rem 3.5rem",
            boxShadow: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 60px 120px rgba(0,0,0,0.5)",
            overflow: "visible",
            position: "relative",
          }}
        >
          {/* Surface cursor light — muted cool tint, soft edges */}
          <div
            ref={lightRef}
            className="cursor-surface"
            style={{
              position: "absolute",
              width: 480,
              height: 480,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(148,180,220,0.028) 0%, rgba(100,140,200,0.01) 40%, transparent 68%)",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              zIndex: 1,
              opacity: 0,
              transition: `opacity ${DUR.std}s ease`,
            }}
          />

          <div style={{ position: "relative", zIndex: 2 }}>
            <MeraPolicyCard />
            <SuperSaverCard />
          </div>
        </div>
      </div>
    </section>
  );
}
