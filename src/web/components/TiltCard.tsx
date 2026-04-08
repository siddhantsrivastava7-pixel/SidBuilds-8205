import { useMotionValue, useSpring, motion, useTransform } from "framer-motion";
import { useRef, useCallback, ReactNode } from "react";
import { SPRING_TILT, MAX_TILT, DUR, prefersReducedMotion } from "./motion";

interface TiltCardProps {
  children: ReactNode;
  style?: React.CSSProperties;
  className?: string;
  accentColor?: string;
  href?: string;
  external?: boolean;
}

function isTouchDevice() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: none)").matches;
}

export function TiltCard({
  children,
  style,
  className,
  accentColor = "rgba(59,130,246,0.4)",
  href,
  external = false,
}: TiltCardProps) {
  const cardRef       = useRef<HTMLDivElement>(null);
  const highlightRef  = useRef<HTMLDivElement>(null);
  const glowBorderRef = useRef<HTMLDivElement>(null);

  const reduced = prefersReducedMotion();
  const touch   = isTouchDevice();
  const noTilt  = reduced || touch;

  const rawX    = useMotionValue(0);
  const rawY    = useMotionValue(0);
  const rawLift = useMotionValue(0);

  const rotateY    = useSpring(useTransform(rawX,    [-1, 1], [ MAX_TILT, -MAX_TILT]), SPRING_TILT);
  const rotateX    = useSpring(useTransform(rawY,    [-1, 1], [-MAX_TILT,  MAX_TILT]), SPRING_TILT);
  const translateY = useSpring(useTransform(rawLift, [0,  1], [0, -5]),                SPRING_TILT);
  const shadowOp   = useSpring(useTransform(rawLift, [0,  1], [0,  1]),                SPRING_TILT);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (noTilt) return;
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
    const ny = ((e.clientY - rect.top)  / rect.height) * 2 - 1;
    rawX.set(nx);
    rawY.set(ny);
    const h = highlightRef.current;
    if (h) {
      h.style.left    = `${((nx + 1) / 2) * 100}%`;
      h.style.top     = `${((ny + 1) / 2) * 100}%`;
      h.style.opacity = "1";
    }
  }, [noTilt, rawX, rawY]);

  const handleMouseEnter = useCallback(() => {
    if (noTilt) return;
    rawLift.set(1);
    if (glowBorderRef.current) glowBorderRef.current.style.opacity = "1";
  }, [noTilt, rawLift]);

  const handleMouseLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
    rawLift.set(0);
    if (glowBorderRef.current) glowBorderRef.current.style.opacity = "0";
    if (highlightRef.current)  highlightRef.current.style.opacity  = "0";
  }, [rawX, rawY, rawLift]);

  const cardStyle: React.CSSProperties = {
    position: "relative",
    borderRadius: 16,
    transformStyle: noTilt ? "flat" : "preserve-3d",
    cursor: href ? "pointer" : "default",
    willChange: "transform",
    ...style,
  };
  const cardClassName = className;

  const inner = (
    <motion.div
      ref={cardRef}
      className={cardClassName}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        ...cardStyle,
        rotateX:    noTilt ? 0 : rotateX,
        rotateY:    noTilt ? 0 : rotateY,
        translateY: noTilt ? 0 : translateY,
      }}
    >
      {/* Glow border */}
      <div
        ref={glowBorderRef}
        style={{
          position: "absolute",
          inset: -1,
          borderRadius: 17,
          padding: 1,
          background: `linear-gradient(135deg, ${accentColor} 0%, transparent 50%, ${accentColor} 100%)`,
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          opacity: 0,
          transition: `opacity ${DUR.slow}s ease`,
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* Shadow layer */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 16,
          boxShadow: "0 24px 56px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.22)",
          opacity: noTilt ? 0 : shadowOp,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Cursor highlight */}
      {!noTilt && (
        <div
          ref={highlightRef}
          className="cursor-surface"
          style={{
            position: "absolute",
            width: 280,
            height: 280,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 65%)",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: 1,
            opacity: 0,
            transition: `opacity ${DUR.std}s ease`,
          }}
        />
      )}

      {/* Content */}
      <div style={{ position: "relative", zIndex: 3 }}>
        {children}
      </div>
    </motion.div>
  );

  // Wrap in anchor when href provided — preserves all mouse events through the motion.div
  if (href) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        style={{ display: "block", textDecoration: "none", color: "inherit", borderRadius: 16 }}
        // Prevent anchor from swallowing mouse events needed for tilt
        onMouseMove={e => e.stopPropagation()}
      >
        {inner}
      </a>
    );
  }

  return inner;
}
